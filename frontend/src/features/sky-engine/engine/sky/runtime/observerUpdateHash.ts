import type { SkyEngineObserver } from '../../../types'

/**
 * Stellarium `observer_compute_hash` (`observer.c` ~106–127) — stable identity for
 * "already computed for this observer + time" gating. Hub uses props + scene clock ISO
 * instead of ERFA `tt` / matrix fields.
 */
export function computeObserverUpdateHash(observer: SkyEngineObserver, sceneTimestampIso: string | null): string {
  return [
    observer.label,
    observer.latitude,
    observer.longitude,
    observer.elevationFt,
    sceneTimestampIso ?? '',
  ].join('|')
}
