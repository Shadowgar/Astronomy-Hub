import type { ObserverSnapshot } from '../contracts/observer'
import { getSkyRootTileIds, getSkyTileChildren, getSkyTileDescriptor, getSkyTileMaxLevel, tileIntersectsView } from './tileIndex'
import { horizontalToRaDec } from '../transforms/coordinates'
import { SKY_TILE_LEVEL_MAG_MAX } from './magnitudePolicy'

function resolveDesiredTileDepth(_observer: ObserverSnapshot, limitingMagnitude: number, maxTileLevel: number) {
  let desiredDepth = 0

  SKY_TILE_LEVEL_MAG_MAX.forEach((levelMaxMagnitude, level) => {
    if (limitingMagnitude > levelMaxMagnitude) {
      desiredDepth = level + 1
    }
  })

  if (limitingMagnitude <= SKY_TILE_LEVEL_MAG_MAX[0]) {
    desiredDepth = 1
  }

  return Math.min(desiredDepth, getSkyTileMaxLevel(maxTileLevel))
}

function shouldDescendTile(level: number, desiredDepth: number) {
  return level < desiredDepth
}

export function selectVisibleTileIds(observer: ObserverSnapshot, limitingMagnitude: number, maxTileLevel = getSkyTileMaxLevel()) {
  const visibleTileIds: string[] = []
  const desiredDepth = resolveDesiredTileDepth(observer, limitingMagnitude, maxTileLevel)
  const centerEquatorial = horizontalToRaDec(observer)
  const viewRadiusDeg = Math.max(6, observer.fovDeg * 0.65)

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