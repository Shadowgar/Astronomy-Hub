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
}

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

function applyRefraction(geometricAltitudeDeg: number, astrometry?: ObserverAstrometrySnapshot) {
  if (!astrometry?.refraction) {
    return geometricAltitudeDeg
  }
  const { refA, refB } = astrometry.refraction
  if (geometricAltitudeDeg < -1) {
    return geometricAltitudeDeg
  }
  const altitudeRad = degreesToRadians(Math.max(geometricAltitudeDeg, -1))
  const tanArgument = Math.tan(altitudeRad + degreesToRadians(7.31 / (geometricAltitudeDeg + 4.4)))
  if (!Number.isFinite(tanArgument) || tanArgument === 0) {
    return geometricAltitudeDeg
  }
  const correctionArcMinutes = (refA * refB) / tanArgument
  return geometricAltitudeDeg + correctionArcMinutes / 60
}

function removeRefraction(observedAltitudeDeg: number, astrometry?: ObserverAstrometrySnapshot) {
  if (!astrometry?.refraction) {
    return observedAltitudeDeg
  }
  let geometricAltitudeDeg = observedAltitudeDeg
  for (let index = 0; index < 3; index += 1) {
    const corrected = applyRefraction(geometricAltitudeDeg, astrometry)
    geometricAltitudeDeg -= corrected - observedAltitudeDeg
  }
  return geometricAltitudeDeg
}

export function createObserverAstrometrySnapshot(observer: ObserverSnapshot): ObserverAstrometrySnapshot {
  const elevationM = observer.elevationM ?? 0
  const pressureHpa = Math.min(1035, Math.max(120, 1013.25 * Math.exp(-elevationM / 8434.5)))
  return {
    localSiderealTimeDeg: computeLocalSiderealTimeDeg(observer.longitudeDeg, observer.timestampUtc),
    refraction: {
      refA: pressureHpa / 1010,
      refB: 283 / (273 + 15),
    },
  }
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