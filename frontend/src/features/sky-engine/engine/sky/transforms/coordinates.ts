import type { ObserverSnapshot } from '../contracts/observer'

export type UnitVector3 = {
  x: number
  y: number
  z: number
}

export type HorizontalCoordinates = {
  altitudeDeg: number
  azimuthDeg: number
  isAboveHorizon: boolean
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
): HorizontalCoordinates {
  const latitudeRad = degreesToRadians(observer.latitudeDeg)
  const declinationRad = degreesToRadians(decDeg)
  const localSiderealTimeDeg = computeLocalSiderealTimeDeg(observer.longitudeDeg, observer.timestampUtc)
  const hourAngleRad = degreesToRadians(normalizeSignedDegrees(localSiderealTimeDeg - raDeg))
  const sinAltitude =
    Math.sin(declinationRad) * Math.sin(latitudeRad) +
    Math.cos(declinationRad) * Math.cos(latitudeRad) * Math.cos(hourAngleRad)
  const altitudeDeg = radiansToDegrees(Math.asin(sinAltitude))
  const azimuthFromSouthRad = Math.atan2(
    Math.sin(hourAngleRad),
    Math.cos(hourAngleRad) * Math.sin(latitudeRad) - Math.tan(declinationRad) * Math.cos(latitudeRad),
  )
  const azimuthDeg = normalizeDegrees(radiansToDegrees(azimuthFromSouthRad) + 180)

  return {
    altitudeDeg,
    azimuthDeg,
    isAboveHorizon: altitudeDeg > 0,
  }
}

export function horizontalToUnitVector(altitudeDeg: number, azimuthDeg: number): UnitVector3 {
  const altitudeRad = degreesToRadians(altitudeDeg)
  const azimuthRad = degreesToRadians(azimuthDeg)
  const radius = Math.cos(altitudeRad)

  return {
    x: Math.sin(azimuthRad) * radius,
    y: Math.sin(altitudeRad),
    z: Math.cos(azimuthRad) * radius,
  }
}

export function horizontalToRaDec(observer: ObserverSnapshot): { raDeg: number; decDeg: number } {
  const altitudeRad = degreesToRadians(observer.centerAltDeg)
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
  const localSiderealTimeDeg = computeLocalSiderealTimeDeg(observer.longitudeDeg, observer.timestampUtc)

  return {
    raDeg: normalizeDegrees(localSiderealTimeDeg - radiansToDegrees(hourAngleRad)),
    decDeg: radiansToDegrees(declinationRad),
  }
}

export function raDecToObserverUnitVector(raDeg: number, decDeg: number, observer: ObserverSnapshot) {
  const horizontalCoordinates = raDecToHorizontalCoordinates(raDeg, decDeg, observer)

  return {
    vector: normalizeVector(horizontalToUnitVector(horizontalCoordinates.altitudeDeg, horizontalCoordinates.azimuthDeg)),
    horizontalCoordinates,
  }
}

export function unitVectorToHorizontalCoordinates(vector: UnitVector3): HorizontalCoordinates {
  const normalizedVector = normalizeVector(vector)
  const altitudeDeg = radiansToDegrees(Math.asin(Math.max(-1, Math.min(1, normalizedVector.y))))
  const azimuthDeg = normalizeDegrees(radiansToDegrees(Math.atan2(normalizedVector.x, normalizedVector.z)))

  return {
    altitudeDeg,
    azimuthDeg,
    isAboveHorizon: altitudeDeg > 0,
  }
}