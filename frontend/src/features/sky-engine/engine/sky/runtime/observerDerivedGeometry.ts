import type { SkyEngineObserver } from '../../../types'
import { computeLocalSiderealTimeDeg } from '../transforms/coordinates'

const FT_TO_METERS = 0.3048
const FAST_UPDATE_SECONDS = 24 * 60 * 60
const TT_MINUS_UTC_SECONDS = 69.184

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

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function toJulianDate(timestampIso: string) {
  return new Date(timestampIso).getTime() / 86400000 + 2440587.5
}

function computeRefractionCoefficients(elevationMeters: number) {
  const pressureHpa = clamp(1013.25 * Math.exp(-elevationMeters / 8434.5), 120, 1035)
  const refA = pressureHpa / 1010
  const refB = 283 / (273 + 15)
  return { refA, refB }
}

function computeFrameMatrices(latitudeRad: number, localSiderealTimeDeg: number): {
  ri2h: Matrix3
  rh2i: Matrix3
  ro2v: Matrix3
  rv2o: Matrix3
  ri2v: Matrix3
  rc2v: Matrix3
} {
  const earthRotationRad = (localSiderealTimeDeg * Math.PI) / 180
  const ri2h = multiplyMatrix3(rotationY(Math.PI / 2 - latitudeRad), rotationZ(-earthRotationRad))
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
  readonly dut1Seconds: number
  readonly latitudeRad: number
  readonly longitudeRad: number
  readonly elevationMeters: number
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
  }
  readonly earthPv: readonly [number, number, number]
  readonly sunPv: readonly [number, number, number]
}

export interface ObserverUpdateDecisionInput {
  readonly sceneTimestampIso: string
  readonly previousSceneTimestampIso: string | null
  readonly observerPartialHashChanged: boolean
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
  return deltaSeconds >= FAST_UPDATE_SECONDS ? 'full' : 'fast'
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
): SkyObserverDerivedGeometry {
  const latitudeRad = (observer.latitude * Math.PI) / 180
  const longitudeRad = (observer.longitude * Math.PI) / 180
  const elevationMeters = observer.elevationFt * FT_TO_METERS
  const localSiderealTimeDeg = computeLocalSiderealTimeDeg(observer.longitude, sceneTimestampIso)
  const utcJulianDate = toJulianDate(sceneTimestampIso)
  const ttJulianDate = utcJulianDate + TT_MINUS_UTC_SECONDS / 86400
  const dut1Seconds = 0
  const refraction = computeRefractionCoefficients(elevationMeters)
  const matrices = computeFrameMatrices(latitudeRad, localSiderealTimeDeg)
  const earthPv: readonly [number, number, number] = [0, 0, 0]
  const sunPv: readonly [number, number, number] = [0, 0, 0]

  return {
    sceneTimestampIso,
    updateMode,
    utcJulianDate,
    ttJulianDate,
    dut1Seconds,
    latitudeRad,
    longitudeRad,
    elevationMeters,
    localSiderealTimeDeg,
    refraction,
    matrices,
    earthPv,
    sunPv,
  }
}
