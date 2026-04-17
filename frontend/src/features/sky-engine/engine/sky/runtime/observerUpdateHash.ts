import type { SkyEngineObserver } from '../../../types'
import { toJulianDateTt } from './timeScales'

/**
 * Stellarium `observer_compute_hash` (`observer.c` ~106–127) — stable identity for
 * "already computed for this observer + time" gating. Hub uses props + scene clock ISO
 * instead of ERFA `tt` / matrix fields.
 */
export function computeObserverPartialUpdateHash(observer: SkyEngineObserver): string {
  return [
    observer.label,
    observer.latitude,
    observer.longitude,
    observer.elevationFt,
  ].join('|')
}

export function computeObserverUpdateHash(observer: SkyEngineObserver, sceneTimestampIso: string | null): string {
  const ttJulianDate = sceneTimestampIso ? toJulianDateTt(sceneTimestampIso) : 0
  return [
    computeObserverPartialUpdateHash(observer),
    Number.isFinite(ttJulianDate) ? ttJulianDate.toFixed(9) : '',
  ].join('|')
}
