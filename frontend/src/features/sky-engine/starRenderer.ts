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

function toHex(channel: number) {
  return Math.round(channel).toString(16).padStart(2, '0')
}

export function resolveStarColorHex(colorIndexBV = 0.65) {
  const normalizedColorIndex = clamp(colorIndexBV, -0.4, 2)

  if (normalizedColorIndex < 0) {
    const factor = (normalizedColorIndex + 0.4) / 0.4
    const red = 155 + factor * 100
    const green = 180 + factor * 60
    const blue = 255
    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`
  } else if (normalizedColorIndex < 0.4) {
    const factor = normalizedColorIndex / 0.4
    const red = 255
    const green = 240 + factor * 12
    const blue = 255 - factor * 18
    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`
  } else if (normalizedColorIndex < 1.1) {
    const factor = (normalizedColorIndex - 0.4) / 0.7
    const red = 255
    const green = 252 - factor * 32
    const blue = 237 - factor * 82
    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`
  }

  const factor = (normalizedColorIndex - 1.1) / 0.9
  const red = 255
  const green = 220 - factor * 48
  const blue = 155 - factor * 80
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`
}

function getMagnitudeBrightness(magnitude: number) {
  const normalizedMagnitude = clamp((9.4 - magnitude) / 10.6, 0, 1)
  return smoothstep(normalizedMagnitude)
}

function getMagnitudeSizeWeight(magnitude: number) {
  const brightness = getMagnitudeBrightness(magnitude)
  return clamp(brightness * (0.58 + brightness * 0.72), 0, 1)
}

export function getStarRenderProfile(
  object: SkyEngineSceneObject,
  calibration: SkyEngineVisualCalibration,
): StarRenderProfile {
  const brightness = getMagnitudeBrightness(object.magnitude)
  const sizeWeight = getMagnitudeSizeWeight(object.magnitude)
  const haloWeight = brightness * calibration.starHaloVisibility
  const colorHex = resolveStarColorHex(object.colorIndexBV)

  return {
    colorHex,
    diameter: clamp(0.1 + sizeWeight * 0.86, 0.1, 0.96),
    haloRadiusPx: clamp(1.9 + sizeWeight * 10.5, 1.9, 12.4),
    haloAlpha: clamp(0.02 + haloWeight * 0.24, 0.02, 0.3),
    coreRadiusPx: clamp(0.52 + sizeWeight * 3.1, 0.52, 3.62),
    twinkleAmplitude: calibration.starTwinkleAmplitude * clamp(0.18 + brightness * 0.48, 0.18, 0.66),
    alpha: clamp(0.14 + calibration.starFieldBrightness * (0.16 + brightness * 0.72), 0.18, 0.98),
    emissiveScale: clamp(0.18 + calibration.starFieldBrightness * (0.14 + brightness * 0.78), 0.18, 0.96),
    diffuseScale: clamp(0.004 + calibration.starFieldBrightness * (0.004 + sizeWeight * 0.012), 0.004, 0.02),
  }
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
