import type { SkyEngineObserver } from '../../../types'
import {
  computeLocalSiderealTimeDeg,
  computeStellariumBarometricPressureMbar,
  refractionPrepareStellarium,
} from '../transforms/coordinates'
import {
  eclipticToIcrsMatrixFromTt,
  icrsToEclipticMatrixFromTt,
  identityMatrix3 as erfaIdentityMatrix3,
  multiplyMatrix3Erfa,
  transposeMatrix3 as transposeMatrix3Erfa,
  type MutableMatrix3,
} from './erfaIau2006'
import { eraBpn2xy } from './erfaBpn2xy'
import { eraEors } from './erfaEors'
import { eraPnm06aFromTtJulianDate } from './erfaPnm06a'
import { eraS06 } from './erfaS06'
import { eraEpv00 } from './erfaEpv00'
import { localEarthRotationAngleRad } from './erfaEarthRotation'
import { dut1SecondsFromTimestampIso, toJulianDateTt, toJulianDateUtc, ut1JulianDateFromTimestampIso } from './timeScales'
import {
  type SkyObserverSeamScalars,
  type SkyPolarMotionStub,
  ZERO_POLAR_MOTION_STUB,
} from './observerParityStubs'

const FT_TO_METERS = 0.3048
const FAST_UPDATE_SECONDS = 1.001 * 24 * 60 * 60
/** ERFA / SOFA MJD reference `DJM0` (Modified Julian Date = JD − 2400000.5). */
const ERFA_DJM0 = 2400000.5

type Matrix3 = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
]

function multiplyMatrix3(left: Matrix3, right: Matrix3): Matrix3 {
  const m00 = left[0][0] * right[0][0] + left[0][1] * right[1][0] + left[0][2] * right[2][0]
  const m01 = left[0][0] * right[0][1] + left[0][1] * right[1][1] + left[0][2] * right[2][1]
  const m02 = left[0][0] * right[0][2] + left[0][1] * right[1][2] + left[0][2] * right[2][2]
  const m10 = left[1][0] * right[0][0] + left[1][1] * right[1][0] + left[1][2] * right[2][0]
  const m11 = left[1][0] * right[0][1] + left[1][1] * right[1][1] + left[1][2] * right[2][1]
  const m12 = left[1][0] * right[0][2] + left[1][1] * right[1][2] + left[1][2] * right[2][2]
  const m20 = left[2][0] * right[0][0] + left[2][1] * right[1][0] + left[2][2] * right[2][0]
  const m21 = left[2][0] * right[0][1] + left[2][1] * right[1][1] + left[2][2] * right[2][1]
  const m22 = left[2][0] * right[0][2] + left[2][1] * right[1][2] + left[2][2] * right[2][2]
  return [
    [m00, m01, m02],
    [m10, m11, m12],
    [m20, m21, m22],
  ]
}

function toReadonlyMatrix3(m: MutableMatrix3): Matrix3 {
  return [
    [m[0][0], m[0][1], m[0][2]],
    [m[1][0], m[1][1], m[1][2]],
    [m[2][0], m[2][1], m[2][2]],
  ]
}

function transposeMatrix3(value: Matrix3): Matrix3 {
  return [
    [value[0][0], value[1][0], value[2][0]],
    [value[0][1], value[1][1], value[2][1]],
    [value[0][2], value[1][2], value[2][2]],
  ]
}

function rotationY(radians: number): Matrix3 {
  const c = Math.cos(radians)
  const s = Math.sin(radians)
  return [
    [c, 0, s],
    [0, 1, 0],
    [-s, 0, c],
  ]
}

function rotationZ(radians: number): Matrix3 {
  const c = Math.cos(radians)
  const s = Math.sin(radians)
  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1],
  ]
}

/** Same as Stellarium `observer_update_full` → `refraction_prepare(pressure, 15, 0.5, ...)`. */
function refractionFromElevation(elevationMeters: number) {
  const pressureMbar = computeStellariumBarometricPressureMbar(elevationMeters)
  return refractionPrepareStellarium(pressureMbar, 15)
}

/**
 * Stellarium `observer.c` `update_matrices`: `mat3_mul` is `out = b × a` in row-storage
 * matching ERFA `multiplyMatrix3Erfa` as `multiplyMatrix3Erfa(a,b)=a*b` (standard), so
 * `mat3_mul(ro2v, ri2h, ri2v)` → `ri2v = ri2h × ro2v`. `rc2v` uses `transpose(bpn)` then
 * the same convention: `bpn^T × ri2h × ro2v` (ERFA `eraPnm06a` `rnpb` = GCRS→CIRS `bpn`).
 */
function computeFrameMatrices(latitudeRad: number, localEarthRotationRad: number, ttJulianDate: number): {
  ri2h: Matrix3
  rh2i: Matrix3
  ro2v: Matrix3
  rv2o: Matrix3
  ri2v: Matrix3
  rc2v: Matrix3
  bpn: Matrix3
  /** ICRS/GCRS equatorial unit vector → topocentric horizontal (geometric): `ri2h × bpn`. */
  icrsToHorizontal: Matrix3
  /** Inverse of `icrsToHorizontal`: `bpn^T × rh2i`. */
  horizontalToIcrs: Matrix3
} {
  const ri2h = multiplyMatrix3(rotationY(Math.PI / 2 - latitudeRad), rotationZ(-localEarthRotationRad))
  const rh2i = transposeMatrix3(ri2h)
  const ro2vM = erfaIdentityMatrix3()
  const rv2oM = erfaIdentityMatrix3()
  const ri2hM = ri2h as unknown as MutableMatrix3
  const rh2iM = rh2i as unknown as MutableMatrix3
  const ri2vM = multiplyMatrix3Erfa(ri2hM, ro2vM)
  const bpnM = eraPnm06aFromTtJulianDate(ttJulianDate)
  const bpnT = transposeMatrix3Erfa(bpnM)
  const rc2vM = multiplyMatrix3Erfa(multiplyMatrix3Erfa(bpnT, ri2hM), ro2vM)
  const icrsToHorizontalM = multiplyMatrix3Erfa(ri2hM, bpnM)
  const horizontalToIcrsM = multiplyMatrix3Erfa(bpnT, rh2iM)
  return {
    ri2h,
    rh2i,
    ro2v: toReadonlyMatrix3(ro2vM),
    rv2o: toReadonlyMatrix3(rv2oM),
    ri2v: toReadonlyMatrix3(ri2vM),
    rc2v: toReadonlyMatrix3(rc2vM),
    bpn: toReadonlyMatrix3(bpnM),
    icrsToHorizontal: toReadonlyMatrix3(icrsToHorizontalM),
    horizontalToIcrs: toReadonlyMatrix3(horizontalToIcrsM),
  }
}

export type SkyObserverUpdateMode = 'fast' | 'full'

export type { SkyObserverSeamScalars, SkyPolarMotionStub }
export { ZERO_POLAR_MOTION_STUB } from './observerParityStubs'

export interface SkyObserverDerivedGeometry {
  readonly sceneTimestampIso: string
  readonly updateMode: SkyObserverUpdateMode
  readonly utcJulianDate: number
  readonly ttJulianDate: number
  /** UT1 Julian date (TT − ΔT); Stellarium `observer_t.ut1` is MJD offset from `DJM0`. */
  readonly ut1JulianDate: number
  readonly dut1Seconds: number
  readonly latitudeRad: number
  readonly longitudeRad: number
  readonly elevationMeters: number
  /** GMST + longitude (degrees); not used for `ri2h` — matrices use `eraEra00` + longitude. */
  readonly localSiderealTimeDeg: number
  readonly refraction: {
    readonly refA: number
    readonly refB: number
  }
  readonly matrices: {
    readonly ri2h: Matrix3
    readonly rh2i: Matrix3
    readonly ro2v: Matrix3
    readonly rv2o: Matrix3
    readonly ri2v: Matrix3
    readonly rc2v: Matrix3
    /** ERFA `eraPnm06a` `rnpb` (GCRS → CIRS / true equator of date); Stellarium `astrom->bpn`. */
    readonly bpn: Matrix3
    /** ICRS → horizontal (geom): `ri2h × bpn`. Use for `ObserverFrame` `icrf` when vector is GCRS/ICRS. */
    readonly icrsToHorizontal: Matrix3
    readonly horizontalToIcrs: Matrix3
    /** ERFA `eraEcm06` (ICRS → mean ecliptic of date). */
    readonly ri2e: Matrix3
    readonly re2i: Matrix3
  }
  /** Barycentric Earth position (AU), ERFA `eraEpv00` → `pvb[0]` in BCRS. */
  readonly earthPv: readonly [number, number, number]
  /** Minus heliocentric Sun→Earth position (AU), −`eraEpv00` → `pvh[0]`; coarse sun direction until full `eraASTROM`. */
  readonly sunPv: readonly [number, number, number]
  readonly lastAccurateSceneTimestampIso: string
  /**
   * Polar motion stub (radians). Zeros: no IERS EOP; `ri2h` is built without PM rotation
   * (Stellarium `mat3_mul` rpl with `astrom->xpl`/`ypl`).
   */
  readonly polarMotion: SkyPolarMotionStub
  /**
   * `observer_t` / `eraASTROM` scalar seam — same values as top-level lat/long/hm + local ERA where applicable.
   */
  readonly observerSeam: SkyObserverSeamScalars
  /** TT / UTC / UT1 as Modified Julian Date (`JD − 2400000.5`), Stellarium `observer_t.{tt,utc,ut1}` style. */
  readonly timeModifiedJulianDate: {
    readonly tt: number
    readonly utc: number
    readonly ut1: number
  }
  /** CIP unit vector components in GCRS (radians) — ERFA `eraBpn2xy` / bottom row of `bpn`. */
  readonly cipRad: {
    readonly x: number
    readonly y: number
  }
  /** CIO locator s (radians): `eraS06` using same TT split as `eraPnm06a`. */
  readonly cioLocatorSRad: number
  /** Equation of the origins (radians): `eraEors(bpn, cioLocatorSRad)`. */
  readonly equationOfOriginsRad: number
}

export interface ObserverUpdateDecisionInput {
  readonly sceneTimestampIso: string
  readonly previousSceneTimestampIso: string | null
  readonly observerPartialHashChanged: boolean
  readonly previousUpdateMode: SkyObserverUpdateMode | null
}

export function resolveObserverUpdateMode(input: ObserverUpdateDecisionInput): SkyObserverUpdateMode {
  if (input.observerPartialHashChanged || !input.previousSceneTimestampIso) {
    return 'full'
  }
  const nowMs = Date.parse(input.sceneTimestampIso)
  const previousMs = Date.parse(input.previousSceneTimestampIso)
  if (!Number.isFinite(nowMs) || !Number.isFinite(previousMs)) {
    return 'full'
  }
  const deltaSeconds = Math.abs((nowMs - previousMs) / 1000)
  if (deltaSeconds >= FAST_UPDATE_SECONDS) {
    return 'full'
  }
  return input.previousUpdateMode === 'full' ? 'fast' : 'fast'
}

/**
 * Cheap geometry derived from `SkyEngineObserver` (degrees / feet) each time the
 * observer update hash changes. Stellarium stores radians, meters, and matrices from
 * `observer_update` / ERFA; this covers the scalar site inputs only.
 */
export function deriveObserverGeometry(
  observer: SkyEngineObserver,
  sceneTimestampIso: string,
  updateMode: SkyObserverUpdateMode,
  previous: SkyObserverDerivedGeometry | null,
): SkyObserverDerivedGeometry {
  const latitudeRad = (observer.latitude * Math.PI) / 180
  const longitudeRad = (observer.longitude * Math.PI) / 180
  const elevationMeters = observer.elevationFt * FT_TO_METERS
  const localSiderealTimeDeg = computeLocalSiderealTimeDeg(observer.longitude, sceneTimestampIso)
  const ut1JulianDate = ut1JulianDateFromTimestampIso(sceneTimestampIso)
  const utcJulianDate = toJulianDateUtc(sceneTimestampIso)
  const ttJulianDate = toJulianDateTt(sceneTimestampIso)
  const localEraRad = localEarthRotationAngleRad(ut1JulianDate, longitudeRad, ttJulianDate)
  const dut1Seconds = dut1SecondsFromTimestampIso(sceneTimestampIso)
  const refraction = refractionFromElevation(elevationMeters)
  const horizon = computeFrameMatrices(latitudeRad, localEraRad, ttJulianDate)
  const cipScratch = { x: 0, y: 0 }
  eraBpn2xy(horizon.bpn, cipScratch)
  const ttMjdPart = ttJulianDate - ERFA_DJM0
  const cioLocatorSRad = eraS06(ERFA_DJM0, ttMjdPart, cipScratch.x, cipScratch.y)
  const equationOfOriginsRad = eraEors(horizon.bpn, cioLocatorSRad)
  const matrices = {
    ...horizon,
    ri2e: toReadonlyMatrix3(icrsToEclipticMatrixFromTt(ttJulianDate)),
    re2i: toReadonlyMatrix3(eclipticToIcrsMatrixFromTt(ttJulianDate)),
  }
  const epv = eraEpv00(ERFA_DJM0, ttJulianDate - ERFA_DJM0)
  const pvb0 = epv.pvb[0]
  const pvh0 = epv.pvh[0]
  const earthPv: readonly [number, number, number] = [pvb0[0], pvb0[1], pvb0[2]]
  /** Heliocentric Sun→Earth position; Earth→Sun direction uses `-pvh[0]` (AU). */
  const sunPv: readonly [number, number, number] = [-pvh0[0], -pvh0[1], -pvh0[2]]
  const lastAccurateSceneTimestampIso = updateMode === 'full'
    ? sceneTimestampIso
    : (previous?.lastAccurateSceneTimestampIso ?? sceneTimestampIso)

  const polarMotion = ZERO_POLAR_MOTION_STUB
  const observerSeam: SkyObserverSeamScalars = {
    elongRad: longitudeRad,
    phiRad: latitudeRad,
    hmMeters: elevationMeters,
    eralRad: localEraRad,
  }

  return {
    sceneTimestampIso,
    updateMode,
    utcJulianDate,
    ttJulianDate,
    ut1JulianDate,
    dut1Seconds,
    latitudeRad,
    longitudeRad,
    elevationMeters,
    localSiderealTimeDeg,
    refraction,
    matrices,
    earthPv,
    sunPv,
    lastAccurateSceneTimestampIso,
    polarMotion,
    observerSeam,
    timeModifiedJulianDate: {
      tt: ttMjdPart,
      utc: utcJulianDate - ERFA_DJM0,
      ut1: ut1JulianDate - ERFA_DJM0,
    },
    cipRad: { x: cipScratch.x, y: cipScratch.y },
    cioLocatorSRad,
    equationOfOriginsRad,
  }
}
