import type { RuntimeStar } from '../contracts/stars'
import type { SkyTilePayload } from '../contracts/tiles'
import { hipGetPix, parseHipIdFromRuntimeStar } from './hipGetPix'

type HipLookupSurveyIndex = {
  readonly byOrder: {
    readonly 0: Map<number, readonly RuntimeStar[]>
    readonly 1: Map<number, readonly RuntimeStar[]>
  }
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
  const byOrder0 = new Map<number, RuntimeStar[]>()
  const byOrder1 = new Map<number, RuntimeStar[]>()
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
      const pixOrder0 = hipGetPix(hip, 0)
      if (pixOrder0 !== -1) {
        const current = byOrder0.get(pixOrder0)
        if (current) {
          current.push(star)
        } else {
          byOrder0.set(pixOrder0, [star])
        }
      }
      const pixOrder1 = hipGetPix(hip, 1)
      if (pixOrder1 !== -1) {
        const current = byOrder1.get(pixOrder1)
        if (current) {
          current.push(star)
        } else {
          byOrder1.set(pixOrder1, [star])
        }
      }
    }
  }
  return {
    byOrder: {
      0: byOrder0,
      1: byOrder1,
    },
  }
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
 * - search order follows `obj_get_by_hip`: evaluate `hip_get_pix(hip, 0)`
 *   before `hip_get_pix(hip, 1)`,
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

  const index = getHipLookupSurveyIndex(tiles)
  // stars.c::obj_get_by_hip (lines 930-946): walk orders 0->1 and return
  // first non-Gaia HIP match.
  for (const order of [0, 1] as const) {
    const pix = hipGetPix(hip, order)
    if (pix === -1) {
      continue
    }
    const candidates = index.byOrder[order].get(pix) ?? []
    for (const star of candidates) {
      if (parseHipIdFromRuntimeStar(star) === hip) {
        return star
      }
    }
  }

  return null
}
