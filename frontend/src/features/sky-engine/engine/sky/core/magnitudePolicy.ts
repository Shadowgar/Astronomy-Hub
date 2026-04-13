const DEGREES_TO_RADIANS = Math.PI / 180
const STELLARIUM_FOV_EYE_RADIANS = 60 * DEGREES_TO_RADIANS
const STELLARIUM_STAR_LINEAR_SCALE = 0.8
const STELLARIUM_STAR_RELATIVE_SCALE = 1.1
const STELLARIUM_MIN_POINT_RADIUS_PX = 0.6
const STELLARIUM_SKIP_POINT_RADIUS_PX = 0.25
const STELLARIUM_DEFAULT_SCREEN_SIZE_PX = 600
const STELLARIUM_MIN_SCREEN_FACTOR = 0.7
const STELLARIUM_MAX_SCREEN_FACTOR = 1.5
const STELLARIUM_TONEMAPPER_P = 2.2
const STELLARIUM_TONEMAPPER_EXPOSURE = 2
const STELLARIUM_TONEMAPPER_LWMAX = 0.052
const STELLARIUM_POINT_SPREAD_RADIUS_RAD = (2.5 / 60) * DEGREES_TO_RADIANS
const RADIANS_TO_ARCSECONDS = 206264.80624709636

export const SKY_RUNTIME_TIER_MAG_MAX = [2.5, 6.5, 10.5] as const

export const SKY_TILE_LEVEL_MAG_MAX = [4.5, 6.8, 9.8, 13.2] as const

export function formatSkyRuntimeTier(index: number) {
  return `T${Math.max(0, Math.floor(index))}` as const
}

export function resolveSkyRuntimeTierForMagnitude(magnitude: number) {
  let tierIndex = 0

  SKY_RUNTIME_TIER_MAG_MAX.forEach((maxMagnitude, index) => {
    if (magnitude > maxMagnitude) {
      tierIndex = index + 1
    }
  })

  return formatSkyRuntimeTier(tierIndex)
}

export interface LimitingMagnitudeConfig {
  readonly fovDeg: number
  readonly skyBrightness?: number
  readonly tonemapperP?: number
  readonly tonemapperExposure?: number
  readonly tonemapperLwmax?: number
  readonly viewportMinSizePx?: number
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function exp10(value: number) {
  return Math.exp(value * Math.log(10))
}

function buildScreenFactor(viewportMinSizePx: number | undefined) {
  const minSize = viewportMinSizePx ?? STELLARIUM_DEFAULT_SCREEN_SIZE_PX
  return clamp(
    minSize / STELLARIUM_DEFAULT_SCREEN_SIZE_PX,
    STELLARIUM_MIN_SCREEN_FACTOR,
    STELLARIUM_MAX_SCREEN_FACTOR,
  )
}

function buildTelescopeGainMagnitude(fovDeg: number) {
  const fovRad = clamp(fovDeg, 0.25, 180) * DEGREES_TO_RADIANS
  const magnification = STELLARIUM_FOV_EYE_RADIANS / fovRad
  const exposure = Math.pow(Math.max(1, (5 * DEGREES_TO_RADIANS) / fovRad), 0.07)
  const lightGrasp = Math.max(0.4, magnification * magnification * exposure)

  return 2.5 * Math.log10(lightGrasp)
}

function getMagnitudeIlluminance(magnitude: number) {
  return 10.7646e4 / (RADIANS_TO_ARCSECONDS * RADIANS_TO_ARCSECONDS) * exp10(-0.4 * magnitude)
}

function getApparentLuminanceForMagnitude(magnitude: number, telescopeGainMagnitude: number) {
  const minimumPointArea = Math.PI * STELLARIUM_POINT_SPREAD_RADIUS_RAD * STELLARIUM_POINT_SPREAD_RADIUS_RAD
  return getMagnitudeIlluminance(magnitude - telescopeGainMagnitude) / minimumPointArea
}

function tonemapperMap(
  luminance: number,
  tonemapperP: number,
  tonemapperLwmax: number,
  tonemapperExposure: number,
) {
  const safeLuminance = Math.max(luminance, 0)
  const safeLwmax = Math.max(tonemapperLwmax, 1e-6)
  const denominator = Math.log(1 + tonemapperP * safeLwmax)

  if (denominator <= 0) {
    return 0
  }

  return (Math.log(1 + tonemapperP * safeLuminance) / denominator) * tonemapperExposure
}

function resolvePointRadiusForMagnitude(magnitude: number, config: Required<LimitingMagnitudeConfig>) {
  const response = tonemapperMap(
    getApparentLuminanceForMagnitude(magnitude, buildTelescopeGainMagnitude(config.fovDeg)),
    config.tonemapperP,
    config.tonemapperLwmax,
    config.tonemapperExposure,
  )

  return (
    STELLARIUM_STAR_LINEAR_SCALE *
    buildScreenFactor(config.viewportMinSizePx) *
    Math.pow(Math.max(response, 0), STELLARIUM_STAR_RELATIVE_SCALE / 2)
  )
}

function normalizeConfig(input: number | LimitingMagnitudeConfig): Required<LimitingMagnitudeConfig> {
  if (typeof input === 'number') {
    return {
      fovDeg: input,
      skyBrightness: 0,
      tonemapperP: STELLARIUM_TONEMAPPER_P,
      tonemapperExposure: STELLARIUM_TONEMAPPER_EXPOSURE,
      tonemapperLwmax: STELLARIUM_TONEMAPPER_LWMAX,
      viewportMinSizePx: STELLARIUM_DEFAULT_SCREEN_SIZE_PX,
    }
  }

  return {
    fovDeg: input.fovDeg,
    skyBrightness: input.skyBrightness ?? 0,
    tonemapperP: input.tonemapperP ?? STELLARIUM_TONEMAPPER_P,
    tonemapperExposure: input.tonemapperExposure ?? STELLARIUM_TONEMAPPER_EXPOSURE,
    tonemapperLwmax: input.tonemapperLwmax ?? STELLARIUM_TONEMAPPER_LWMAX,
    viewportMinSizePx: input.viewportMinSizePx ?? STELLARIUM_DEFAULT_SCREEN_SIZE_PX,
  }
}

export function computeVisibilityAlphaForMagnitude(magnitude: number, input: number | LimitingMagnitudeConfig) {
  const config = normalizeConfig(input)
  const radius = resolvePointRadiusForMagnitude(magnitude, config)

  return radius >= STELLARIUM_SKIP_POINT_RADIUS_PX ? 1 : 0
}

export function computePointRadiusForMagnitude(magnitude: number, input: number | LimitingMagnitudeConfig) {
  return resolvePointRadiusForMagnitude(magnitude, normalizeConfig(input))
}

export function isVisibleByPointThreshold(
  magnitude: number,
  input: number | LimitingMagnitudeConfig,
  thresholdRadiusPx = STELLARIUM_SKIP_POINT_RADIUS_PX,
) {
  return computePointRadiusForMagnitude(magnitude, input) >= thresholdRadiusPx
}

export function resolveLimitingMagnitude(input: number | LimitingMagnitudeConfig) {
  const config = normalizeConfig(input)
  let magnitude = 0
  let lowerBound = -192
  let upperBound = 64

  if (resolvePointRadiusForMagnitude(lowerBound, config) < STELLARIUM_SKIP_POINT_RADIUS_PX) {
    return lowerBound
  }

  for (let iteration = 0; iteration < 32; iteration += 1) {
    magnitude = (lowerBound + upperBound) * 0.5
    const radius = resolvePointRadiusForMagnitude(magnitude, config)

    if (Math.abs(radius - STELLARIUM_SKIP_POINT_RADIUS_PX) < 0.001) {
      return magnitude
    }

    if (radius > STELLARIUM_SKIP_POINT_RADIUS_PX) {
      lowerBound = magnitude
    } else {
      upperBound = magnitude
    }
  }

  return magnitude
}
