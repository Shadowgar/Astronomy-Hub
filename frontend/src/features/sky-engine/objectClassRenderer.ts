import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'

import { buildDedicatedStarTexture, getStarRenderProfile, type StarRenderProfile } from './starRenderer'
import type { SkyEngineSceneObject, SkyEngineVisualCalibration } from './types'

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function buildPlanetTexture(name: string, colorHex: string) {
  const texture = new DynamicTexture(name, { width: 96, height: 96 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const red = Number.parseInt(colorHex.slice(1, 3), 16)
  const green = Number.parseInt(colorHex.slice(3, 5), 16)
  const blue = Number.parseInt(colorHex.slice(5, 7), 16)
  const halo = context.createRadialGradient(48, 48, 4, 48, 48, 24)

  context.clearRect(0, 0, 96, 96)
  halo.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0.96)`)
  halo.addColorStop(0.34, `rgba(${red}, ${green}, ${blue}, 0.72)`)
  halo.addColorStop(0.82, `rgba(${red}, ${green}, ${blue}, 0.08)`)
  halo.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`)
  context.fillStyle = halo
  context.beginPath()
  context.arc(48, 48, 24, 0, Math.PI * 2)
  context.fill()
  texture.update()

  return texture
}

function buildDeepSkyMarkerTexture(name: string, colorHex: string) {
  const texture = new DynamicTexture(name, { width: 96, height: 96 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const red = Number.parseInt(colorHex.slice(1, 3), 16)
  const green = Number.parseInt(colorHex.slice(3, 5), 16)
  const blue = Number.parseInt(colorHex.slice(5, 7), 16)

  context.clearRect(0, 0, 96, 96)
  context.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.76)`
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(48, 20)
  context.lineTo(80, 48)
  context.lineTo(48, 76)
  context.lineTo(16, 48)
  context.closePath()
  context.stroke()

  context.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.2)`
  context.lineWidth = 1.6
  context.beginPath()
  context.arc(48, 48, 24, 0, Math.PI * 2)
  context.stroke()
  texture.update()

  return texture
}

export function buildMoonTexture(name: string, illuminationFraction = 0.5, brightLimbAngleDeg = 0, waxing = true) {
  const texture = new DynamicTexture(name, { width: 256, height: 256 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const imageData = context.createImageData(256, 256)
  const sunX = Math.sin((brightLimbAngleDeg * Math.PI) / 180) * (waxing ? 1 : -1)
  const sunY = -Math.cos((brightLimbAngleDeg * Math.PI) / 180)
  const phaseAngle = Math.acos(clamp(1 - illuminationFraction * 2, -1, 1))
  const sunZ = Math.cos(phaseAngle)

  for (let pixelY = 0; pixelY < 256; pixelY += 1) {
    for (let pixelX = 0; pixelX < 256; pixelX += 1) {
      const normalizedX = (pixelX - 128) / 92
      const normalizedY = (pixelY - 128) / 92
      const radiusSquared = normalizedX * normalizedX + normalizedY * normalizedY

      if (radiusSquared > 1) {
        continue
      }

      const normalizedZ = Math.sqrt(1 - radiusSquared)
      const light = Math.max(0, normalizedX * sunX + normalizedY * sunY + normalizedZ * sunZ)
      const rim = 1 - Math.sqrt(radiusSquared)
      const crater = Math.sin(pixelX * 0.12) * Math.cos(pixelY * 0.08) * 0.03
      const brightness = clamp(0.12 + light * 0.84 + rim * 0.06 + crater, 0, 1)
      const index = (pixelY * 256 + pixelX) * 4
      imageData.data[index] = Math.round(208 + brightness * 42)
      imageData.data[index + 1] = Math.round(202 + brightness * 36)
      imageData.data[index + 2] = Math.round(188 + brightness * 28)
      imageData.data[index + 3] = 255
    }
  }

  context.clearRect(0, 0, 256, 256)
  const halo = context.createRadialGradient(128, 128, 38, 128, 128, 122)
  halo.addColorStop(0, 'rgba(255, 245, 214, 0.14)')
  halo.addColorStop(0.7, 'rgba(255, 245, 214, 0.05)')
  halo.addColorStop(1, 'rgba(255, 245, 214, 0)')
  context.fillStyle = halo
  context.beginPath()
  context.arc(128, 128, 122, 0, Math.PI * 2)
  context.fill()
  context.putImageData(imageData, 0, 0)
  texture.update()

  return texture
}

export function buildSelectionRingTexture(name: string, colorHex = '#ffffff', coreAlpha = 0.94, rimAlpha = 0.22) {
  const texture = new DynamicTexture(name, { width: 128, height: 128 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const red = Number.parseInt(colorHex.slice(1, 3), 16)
  const green = Number.parseInt(colorHex.slice(3, 5), 16)
  const blue = Number.parseInt(colorHex.slice(5, 7), 16)
  context.clearRect(0, 0, 128, 128)
  context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${coreAlpha})`
  context.lineWidth = 8
  context.beginPath()
  context.arc(64, 64, 42, 0, Math.PI * 2)
  context.stroke()

  context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${rimAlpha})`
  context.lineWidth = 2
  context.beginPath()
  context.arc(64, 64, 52, 0, Math.PI * 2)
  context.stroke()
  texture.update()

  return texture
}

export function getObjectMarkerDiameter(
  object: SkyEngineSceneObject,
  calibration: SkyEngineVisualCalibration,
  starProfile?: StarRenderProfile,
) {
  if (object.type === 'moon') {
    return 7.4
  }

  if (object.type === 'planet') {
    return 1.2 + Math.max(0, 2.6 - Math.min(3, object.magnitude + 2.5)) * 0.4
  }

  if (object.type === 'deep_sky') {
    return object.source === 'temporary_scene_seed' ? 2.4 : 2.8
  }

  return starProfile?.diameter ?? getStarRenderProfile(object, calibration).diameter
}

export function getObjectPickRadiusPx(object: SkyEngineSceneObject) {
  if (object.type === 'moon') {
    return 32
  }

  if (object.type === 'planet') {
    return 24
  }

  if (object.type === 'deep_sky') {
    return object.source === 'temporary_scene_seed' ? 13 : 16
  }

  return 18
}

export function getLabelOffsetRadius(object: SkyEngineSceneObject) {
  if (object.type === 'moon') {
    return 7.2
  }

  if (object.type === 'planet') {
    return 5.4
  }

  if (object.type === 'deep_sky') {
    return 5.8
  }

  return 4.4
}

export function getMarkerBaseAlpha(object: SkyEngineSceneObject) {
  if (object.source === 'temporary_scene_seed') {
    return 0.72
  }

  return 1
}

export function buildObjectMarkerTexture(
  name: string,
  object: SkyEngineSceneObject,
  calibration: SkyEngineVisualCalibration,
  starProfile?: StarRenderProfile,
) {
  if (object.type === 'moon') {
    return buildMoonTexture(name, object.illuminationFraction, object.brightLimbAngleDeg, object.waxing)
  }

  if (object.type === 'planet') {
    return buildPlanetTexture(name, object.colorHex)
  }

  if (object.type === 'deep_sky' || object.source === 'temporary_scene_seed') {
    return buildDeepSkyMarkerTexture(name, object.colorHex)
  }

  return buildDedicatedStarTexture(name, starProfile ?? getStarRenderProfile(object, calibration))
}
