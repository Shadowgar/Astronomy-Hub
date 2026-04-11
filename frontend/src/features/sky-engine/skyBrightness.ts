import { resolveLimitingMagnitude } from './engine/sky/core/magnitudePolicy'

const DEGREES_TO_RADIANS = Math.PI / 180
const NLAMBERT_TO_CDM2 = 3.183e-6
const STELLARIUM_DARK_SKY_REFERENCE_LUMINANCE = 1.75e-4
const STELLARIUM_DAY_SKY_REFERENCE_LUMINANCE = 7500
const STELLARIUM_MIN_LWMAX = 0.052
const STELLARIUM_MAX_LWMAX = 5000
const STELLARIUM_TONEMAPPER_P = 2.2
const STELLARIUM_TONEMAPPER_EXPOSURE = 2

export interface StellariumSkyBrightnessContext {
  readonly extinctionCoefficient: number
  readonly airmassMoon: number
  readonly airmassSun: number
  readonly moonTransmission: number
  readonly sunTransmission: number
  readonly moonTerm: number
  readonly twilightTerm: number
  readonly nightTerm: number
}

export interface StellariumSkyBrightnessBaseline {
  readonly skyBrightness: number
  readonly zenithSkyLuminance: number
  readonly nightSkyZenithLuminance: number
  readonly nightSkyHorizonLuminance: number
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function exp10(value: number) {
  return Math.exp(value * Math.log(10))
}

function resolveYearMonth(timestampIso?: string) {
  if (!timestampIso) {
    return { year: 2026, month: 6 }
  }

  const timestamp = new Date(timestampIso)

  if (Number.isNaN(timestamp.getTime())) {
    return { year: 2026, month: 6 }
  }

  return {
    year: timestamp.getUTCFullYear(),
    month: timestamp.getUTCMonth() + 1,
  }
}

function computeAirmassFromCosZenith(cosZenithDistance: number) {
  if (cosZenithDistance <= 0) {
    return 40
  }

  return 1 / (cosZenithDistance + 0.025 * Math.exp(-11 * cosZenithDistance))
}

function interpolateLogLuminance(brightness: number) {
  const darkLog = Math.log10(STELLARIUM_DARK_SKY_REFERENCE_LUMINANCE)
  const dayLog = Math.log10(STELLARIUM_DAY_SKY_REFERENCE_LUMINANCE)
  return Math.pow(10, darkLog + clamp(brightness, 0, 1) * (dayLog - darkLog))
}

export function buildStellariumSkyBrightnessContext(config: {
  timestampIso?: string
  latitudeDeg: number
  observerElevationM: number
  sunAltitudeRad: number
  moonAltitudeRad?: number | null
  moonMagnitude?: number | null
  temperatureC?: number
  relativeHumidityPercent?: number
}): StellariumSkyBrightnessContext {
  const { year, month } = resolveYearMonth(config.timestampIso)
  const temperatureC = config.temperatureC ?? 15
  const relativeHumidityPercent = config.relativeHumidityPercent ?? 40
  const latitudeRad = config.latitudeDeg * DEGREES_TO_RADIANS
  const altitudeMeters = Math.max(0, config.observerElevationM)
  const seasonalAngle = (month - 3) * 0.52359878
  const latitudeSign = config.latitudeDeg >= 0 ? 1 : -1
  const relativeHumidityFraction = clamp(relativeHumidityPercent / 100, 0.01, 0.99)

  const rayleighExtinction = 0.1066 * Math.exp(-altitudeMeters / 8200)
  const aerosolExtinction = 0.1 * Math.exp(-altitudeMeters / 1500)
    * Math.pow(1 - 0.32 / Math.log(relativeHumidityFraction), 1.33)
    * (1 + 0.33 * latitudeSign * Math.sin(seasonalAngle))
  const ozoneExtinction = 0.031 * Math.exp(-altitudeMeters / 8200)
    * (3 + 0.4 * (latitudeRad * Math.cos(seasonalAngle) - Math.cos(3 * latitudeRad))) / 3
  const waterVaporExtinction = 0.031 * 0.94 * relativeHumidityFraction
    * Math.exp(temperatureC / 15)
    * Math.exp(-altitudeMeters / 8200)
  const extinctionCoefficient = rayleighExtinction + aerosolExtinction + ozoneExtinction + waterVaporExtinction

  const moonZenithDistanceRad = Math.PI / 2 - (config.moonAltitudeRad ?? -Math.PI / 2)
  const sunZenithDistanceRad = Math.PI / 2 - config.sunAltitudeRad
  const airmassMoon = computeAirmassFromCosZenith(Math.cos(moonZenithDistanceRad))
  const airmassSun = computeAirmassFromCosZenith(Math.cos(sunZenithDistanceRad))
  let moonTerm = exp10(-0.4 * ((config.moonMagnitude ?? 0) + 54.32)) * 1_000_000

  if (moonZenithDistanceRad > 90 * DEGREES_TO_RADIANS) {
    moonTerm = 0
  } else if (moonZenithDistanceRad > 75 * DEGREES_TO_RADIANS) {
    moonTerm *= (90 * DEGREES_TO_RADIANS - moonZenithDistanceRad) / (15 * DEGREES_TO_RADIANS)
  }

  return {
    extinctionCoefficient,
    airmassMoon,
    airmassSun,
    moonTransmission: exp10(-0.4 * extinctionCoefficient * airmassMoon),
    sunTransmission: exp10(-0.4 * extinctionCoefficient * airmassSun),
    moonTerm,
    twilightTerm: -6.724 + 22.918312 * (Math.PI / 2 - sunZenithDistanceRad),
    nightTerm: 1e-13 + 0.3e-13 * Math.cos(0.57118 * (year - 1992)),
  }
}

export function computeStellariumSkyLuminance(
  context: StellariumSkyBrightnessContext,
  config: {
    cosMoonDistance: number
    cosSunDistance: number
    cosZenithDistance: number
  },
) {
  const cosMoonDistance = Math.min(config.cosMoonDistance, Math.cos(1 * DEGREES_TO_RADIANS))
  const cosSunDistance = Math.min(config.cosSunDistance, Math.cos(1 * DEGREES_TO_RADIANS))
  const moonDistance = Math.acos(clamp(cosMoonDistance, -1, 1))
  const sunDistance = Math.acos(clamp(cosSunDistance, -1, 1))
  const bKX = exp10(-0.4 * context.extinctionCoefficient * computeAirmassFromCosZenith(config.cosZenithDistance))
  const daylightScatter =
    18886.28 / (sunDistance * sunDistance) +
    exp10(6.15 - (sunDistance + 0.001) * 1.43239) +
    229086.77 * (1.06 + cosSunDistance * cosSunDistance)
  const daylightBrightness = 9.289663e-12 * (1 - bKX)
    * (daylightScatter * context.sunTransmission + 440000 * (1 - context.sunTransmission))

  let twilightBrightness = 0
  const twilightFactor = context.twilightTerm + 0.063661977 * Math.acos(clamp(config.cosZenithDistance, -1, 1))
    / Math.max(context.extinctionCoefficient, 0.05)

  if (twilightFactor > -32) {
    twilightBrightness = exp10(twilightFactor) * ((Math.PI / 180) / sunDistance) * (1 - bKX)
  }

  let totalBrightness = Math.min(twilightBrightness, daylightBrightness)
  const moonScatter =
    18886.28 / (moonDistance * moonDistance) +
    exp10(6.15 - moonDistance * 1.43239) +
    229086.77 * (1.06 + cosMoonDistance * cosMoonDistance)
  totalBrightness += context.moonTerm * (1 - bKX)
    * (moonScatter * context.moonTransmission + 440000 * (1 - context.moonTransmission)) / 1_000_000

  if (totalBrightness && (context.nightTerm * bKX) / totalBrightness > 0.01) {
    totalBrightness += (0.4 + 0.6 / Math.sqrt(0.04 + 0.96 * config.cosZenithDistance * config.cosZenithDistance))
      * context.nightTerm * bKX
    totalBrightness += 0.0000000000012
  }

  if (totalBrightness < 0) {
    return 0
  }

  return totalBrightness / 1.11e-15 * NLAMBERT_TO_CDM2
}

export function computeSkyBrightnessFromLuminance(luminanceCdM2: number) {
  const safeLuminance = clamp(
    luminanceCdM2,
    STELLARIUM_DARK_SKY_REFERENCE_LUMINANCE,
    STELLARIUM_DAY_SKY_REFERENCE_LUMINANCE,
  )
  const darkLog = Math.log10(STELLARIUM_DARK_SKY_REFERENCE_LUMINANCE)
  const dayLog = Math.log10(STELLARIUM_DAY_SKY_REFERENCE_LUMINANCE)
  const luminanceLog = Math.log10(safeLuminance)

  return clamp((luminanceLog - darkLog) / (dayLog - darkLog), 0, 1)
}

export function resolveTonemapperLwmaxFromLuminance(luminanceCdM2: number) {
  return clamp(luminanceCdM2, STELLARIUM_MIN_LWMAX, STELLARIUM_MAX_LWMAX)
}

export function evaluateStellariumSkyBrightnessBaseline(config: {
  timestampIso?: string
  latitudeDeg: number
  observerElevationM: number
  sunAltitudeRad: number
  moonAltitudeRad?: number | null
  moonMagnitude?: number | null
}) : StellariumSkyBrightnessBaseline {
  const context = buildStellariumSkyBrightnessContext(config)
  const zenithSkyLuminance = computeStellariumSkyLuminance(context, {
    cosMoonDistance: config.moonAltitudeRad == null ? -1 : Math.sin(config.moonAltitudeRad),
    cosSunDistance: Math.sin(config.sunAltitudeRad),
    cosZenithDistance: 1,
  })

  return {
    skyBrightness: computeSkyBrightnessFromLuminance(zenithSkyLuminance),
    zenithSkyLuminance,
    nightSkyZenithLuminance: computeNightSkyLuminance(Math.PI / 2, config.sunAltitudeRad),
    nightSkyHorizonLuminance: computeNightSkyLuminance(0, config.sunAltitudeRad),
  }
}

// Lightweight Schaefer-style proxy aligned to Stellarium's skybrightness shape:
// continuous dark-night -> twilight -> daylight growth driven by sun altitude.
export function computeSkyBrightness(sunAltitudeRad: number): number {
  return evaluateStellariumSkyBrightnessBaseline({
    latitudeDeg: 0,
    observerElevationM: 0,
    sunAltitudeRad,
  }).skyBrightness
}

// Returns the effective visible limiting magnitude for a representative wide-field view.
export function computeLimitingMagnitude(brightness: number, fovDegrees = 120): number {
  return resolveLimitingMagnitude({
    fovDeg: fovDegrees,
    skyBrightness: brightness,
    tonemapperP: STELLARIUM_TONEMAPPER_P,
    tonemapperExposure: STELLARIUM_TONEMAPPER_EXPOSURE,
    tonemapperLwmax: resolveTonemapperLwmaxFromLuminance(interpolateLogLuminance(brightness)),
  })
}

export function computeEffectiveLimitingMagnitude(
  brightnessOrConfig:
    | number
    | {
        fovDegrees: number
        skyBrightness?: number
        tonemapperP?: number
        tonemapperExposure: number
        tonemapperLwmax: number
        viewportMinSizePx?: number
      },
  fovDegrees?: number,
  _starVisibility = 1,
) {
  if (typeof brightnessOrConfig === 'object') {
    return resolveLimitingMagnitude({
      fovDeg: brightnessOrConfig.fovDegrees,
      skyBrightness: brightnessOrConfig.skyBrightness,
      tonemapperP: brightnessOrConfig.tonemapperP ?? STELLARIUM_TONEMAPPER_P,
      tonemapperExposure: brightnessOrConfig.tonemapperExposure,
      tonemapperLwmax: brightnessOrConfig.tonemapperLwmax,
      viewportMinSizePx: brightnessOrConfig.viewportMinSizePx,
    })
  }

  return resolveLimitingMagnitude({
    fovDeg: fovDegrees ?? 120,
    skyBrightness: brightnessOrConfig,
    tonemapperP: STELLARIUM_TONEMAPPER_P,
    tonemapperExposure: STELLARIUM_TONEMAPPER_EXPOSURE,
    tonemapperLwmax: resolveTonemapperLwmaxFromLuminance(interpolateLogLuminance(brightnessOrConfig)),
  })
}

export function computeSkyBrightnessLimitingMagnitude(sunAltitudeDeg: number, fovDegrees = 120) {
  return computeLimitingMagnitude(computeSkyBrightness(sunAltitudeDeg * DEGREES_TO_RADIANS), fovDegrees)
}

function computeNightSkyLuminance(zenithDistanceRad: number, sunAltitudeRad: number) {
  const darkness = clamp((-sunAltitudeRad - 6 * DEGREES_TO_RADIANS) / (12 * DEGREES_TO_RADIANS), 0, 1)
  const zenithWeight = 0.64 + 0.36 * Math.cos(clamp(zenithDistanceRad, 0, Math.PI / 2))
  return STELLARIUM_DARK_SKY_REFERENCE_LUMINANCE * (0.28 + darkness * 0.72) / zenithWeight
}