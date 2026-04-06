import type {
  SkyEngineCelestialSourceObject,
  SkyEngineObserver,
  SkyEngineSceneObject,
} from './types'

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

function toJulianDate(timestampIso: string) {
  return new Date(timestampIso).getTime() / 86400000 + 2440587.5
}

export function computeLocalSiderealTimeDeg(longitudeDeg: number, timestampIso: string) {
  const julianDate = toJulianDate(timestampIso)
  const centuriesSinceJ2000 = (julianDate - 2451545) / 36525
  const gmstDeg =
    280.46061837 +
    360.98564736629 * (julianDate - 2451545) +
    0.000387933 * centuriesSinceJ2000 * centuriesSinceJ2000 -
    (centuriesSinceJ2000 * centuriesSinceJ2000 * centuriesSinceJ2000) / 38710000

  return normalizeDegrees(gmstDeg + longitudeDeg)
}

export function computeHorizontalCoordinates(
  observer: SkyEngineObserver,
  timestampIso: string,
  rightAscensionHours: number,
  declinationDeg: number,
) {
  const latitudeRad = degreesToRadians(observer.latitude)
  const declinationRad = degreesToRadians(declinationDeg)
  const localSiderealTimeDeg = computeLocalSiderealTimeDeg(observer.longitude, timestampIso)
  const hourAngleDeg = normalizeSignedDegrees(localSiderealTimeDeg - rightAscensionHours * 15)
  const hourAngleRad = degreesToRadians(hourAngleDeg)

  // Standard equatorial-to-horizontal conversion for a fixed observer and timestamp.
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
    hourAngleDeg,
    isAboveHorizon: altitudeDeg > 0,
  }
}

export function computeRealSkySceneObjects(
  observer: SkyEngineObserver,
  timestampIso: string,
  catalog: readonly SkyEngineCelestialSourceObject[],
): readonly SkyEngineSceneObject[] {
  return catalog.map((object) => {
    const horizontalCoordinates = computeHorizontalCoordinates(
      observer,
      timestampIso,
      object.rightAscensionHours,
      object.declinationDeg,
    )

    return {
      id: object.id,
      name: object.name,
      type: object.type,
      altitudeDeg: horizontalCoordinates.altitudeDeg,
      azimuthDeg: horizontalCoordinates.azimuthDeg,
      magnitude: object.magnitude,
      colorHex: object.colorHex,
      summary: object.summary,
      description: object.description,
      constellation: object.constellation,
      source: 'computed_real_sky',
      truthNote:
        'Computed from fixed-star right ascension and declination for the ORAS observer and explicit scene timestamp in this slice.',
      rightAscensionHours: object.rightAscensionHours,
      declinationDeg: object.declinationDeg,
      timestampIso,
      isAboveHorizon: horizontalCoordinates.isAboveHorizon,
    }
  })
}