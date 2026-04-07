import type { ObserverSnapshot } from '../contracts/observer'

function isNorthFacing(centerAzDeg: number) {
  return centerAzDeg >= 315 || centerAzDeg < 45
}

function isEastFacing(centerAzDeg: number) {
  return centerAzDeg >= 45 && centerAzDeg < 180
}

export function selectVisibleTileIds(observer: ObserverSnapshot, limitingMagnitude: number) {
  const visibleTileIds = new Set<string>()

  if (isNorthFacing(observer.centerAzDeg) || observer.centerAltDeg >= 50 || observer.fovDeg >= 100) {
    visibleTileIds.add('tile-north-bright')
  }

  if (isEastFacing(observer.centerAzDeg)) {
    visibleTileIds.add('tile-east-bright')

    if (limitingMagnitude >= 8.5 || observer.fovDeg <= 40) {
      visibleTileIds.add('tile-east-detail')
    }
  } else {
    visibleTileIds.add('tile-west-bright')
  }

  if (visibleTileIds.size === 0) {
    visibleTileIds.add('tile-east-bright')
  }

  return Array.from(visibleTileIds)
}