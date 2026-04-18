import type { SkyEngineObserver } from '../../../types'

import type { SkyClockService } from './SkyClockService'
import { computeObserverPartialUpdateHash, computeObserverUpdateHash } from './observerUpdateHash'
import {
  deriveObserverGeometry,
  resolveObserverUpdateMode,
  type SkyObserverDerivedGeometry,
} from './observerDerivedGeometry'
import { ZERO_POLAR_MOTION_STUB, type SkyObserverSeamScalars } from './observerParityStubs'

/**
 * Stellarium `observer_update` (`observer.c` ~244–274): hash gate + fast/full ERFA paths.
 *
 * **Implemented:** same **staleness gate** as `hash == obs->hash` (skip if observer props +
 * scene time unchanged); **derived** latitude/longitude radians and elevation in meters
 * when the gate opens (scalar analog of site inputs used before full astrometry).
 *
 * **Partial:** refraction matches Stellarium `refraction_prepare` + Saemundsson `refraction()` (pressure from `core.c` barometric formula, 15 °C).
 * **Partial:** ΔT via `deltat.c` SMH2016 in `timeScales.ts`; UT1 JD; GMST/LST for display; `ri2h` uses ERFA `eraEra00` + longitude (`eral` analog). DUT1 = (TT−UTC) − ΔT (not IERS EOP).
 * **Partial:** `eraPnm06a` BPN + `rc2v` / `ri2v` chain matching Stellarium `mat3_mul` order (`vec.h`).
 * **`polarMotion` / `observerSeam`:** zero PM stub + `elong`/`phi`/`hm`/`eral` scalars (`astrom` seam); EOP not integrated.
 * **Not ported (deferred):** PM in `ri2h`, `eraApco` / `eraAper13`, full `eraASTROM` on the seam — `eraEpv00` + **`eraApcs`** exist; `eraApco` glue still pending (see `docs/runtime/port/module0-eraApco-port-plan.md`).
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
      bpn: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      icrsToHorizontal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      horizontalToIcrs: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      ri2e: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      re2i: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    },
    earthPv: [0, 0, 0],
    sunPv: [0, 0, 0],
    lastAccurateSceneTimestampIso: '',
    polarMotion: ZERO_POLAR_MOTION_STUB,
    observerSeam: {
      elongRad: 0,
      phiRad: 0,
      hmMeters: 0,
      eralRad: 0,
    } satisfies SkyObserverSeamScalars,
    timeModifiedJulianDate: {
      tt: 0,
      utc: 0,
      ut1: 0,
    },
    cipRad: { x: 0, y: 0 },
    cioLocatorSRad: 0,
    equationOfOriginsRad: 0,
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
