import { resolveLimitingMagnitudeForPointRadius } from '../core/magnitudePolicy'

export interface StellariumCorePainterLimitParams {
  /** `core->star_linear_scale` (default 0.8) */
  starLinearScale: number
  /** `core->star_scale_screen_factor` (default 0.5) */
  starScaleScreenFactor: number
  /** `core->star_relative_scale` (default 1.1) */
  starRelativeScale: number
  /** `core->bortle_index` (default 3) */
  bortleIndex: number
  /** `core->tonemapper`: p, lwmax, exposure — from `tonemapper_update` / `core_set_default` */
  tonemapperP: number
  tonemapperLwmax: number
  tonemapperExposure: number
  /** `core->telescope` — use unity for limits unless instrument port exists */
  telescopeLightGrasp: number
  telescopeMagnification: number
}

export const STELLARIUM_CORE_DEFAULT_PAINTER_PARAMS: StellariumCorePainterLimitParams = {
  starLinearScale: 0.8,
  starScaleScreenFactor: 0.5,
  starRelativeScale: 1.1,
  bortleIndex: 3,
  tonemapperP: 2.2,
  tonemapperLwmax: 5000,
  tonemapperExposure: 2,
  telescopeLightGrasp: 1,
  telescopeMagnification: 1,
}

/** `core->skip_point_radius` / `show_hints_radius` defaults (`core.c` ~181–182) */
export const STELLARIUM_SKIP_POINT_RADIUS_PX = 0.25
export const STELLARIUM_SHOW_HINTS_RADIUS_PX = 0.4

/** `core->display_limit_mag` default (`core.c` ~239) */
export const STELLARIUM_DEFAULT_DISPLAY_LIMIT_MAG = 99

export function computeStellariumCorePainterLimits(
  params: StellariumCorePainterLimitParams = STELLARIUM_CORE_DEFAULT_PAINTER_PARAMS,
): {
  starsLimitMag: number
  hintsLimitMag: number
  hardLimitMag: number
} {
  const limitingMagnitudeInput = {
    fovDeg: 60,
    tonemapperP: params.tonemapperP,
    tonemapperExposure: params.tonemapperExposure,
    tonemapperLwmax: params.tonemapperLwmax,
    viewportMinSizePx: params.starScaleScreenFactor * 1200,
  }
  return {
    starsLimitMag: resolveLimitingMagnitudeForPointRadius(STELLARIUM_SKIP_POINT_RADIUS_PX, limitingMagnitudeInput),
    hintsLimitMag: resolveLimitingMagnitudeForPointRadius(STELLARIUM_SHOW_HINTS_RADIUS_PX, limitingMagnitudeInput),
    hardLimitMag: STELLARIUM_DEFAULT_DISPLAY_LIMIT_MAG,
  }
}

/**
 * Ceiling for star magnitudes on the Hub stars runtime path.
 * Stellarium `stars.c` `render_visitor`: `limit_mag = fmin(painter.stars_limit_mag, painter.hard_limit_mag)` (then `vmag` vs `limit_mag`).
 * Hub applies the same `min` together with tonemapper exposure **`limitingMagnitude`** from `brightnessExposureState`.
 */
export function resolveStarsRenderLimitMagnitude(
  exposureLimitMagnitude: number,
  painterLimits: { starsLimitMag: number; hardLimitMag: number } | null | undefined,
): number {
  if (!painterLimits) {
    return exposureLimitMagnitude
  }

  return Math.min(exposureLimitMagnitude, painterLimits.starsLimitMag, painterLimits.hardLimitMag)
}
