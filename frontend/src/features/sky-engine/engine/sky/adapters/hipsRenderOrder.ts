/**
 * Stellarium Web Engine HiPS render-order helpers (`hips.c`).
 */

import type { SkyProjectionMode } from '../contracts/observer'
import { buildCanonicalSkyProjectionViewForFov, getProjectionScale } from '../../../projectionMath'

export type HipsViewportHint = {
  windowHeightPx: number
  projectionMat11: number
  tileWidthPx?: number
}

/**
 * Single canonical string for `hipsViewport` in Gaia tile caches and `buildRuntimeTileQuerySignature`.
 * Keep all call sites on this helper so cache invalidation matches scene tile reloads.
 */
export function formatHipsViewportKey(viewport: HipsViewportHint | undefined): string {
  if (!viewport) {
    return 'novp'
  }

  return `${viewport.windowHeightPx}:${viewport.projectionMat11}:${viewport.tileWidthPx ?? ''}`
}

/**
 * Stellarium `hips_get_render_order` uses `fabs(painter->proj->mat[1][1])` in a dimensionless ratio with `window_size[1]`.
 * Hub stores **`projectionScale / windowHeightPx`** so the formula matches reference tests (e.g. mat11 ≈ 1–2 at typical zoom).
 */
export function normalizeProjectionMat11ForHips(projectionScalePx: number, windowHeightPx: number): number {
  return projectionScalePx / Math.max(1, windowHeightPx)
}

/**
 * When no live `hipsViewport` is available (unit tests), derive the same inputs from observer FOV + canonical 1920×1080 viewport.
 */
export function buildSyntheticHipsViewportForTileSelection(options: {
  fovDeg: number
  projection: SkyProjectionMode
}): HipsViewportHint {
  const view = buildCanonicalSkyProjectionViewForFov(options.fovDeg, options.projection)
  const scale = getProjectionScale(view)

  return {
    windowHeightPx: view.viewportHeight,
    projectionMat11: normalizeProjectionMat11ForHips(scale, view.viewportHeight),
    tileWidthPx: 256,
  }
}

/**
 * Unclamped formula from `hips_get_render_order` (`hips.c`): one HEALPix `order` where
 * tile pixel density along a small angle matches screen pixel density.
 */
export function hipsGetRenderOrderUnclamped(options: {
  /** `hips->tile_width` (default 256 in C if unset). */
  tileWidthPx: number
  /** `painter->proj->window_size[1]`. */
  windowHeightPx: number
  /** `fabs(painter->proj->mat[1][1])` — vertical projection scale. */
  projectionMat11: number
}): number {
  const w = options.tileWidthPx || 256
  const winH = options.windowHeightPx
  const f = Math.abs(options.projectionMat11)
  return Math.round(Math.log2((Math.PI * f * winH) / (4.0 * Math.sqrt(2.0) * w)))
}

/**
 * Matches `hips_render` after the suggestion: `clamp(order, order_min, hips->order)` then `fmin(..., 9)`.
 */
export function clampHipsRenderOrder(suggestedOrder: number, orderMin: number, orderMax: number): number {
  const clamped = Math.min(Math.max(suggestedOrder, orderMin), orderMax)
  return Math.min(9, clamped)
}

/**
 * Gaia Eph path: HEALPix `order` is at least quadtree-derived `minOrder + tileLevel` (capped) and, when `viewport` is set,
 * at least Stellarium `hips_get_render_order` (clamped), matching the spirit of `hips_render` minimum order.
 */
export function resolveGaiaHealpixOrder(options: {
  tileLevel: number
  minOrder: number
  maxOrder: number
  viewport?: HipsViewportHint
}): number {
  const levelOrder = Math.min(options.maxOrder, options.minOrder + Math.max(options.tileLevel, 0))

  if (!options.viewport) {
    return levelOrder
  }

  const suggested = hipsGetRenderOrderUnclamped({
    tileWidthPx: options.viewport.tileWidthPx ?? 256,
    windowHeightPx: options.viewport.windowHeightPx,
    projectionMat11: options.viewport.projectionMat11,
  })
  const screenOrder = clampHipsRenderOrder(suggested, options.minOrder, options.maxOrder)
  return Math.min(options.maxOrder, Math.max(levelOrder, screenOrder))
}
