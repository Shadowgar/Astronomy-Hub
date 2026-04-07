import type {
  BackendSkySceneStarObject,
  BackendSkyStarTileDescriptor,
  BackendSkyStarTileManifestPayload,
} from '../scene/contracts'

const TIER1_BRIGHT_STAR_LOOKUP_KEY = 'sky:tier1:tier1-bright-stars'
const TIER2_MID_STAR_LOOKUP_KEY = 'sky:tier2:mid-stars'
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

function resolveBackendStarsForLookupKey(
  lookupKey: string,
  sceneStars: readonly BackendSkySceneStarObject[],
): readonly BackendSkySceneStarObject[] {
  if (lookupKey === TIER1_BRIGHT_STAR_LOOKUP_KEY) {
    return sceneStars.filter((star) => !star.id.startsWith('hip-'))
  }

  if (lookupKey === TIER2_MID_STAR_LOOKUP_KEY) {
    return sceneStars.filter((star) => star.id.startsWith('hip-'))
  }

  return []
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
    const resolvedStars = resolveBackendStarsForLookupKey(tile.lookup_key, sceneStars)

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