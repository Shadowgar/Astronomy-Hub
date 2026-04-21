import type {
  SkyTileAssetManifest,
  SkyTileBounds,
  SkyTileCatalog,
  SkyEngineQuery,
  SkyTilePayload,
  SkyTileRepository,
  SkyTileRepositoryLoadResult,
} from '../contracts/tiles'
import type { RuntimeStar } from '../contracts/stars'
import { getSkyTileDescriptor } from '../core/tileIndex'
import { SKY_TILE_LEVEL_MAG_MAX } from '../core/magnitudePolicy'
import { buildHipsTilePath, decodeEphTile, parseSurveyProperties, type SurveyProperties } from './ephCodec'
import { formatHipsViewportKey, resolveGaiaHealpixOrder } from './hipsRenderOrder'
import { healpixAngToPix, healpixPixToRaDec } from './healpix'
import { runtimeStarMatchesHipHealpixLookup } from './hipGetPix'

const DEFAULT_MANIFEST_PATH = '/sky-engine-assets/catalog/hipparcos/manifest.json'
const GAIA_SURVEY_BASE_PATH = '/sky-engine-assets/catalog/gaia'
const GAIA_MIRROR_MANIFEST_PATH = `${GAIA_SURVEY_BASE_PATH}/mirror-manifest.json`
/** Stellarium `hips.c` `hips_render`: `render_order = fmin(render_order, 9); // Hard limit.` */
const STELLARIUM_MAX_RENDER_ORDER = 9
const GAIA_REMOTE_FETCH_CONCURRENCY = 6

const HIPPARCOS_SURVEY_KEY = 'hipparcos'
const GAIA_SURVEY_KEY = 'gaia'

const HIPPARCOS_MIN_MAG = -2
const HIPPARCOS_MAX_MAG = 6.5
const GAIA_FOV_ACTIVATION_DEG = 40

type RuntimeSurveyDefinition = {
  key: string
  catalog: Extract<SkyTileCatalog, 'hipparcos' | 'gaia'>
  minVmag: number
  maxVmag: number
  sourceRecordCount?: number
  loadTile: (tileId: string, query: SkyEngineQuery) => Promise<SkyTilePayload | null>
}

type GaiaSurveyCache = {
  properties: SurveyProperties
  maxOrder: number
  pixelSelectionCache: Map<string, number[]>
  remoteTileCache: Map<string, Promise<readonly RuntimeStar[]>>
  localTileCache: Map<string, Promise<SkyTilePayload | null>>
}

type GaiaMirrorManifest = {
  minOrder: number
  maxOrder: number
  mirroredAt: string
  sourceUrl: string
  totalTileCount: number
  tileCountByOrder: Record<string, number>
}

function createPromiseQueue(maxConcurrent: number) {
  const pending: Array<() => void> = []
  let activeCount = 0

  function complete() {
    activeCount = Math.max(0, activeCount - 1)
    const next = pending.shift()
    next?.()
  }

  function enqueue<T>(task: () => Promise<T>) {
    return new Promise<T>((resolve, reject) => {
      const start = () => {
        activeCount += 1
        void task()
          .then(resolve, reject)
          .finally(complete)
      }

      if (activeCount < maxConcurrent) {
        start()
        return
      }

      pending.push(start)
    })
  }

  return { enqueue }
}

function normalizeManifestDirectory(manifestPath: string) {
  const lastSlashIndex = manifestPath.lastIndexOf('/')

  if (lastSlashIndex <= 0) {
    return ''
  }

  return manifestPath.slice(0, lastSlashIndex)
}

function joinAssetPath(basePath: string, assetPath: string) {
  if (assetPath.startsWith('/')) {
    return assetPath
  }

  let normalizedPath = `${basePath}/${assetPath}`

  while (normalizedPath.includes('//')) {
    normalizedPath = normalizedPath.replace('//', '/')
  }

  return normalizedPath
}

function normalizeRaDeg(raDeg: number) {
  const wrapped = raDeg % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

function isRaWithinBounds(raDeg: number, raMinDeg: number, raMaxDeg: number) {
  const normalizedRa = normalizeRaDeg(raDeg)
  const normalizedMin = normalizeRaDeg(raMinDeg)
  const normalizedMax = normalizeRaDeg(raMaxDeg)

  if (normalizedMin <= normalizedMax) {
    return normalizedRa >= normalizedMin && normalizedRa <= normalizedMax
  }

  return normalizedRa >= normalizedMin || normalizedRa <= normalizedMax
}

function centerRaForBounds(raMinDeg: number, raMaxDeg: number) {
  const normalizedMin = normalizeRaDeg(raMinDeg)
  const normalizedMax = normalizeRaDeg(raMaxDeg)
  const forwardSpan = normalizedMax >= normalizedMin
    ? normalizedMax - normalizedMin
    : (normalizedMax + 360) - normalizedMin
  return normalizeRaDeg(normalizedMin + (forwardSpan * 0.5))
}

function resolveMagnitudeBand(level: number) {
  const [deepestResolvedMax = SKY_TILE_LEVEL_MAG_MAX[0]] = SKY_TILE_LEVEL_MAG_MAX.slice(-1)
  const resolvedMax = SKY_TILE_LEVEL_MAG_MAX[level] ?? deepestResolvedMax

  if (level <= 1) {
    return { magMin: -2, magMax: resolvedMax }
  }

  return { magMin: 0, magMax: resolvedMax }
}

function resolveRootTileId(raDeg: number, decDeg: number) {
  if (decDeg >= 0) {
    return raDeg >= 180 ? 'root-ne' : 'root-nw'
  }

  return raDeg >= 180 ? 'root-se' : 'root-sw'
}

function chooseChildTileId(parentTileId: string, raDeg: number, decDeg: number) {
  const parent = getSkyTileDescriptor(parentTileId)

  if (!parent || parent.childTileIds.length === 0) {
    return null
  }

  const raMidDeg = (parent.bounds.raMinDeg + parent.bounds.raMaxDeg) * 0.5
  const decMidDeg = (parent.bounds.decMinDeg + parent.bounds.decMaxDeg) * 0.5

  if (decDeg >= decMidDeg) {
    return raDeg >= raMidDeg ? `${parentTileId}-ne` : `${parentTileId}-nw`
  }

  return raDeg >= raMidDeg ? `${parentTileId}-se` : `${parentTileId}-sw`
}

async function fetchJson<T>(assetPath: string): Promise<T> {
  const response = await fetch(assetPath)

  if (!response.ok) {
    throw new Error(`Failed to load ${assetPath}: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

async function fetchText(assetPath: string): Promise<string> {
  const response = await fetch(assetPath)

  if (!response.ok) {
    throw new Error(`Failed to load ${assetPath}: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

async function fetchBinary(assetPath: string, options?: { allowNotFound?: boolean }) {
  const response = await fetch(assetPath)

  if (response.status === 404 && options?.allowNotFound) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to load ${assetPath}: ${response.status} ${response.statusText}`)
  }

  return response.arrayBuffer()
}

function buildEmptyTilePayload(tileId: string, manifest: SkyTileAssetManifest): SkyTilePayload | null {
  const descriptor = getSkyTileDescriptor(tileId)

  if (!descriptor) {
    return null
  }

  const magnitudeBand = resolveMagnitudeBand(descriptor.level)

  return {
    tileId: descriptor.tileId,
    level: descriptor.level,
    parentTileId: descriptor.parentTileId,
    childTileIds: [...descriptor.childTileIds],
    bounds: { ...descriptor.bounds },
    magMin: magnitudeBand.magMin,
    magMax: magnitudeBand.magMax,
    starCount: 0,
    stars: [],
    labelCandidates: [],
    provenance: {
      catalog: manifest.catalog,
      sourcePath: manifest.sourcePath,
      generator: manifest.generator,
      generatedAt: manifest.generatedAt,
      sourceRecordCount: manifest.sourceRecordCount,
      tierSet: [],
    },
  }
}

function isStarInsideBounds(star: RuntimeStar, bounds: SkyTileBounds) {
  return (
    isRaWithinBounds(star.raDeg, bounds.raMinDeg, bounds.raMaxDeg) &&
    star.decDeg >= bounds.decMinDeg &&
    star.decDeg <= bounds.decMaxDeg
  )
}

const healpixCenterCache = new Map<number, readonly { pix: number; raDeg: number; decDeg: number }[]>()

function getHealpixPixelCenters(order: number) {
  const cachedCenters = healpixCenterCache.get(order)

  if (cachedCenters) {
    return cachedCenters
  }

  const pixelCount = 12 * (1 << (2 * order))
  const centers = Array.from({ length: pixelCount }, (_, pix) => ({
    pix,
    ...healpixPixToRaDec(order, pix),
  }))
  healpixCenterCache.set(order, centers)
  return centers
}

function selectHealpixPixelsForBounds(tileId: string, bounds: SkyTileBounds, order: number, cache: Map<string, number[]>) {
  const cacheKey = `${tileId}:${order}`
  const cachedPixels = cache.get(cacheKey)

  if (cachedPixels) {
    return cachedPixels
  }

  const selectedPixels = getHealpixPixelCenters(order)
    .filter((pixel) => (
      isRaWithinBounds(pixel.raDeg, bounds.raMinDeg, bounds.raMaxDeg) &&
      pixel.decDeg >= bounds.decMinDeg &&
      pixel.decDeg <= bounds.decMaxDeg
    ))
    .map((pixel) => pixel.pix)

  if (selectedPixels.length === 0) {
    const centerRaDeg = centerRaForBounds(bounds.raMinDeg, bounds.raMaxDeg)
    const centerDecDeg = (bounds.decMinDeg + bounds.decMaxDeg) * 0.5
    selectedPixels.push(healpixAngToPix(order, centerRaDeg, centerDecDeg))
  }

  cache.set(cacheKey, selectedPixels)
  return selectedPixels
}

function compareSurveyByMaxVmag(left: RuntimeSurveyDefinition, right: RuntimeSurveyDefinition) {
  const leftMax = Number.isFinite(left.maxVmag) ? left.maxVmag : Number.POSITIVE_INFINITY
  const rightMax = Number.isFinite(right.maxVmag) ? right.maxVmag : Number.POSITIVE_INFINITY
  return leftMax - rightMax || left.minVmag - right.minVmag || left.key.localeCompare(right.key)
}

function normalizeSurveyOrderingAndGaiaGate(
  surveys: readonly RuntimeSurveyDefinition[],
  options?: { skipGaiaVmagPromotion?: boolean },
) {
  const ordered = surveys
    .slice()
    .sort(compareSurveyByMaxVmag)
  const gaiaSurvey = ordered.find((survey) => survey.catalog === 'gaia')
  if (gaiaSurvey && options?.skipGaiaVmagPromotion !== true) {
    for (const survey of ordered) {
      if (survey.catalog === 'gaia') {
        continue
      }
      if (!Number.isFinite(survey.maxVmag)) {
        continue
      }
      gaiaSurvey.minVmag = Math.max(gaiaSurvey.minVmag, survey.maxVmag)
    }
  }
  return ordered
}

export const __fileTileRepositoryInternals = {
  isRaWithinBounds,
  centerRaForBounds,
  compareSurveyByMaxVmag,
  normalizeSurveyOrderingAndGaiaGate,
}

function filterSurveyStarsByMagnitudeRange(stars: readonly RuntimeStar[], survey: { minVmag: number; maxVmag: number }) {
  return stars.filter((star) => star.mag >= survey.minVmag && star.mag <= survey.maxVmag)
}

function filterSurveyStarsForMerge(
  stars: readonly RuntimeStar[],
  survey: { minVmag: number; maxVmag: number; catalog: SkyTileCatalog },
) {
  const magnitudeFiltered = filterSurveyStarsByMagnitudeRange(stars, survey)
  if (survey.catalog !== 'hipparcos') {
    return magnitudeFiltered
  }

  return magnitudeFiltered.filter(runtimeStarMatchesHipHealpixLookup)
}

function mergeSurveyTiles(
  tileId: string,
  manifest: SkyTileAssetManifest,
  tilePayloads: readonly {
    survey: RuntimeSurveyDefinition
    tile: SkyTilePayload | null
  }[],
): SkyTilePayload | null {
  const descriptor = getSkyTileDescriptor(tileId)

  if (!descriptor) {
    return null
  }

  const stars = tilePayloads.flatMap(({ survey, tile }) => (tile ? filterSurveyStarsForMerge(tile.stars, survey) : []))
  const labelCandidates = tilePayloads
    .flatMap(({ tile }) => tile?.labelCandidates ?? [])
    .reduce<Map<string, { starId: string; label: string; priority: number }>>((candidates, candidate) => {
      const current = candidates.get(candidate.starId)

      if (!current || candidate.priority > current.priority) {
        candidates.set(candidate.starId, candidate)
      }

      return candidates
    }, new Map())
  const magnitudeBand = resolveMagnitudeBand(descriptor.level)
  const magMin = stars.length > 0 ? stars.reduce((minimum, star) => Math.min(minimum, star.mag), Number.POSITIVE_INFINITY) : magnitudeBand.magMin
  const magMax = stars.length > 0 ? stars.reduce((maximum, star) => Math.max(maximum, star.mag), Number.NEGATIVE_INFINITY) : magnitudeBand.magMax
  const sourcePaths = Array.from(new Set(tilePayloads
    .map(({ tile }) => tile?.provenance?.sourcePath)
    .filter((sourcePath): sourcePath is string => Boolean(sourcePath))))
  const sourceKeys = Array.from(new Set(tilePayloads.map(({ survey }) => survey.key)))
  const tierSet = Array.from(new Set(stars.map((star) => star.tier)))
  const surveyCatalogs = Array.from(new Set(tilePayloads.map(({ survey }) => survey.catalog)))
  const sourceRecordCount = tilePayloads.reduce((count, payload) => count + (payload.survey.sourceRecordCount ?? 0), 0)

  return {
    tileId: descriptor.tileId,
    level: descriptor.level,
    parentTileId: descriptor.parentTileId,
    childTileIds: [...descriptor.childTileIds],
    bounds: { ...descriptor.bounds },
    magMin,
    magMax,
    starCount: stars.length,
    stars,
    labelCandidates: Array.from(labelCandidates.values()),
    provenance: {
      catalog: surveyCatalogs.length > 1 ? 'multi-survey' : (surveyCatalogs[0] ?? manifest.catalog),
      sourcePath: sourcePaths.join(' + '),
      sourceKey: sourceKeys.length === 1 ? sourceKeys[0] : undefined,
      sourceKeys,
      generator: manifest.generator,
      generatedAt: manifest.generatedAt,
      sourceRecordCount: sourceRecordCount > 0 ? sourceRecordCount : undefined,
      tierSet: tierSet.length > 0 ? tierSet : undefined,
    },
  }
}

function resolveActiveSurveys(surveys: readonly RuntimeSurveyDefinition[], limitingMagnitude: number) {
  return surveys
    .filter((survey) => survey.minVmag <= limitingMagnitude)
}

function buildSourceLabel(activeSurveys: readonly RuntimeSurveyDefinition[], manifest: SkyTileAssetManifest) {
  if (activeSurveys.some((survey) => survey.catalog === 'gaia')) {
    return 'Hipparcos + Gaia HiPS'
  }

  const sourceRecordCount = activeSurveys.reduce((count, survey) => count + (survey.sourceRecordCount ?? 0), 0)

  if (activeSurveys.length > 1) {
    return `Hipparcos multi-survey · ${sourceRecordCount.toLocaleString()} stars`
  }

  return `Hipparcos · ${manifest.sourceRecordCount.toLocaleString()} stars`
}

export function createFileBackedSkyTileRepository(manifestPath = DEFAULT_MANIFEST_PATH): SkyTileRepository {
  const manifestDirectory = normalizeManifestDirectory(manifestPath)
  let manifestPromise: Promise<SkyTileAssetManifest> | null = null
  const tileCache = new Map<string, Promise<SkyTilePayload | null>>()
  let gaiaSurveyPromise: Promise<GaiaSurveyCache> | null = null
  const gaiaRemoteFetchQueue = createPromiseQueue(GAIA_REMOTE_FETCH_CONCURRENCY)

  function loadManifest() {
    manifestPromise ??= fetchJson<SkyTileAssetManifest>(manifestPath)
    return manifestPromise
  }

  function loadTile(tileId: string, manifest: SkyTileAssetManifest) {
    const cachedTile = tileCache.get(tileId)

    if (cachedTile != null) {
      return cachedTile
    }

    const tileEntry = manifest.tiles[tileId]

    if (!tileEntry) {
      const emptyTile = Promise.resolve(buildEmptyTilePayload(tileId, manifest))
      tileCache.set(tileId, emptyTile)
      return emptyTile
    }

    const tilePromise = fetchJson<SkyTilePayload>(joinAssetPath(manifestDirectory, tileEntry.path))
      .catch((error) => {
        tileCache.delete(tileId)
        throw new Error(`Failed to load tile ${tileId}: ${error instanceof Error ? error.message : String(error)}`)
      })

    tileCache.set(tileId, tilePromise)
    return tilePromise
  }

  function loadGaiaSurvey() {
    gaiaSurveyPromise ??= Promise.all([
      fetchText(`${GAIA_SURVEY_BASE_PATH}/properties`).then(parseSurveyProperties),
      fetchJson<GaiaMirrorManifest>(GAIA_MIRROR_MANIFEST_PATH),
    ])
      .then(([properties, mirrorManifest]) => {
        if (!properties.tileFormat.includes('eph')) {
          throw new Error(`Unsupported Gaia tile format: ${properties.tileFormat}`)
        }

        if (!Number.isFinite(mirrorManifest.maxOrder) || mirrorManifest.maxOrder < properties.minOrder) {
          throw new Error('Gaia mirror manifest is invalid or incomplete')
        }

        return {
          properties,
          maxOrder: Math.min(STELLARIUM_MAX_RENDER_ORDER, mirrorManifest.maxOrder),
          pixelSelectionCache: new Map<string, number[]>(),
          remoteTileCache: new Map<string, Promise<readonly RuntimeStar[]>>(),
          localTileCache: new Map<string, Promise<SkyTilePayload | null>>(),
        }
      })
    return gaiaSurveyPromise
  }

  async function loadGaiaRemoteTile(gaiaSurvey: GaiaSurveyCache, order: number, pix: number, minVmag: number) {
    const cacheKey = `${order}:${pix}:${minVmag.toFixed(1)}`
    const cachedTile = gaiaSurvey.remoteTileCache.get(cacheKey)

    if (cachedTile) {
      return cachedTile
    }

    const tilePromise = gaiaRemoteFetchQueue.enqueue(() => fetchBinary(
      buildHipsTilePath(GAIA_SURVEY_BASE_PATH, order, pix, 'eph'),
      { allowNotFound: true },
    ))
      .then(async (buffer) => {
        if (buffer == null) {
          return [] as const
        }

        const decodedTile = await decodeEphTile(buffer, {
          catalog: 'gaia',
          minVmag,
        })

        return decodedTile.stars
      })
      .catch((error) => {
        gaiaSurvey.remoteTileCache.delete(cacheKey)
        throw error
      })
    gaiaSurvey.remoteTileCache.set(cacheKey, tilePromise)
    return tilePromise
  }

  async function loadGaiaTile(tileId: string, query: SkyEngineQuery, minVmag: number) {
    const gaiaSurvey = await loadGaiaSurvey()
    const cacheKey = `${tileId}:${query.maxTileLevel ?? 'default'}:${minVmag.toFixed(1)}:${formatHipsViewportKey(query.hipsViewport)}`
    const cachedTile = gaiaSurvey.localTileCache.get(cacheKey)

    if (cachedTile) {
      return cachedTile
    }

    const tilePromise = (async () => {
      const descriptor = getSkyTileDescriptor(tileId)

      if (!descriptor) {
        return null
      }

      const order = resolveGaiaHealpixOrder({
        tileLevel: descriptor.level,
        minOrder: gaiaSurvey.properties.minOrder,
        maxOrder: gaiaSurvey.maxOrder,
        viewport: query.hipsViewport,
      })
      const selectedPixels = selectHealpixPixelsForBounds(tileId, descriptor.bounds, order, gaiaSurvey.pixelSelectionCache)
      const remoteStars = await Promise.all(selectedPixels.map((pix) => loadGaiaRemoteTile(gaiaSurvey, order, pix, minVmag)))
      const stars = remoteStars
        .flat()
        .filter((star) => isStarInsideBounds(star, descriptor.bounds))
      const magnitudeBand = resolveMagnitudeBand(descriptor.level)
      const magMin = stars.length > 0 ? stars.reduce((minimum, star) => Math.min(minimum, star.mag), Number.POSITIVE_INFINITY) : magnitudeBand.magMin
      const magMax = stars.length > 0 ? stars.reduce((maximum, star) => Math.max(maximum, star.mag), Number.NEGATIVE_INFINITY) : magnitudeBand.magMax

      return {
        tileId: descriptor.tileId,
        level: descriptor.level,
        parentTileId: descriptor.parentTileId,
        childTileIds: [...descriptor.childTileIds],
        bounds: { ...descriptor.bounds },
        magMin,
        magMax,
        starCount: stars.length,
        stars,
        labelCandidates: [],
        provenance: {
          catalog: 'gaia',
          sourcePath: GAIA_SURVEY_BASE_PATH,
          generatedAt: gaiaSurvey.properties.releaseDate,
          tierSet: Array.from(new Set(stars.map((star) => star.tier))),
        },
      } satisfies SkyTilePayload
    })().catch((error) => {
      gaiaSurvey.localTileCache.delete(cacheKey)
      throw error
    })

    gaiaSurvey.localTileCache.set(cacheKey, tilePromise)
    return tilePromise
  }

  return {
    async loadTiles(query: SkyEngineQuery): Promise<SkyTileRepositoryLoadResult> {
      const manifest = await loadManifest()
      const surveys: RuntimeSurveyDefinition[] = [{
        key: HIPPARCOS_SURVEY_KEY,
        catalog: 'hipparcos',
        minVmag: HIPPARCOS_MIN_MAG,
        maxVmag: HIPPARCOS_MAX_MAG,
        sourceRecordCount: manifest.sourceRecordCount,
        loadTile: (tileId) => loadTile(tileId, manifest),
      }]

      let sourceError: string | null = null
      const gaiaMinVmag = surveys.reduce((minimumMagnitude, survey) => (
        survey.catalog === 'gaia' || !Number.isFinite(survey.maxVmag)
          ? minimumMagnitude
          : Math.max(minimumMagnitude, survey.maxVmag)
      ), HIPPARCOS_MIN_MAG)

      const shouldActivateGaiaSurvey = query.limitingMagnitude >= gaiaMinVmag || query.observer.fovDeg <= GAIA_FOV_ACTIVATION_DEG
      if (shouldActivateGaiaSurvey) {
        try {
          const gaiaSurvey = await loadGaiaSurvey()
          const gaiaEntryMinVmag = query.observer.fovDeg <= GAIA_FOV_ACTIVATION_DEG
            ? HIPPARCOS_MIN_MAG
            : Math.max(gaiaSurvey.properties.minVmag, gaiaMinVmag)

          surveys.push({
            key: GAIA_SURVEY_KEY,
            catalog: 'gaia',
            minVmag: gaiaEntryMinVmag,
            maxVmag: gaiaSurvey.properties.maxVmag,
            loadTile: (tileId, activeQuery) => loadGaiaTile(tileId, activeQuery, gaiaEntryMinVmag),
          })
        } catch (error) {
          sourceError = `Gaia mirror unavailable: ${error instanceof Error ? error.message : String(error)}. Run npm run mirror:gaia in frontend to seed local survey assets.`
        }
      }

      const normalizedSurveys = normalizeSurveyOrderingAndGaiaGate(surveys, {
        skipGaiaVmagPromotion: query.observer.fovDeg <= GAIA_FOV_ACTIVATION_DEG,
      })
      const activeSurveys = resolveActiveSurveys(normalizedSurveys, query.limitingMagnitude)
      const tiles = (await Promise.all(query.visibleTileIds.map(async (tileId) => {
        const tilePayloads = await Promise.all(activeSurveys.map(async (survey) => ({
          survey,
          tile: await survey.loadTile(tileId, query),
        })))

        return mergeSurveyTiles(tileId, manifest, tilePayloads)
      }))).filter((tile): tile is SkyTilePayload => tile != null)

      return {
        mode: activeSurveys.some((survey) => survey.catalog === 'gaia') ? 'multi-survey' : 'hipparcos',
        sourceLabel: buildSourceLabel(activeSurveys, manifest),
        sourceError,
        manifest,
        tiles,
      }
    },
  }
}

export const fileBackedSkyTileRepository = createFileBackedSkyTileRepository()
