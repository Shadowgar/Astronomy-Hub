const DEGREES_TO_RADIANS = Math.PI / 180
const ARCSECONDS_PER_RADIAN = 206264.80624709636
const STELLARIUM_FOV_EYE_RADIANS = 60 * DEGREES_TO_RADIANS
const STELLARIUM_POINT_SPREAD_RADIUS_RAD = (2.5 / 60) * DEGREES_TO_RADIANS
const STELLARIUM_MIN_POINT_AREA_SR = Math.PI * STELLARIUM_POINT_SPREAD_RADIUS_RAD * STELLARIUM_POINT_SPREAD_RADIUS_RAD
const STELLARIUM_ADAPTATION_RATE = 0.16
const STELLARIUM_ADAPTATION_FRAME_SECONDS = 0.01666

export const STELLARIUM_TONEMAPPER_P = 2.2
export const STELLARIUM_TONEMAPPER_EXPOSURE = 2
export const STELLARIUM_TONEMAPPER_LWMAX_MIN = 0.052
export const STELLARIUM_TONEMAPPER_LWMAX_MAX = 5000
export const STELLARIUM_STAR_LINEAR_SCALE = 0.8
export const STELLARIUM_STAR_RELATIVE_SCALE = 1.1
export const STELLARIUM_MIN_POINT_RADIUS_PX = 0.6
export const STELLARIUM_SKIP_POINT_RADIUS_PX = 0.25
export const STELLARIUM_MAX_POINT_RADIUS_PX = 50
export const STELLARIUM_DEFAULT_SCREEN_SIZE_PX = 600
export const STELLARIUM_MIN_SCREEN_FACTOR = 0.7
export const STELLARIUM_MAX_SCREEN_FACTOR = 1.5
export const STELLARIUM_DEFAULT_BORTLE_INDEX = 3

export interface StellariumTonemapperState {
  readonly p: number
  readonly exposure: number
  readonly lwmax: number
}

export interface StellariumPointStyleConfig {
  readonly screenSizePx?: number
  readonly pixelScale?: number
  readonly bortleIndex?: number
  readonly starLinearScale?: number
  readonly starRelativeScale?: number
  readonly minPointRadiusPx?: number
  readonly skipPointRadiusPx?: number
  readonly maxPointRadiusPx?: number
}

export interface StellariumPointVisualResult {
  readonly visible: boolean
  readonly radiusPx: number
  readonly luminance: number
  readonly rawLuminance: number
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function exp10(value: number) {
  return Math.exp(value * Math.log(10))
}

function resolveScreenFactor(screenSizePx = STELLARIUM_DEFAULT_SCREEN_SIZE_PX) {
  return clamp(
    screenSizePx / STELLARIUM_DEFAULT_SCREEN_SIZE_PX,
    STELLARIUM_MIN_SCREEN_FACTOR,
    STELLARIUM_MAX_SCREEN_FACTOR,
  )
}

export function buildStellariumTelescopeState(fovDegrees: number) {
  const fovRadians = clamp(fovDegrees, 0.25, 180) * DEGREES_TO_RADIANS
  const magnification = STELLARIUM_FOV_EYE_RADIANS / fovRadians
  const exposureBoost = Math.pow(Math.max(1, (5 * DEGREES_TO_RADIANS) / fovRadians), 0.07)
  const lightGrasp = Math.max(0.4, magnification * magnification * exposureBoost)

  return {
    magnification,
    lightGrasp,
    gainMagnitude: 2.5 * Math.log10(lightGrasp),
  }
}

export function tonemapperMap(luminance: number, tonemapper: StellariumTonemapperState) {
  const safeLuminance = Math.max(0, luminance)
  const safeLwmax = Math.max(tonemapper.lwmax, 1e-6)
  return (Math.log(1 + tonemapper.p * safeLuminance) / Math.log(1 + tonemapper.p * safeLwmax)) * tonemapper.exposure
}

export function resolveTonemapperLwmaxFromLuminance(luminanceCdM2: number) {
  return clamp(luminanceCdM2, STELLARIUM_TONEMAPPER_LWMAX_MIN, STELLARIUM_TONEMAPPER_LWMAX_MAX)
}

export function coreMagToIlluminance(magnitude: number) {
  return 10.7646e4 / (ARCSECONDS_PER_RADIAN * ARCSECONDS_PER_RADIAN) * exp10(-0.4 * magnitude)
}

export function coreIlluminanceToLumApparent(illuminance: number, surfaceSteradians: number, fovDegrees: number) {
  const telescope = buildStellariumTelescopeState(fovDegrees)
  let apparentIlluminance = illuminance * telescope.lightGrasp
  let apparentSurface = surfaceSteradians * telescope.magnification * telescope.magnification
  apparentSurface = Math.max(apparentSurface, STELLARIUM_MIN_POINT_AREA_SR)
  return apparentIlluminance / apparentSurface
}

export function coreMagToLumApparent(magnitude: number, surfaceSteradians: number, fovDegrees: number) {
  return coreIlluminanceToLumApparent(coreMagToIlluminance(magnitude), surfaceSteradians, fovDegrees)
}

function resolvePointStyleConfig(style: StellariumPointStyleConfig | undefined) {
  return {
    screenSizePx: style?.screenSizePx ?? STELLARIUM_DEFAULT_SCREEN_SIZE_PX,
    pixelScale: style?.pixelScale ?? 1,
    bortleIndex: style?.bortleIndex ?? STELLARIUM_DEFAULT_BORTLE_INDEX,
    starLinearScale: style?.starLinearScale ?? STELLARIUM_STAR_LINEAR_SCALE,
    starRelativeScale: style?.starRelativeScale ?? STELLARIUM_STAR_RELATIVE_SCALE,
    minPointRadiusPx: style?.minPointRadiusPx ?? STELLARIUM_MIN_POINT_RADIUS_PX,
    skipPointRadiusPx: style?.skipPointRadiusPx ?? STELLARIUM_SKIP_POINT_RADIUS_PX,
    maxPointRadiusPx: style?.maxPointRadiusPx ?? STELLARIUM_MAX_POINT_RADIUS_PX,
  }
}

function coreGetPointForMagnitudeUnbounded(
  magnitude: number,
  fovDegrees: number,
  tonemapper: StellariumTonemapperState,
  style: StellariumPointStyleConfig | undefined,
) {
  const config = resolvePointStyleConfig(style)
  const starScaleScreenFactor = resolveScreenFactor(config.screenSizePx)
  const linearScale = (
    config.starLinearScale + 3 / 11 - config.bortleIndex / 11
  ) * starScaleScreenFactor
  let luminance = tonemapperMap(coreMagToLumApparent(magnitude, 0, fovDegrees), tonemapper)

  if (luminance < 0) {
    luminance = 0
  }

  return {
    radiusPx: linearScale * Math.pow(luminance, config.starRelativeScale / 2),
    luminance,
  }
}

export function coreGetPointForMagnitude(
  magnitude: number,
  fovDegrees: number,
  tonemapper: StellariumTonemapperState,
  style?: StellariumPointStyleConfig,
): StellariumPointVisualResult {
  const config = resolvePointStyleConfig(style)
  let minRadius = config.minPointRadiusPx

  if (minRadius * config.pixelScale < 1) {
    minRadius = 1
  }

  const rawPoint = coreGetPointForMagnitudeUnbounded(magnitude, fovDegrees, tonemapper, config)
  let radius = rawPoint.radiusPx
  let luminance = rawPoint.luminance

  if (radius < config.skipPointRadiusPx) {
    return {
      visible: false,
      radiusPx: 0,
      luminance: 0,
      rawLuminance: 0,
    }
  }

  if (radius > 0 && radius < minRadius) {
    luminance *= Math.pow((radius - config.skipPointRadiusPx) / (minRadius - config.skipPointRadiusPx), 2)
    radius = minRadius
  }

  luminance = Math.pow(luminance, 1 / 2.2)
  radius = Math.min(radius, config.maxPointRadiusPx)

  return {
    visible: true,
    radiusPx: radius,
    luminance: clamp(luminance, 0, 1),
    rawLuminance: clamp(rawPoint.luminance, 0, Number.POSITIVE_INFINITY),
  }
}

export function computeVmagForRadius(
  targetRadiusPx: number,
  fovDegrees: number,
  tonemapper: StellariumTonemapperState,
  style?: StellariumPointStyleConfig,
) {
  const maxIterations = 32
  const delta = 0.001
  let magnitude = 0
  let lowerMagnitude = -192
  let upperMagnitude = 64
  const lowerPoint = coreGetPointForMagnitudeUnbounded(lowerMagnitude, fovDegrees, tonemapper, style)

  if (lowerPoint.radiusPx < targetRadiusPx) {
    return lowerMagnitude
  }

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    magnitude = (lowerMagnitude + upperMagnitude) * 0.5
    const point = coreGetPointForMagnitudeUnbounded(magnitude, fovDegrees, tonemapper, style)

    if (Math.abs(point.radiusPx - targetRadiusPx) < delta) {
      return magnitude
    }

    if (point.radiusPx > targetRadiusPx) {
      lowerMagnitude = magnitude
    } else {
      upperMagnitude = magnitude
    }
  }

  return magnitude
}

export function updateAdaptedTonemapperLwmax(config: {
  previousLwmax?: number | null
  targetLwmax: number
  deltaSeconds: number
  fastAdaptation: boolean
}) {
  const targetLwmax = resolveTonemapperLwmaxFromLuminance(config.targetLwmax)
  const previousLwmax = resolveTonemapperLwmaxFromLuminance(
    config.previousLwmax ?? STELLARIUM_TONEMAPPER_LWMAX_MAX,
  )

  if (config.fastAdaptation && targetLwmax > previousLwmax) {
    return {
      lwmax: targetLwmax,
      adaptationSmoothing: 1,
    }
  }

  const adaptationSmoothing = Math.min(
    (STELLARIUM_ADAPTATION_RATE * Math.max(config.deltaSeconds, 0.001)) / STELLARIUM_ADAPTATION_FRAME_SECONDS,
    0.5,
  )

  return {
    lwmax: Math.exp(
      Math.log(previousLwmax) + (Math.log(targetLwmax) - Math.log(previousLwmax)) * adaptationSmoothing,
    ),
    adaptationSmoothing,
  }
}

export function coreReportVmagInFovLuminance(config: {
  magnitude: number
  angularRadiusRad: number
  separationRad: number
  fovDegrees: number
}) {
  const telescope = buildStellariumTelescopeState(config.fovDegrees)
  let luminance = coreMagToIlluminance(config.magnitude - telescope.gainMagnitude) /
    (Math.PI * config.angularRadiusRad * config.angularRadiusRad)
  let observedRadius = config.angularRadiusRad * telescope.magnification

  observedRadius = Math.max(observedRadius, STELLARIUM_POINT_SPREAD_RADIUS_RAD)
  luminance *= Math.pow(observedRadius / STELLARIUM_FOV_EYE_RADIANS, 1.2)
  luminance = Math.pow(Math.max(luminance, 0), 0.33)
  luminance /= 300

  const fadeAmount = config.separationRad <= 0
    ? 1
    : clamp(1 - config.separationRad / (config.fovDegrees * DEGREES_TO_RADIANS * 0.75), 0, 1)

  return luminance * fadeAmount * 7
}