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

function toHex(channel: number) {
  return Math.round(channel).toString(16).padStart(2, '0')
}

export function resolveStarColorHex(colorIndexBV = 0.65) {
  const normalizedColorIndex = clamp(colorIndexBV, -0.4, 2)
  let red = 255
  let green = 255
  let blue = 255

  if (normalizedColorIndex < 0) {
    const factor = (normalizedColorIndex + 0.4) / 0.4
    red = 155 + factor * 100
    green = 180 + factor * 60
    blue = 255
  } else if (normalizedColorIndex < 0.4) {
    const factor = normalizedColorIndex / 0.4
    red = 255
    green = 240 + factor * 12
    blue = 255 - factor * 18
  } else if (normalizedColorIndex < 1.1) {
    const factor = (normalizedColorIndex - 0.4) / 0.7
    red = 255
    green = 252 - factor * 32
    blue = 237 - factor * 82
  } else {
    const factor = (normalizedColorIndex - 1.1) / 0.9
    red = 255
    green = 220 - factor * 48
    blue = 155 - factor * 80
  }

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`
}

function getMagnitudeBrightness(magnitude: number) {
  return clamp(1 - (magnitude + 1.5) / 7.6, 0, 1)
}

export function getStarRenderProfile(
  object: SkyEngineSceneObject,
  calibration: SkyEngineVisualCalibration,
): StarRenderProfile {
  const brightness = getMagnitudeBrightness(object.magnitude)
  const haloWeight = brightness * calibration.starHaloVisibility
  const colorHex = resolveStarColorHex(object.colorIndexBV)

  return {
    colorHex,
    diameter: clamp(0.16 + brightness * 0.42, 0.16, 0.58),
    haloRadiusPx: clamp(5.5 + brightness * 8.5, 5.5, 13.5),
    haloAlpha: clamp(0.05 + haloWeight * 0.22, 0.05, 0.24),
    coreRadiusPx: clamp(0.9 + brightness * 2.3, 0.9, 3.1),
    twinkleAmplitude: calibration.starTwinkleAmplitude * clamp(0.35 + brightness * 0.75, 0.35, 1),
    alpha: clamp(0.2 + calibration.starFieldBrightness * (0.52 + brightness * 0.38), 0.18, 1),
    emissiveScale: clamp(0.34 + calibration.starFieldBrightness * (0.44 + brightness * 0.46), 0.3, 1.08),
    diffuseScale: clamp(0.008 + calibration.starFieldBrightness * 0.028, 0.008, 0.04),
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
  halo.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0.96)`)
  halo.addColorStop(0.08, `rgba(${red}, ${green}, ${blue}, 0.9)`)
  halo.addColorStop(0.24, `rgba(${red}, ${green}, ${blue}, ${profile.haloAlpha})`)
  halo.addColorStop(0.62, `rgba(${red}, ${green}, ${blue}, ${profile.haloAlpha * 0.32})`)
  halo.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`)
  context.fillStyle = halo
  context.beginPath()
  context.arc(48, 48, profile.haloRadiusPx, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#ffffff'
  context.beginPath()
  context.arc(48, 48, profile.coreRadiusPx, 0, Math.PI * 2)
  context.fill()
  texture.update()

  return texture
}
