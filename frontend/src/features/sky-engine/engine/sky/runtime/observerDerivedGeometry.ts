import type { SkyEngineObserver } from '../../../types'
import {
  computeLocalSiderealTimeDeg,
  computeStellariumBarometricPressureMbar,
  refractionPrepareStellarium,
} from '../transforms/coordinates'
import { eclipticToIcrsMatrixFromTt, icrsToEclipticMatrixFromTt, type MutableMatrix3 } from './erfaIau2006'
import { localEarthRotationAngleRad } from './erfaEarthRotation'
import { dut1SecondsFromTimestampIso, toJulianDateTt, toJulianDateUtc, ut1JulianDateFromTimestampIso } from './timeScales'

const FT_TO_METERS = 0.3048
const FAST_UPDATE_SECONDS = 1.001 * 24 * 60 * 60

type Matrix3 = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
]

function identityMatrix3(): Matrix3 {
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]
}

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

/** `eral` analog: ERFA `eraEra00` + longitude (Stellarium `observer.c` `mat3_rz(astrom->eral,…)`), not GMST+LST. */
function computeFrameMatrices(latitudeRad: number, localEarthRotationRad: number): {
  ri2h: Matrix3
  rh2i: Matrix3
  ro2v: Matrix3
  rv2o: Matrix3
  ri2v: Matrix3
  rc2v: Matrix3
} {
  const ri2h = multiplyMatrix3(rotationY(Math.PI / 2 - latitudeRad), rotationZ(-localEarthRotationRad))
  const rh2i = transposeMatrix3(ri2h)
  const ro2v = identityMatrix3()
  const rv2o = identityMatrix3()
  const ri2v = multiplyMatrix3(ro2v, ri2h)
  const rc2v = ri2v
  return { ri2h, rh2i, ro2v, rv2o, ri2v, rc2v }
}

export type SkyObserverUpdateMode = 'fast' | 'full'

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
    /** ERFA `eraEcm06` (ICRS → mean ecliptic of date); BPN not applied. */
    readonly ri2e: Matrix3
    readonly re2i: Matrix3
  }
  readonly earthPv: readonly [number, number, number]
  readonly sunPv: readonly [number, number, number]
  readonly lastAccurateSceneTimestampIso: string
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
  const horizon = computeFrameMatrices(latitudeRad, localEraRad)
  const matrices = {
    ...horizon,
    ri2e: toReadonlyMatrix3(icrsToEclipticMatrixFromTt(ttJulianDate)),
    re2i: toReadonlyMatrix3(eclipticToIcrsMatrixFromTt(ttJulianDate)),
  }
  const earthPv: readonly [number, number, number] = previous?.earthPv ?? [0, 0, 0]
  const sunPv: readonly [number, number, number] = previous?.sunPv ?? [0, 0, 0]
  const lastAccurateSceneTimestampIso = updateMode === 'full'
    ? sceneTimestampIso
    : (previous?.lastAccurateSceneTimestampIso ?? sceneTimestampIso)

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
  }
}
