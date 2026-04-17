import type { SkyEngineObserver } from '../../../types'

import type { SkyClockService } from './SkyClockService'
import { computeObserverUpdateHash } from './observerUpdateHash'
import { deriveObserverGeometry } from './observerDerivedGeometry'

export interface SkyObserverDerivedGeometry {
  readonly latitudeRad: number
  readonly longitudeRad: number
  readonly elevationMeters: number
}

/**
 * Stellarium `observer_update` (`observer.c` ~244–274): hash gate + fast/full ERFA paths.
 *
 * **Implemented:** same **staleness gate** as `hash == obs->hash` (skip if observer props +
 * scene time unchanged); **derived** latitude/longitude radians and elevation in meters
 * when the gate opens (scalar analog of site inputs used before full astrometry).
 *
 * **Not ported (deferred):** `observer_update_fast` / `observer_update_full`, `update_matrices`,
 * `eraApco` / `eraAper13`, earth/sun PV, refraction constants — require ERFA + `observer_t`.
 */
export class SkyObserverService {
  private observer: SkyEngineObserver
  private readonly clockService: SkyClockService
  private committedHash: string | null = null
  private dirty = true
  private derived: SkyObserverDerivedGeometry = {
    latitudeRad: 0,
    longitudeRad: 0,
    elevationMeters: 0,
  }

  constructor(initialObserver: SkyEngineObserver, clockService: SkyClockService) {
    this.observer = initialObserver
    this.clockService = clockService
    this.derived = deriveObserverGeometry(initialObserver)
  }

  syncObserver(observer: SkyEngineObserver) {
    const changed =
      observer.latitude !== this.observer.latitude ||
      observer.longitude !== this.observer.longitude ||
      observer.elevationFt !== this.observer.elevationFt ||
      observer.label !== this.observer.label
    this.observer = observer
    if (changed) {
      this.dirty = true
      this.committedHash = null
    }
  }

  /**
   * Call once per frame from render/update preambles (Stellarium `observer_update(..., true)` in `core_render` / navigation).
   * Returns whether derived state was recomputed (`false` == early return like Stellarium hash hit).
   */
  frameTick(): boolean {
    const sceneIso = this.clockService.getSceneTimestampIso()
    const nextHash = computeObserverUpdateHash(this.observer, sceneIso)
    if (!this.dirty && this.committedHash !== null && nextHash === this.committedHash) {
      return false
    }
    this.derived = deriveObserverGeometry(this.observer)
    this.committedHash = nextHash
    this.dirty = false
    return true
  }

  getObserver() {
    return this.observer
  }

  /** Radians / meters; updated when `frameTick` recomputes. */
  getDerivedGeometry(): SkyObserverDerivedGeometry {
    return this.derived
  }
}
