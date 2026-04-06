import { computeHorizontalCoordinates, computeLocalSiderealTimeDeg } from './astronomy'
import type { SkyEngineObserver, SkyEngineSunState } from './types'

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

function radiansToDegrees(value: number) {
  return (value * 180) / Math.PI
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360
}

function toJulianDate(timestampIso: string) {
  return new Date(timestampIso).getTime() / 86400000 + 2440587.5
}

function computeSolarEquatorialCoordinates(timestampIso: string) {
  const julianDate = toJulianDate(timestampIso)
  const centuriesSinceJ2000 = (julianDate - 2451545) / 36525

  const meanLongitudeDeg = normalizeDegrees(
    280.46646 + centuriesSinceJ2000 * (36000.76983 + 0.0003032 * centuriesSinceJ2000),
  )
  const meanAnomalyDeg =
    357.52911 + centuriesSinceJ2000 * (35999.05029 - 0.0001537 * centuriesSinceJ2000)
  const meanAnomalyRad = degreesToRadians(meanAnomalyDeg)

  const equationOfCenterDeg =
    Math.sin(meanAnomalyRad) * (1.914602 - centuriesSinceJ2000 * (0.004817 + 0.000014 * centuriesSinceJ2000)) +
    Math.sin(2 * meanAnomalyRad) * (0.019993 - 0.000101 * centuriesSinceJ2000) +
    Math.sin(3 * meanAnomalyRad) * 0.000289

  const trueLongitudeDeg = meanLongitudeDeg + equationOfCenterDeg
  const omegaDeg = 125.04 - 1934.136 * centuriesSinceJ2000
  const apparentLongitudeDeg = trueLongitudeDeg - 0.00569 - 0.00478 * Math.sin(degreesToRadians(omegaDeg))

  const meanObliquityDeg =
    23 +
    (26 +
      (21.448 - centuriesSinceJ2000 * (46.815 + centuriesSinceJ2000 * (0.00059 - 0.001813 * centuriesSinceJ2000))) / 60) /
      60
  const correctedObliquityDeg = meanObliquityDeg + 0.00256 * Math.cos(degreesToRadians(omegaDeg))

  const apparentLongitudeRad = degreesToRadians(apparentLongitudeDeg)
  const correctedObliquityRad = degreesToRadians(correctedObliquityDeg)

  const rightAscensionDeg = normalizeDegrees(
    radiansToDegrees(
      Math.atan2(
        Math.cos(correctedObliquityRad) * Math.sin(apparentLongitudeRad),
        Math.cos(apparentLongitudeRad),
      ),
    ),
  )
  const declinationDeg = radiansToDegrees(
    Math.asin(Math.sin(correctedObliquityRad) * Math.sin(apparentLongitudeRad)),
  )

  return {
    rightAscensionHours: rightAscensionDeg / 15,
    declinationDeg,
  }
}

function computeSkyDirection(altitudeDeg: number, azimuthDeg: number) {
  const altitudeRad = degreesToRadians(altitudeDeg)
  const azimuthRad = degreesToRadians(azimuthDeg)
  const horizontalRadius = Math.cos(altitudeRad)

  return {
    x: Math.sin(azimuthRad) * horizontalRadius,
    y: Math.sin(altitudeRad),
    z: Math.cos(azimuthRad) * horizontalRadius,
  }
}

function deriveSunPhaseLabel(altitudeDeg: number): SkyEngineSunState['phaseLabel'] {
  if (altitudeDeg > 10) {
    return 'Daylight'
  }

  if (altitudeDeg > -6) {
    return 'Civil / low sun'
  }

  return 'Night'
}

export function computeSunState(observer: SkyEngineObserver, timestampIso: string): SkyEngineSunState {
  const equatorialCoordinates = computeSolarEquatorialCoordinates(timestampIso)
  const horizontalCoordinates = computeHorizontalCoordinates(
    observer,
    timestampIso,
    equatorialCoordinates.rightAscensionHours,
    equatorialCoordinates.declinationDeg,
  )
  const skyDirection = computeSkyDirection(horizontalCoordinates.altitudeDeg, horizontalCoordinates.azimuthDeg)
  const localSiderealTimeDeg = computeLocalSiderealTimeDeg(observer.longitude, timestampIso)

  return {
    altitudeDeg: horizontalCoordinates.altitudeDeg,
    azimuthDeg: horizontalCoordinates.azimuthDeg,
    isAboveHorizon: horizontalCoordinates.isAboveHorizon,
    phaseLabel: deriveSunPhaseLabel(horizontalCoordinates.altitudeDeg),
    rightAscensionHours: equatorialCoordinates.rightAscensionHours,
    declinationDeg: equatorialCoordinates.declinationDeg,
    localSiderealTimeDeg,
    skyDirection,
    lightDirection: {
      x: -skyDirection.x,
      y: -skyDirection.y,
      z: -skyDirection.z,
    },
  }
}