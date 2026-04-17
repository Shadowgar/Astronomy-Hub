import type { ObserverSnapshot } from '../contracts/observer'

export type UnitVector3 = {
  x: number
  y: number
  z: number
}

export type HorizontalCoordinates = {
  altitudeDeg: number
  geometricAltitudeDeg: number
  azimuthDeg: number
  isAboveHorizon: boolean
}

export type ObserverAstrometrySnapshot = {
  localSiderealTimeDeg: number
  refraction?: {
    refA: number
    refB: number
  }
  matrices?: {
    ri2h: readonly [readonly [number, number, number], readonly [number, number, number], readonly [number, number, number]]
    rh2i: readonly [readonly [number, number, number], readonly [number, number, number], readonly [number, number, number]]
  }
}

export type ObserverFrame = 'icrf' | 'observed_geom' | 'observed'

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

function radiansToDegrees(value: number) {
  return (value * 180) / Math.PI
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360
}

function normalizeSignedDegrees(value: number) {
  const normalized = normalizeDegrees(value)
  return normalized > 180 ? normalized - 360 : normalized
}

function normalizeVector(vector: UnitVector3): UnitVector3 {
  const length = Math.hypot(vector.x, vector.y, vector.z)

  if (length === 0) {
    return { x: 0, y: 0, z: 1 }
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  }
}

function multiplyMatrixVector(
  matrix: readonly [readonly [number, number, number], readonly [number, number, number], readonly [number, number, number]],
  vector: UnitVector3,
): UnitVector3 {
  return {
    x: matrix[0][0] * vector.x + matrix[0][1] * vector.y + matrix[0][2] * vector.z,
    y: matrix[1][0] * vector.x + matrix[1][1] * vector.y + matrix[1][2] * vector.z,
    z: matrix[2][0] * vector.x + matrix[2][1] * vector.y + matrix[2][2] * vector.z,
  }
}

/** Stellarium `core.c`: sea-level temp 15 °C, scale from Allen Astrophysical Quantities §52. */
export function computeStellariumBarometricPressureMbar(elevationMeters: number) {
  const tsl = 15 + 273.15
  return 1013.25 * Math.exp(-elevationMeters / (29.3 * tsl))
}

/**
 * Stellarium `algos/refraction.c` `refraction_prepare`: refa = pressure (mbar), refb = temperature (°C).
 * Humidity is accepted but unused in the current implementation.
 */
export function refractionPrepareStellarium(pressureMbar: number, temperatureC: number) {
  return { refA: pressureMbar, refB: temperatureC }
}

const DD2R = Math.PI / 180
const MIN_GEO_ALTITUDE_DEG = -3.54
const TRANSITION_WIDTH_GEO_DEG = 1.46
const MIN_TRANSITION_BOTTOM_DEG = MIN_GEO_ALTITUDE_DEG - TRANSITION_WIDTH_GEO_DEG

function applyRefraction(geometricAltitudeDeg: number, astrometry?: ObserverAstrometrySnapshot) {
  if (!astrometry?.refraction) {
    return geometricAltitudeDeg
  }
  const pressure = astrometry.refraction.refA
  const temperature = astrometry.refraction.refB

  if (geometricAltitudeDeg < MIN_TRANSITION_BOTTOM_DEG) {
    return geometricAltitudeDeg
  }

  const pSaemundsson = 1.02 * (pressure / 1010) * (283 / (273 + temperature)) / 60

  if (geometricAltitudeDeg > MIN_GEO_ALTITUDE_DEG) {
    const r =
      pSaemundsson / Math.tan((geometricAltitudeDeg + 10.3 / (geometricAltitudeDeg + 5.11)) * DD2R) +
      0.0019279
    let observed = geometricAltitudeDeg + r
    if (observed > 90) {
      observed = 90
    }
    return observed
  }

  const rAtMin =
    pSaemundsson /
      Math.tan((MIN_GEO_ALTITUDE_DEG + 10.3 / (MIN_GEO_ALTITUDE_DEG + 5.11)) * DD2R) +
    0.0019279
  const blend =
    (geometricAltitudeDeg - MIN_TRANSITION_BOTTOM_DEG) / TRANSITION_WIDTH_GEO_DEG
  return geometricAltitudeDeg + rAtMin * blend
}

function removeRefraction(observedAltitudeDeg: number, astrometry?: ObserverAstrometrySnapshot) {
  if (!astrometry?.refraction) {
    return observedAltitudeDeg
  }
  let geometricAltitudeDeg = observedAltitudeDeg
  for (let index = 0; index < 10; index += 1) {
    const corrected = applyRefraction(geometricAltitudeDeg, astrometry)
    geometricAltitudeDeg -= corrected - observedAltitudeDeg
  }
  return geometricAltitudeDeg
}

export function geometricToObservedAltitudeDeg(geometricAltitudeDeg: number, astrometry?: ObserverAstrometrySnapshot) {
  return applyRefraction(geometricAltitudeDeg, astrometry)
}

export function observedToGeometricAltitudeDeg(observedAltitudeDeg: number, astrometry?: ObserverAstrometrySnapshot) {
  return removeRefraction(observedAltitudeDeg, astrometry)
}

export function createObserverAstrometrySnapshot(observer: ObserverSnapshot): ObserverAstrometrySnapshot {
  const elevationM = observer.elevationM ?? 0
  const pressureMbar = computeStellariumBarometricPressureMbar(elevationM)
  return {
    localSiderealTimeDeg: computeLocalSiderealTimeDeg(observer.longitudeDeg, observer.timestampUtc),
    refraction: refractionPrepareStellarium(pressureMbar, 15),
  }
}

export function convertObserverFrameVector(
  vector: UnitVector3,
  origin: ObserverFrame,
  destination: ObserverFrame,
  astrometry?: ObserverAstrometrySnapshot,
): UnitVector3 {
  if (origin === destination) {
    return normalizeVector(vector)
  }
  let current = normalizeVector(vector)
  let frame: ObserverFrame = origin

  if (frame === 'icrf' && destination !== 'icrf' && astrometry?.matrices?.ri2h) {
    current = normalizeVector(multiplyMatrixVector(astrometry.matrices.ri2h, current))
    frame = 'observed_geom'
  }
  if (frame === 'observed_geom' && destination === 'observed') {
    const horizontal = unitVectorToHorizontalCoordinates(current)
    current = normalizeVector(horizontalToUnitVector(
      geometricToObservedAltitudeDeg(horizontal.altitudeDeg, astrometry),
      horizontal.azimuthDeg,
      astrometry,
    ))
    frame = 'observed'
  }
  if (frame === 'observed' && destination === 'observed_geom') {
    const horizontal = unitVectorToHorizontalCoordinates(current)
    current = normalizeVector(horizontalToUnitVector(
      observedToGeometricAltitudeDeg(horizontal.altitudeDeg, astrometry),
      horizontal.azimuthDeg,
      astrometry,
    ))
    frame = 'observed_geom'
  }
  if (frame === 'observed_geom' && destination === 'icrf' && astrometry?.matrices?.rh2i) {
    current = normalizeVector(multiplyMatrixVector(astrometry.matrices.rh2i, current))
    frame = 'icrf'
  }
  return current
}

export function raDecToEquatorialUnitVector(raDeg: number, decDeg: number): UnitVector3 {
  const rightAscensionRad = degreesToRadians(raDeg)
  const declinationRad = degreesToRadians(decDeg)
  const radius = Math.cos(declinationRad)

  return {
    x: Math.cos(rightAscensionRad) * radius,
    y: Math.sin(rightAscensionRad) * radius,
    z: Math.sin(declinationRad),
  }
}

export function computeLocalSiderealTimeDeg(longitudeDeg: number, timestampUtc: string) {
  const julianDate = new Date(timestampUtc).getTime() / 86400000 + 2440587.5
  const centuriesSinceJ2000 = (julianDate - 2451545) / 36525
  const gmstDeg =
    280.46061837 +
    360.98564736629 * (julianDate - 2451545) +
    0.000387933 * centuriesSinceJ2000 * centuriesSinceJ2000 -
    (centuriesSinceJ2000 * centuriesSinceJ2000 * centuriesSinceJ2000) / 38710000

  return normalizeDegrees(gmstDeg + longitudeDeg)
}

export function raDecToHorizontalCoordinates(
  raDeg: number,
  decDeg: number,
  observer: ObserverSnapshot,
  astrometry?: ObserverAstrometrySnapshot,
): HorizontalCoordinates {
  const latitudeRad = degreesToRadians(observer.latitudeDeg)
  const declinationRad = degreesToRadians(decDeg)
  const localSiderealTimeDeg = astrometry?.localSiderealTimeDeg
    ?? computeLocalSiderealTimeDeg(observer.longitudeDeg, observer.timestampUtc)
  const hourAngleRad = degreesToRadians(normalizeSignedDegrees(localSiderealTimeDeg - raDeg))
  const sinAltitude =
    Math.sin(declinationRad) * Math.sin(latitudeRad) +
    Math.cos(declinationRad) * Math.cos(latitudeRad) * Math.cos(hourAngleRad)
  const geometricAltitudeDeg = radiansToDegrees(Math.asin(sinAltitude))
  const azimuthFromSouthRad = Math.atan2(
    Math.sin(hourAngleRad),
    Math.cos(hourAngleRad) * Math.sin(latitudeRad) - Math.tan(declinationRad) * Math.cos(latitudeRad),
  )
  const azimuthDeg = normalizeDegrees(radiansToDegrees(azimuthFromSouthRad) + 180)
  const altitudeDeg = applyRefraction(geometricAltitudeDeg, astrometry)

  return {
    altitudeDeg,
    geometricAltitudeDeg,
    azimuthDeg,
    isAboveHorizon: altitudeDeg > 0,
  }
}

export function horizontalToUnitVector(altitudeDeg: number, azimuthDeg: number, astrometry?: ObserverAstrometrySnapshot): UnitVector3 {
  const geometricAltitudeDeg = removeRefraction(altitudeDeg, astrometry)
  const altitudeRad = degreesToRadians(geometricAltitudeDeg)
  const azimuthRad = degreesToRadians(azimuthDeg)
  const radius = Math.cos(altitudeRad)

  return {
    x: Math.sin(azimuthRad) * radius,
    y: Math.sin(altitudeRad),
    z: Math.cos(azimuthRad) * radius,
  }
}

export function horizontalToRaDec(observer: ObserverSnapshot): { raDeg: number; decDeg: number } {
  const astrometry = createObserverAstrometrySnapshot(observer)
  const geometricAltitudeDeg = removeRefraction(observer.centerAltDeg, astrometry)
  const altitudeRad = degreesToRadians(geometricAltitudeDeg)
  const azimuthRad = degreesToRadians(observer.centerAzDeg)
  const latitudeRad = degreesToRadians(observer.latitudeDeg)
  const sinDeclination =
    Math.sin(altitudeRad) * Math.sin(latitudeRad) +
    Math.cos(altitudeRad) * Math.cos(latitudeRad) * Math.cos(azimuthRad)
  const declinationRad = Math.asin(Math.max(-1, Math.min(1, sinDeclination)))
  const hourAngleRad = Math.atan2(
    Math.sin(azimuthRad),
    Math.cos(azimuthRad) * Math.sin(latitudeRad) + Math.tan(altitudeRad) * Math.cos(latitudeRad),
  )
  const localSiderealTimeDeg = astrometry.localSiderealTimeDeg

  return {
    raDeg: normalizeDegrees(localSiderealTimeDeg - radiansToDegrees(hourAngleRad)),
    decDeg: radiansToDegrees(declinationRad),
  }
}

export function raDecToObserverUnitVector(raDeg: number, decDeg: number, observer: ObserverSnapshot) {
  const astrometry = createObserverAstrometrySnapshot(observer)
  const horizontalCoordinates = raDecToHorizontalCoordinates(raDeg, decDeg, observer, astrometry)

  return {
    vector: normalizeVector(horizontalToUnitVector(horizontalCoordinates.altitudeDeg, horizontalCoordinates.azimuthDeg, astrometry)),
    horizontalCoordinates,
  }
}

export function unitVectorToHorizontalCoordinates(vector: UnitVector3): HorizontalCoordinates {
  const normalizedVector = normalizeVector(vector)
  const altitudeDeg = radiansToDegrees(Math.asin(Math.max(-1, Math.min(1, normalizedVector.y))))
  const azimuthDeg = normalizeDegrees(radiansToDegrees(Math.atan2(normalizedVector.x, normalizedVector.z)))

  return {
    altitudeDeg,
    geometricAltitudeDeg: altitudeDeg,
    azimuthDeg,
    isAboveHorizon: altitudeDeg > 0,
  }
}