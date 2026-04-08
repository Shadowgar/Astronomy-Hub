import React, { useEffect, useRef } from 'react'

import { Camera } from '@babylonjs/core/Cameras/camera'
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Scene } from '@babylonjs/core/scene'

import {
  clampSkyEngineFov,
  getSelectionTargetVector,
  getSkyEngineFovDegrees,
  rotateVectorTowardPointerAnchor,
  stabilizeSkyEngineCenterDirection,
  stepSkyEngineFov,
  updateObserverNavigation,
} from './observerNavigation'
import {
  buildSkyEnginePickTargets,
  clearSkyEnginePickTargets,
  getSkyEnginePickColliderDiameter,
  type ProjectedPickTargetEntry,
  resolveSkyEnginePickSelection,
  writeSkyEnginePickTargets,
} from './pickTargets'
import {
  type SkyProjectionMode,
  directionToHorizontal,
  getProjectionScale,
  horizontalToDirection,
  isProjectedPointVisible,
  projectDirectionToViewport,
  projectHorizontalToViewport,
  type SkyProjectionView,
  unprojectViewportPoint,
} from './projectionMath'
import {
  buildAtmosphericExtinctionContext,
  computeObservedMagnitude,
} from './atmosphericExtinction'
import { renderNightSkyBackground } from './nightSkyBackground'
import { computeEffectiveLimitingMagnitude, computeSkyBrightness } from './skyBrightness'
import { computeVisibilityAlpha, computeVisibilitySizeScale } from './starVisibility'
import { getStarRenderProfile, getStarRenderProfileForMagnitude } from './starRenderer'
import { buildProceduralSkyBackdrop, buildSyntheticSkyDensityField } from './syntheticStarField'
import { renderPreethamSkyBackground, blendNightSky } from './preethamSky'
import { createDirectObjectLayer, type DirectProjectedObjectEntry } from './directObjectLayer'
import { createDirectOverlayLayer, prepareDirectOverlayFrame } from './directOverlayLayer'
import type { SkyScenePacket } from './engine/sky'
import type { BackendSkySceneStarObject } from '../scene/contracts'
import type {
  SkyEngineAidVisibility,
  SkyEngineAtmosphereStatus,
  SkyEngineObserver,
  SkyEngineSceneObject,
  SkyEngineSunState,
} from './types'
import type { StarRenderProfile } from './starRenderer'

interface SkyEngineSceneProps {
  readonly backendStars: readonly BackendSkySceneStarObject[]
  readonly observer: SkyEngineObserver
  readonly objects: readonly SkyEngineSceneObject[]
  readonly scenePacket: SkyScenePacket | null
  readonly initialViewState: {
    fovDegrees: number
    centerAltDeg: number
    centerAzDeg: number
  }
  readonly projectionMode?: SkyProjectionMode
  readonly sunState: SkyEngineSunState
  readonly selectedObjectId: string | null
  readonly guidedObjectIds: readonly string[]
  readonly aidVisibility: SkyEngineAidVisibility
  readonly onSelectObject: (objectId: string | null) => void
  readonly onAtmosphereStatusChange: (status: SkyEngineAtmosphereStatus) => void
  readonly onViewStateChange?: (viewState: { fovDegrees: number; centerAltDeg: number; centerAzDeg: number }) => void
}

interface ScenePropsSnapshot extends SkyEngineSceneProps {}

interface SceneRuntimeRefs {
  scene: Scene
  engine: Engine
  camera: UniversalCamera
  canvas: HTMLCanvasElement
  backgroundCanvas: HTMLCanvasElement
  directObjectLayer: ReturnType<typeof createDirectObjectLayer>
  directOverlayLayer: ReturnType<typeof createDirectOverlayLayer>
  centerDirection: Vector3
  targetVector: Vector3 | null
  currentFov: number
  desiredFov: number
  selectedObjectId: string | null
  activePointerId: number | null
  dragAnchorDirection: Vector3 | null
  dragBaseCenterDirection: Vector3 | null
  dragStartX: number
  dragStartY: number
  dragMoved: boolean
  projectedPickEntries: ProjectedPickTargetEntry[]
  lastFrameTime: number
  lastReportedFovTenths: number | null
  lastReportedCenterAltTenths: number | null
  lastReportedCenterAzTenths: number | null
  needsRender: boolean
  renderedPropsVersion: number
  animationTime: number
}

interface SceneStateWriteInput {
  backendStarCount: number
  canvas: HTMLCanvasElement
  objects: readonly SkyEngineSceneObject[]
  selectedObjectId: string | null
  trajectoryObjectId: string | null
  visibleLabelIds: readonly string[]
  guidedObjectIds: readonly string[]
  aidVisibility: SkyEngineAidVisibility
  currentFovDegrees: number
  currentLodTier: 'wide' | 'medium' | 'close'
  labelCap: number
  groundTextureMode: string
  groundTextureAssetPath: string
}

interface ProjectedSceneObjectEntry extends DirectProjectedObjectEntry {
  object: SkyEngineSceneObject
  screenX: number
  screenY: number
  depth: number
  angularDistanceRad: number
  markerRadiusPx: number
  pickRadiusPx: number
  renderAlpha: number
  renderedMagnitude?: number
  visibilityAlpha?: number
  starProfile?: StarRenderProfile
}

const SKY_ENGINE_SCENE_STATE_ATTRIBUTE = 'data-sky-engine-scene-state'
const POINTER_DRAG_THRESHOLD_PX = 6
const STAR_BELOW_HORIZON_FADE_DEG = 8
const BODY_BELOW_HORIZON_FADE_DEG = 1.5
const SYNTHETIC_SKY_DENSITY_SAMPLES = buildSyntheticSkyDensityField(2800)
const PROCEDURAL_SKY_BACKDROP = buildProceduralSkyBackdrop(180)
const CONSTELLATION_SEGMENTS = [
  ['sky-real-vega', 'sky-real-sheliak'],
  ['sky-real-vega', 'sky-real-sulafat'],
  ['sky-real-deneb', 'sky-real-albireo'],
  ['sky-real-altair', 'sky-real-tarazed'],
] as const

const COMPASS_CARDINALS = [
  { label: 'N', azimuthDeg: 0 },
  { label: 'E', azimuthDeg: 90 },
  { label: 'S', azimuthDeg: 180 },
  { label: 'W', azimuthDeg: 270 },
] as const

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function smoothstep(edge0: number, edge1: number, value: number) {
  if (edge0 === edge1) {
    return value >= edge1 ? 1 : 0
  }

  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return amount * amount * (3 - 2 * amount)
}

function mix(left: number, right: number, amount: number) {
  return left + (right - left) * amount
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

function isEngineTileSource(source: SkyEngineSceneObject['source']) {
  return source === 'engine_mock_tile' || source === 'engine_hipparcos_tile'
}

function writeSceneState({
  backendStarCount,
  canvas,
  objects,
  selectedObjectId,
  trajectoryObjectId,
  visibleLabelIds,
  guidedObjectIds,
  aidVisibility,
  currentFovDegrees,
  currentLodTier,
  labelCap,
  groundTextureMode,
  groundTextureAssetPath,
}: SceneStateWriteInput) {
  const moonObject = objects.find((object) => object.type === 'moon')

  canvas.setAttribute(
    SKY_ENGINE_SCENE_STATE_ATTRIBUTE,
    JSON.stringify({
      horizonVisible: true,
      selectedObjectId,
      trajectoryObjectId,
      visibleLabelIds,
      guidanceObjectIds: guidedObjectIds,
      moonObjectId: moonObject?.id ?? null,
      controlledLabelCount: visibleLabelIds.length,
      backendStarCount,
      labelCap,
      aidVisibility,
      currentFovDegrees,
      currentLodTier,
      groundTextureMode,
      groundTextureAssetPath,
    }),
  )
}

function clearSceneState(canvas: HTMLCanvasElement) {
  canvas.removeAttribute(SKY_ENGINE_SCENE_STATE_ATTRIBUTE)
}

function hexToRgb(hex: string) {
  return {
    red: Number.parseInt(hex.slice(1, 3), 16),
    green: Number.parseInt(hex.slice(3, 5), 16),
    blue: Number.parseInt(hex.slice(5, 7), 16),
  }
}

function hexToRgba(hex: string, alpha: number) {
  const { red, green, blue } = hexToRgb(hex)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function resolveViewTier(fovDegrees: number) {
  if (fovDegrees >= 90) {
    return { tier: 'wide' as const, labelCap: 6 }
  }

  if (fovDegrees >= 35) {
    return { tier: 'medium' as const, labelCap: 8 }
  }

  return { tier: 'close' as const, labelCap: 10 }
}

function shouldRenderObject(
  object: SkyEngineSceneObject,
  centerAltitudeDeg: number,
  fovDegrees: number,
  _sunState: SkyEngineSunState,
  selectedObjectId: string | null,
) {
  if (isEngineTileSource(object.source)) {
    return false
  }

  if (object.id === selectedObjectId) {
    return true
  }

  if (getObjectHorizonFade(object, centerAltitudeDeg, fovDegrees) <= 0) {
    return false
  }

  return true
}

function getProjectedDiscRadiusPx(apparentSizeDeg: number | undefined, scale: number, minimumRadiusPx: number, maximumRadiusPx: number) {
  if (!apparentSizeDeg || apparentSizeDeg <= 0) {
    return minimumRadiusPx
  }

  const angularRadius = (apparentSizeDeg * Math.PI) / 360
  const planeRadius = 2 * Math.tan(angularRadius / 2)
  return clamp(planeRadius * scale, minimumRadiusPx, maximumRadiusPx)
}

function getMarkerRadiusPx(
  object: SkyEngineSceneObject,
  view: SkyProjectionView,
  sunState: SkyEngineSunState,
  starProfile?: StarRenderProfile,
) {
  const scale = getProjectionScale(view)

  if (object.type === 'moon') {
    return getProjectedDiscRadiusPx(object.apparentSizeDeg, scale, 11, 36)
  }

  if (object.type === 'planet') {
    return getProjectedDiscRadiusPx(object.apparentSizeDeg, scale, 4.2, 14) + clamp(2.2 - object.magnitude * 0.2, 0.3, 2.8)
  }

  if (object.type === 'deep_sky') {
    return object.source === 'temporary_scene_seed' ? 7.2 : 8.4
  }

  const profile = starProfile ?? getStarRenderProfile(object, sunState.visualCalibration)
  const starBase = Math.max(profile.coreRadiusPx * 1.1, profile.haloRadiusPx * 0.32, profile.diameter * 7.4)
  return clamp(starBase, 0.85, 7.6) * clamp(sunState.visualCalibration.starFieldBrightness * 1.02, 0.4, 1.08)
}

function getPickRadiusPx(object: SkyEngineSceneObject, markerRadiusPx: number) {
  return Math.max(getSkyEnginePickColliderDiameter(object) * 3.2, markerRadiusPx + 14)
}

function getLabelPriority(object: SkyEngineSceneObject, selectedObjectId: string | null, guidedObjectIds: ReadonlySet<string>) {
  if (object.id === selectedObjectId) {
    return 1000
  }

  let priority = 0

  if (object.type === 'moon') {
    priority += 220
  } else if (object.type === 'planet') {
    priority += 170
  } else if (object.type === 'deep_sky') {
    priority += object.source === 'temporary_scene_seed' ? 120 : 95
  } else {
    priority += clamp(72 - object.magnitude * 14, 12, 72)
  }

  if (guidedObjectIds.has(object.id)) {
    priority += object.guidanceTier === 'featured' ? 84 : 52
  }

  return priority
}

function drawBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  sunState: SkyEngineSunState,
  view: SkyProjectionView | null,
) {
  if (view) {
    // Preetham physically-based sky when projection view is available
    const calibration = sunState.visualCalibration
    const dayExposure = calibration.atmosphereExposure
    // Turbidity: clear=2 for night, slightly hazy=3 for day, hazier at low sun
    let turbidity = 2.8
    if (sunState.phaseLabel === 'Low Sun') {
      turbidity = 4
    } else if (sunState.phaseLabel === 'Night') {
      turbidity = 2.2
    }

    renderPreethamSkyBackground(context, width, height, {
      sunAltDeg: sunState.altitudeDeg,
      sunAzDeg: sunState.azimuthDeg,
      turbidity,
      exposure: clamp(dayExposure, 0.6, 1.4),
    }, (sx, sy) => {
      const dir = unprojectViewportPoint(sx, sy, view)
      return { dirEast: dir.x, dirUp: dir.y, dirNorth: dir.z }
    })

    // Cross-fade to calibrated night sky colors below the horizon
    blendNightSky(
      context, width, height,
      sunState.altitudeDeg,
      calibration.skyZenithColorHex,
      calibration.skyHorizonColorHex,
    )

    renderNightSkyBackground(
      context,
      width,
      height,
      sunState.altitudeDeg,
      (sx, sy) => {
        const dir = unprojectViewportPoint(sx, sy, view)
        return { dirEast: dir.x, dirUp: dir.y, dirNorth: dir.z }
      },
    )
  } else {
    // Fallback: simple gradient (initial frame before view is ready)
    const skyGradient = context.createLinearGradient(0, 0, 0, height)
    skyGradient.addColorStop(0, sunState.visualCalibration.skyZenithColorHex)
    skyGradient.addColorStop(0.82, sunState.visualCalibration.skyHorizonColorHex)
    skyGradient.addColorStop(1, sunState.visualCalibration.backgroundColorHex)
    context.fillStyle = skyGradient
    context.fillRect(0, 0, width, height)
  }

  // Subtle vignette for depth
  const vignette = context.createRadialGradient(
    width * 0.5,
    height * 0.46,
    Math.min(width, height) * 0.08,
    width * 0.5,
    height * 0.46,
    Math.min(width, height) * 0.72,
  )
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.18)')
  context.fillStyle = vignette
  context.fillRect(0, 0, width, height)
}

function getSyntheticDensityMagnitudeLimit(fovDegrees: number, renderLimitingMagnitude: number) {
  const closeBlend = 1 - smoothstep(18, 120, fovDegrees)
  const ultraCloseBlend = 1 - smoothstep(0.7, 6, fovDegrees)

  return clamp(renderLimitingMagnitude + 0.45 + closeBlend * 0.85 + ultraCloseBlend * 0.55, -1, 14.6)
}

function getSyntheticDensityBudget(fovDegrees: number, sunState: SkyEngineSunState) {
  const visibility = clamp(sunState.visualCalibration.starVisibility, 0, 1)
  const brightness = clamp(sunState.visualCalibration.starFieldBrightness, 0, 1)
  const closeBlend = 1 - smoothstep(28, 140, fovDegrees)
  const ultraCloseBlend = 1 - smoothstep(0.7, 6, fovDegrees)
  const baseBudget = mix(260, 1700, closeBlend)
  const closeBoost = mix(1, 1.45, ultraCloseBlend)

  return Math.round(baseBudget * closeBoost * (0.3 + visibility * 0.7) * (0.34 + brightness * 0.66))
}

function getBackdropOpacity(sunState: SkyEngineSunState) {
  return clamp(sunState.visualCalibration.starVisibility * 0.62 + sunState.visualCalibration.starFieldBrightness * 0.24, 0, 1)
}

function drawProceduralSkyBackdrop(
  context: CanvasRenderingContext2D,
  view: SkyProjectionView,
  sunState: SkyEngineSunState,
  fovDegrees: number,
) {
  const backdropOpacity = getBackdropOpacity(sunState)

  if (backdropOpacity <= 0.08) {
    return
  }

  const projectionScale = getProjectionScale(view)
  const wideBlend = smoothstep(80, 185, fovDegrees)

  context.save()
  PROCEDURAL_SKY_BACKDROP.forEach((patch) => {
    const projected = projectDirectionToViewport(patch.direction, view)

    if (!projected || !isProjectedPointVisible(projected, view, 120)) {
      return
    }

    const radiusPx = clamp(projectionScale * Math.tan(degreesToRadians(patch.radiusDeg) * 0.5), 28, 240)
    const alpha = patch.alpha * backdropOpacity * (0.35 + patch.bandWeight * 0.95) * (0.56 + wideBlend * 0.44)

    if (alpha <= 0.004) {
      return
    }

    const glow = context.createRadialGradient(projected.screenX, projected.screenY, 0, projected.screenX, projected.screenY, radiusPx)
    glow.addColorStop(0, hexToRgba(patch.colorHex, alpha * 0.34))
    glow.addColorStop(0.42, hexToRgba(patch.colorHex, alpha * 0.16))
    glow.addColorStop(1, hexToRgba(patch.colorHex, 0))
    context.fillStyle = glow
    context.beginPath()
    context.arc(projected.screenX, projected.screenY, radiusPx, 0, Math.PI * 2)
    context.fill()
  })
  context.restore()
}

function getLandscapeOpacity(centerAltitudeDeg: number, fovDegrees: number) {
  const baseOpacity = smoothstep(1, 20, fovDegrees)
  const belowHorizonReveal = getBelowHorizonVisibility(centerAltitudeDeg, fovDegrees)

  return clamp(mix(baseOpacity, baseOpacity * 0.28, belowHorizonReveal), 0.12, 1)
}

function getBelowHorizonVisibility(centerAltitudeDeg: number, _fovDegrees: number) {
  return centerAltitudeDeg < 0 ? 1 : 0
}

function drawLandscapeMask(
  context: CanvasRenderingContext2D,
  view: SkyProjectionView,
  sunState: SkyEngineSunState,
  centerAltitudeDeg: number,
  fovDegrees: number,
) {
  const landscapeOpacity = getLandscapeOpacity(centerAltitudeDeg, fovDegrees)

  if (landscapeOpacity <= 0.02) {
    return
  }

  // Smaller cells for smoother horizon gradient
  let cellSize = 6
  if (fovDegrees >= 150) {
    cellSize = 8
  } else if (fovDegrees >= 60) {
    cellSize = 10
  }
  const fogRgb = hexToRgb(sunState.visualCalibration.landscapeFogColorHex)
  const groundRgb = hexToRgb(sunState.visualCalibration.groundTintHex)
  const backgroundRgb = hexToRgb(sunState.visualCalibration.backgroundColorHex)
  const horizonRgb = hexToRgb(sunState.visualCalibration.skyHorizonColorHex)

  context.save()

  for (let y = 0; y < view.viewportHeight; y += cellSize) {
    const cellHeight = Math.min(cellSize, view.viewportHeight - y)

    for (let x = 0; x < view.viewportWidth; x += cellSize) {
      const cellWidth = Math.min(cellSize, view.viewportWidth - x)
      const direction = unprojectViewportPoint(x + cellWidth * 0.5, y + cellHeight * 0.5, view)
      const altitudeDeg = directionToHorizontal(direction).altitudeDeg

      // Two-zone transition: sky-fog blend from +8° to 0°, fog-ground blend from 0° to -14°
      const skyFogBlend = smoothstep(8, 0, altitudeDeg)
      const groundBlend = smoothstep(0, -14, altitudeDeg)

      if (skyFogBlend <= 0.001) {
        continue
      }

      // Near-horizon fog zone: blend sky color into fog
      const fogAlpha = skyFogBlend * (1 - groundBlend)
      // Below-horizon ground zone
      const solidAlpha = groundBlend

      // Composite: horizon gets a fog layer, below gets ground
      const fogWeight = fogAlpha * 0.65
      const groundWeight = solidAlpha * 0.82

      const totalWeight = fogWeight + groundWeight
      if (totalWeight <= 0.002) {
        continue
      }

      const red = (fogWeight * mix(horizonRgb.red, fogRgb.red, 0.4) + groundWeight * mix(groundRgb.red, backgroundRgb.red, 0.3)) / totalWeight
      const green = (fogWeight * mix(horizonRgb.green, fogRgb.green, 0.4) + groundWeight * mix(groundRgb.green, backgroundRgb.green, 0.3)) / totalWeight
      const blue = (fogWeight * mix(horizonRgb.blue, fogRgb.blue, 0.4) + groundWeight * mix(groundRgb.blue, backgroundRgb.blue, 0.3)) / totalWeight
      const alpha = landscapeOpacity * totalWeight

      context.fillStyle = `rgba(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)}, ${clamp(alpha, 0, 1)})`
      context.fillRect(x, y, cellWidth + 0.5, cellHeight + 0.5)
    }
  }

  context.restore()
}

function drawSolarGlare(context: CanvasRenderingContext2D, view: SkyProjectionView, sunState: SkyEngineSunState) {
  if (sunState.altitudeDeg < -6) {
    return
  }

  const projectedSun = projectHorizontalToViewport(sunState.altitudeDeg, sunState.azimuthDeg, view)

  if (!projectedSun || !isProjectedPointVisible(projectedSun, view, 180)) {
    return
  }

  const horizonFade = clamp((sunState.altitudeDeg + 6) / 18, 0, 1)
  const discRadius = clamp(getProjectionScale(view) * Math.tan((0.53 * Math.PI) / 360), 8, 22)
  const outerGlow = discRadius * (sunState.altitudeDeg > 0 ? 12 : 18)
  const glare = context.createRadialGradient(projectedSun.screenX, projectedSun.screenY, discRadius * 0.3, projectedSun.screenX, projectedSun.screenY, outerGlow)
  glare.addColorStop(0, `rgba(255, 248, 228, ${0.36 * horizonFade})`)
  glare.addColorStop(0.2, `rgba(255, 214, 148, ${0.18 * horizonFade})`)
  glare.addColorStop(1, 'rgba(255, 214, 148, 0)')

  context.save()
  context.fillStyle = glare
  context.beginPath()
  context.arc(projectedSun.screenX, projectedSun.screenY, outerGlow, 0, Math.PI * 2)
  context.fill()

  const discGradient = context.createRadialGradient(projectedSun.screenX - discRadius * 0.25, projectedSun.screenY - discRadius * 0.3, discRadius * 0.15, projectedSun.screenX, projectedSun.screenY, discRadius)
  discGradient.addColorStop(0, `rgba(255, 255, 244, ${0.96 * horizonFade})`)
  discGradient.addColorStop(0.6, `rgba(255, 227, 162, ${0.94 * horizonFade})`)
  discGradient.addColorStop(1, `rgba(255, 182, 96, ${0.9 * horizonFade})`)
  context.fillStyle = discGradient
  context.beginPath()
  context.arc(projectedSun.screenX, projectedSun.screenY, discRadius, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function drawDeepSkyMarker(context: CanvasRenderingContext2D, object: SkyEngineSceneObject, x: number, y: number, radius: number) {
  context.save()
  context.strokeStyle = hexToRgba(object.colorHex, object.source === 'temporary_scene_seed' ? 0.8 : 0.62)
  context.lineWidth = object.source === 'temporary_scene_seed' ? 2.4 : 1.8
  context.beginPath()
  context.moveTo(x, y - radius)
  context.lineTo(x + radius, y)
  context.lineTo(x, y + radius)
  context.lineTo(x - radius, y)
  context.closePath()
  context.stroke()
  context.restore()
}

function drawMoon(context: CanvasRenderingContext2D, object: SkyEngineSceneObject, x: number, y: number, radius: number) {
  context.save()
  context.translate(x, y)
  context.rotate((((object.brightLimbAngleDeg ?? 0) - 90) * Math.PI) / 180)
  const moonDisc = context.createRadialGradient(-radius * 0.22, -radius * 0.28, radius * 0.18, 0, 0, radius)
  moonDisc.addColorStop(0, 'rgba(255, 249, 231, 0.98)')
  moonDisc.addColorStop(0.58, 'rgba(248, 238, 208, 0.96)')
  moonDisc.addColorStop(1, 'rgba(196, 188, 168, 0.94)')
  context.fillStyle = moonDisc
  context.beginPath()
  context.arc(0, 0, radius, 0, Math.PI * 2)
  context.fill()

  const illumination = clamp(object.illuminationFraction ?? 0.5, 0, 1)
  const shadowOffset = (object.waxing ? -1 : 1) * radius * clamp(1 - illumination * 1.85, -0.94, 0.94)
  context.save()
  context.beginPath()
  context.arc(0, 0, radius, 0, Math.PI * 2)
  context.clip()
  context.fillStyle = 'rgba(11, 15, 26, 0.58)'
  context.beginPath()
  context.ellipse(shadowOffset, 0, radius * 0.98, radius * 0.98, 0, 0, Math.PI * 2)
  context.fill()
  context.restore()

  context.strokeStyle = 'rgba(255, 251, 236, 0.45)'
  context.lineWidth = Math.max(1, radius * 0.08)
  context.beginPath()
  context.arc(0, 0, radius * 0.96, 0, Math.PI * 2)
  context.stroke()

  const halo = context.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 2.3)
  halo.addColorStop(0, 'rgba(255, 249, 223, 0.18)')
  halo.addColorStop(1, 'rgba(255, 249, 223, 0)')
  context.fillStyle = halo
  context.beginPath()
  context.arc(0, 0, radius * 2.3, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function drawPlanet(context: CanvasRenderingContext2D, object: SkyEngineSceneObject, x: number, y: number, radius: number) {
  context.save()
  let haloStrength = 2.3

  if (object.name === 'Venus') {
    haloStrength = 3.4
  } else if (object.name === 'Jupiter') {
    haloStrength = 2.8
  }

  const halo = context.createRadialGradient(x, y, radius * 0.18, x, y, radius * haloStrength)
  halo.addColorStop(0, hexToRgba(object.colorHex, object.name === 'Venus' ? 0.94 : 0.76))
  halo.addColorStop(0.4, hexToRgba(object.colorHex, object.name === 'Venus' ? 0.48 : 0.34))
  halo.addColorStop(1, hexToRgba(object.colorHex, 0))
  context.fillStyle = halo
  context.beginPath()
  context.arc(x, y, radius * haloStrength, 0, Math.PI * 2)
  context.fill()

  const disc = context.createRadialGradient(x - radius * 0.28, y - radius * 0.34, radius * 0.12, x, y, radius)
  disc.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
  disc.addColorStop(0.46, hexToRgba(object.colorHex, 0.98))
  disc.addColorStop(1, hexToRgba(object.colorHex, 0.74))
  context.fillStyle = disc
  context.beginPath()
  context.arc(x, y, radius, 0, Math.PI * 2)
  context.fill()

  if (object.name === 'Jupiter') {
    context.save()
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.clip()
    ;[-0.46, -0.16, 0.14, 0.42].forEach((offset, index) => {
      context.fillStyle = index % 2 === 0 ? 'rgba(122, 74, 38, 0.24)' : 'rgba(247, 220, 182, 0.16)'
      context.fillRect(x - radius * 1.1, y + radius * offset, radius * 2.2, radius * 0.17)
    })
    context.restore()
  }

  if (object.name === 'Saturn') {
    context.save()
    context.strokeStyle = 'rgba(227, 208, 162, 0.74)'
    context.lineWidth = Math.max(1.1, radius * 0.16)
    context.beginPath()
    context.ellipse(x, y, radius * 1.8, radius * 0.64, -0.34, 0, Math.PI * 2)
    context.stroke()
    context.restore()
  }

  context.restore()
}

function drawStar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  profile: StarRenderProfile,
  alpha: number,
) {
  const starAlpha = clamp(alpha * (0.42 + profile.alpha * 0.82), 0.14, 0.98)
  const haloRadius = Math.max(radius * (2.1 + profile.diameter * 1.8), profile.haloRadiusPx)
  const coreRadius = Math.max(radius * 0.92, profile.coreRadiusPx)

  context.save()
  const halo = context.createRadialGradient(x, y, 0, x, y, haloRadius)
  halo.addColorStop(0, hexToRgba(profile.colorHex, starAlpha))
  halo.addColorStop(0.22, hexToRgba(profile.colorHex, starAlpha * 0.52))
  halo.addColorStop(1, hexToRgba(profile.colorHex, 0))
  context.fillStyle = halo
  context.beginPath()
  context.arc(x, y, haloRadius, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = hexToRgba(profile.colorHex, clamp(starAlpha + 0.06, 0.18, 1))
  context.beginPath()
  context.arc(x, y, coreRadius, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = `rgba(255, 255, 255, ${clamp(0.18 + starAlpha * 0.84, 0.22, 0.98)})`
  context.beginPath()
  context.arc(x, y, Math.max(0.42, Math.min(coreRadius * 0.52, profile.coreRadiusPx * 0.68)), 0, Math.PI * 2)
  context.fill()
  context.restore()
}

const SYNTHETIC_STAR_OVERLAP_CELL_PX = 24

function buildProjectedStarOverlapGrid(projectedObjects: readonly ProjectedSceneObjectEntry[]) {
  const grid = new Map<string, ProjectedSceneObjectEntry[]>()

  projectedObjects.forEach((entry) => {
    if (entry.object.type !== 'star') {
      return
    }

    const cellX = Math.floor(entry.screenX / SYNTHETIC_STAR_OVERLAP_CELL_PX)
    const cellY = Math.floor(entry.screenY / SYNTHETIC_STAR_OVERLAP_CELL_PX)
    const key = `${cellX}:${cellY}`
    const bucket = grid.get(key)

    if (bucket) {
      bucket.push(entry)
      return
    }

    grid.set(key, [entry])
  })

  return grid
}

function overlapsProjectedStar(
  overlapGrid: ReadonlyMap<string, readonly ProjectedSceneObjectEntry[]>,
  screenX: number,
  screenY: number,
) {
  const cellX = Math.floor(screenX / SYNTHETIC_STAR_OVERLAP_CELL_PX)
  const cellY = Math.floor(screenY / SYNTHETIC_STAR_OVERLAP_CELL_PX)

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      const key = `${cellX + columnOffset}:${cellY + rowOffset}`
      const bucket = overlapGrid.get(key)

      if (!bucket) {
        continue
      }

      for (const entry of bucket) {
        const dx = entry.screenX - screenX
        const dy = entry.screenY - screenY
        const minimumDistance = Math.max(5.5, entry.markerRadiusPx * 0.9)

        if (dx * dx + dy * dy < minimumDistance * minimumDistance) {
          return true
        }
      }
    }
  }

  return false
}

function drawSyntheticDensityStars(
  context: CanvasRenderingContext2D,
  view: SkyProjectionView,
  projectedObjects: readonly ProjectedSceneObjectEntry[],
  sunState: SkyEngineSunState,
  observer: SkyEngineObserver,
  sceneTimestampIso: string | undefined,
  renderLimitingMagnitude: number,
) {
  const fovDegrees = getSkyEngineFovDegrees(view.fovRadians)
  const magnitudeLimit = getSyntheticDensityMagnitudeLimit(fovDegrees, renderLimitingMagnitude)
  const densityBudget = getSyntheticDensityBudget(fovDegrees, sunState)

  if (densityBudget <= 0) {
    return
  }

  const overlapGrid = buildProjectedStarOverlapGrid(projectedObjects)
  const viewportCenterX = view.viewportWidth * 0.5
  const viewportCenterY = view.viewportHeight * 0.5
  const wideBlend = smoothstep(115, 185, fovDegrees)
  const closeBlend = 1 - smoothstep(24, 90, fovDegrees)
  const animationTime = performance.now() * 0.0008
  const extinction = buildAtmosphericExtinctionContext(observer, sceneTimestampIso)
  let drawnCount = 0

  for (const sample of SYNTHETIC_SKY_DENSITY_SAMPLES) {
    const sampleAltitudeDeg = (Math.asin(clamp(sample.direction.y, -1, 1)) * 180) / Math.PI
    const renderedMagnitude = computeObservedMagnitude(sample.magnitude, extinction, sampleAltitudeDeg)
    const visibilityAlpha = computeVisibilityAlpha(renderedMagnitude, magnitudeLimit)

    if (visibilityAlpha <= 0 || drawnCount >= densityBudget) {
      if (drawnCount >= densityBudget) {
        break
      }

      continue
    }

    const projected = projectDirectionToViewport(sample.direction, view)

    if (!projected || !isProjectedPointVisible(projected, view, 20)) {
      continue
    }

    if (overlapsProjectedStar(overlapGrid, projected.screenX, projected.screenY)) {
      continue
    }

    const distanceToCenter = Math.hypot(projected.screenX - viewportCenterX, projected.screenY - viewportCenterY)
    const normalizedCenterDistance = clamp(distanceToCenter / Math.max(view.viewportWidth, view.viewportHeight), 0, 1)
    const centerFill = 1 + wideBlend * (1 - normalizedCenterDistance) * 0.38
    const profile = getStarRenderProfileForMagnitude(renderedMagnitude, sample.colorIndexBV, sunState.visualCalibration)
    const sizeScale = computeVisibilitySizeScale(visibilityAlpha)
    const markerRadiusPx = clamp((profile.coreRadiusPx * 0.46 + sample.size * 0.7) * (0.9 + closeBlend * 0.3) * centerFill * sizeScale, 0.34, 2.4)
    const twinkle = 1 + Math.sin(animationTime + sample.twinklePhase) * profile.twinkleAmplitude * 0.9
    const alpha = clamp(
      sample.alpha * profile.alpha * visibilityAlpha * (0.34 + sample.bandWeight * 0.3) * (0.74 + closeBlend * 0.2) * centerFill,
      0.035,
      0.32,
    )

    drawStar(
      context,
      projected.screenX,
      projected.screenY,
      markerRadiusPx * twinkle,
      profile,
      alpha,
    )

    drawnCount += 1
  }
}

function getObjectHorizonFade(_object: SkyEngineSceneObject, _centerAltitudeDeg: number, _fovDegrees: number) {
  return 1
}

function resolveSceneTimestampIso(objects: readonly SkyEngineSceneObject[]) {
  return objects.find((object) => object.timestampIso)?.timestampIso
}

function collectProjectedObjects(
  view: SkyProjectionView,
  observer: SkyEngineObserver,
  objects: readonly SkyEngineSceneObject[],
  scenePacket: SkyScenePacket | null,
  sunState: SkyEngineSunState,
  selectedObjectId: string | null,
) {
  const fovDegrees = getSkyEngineFovDegrees(view.fovRadians)
  const centerAltitudeDeg = directionToHorizontal(view.centerDirection).altitudeDeg
  const sceneTimestampIso = resolveSceneTimestampIso(objects)
  const extinction = buildAtmosphericExtinctionContext(observer, sceneTimestampIso)
  const skyBrightness = computeSkyBrightness((sunState.altitudeDeg * Math.PI) / 180)
  const limitingMagnitude = computeEffectiveLimitingMagnitude(
    skyBrightness,
    fovDegrees,
    sunState.visualCalibration.starVisibility,
  )
  const objectLookup = new Map(objects.map((object) => [object.id, object]))
  const projectedObjects = objects.flatMap((object) => {
    if (!shouldRenderObject(object, centerAltitudeDeg, fovDegrees, sunState, selectedObjectId)) {
      return []
    }

    const projected = projectDirectionToViewport(horizontalToDirection(object.altitudeDeg, object.azimuthDeg), view)

    if (!projected || !isProjectedPointVisible(projected, view, 22)) {
      return []
    }

    const renderedMagnitude = object.type === 'star'
      ? computeObservedMagnitude(object.magnitude, extinction, object.altitudeDeg)
      : object.magnitude
    const visibilityAlpha = object.type === 'star'
      ? computeVisibilityAlpha(renderedMagnitude, limitingMagnitude)
      : 1

    if (object.type === 'star' && visibilityAlpha <= 0) {
      return []
    }

    const horizonFade = getObjectHorizonFade(object, centerAltitudeDeg, fovDegrees)
    const renderAlpha = object.type === 'star'
      ? clamp(horizonFade * visibilityAlpha, 0, 0.98)
      : clamp(horizonFade, 0, 1)

    if (renderAlpha <= 0) {
      return []
    }

    const starProfile = object.type === 'star'
      ? getStarRenderProfileForMagnitude(renderedMagnitude, object.colorIndexBV, sunState.visualCalibration)
      : undefined
    const markerRadiusPx = object.type === 'star'
      ? getMarkerRadiusPx(object, view, sunState, starProfile) * computeVisibilitySizeScale(visibilityAlpha)
      : getMarkerRadiusPx(object, view, sunState, starProfile)

    return [{
      object,
      screenX: projected.screenX,
      screenY: projected.screenY,
      depth: projected.depth,
      angularDistanceRad: projected.angularDistanceRad,
      markerRadiusPx,
      pickRadiusPx: getPickRadiusPx(object, markerRadiusPx),
      renderAlpha,
      renderedMagnitude,
      visibilityAlpha,
      starProfile,
    }]
  })
  const packetProjectedObjects = (scenePacket?.stars ?? []).flatMap((packetStar) => {
    const object = objectLookup.get(packetStar.id)

    if (!object) {
      return []
    }

    const projected = projectDirectionToViewport(new Vector3(packetStar.x, packetStar.y, packetStar.z), view)

    if (!projected || !isProjectedPointVisible(projected, view, 22)) {
      return []
    }

    const renderedMagnitude = object.type === 'star'
      ? computeObservedMagnitude(object.magnitude, extinction, object.altitudeDeg)
      : object.magnitude
    const visibilityAlpha = object.type === 'star'
      ? computeVisibilityAlpha(renderedMagnitude, limitingMagnitude)
      : 1

    if (object.type === 'star' && visibilityAlpha <= 0) {
      return []
    }

    const horizonFade = getObjectHorizonFade(object, centerAltitudeDeg, fovDegrees)
    const renderAlpha = object.type === 'star'
      ? clamp(horizonFade * visibilityAlpha, 0, 0.98)
      : clamp(horizonFade, 0, 1)

    if (renderAlpha <= 0) {
      return []
    }

    const starProfile = object.type === 'star'
      ? getStarRenderProfileForMagnitude(renderedMagnitude, object.colorIndexBV, sunState.visualCalibration)
      : undefined
    const markerRadiusPx = object.type === 'star'
      ? getMarkerRadiusPx(object, view, sunState, starProfile) * computeVisibilitySizeScale(visibilityAlpha)
      : getMarkerRadiusPx(object, view, sunState, starProfile)

    return [{
      object,
      screenX: projected.screenX,
      screenY: projected.screenY,
      depth: projected.depth,
      angularDistanceRad: projected.angularDistanceRad,
      markerRadiusPx,
      pickRadiusPx: getPickRadiusPx(object, markerRadiusPx),
      renderAlpha,
      renderedMagnitude,
      visibilityAlpha,
      starProfile,
    }]
  })
  const dedupedProjectedObjects = new Map<string, ProjectedSceneObjectEntry>()

  projectedObjects.forEach((entry) => {
    dedupedProjectedObjects.set(entry.object.id, entry)
  })

  packetProjectedObjects.forEach((entry) => {
    dedupedProjectedObjects.set(entry.object.id, entry)
  })

  const allProjectedObjects = Array.from(dedupedProjectedObjects.values())
    .sort((left, right) => left.depth - right.depth || (left.renderedMagnitude ?? left.object.magnitude) - (right.renderedMagnitude ?? right.object.magnitude))

  return {
    projectedObjects: allProjectedObjects,
    limitingMagnitude,
    sceneTimestampIso,
  }
}

function ensureSceneSurfaces(runtime: SceneRuntimeRefs) {
  const width = Math.max(1, Math.round(runtime.engine.getRenderWidth()))
  const height = Math.max(1, Math.round(runtime.engine.getRenderHeight()))

  if (runtime.backgroundCanvas.width !== width || runtime.backgroundCanvas.height !== height) {
    runtime.backgroundCanvas.width = width
    runtime.backgroundCanvas.height = height
  }

  runtime.camera.orthoLeft = -width * 0.5
  runtime.camera.orthoRight = width * 0.5
  runtime.camera.orthoTop = height * 0.5
  runtime.camera.orthoBottom = -height * 0.5

  return {
    width,
    height,
  }
}

function syncNavigationState(runtime: SceneRuntimeRefs, objects: readonly SkyEngineSceneObject[], selectedObjectId: string | null) {
  const selectedObject = objects.find((object) => object.id === selectedObjectId) ?? null
  const selectionChanged = runtime.selectedObjectId !== selectedObjectId

  runtime.selectedObjectId = selectedObjectId

  if (selectedObject?.isAboveHorizon) {
    runtime.targetVector = getSelectionTargetVector(selectedObject)
  } else if (!selectedObject && selectionChanged) {
    runtime.targetVector = null
  }

  if (selectionChanged && !selectedObject) {
    runtime.desiredFov = runtime.currentFov
  }
}

function syncDirectObjectLayer(runtime: SceneRuntimeRefs, projectedObjects: readonly ProjectedSceneObjectEntry[], latest: ScenePropsSnapshot, width: number, height: number) {
  runtime.directObjectLayer.sync(
    projectedObjects,
    width,
    height,
    latest.sunState,
    latest.selectedObjectId,
    runtime.animationTime,
  )
}

function renderSceneFrame(runtime: SceneRuntimeRefs, latest: ScenePropsSnapshot) {
  const { width, height } = ensureSceneSurfaces(runtime)
  const backgroundContext = runtime.backgroundCanvas.getContext('2d') as CanvasRenderingContext2D

  const view: SkyProjectionView = {
    centerDirection: runtime.centerDirection,
    fovRadians: runtime.currentFov,
    viewportWidth: width,
    viewportHeight: height,
    projectionMode: latest.projectionMode,
  }
  const currentFovDegrees = getSkyEngineFovDegrees(runtime.currentFov)
  const lod = resolveViewTier(currentFovDegrees)
  const centerAltitudeDeg = directionToHorizontal(view.centerDirection).altitudeDeg
  const { projectedObjects, limitingMagnitude, sceneTimestampIso } = collectProjectedObjects(
    view,
    latest.observer,
    latest.objects,
    latest.scenePacket,
    latest.sunState,
    latest.selectedObjectId,
  )

  backgroundContext.clearRect(0, 0, width, height)

  drawBackground(backgroundContext, width, height, latest.sunState, view)
  drawProceduralSkyBackdrop(backgroundContext, view, latest.sunState, currentFovDegrees)
  drawSolarGlare(backgroundContext, view, latest.sunState)
  drawSyntheticDensityStars(backgroundContext, view, projectedObjects, latest.sunState, latest.observer, sceneTimestampIso, limitingMagnitude)
  drawLandscapeMask(backgroundContext, view, latest.sunState, centerAltitudeDeg, currentFovDegrees)

  syncDirectObjectLayer(runtime, projectedObjects, latest, width, height)
  const overlayFrame = prepareDirectOverlayFrame(
    view,
    latest.observer,
    projectedObjects,
    latest.scenePacket,
    latest.selectedObjectId,
    latest.aidVisibility,
  )
  const overlayState = runtime.directOverlayLayer.sync(
    overlayFrame,
    projectedObjects,
    width,
    height,
    runtime.camera,
    runtime.engine,
    latest.selectedObjectId,
    new Set(latest.guidedObjectIds),
    latest.sunState,
    lod.labelCap,
  )

  runtime.projectedPickEntries = projectedObjects.map((entry) => ({
    object: entry.object,
    screenX: entry.screenX,
    screenY: entry.screenY,
    radiusPx: entry.pickRadiusPx,
    depth: entry.depth,
  }))

  return {
    lod,
    trajectoryObjectId: overlayState.trajectoryObjectId,
    visibleLabelIds: overlayState.visibleLabelIds,
  }
}

export default function SkyEngineScene({
  backendStars,
  observer,
  objects,
  scenePacket,
  initialViewState,
  projectionMode = 'stereographic',
  sunState,
  selectedObjectId,
  guidedObjectIds,
  aidVisibility,
  onSelectObject,
  onAtmosphereStatusChange,
  onViewStateChange,
}: SkyEngineSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const runtimeRefs = useRef<SceneRuntimeRefs | null>(null)
  const propsVersionRef = useRef(0)
  const propsRef = useRef<ScenePropsSnapshot>({
    backendStars,
    observer,
    objects,
    scenePacket,
    initialViewState,
    projectionMode,
    sunState,
    selectedObjectId,
    guidedObjectIds,
    aidVisibility,
    onSelectObject,
    onAtmosphereStatusChange,
    onViewStateChange,
  })

  useEffect(() => {
    propsVersionRef.current += 1
    propsRef.current = {
      backendStars,
      observer,
      objects,
      scenePacket,
      initialViewState,
      projectionMode,
      sunState,
      selectedObjectId,
      guidedObjectIds,
      aidVisibility,
      onSelectObject,
      onAtmosphereStatusChange,
      onViewStateChange,
    }

    if (runtimeRefs.current) {
      runtimeRefs.current.needsRender = true
    }
  }, [aidVisibility, backendStars, guidedObjectIds, initialViewState, objects, observer, onAtmosphereStatusChange, onSelectObject, onViewStateChange, projectionMode, scenePacket, selectedObjectId, sunState])

  useEffect(() => {
    const canvas = canvasRef.current
    const backgroundCanvas = backgroundCanvasRef.current

    if (!canvas || !backgroundCanvas) {
      return undefined
    }

    const engine = new Engine(canvas, true, {
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: false,
      stencil: true,
    })
    const scene = new Scene(engine)
    const camera = new UniversalCamera('sky-engine-camera', new Vector3(0, 0, -10), scene)
    camera.mode = Camera.ORTHOGRAPHIC_CAMERA
    camera.minZ = 0.1
    camera.maxZ = 50
    camera.setTarget(Vector3.Zero())
    scene.clearColor.set(0, 0, 0, 0)

    runtimeRefs.current = {
      scene,
      engine,
      camera,
      canvas,
      backgroundCanvas,
      directObjectLayer: createDirectObjectLayer(scene),
      directOverlayLayer: createDirectOverlayLayer(scene),
      centerDirection: stabilizeSkyEngineCenterDirection(
        horizontalToDirection(
          propsRef.current.initialViewState.centerAltDeg,
          propsRef.current.initialViewState.centerAzDeg,
        ),
      ),
      targetVector: null,
      currentFov: clampSkyEngineFov(degreesToRadians(propsRef.current.initialViewState.fovDegrees)),
      desiredFov: clampSkyEngineFov(degreesToRadians(propsRef.current.initialViewState.fovDegrees)),
      selectedObjectId: propsRef.current.selectedObjectId,
      activePointerId: null,
      dragAnchorDirection: null,
      dragBaseCenterDirection: null,
      dragStartX: 0,
      dragStartY: 0,
      dragMoved: false,
      projectedPickEntries: [],
      lastFrameTime: performance.now(),
      lastReportedFovTenths: null,
      lastReportedCenterAltTenths: null,
      lastReportedCenterAzTenths: null,
      needsRender: true,
      renderedPropsVersion: -1,
      animationTime: 0,
    }

    propsRef.current.onAtmosphereStatusChange({
      mode: 'fallback',
      message: 'Direct Babylon object, aid, trajectory, and label rendering is active over the observer-centered projection background.',
    })

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const runtime = runtimeRefs.current

      if (!runtime) {
        return
      }

      const nextDesiredFov = stepSkyEngineFov(runtime.desiredFov, event.deltaY)

      if (nextDesiredFov === runtime.desiredFov) {
        return
      }

      const bounds = canvas.getBoundingClientRect()
      const currentView: SkyProjectionView = {
        centerDirection: runtime.centerDirection,
        fovRadians: runtime.currentFov,
        viewportWidth: bounds.width,
        viewportHeight: bounds.height,
        projectionMode: propsRef.current.projectionMode,
      }
      const nextView: SkyProjectionView = {
        centerDirection: runtime.centerDirection,
        fovRadians: nextDesiredFov,
        viewportWidth: bounds.width,
        viewportHeight: bounds.height,
        projectionMode: propsRef.current.projectionMode,
      }
      const previousPointerDirection = unprojectViewportPoint(event.clientX - bounds.left, event.clientY - bounds.top, currentView)
      const nextPointerDirection = unprojectViewportPoint(event.clientX - bounds.left, event.clientY - bounds.top, nextView)

      runtime.centerDirection = rotateVectorTowardPointerAnchor(runtime.centerDirection, nextPointerDirection, previousPointerDirection).normalizeToNew()
      runtime.targetVector = null
      runtime.currentFov = nextDesiredFov
      runtime.desiredFov = nextDesiredFov
    }

    const handlePointerDown = (event: PointerEvent) => {
      const runtime = runtimeRefs.current

      if (!runtime) {
        return
      }

      const bounds = canvas.getBoundingClientRect()
      runtime.activePointerId = event.pointerId
      runtime.dragStartX = event.clientX - bounds.left
      runtime.dragStartY = event.clientY - bounds.top
      runtime.dragMoved = false
      runtime.dragBaseCenterDirection = runtime.centerDirection.clone()
      runtime.dragAnchorDirection = unprojectViewportPoint(runtime.dragStartX, runtime.dragStartY, {
        centerDirection: runtime.dragBaseCenterDirection,
        fovRadians: runtime.currentFov,
        viewportWidth: bounds.width,
        viewportHeight: bounds.height,
        projectionMode: propsRef.current.projectionMode,
      })
      canvas.setPointerCapture(event.pointerId)
    }

    const handlePointerMove = (event: PointerEvent) => {
      const runtime = runtimeRefs.current

      if (runtime?.activePointerId !== event.pointerId || !runtime.dragAnchorDirection || !runtime.dragBaseCenterDirection) {
        return
      }

      const bounds = canvas.getBoundingClientRect()
      const screenX = event.clientX - bounds.left
      const screenY = event.clientY - bounds.top
      const pointerDistance = Math.hypot(screenX - runtime.dragStartX, screenY - runtime.dragStartY)

      if (pointerDistance >= POINTER_DRAG_THRESHOLD_PX) {
        runtime.dragMoved = true
      }

      if (!runtime.dragMoved) {
        return
      }

      const nextPointerDirection = unprojectViewportPoint(screenX, screenY, {
        centerDirection: runtime.dragBaseCenterDirection,
        fovRadians: runtime.currentFov,
        viewportWidth: bounds.width,
        viewportHeight: bounds.height,
        projectionMode: propsRef.current.projectionMode,
      })
      runtime.centerDirection = rotateVectorTowardPointerAnchor(
        runtime.dragBaseCenterDirection,
        nextPointerDirection,
        runtime.dragAnchorDirection,
      ).normalizeToNew()
      runtime.targetVector = null
    }

    const releasePointer = (pointerId: number) => {
      const runtime = runtimeRefs.current

      if (runtime?.activePointerId !== pointerId) {
        return
      }

      runtime.activePointerId = null
      runtime.dragAnchorDirection = null
        runtime.dragBaseCenterDirection = null
      runtime.dragMoved = false

      if (canvas.hasPointerCapture(pointerId)) {
        canvas.releasePointerCapture(pointerId)
      }
    }

    const handlePointerUp = (event: PointerEvent) => {
      const runtime = runtimeRefs.current

      if (runtime?.activePointerId !== event.pointerId) {
        return
      }

      if (!runtime.dragMoved) {
        const bounds = canvas.getBoundingClientRect()
        const objectId = resolveSkyEnginePickSelection(
          runtime.projectedPickEntries,
          event.clientX - bounds.left,
          event.clientY - bounds.top,
        )
        propsRef.current.onSelectObject(objectId)
      }

      releasePointer(event.pointerId)
    }

    const handlePointerCancel = (event: PointerEvent) => {
      releasePointer(event.pointerId)
    }

    const handleResize = () => {
      engine.resize()

      if (runtimeRefs.current) {
        runtimeRefs.current.needsRender = true
      }
    }
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointercancel', handlePointerCancel)
    globalThis.addEventListener('resize', handleResize)

    engine.runRenderLoop(() => {
      const runtime = runtimeRefs.current

      if (!runtime) {
        return
      }

      const latest = propsRef.current
      const now = performance.now()
      const deltaSeconds = Math.min(0.05, (now - runtime.lastFrameTime) * 0.001)
      runtime.lastFrameTime = now
      runtime.animationTime += deltaSeconds

      syncNavigationState(runtime, latest.objects, latest.selectedObjectId)
      const previousCenterDirection = runtime.centerDirection
      const previousFov = runtime.currentFov
      const navigation = updateObserverNavigation(runtime.centerDirection, runtime.currentFov, runtime.desiredFov, runtime.targetVector, deltaSeconds)
      const navigationChanged = !navigation.centerDirection.equalsWithEpsilon(previousCenterDirection, 0.000001)
        || Math.abs(navigation.fovRadians - previousFov) > 0.000001
      runtime.centerDirection = navigation.centerDirection
      runtime.currentFov = navigation.fovRadians
      runtime.targetVector = navigation.targetVector

      const shouldRenderFrame = runtime.needsRender
        || navigationChanged
        || runtime.renderedPropsVersion !== propsVersionRef.current

      if (!shouldRenderFrame) {
        return
      }

      const frame = renderSceneFrame(runtime, latest)
      runtime.needsRender = false
      runtime.renderedPropsVersion = propsVersionRef.current
      const currentFovTenths = Math.round(getSkyEngineFovDegrees(runtime.currentFov) * 10)
      const centerHorizontal = directionToHorizontal(runtime.centerDirection)
      const currentCenterAltTenths = Math.round(centerHorizontal.altitudeDeg * 10)
      const currentCenterAzTenths = Math.round(centerHorizontal.azimuthDeg * 10)

      if (
        currentFovTenths !== runtime.lastReportedFovTenths ||
        currentCenterAltTenths !== runtime.lastReportedCenterAltTenths ||
        currentCenterAzTenths !== runtime.lastReportedCenterAzTenths
      ) {
        runtime.lastReportedFovTenths = currentFovTenths
        runtime.lastReportedCenterAltTenths = currentCenterAltTenths
        runtime.lastReportedCenterAzTenths = currentCenterAzTenths
        latest.onViewStateChange?.({
          fovDegrees: currentFovTenths / 10,
          centerAltDeg: currentCenterAltTenths / 10,
          centerAzDeg: currentCenterAzTenths / 10,
        })
      }

      writeSceneState({
        backendStarCount: latest.backendStars.length,
        canvas,
        objects: latest.objects,
        selectedObjectId: latest.selectedObjectId,
        trajectoryObjectId: frame.trajectoryObjectId,
        visibleLabelIds: frame.visibleLabelIds,
        guidedObjectIds: latest.guidedObjectIds,
        aidVisibility: latest.aidVisibility,
        currentFovDegrees: currentFovTenths / 10,
        currentLodTier: frame.lod.tier,
        labelCap: frame.lod.labelCap,
        groundTextureMode: 'direct-babylon-object-and-overlay-layer',
        groundTextureAssetPath: 'direct-babylon objects with Babylon-native aid, label, and trajectory overlays',
      })

      scene.render()
      writeSkyEnginePickTargets(canvas, buildSkyEnginePickTargets(runtime.projectedPickEntries))
    })

    return () => {
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointercancel', handlePointerCancel)
      globalThis.removeEventListener('resize', handleResize)
      clearSkyEnginePickTargets(canvas)
      clearSceneState(canvas)
      runtimeRefs.current?.directObjectLayer.dispose()
      runtimeRefs.current?.directOverlayLayer.dispose()
      runtimeRefs.current = null
      scene.dispose()
      engine.dispose()
    }
  }, [])

  useEffect(() => {
    onAtmosphereStatusChange({
      mode: 'fallback',
      message: `Direct Babylon objects, labels, aids, and trajectories are active for ${sunState.phaseLabel.toLowerCase()} conditions.`,
    })
  }, [onAtmosphereStatusChange, sunState])

  return (
    <div className="sky-engine-scene">
      <canvas ref={backgroundCanvasRef} className="sky-engine-scene__background" />
      <canvas ref={canvasRef} className="sky-engine-scene__canvas" aria-label="Sky Engine scene" />
    </div>
  )
}
