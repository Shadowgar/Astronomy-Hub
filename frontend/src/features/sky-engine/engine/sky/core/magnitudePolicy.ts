import {
  computeVmagForRadius,
  coreGetPointForMagnitude,
  STELLARIUM_DEFAULT_SCREEN_SIZE_PX,
  STELLARIUM_SKIP_POINT_RADIUS_PX,
  STELLARIUM_TONEMAPPER_EXPOSURE,
  STELLARIUM_TONEMAPPER_LWMAX_MIN,
  STELLARIUM_TONEMAPPER_P,
  type StellariumTonemapperState,
} from './stellariumVisualMath'

const DEGREES_TO_RADIANS = Math.PI / 180
const STELLARIUM_FOV_EYE_RADIANS = 60 * DEGREES_TO_RADIANS
const STELLARIUM_MIN_SCREEN_FACTOR = 0.7
const STELLARIUM_MAX_SCREEN_FACTOR = 1.5

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

function buildScreenFactor(viewportMinSizePx: number | undefined) {
  const minSize = viewportMinSizePx ?? STELLARIUM_DEFAULT_SCREEN_SIZE_PX
  return clamp(
    minSize / STELLARIUM_DEFAULT_SCREEN_SIZE_PX,
    STELLARIUM_MIN_SCREEN_FACTOR,
    STELLARIUM_MAX_SCREEN_FACTOR,
  )
}

function buildTonemapper(config: Required<LimitingMagnitudeConfig>): StellariumTonemapperState {
  return {
    p: config.tonemapperP,
    exposure: config.tonemapperExposure,
    lwmax: config.tonemapperLwmax,
  }
}

function normalizeConfig(input: number | LimitingMagnitudeConfig): Required<LimitingMagnitudeConfig> {
  if (typeof input === 'number') {
    return {
      fovDeg: input,
      skyBrightness: 0,
      tonemapperP: STELLARIUM_TONEMAPPER_P,
      tonemapperExposure: STELLARIUM_TONEMAPPER_EXPOSURE,
      tonemapperLwmax: STELLARIUM_TONEMAPPER_LWMAX_MIN,
      viewportMinSizePx: STELLARIUM_DEFAULT_SCREEN_SIZE_PX,
    }
  }

  return {
    fovDeg: input.fovDeg,
    skyBrightness: input.skyBrightness ?? 0,
    tonemapperP: input.tonemapperP ?? STELLARIUM_TONEMAPPER_P,
    tonemapperExposure: input.tonemapperExposure ?? STELLARIUM_TONEMAPPER_EXPOSURE,
    tonemapperLwmax: input.tonemapperLwmax ?? STELLARIUM_TONEMAPPER_LWMAX_MIN,
    viewportMinSizePx: input.viewportMinSizePx ?? STELLARIUM_DEFAULT_SCREEN_SIZE_PX,
  }
}

export function computeVisibilityAlphaForMagnitude(magnitude: number, input: number | LimitingMagnitudeConfig) {
  const config = normalizeConfig(input)
  const point = coreGetPointForMagnitude(magnitude, config.fovDeg, buildTonemapper(config), {
    screenSizePx: config.viewportMinSizePx,
  })

  return point.visible ? 1 : 0
}

export function computePointRadiusForMagnitude(magnitude: number, input: number | LimitingMagnitudeConfig) {
  const config = normalizeConfig(input)
  return coreGetPointForMagnitude(magnitude, config.fovDeg, buildTonemapper(config), {
    screenSizePx: config.viewportMinSizePx,
  }).radiusPx
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
  return computeVmagForRadius(STELLARIUM_SKIP_POINT_RADIUS_PX, config.fovDeg, buildTonemapper(config), {
    screenSizePx: config.viewportMinSizePx,
  })
}

export function resolveLimitingMagnitudeForPointRadius(
  targetRadiusPx: number,
  input: number | LimitingMagnitudeConfig,
) {
  const config = normalizeConfig(input)
  return computeVmagForRadius(targetRadiusPx, config.fovDeg, buildTonemapper(config), {
    screenSizePx: config.viewportMinSizePx,
  })
}
