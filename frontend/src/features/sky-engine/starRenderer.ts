import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'

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
  return clamp(Math.pow(smoothstep(luminance), 0.72), 0, 1)
}

function getMagnitudeSizeWeight(magnitude: number) {
  const luminance = getMagnitudeLuminance(magnitude)
  const brightness = getMagnitudeBrightness(magnitude)
  return clamp(Math.pow(luminance, 0.44) * 0.72 + brightness * 0.34, 0, 1)
}

export function getStarRenderProfileForMagnitude(
  magnitude: number,
  colorIndexBV: number | undefined,
  calibration: SkyEngineVisualCalibration,
): StarRenderProfile {
  const brightness = getMagnitudeBrightness(magnitude)
  const sizeWeight = getMagnitudeSizeWeight(magnitude)
  const brightGlowWeight = clamp(Math.pow(brightness, 1.28), 0, 1)
  const colorHex = resolveStarColorHex(colorIndexBV)

  return {
    colorHex,
    diameter: clamp(0.08 + sizeWeight * 1.22, 0.08, 1.3),
    haloRadiusPx: clamp(1.2 + sizeWeight * 14 + brightGlowWeight * 7.2, 1.2, 20.5),
    haloAlpha: clamp(0.012 + calibration.starHaloVisibility * (0.05 + brightGlowWeight * 0.3), 0.012, 0.34),
    coreRadiusPx: clamp(0.36 + sizeWeight * 4.8 + brightGlowWeight * 1.2, 0.36, 6.4),
    twinkleAmplitude: calibration.starTwinkleAmplitude * clamp(0.1 + brightness * 0.38, 0.1, 0.52),
    alpha: clamp(0.08 + calibration.starFieldBrightness * (0.1 + brightness * 0.86), 0.1, 0.99),
    emissiveScale: clamp(0.14 + calibration.starFieldBrightness * (0.18 + brightGlowWeight * 0.96), 0.14, 1.12),
    diffuseScale: clamp(0.003 + calibration.starFieldBrightness * (0.004 + sizeWeight * 0.02), 0.003, 0.028),
  }
}

export function getStarRenderProfile(
  object: SkyEngineSceneObject,
  calibration: SkyEngineVisualCalibration,
): StarRenderProfile {
  return getStarRenderProfileForMagnitude(object.magnitude, object.colorIndexBV, calibration)
}

export function buildDedicatedStarTexture(name: string, profile: StarRenderProfile) {
  const texture = new DynamicTexture(name, { width: 96, height: 96 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const red = Number.parseInt(profile.colorHex.slice(1, 3), 16)
  const green = Number.parseInt(profile.colorHex.slice(3, 5), 16)
  const blue = Number.parseInt(profile.colorHex.slice(5, 7), 16)
  const halo = context.createRadialGradient(48, 48, 1, 48, 48, profile.haloRadiusPx)

  context.clearRect(0, 0, 96, 96)
  halo.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${Math.min(0.94, profile.alpha)})`)
  halo.addColorStop(0.06, `rgba(${red}, ${green}, ${blue}, ${Math.min(0.86, profile.alpha * 0.92)})`)
  halo.addColorStop(0.18, `rgba(${red}, ${green}, ${blue}, ${profile.haloAlpha})`)
  halo.addColorStop(0.48, `rgba(${red}, ${green}, ${blue}, ${profile.haloAlpha * 0.18})`)
  halo.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`)
  context.fillStyle = halo
  context.beginPath()
  context.arc(48, 48, profile.haloRadiusPx, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${clamp(0.24 + profile.alpha * 0.72, 0.28, 0.96)})`
  context.beginPath()
  context.arc(48, 48, profile.coreRadiusPx * 1.25, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = `rgba(255, 255, 255, ${clamp(0.18 + profile.alpha * 0.78, 0.22, 0.98)})`
  context.beginPath()
  context.arc(48, 48, Math.max(0.72, profile.coreRadiusPx * 0.72), 0, Math.PI * 2)
  context.fill()
  texture.update()

  return texture
}
