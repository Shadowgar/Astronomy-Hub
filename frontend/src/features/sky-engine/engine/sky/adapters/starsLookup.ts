import type { RuntimeStar } from '../contracts/stars'
import type { SkyTilePayload } from '../contracts/tiles'
import { hipGetPix, parseHipIdFromRuntimeStar } from './hipGetPix'

type HipLookupSurveyIndex = {
  readonly byPixOrder2: Map<number, readonly RuntimeStar[]>
}

const hipLookupSurveyIndexCache = new WeakMap<readonly SkyTilePayload[], HipLookupSurveyIndex>()

export function buildHipDetailRoute(hip: number): string {
  return `hip/${hip}`
}

export function resolveHipDetailRouteForRuntimeStar(star: RuntimeStar): string | null {
  const hip = parseHipIdFromRuntimeStar(star)
  if (hip == null) {
    return null
  }
  return buildHipDetailRoute(hip)
}

function buildHipLookupSurveyIndex(tiles: readonly SkyTilePayload[]): HipLookupSurveyIndex {
  const byPixOrder2 = new Map<number, RuntimeStar[]>()
  const stableTiles = [...tiles].sort((a, b) => a.level - b.level || a.tileId.localeCompare(b.tileId))
  for (const tile of stableTiles) {
    for (const star of tile.stars) {
      if (star.catalog === 'gaia') {
        continue
      }
      const hip = parseHipIdFromRuntimeStar(star)
      if (hip == null) {
        continue
      }
      const pixOrder2 = hipGetPix(hip, 2)
      if (pixOrder2 === -1) {
        continue
      }
      const current = byPixOrder2.get(pixOrder2)
      if (current) {
        current.push(star)
      } else {
        byPixOrder2.set(pixOrder2, [star])
      }
    }
  }
  return { byPixOrder2 }
}

function getHipLookupSurveyIndex(tiles: readonly SkyTilePayload[]): HipLookupSurveyIndex {
  const cached = hipLookupSurveyIndexCache.get(tiles)
  if (cached) {
    return cached
  }
  const built = buildHipLookupSurveyIndex(tiles)
  hipLookupSurveyIndexCache.set(tiles, built)
  return built
}

/**
 * Hub helper mirroring Stellarium `stars.c` `obj_get_by_hip` search intent:
 * - invalid / missing HIP tile mapping (`hip_get_pix` = -1) returns null,
 * - Gaia rows are ignored,
 * - survey traversal is keyed by `hip_get_pix(hip, 2)` buckets so lookups
 *   do not linearly scan every loaded tile,
 * - first non-Gaia star matching HIP is returned (stable tile/row order).
 */
export function findRuntimeStarByHipInTiles(
  tiles: readonly SkyTilePayload[],
  hip: number,
): RuntimeStar | null {
  // stars.c::obj_get_by_hip (lines 931-936) + hip.c::hip_get_pix (lines 19-24)
  // reject missing mapping via hip_get_pix before tile lookup.
  if (hipGetPix(hip, 0) === -1 || hipGetPix(hip, 1) === -1) {
    return null
  }

  const pixOrder2 = hipGetPix(hip, 2)
  if (pixOrder2 === -1) {
    return null
  }
  const index = getHipLookupSurveyIndex(tiles)
  const candidates = index.byPixOrder2.get(pixOrder2) ?? []
  // stars.c::obj_get_by_hip (lines 937-947): walk surveys/tiles and return
  // the first non-Gaia HIP match.
  for (const star of candidates) {
    if (parseHipIdFromRuntimeStar(star) === hip) {
      return star
    }
  }

  return null
}
