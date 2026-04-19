import type { ObserverSnapshot } from '../contracts/observer'
import {
  buildSyntheticHipsViewportForTileSelection,
  clampHipsRenderOrder,
  hipsGetRenderOrderUnclamped,
  type HipsViewportHint,
} from '../adapters/hipsRenderOrder'
import { getSkyRootTileIds, getSkyTileChildren, getSkyTileDescriptor, getSkyTileMaxLevel, tileIntersectsView } from './tileIndex'
import { horizontalToRaDec } from '../transforms/coordinates'
import { SKY_TILE_LEVEL_MAG_MAX } from './magnitudePolicy'

/** Floor for view radius (deg) when intersecting quadtree tiles (edge coverage vs full `hips_render` culling). */
const MIN_VIEW_RADIUS_DEG = 10
/** Scale from FOV to view radius when above {@link MIN_VIEW_RADIUS_DEG}. */
const VIEW_RADIUS_FOV_FACTOR = 0.85

function resolveDesiredTileDepth(
  observer: ObserverSnapshot,
  limitingMagnitude: number,
  maxTileLevel: number,
  hipsViewport?: HipsViewportHint,
) {
  let magDepth = 0

  SKY_TILE_LEVEL_MAG_MAX.forEach((levelMaxMagnitude, level) => {
    if (limitingMagnitude > levelMaxMagnitude) {
      magDepth = level + 1
    }
  })

  if (limitingMagnitude <= SKY_TILE_LEVEL_MAG_MAX[0]) {
    magDepth = 1
  }

  const viewport = hipsViewport ?? buildSyntheticHipsViewportForTileSelection({
    fovDeg: observer.fovDeg,
    projection: observer.projection,
  })
  const suggested = hipsGetRenderOrderUnclamped({
    tileWidthPx: viewport.tileWidthPx ?? 256,
    windowHeightPx: viewport.windowHeightPx,
    projectionMat11: viewport.projectionMat11,
  })
  const capped = getSkyTileMaxLevel(maxTileLevel)
  const hipsDepth = clampHipsRenderOrder(suggested, 0, capped)

  return Math.min(capped, Math.max(magDepth, hipsDepth))
}

function shouldDescendTile(level: number, desiredDepth: number) {
  return level < desiredDepth
}

export function selectVisibleTileIds(
  observer: ObserverSnapshot,
  limitingMagnitude: number,
  maxTileLevel = getSkyTileMaxLevel(),
  hipsViewport?: HipsViewportHint,
) {
  const visibleTileIds: string[] = []
  const desiredDepth = resolveDesiredTileDepth(observer, limitingMagnitude, maxTileLevel, hipsViewport)
  const centerEquatorial = horizontalToRaDec(observer)
  const viewRadiusDeg = Math.max(MIN_VIEW_RADIUS_DEG, observer.fovDeg * VIEW_RADIUS_FOV_FACTOR)

  function visitTile(tileId: string) {
    const tile = getSkyTileDescriptor(tileId, maxTileLevel)

    if (!tile) {
      return
    }

    if (!tileIntersectsView(tile, centerEquatorial.raDeg, centerEquatorial.decDeg, viewRadiusDeg)) {
      return
    }

    if (shouldDescendTile(tile.level, desiredDepth) && tile.childTileIds.length > 0) {
      getSkyTileChildren(tileId, maxTileLevel).forEach((childTileId) => visitTile(childTileId))
      return
    }

    visibleTileIds.push(tile.tileId)
  }

  getSkyRootTileIds(maxTileLevel).forEach((tileId) => visitTile(tileId))

  if (visibleTileIds.length === 0) {
    const fallbackTileId = getSkyRootTileIds(maxTileLevel)[0]

    if (fallbackTileId) {
      visibleTileIds.push(fallbackTileId)
    }
  }

  return visibleTileIds
}