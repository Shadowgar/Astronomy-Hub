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

export interface StellariumPointVisual {
  readonly visible: boolean
  readonly radiusPx: number
  readonly luminance: number
}

const ARCSECONDS_PER_RADIAN = (180 / Math.PI) * 3600
const DEGREES_TO_RADIANS = Math.PI / 180
const STELLARIUM_FOV_EYE_RADIANS = 60 * DEGREES_TO_RADIANS
const STELLARIUM_POINT_SPREAD_RADIUS_RAD = (2.5 / 60) * (Math.PI / 180)
const STELLARIUM_MIN_POINT_AREA_SR = Math.PI * STELLARIUM_POINT_SPREAD_RADIUS_RAD * STELLARIUM_POINT_SPREAD_RADIUS_RAD
const STELLARIUM_STAR_LINEAR_SCALE = 0.8
const STELLARIUM_STAR_RELATIVE_SCALE = 1.1
const STELLARIUM_MAX_POINT_RADIUS_PX = 50
const STELLARIUM_MIN_POINT_RADIUS_PX = 0.6
const STELLARIUM_SKIP_POINT_RADIUS_PX = 0.25

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function exp10(value: number) {
  return Math.exp(value * Math.log(10))
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

function tonemapperMap(lw: number, p: number, lwmax: number, exposure: number) {
  return (Math.log(1 + p * lw) / Math.log(1 + p * lwmax)) * exposure
}

function getMagnitudeIlluminance(magnitude: number) {
  return 10.7646e4 / (ARCSECONDS_PER_RADIAN * ARCSECONDS_PER_RADIAN) * exp10(-0.4 * magnitude)
}

function getSceneResponseWeight(state: SkyBrightnessExposureState | undefined) {
  if (!state) {
    return {
      sceneContrast: 1,
      tonemapperP: 2.2,
      tonemapperExposure: 2,
      tonemapperLwmax: 0.052,
    }
  }

  return {
    sceneContrast: clamp(state.sceneContrast, 0.46, 1.08),
    tonemapperP: clamp(state.tonemapperP, 0.8, 4),
    tonemapperExposure: clamp(state.tonemapperExposure, 0.8, 2.2),
    tonemapperLwmax: clamp(state.tonemapperLwmax, 0.052, 5000),
  }
}

function getScreenScaleFactor(screenSizePx: number) {
  return clamp(screenSizePx / 600, 0.7, 1.5)
}

function getTelescopeState(fovDegrees: number) {
  const fovRad = clamp(fovDegrees, 0.25, 180) * DEGREES_TO_RADIANS
  const magnification = STELLARIUM_FOV_EYE_RADIANS / fovRad
  const exposure = Math.pow(Math.max(1, (5 * DEGREES_TO_RADIANS) / fovRad), 0.07)
  const lightGrasp = Math.max(0.4, magnification * magnification * exposure)

  return {
    magnification,
    lightGrasp,
    gainMagnitude: 2.5 * Math.log10(lightGrasp),
  }
}

function getApparentLuminanceForMagnitude(magnitude: number, fovDegrees: number) {
  const telescope = getTelescopeState(fovDegrees)
  return getMagnitudeIlluminance(clamp(magnitude - telescope.gainMagnitude, -192, 64)) / STELLARIUM_MIN_POINT_AREA_SR
}

export function computeStellariumPointVisual(
  magnitude: number,
  brightnessExposureState: SkyBrightnessExposureState | undefined,
  screenSizePx: number,
  fovDegrees = 60,
): StellariumPointVisual {
  const response = getSceneResponseWeight(brightnessExposureState)
  const apparentLuminance = getApparentLuminanceForMagnitude(magnitude, fovDegrees)
  let displayLuminance = tonemapperMap(
    apparentLuminance,
    response.tonemapperP,
    response.tonemapperLwmax,
    response.tonemapperExposure,
  )

  if (displayLuminance < 0) {
    displayLuminance = 0
  }

  const screenFactor = getScreenScaleFactor(screenSizePx)
  const radiusUnclamped = STELLARIUM_STAR_LINEAR_SCALE * screenFactor * Math.pow(displayLuminance, STELLARIUM_STAR_RELATIVE_SCALE / 2)

  if (radiusUnclamped < STELLARIUM_SKIP_POINT_RADIUS_PX) {
    return {
      visible: false,
      radiusPx: 0,
      luminance: 0,
    }
  }

  let radiusPx = radiusUnclamped

  if (radiusPx < STELLARIUM_MIN_POINT_RADIUS_PX) {
    const fadeAmount = clamp(
      (radiusPx - STELLARIUM_SKIP_POINT_RADIUS_PX) / (STELLARIUM_MIN_POINT_RADIUS_PX - STELLARIUM_SKIP_POINT_RADIUS_PX),
      0,
      1,
    )
    displayLuminance *= fadeAmount * fadeAmount
    radiusPx = STELLARIUM_MIN_POINT_RADIUS_PX
  }

  return {
    visible: true,
    radiusPx: Math.min(radiusPx, STELLARIUM_MAX_POINT_RADIUS_PX),
    luminance: clamp(Math.pow(displayLuminance, 1 / 2.2), 0, 1),
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
