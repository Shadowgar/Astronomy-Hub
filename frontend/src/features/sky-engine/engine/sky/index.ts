export * from './contracts/observer'
export * from './contracts/scene'
export * from './contracts/stars'
export * from './contracts/tiles'
export { resolveSkyTileRepositoryMode } from './runtimeMode'
export { mockSkyTileRepository, createMockTileRepository } from './adapters/mockTileRepository'
export { fileBackedSkyTileRepository, createFileBackedSkyTileRepository } from './adapters/fileTileRepository'
export {
  buildSyntheticHipsViewportForTileSelection,
  clampHipsRenderOrder,
  formatHipsViewportKey,
  hipsGetRenderOrderUnclamped,
  normalizeProjectionMat11ForHips,
  resolveGaiaHealpixOrder,
} from './adapters/hipsRenderOrder'
export { bvToRgb } from './adapters/bvToRgb'
export { healpixOrderPixToNuniq, nuniqToHealpixOrderAndPix } from './adapters/starsNuniq'
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
import type { ObserverAstrometrySnapshot } from './transforms/coordinates'
import { resolveLimitingMagnitude } from './core/magnitudePolicy'
import { resolveActiveTiers } from './core/tierPolicy'
import { getSkyTileMaxLevel } from './core/tileIndex'
import { selectVisibleTileIds } from './core/tileSelection'

export function buildSkyEngineQuery(
  observer: ObserverSnapshot,
  options?: {
    limitingMagnitude?: number
    maxTileLevel?: number
    observerFrameAstrometry?: ObserverAstrometrySnapshot
    hipsViewport?: SkyEngineQuery['hipsViewport']
  },
): SkyEngineQuery {
  const limitingMagnitude = options?.limitingMagnitude ?? resolveLimitingMagnitude(observer.fovDeg)
  const maxTileLevel = getSkyTileMaxLevel(options?.maxTileLevel)

  return {
    observer,
    limitingMagnitude,
    activeTiers: resolveActiveTiers(observer, limitingMagnitude),
    visibleTileIds: selectVisibleTileIds(observer, limitingMagnitude, maxTileLevel, options?.hipsViewport),
    maxTileLevel,
    hipsViewport: options?.hipsViewport,
    observerFrameAstrometry: options?.observerFrameAstrometry,
  }
}