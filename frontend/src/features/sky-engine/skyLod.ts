import type { SkyEngineSceneObject } from './types'

export type SkyLodTier = 'wide' | 'medium' | 'close'

export interface SkyLodState {
  readonly tier: SkyLodTier
  readonly fovDegrees: number
  readonly wideBlend: number
  readonly mediumBlend: number
  readonly closeBlend: number
  readonly labelCap: number
  readonly syntheticStarCount: number
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const amount = clamp01((value - edge0) / (edge1 - edge0))
  return amount * amount * (3 - 2 * amount)
}

export function resolveSkyLodState(fovRadians: number): SkyLodState {
  const fovDegrees = (fovRadians * 180) / Math.PI
  const wideBlend = smoothstep(50, 62, fovDegrees)
  const closeBlend = 1 - smoothstep(34, 44, fovDegrees)
  const mediumBlend = clamp01(1 - Math.max(wideBlend, closeBlend) * 0.92)

  let tier: SkyLodTier = 'medium'

  if (wideBlend >= mediumBlend && wideBlend >= closeBlend) {
    tier = 'wide'
  } else if (closeBlend >= mediumBlend && closeBlend >= wideBlend) {
    tier = 'close'
  }

  return {
    tier,
    fovDegrees,
    wideBlend,
    mediumBlend,
    closeBlend,
    labelCap: Math.round(4 * wideBlend + 7 * mediumBlend + 10 * closeBlend),
    syntheticStarCount: Math.round(90 * wideBlend + 260 * mediumBlend + 540 * closeBlend),
  }
}

export function getLodVisibilityAlpha(object: SkyEngineSceneObject, lod: SkyLodState) {
  if (object.type === 'moon') {
    return 1
  }

  if (object.type === 'planet') {
    return 0.9 + lod.closeBlend * 0.1
  }

  if (object.type === 'deep_sky') {
    return Math.min(1, lod.mediumBlend * 0.72 + lod.closeBlend)
  }

  return Math.min(1, 0.5 + lod.mediumBlend * 0.26 + lod.closeBlend * 0.34)
}
