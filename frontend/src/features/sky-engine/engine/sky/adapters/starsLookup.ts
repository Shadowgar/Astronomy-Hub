import type { RuntimeStar } from '../contracts/stars'
import type { SkyTilePayload } from '../contracts/tiles'
import { hipGetPix, parseHipIdFromRuntimeStar } from './hipGetPix'

/**
 * Hub helper mirroring Stellarium `stars.c` `obj_get_by_hip` search intent:
 * - invalid / missing HIP tile mapping (`hip_get_pix` = -1) returns null,
 * - Gaia rows are ignored,
 * - first non-Gaia star matching HIP is returned (stable tile/row order).
 */
export function findRuntimeStarByHipInTiles(
  tiles: readonly SkyTilePayload[],
  hip: number,
): RuntimeStar | null {
  if (hipGetPix(hip, 0) === -1 || hipGetPix(hip, 1) === -1) {
    return null
  }

  const stableTiles = [...tiles].sort((a, b) => a.level - b.level || a.tileId.localeCompare(b.tileId))
  for (const tile of stableTiles) {
    for (const star of tile.stars) {
      if (star.catalog === 'gaia') {
        continue
      }

      if (parseHipIdFromRuntimeStar(star) === hip) {
        return star
      }
    }
  }

  return null
}
