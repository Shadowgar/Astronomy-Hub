import type { SkyEngineObserver } from '../../../types'

import type { SkyClockService } from './SkyClockService'
import { computeObserverPartialUpdateHash, computeObserverUpdateHash } from './observerUpdateHash'
import {
  deriveObserverGeometry,
  resolveObserverUpdateMode,
  type SkyObserverDerivedGeometry,
} from './observerDerivedGeometry'

/**
 * Stellarium `observer_update` (`observer.c` ~244–274): hash gate + fast/full ERFA paths.
 *
 * **Implemented:** same **staleness gate** as `hash == obs->hash` (skip if observer props +
 * scene time unchanged); **derived** latitude/longitude radians and elevation in meters
 * when the gate opens (scalar analog of site inputs used before full astrometry).
 *
 * **Partial:** refraction matches Stellarium `refraction_prepare` + Saemundsson `refraction()` (pressure from `core.c` barometric formula, 15 °C).
 * **Partial:** ΔT via `deltat.c` SMH2016 in `timeScales.ts`; UT1 JD; GMST/LST for display; `ri2h` uses ERFA `eraEra00` + longitude (`eral` analog). DUT1 = (TT−UTC) − ΔT (not IERS EOP).
 * **Not ported (deferred):** full `observer_update_fast` / `observer_update_full`, `update_matrices` with
 * BPN/polar motion/`eraEcm06`, `eraApco` / `eraAper13`, earth/sun PV — require full ERFA `observer_t`.
 */
export class SkyObserverService {
  private observer: SkyEngineObserver
  private readonly clockService: SkyClockService
  private committedHash: string | null = null
  private committedPartialHash: string | null = null
  private lastSceneTimestampIso: string | null = null
  private dirty = true
  private derived: SkyObserverDerivedGeometry = {
    sceneTimestampIso: '',
    updateMode: 'full',
    utcJulianDate: 0,
    ttJulianDate: 0,
    ut1JulianDate: 0,
    dut1Seconds: 0,
    latitudeRad: 0,
    longitudeRad: 0,
    elevationMeters: 0,
    localSiderealTimeDeg: 0,
    refraction: {
      refA: 0,
      refB: 0,
    },
    matrices: {
      ri2h: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      rh2i: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      ro2v: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      rv2o: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      ri2v: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      rc2v: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      ri2e: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      re2i: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    },
    earthPv: [0, 0, 0],
    sunPv: [0, 0, 0],
    lastAccurateSceneTimestampIso: '',
  }

  constructor(initialObserver: SkyEngineObserver, clockService: SkyClockService) {
    this.observer = initialObserver
    this.clockService = clockService
    this.derived = deriveObserverGeometry(initialObserver, this.clockService.getSceneTimestampIso(), 'full', null)
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
    const nextPartialHash = computeObserverPartialUpdateHash(this.observer)
    const nextHash = computeObserverUpdateHash(this.observer, sceneIso)
    if (!this.dirty && this.committedHash !== null && nextHash === this.committedHash) {
      return false
    }
    const updateMode = resolveObserverUpdateMode({
      sceneTimestampIso: sceneIso,
      previousSceneTimestampIso: this.lastSceneTimestampIso,
      observerPartialHashChanged: nextPartialHash !== this.committedPartialHash,
      previousUpdateMode: this.derived.updateMode,
    })
    this.derived = deriveObserverGeometry(this.observer, sceneIso, updateMode, this.derived)
    this.committedPartialHash = nextPartialHash
    this.committedHash = nextHash
    this.lastSceneTimestampIso = sceneIso
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

  getUpdateMode(): SkyObserverDerivedGeometry['updateMode'] {
    return this.derived.updateMode
  }
}
