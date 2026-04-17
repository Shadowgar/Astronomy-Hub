/**
 * Stellarium Web Engine painter limit math from `core.c`:
 * `compute_vmag_for_radius` (static ~464), `core_get_point_for_mag_` (~369),
 * `core_mag_to_illuminance` (~696), `core_illuminance_to_lum_apparent` (~719),
 * `tonemapper_map` (`tonemapper.c` ~30).
 *
 * Defaults match `core_set_default` / `core_init` where noted.
 */

const ERFA_DR2AS = 206264.8062470963551564734
const DD2R = Math.PI / 180

function exp10(x: number) {
  return Math.pow(10, x)
}

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

/** `core_mag_to_illuminance` (`core.c` ~696) */
export function coreMagToIlluminance(vmag: number) {
  return (10.7646e4 / (ERFA_DR2AS * ERFA_DR2AS)) * exp10(-0.4 * vmag)
}

/** `core_illuminance_to_lum_apparent` (`core.c` ~719) with point-source area floor */
export function coreIlluminanceToLumApparent(illum: number, surf: number, params: StellariumCorePainterLimitParams) {
  const illumNext = illum * params.telescopeLightGrasp
  let surfNext = surf * params.telescopeMagnification * params.telescopeMagnification
  const pr = (2.5 / 60) * DD2R
  const minPointArea = Math.PI * pr * pr
  surfNext = Math.max(surfNext, minPointArea)
  return illumNext / surfNext
}

/** `core_mag_to_lum_apparent(mag, surf)` (`core.c` ~755) */
export function coreMagToLumApparent(mag: number, surf: number, params: StellariumCorePainterLimitParams) {
  return coreIlluminanceToLumApparent(coreMagToIlluminance(mag), surf, params)
}

/** `tonemapper_map` with q = 1 (`tonemapper.c` ~30) */
export function tonemapperMap(lw: number, params: StellariumCorePainterLimitParams) {
  const p = params.tonemapperP
  return Math.log(1 + p * lw) / Math.log(1 + p * params.tonemapperLwmax) * params.tonemapperExposure
}

/** `core_get_point_for_mag_` (`core.c` ~369) — radius in window pixels */
export function coreGetPointForMagUnclamped(mag: number, params: StellariumCorePainterLimitParams) {
  const sLinear =
    (params.starLinearScale + 3.0 / 11.0 - params.bortleIndex / 11.0) * params.starScaleScreenFactor
  const sRelative = params.starRelativeScale
  const lumApparent = coreMagToLumApparent(mag, 0, params)
  const ld = tonemapperMap(lumApparent, params)
  const ldClamped = ld < 0 ? 0 : ld
  return sLinear * Math.pow(ldClamped, sRelative / 2.0)
}

/**
 * `compute_vmag_for_radius` (`core.c` ~464). `targetRadiusPx` is window pixels (`core->skip_point_radius` / `show_hints_radius`).
 */
export function computeVmagForRadius(targetRadiusPx: number, params: StellariumCorePainterLimitParams = STELLARIUM_CORE_DEFAULT_PAINTER_PARAMS) {
  const maxIter = 32
  const delta = 0.001
  let m1 = -192.0
  let m2 = 64.0
  let m = 0.0

  let r = coreGetPointForMagUnclamped(m1, params)
  if (r < targetRadiusPx) {
    return m1
  }

  for (let i = 0; i < maxIter; i++) {
    m = (m1 + m2) / 2
    r = coreGetPointForMagUnclamped(m, params)
    if (Math.abs(r - targetRadiusPx) < delta) {
      return m
    }
    if (r > targetRadiusPx) {
      m1 = m
    } else {
      m2 = m
    }
  }

  return m
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
  return {
    starsLimitMag: computeVmagForRadius(STELLARIUM_SKIP_POINT_RADIUS_PX, params),
    hintsLimitMag: computeVmagForRadius(STELLARIUM_SHOW_HINTS_RADIUS_PX, params),
    hardLimitMag: STELLARIUM_DEFAULT_DISPLAY_LIMIT_MAG,
  }
}
