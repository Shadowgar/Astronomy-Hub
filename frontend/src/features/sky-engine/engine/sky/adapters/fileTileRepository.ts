import type {
  SkyTileAssetManifest,
  SkyEngineQuery,
  SkyTilePayload,
  SkyTileRepository,
  SkyTileRepositoryLoadResult,
} from '../contracts/tiles'
import { getSkyTileDescriptor } from '../core/tileIndex'

const DEFAULT_MANIFEST_PATH = '/sky-engine-assets/catalog/hipparcos/manifest.json'

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

export function createFileBackedSkyTileRepository(manifestPath = DEFAULT_MANIFEST_PATH): SkyTileRepository {
  const manifestDirectory = normalizeManifestDirectory(manifestPath)
  let manifestPromise: Promise<SkyTileAssetManifest> | null = null
  const tileCache = new Map<string, Promise<SkyTilePayload | null>>()

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

  return {
    async loadTiles(query: SkyEngineQuery): Promise<SkyTileRepositoryLoadResult> {
      const manifest = await loadManifest()
      const tiles = (await Promise.all(query.visibleTileIds.map((tileId) => loadTile(tileId, manifest))))
        .filter((tile): tile is SkyTilePayload => tile != null)

      return {
        mode: 'hipparcos',
        sourceLabel: `Hipparcos · ${manifest.sourceRecordCount.toLocaleString()} stars`,
        sourceError: null,
        manifest,
        tiles,
      }
    },
  }
}

export const fileBackedSkyTileRepository = createFileBackedSkyTileRepository()