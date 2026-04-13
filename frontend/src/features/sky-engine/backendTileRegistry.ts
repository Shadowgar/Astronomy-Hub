import type {
  BackendSkySceneStarObject,
  BackendSkyStarTileDescriptor,
  BackendSkyStarTileManifestPayload,
} from '../scene/contracts'

const MAX_RESOLVED_BACKEND_STARS = 100000

export type SkyBackendTileManifestState = {
  tier: number | null
  tiles: readonly BackendSkyStarTileDescriptor[]
  metadata: {
    generatedAt: string | null
    manifestVersion: string | null
    degraded: boolean
    missingSources: readonly string[]
  }
}

export type ResolvedSkyBackendTile = BackendSkyStarTileDescriptor & {
  resolvedStars: readonly BackendSkySceneStarObject[]
  resolvedObjectCount: number
}

export type SkyBackendTileRegistry = {
  tier: number | null
  tiles: readonly ResolvedSkyBackendTile[]
  tilesByLookupKey: ReadonlyMap<string, readonly BackendSkySceneStarObject[]>
  totalResolvedStars: number
}

const EMPTY_TILE_MANIFEST_STATE: SkyBackendTileManifestState = {
  tier: null,
  tiles: [],
  metadata: {
    generatedAt: null,
    manifestVersion: null,
    degraded: false,
    missingSources: [],
  },
}

function resolveBackendStarsForTile(
  tile: BackendSkyStarTileDescriptor,
  sceneStars: readonly BackendSkySceneStarObject[],
): readonly BackendSkySceneStarObject[] {
  const epsilon = 1e-6
  const resolvedStars = sceneStars
    .filter((star) => star.magnitude >= tile.magnitude_min - epsilon)
    .filter((star) => star.magnitude <= tile.magnitude_max + epsilon)
    .sort((left, right) => {
      if (left.magnitude !== right.magnitude) {
        return left.magnitude - right.magnitude
      }

      return left.id.localeCompare(right.id)
    })

  return resolvedStars.slice(0, tile.object_count)
}

export function createSkyBackendTileManifestState(
  manifest: BackendSkyStarTileManifestPayload | null,
): SkyBackendTileManifestState {
  if (!manifest) {
    return EMPTY_TILE_MANIFEST_STATE
  }

  return {
    tier: manifest.tiles[0]?.tier ?? null,
    tiles: manifest.tiles,
    metadata: {
      generatedAt: manifest.generated_at,
      manifestVersion: manifest.manifest_version,
      degraded: manifest.degraded,
      missingSources: manifest.missing_sources,
    },
  }
}

export function resolveSkyBackendTileRegistry(
  manifestState: SkyBackendTileManifestState,
  sceneStars: readonly BackendSkySceneStarObject[],
): SkyBackendTileRegistry {
  const tiles = manifestState.tiles.map((tile) => {
    const resolvedStars = resolveBackendStarsForTile(tile, sceneStars)

    return {
      ...tile,
      resolvedStars,
      resolvedObjectCount: resolvedStars.length,
    }
  })

  const tilesByLookupKey = new Map<string, readonly BackendSkySceneStarObject[]>()
  let totalResolvedStars = 0

  tiles.forEach((tile) => {
    tilesByLookupKey.set(tile.lookup_key, tile.resolvedStars)
    totalResolvedStars += tile.resolvedObjectCount
  })

  return {
    tier: manifestState.tier,
    tiles,
    tilesByLookupKey,
    totalResolvedStars,
  }
}

export function flattenResolvedSkyBackendTileRegistry(
  registry: SkyBackendTileRegistry,
): readonly BackendSkySceneStarObject[] {
  const dedupedStars = new Map<string, BackendSkySceneStarObject>()

  registry.tiles.forEach((tile) => {
    tile.resolvedStars.forEach((star) => {
      if (!dedupedStars.has(star.id)) {
        dedupedStars.set(star.id, star)
      }
    })
  })

  return Array.from(dedupedStars.values())
    .sort((left, right) => {
      if (left.magnitude !== right.magnitude) {
        return left.magnitude - right.magnitude
      }

      return left.id.localeCompare(right.id)
    })
    .slice(0, MAX_RESOLVED_BACKEND_STARS)
}