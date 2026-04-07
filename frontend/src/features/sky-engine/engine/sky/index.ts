export * from './contracts/observer'
export * from './contracts/scene'
export * from './contracts/stars'
export * from './contracts/tiles'
export { mockSkyTileRepository, createMockTileRepository } from './adapters/mockTileRepository'
export { resolveLimitingMagnitude } from './core/magnitudePolicy'
export {
  getAllSkyTileDescriptors,
  getSkyRootTileIds,
  getSkyTileChildren,
  getSkyTileDescriptor,
  getSkyTileMaxLevel,
  tileIntersectsView,
} from './core/tileIndex'
export { resolveActiveTiers } from './core/tierPolicy'
export { selectVisibleTileIds } from './core/tileSelection'
export { buildSkyDiagnostics, formatSkyDiagnosticsSummary } from './diagnostics/skyDiagnostics'
export { assembleSkyScenePacket } from './services/sceneAssembler'
export {
  computeLocalSiderealTimeDeg,
  horizontalToUnitVector,
  horizontalToRaDec,
  raDecToEquatorialUnitVector,
  raDecToHorizontalCoordinates,
  raDecToObserverUnitVector,
  unitVectorToHorizontalCoordinates,
} from './transforms/coordinates'

import type { ObserverSnapshot } from './contracts/observer'
import type { SkyEngineQuery } from './contracts/tiles'
import { resolveLimitingMagnitude } from './core/magnitudePolicy'
import { resolveActiveTiers } from './core/tierPolicy'
import { selectVisibleTileIds } from './core/tileSelection'

export function buildSkyEngineQuery(observer: ObserverSnapshot): SkyEngineQuery {
  const limitingMagnitude = resolveLimitingMagnitude(observer.fovDeg)

  return {
    observer,
    limitingMagnitude,
    activeTiers: resolveActiveTiers(observer, limitingMagnitude),
    visibleTileIds: selectVisibleTileIds(observer, limitingMagnitude),
  }
}