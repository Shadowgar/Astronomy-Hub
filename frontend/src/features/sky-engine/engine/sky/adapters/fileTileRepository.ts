import type {
  SkyTileAssetManifest,
  SkyEngineQuery,
  SkyTilePayload,
  SkyTileRepository,
  SkyTileRepositoryLoadResult,
} from '../contracts/tiles'
import type { RuntimeStar } from '../contracts/stars'
import { getSkyTileDescriptor } from '../core/tileIndex'

const DEFAULT_MANIFEST_PATH = '/sky-engine-assets/catalog/hipparcos/manifest.json'
const SUPPLEMENTAL_SURVEY_PATH = '/sky-engine-assets/catalog/hipparcos/hipparcos_tier2_subset.json'
const SUPPLEMENTAL_SURVEY_KEY = 'hipparcos-tier2-subset'
const HIPPARCOS_SURVEY_KEY = 'hipparcos'
const HIPPARCOS_MIN_MAG = -2
const HIPPARCOS_MAX_MAG = 6.5
const SUPPLEMENTAL_MIN_MAG = 6.0
const SUPPLEMENTAL_MAX_MAG = 8.5

type RuntimeSurveyDefinition = {
  key: string
  minVmag: number
  maxVmag: number
  sourceRecordCount: number
  loadTile: (tileId: string) => Promise<SkyTilePayload | null>
}

type SupplementalRawStar = {
  id?: string
  name?: string
  right_ascension?: number
  declination?: number
  magnitude?: number
  color_index?: number
}

type SupplementalSurveyCache = {
  sourceRecordCount: number
  starsByTileId: Map<string, RuntimeStar[]>
  tileCache: Map<string, SkyTilePayload | null>
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

function resolveMagnitudeBand(level: number) {
  if (level === 0) {
    return { magMin: -2, magMax: 4.5 }
  }

  if (level === 1) {
    return { magMin: -2, magMax: 6.8 }
  }

  if (level === 2) {
    return { magMin: 0, magMax: 10.5 }
  }

  return { magMin: 0, magMax: 13.5 }
}

function resolveSurveyTier(magnitude: number): RuntimeStar['tier'] {
  if (magnitude <= 2.5) {
    return 'T0'
  }

  if (magnitude <= 6.5) {
    return 'T1'
  }

  if (magnitude <= 10.5) {
    return 'T2'
  }

  return 'T3'
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

function normalizeSupplementalStar(rawStar: SupplementalRawStar): RuntimeStar | null {
  const id = rawStar.id
  const rightAscensionHours = Number(rawStar.right_ascension)
  const declinationDeg = Number(rawStar.declination)
  const magnitude = Number(rawStar.magnitude)

  if (
    !id ||
    !Number.isFinite(rightAscensionHours) ||
    !Number.isFinite(declinationDeg) ||
    !Number.isFinite(magnitude)
  ) {
    return null
  }

  const normalizedId = String(id).trim()
  const hipNumber = normalizedId.startsWith('hip-') ? normalizedId.slice(4) : normalizedId
  const normalizedName = rawStar.name?.trim()
  const properName = normalizedName && !/^HIP\s+\d+$/i.test(normalizedName) ? normalizedName : undefined

  return {
    id: normalizedId,
    sourceId: `HIP ${hipNumber}`,
    raDeg: rightAscensionHours * 15,
    decDeg: declinationDeg,
    mag: magnitude,
    colorIndex: Number.isFinite(Number(rawStar.color_index)) ? Number(rawStar.color_index) : undefined,
    tier: resolveSurveyTier(magnitude),
    properName,
  }
}

function buildSupplementalTileIndex(stars: readonly RuntimeStar[]) {
  const starsByTileId = new Map<string, RuntimeStar[]>()

  stars.forEach((star) => {
    let tileId: string | null = resolveRootTileId(star.raDeg, star.decDeg)

    while (tileId) {
      const tileStars = starsByTileId.get(tileId)

      if (tileStars) {
        tileStars.push(star)
      } else {
        starsByTileId.set(tileId, [star])
      }

      tileId = chooseChildTileId(tileId, star.raDeg, star.decDeg)
    }
  })

  return starsByTileId
}

function buildSupplementalTilePayload(
  tileId: string,
  starsByTileId: ReadonlyMap<string, readonly RuntimeStar[]>,
): SkyTilePayload | null {
  const descriptor = getSkyTileDescriptor(tileId)

  if (!descriptor) {
    return null
  }

  const stars = [...(starsByTileId.get(tileId) ?? [])]
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
      catalog: 'hipparcos',
      sourcePath: SUPPLEMENTAL_SURVEY_PATH,
      generator: 'frontend/src/features/sky-engine/engine/sky/adapters/fileTileRepository.ts',
      tierSet: ['T1', 'T2'],
    },
  }
}

function filterSurveyStarsByMagnitudeRange(stars: readonly RuntimeStar[], survey: { minVmag: number; maxVmag: number }) {
  return stars.filter((star) => star.mag >= survey.minVmag && star.mag <= survey.maxVmag)
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

  const stars = tilePayloads
    .flatMap(({ survey, tile }) => (tile ? filterSurveyStarsByMagnitudeRange(tile.stars, survey) : []))
  const starCount = stars.length
  const labelCandidates = tilePayloads
    .flatMap(({ tile }) => tile?.labelCandidates ?? [])
    .reduce<Map<string, { starId: string; label: string; priority: number }>>((candidates, candidate) => {
      const current = candidates.get(candidate.starId)

      if (!current || candidate.priority > current.priority) {
        candidates.set(candidate.starId, {
          starId: candidate.starId,
          label: candidate.label,
          priority: candidate.priority,
        })
      }

      return candidates
    }, new Map())
  const magnitudeBand = resolveMagnitudeBand(descriptor.level)
  const magMin = starCount > 0 ? stars.reduce((minimum, star) => Math.min(minimum, star.mag), Number.POSITIVE_INFINITY) : magnitudeBand.magMin
  const magMax = starCount > 0 ? stars.reduce((maximum, star) => Math.max(maximum, star.mag), Number.NEGATIVE_INFINITY) : magnitudeBand.magMax
  const tierSet = Array.from(new Set(stars.map((star) => star.tier)))
  const sourcePaths = Array.from(new Set(tilePayloads
    .map(({ tile }) => tile?.provenance?.sourcePath)
    .filter((sourcePath): sourcePath is string => Boolean(sourcePath))))

  return {
    tileId: descriptor.tileId,
    level: descriptor.level,
    parentTileId: descriptor.parentTileId,
    childTileIds: [...descriptor.childTileIds],
    bounds: { ...descriptor.bounds },
    magMin,
    magMax,
    starCount,
    stars,
    labelCandidates: Array.from(labelCandidates.values()),
    provenance: {
      catalog: manifest.catalog,
      sourcePath: sourcePaths.join(' + '),
      generator: manifest.generator,
      generatedAt: manifest.generatedAt,
      sourceRecordCount: tilePayloads.reduce((count, payload) => count + payload.survey.sourceRecordCount, 0),
      tierSet: tierSet.length > 0 ? tierSet : undefined,
    },
  }
}

function resolveActiveSurveys(surveys: readonly RuntimeSurveyDefinition[], limitingMagnitude: number) {
  return surveys.filter((survey) => survey.minVmag <= limitingMagnitude)
}

export function createFileBackedSkyTileRepository(manifestPath = DEFAULT_MANIFEST_PATH): SkyTileRepository {
  const manifestDirectory = normalizeManifestDirectory(manifestPath)
  let manifestPromise: Promise<SkyTileAssetManifest> | null = null
  const tileCache = new Map<string, Promise<SkyTilePayload | null>>()
  let supplementalSurveyPromise: Promise<SupplementalSurveyCache> | null = null

  function loadManifest() {
    if (!manifestPromise) {
      manifestPromise = fetchJson<SkyTileAssetManifest>(manifestPath)
    }

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
        throw new Error(`Failed to load tile ${tileId}: ${error instanceof Error ? error.message : String(error)}`)
      })

    tileCache.set(tileId, tilePromise)
    return tilePromise
  }

  function loadSupplementalSurvey() {
    if (!supplementalSurveyPromise) {
      supplementalSurveyPromise = fetchJson<SupplementalRawStar[]>(SUPPLEMENTAL_SURVEY_PATH)
        .then((rawStars) => rawStars.map(normalizeSupplementalStar).filter((star): star is RuntimeStar => star != null))
        .then((stars) => ({
          sourceRecordCount: stars.length,
          starsByTileId: buildSupplementalTileIndex(stars),
          tileCache: new Map<string, SkyTilePayload | null>(),
        }))
    }

    return supplementalSurveyPromise
  }

  async function loadSupplementalTile(tileId: string) {
    const supplementalSurvey = await loadSupplementalSurvey()
    const cachedTile = supplementalSurvey.tileCache.get(tileId)

    if (cachedTile !== undefined) {
      return cachedTile
    }

    const tilePayload = buildSupplementalTilePayload(tileId, supplementalSurvey.starsByTileId)
    supplementalSurvey.tileCache.set(tileId, tilePayload)
    return tilePayload
  }

  return {
    async loadTiles(query: SkyEngineQuery): Promise<SkyTileRepositoryLoadResult> {
      const manifest = await loadManifest()
      const surveys: RuntimeSurveyDefinition[] = [{
        key: HIPPARCOS_SURVEY_KEY,
        minVmag: HIPPARCOS_MIN_MAG,
        maxVmag: HIPPARCOS_MAX_MAG,
        sourceRecordCount: manifest.sourceRecordCount,
        loadTile: (tileId) => loadTile(tileId, manifest),
      }]

      if (query.limitingMagnitude >= SUPPLEMENTAL_MIN_MAG) {
        const supplementalSurvey = await loadSupplementalSurvey()

        surveys.push({
          key: SUPPLEMENTAL_SURVEY_KEY,
          minVmag: SUPPLEMENTAL_MIN_MAG,
          maxVmag: SUPPLEMENTAL_MAX_MAG,
          sourceRecordCount: supplementalSurvey.sourceRecordCount,
          loadTile: (tileId) => loadSupplementalTile(tileId),
        })
      }

      const activeSurveys = resolveActiveSurveys(surveys, query.limitingMagnitude)
      const tiles = (await Promise.all(query.visibleTileIds.map(async (tileId) => {
        const tilePayloads = await Promise.all(activeSurveys.map(async (survey) => ({
          survey,
          tile: await survey.loadTile(tileId),
        })))

        return mergeSurveyTiles(tileId, manifest, tilePayloads)
      }))).filter((tile): tile is SkyTilePayload => tile != null)
      const sourceRecordCount = activeSurveys.reduce((count, survey) => count + survey.sourceRecordCount, 0)
      const sourceLabel = activeSurveys.length > 1
        ? `Hipparcos multi-survey · ${sourceRecordCount.toLocaleString()} stars`
        : `Hipparcos · ${manifest.sourceRecordCount.toLocaleString()} stars`

      return {
        mode: 'hipparcos',
        sourceLabel,
        sourceError: null,
        manifest,
        tiles,
      }
    },
  }
}

export const fileBackedSkyTileRepository = createFileBackedSkyTileRepository()
