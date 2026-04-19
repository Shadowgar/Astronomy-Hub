import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'

import { bvToRgb } from './engine/sky/adapters/bvToRgb'
import {
  coreGetPointForMagnitude,
  STELLARIUM_DEFAULT_SCREEN_SIZE_PX,
  STELLARIUM_MIN_POINT_RADIUS_PX,
  STELLARIUM_TONEMAPPER_EXPOSURE,
  STELLARIUM_TONEMAPPER_LWMAX_MIN,
  STELLARIUM_TONEMAPPER_P,
} from './engine/sky/core/stellariumVisualMath'
import type { SkyBrightnessExposureState } from './engine/sky/runtime/types'
import type { SkyEngineSceneObject, SkyEngineVisualCalibration } from './types'

export interface StarRenderProfile {
  readonly colorHex: string
  readonly diameter: number
  readonly haloRadiusPx: number
  readonly haloAlpha: number
  readonly coreRadiusPx: number
  readonly twinkleAmplitude: number
  readonly alpha: number
  readonly emissiveScale: number
  readonly diffuseScale: number
  readonly psfDiameterPx: number
}

export interface StellariumPointVisual {
  readonly visible: boolean
  readonly radiusPx: number
  readonly luminance: number
}

const STELLARIUM_MAX_POINT_RADIUS_PX = 50

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function toHex(channel: number) {
  return Math.round(channel).toString(16).padStart(2, '0')
}

/** Linear sRGB hex from B−V using Stellarium Web Engine `bv_to_rgb` (`bvToRgb.ts`). */
export function resolveStarColorHex(colorIndexBV = 0.65) {
  const [r, g, b] = bvToRgb(colorIndexBV)

  return `#${toHex(r * 255)}${toHex(g * 255)}${toHex(b * 255)}`
}

function getSceneResponseWeight(state: SkyBrightnessExposureState | undefined) {
  if (!state) {
    return {
      tonemapperP: STELLARIUM_TONEMAPPER_P,
      tonemapperExposure: STELLARIUM_TONEMAPPER_EXPOSURE,
      tonemapperLwmax: STELLARIUM_TONEMAPPER_LWMAX_MIN,
    }
  }

  return {
    tonemapperP: clamp(state.tonemapperP, 0.8, 4),
    tonemapperExposure: clamp(state.tonemapperExposure, 0.8, 2.2),
    tonemapperLwmax: clamp(state.tonemapperLwmax, STELLARIUM_TONEMAPPER_LWMAX_MIN, 5000),
  }
}

export function computeStellariumPointVisual(
  magnitude: number,
  brightnessExposureState: SkyBrightnessExposureState | undefined,
  screenSizePx: number,
  fovDegrees = 60,
): StellariumPointVisual {
  const response = getSceneResponseWeight(brightnessExposureState)
  const point = coreGetPointForMagnitude(magnitude, fovDegrees, {
    p: response.tonemapperP,
    exposure: response.tonemapperExposure,
    lwmax: response.tonemapperLwmax,
  }, {
    screenSizePx: screenSizePx || STELLARIUM_DEFAULT_SCREEN_SIZE_PX,
  })

  return {
    visible: point.visible,
    radiusPx: Math.min(point.radiusPx, STELLARIUM_MAX_POINT_RADIUS_PX),
    luminance: point.luminance,
  }
}

export function getStarRenderProfileForMagnitude(
  magnitude: number,
  colorIndexBV: number | undefined,
  calibration: SkyEngineVisualCalibration,
  brightnessExposureState?: SkyBrightnessExposureState,
  screenSizePx = 600,
  precomputedPointVisual?: StellariumPointVisual,
): StarRenderProfile {
  const pointVisual = precomputedPointVisual ?? computeStellariumPointVisual(magnitude, brightnessExposureState, screenSizePx)
  const colorHex = resolveStarColorHex(colorIndexBV)
  const pointRadiusPx = pointVisual.visible ? pointVisual.radiusPx : STELLARIUM_MIN_POINT_RADIUS_PX
  const pointDiameterPx = clamp(pointRadiusPx * 2, 0.9, STELLARIUM_MAX_POINT_RADIUS_PX * 2)
  const alpha = clamp(pointVisual.luminance, 0, 1)

  return {
    colorHex,
    diameter: pointDiameterPx,
    haloRadiusPx: pointRadiusPx,
    haloAlpha: alpha,
    coreRadiusPx: pointRadiusPx,
    twinkleAmplitude: 0,
    alpha,
    emissiveScale: clamp(alpha, 0.16, 1),
    diffuseScale: clamp(alpha * 0.01, 0.003, 0.01),
    psfDiameterPx: pointDiameterPx,
  }
}

export function getStarRenderProfile(
  object: SkyEngineSceneObject,
  calibration: SkyEngineVisualCalibration,
  brightnessExposureState?: SkyBrightnessExposureState,
): StarRenderProfile {
  return getStarRenderProfileForMagnitude(object.magnitude, object.colorIndexBV, calibration, brightnessExposureState)
}

export function buildDedicatedStarTexture(name: string, profile: StarRenderProfile) {
  const texture = new DynamicTexture(name, { width: 128, height: 128 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const red = Number.parseInt(profile.colorHex.slice(1, 3), 16)
  const green = Number.parseInt(profile.colorHex.slice(3, 5), 16)
  const blue = Number.parseInt(profile.colorHex.slice(5, 7), 16)
  const halo = context.createRadialGradient(64, 64, 1, 64, 64, Math.min(56, profile.haloRadiusPx * 1.08))

  context.clearRect(0, 0, 128, 128)
  halo.addColorStop(0, `rgba(255, 255, 255, ${clamp(0.24 + profile.alpha * 0.54, 0.24, 0.92)})`)
  halo.addColorStop(0.015, `rgba(${red}, ${green}, ${blue}, ${Math.min(0.94, profile.alpha)})`)
  halo.addColorStop(0.08, `rgba(${red}, ${green}, ${blue}, ${Math.min(0.78, profile.alpha * 0.9)})`)
  halo.addColorStop(0.18, `rgba(${red}, ${green}, ${blue}, ${profile.haloAlpha})`)
  halo.addColorStop(0.42, `rgba(${red}, ${green}, ${blue}, ${profile.haloAlpha * 0.16})`)
  halo.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`)
  context.fillStyle = halo
  context.beginPath()
  context.arc(64, 64, Math.min(56, profile.haloRadiusPx * 1.08), 0, Math.PI * 2)
  context.fill()

  context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${clamp(0.28 + profile.alpha * 0.68, 0.28, 0.98)})`
  context.beginPath()
  context.arc(64, 64, profile.coreRadiusPx * 1.32, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = `rgba(255, 255, 255, ${clamp(0.18 + profile.alpha * 0.78, 0.22, 0.98)})`
  context.beginPath()
  context.arc(64, 64, Math.max(0.9, profile.coreRadiusPx * 0.68), 0, Math.PI * 2)
  context.fill()
  texture.update()

  return texture
}
