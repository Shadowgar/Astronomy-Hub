import type {
  SkyEngineCelestialSourceObject,
  SkyEngineGuidanceTarget,
  SkyEngineObserver,
  SkyEngineSceneObject,
  SkyEngineTrajectorySample,
} from './types'
import type { BackendSkySceneStarObject } from '../scene/contracts'

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

export function toJulianDate(timestampIso: string) {
  return new Date(timestampIso).getTime() / 86400000 + 2440587.5
}

function offsetTimestampByHours(timestampIso: string, hourOffset: number) {
  return new Date(new Date(timestampIso).getTime() + hourOffset * 60 * 60 * 1000).toISOString()
}

function offsetTimestampBySeconds(timestampIso: string, secondOffset: number) {
  return new Date(new Date(timestampIso).getTime() + secondOffset * 1000).toISOString()
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
    phaseLabel: deriveMoonPhaseLabel(illuminationFraction, waxing),
    waxing,
  }
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
  const illuminationMagnitudeAdjustment = (1 - equatorialCoordinates.illuminationFraction) * 1.9

  return {
    id: 'sky-real-moon',
    name: 'Moon',
    type: 'moon',
    altitudeDeg: horizontalCoordinates.altitudeDeg,
    azimuthDeg: horizontalCoordinates.azimuthDeg,
    magnitude: -12.2 + illuminationMagnitudeAdjustment,
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
    apparentSizeDeg: 0.52,
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
  readonly magnitude: number
  readonly angularSizeArcsecAtOneAu: number
  readonly resolveElements: (daysSinceJ2000: number) => OrbitalElements
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
  }
}

const SKY_ENGINE_PLANET_DEFINITIONS: readonly PlanetDefinitionInternal[] = [
  {
    id: 'sky-planet-venus',
    name: 'Venus',
    colorHex: '#f4e4c1',
    summary: 'Bright inner planet computed from a bounded orbital approximation.',
    description: 'Venus is rendered through the dedicated planet renderer so wide zoom reads as a bright point while closer views transition toward a disc and textured surface.',
    magnitude: -4.1,
    angularSizeArcsecAtOneAu: 16,
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
    summary: 'Outer planet computed from a bounded orbital approximation.',
    description: 'Mars is rendered as a dedicated planet object with point, disc, and textured surface transitions tied to field of view.',
    magnitude: 0.3,
    angularSizeArcsecAtOneAu: 9.36,
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
    summary: 'Gas giant computed from a bounded orbital approximation.',
    description: 'Jupiter uses the planet renderer to transition from a bright sky point to a disc and simplified textured surface as field of view narrows.',
    magnitude: -2.4,
    angularSizeArcsecAtOneAu: 98,
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
    summary: 'Ringed gas giant computed from a bounded orbital approximation.',
    description: 'Saturn is carried through the dedicated planet renderer so it follows the same Stellarium-style representation ladder as the other planets.',
    magnitude: 0.7,
    angularSizeArcsecAtOneAu: 82.73,
    resolveElements: (daysSinceJ2000) => ({
      ascendingNodeDeg: 113.6634 + 2.3898e-5 * daysSinceJ2000,
      inclinationDeg: 2.4886 - 1.081e-7 * daysSinceJ2000,
      argumentOfPerihelionDeg: 339.3939 + 2.97661e-5 * daysSinceJ2000,
      semiMajorAxisAu: 9.55475,
      eccentricity: 0.055546 - 9.499e-9 * daysSinceJ2000,
      meanAnomalyDeg: normalizeDegrees(316.967 + 0.0334442282 * daysSinceJ2000),
    }),
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

export function computePlanetSceneObjects(observer: SkyEngineObserver, timestampIso: string): readonly SkyEngineSceneObject[] {
  const daysSinceJ2000 = toJulianDate(timestampIso) - 2451543.5
  const earthOrbit = resolveOrbitalPosition(resolveEarthElements(daysSinceJ2000))
  const obliquityRad = degreesToRadians(23.4393 - 3.563e-7 * daysSinceJ2000)

  return SKY_ENGINE_PLANET_DEFINITIONS.map((planet) => {
    const heliocentricPosition = resolveOrbitalPosition(planet.resolveElements(daysSinceJ2000))
    const geocentricX = heliocentricPosition.x - earthOrbit.x
    const geocentricY = heliocentricPosition.y - earthOrbit.y
    const geocentricZ = heliocentricPosition.z - earthOrbit.z
    const equatorialY = geocentricY * Math.cos(obliquityRad) - geocentricZ * Math.sin(obliquityRad)
    const equatorialZ = geocentricY * Math.sin(obliquityRad) + geocentricZ * Math.cos(obliquityRad)
    const rightAscensionDeg = normalizeDegrees(radiansToDegrees(Math.atan2(equatorialY, geocentricX)))
    const declinationDeg = radiansToDegrees(Math.atan2(equatorialZ, Math.hypot(geocentricX, equatorialY)))
    const rightAscensionHours = rightAscensionDeg / 15
    const horizontalCoordinates = computeHorizontalCoordinates(observer, timestampIso, rightAscensionHours, declinationDeg)
    const distanceAu = Math.hypot(geocentricX, geocentricY, geocentricZ)

    return {
      id: planet.id,
      name: planet.name,
      type: 'planet',
      altitudeDeg: horizontalCoordinates.altitudeDeg,
      azimuthDeg: horizontalCoordinates.azimuthDeg,
      magnitude: planet.magnitude,
      colorHex: planet.colorHex,
      summary: planet.summary,
      description: planet.description,
      truthNote: 'Computed from a bounded planetary orbital approximation for the active observer and explicit scene timestamp in this slice.',
      source: 'computed_ephemeris',
      trackingMode: 'fixed_equatorial',
      rightAscensionHours,
      declinationDeg,
      timestampIso,
      apparentSizeDeg: (planet.angularSizeArcsecAtOneAu / Math.max(distanceAu, 0.1)) / 3600,
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
  const comfortBonus = object.altitudeDeg >= 25 && object.altitudeDeg <= 70 ? 0.08 : 0
  const deepSkyBonus = object.type === 'deep_sky' ? 0.1 : 0
  const temporaryPenalty = object.source === 'temporary_scene_seed' ? 0.12 : 0

  return altitudeScore * 0.5 + brightnessScore * 0.34 + comfortBonus + moonBonus + deepSkyBonus - temporaryPenalty
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