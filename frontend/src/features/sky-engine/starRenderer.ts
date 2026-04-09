import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'

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

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value)
}

function mixChannel(left: number, right: number, amount: number) {
  return left + (right - left) * amount
}

function toHex(channel: number) {
  return Math.round(channel).toString(16).padStart(2, '0')
}

export function resolveStarColorHex(colorIndexBV = 0.65) {
  const normalizedColorIndex = clamp(colorIndexBV, -0.4, 2)
  let green: number
  let blue: number

  if (normalizedColorIndex < 0) {
    const factor = (normalizedColorIndex + 0.4) / 0.4
    green = 196 + factor * 44
    blue = 255
  } else if (normalizedColorIndex < 0.4) {
    const factor = normalizedColorIndex / 0.4
    green = 243 + factor * 8
    blue = 250 - factor * 16
  } else if (normalizedColorIndex < 1.1) {
    const factor = (normalizedColorIndex - 0.4) / 0.7
    green = 250 - factor * 28
    blue = 232 - factor * 58
  } else {
    const factor = (normalizedColorIndex - 1.1) / 0.9
    green = 220 - factor * 42
    blue = 162 - factor * 58
  }

  const desaturation = 0.18
  const red = 255
  green = mixChannel(green, 247, desaturation)
  blue = mixChannel(blue, 242, desaturation)

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`
}

function getMagnitudeLuminance(magnitude: number) {
  const clampedMagnitude = clamp(magnitude, -1.6, 10.4)
  const brightReference = Math.pow(10, -0.4 * -1.46)
  const faintReference = Math.pow(10, -0.4 * 10.4)
  const luminance = Math.pow(10, -0.4 * clampedMagnitude)

  return clamp((luminance - faintReference) / (brightReference - faintReference), 0, 1)
}

function getMagnitudeBrightness(magnitude: number) {
  const luminance = getMagnitudeLuminance(magnitude)
  return clamp(Math.pow(smoothstep(Math.pow(luminance, 0.42)), 0.58), 0, 1)
}

function getMagnitudeSizeWeight(magnitude: number) {
  const luminance = getMagnitudeLuminance(magnitude)
  const brightness = getMagnitudeBrightness(magnitude)
  return clamp(Math.pow(luminance, 0.34) * 0.86 + Math.pow(brightness, 0.88) * 0.42, 0, 1)
}

function getSceneResponseWeight(state: SkyBrightnessExposureState | undefined) {
  if (!state) {
    return {
      visibility: 1,
      fieldBrightness: 1,
      exposure: 1,
      skySuppression: 1,
    }
  }

  return {
    visibility: clamp(state.starVisibility, 0.05, 1),
    fieldBrightness: clamp(state.starFieldBrightness, 0.05, 1),
    exposure: clamp(state.atmosphereExposure, 0.68, 1.14),
    skySuppression: clamp(1 - state.skyBrightness * 0.94, 0.06, 1),
  }
}

export function getStarRenderProfileForMagnitude(
  magnitude: number,
  colorIndexBV: number | undefined,
  calibration: SkyEngineVisualCalibration,
  brightnessExposureState?: SkyBrightnessExposureState,
): StarRenderProfile {
  const brightness = getMagnitudeBrightness(magnitude)
  const sizeWeight = getMagnitudeSizeWeight(magnitude)
  const brightGlowWeight = clamp(Math.pow(brightness, 1.18), 0, 1)
  const response = getSceneResponseWeight(brightnessExposureState)
  const apparentBrightness = clamp(
    brightness * response.visibility * Math.pow(response.fieldBrightness, 0.82) * Math.pow(response.exposure, 0.42) * response.skySuppression,
    0.02,
    1,
  )
  const apparentSize = clamp(
    sizeWeight * (0.82 + response.visibility * 0.18) * (0.88 + response.skySuppression * 0.22),
    0.04,
    1,
  )
  const colorHex = resolveStarColorHex(colorIndexBV)

  const diameter = clamp(0.1 + Math.pow(apparentSize, 1.06) * 1.52, 0.1, 1.72)
  const haloRadiusPx = clamp(1.3 + Math.pow(apparentSize, 0.9) * 16.8 + brightGlowWeight * 10.4, 1.3, 24.5)
  const coreRadiusPx = clamp(0.52 + Math.pow(apparentSize, 1.18) * 5.4 + brightGlowWeight * 1.8, 0.52, 7.4)

  return {
    colorHex,
    diameter,
    haloRadiusPx,
    haloAlpha: clamp(0.02 + calibration.starHaloVisibility * (0.04 + brightGlowWeight * 0.34) * response.skySuppression, 0.02, 0.42),
    coreRadiusPx,
    twinkleAmplitude: calibration.starTwinkleAmplitude * clamp(0.08 + apparentBrightness * 0.32, 0.08, 0.4),
    alpha: clamp(0.18 + apparentBrightness * 0.78, 0.18, 0.99),
    emissiveScale: clamp(0.22 + apparentBrightness * 1.12, 0.22, 1.34),
    diffuseScale: clamp(0.004 + apparentBrightness * 0.022, 0.004, 0.03),
    psfDiameterPx: clamp(Math.max(haloRadiusPx * 1.9, coreRadiusPx * 3.1, diameter * 18), 2.2, 42),
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
  halo.addColorStop(0, `rgba(255, 255, 255, ${clamp(0.32 + profile.alpha * 0.62, 0.32, 0.96)})`)
  halo.addColorStop(0.03, `rgba(${red}, ${green}, ${blue}, ${Math.min(0.98, profile.alpha)})`)
  halo.addColorStop(0.11, `rgba(${red}, ${green}, ${blue}, ${Math.min(0.88, profile.alpha * 0.94)})`)
  halo.addColorStop(0.24, `rgba(${red}, ${green}, ${blue}, ${profile.haloAlpha})`)
  halo.addColorStop(0.54, `rgba(${red}, ${green}, ${blue}, ${profile.haloAlpha * 0.22})`)
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
