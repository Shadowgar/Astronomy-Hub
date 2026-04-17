import type { SkyEngineObserver } from '../../../types'

const FT_TO_METERS = 0.3048

/**
 * Cheap geometry derived from `SkyEngineObserver` (degrees / feet) each time the
 * observer update hash changes. Stellarium stores radians, meters, and matrices from
 * `observer_update` / ERFA; this covers the scalar site inputs only.
 */
export function deriveObserverGeometry(observer: SkyEngineObserver) {
  return {
    latitudeRad: (observer.latitude * Math.PI) / 180,
    longitudeRad: (observer.longitude * Math.PI) / 180,
    elevationMeters: observer.elevationFt * FT_TO_METERS,
  }
}
