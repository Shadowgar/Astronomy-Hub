import type {
  SkyEngineCelestialSourceObject,
  SkyEngineDeepSkyClass,
  SkyEngineGuidanceTarget,
  SkyEngineObserver,
  SkyEngineSceneObject,
  SkyEngineTrajectorySample,
} from './types'
import type { BackendSatelliteSceneObject, BackendSkySceneStarObject } from '../scene/contracts'
import { computeLocalSiderealTimeDeg } from './engine/sky/transforms/coordinates'
import { MINOR_PLANETS_CATALOG } from './data/minorPlanetsCatalog'
import { COMETS_CATALOG } from './data/cometsCatalog'
import { METEOR_SHOWERS_CATALOG } from './data/meteorShowersCatalog'

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

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

const EARTH_RADIUS_KM = 6378.14
const MOON_RADIUS_KM = 1737.4
const AU_IN_KM = 149597870.7
const AU_PER_LIGHT_DAY = 173.1446326846693
const MIN_DISTANCE_AU = 1e-6
const SATURN_POLE = {
  rightAscensionHours: 40.589 / 15,
  declinationDeg: 83.537,
} as const
const STELLARIUM_PLANET_VISUAL_ELEMENTS = {
  mercury: { angularSizeArcsecAtOneAu: 6.74, magnitudeAtOneAu: -0.36, phaseA: 3.8, phaseB: -2.73, phaseC: 2 },
  venus: { angularSizeArcsecAtOneAu: 16.92, magnitudeAtOneAu: -4.29, phaseA: 0.09, phaseB: 2.39, phaseC: -0.65 },
  mars: { angularSizeArcsecAtOneAu: 9.36, magnitudeAtOneAu: -1.52, phaseA: 1.6, phaseB: 0, phaseC: 0 },
  jupiter: { angularSizeArcsecAtOneAu: 196.74, magnitudeAtOneAu: -9.25, phaseA: 0.5, phaseB: 0, phaseC: 0 },
  saturn: { angularSizeArcsecAtOneAu: 165.6, magnitudeAtOneAu: -8.88, phaseA: 4.4, phaseB: 0, phaseC: 0 },
  uranus: { angularSizeArcsecAtOneAu: 70.481, magnitudeAtOneAu: -7.19, phaseA: 0.28, phaseB: 0, phaseC: 0 },
  neptune: { angularSizeArcsecAtOneAu: 68.294, magnitudeAtOneAu: -6.87, phaseA: 0, phaseB: 0, phaseC: 0 },
} as const

export function toJulianDate(timestampIso: string) {
  return new Date(timestampIso).getTime() / 86400000 + 2440587.5
}

function offsetTimestampByHours(timestampIso: string, hourOffset: number) {
  return new Date(new Date(timestampIso).getTime() + hourOffset * 60 * 60 * 1000).toISOString()
}

function offsetTimestampBySeconds(timestampIso: string, secondOffset: number) {
  return new Date(new Date(timestampIso).getTime() + secondOffset * 1000).toISOString()
}

function normalizeRightAscensionHours(value: number) {
  return ((value % 24) + 24) % 24
}

function clampDeclinationDeg(value: number) {
  return clamp(value, -90, 90)
}

function getDayOffsetFromTimestamp(baseIso: string, timestampIso: string) {
  const baseTimeMs = new Date(baseIso).getTime()
  const currentTimeMs = new Date(timestampIso).getTime()
  if (!Number.isFinite(baseTimeMs) || !Number.isFinite(currentTimeMs)) {
    return 0
  }
  return (currentTimeMs - baseTimeMs) / 86_400_000
}

function parseTleMeanMotionRevsPerDay(tleLine2: string | undefined) {
  if (!tleLine2) {
    return null
  }
  const fields = tleLine2.trim().split(/\s+/)
  const meanMotionRaw = fields[fields.length - 1]
  if (!meanMotionRaw) {
    return null
  }
  const meanMotion = Number.parseFloat(meanMotionRaw)
  if (!Number.isFinite(meanMotion) || meanMotion <= 0) {
    return null
  }
  return meanMotion
}

function parseTleInclinationDeg(tleLine2: string | undefined) {
  if (!tleLine2) {
    return null
  }
  const fields = tleLine2.trim().split(/\s+/)
  if (fields.length < 3) {
    return null
  }
  const inclinationDeg = Number.parseFloat(fields[2])
  if (!Number.isFinite(inclinationDeg)) {
    return null
  }
  return inclinationDeg
}

function resolveMinorPlanetModeledMagnitude(
  absoluteMagnitude: number,
  slopeParameterG: number,
  baseMagnitude: number,
  dayOffset: number,
) {
  // HG-compatible surrogate: we don't have full heliocentric/geocentric distances in local inputs.
  const oppositionPhase = (1 - Math.cos(dayOffset * (2 * Math.PI / 380))) * 0.5
  const phaseTerm = (1 - slopeParameterG) * oppositionPhase * 1.1
  return Math.max(-2, baseMagnitude + phaseTerm + (absoluteMagnitude - baseMagnitude) * 0.06)
}

function resolveCometModeledMagnitude(
  baseMagnitude: number,
  orbitType: 'elliptic' | 'parabolic' | 'hyperbolic',
  dayOffset: number,
) {
  const perihelionDistanceAu = Math.max(0.35, 1 + (Math.abs(dayOffset) / 180))
  const observerDistanceAu = Math.max(0.3, 0.7 + (Math.abs(dayOffset) / 220))
  const k = orbitType === 'elliptic' ? 7 : orbitType === 'parabolic' ? 10 : 12
  return baseMagnitude + 5 * Math.log10(observerDistanceAu) + k * Math.log10(perihelionDistanceAu)
}

function solveKeplerDegrees(meanAnomalyDeg: number, eccentricity: number) {
  let eccentricAnomalyDeg = meanAnomalyDeg + radiansToDegrees(eccentricity * Math.sin(degreesToRadians(meanAnomalyDeg)))

  for (let index = 0; index < 6; index += 1) {
    const eccentricAnomalyRad = degreesToRadians(eccentricAnomalyDeg)
    const delta =
      (eccentricAnomalyDeg - radiansToDegrees(eccentricity * Math.sin(eccentricAnomalyRad)) - meanAnomalyDeg) /
      (1 - eccentricity * Math.cos(eccentricAnomalyRad))
    eccentricAnomalyDeg -= delta
  }

  return eccentricAnomalyDeg
}

export function computeSolarEquatorialCoordinates(timestampIso: string) {
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
    apparentLongitudeDeg,
  }
}

type Vector3Tuple = readonly [number, number, number]

function dot(left: Vector3Tuple, right: Vector3Tuple) {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2]
}

function cross(left: Vector3Tuple, right: Vector3Tuple): Vector3Tuple {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ]
}

function vectorLength(vector: Vector3Tuple) {
  return Math.hypot(vector[0], vector[1], vector[2])
}

function normalizeVector(vector: Vector3Tuple): Vector3Tuple {
  const length = vectorLength(vector)

  if (length <= 1e-6) {
    return [0, 0, 0]
  }

  return [vector[0] / length, vector[1] / length, vector[2] / length]
}

function vectorFromEquatorial(rightAscensionHours: number, declinationDeg: number): Vector3Tuple {
  const rightAscensionRad = degreesToRadians(rightAscensionHours * 15)
  const declinationRad = degreesToRadians(declinationDeg)
  const cosDeclination = Math.cos(declinationRad)

  return [
    Math.cos(rightAscensionRad) * cosDeclination,
    Math.sin(rightAscensionRad) * cosDeclination,
    Math.sin(declinationRad),
  ]
}

function resolveSkyTangentBasis(rightAscensionHours: number, declinationDeg: number) {
  const rightAscensionRad = degreesToRadians(rightAscensionHours * 15)
  const declinationRad = degreesToRadians(declinationDeg)

  return {
    east: normalizeVector([-
      Math.sin(rightAscensionRad),
      Math.cos(rightAscensionRad),
      0,
    ]),
    north: normalizeVector([-
      Math.cos(rightAscensionRad) * Math.sin(declinationRad),
      -Math.sin(rightAscensionRad) * Math.sin(declinationRad),
      Math.cos(declinationRad),
    ]),
  }
}

function computeBrightLimbAngleDeg(
  targetRightAscensionHours: number,
  targetDeclinationDeg: number,
  sunRightAscensionHours: number,
  sunDeclinationDeg: number,
) {
  const sunRightAscensionRad = degreesToRadians(sunRightAscensionHours * 15)
  const sunDeclinationRad = degreesToRadians(sunDeclinationDeg)
  const targetRightAscensionRad = degreesToRadians(targetRightAscensionHours * 15)
  const targetDeclinationRad = degreesToRadians(targetDeclinationDeg)
  const rightAscensionDiffRad = sunRightAscensionRad - targetRightAscensionRad

  return radiansToDegrees(
    Math.atan2(
      Math.cos(sunDeclinationRad) * Math.sin(rightAscensionDiffRad),
      Math.sin(sunDeclinationRad) * Math.cos(targetDeclinationRad) -
        Math.cos(sunDeclinationRad) * Math.sin(targetDeclinationRad) * Math.cos(rightAscensionDiffRad),
    ),
  )
}

function computeSaturnRingVisualState(rightAscensionHours: number, declinationDeg: number) {
  const viewVector = vectorFromEquatorial(rightAscensionHours, declinationDeg)
  const poleVector = vectorFromEquatorial(SATURN_POLE.rightAscensionHours, SATURN_POLE.declinationDeg)
  const tangentBasis = resolveSkyTangentBasis(rightAscensionHours, declinationDeg)
  const ringMajorAxis = normalizeVector(cross(poleVector, viewVector))
  const ringOpening = Math.abs(dot(poleVector, viewVector))
  const ringTiltAngle = Math.atan2(dot(ringMajorAxis, tangentBasis.north), dot(ringMajorAxis, tangentBasis.east))
  const ringMagnitudeAdjustment = (-2.6 + 1.25 * ringOpening) * ringOpening

  return {
    ringOpening,
    ringTiltAngle,
    ringBrightnessGain: Math.pow(10, -0.4 * ringMagnitudeAdjustment),
  }
}

function deriveMoonPhaseLabel(illuminationFraction: number, waxing: boolean) {
  if (illuminationFraction <= 0.03) {
    return 'New Moon'
  }

  if (illuminationFraction >= 0.97) {
    return 'Full Moon'
  }

  if (illuminationFraction >= 0.47 && illuminationFraction <= 0.53) {
    return waxing ? 'First Quarter' : 'Last Quarter'
  }

  if (illuminationFraction < 0.5) {
    return waxing ? 'Waxing Crescent' : 'Waning Crescent'
  }

  return waxing ? 'Waxing Gibbous' : 'Waning Gibbous'
}

function computeMoonEquatorialCoordinates(timestampIso: string) {
  const daysSinceJ2000 = toJulianDate(timestampIso) - 2451543.5
  const nodeLongitudeDeg = normalizeDegrees(125.1228 - 0.0529538083 * daysSinceJ2000)
  const periapsisDeg = normalizeDegrees(318.0634 + 0.1643573223 * daysSinceJ2000)
  const semiMajorAxis = 60.2666
  const eccentricity = 0.0549
  const meanAnomalyDeg = normalizeDegrees(115.3654 + 13.0649929509 * daysSinceJ2000)
  const eccentricAnomalyDeg = solveKeplerDegrees(meanAnomalyDeg, eccentricity)
  const eccentricAnomalyRad = degreesToRadians(eccentricAnomalyDeg)
  const xv = semiMajorAxis * (Math.cos(eccentricAnomalyRad) - eccentricity)
  const yv = semiMajorAxis * (Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(eccentricAnomalyRad))
  const orbitalDistanceEarthRadii = Math.hypot(xv, yv)
  let trueAnomalyDeg = radiansToDegrees(Math.atan2(yv, xv))

  const meanLongitudeDeg = normalizeDegrees(nodeLongitudeDeg + periapsisDeg + meanAnomalyDeg)
  const solarCoordinates = computeSolarEquatorialCoordinates(timestampIso)
  const solarLongitudeDeg = solarCoordinates.apparentLongitudeDeg
  const meanElongationDeg = normalizeSignedDegrees(meanLongitudeDeg - solarLongitudeDeg)
  const argumentOfLatitudeDeg = normalizeSignedDegrees(meanLongitudeDeg - nodeLongitudeDeg)
  const solarMeanAnomalyDeg = normalizeDegrees(
    356.047 + 0.9856002585 * daysSinceJ2000,
  )

  trueAnomalyDeg +=
    -1.274 * Math.sin(degreesToRadians(meanAnomalyDeg - 2 * meanElongationDeg)) +
    0.658 * Math.sin(degreesToRadians(2 * meanElongationDeg)) -
    0.186 * Math.sin(degreesToRadians(solarMeanAnomalyDeg)) -
    0.059 * Math.sin(degreesToRadians(2 * meanAnomalyDeg - 2 * meanElongationDeg)) -
    0.057 * Math.sin(degreesToRadians(meanAnomalyDeg - 2 * meanElongationDeg + solarMeanAnomalyDeg)) +
    0.053 * Math.sin(degreesToRadians(meanAnomalyDeg + 2 * meanElongationDeg)) +
    0.046 * Math.sin(degreesToRadians(2 * meanElongationDeg - solarMeanAnomalyDeg)) +
    0.041 * Math.sin(degreesToRadians(meanAnomalyDeg - solarMeanAnomalyDeg)) -
    0.035 * Math.sin(degreesToRadians(meanElongationDeg)) -
    0.031 * Math.sin(degreesToRadians(meanAnomalyDeg + solarMeanAnomalyDeg)) -
    0.015 * Math.sin(degreesToRadians(2 * argumentOfLatitudeDeg - 2 * meanElongationDeg)) +
    0.011 * Math.sin(degreesToRadians(meanAnomalyDeg - 4 * meanElongationDeg))

  const latitudeDeg =
    -0.173 * Math.sin(degreesToRadians(argumentOfLatitudeDeg - 2 * meanElongationDeg)) -
    0.055 * Math.sin(degreesToRadians(meanAnomalyDeg - argumentOfLatitudeDeg - 2 * meanElongationDeg)) -
    0.046 * Math.sin(degreesToRadians(meanAnomalyDeg + argumentOfLatitudeDeg - 2 * meanElongationDeg)) +
    0.033 * Math.sin(degreesToRadians(argumentOfLatitudeDeg + 2 * meanElongationDeg)) +
    0.017 * Math.sin(degreesToRadians(2 * meanAnomalyDeg + argumentOfLatitudeDeg))
  const correctedDistanceEarthRadii = orbitalDistanceEarthRadii
    - 0.58 * Math.cos(degreesToRadians(meanAnomalyDeg - 2 * meanElongationDeg))
    - 0.46 * Math.cos(degreesToRadians(2 * meanElongationDeg))

  const trueLongitudeDeg = normalizeDegrees(trueAnomalyDeg + periapsisDeg)
  const eclipticLongitudeDeg = trueLongitudeDeg
  const eclipticLatitudeDeg = latitudeDeg
  const obliquityDeg = 23.4393 - 3.563e-7 * daysSinceJ2000
  const obliquityRad = degreesToRadians(obliquityDeg)
  const eclipticLongitudeRad = degreesToRadians(eclipticLongitudeDeg)
  const eclipticLatitudeRad = degreesToRadians(eclipticLatitudeDeg)

  const equatorialX = Math.cos(eclipticLongitudeRad) * Math.cos(eclipticLatitudeRad)
  const equatorialY =
    Math.sin(eclipticLongitudeRad) * Math.cos(eclipticLatitudeRad) * Math.cos(obliquityRad) -
    Math.sin(eclipticLatitudeRad) * Math.sin(obliquityRad)
  const equatorialZ =
    Math.sin(eclipticLongitudeRad) * Math.cos(eclipticLatitudeRad) * Math.sin(obliquityRad) +
    Math.sin(eclipticLatitudeRad) * Math.cos(obliquityRad)

  const rightAscensionDeg = normalizeDegrees(radiansToDegrees(Math.atan2(equatorialY, equatorialX)))
  const declinationDeg = radiansToDegrees(Math.atan2(equatorialZ, Math.hypot(equatorialX, equatorialY)))
  const rightAscensionHours = rightAscensionDeg / 15

  const sunRightAscensionRad = degreesToRadians(solarCoordinates.rightAscensionHours * 15)
  const sunDeclinationRad = degreesToRadians(solarCoordinates.declinationDeg)
  const moonRightAscensionRad = degreesToRadians(rightAscensionDeg)
  const moonDeclinationRad = degreesToRadians(declinationDeg)
  const rightAscensionDiffRad = sunRightAscensionRad - moonRightAscensionRad
  const elongationRad = Math.acos(
    Math.sin(sunDeclinationRad) * Math.sin(moonDeclinationRad) +
      Math.cos(sunDeclinationRad) * Math.cos(moonDeclinationRad) * Math.cos(rightAscensionDiffRad),
  )
  const illuminationFraction = clamp01((1 - Math.cos(elongationRad)) / 2)
  const waxing = normalizeDegrees(eclipticLongitudeDeg - solarLongitudeDeg) < 180
  const brightLimbAngleDeg = radiansToDegrees(
    Math.atan2(
      Math.cos(sunDeclinationRad) * Math.sin(rightAscensionDiffRad),
      Math.sin(sunDeclinationRad) * Math.cos(moonDeclinationRad) -
        Math.cos(sunDeclinationRad) * Math.sin(moonDeclinationRad) * Math.cos(rightAscensionDiffRad),
    ),
  )

  return {
    rightAscensionHours,
    declinationDeg,
    illuminationFraction,
    brightLimbAngleDeg,
    distanceAu: (correctedDistanceEarthRadii * EARTH_RADIUS_KM) / AU_IN_KM,
    phaseLabel: deriveMoonPhaseLabel(illuminationFraction, waxing),
    waxing,
  }
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

export { computeLocalSiderealTimeDeg }

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
      trackingMode: 'fixed_equatorial',
      truthNote:
        'Computed from fixed-star right ascension and declination for the ORAS observer and explicit scene timestamp in this slice.',
      rightAscensionHours: object.rightAscensionHours,
      declinationDeg: object.declinationDeg,
      colorIndexBV: object.colorIndexBV,
      timestampIso,
      isAboveHorizon: horizontalCoordinates.isAboveHorizon,
    }
  })
}

export function computeBackendStarSceneObjects(
  observer: SkyEngineObserver,
  timestampIso: string,
  stars: readonly BackendSkySceneStarObject[],
): readonly SkyEngineSceneObject[] {
  return stars.map((star) => {
    const horizontalCoordinates = computeHorizontalCoordinates(
      observer,
      timestampIso,
      star.right_ascension,
      star.declination,
    )

    return {
      id: star.id,
      name: star.name,
      type: 'star',
      altitudeDeg: horizontalCoordinates.altitudeDeg,
      azimuthDeg: horizontalCoordinates.azimuthDeg,
      magnitude: star.magnitude,
      colorHex: '#ffffff',
      summary: `${star.name} positioned from backend right ascension and declination for the active observer and scene time.`,
      description: 'This star comes from the backend sky scene contract and is projected from equatorial coordinates into the active sky view.',
      truthNote: 'Backend star contract drives this object. Frontend position is computed from observer, timestamp, right ascension, and declination.',
      source: 'backend_star_catalog',
      trackingMode: 'fixed_equatorial',
      rightAscensionHours: star.right_ascension,
      declinationDeg: star.declination,
      colorIndexBV: star.color_index ?? undefined,
      timestampIso,
      isAboveHorizon: horizontalCoordinates.isAboveHorizon,
    }
  })
}

export function computeMoonSceneObject(observer: SkyEngineObserver, timestampIso: string): SkyEngineSceneObject {
  const equatorialCoordinates = computeMoonEquatorialCoordinates(timestampIso)
  const horizontalCoordinates = computeHorizontalCoordinates(
    observer,
    timestampIso,
    equatorialCoordinates.rightAscensionHours,
    equatorialCoordinates.declinationDeg,
  )
  const sunEquatorial = computeSolarEquatorialCoordinates(timestampIso)
  const moonRightAscensionRad = degreesToRadians(equatorialCoordinates.rightAscensionHours * 15)
  const moonDeclinationRad = degreesToRadians(equatorialCoordinates.declinationDeg)
  const sunRightAscensionRad = degreesToRadians(sunEquatorial.rightAscensionHours * 15)
  const sunDeclinationRad = degreesToRadians(sunEquatorial.declinationDeg)
  const rightAscensionDiffRad = sunRightAscensionRad - moonRightAscensionRad
  const elongationRad = Math.acos(clamp(
    Math.sin(sunDeclinationRad) * Math.sin(moonDeclinationRad) +
      Math.cos(sunDeclinationRad) * Math.cos(moonDeclinationRad) * Math.cos(rightAscensionDiffRad),
    -1,
    1,
  ))
  const moonDistanceAu = Math.max(equatorialCoordinates.distanceAu, MIN_DISTANCE_AU)
  const moonAngularDiameterDeg = radiansToDegrees(2 * Math.asin(clamp(MOON_RADIUS_KM / (moonDistanceAu * AU_IN_KM), -1, 1)))
  const moonMagnitude =
    -12.7 +
    2.5 * (Math.log10(Math.PI) - Math.log10((Math.PI / 2) * (1 + 1e-6 - Math.cos(elongationRad)))) +
    5 * Math.log10(moonDistanceAu / 0.0025)

  return {
    id: 'sky-real-moon',
    name: 'Moon',
    type: 'moon',
    altitudeDeg: horizontalCoordinates.altitudeDeg,
    azimuthDeg: horizontalCoordinates.azimuthDeg,
    magnitude: moonMagnitude,
    colorHex: '#f8f1d7',
    summary: `${equatorialCoordinates.phaseLabel} moon computed for the active observer and scene timestamp.`,
    description:
      'The moon uses a timestamp-driven ephemeris, distinct billboard rendering, and phase-aware shading so it stays visually separate from fixed stars.',
    truthNote:
      'Computed from a bounded lunar ephemeris approximation for the current observer and scene timestamp. Motion and phase change with time instead of using seeded placement.',
    source: 'computed_ephemeris',
    trackingMode: 'lunar_ephemeris',
    rightAscensionHours: equatorialCoordinates.rightAscensionHours,
    declinationDeg: equatorialCoordinates.declinationDeg,
    timestampIso,
    apparentSizeDeg: moonAngularDiameterDeg,
    illuminationFraction: equatorialCoordinates.illuminationFraction,
    brightLimbAngleDeg: equatorialCoordinates.brightLimbAngleDeg,
    phaseLabel: equatorialCoordinates.phaseLabel,
    waxing: equatorialCoordinates.waxing,
    isAboveHorizon: horizontalCoordinates.isAboveHorizon,
  }
}

interface OrbitalElements {
  readonly ascendingNodeDeg: number
  readonly inclinationDeg: number
  readonly argumentOfPerihelionDeg: number
  readonly semiMajorAxisAu: number
  readonly eccentricity: number
  readonly meanAnomalyDeg: number
}

interface PlanetDefinitionInternal {
  readonly id: string
  readonly name: string
  readonly colorHex: string
  readonly summary: string
  readonly description: string
  readonly visualElements: {
    readonly angularSizeArcsecAtOneAu: number
    readonly magnitudeAtOneAu: number
    readonly phaseA: number
    readonly phaseB: number
    readonly phaseC: number
  }
  readonly resolveElements: (daysSinceJ2000: number) => OrbitalElements
}

interface DeepSkyDefinitionInternal {
  readonly id: string
  readonly name: string
  readonly rightAscensionHours: number
  readonly declinationDeg: number
  readonly magnitude: number
  readonly apparentSizeDeg: number
  readonly deepSkyClass: SkyEngineDeepSkyClass
  readonly orientationDeg: number
  readonly majorAxis: number
  readonly minorAxis: number
  readonly colorHex: string
  readonly constellation: string
  readonly summary: string
  readonly description: string
}

function resolveOrbitalPosition(elements: OrbitalElements) {
  const eccentricAnomalyDeg = solveKeplerDegrees(elements.meanAnomalyDeg, elements.eccentricity)
  const eccentricAnomalyRad = degreesToRadians(eccentricAnomalyDeg)
  const xv = elements.semiMajorAxisAu * (Math.cos(eccentricAnomalyRad) - elements.eccentricity)
  const yv = elements.semiMajorAxisAu * Math.sqrt(1 - elements.eccentricity * elements.eccentricity) * Math.sin(eccentricAnomalyRad)
  const trueAnomalyDeg = radiansToDegrees(Math.atan2(yv, xv))
  const radiusAu = Math.hypot(xv, yv)
  const ascendingNodeRad = degreesToRadians(elements.ascendingNodeDeg)
  const inclinationRad = degreesToRadians(elements.inclinationDeg)
  const perihelionRad = degreesToRadians(elements.argumentOfPerihelionDeg + trueAnomalyDeg)

  return {
    x: radiusAu * (Math.cos(ascendingNodeRad) * Math.cos(perihelionRad) - Math.sin(ascendingNodeRad) * Math.sin(perihelionRad) * Math.cos(inclinationRad)),
    y: radiusAu * (Math.sin(ascendingNodeRad) * Math.cos(perihelionRad) + Math.cos(ascendingNodeRad) * Math.sin(perihelionRad) * Math.cos(inclinationRad)),
    z: radiusAu * Math.sin(perihelionRad) * Math.sin(inclinationRad),
    distanceAu: radiusAu,
  }
}

const SKY_ENGINE_PLANET_DEFINITIONS: readonly PlanetDefinitionInternal[] = [
  {
    id: 'sky-planet-mercury',
    name: 'Mercury',
    colorHex: '#cfc7b8',
    summary: 'Inner planet computed from a timestamp-driven orbital model with light-time correction.',
    description: 'Mercury uses a higher-fidelity planetary ephemeris approximation and dynamic brightness tied to geometry.',
    visualElements: STELLARIUM_PLANET_VISUAL_ELEMENTS.mercury,
    resolveElements: (daysSinceJ2000) => ({
      ascendingNodeDeg: 48.3313 + 3.24587e-5 * daysSinceJ2000,
      inclinationDeg: 7.0047 + 5e-8 * daysSinceJ2000,
      argumentOfPerihelionDeg: 29.1241 + 1.01444e-5 * daysSinceJ2000,
      semiMajorAxisAu: 0.387098,
      eccentricity: 0.205635 + 5.59e-10 * daysSinceJ2000,
      meanAnomalyDeg: normalizeDegrees(168.6562 + 4.0923344368 * daysSinceJ2000),
    }),
  },
  {
    id: 'sky-planet-venus',
    name: 'Venus',
    colorHex: '#f4e4c1',
    summary: 'Bright inner planet computed from a timestamp-driven orbital model with light-time correction.',
    description: 'Venus is rendered through the dedicated planet renderer with dynamic brightness tied to orbital geometry.',
    visualElements: STELLARIUM_PLANET_VISUAL_ELEMENTS.venus,
    resolveElements: (daysSinceJ2000) => ({
      ascendingNodeDeg: 76.6799 + 2.4659e-5 * daysSinceJ2000,
      inclinationDeg: 3.3946 + 2.75e-8 * daysSinceJ2000,
      argumentOfPerihelionDeg: 54.891 + 1.38374e-5 * daysSinceJ2000,
      semiMajorAxisAu: 0.72333,
      eccentricity: 0.006773 - 1.302e-9 * daysSinceJ2000,
      meanAnomalyDeg: normalizeDegrees(48.0052 + 1.6021302244 * daysSinceJ2000),
    }),
  },
  {
    id: 'sky-planet-mars',
    name: 'Mars',
    colorHex: '#e19972',
    summary: 'Outer planet computed from a timestamp-driven orbital model with light-time correction.',
    description: 'Mars uses geometry-driven brightness and apparent size, improving runtime planetary fidelity.',
    visualElements: STELLARIUM_PLANET_VISUAL_ELEMENTS.mars,
    resolveElements: (daysSinceJ2000) => ({
      ascendingNodeDeg: 49.5574 + 2.11081e-5 * daysSinceJ2000,
      inclinationDeg: 1.8497 - 1.78e-8 * daysSinceJ2000,
      argumentOfPerihelionDeg: 286.5016 + 2.92961e-5 * daysSinceJ2000,
      semiMajorAxisAu: 1.523688,
      eccentricity: 0.093405 + 2.516e-9 * daysSinceJ2000,
      meanAnomalyDeg: normalizeDegrees(18.6021 + 0.5240207766 * daysSinceJ2000),
    }),
  },
  {
    id: 'sky-planet-jupiter',
    name: 'Jupiter',
    colorHex: '#d9b186',
    summary: 'Gas giant computed from a timestamp-driven orbital model with light-time correction.',
    description: 'Jupiter now uses dynamic apparent magnitude and disc size tied to observer/solar geometry.',
    visualElements: STELLARIUM_PLANET_VISUAL_ELEMENTS.jupiter,
    resolveElements: (daysSinceJ2000) => ({
      ascendingNodeDeg: 100.4542 + 2.76854e-5 * daysSinceJ2000,
      inclinationDeg: 1.303 - 1.557e-7 * daysSinceJ2000,
      argumentOfPerihelionDeg: 273.8777 + 1.64505e-5 * daysSinceJ2000,
      semiMajorAxisAu: 5.20256,
      eccentricity: 0.048498 + 4.469e-9 * daysSinceJ2000,
      meanAnomalyDeg: normalizeDegrees(19.895 + 0.0830853001 * daysSinceJ2000),
    }),
  },
  {
    id: 'sky-planet-saturn',
    name: 'Saturn',
    colorHex: '#e2cf9c',
    summary: 'Ringed gas giant computed from a timestamp-driven orbital model with light-time correction.',
    description: 'Saturn now uses geometry-driven apparent brightness and size aligned with Stellarium visual elements.',
    visualElements: STELLARIUM_PLANET_VISUAL_ELEMENTS.saturn,
    resolveElements: (daysSinceJ2000) => ({
      ascendingNodeDeg: 113.6634 + 2.3898e-5 * daysSinceJ2000,
      inclinationDeg: 2.4886 - 1.081e-7 * daysSinceJ2000,
      argumentOfPerihelionDeg: 339.3939 + 2.97661e-5 * daysSinceJ2000,
      semiMajorAxisAu: 9.55475,
      eccentricity: 0.055546 - 9.499e-9 * daysSinceJ2000,
      meanAnomalyDeg: normalizeDegrees(316.967 + 0.0334442282 * daysSinceJ2000),
    }),
  },
  {
    id: 'sky-planet-uranus',
    name: 'Uranus',
    colorHex: '#9fd4dc',
    summary: 'Ice giant computed from a timestamp-driven orbital model with light-time correction.',
    description: 'Uranus uses dynamic geometry-driven apparent brightness and disc size in the object runtime.',
    visualElements: STELLARIUM_PLANET_VISUAL_ELEMENTS.uranus,
    resolveElements: (daysSinceJ2000) => ({
      ascendingNodeDeg: 74.0005 + 1.3978e-5 * daysSinceJ2000,
      inclinationDeg: 0.7733 + 1.9e-8 * daysSinceJ2000,
      argumentOfPerihelionDeg: 96.6612 + 3.0565e-5 * daysSinceJ2000,
      semiMajorAxisAu: 19.18171 - 1.55e-8 * daysSinceJ2000,
      eccentricity: 0.047318 + 7.45e-9 * daysSinceJ2000,
      meanAnomalyDeg: normalizeDegrees(142.5905 + 0.011725806 * daysSinceJ2000),
    }),
  },
  {
    id: 'sky-planet-neptune',
    name: 'Neptune',
    colorHex: '#7697d8',
    summary: 'Ice giant computed from a timestamp-driven orbital model with light-time correction.',
    description: 'Neptune uses dynamic geometry-driven apparent brightness and disc size in the object runtime.',
    visualElements: STELLARIUM_PLANET_VISUAL_ELEMENTS.neptune,
    resolveElements: (daysSinceJ2000) => ({
      ascendingNodeDeg: 131.7806 + 3.0173e-5 * daysSinceJ2000,
      inclinationDeg: 1.77 - 2.55e-7 * daysSinceJ2000,
      argumentOfPerihelionDeg: 272.8461 - 6.027e-6 * daysSinceJ2000,
      semiMajorAxisAu: 30.05826 + 3.313e-8 * daysSinceJ2000,
      eccentricity: 0.008606 + 2.15e-9 * daysSinceJ2000,
      meanAnomalyDeg: normalizeDegrees(260.2471 + 0.005995147 * daysSinceJ2000),
    }),
  },
] as const

const SKY_ENGINE_DEEP_SKY_DEFINITIONS: readonly DeepSkyDefinitionInternal[] = [
  {
    id: 'sky-dso-m31',
    name: 'Andromeda Galaxy',
    rightAscensionHours: 0.712,
    declinationDeg: 41.269,
    magnitude: 3.44,
    apparentSizeDeg: 3.1,
    deepSkyClass: 'galaxy',
    orientationDeg: 35,
    majorAxis: 3.1,
    minorAxis: 1,
    colorHex: '#a9c7ff',
    constellation: 'Andromeda',
    summary: 'Nearest major spiral galaxy included as a minimal deep-sky activation target.',
    description: 'A bounded built-in deep-sky seed entry used to activate the dedicated DSO runtime path.',
  },
  {
    id: 'sky-dso-m42',
    name: 'Orion Nebula',
    rightAscensionHours: 5.591,
    declinationDeg: -5.45,
    magnitude: 4,
    apparentSizeDeg: 1.1,
    deepSkyClass: 'nebula',
    orientationDeg: 52,
    majorAxis: 1.1,
    minorAxis: 0.72,
    colorHex: '#8dc8ff',
    constellation: 'Orion',
    summary: 'Bright emission nebula included as a minimal deep-sky activation target.',
    description: 'A bounded built-in deep-sky seed entry used to activate the dedicated DSO runtime path.',
  },
  {
    id: 'sky-dso-m13',
    name: 'Hercules Globular Cluster',
    rightAscensionHours: 16.695,
    declinationDeg: 36.467,
    magnitude: 5.8,
    apparentSizeDeg: 0.28,
    deepSkyClass: 'cluster',
    orientationDeg: 0,
    majorAxis: 0.28,
    minorAxis: 0.28,
    colorHex: '#d9d2ff',
    constellation: 'Hercules',
    summary: 'Prominent globular cluster included as a minimal deep-sky activation target.',
    description: 'A bounded built-in deep-sky seed entry used to activate the dedicated DSO runtime path.',
  },
  {
    id: 'sky-dso-m45',
    name: 'Pleiades',
    rightAscensionHours: 3.783,
    declinationDeg: 24.117,
    magnitude: 1.6,
    apparentSizeDeg: 1.8,
    deepSkyClass: 'cluster',
    orientationDeg: 24,
    majorAxis: 1.8,
    minorAxis: 1.45,
    colorHex: '#9fd7ff',
    constellation: 'Taurus',
    summary: 'Bright open cluster included as a minimal deep-sky activation target.',
    description: 'A bounded built-in deep-sky seed entry used to activate the dedicated DSO runtime path.',
  },
] as const

function resolveEarthElements(daysSinceJ2000: number): OrbitalElements {
  return {
    ascendingNodeDeg: 0,
    inclinationDeg: 0,
    argumentOfPerihelionDeg: 282.9404 + 4.70935e-5 * daysSinceJ2000,
    semiMajorAxisAu: 1,
    eccentricity: 0.016709 - 1.151e-9 * daysSinceJ2000,
    meanAnomalyDeg: normalizeDegrees(356.047 + 0.9856002585 * daysSinceJ2000),
  }
}

export function computeDeepSkySceneObjects(observer: SkyEngineObserver, timestampIso: string): readonly SkyEngineSceneObject[] {
  return SKY_ENGINE_DEEP_SKY_DEFINITIONS.map((object) => {
    const horizontalCoordinates = computeHorizontalCoordinates(
      observer,
      timestampIso,
      object.rightAscensionHours,
      object.declinationDeg,
    )

    return {
      id: object.id,
      name: object.name,
      type: 'deep_sky',
      altitudeDeg: horizontalCoordinates.altitudeDeg,
      azimuthDeg: horizontalCoordinates.azimuthDeg,
      magnitude: object.magnitude,
      apparentSizeDeg: object.apparentSizeDeg,
      deepSkyClass: object.deepSkyClass,
      orientationDeg: object.orientationDeg,
      majorAxis: object.majorAxis,
      minorAxis: object.minorAxis,
      colorHex: object.colorHex,
      summary: object.summary,
      description: object.description,
      constellation: object.constellation,
      truthNote: `Built-in minimal deep-sky seed catalog entry for runtime activation. Coordinates are observer-transformed from fixed equatorial values for ${object.name}, with bounded morphology, orientation, and major/minor axis metadata for the dedicated DSO renderer.`,
      source: 'computed_real_sky',
      trackingMode: 'fixed_equatorial',
      rightAscensionHours: object.rightAscensionHours,
      declinationDeg: object.declinationDeg,
      timestampIso,
      isAboveHorizon: horizontalCoordinates.isAboveHorizon,
    }
  })
}

export function computeSatelliteSceneObjects(
  _observer: SkyEngineObserver,
  timestampIso: string,
  backendSatellites: readonly BackendSatelliteSceneObject[],
  maxCount = 160,
): readonly SkyEngineSceneObject[] {
  const nowMs = new Date(timestampIso).getTime()
  const sceneObjects: SkyEngineSceneObject[] = []
  backendSatellites
    .filter((satellite) => satellite.position.elevation > 0)
    .sort((left, right) => (right.relevance_score ?? 0) - (left.relevance_score ?? 0) || left.name.localeCompare(right.name))
    .slice(0, maxCount)
    .forEach((satellite) => {
      const windowStart = satellite.visibility.visibility_window_start ?? null
      const windowEnd = satellite.visibility.visibility_window_end ?? null
      const startMs = windowStart ? new Date(windowStart).getTime() : Number.NaN
      const endMs = windowEnd ? new Date(windowEnd).getTime() : Number.NaN
      const inWindow = Number.isFinite(nowMs) && Number.isFinite(startMs)
        ? (nowMs >= startMs && (!Number.isFinite(endMs) || nowMs <= endMs))
        : satellite.visibility.is_visible
      const isVisibleNow = satellite.visibility.is_visible && inWindow
      if (!isVisibleNow) {
        return
      }
      const tleLine1 = satellite.model_data?.tle_line1 ?? undefined
      const tleLine2 = satellite.model_data?.tle_line2 ?? undefined
      const derivedMeanMotion = parseTleMeanMotionRevsPerDay(tleLine2)
      const derivedOrbitalPeriodMinutes = derivedMeanMotion ? (24 * 60) / derivedMeanMotion : undefined
      const derivedInclinationDeg = parseTleInclinationDeg(tleLine2) ?? undefined
      const orbitalPeriodMinutes = satellite.model_data?.period_minutes ?? derivedOrbitalPeriodMinutes
      const orbitalInclinationDeg = satellite.model_data?.inclination_deg ?? derivedInclinationDeg
      let passWindowSummary = 'Visibility window is provider-backed but not fully specified in this payload.'

      if (windowStart && windowEnd) {
        passWindowSummary = `Visibility window ${windowStart} to ${windowEnd}.`
      } else if (windowStart) {
        passWindowSummary = `Visibility window starts at ${windowStart}.`
      }

      sceneObjects.push({
        id: satellite.id,
        name: satellite.name,
        type: 'satellite',
        altitudeDeg: satellite.position.elevation,
        azimuthDeg: satellite.position.azimuth,
        magnitude: satellite.model_data?.stdmag ?? 99,
        colorHex: '#8ee7ff',
        summary: satellite.summary,
        description: `${passWindowSummary} This bounded activation renders a dedicated marker from the backend satellite scene without orbit lines or photometric brightness modelling.`,
        truthNote: `Backend satellite scene data drives this marker for the active observer snapshot. Provider source: ${satellite.provider_source}. Position is taken directly from the backend scene payload, while brightness and orbital path remain intentionally unimplemented in this slice.`,
        source: 'backend_satellite_scene',
        trackingMode: 'static',
        timestampIso,
        providerSource: satellite.provider_source,
        tleLine1,
        tleLine2,
        stdMagnitude: satellite.model_data?.stdmag ?? undefined,
        orbitEpochIso: satellite.model_data?.epoch ?? undefined,
        orbitalInclinationDeg,
        orbitalPeriodMinutes,
        visibilityWindowStartIso: windowStart ?? undefined,
        visibilityWindowEndIso: windowEnd ?? undefined,
        detailRoute: satellite.detail_route,
        isAboveHorizon: satellite.position.elevation > 0 && isVisibleNow,
      } satisfies SkyEngineSceneObject)
    })
  return sceneObjects
}

export function computeMinorPlanetSceneObjects(
  observer: SkyEngineObserver,
  timestampIso: string,
): readonly SkyEngineSceneObject[] {
  return MINOR_PLANETS_CATALOG.map((object) => {
    const dayOffset = getDayOffsetFromTimestamp(object.orbitEpochIso, timestampIso)
    const rightAscensionHours = normalizeRightAscensionHours(
      object.rightAscensionHours + dayOffset * object.dailyMotionRaHours,
    )
    const declinationDeg = clampDeclinationDeg(
      object.declinationDeg + dayOffset * object.dailyMotionDecDeg,
    )
    const modeledMagnitude = resolveMinorPlanetModeledMagnitude(
      object.absoluteMagnitude,
      object.slopeParameterG,
      object.magnitude,
      dayOffset,
    )
    const horizontalCoordinates = computeHorizontalCoordinates(
      observer,
      timestampIso,
      rightAscensionHours,
      declinationDeg,
    )
    return {
      id: object.id,
      name: object.name,
      type: 'minor_planet',
      altitudeDeg: horizontalCoordinates.altitudeDeg,
      azimuthDeg: horizontalCoordinates.azimuthDeg,
      magnitude: modeledMagnitude,
      colorHex: '#d7d7d7',
      summary: `${object.name} from local small-body catalog with observer-frame placement.`,
      description: `Photometry uses the local H/G inputs (H ${object.absoluteMagnitude.toFixed(2)}, G ${object.slopeParameterG.toFixed(2)}) with a bounded HG-compatible surrogate while full orbital vectors remain unavailable in current contracts.`,
      truthNote: 'Minor-planet object is catalog-ingested and transformed to local horizontal coordinates each frame; full osculating-element propagation is pending richer source inputs.',
      source: 'minor_planet_catalog',
      trackingMode: 'fixed_equatorial',
      rightAscensionHours,
      declinationDeg,
      timestampIso,
      orbitEpochIso: object.orbitEpochIso,
      isAboveHorizon: horizontalCoordinates.isAboveHorizon,
    } satisfies SkyEngineSceneObject
  })
}

export function computeCometSceneObjects(
  observer: SkyEngineObserver,
  timestampIso: string,
): readonly SkyEngineSceneObject[] {
  return COMETS_CATALOG.map((comet) => {
    const dayOffset = getDayOffsetFromTimestamp(comet.perihelionIso, timestampIso)
    const rightAscensionHours = normalizeRightAscensionHours(
      comet.rightAscensionHours + dayOffset * comet.dailyMotionRaHours,
    )
    const declinationDeg = clampDeclinationDeg(
      comet.declinationDeg + dayOffset * comet.dailyMotionDecDeg,
    )
    const modeledMagnitude = resolveCometModeledMagnitude(comet.magnitude, comet.orbitType, dayOffset)
    const horizontalCoordinates = computeHorizontalCoordinates(
      observer,
      timestampIso,
      rightAscensionHours,
      declinationDeg,
    )
    return {
      id: comet.id,
      name: comet.name,
      type: 'comet',
      altitudeDeg: horizontalCoordinates.altitudeDeg,
      azimuthDeg: horizontalCoordinates.azimuthDeg,
      magnitude: modeledMagnitude,
      colorHex: '#b7f1ff',
      summary: `${comet.name} from local comet catalog with perihelion-aware activity shaping.`,
      description: `Brightness follows a bounded comet law using perihelion timing and ${comet.orbitType} orbit-class gain, constrained by currently available local metadata.`,
      truthNote: 'Comet object is catalog-ingested and observer-transformed each frame; nucleus/tail geometry and full orbital solutions are pending contract expansion.',
      source: 'comet_catalog',
      trackingMode: 'fixed_equatorial',
      rightAscensionHours,
      declinationDeg,
      timestampIso,
      orbitEpochIso: comet.perihelionIso,
      isAboveHorizon: horizontalCoordinates.isAboveHorizon,
    } satisfies SkyEngineSceneObject
  })
}

export function computeMeteorShowerSceneObjects(
  observer: SkyEngineObserver,
  timestampIso: string,
): readonly SkyEngineSceneObject[] {
  return METEOR_SHOWERS_CATALOG.map((shower) => {
    const dayOffset = getDayOffsetFromTimestamp(shower.peakIso, timestampIso)
    const radiantOffsetScale = Math.tanh(dayOffset / 6)
    const rightAscensionHours = normalizeRightAscensionHours(
      shower.rightAscensionHours + radiantOffsetScale * shower.dailyMotionRaHours,
    )
    const declinationDeg = clampDeclinationDeg(
      shower.declinationDeg + radiantOffsetScale * shower.dailyMotionDecDeg,
    )
    const activityWeight = Math.exp(-Math.abs(dayOffset) / 4.5)
    const activeRate = Math.max(0, Math.round(shower.zenithRatePerHour * activityWeight))
    const isSeasonActive = Math.abs(dayOffset) <= 21
    const horizontalCoordinates = computeHorizontalCoordinates(
      observer,
      timestampIso,
      rightAscensionHours,
      declinationDeg,
    )
    return {
      id: shower.id,
      name: shower.name,
      type: 'meteor_shower',
      altitudeDeg: horizontalCoordinates.altitudeDeg,
      azimuthDeg: horizontalCoordinates.azimuthDeg,
      magnitude: activeRate > 0 ? 2.8 : 5.2,
      colorHex: '#ffd9a8',
      summary: `${shower.name} radiant with season-limited activity from local shower metadata.`,
      description: `Activity is gated around peak (${shower.peakIso}) and scaled from ZHR (${shower.zenithRatePerHour}/h), matching available local shower contract inputs.`,
      truthNote: 'Meteor-shower radiant is catalog-ingested and observer-transformed each frame; individual meteor particle simulation remains outside current local inputs.',
      source: 'meteor_shower_catalog',
      trackingMode: 'fixed_equatorial',
      rightAscensionHours,
      declinationDeg,
      timestampIso,
      meteorPeakIso: shower.peakIso,
      meteorZenithRatePerHour: isSeasonActive ? activeRate : 0,
      isAboveHorizon: horizontalCoordinates.isAboveHorizon && isSeasonActive && activeRate > 0,
    } satisfies SkyEngineSceneObject
  })
}

export function computePlanetSceneObjects(observer: SkyEngineObserver, timestampIso: string): readonly SkyEngineSceneObject[] {
  const daysSinceJ2000 = toJulianDate(timestampIso) - 2451543.5
  const earthOrbit = resolveOrbitalPosition(resolveEarthElements(daysSinceJ2000))
  const obliquityRad = degreesToRadians(23.4393 - 3.563e-7 * daysSinceJ2000)
  const lightDaysPerAu = 1 / AU_PER_LIGHT_DAY
  const solarCoordinates = computeSolarEquatorialCoordinates(timestampIso)

  return SKY_ENGINE_PLANET_DEFINITIONS.map((planet) => {
    const heliocentricPosition = resolveOrbitalPosition(planet.resolveElements(daysSinceJ2000))
    const initialGeocentricX = heliocentricPosition.x - earthOrbit.x
    const initialGeocentricY = heliocentricPosition.y - earthOrbit.y
    const initialGeocentricZ = heliocentricPosition.z - earthOrbit.z
    const initialDistanceAu = Math.hypot(initialGeocentricX, initialGeocentricY, initialGeocentricZ)
    const lightTimeDays = initialDistanceAu * lightDaysPerAu
    const lightTimeCorrectedDaysSinceJ2000 = daysSinceJ2000 - lightTimeDays
    const lightTimeCorrectedHeliocentricPosition = resolveOrbitalPosition(planet.resolveElements(lightTimeCorrectedDaysSinceJ2000))
    const geocentricX = lightTimeCorrectedHeliocentricPosition.x - earthOrbit.x
    const geocentricY = lightTimeCorrectedHeliocentricPosition.y - earthOrbit.y
    const geocentricZ = lightTimeCorrectedHeliocentricPosition.z - earthOrbit.z
    const equatorialY = geocentricY * Math.cos(obliquityRad) - geocentricZ * Math.sin(obliquityRad)
    const equatorialZ = geocentricY * Math.sin(obliquityRad) + geocentricZ * Math.cos(obliquityRad)
    const rightAscensionDeg = normalizeDegrees(radiansToDegrees(Math.atan2(equatorialY, geocentricX)))
    const declinationDeg = radiansToDegrees(Math.atan2(equatorialZ, Math.hypot(geocentricX, equatorialY)))
    const rightAscensionHours = rightAscensionDeg / 15
    const horizontalCoordinates = computeHorizontalCoordinates(observer, timestampIso, rightAscensionHours, declinationDeg)
    const distanceToEarthAu = Math.max(Math.hypot(geocentricX, geocentricY, geocentricZ), MIN_DISTANCE_AU)
    const distanceToSunAu = Math.max(lightTimeCorrectedHeliocentricPosition.distanceAu, MIN_DISTANCE_AU)
    const phaseAngleRad = Math.acos(clamp(
      (
        lightTimeCorrectedHeliocentricPosition.x * geocentricX +
        lightTimeCorrectedHeliocentricPosition.y * geocentricY +
        lightTimeCorrectedHeliocentricPosition.z * geocentricZ
      ) / (distanceToSunAu * distanceToEarthAu),
      -1,
      1,
    ))
    const illuminationFraction = clamp01((1 + Math.cos(phaseAngleRad)) * 0.5)
    const brightLimbAngleDeg = computeBrightLimbAngleDeg(
      rightAscensionHours,
      declinationDeg,
      solarCoordinates.rightAscensionHours,
      solarCoordinates.declinationDeg,
    )
    const phasePercent = (radiansToDegrees(phaseAngleRad)) / 100
    const phaseMagnitudeAdjustment =
      phasePercent * (
        planet.visualElements.phaseA +
        phasePercent * (
          planet.visualElements.phaseB +
          phasePercent * planet.visualElements.phaseC
        )
      )
    const magnitude =
      planet.visualElements.magnitudeAtOneAu +
      5 * Math.log10(distanceToSunAu * distanceToEarthAu) +
      phaseMagnitudeAdjustment
    const saturnVisualState = planet.id === 'sky-planet-saturn'
      ? computeSaturnRingVisualState(rightAscensionHours, declinationDeg)
      : null

    return {
      id: planet.id,
      name: planet.name,
      type: 'planet',
      altitudeDeg: horizontalCoordinates.altitudeDeg,
      azimuthDeg: horizontalCoordinates.azimuthDeg,
      magnitude,
      colorHex: planet.colorHex,
      summary: planet.summary,
      description: planet.description,
      truthNote: 'Computed from a timestamp-driven planetary orbital model with light-time correction and Stellarium-style apparent magnitude terms.',
      source: 'computed_ephemeris',
      trackingMode: 'fixed_equatorial',
      rightAscensionHours,
      declinationDeg,
      timestampIso,
      apparentSizeDeg: (planet.visualElements.angularSizeArcsecAtOneAu / distanceToEarthAu) / 3600,
      illuminationFraction,
      phaseAngle: phaseAngleRad,
      phaseMagnitudeAdjustment,
      brightLimbAngleDeg,
      ringOpening: saturnVisualState?.ringOpening,
      ringTiltAngle: saturnVisualState?.ringTiltAngle,
      ringBrightnessGain: saturnVisualState?.ringBrightnessGain,
      isAboveHorizon: horizontalCoordinates.isAboveHorizon,
    }
  })
}

function computeGuidanceScore(object: SkyEngineSceneObject) {
  if (!object.isAboveHorizon) {
    return 0
  }

  const altitudeScore = clamp01((object.altitudeDeg - 12) / 58)
  const brightnessScore = clamp01((4.8 - object.magnitude) / 6)
  const moonBonus = object.type === 'moon' ? 0.12 : 0
  const satelliteBonus = object.type === 'satellite' ? 0.08 : 0
  const comfortBonus = object.altitudeDeg >= 25 && object.altitudeDeg <= 70 ? 0.08 : 0
  const deepSkyBonus = object.type === 'deep_sky' ? 0.1 : 0
  const temporaryPenalty = object.source === 'temporary_scene_seed' ? 0.12 : 0

  return altitudeScore * 0.5 + brightnessScore * 0.34 + comfortBonus + moonBonus + satelliteBonus + deepSkyBonus - temporaryPenalty
}

export function rankGuidanceTargets(
  objects: readonly SkyEngineSceneObject[],
  maxCount = 5,
): readonly SkyEngineGuidanceTarget[] {
  const ranked = objects
    .map((object) => ({ object, score: computeGuidanceScore(object) }))
    .filter(({ object, score }) => object.isAboveHorizon && score >= 0.28)
    .sort((left, right) => right.score - left.score || left.object.magnitude - right.object.magnitude)
  const moonCandidate = ranked.find(({ object }) => object.type === 'moon')
  const deepSkyCandidate = ranked.find(({ object }) => object.type === 'deep_sky')
  const shortlist = ranked.slice(0, maxCount)

  if (moonCandidate && !shortlist.some(({ object }) => object.id === moonCandidate.object.id)) {
    shortlist.pop()
    shortlist.push(moonCandidate)
    shortlist.sort((left, right) => right.score - left.score || left.object.magnitude - right.object.magnitude)
  }

  if (deepSkyCandidate && !shortlist.some(({ object }) => object.id === deepSkyCandidate.object.id)) {
    const replaceIndex = shortlist.findIndex(({ object }) => object.type !== 'moon')

    if (replaceIndex >= 0) {
      shortlist.splice(replaceIndex, 1, deepSkyCandidate)
      shortlist.sort((left, right) => right.score - left.score || left.object.magnitude - right.object.magnitude)
    }
  }

  return shortlist.map(({ object, score }) => ({
    objectId: object.id,
    name: object.name,
    score,
    summary: object.summary,
  }))
}

export function computeObjectTrajectorySamples(
  observer: SkyEngineObserver,
  timestampIso: string,
  object: SkyEngineSceneObject,
  hourOffsets: readonly number[],
): readonly SkyEngineTrajectorySample[] {
  if (object.trackingMode === 'static') {
    return []
  }

  return hourOffsets.map((hourOffset) => {
    const sampleTimestampIso = offsetTimestampByHours(timestampIso, hourOffset)
    let horizontalCoordinates = {
      altitudeDeg: object.altitudeDeg,
      azimuthDeg: object.azimuthDeg,
      isAboveHorizon: object.isAboveHorizon,
      hourAngleDeg: 0,
    }

    if (object.trackingMode === 'fixed_equatorial' && object.rightAscensionHours != null && object.declinationDeg != null) {
      horizontalCoordinates = computeHorizontalCoordinates(
        observer,
        sampleTimestampIso,
        object.rightAscensionHours,
        object.declinationDeg,
      )
    } else if (object.trackingMode === 'lunar_ephemeris') {
      const moon = computeMoonSceneObject(observer, sampleTimestampIso)
      horizontalCoordinates = {
        altitudeDeg: moon.altitudeDeg,
        azimuthDeg: moon.azimuthDeg,
        isAboveHorizon: moon.isAboveHorizon,
        hourAngleDeg: 0,
      }
    }

    return {
      timestampIso: sampleTimestampIso,
      hourOffset,
      altitudeDeg: horizontalCoordinates.altitudeDeg,
      azimuthDeg: horizontalCoordinates.azimuthDeg,
      isAboveHorizon: horizontalCoordinates.isAboveHorizon,
    }
  })
}

export function computeSceneTimestampFromOffsetSeconds(timestampIso: string, offsetSeconds: number) {
  return offsetTimestampBySeconds(timestampIso, offsetSeconds)
}
