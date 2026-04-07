import React, { useEffect, useRef } from 'react'

import { Camera } from '@babylonjs/core/Cameras/camera'
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { Scene } from '@babylonjs/core/scene'

import { computeObjectTrajectorySamples } from './astronomy'
import {
  clampSkyEngineFov,
  getSelectionTargetVector,
  getSkyEngineFovDegrees,
  rotateVectorTowardPointerAnchor,
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
import { getStarRenderProfile } from './starRenderer'
import type { SkyScenePacket } from './engine/sky'
import type { BackendSkySceneStarObject } from '../scene/contracts'
import type {
  SkyEngineAidVisibility,
  SkyEngineAtmosphereStatus,
  SkyEngineObserver,
  SkyEngineSceneObject,
  SkyEngineSunState,
} from './types'

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
  projectionPlane: Mesh
  projectionMaterial: StandardMaterial
  projectionTexture: DynamicTexture
  centerDirection: Vector3
  targetVector: Vector3 | null
  currentFov: number
  desiredFov: number
  selectedObjectId: string | null
  activePointerId: number | null
  dragAnchorDirection: Vector3 | null
  dragStartX: number
  dragStartY: number
  dragMoved: boolean
  projectedPickEntries: ProjectedPickTargetEntry[]
  lastFrameTime: number
  lastReportedFovTenths: number | null
  lastReportedCenterAltTenths: number | null
  lastReportedCenterAzTenths: number | null
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

interface ProjectedSceneObjectEntry {
  object: SkyEngineSceneObject
  screenX: number
  screenY: number
  depth: number
  angularDistanceRad: number
  markerRadiusPx: number
  pickRadiusPx: number
}

interface LabelLayoutEntry {
  x: number
  y: number
  width: number
  height: number
}

const SKY_ENGINE_SCENE_STATE_ATTRIBUTE = 'data-sky-engine-scene-state'
const TRAJECTORY_HOUR_OFFSETS = [-6, -3, 0, 3, 6] as const
const POINTER_DRAG_THRESHOLD_PX = 6
const STAR_BELOW_HORIZON_FADE_DEG = 8
const BODY_BELOW_HORIZON_FADE_DEG = 1.5
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

function rectanglesOverlap(left: LabelLayoutEntry, right: LabelLayoutEntry) {
  return !(
    left.x + left.width < right.x ||
    right.x + right.width < left.x ||
    left.y + left.height < right.y ||
    right.y + right.height < left.y
  )
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

function getVisibleStarMagnitudeLimit(fovDegrees: number, sunState: SkyEngineSunState) {
  let limit = 4.2

  if (fovDegrees >= 120) {
    limit = 1.4
  } else if (fovDegrees >= 90) {
    limit = 2.1
  } else if (fovDegrees >= 60) {
    limit = 2.9
  } else if (fovDegrees >= 35) {
    limit = 3.4
  }

  const daylightPenalty = (1 - sunState.visualCalibration.starVisibility) * 2.8
  return limit - daylightPenalty
}

function shouldRenderObject(
  object: SkyEngineSceneObject,
  fovDegrees: number,
  sunState: SkyEngineSunState,
  selectedObjectId: string | null,
) {
  if (isEngineTileSource(object.source)) {
    return false
  }

  if (object.id === selectedObjectId) {
    return true
  }

  if (getObjectHorizonFade(object) <= 0) {
    return false
  }

  if (object.type === 'star' && object.source === 'computed_real_sky') {
    return object.magnitude <= getVisibleStarMagnitudeLimit(fovDegrees, sunState)
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

function getMarkerRadiusPx(object: SkyEngineSceneObject, view: SkyProjectionView, sunState: SkyEngineSunState) {
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

  const starBase = clamp(5.3 - object.magnitude * 0.85, 1.2, 6)
  return starBase * clamp(sunState.visualCalibration.starFieldBrightness * 1.05, 0.35, 1.05)
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

function drawBackground(context: CanvasRenderingContext2D, width: number, height: number, sunState: SkyEngineSunState) {
  const skyGradient = context.createLinearGradient(0, 0, 0, height)
  skyGradient.addColorStop(0, sunState.visualCalibration.skyZenithColorHex)
  skyGradient.addColorStop(0.82, sunState.visualCalibration.skyHorizonColorHex)
  skyGradient.addColorStop(1, sunState.visualCalibration.backgroundColorHex)
  context.fillStyle = skyGradient
  context.fillRect(0, 0, width, height)

  const vignette = context.createRadialGradient(
    width * 0.5,
    height * 0.46,
    Math.min(width, height) * 0.08,
    width * 0.5,
    height * 0.46,
    Math.min(width, height) * 0.72,
  )
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.32)')
  context.fillStyle = vignette
  context.fillRect(0, 0, width, height)
}

function drawCurve(
  context: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  strokeStyle: string,
  lineWidth: number,
  dashed = false,
) {
  if (points.length < 2) {
    return
  }

  context.save()
  context.strokeStyle = strokeStyle
  context.lineWidth = lineWidth
  context.setLineDash(dashed ? [8, 6] : [])
  context.beginPath()
  context.moveTo(points[0].x, points[0].y)

  points.slice(1).forEach((point) => {
    context.lineTo(point.x, point.y)
  })

  context.stroke()
  context.restore()
}

function buildAzimuthTickSegments(view: SkyProjectionView) {
  return Array.from({ length: 36 }, (_, index) => index * 10).flatMap((azimuthDeg) => {
    const isCardinal = azimuthDeg % 90 === 0
    const isMajor = azimuthDeg % 30 === 0
    let innerAltitudeDeg = 2.2

    if (isCardinal) {
      innerAltitudeDeg = 5.8
    } else if (isMajor) {
      innerAltitudeDeg = 4.1
    }

    const outerPoint = projectHorizontalToViewport(0.2, azimuthDeg, view)
    const innerPoint = projectHorizontalToViewport(innerAltitudeDeg, azimuthDeg, view)

    if (!outerPoint || !innerPoint) {
      return []
    }

    if (!isProjectedPointVisible(outerPoint, view, 18) || !isProjectedPointVisible(innerPoint, view, 18)) {
      return []
    }

    return [{
      azimuthDeg,
      isCardinal,
      isMajor,
      outerPoint,
      innerPoint,
    }]
  })
}

function drawCompassLabel(context: CanvasRenderingContext2D, label: string, x: number, y: number, color: string) {
  const width = 26
  const height = 24

  context.save()
  context.fillStyle = 'rgba(4, 10, 20, 0.72)'
  context.strokeStyle = 'rgba(126, 186, 255, 0.28)'
  context.lineWidth = 1
  context.beginPath()
  context.rect(x - width * 0.5, y - height * 0.5, width, height)
  context.fill()
  context.stroke()
  context.shadowColor = color
  context.shadowBlur = 14
  context.fillStyle = color
  context.font = '700 15px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(label, x, y)
  context.restore()
}

function buildConstantAltitudeCurve(view: SkyProjectionView, altitudeDeg: number) {
  const points: Array<{ x: number; y: number }> = []

  for (let azimuthDeg = 0; azimuthDeg <= 360; azimuthDeg += 4) {
    const projected = projectHorizontalToViewport(altitudeDeg, azimuthDeg, view)

    if (projected && isProjectedPointVisible(projected, view, 24)) {
      points.push({ x: projected.screenX, y: projected.screenY })
    }
  }

  return points
}

function buildGroundBoundaryCurve(
  horizonCurve: readonly { x: number; y: number }[],
  viewportWidth: number,
) {
  if (horizonCurve.length < 2) {
    return []
  }

  const bucketCount = Math.max(24, Math.min(160, Math.round(viewportWidth / 18)))
  const boundaryByBucket = new Array<number | null>(bucketCount + 1).fill(null)

  horizonCurve.forEach((point) => {
    const clampedX = clamp(point.x, 0, viewportWidth)
    const bucketIndex = Math.round((clampedX / Math.max(viewportWidth, 1)) * bucketCount)
    const currentBoundary = boundaryByBucket[bucketIndex]

    if (currentBoundary === null || point.y > currentBoundary) {
      boundaryByBucket[bucketIndex] = point.y
    }
  })

  let previousKnownIndex = -1
  for (let index = 0; index <= bucketCount; index += 1) {
    if (boundaryByBucket[index] === null) {
      continue
    }

    if (previousKnownIndex >= 0 && index - previousKnownIndex > 1) {
      const startY = boundaryByBucket[previousKnownIndex] ?? 0
      const endY = boundaryByBucket[index] ?? startY
      const gapLength = index - previousKnownIndex

      for (let gapIndex = 1; gapIndex < gapLength; gapIndex += 1) {
        const amount = gapIndex / gapLength
        boundaryByBucket[previousKnownIndex + gapIndex] = startY + (endY - startY) * amount
      }
    }

    previousKnownIndex = index
  }

  const firstKnownIndex = boundaryByBucket.findIndex((value) => value !== null)
  if (firstKnownIndex < 0) {
    return []
  }

  const lastKnownIndex = boundaryByBucket.reduce<number>((lastIndex, value, index) => {
    if (value === null) {
      return lastIndex
    }

    return index
  }, firstKnownIndex)
  const firstKnownY = boundaryByBucket[firstKnownIndex] ?? 0
  const lastKnownY = boundaryByBucket[lastKnownIndex] ?? firstKnownY

  for (let index = 0; index < firstKnownIndex; index += 1) {
    boundaryByBucket[index] = firstKnownY
  }

  for (let index = lastKnownIndex + 1; index <= bucketCount; index += 1) {
    boundaryByBucket[index] = lastKnownY
  }

  return boundaryByBucket.map((y, index) => ({
    x: (index / bucketCount) * viewportWidth,
    y: y ?? firstKnownY,
  }))
}

function getWideFovGroundBlend(fovDegrees: number) {
  return clamp((fovDegrees - 95) / 55, 0, 1)
}

function drawAidLayers(
  context: CanvasRenderingContext2D,
  view: SkyProjectionView,
  aidVisibility: SkyEngineAidVisibility,
  sunState: SkyEngineSunState,
  fovDegrees: number,
) {
  const horizonCurve = buildConstantAltitudeCurve(view, 0)

  if (horizonCurve.length >= 2) {
    const groundBoundaryCurve = buildGroundBoundaryCurve(horizonCurve, view.viewportWidth)
    const topY = Math.min(...groundBoundaryCurve.map((point) => point.y))
    const wideFovGroundBlend = getWideFovGroundBlend(fovDegrees)
    const groundGradient = context.createLinearGradient(0, topY, 0, view.viewportHeight)
    groundGradient.addColorStop(0, hexToRgba(sunState.visualCalibration.landscapeFogColorHex, 0.06 * (1 - wideFovGroundBlend) + 0.03 * wideFovGroundBlend))
    groundGradient.addColorStop(0.24, hexToRgba(sunState.visualCalibration.groundTintHex, 0.18 * (1 - wideFovGroundBlend) + 0.08 * wideFovGroundBlend))
    groundGradient.addColorStop(1, hexToRgba(sunState.visualCalibration.backgroundColorHex, 0.96 * (1 - wideFovGroundBlend) + 0.74 * wideFovGroundBlend))

    context.save()
    context.fillStyle = groundGradient
    context.beginPath()
    context.moveTo(groundBoundaryCurve[0].x, groundBoundaryCurve[0].y)
    groundBoundaryCurve.slice(1).forEach((point) => {
      context.lineTo(point.x, point.y)
    })
    context.lineTo(view.viewportWidth + 2, view.viewportHeight + 2)
    context.lineTo(-2, view.viewportHeight + 2)
    context.closePath()
    context.fill()
    context.restore()
  }

  if (aidVisibility.altitudeRings) {
    ;[15, 30, 45, 60].forEach((altitudeDeg) => {
      drawCurve(context, buildConstantAltitudeCurve(view, altitudeDeg), hexToRgba('#9ecbff', 0.11), 1, true)
    })
  }

  if (!aidVisibility.azimuthRing) {
    return
  }

  const azimuthGuideCurve = buildConstantAltitudeCurve(view, 8)

  context.save()
  context.shadowColor = hexToRgba(sunState.visualCalibration.horizonGlowColorHex, 0.58)
  context.shadowBlur = 22
  drawCurve(context, horizonCurve, hexToRgba('#7cc6ff', 0.22), 3.2)
  context.restore()

  drawCurve(context, horizonCurve, hexToRgba('#cfe7ff', 0.62), 1.1)
  drawCurve(context, azimuthGuideCurve, hexToRgba('#9ccfff', 0.1), 1)

  const tickSegments = buildAzimuthTickSegments(view)

  context.save()
  context.lineCap = 'round'
  tickSegments.forEach((tick) => {
    let strokeStyle = 'rgba(132, 186, 240, 0.36)'
    let lineWidth = 1

    if (tick.isCardinal) {
      strokeStyle = 'rgba(220, 240, 255, 0.92)'
      lineWidth = 1.9
    } else if (tick.isMajor) {
      strokeStyle = 'rgba(171, 214, 255, 0.62)'
      lineWidth = 1.35
    }

    context.strokeStyle = strokeStyle
    context.lineWidth = lineWidth
    context.beginPath()
    context.moveTo(tick.outerPoint.screenX, tick.outerPoint.screenY)
    context.lineTo(tick.innerPoint.screenX, tick.innerPoint.screenY)
    context.stroke()
  })
  context.restore()

  COMPASS_CARDINALS.forEach((cardinal) => {
    const projected = projectHorizontalToViewport(7.6, cardinal.azimuthDeg, view)

    if (!projected || !isProjectedPointVisible(projected, view, 22)) {
      return
    }

    drawCompassLabel(context, cardinal.label, projected.screenX, projected.screenY, 'rgba(226, 243, 255, 0.96)')
  })
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

function drawConstellationOverlay(context: CanvasRenderingContext2D, projectedObjects: readonly ProjectedSceneObjectEntry[]) {
  const projectedLookup = new Map(projectedObjects.map((entry) => [entry.object.id, entry]))
  context.save()
  context.strokeStyle = 'rgba(126, 171, 255, 0.18)'
  context.lineWidth = 1.1
  context.setLineDash([4, 5])

  CONSTELLATION_SEGMENTS.forEach(([leftId, rightId]) => {
    const left = projectedLookup.get(leftId)
    const right = projectedLookup.get(rightId)

    if (!left || !right) {
      return
    }

    context.beginPath()
    context.moveTo(left.screenX, left.screenY)
    context.lineTo(right.screenX, right.screenY)
    context.stroke()
  })

  context.restore()
}

function drawTrajectory(
  context: CanvasRenderingContext2D,
  view: SkyProjectionView,
  observer: SkyEngineObserver,
  selectedObject: SkyEngineSceneObject | null,
) {
  if (!selectedObject || selectedObject.trackingMode === 'static') {
    return null
  }

  const points = computeObjectTrajectorySamples(
    observer,
    selectedObject.timestampIso ?? new Date().toISOString(),
    selectedObject,
    TRAJECTORY_HOUR_OFFSETS,
  )
    .filter((sample) => sample.altitudeDeg >= -2)
    .map((sample) => projectHorizontalToViewport(sample.altitudeDeg, sample.azimuthDeg, view))
    .filter((sample): sample is NonNullable<typeof sample> => sample !== null)
    .filter((sample) => isProjectedPointVisible(sample, view, 24))
    .map((sample) => ({ x: sample.screenX, y: sample.screenY }))

  drawCurve(
    context,
    points,
    hexToRgba(selectedObject.colorHex, selectedObject.type === 'moon' ? 0.68 : 0.54),
    selectedObject.type === 'moon' ? 2.2 : 1.6,
    true,
  )

  return selectedObject.id
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
  object: SkyEngineSceneObject,
  x: number,
  y: number,
  radius: number,
  calibration: SkyEngineSunState['visualCalibration'],
  alpha: number,
) {
  const profile = getStarRenderProfile(object, calibration)

  context.save()
  const halo = context.createRadialGradient(x, y, 0, x, y, Math.max(radius * 3.2, profile.haloRadiusPx))
  halo.addColorStop(0, hexToRgba(profile.colorHex, alpha))
  halo.addColorStop(0.22, hexToRgba(profile.colorHex, alpha * 0.52))
  halo.addColorStop(1, hexToRgba(profile.colorHex, 0))
  context.fillStyle = halo
  context.beginPath()
  context.arc(x, y, Math.max(radius * 3.2, profile.haloRadiusPx), 0, Math.PI * 2)
  context.fill()

  context.fillStyle = hexToRgba(profile.colorHex, Math.min(1, alpha + 0.08))
  context.beginPath()
  context.arc(x, y, Math.max(radius * 0.96, profile.coreRadiusPx), 0, Math.PI * 2)
  context.fill()

  context.fillStyle = 'rgba(255, 255, 255, 0.9)'
  context.beginPath()
  context.arc(x, y, Math.max(0.65, Math.min(radius * 0.44, profile.coreRadiusPx * 0.72)), 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function getObjectHorizonFade(object: SkyEngineSceneObject) {
  if (object.source === 'temporary_scene_seed') {
    return 1
  }

  if (object.isAboveHorizon) {
    return 1
  }

  const fadeRange = object.type === 'star' ? STAR_BELOW_HORIZON_FADE_DEG : BODY_BELOW_HORIZON_FADE_DEG
  return clamp((object.altitudeDeg + fadeRange) / fadeRange, 0, 1)
}

function drawProjectedObjects(
  context: CanvasRenderingContext2D,
  view: SkyProjectionView,
  objects: readonly SkyEngineSceneObject[],
  scenePacket: SkyScenePacket | null,
  sunState: SkyEngineSunState,
  selectedObjectId: string | null,
) {
  const fovDegrees = getSkyEngineFovDegrees(view.fovRadians)
  const objectLookup = new Map(objects.map((object) => [object.id, object]))
  const projectedObjects = objects.flatMap((object) => {
    if (!shouldRenderObject(object, fovDegrees, sunState, selectedObjectId)) {
      return []
    }

    const projected = projectDirectionToViewport(horizontalToDirection(object.altitudeDeg, object.azimuthDeg), view)

    if (!projected || !isProjectedPointVisible(projected, view, 22)) {
      return []
    }

    const markerRadiusPx = getMarkerRadiusPx(object, view, sunState)

    return [{
      object,
      screenX: projected.screenX,
      screenY: projected.screenY,
      depth: projected.depth,
      angularDistanceRad: projected.angularDistanceRad,
      markerRadiusPx,
      pickRadiusPx: getPickRadiusPx(object, markerRadiusPx),
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

    const markerRadiusPx = getMarkerRadiusPx(object, view, sunState)

    return [{
      object,
      screenX: projected.screenX,
      screenY: projected.screenY,
      depth: projected.depth,
      angularDistanceRad: projected.angularDistanceRad,
      markerRadiusPx,
      pickRadiusPx: getPickRadiusPx(object, markerRadiusPx),
    }]
  })
  const allProjectedObjects = [...projectedObjects, ...packetProjectedObjects]
    .sort((left, right) => left.depth - right.depth || left.object.magnitude - right.object.magnitude)

  allProjectedObjects.forEach((entry) => {
    const horizonFade = getObjectHorizonFade(entry.object)

    if (horizonFade <= 0) {
      return
    }

    if (entry.object.type === 'moon') {
      context.save()
      context.globalAlpha = horizonFade
      drawMoon(context, entry.object, entry.screenX, entry.screenY, entry.markerRadiusPx)
      context.restore()
      return
    }

    if (entry.object.type === 'planet') {
      context.save()
      context.globalAlpha = horizonFade
      drawPlanet(context, entry.object, entry.screenX, entry.screenY, entry.markerRadiusPx)
      context.restore()
      return
    }

    if (entry.object.type === 'deep_sky') {
      context.save()
      context.globalAlpha = horizonFade
      drawDeepSkyMarker(context, entry.object, entry.screenX, entry.screenY, entry.markerRadiusPx)
      context.restore()
      return
    }

    drawStar(
      context,
      entry.object,
      entry.screenX,
      entry.screenY,
      entry.markerRadiusPx,
      sunState.visualCalibration,
      clamp(sunState.visualCalibration.starVisibility * horizonFade, 0, 0.98),
    )
  })

  return allProjectedObjects
}

function drawLabels(
  context: CanvasRenderingContext2D,
  projectedObjects: readonly ProjectedSceneObjectEntry[],
  selectedObjectId: string | null,
  guidedObjectIds: ReadonlySet<string>,
  labelCap: number,
  placedRectangles: LabelLayoutEntry[] = [],
) {
  const visibleLabelIds: string[] = []
  const labelPositions = new Map<string, { x: number; y: number }>()
  const candidates = projectedObjects.filter((candidate) => !isEngineTileSource(candidate.object.source)).sort((left, right) => {
    const priorityDelta = getLabelPriority(right.object, selectedObjectId, guidedObjectIds) - getLabelPriority(left.object, selectedObjectId, guidedObjectIds)

    if (priorityDelta !== 0) {
      return priorityDelta
    }

    return left.angularDistanceRad - right.angularDistanceRad
  })

  context.save()
  context.font = '600 14px sans-serif'
  context.textBaseline = 'middle'

  let visibleCount = 0
  candidates.forEach((candidate) => {
    const isSelected = candidate.object.id === selectedObjectId
    const shouldAllow = isSelected || visibleCount < labelCap

    if (!shouldAllow) {
      return
    }

    const textWidth = context.measureText(candidate.object.name).width
    const labelX = candidate.screenX + candidate.markerRadiusPx + 12
    const labelY = candidate.screenY - candidate.markerRadiusPx - 10
    const rectangle = {
      x: labelX - 8,
      y: labelY - 12,
      width: textWidth + 16,
      height: 24,
    }

    if (!isSelected && placedRectangles.some((entry) => rectanglesOverlap(entry, rectangle))) {
      return
    }

    placedRectangles.push(rectangle)
    visibleLabelIds.push(candidate.object.id)
    labelPositions.set(candidate.object.id, { x: labelX, y: labelY })

    if (!isSelected) {
      visibleCount += 1
    }

    context.fillStyle = isSelected ? 'rgba(9, 16, 26, 0.92)' : 'rgba(8, 15, 26, 0.68)'
    context.strokeStyle = isSelected ? 'rgba(236, 244, 255, 0.98)' : 'rgba(118, 171, 235, 0.42)'
    context.lineWidth = isSelected ? 2 : 1.2
    context.beginPath()
    context.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height)
    context.fill()
    context.stroke()
    context.fillStyle = '#eef6ff'
    context.fillText(candidate.object.name, labelX, labelY)
  })

  context.restore()

  const sortedVisibleLabelIds = [...visibleLabelIds].sort((left, right) => left.localeCompare(right))

  return {
    visibleLabelIds: sortedVisibleLabelIds,
    labelPositions,
    placedRectangles,
    visibleCount,
  }
}

function drawPacketLabels(
  context: CanvasRenderingContext2D,
  projectedObjects: readonly ProjectedSceneObjectEntry[],
  scenePacket: SkyScenePacket | null,
  selectedObjectId: string | null,
  labelCap: number,
) {
  const placedRectangles: LabelLayoutEntry[] = []
  const visibleLabelIds: string[] = []
  const labelPositions = new Map<string, { x: number; y: number }>()

  if (!scenePacket || scenePacket.labels.length === 0) {
    return {
      visibleLabelIds,
      labelPositions,
      placedRectangles,
      visibleCount: 0,
    }
  }

  const projectedLookup = new Map(projectedObjects.map((entry) => [entry.object.id, entry]))
  const candidates = scenePacket.labels
    .flatMap((label) => {
      const projected = projectedLookup.get(label.id)

      if (!projected) {
        return []
      }

      return [{ label, projected }]
    })
    .sort((left, right) => {
      if (left.label.id === selectedObjectId) {
        return -1
      }

      if (right.label.id === selectedObjectId) {
        return 1
      }

      return right.label.priority - left.label.priority || left.label.text.localeCompare(right.label.text)
    })

  context.save()
  context.font = '600 14px sans-serif'
  context.textBaseline = 'middle'

  let visibleCount = 0
  candidates.forEach(({ label, projected }) => {
    const isSelected = label.id === selectedObjectId
    const shouldAllow = isSelected || visibleCount < labelCap

    if (!shouldAllow) {
      return
    }

    const textWidth = context.measureText(label.text).width
    const labelX = projected.screenX + projected.markerRadiusPx + 12
    const labelY = projected.screenY - projected.markerRadiusPx - 10
    const rectangle = {
      x: labelX - 8,
      y: labelY - 12,
      width: textWidth + 16,
      height: 24,
    }

    if (!isSelected && placedRectangles.some((entry) => rectanglesOverlap(entry, rectangle))) {
      return
    }

    placedRectangles.push(rectangle)
    visibleLabelIds.push(label.id)
    labelPositions.set(label.id, { x: labelX, y: labelY })

    if (!isSelected) {
      visibleCount += 1
    }

    context.fillStyle = isSelected ? 'rgba(9, 16, 26, 0.92)' : 'rgba(8, 15, 26, 0.76)'
    context.strokeStyle = isSelected ? 'rgba(236, 244, 255, 0.98)' : 'rgba(118, 171, 235, 0.54)'
    context.lineWidth = isSelected ? 2 : 1.2
    context.beginPath()
    context.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height)
    context.fill()
    context.stroke()
    context.fillStyle = '#eef6ff'
    context.fillText(label.text, labelX, labelY)
  })

  context.restore()

  const sortedVisibleLabelIds = [...visibleLabelIds].sort((left, right) => left.localeCompare(right))

  return {
    visibleLabelIds: sortedVisibleLabelIds,
    labelPositions,
    placedRectangles,
    visibleCount,
  }
}

function drawSelectionPointer(
  context: CanvasRenderingContext2D,
  projectedObjects: readonly ProjectedSceneObjectEntry[],
  selectedObjectId: string | null,
  labelPositions: ReadonlyMap<string, { x: number; y: number }>,
) {
  if (!selectedObjectId) {
    return
  }

  const selectedEntry = projectedObjects.find((entry) => entry.object.id === selectedObjectId)

  if (!selectedEntry) {
    return
  }

  const labelPosition = labelPositions.get(selectedObjectId)
  context.save()
  context.strokeStyle = 'rgba(255, 255, 255, 0.96)'
  context.lineWidth = 2
  context.beginPath()
  context.arc(selectedEntry.screenX, selectedEntry.screenY, selectedEntry.markerRadiusPx + 8, 0, Math.PI * 2)
  context.stroke()
  context.strokeStyle = 'rgba(255, 255, 255, 0.22)'
  context.lineWidth = 1
  context.beginPath()
  context.arc(selectedEntry.screenX, selectedEntry.screenY, selectedEntry.markerRadiusPx + 14, 0, Math.PI * 2)
  context.stroke()

  if (labelPosition) {
    context.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    context.lineWidth = 1.25
    context.beginPath()
    context.moveTo(selectedEntry.screenX + selectedEntry.markerRadiusPx * 0.8, selectedEntry.screenY - selectedEntry.markerRadiusPx * 0.8)
    context.lineTo(labelPosition.x - 4, labelPosition.y)
    context.stroke()
  }

  context.restore()
}

function ensureProjectionSurface(runtime: SceneRuntimeRefs) {
  const width = Math.max(1, Math.round(runtime.engine.getRenderWidth()))
  const height = Math.max(1, Math.round(runtime.engine.getRenderHeight()))
  const textureSize = runtime.projectionTexture.getSize()

  if (textureSize.width !== width || textureSize.height !== height) {
    runtime.projectionTexture.dispose()
    runtime.projectionTexture = new DynamicTexture('sky-engine-projection-texture', { width, height }, runtime.scene, false)
    runtime.projectionTexture.hasAlpha = false
    runtime.projectionMaterial.diffuseTexture = runtime.projectionTexture
    runtime.projectionMaterial.emissiveTexture = runtime.projectionTexture
  }

  runtime.projectionPlane.scaling.set(width, height, 1)
  runtime.camera.orthoLeft = -width * 0.5
  runtime.camera.orthoRight = width * 0.5
  runtime.camera.orthoTop = height * 0.5
  runtime.camera.orthoBottom = -height * 0.5
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

function renderProjectionFrame(runtime: SceneRuntimeRefs, latest: ScenePropsSnapshot) {
  ensureProjectionSurface(runtime)
  const context = runtime.projectionTexture.getContext() as CanvasRenderingContext2D
  const width = runtime.engine.getRenderWidth()
  const height = runtime.engine.getRenderHeight()

  context.clearRect(0, 0, width, height)
  drawBackground(context, width, height, latest.sunState)

  const view: SkyProjectionView = {
    centerDirection: runtime.centerDirection,
    fovRadians: runtime.currentFov,
    viewportWidth: width,
    viewportHeight: height,
    projectionMode: latest.projectionMode,
  }
  const lod = resolveViewTier(getSkyEngineFovDegrees(runtime.currentFov))

  drawSolarGlare(context, view, latest.sunState)
  drawAidLayers(context, view, latest.aidVisibility, latest.sunState, getSkyEngineFovDegrees(runtime.currentFov))
  const projectedObjects = drawProjectedObjects(context, view, latest.objects, latest.scenePacket, latest.sunState, latest.selectedObjectId)

  if (latest.aidVisibility.constellations) {
    drawConstellationOverlay(context, projectedObjects)
  }

  const selectedObject = latest.objects.find((object) => object.id === latest.selectedObjectId) ?? null
  const trajectoryObjectId = drawTrajectory(context, view, latest.observer, selectedObject)
  const packetLabelLayout = drawPacketLabels(context, projectedObjects, latest.scenePacket, latest.selectedObjectId, lod.labelCap)
  const labelLayout = drawLabels(
    context,
    projectedObjects,
    latest.selectedObjectId,
    new Set(latest.guidedObjectIds),
    Math.max(0, lod.labelCap - packetLabelLayout.visibleCount),
    packetLabelLayout.placedRectangles,
  )
  const labelPositions = new Map<string, { x: number; y: number }>([
    ...Array.from(packetLabelLayout.labelPositions.entries()),
    ...Array.from(labelLayout.labelPositions.entries()),
  ])
  drawSelectionPointer(context, projectedObjects, latest.selectedObjectId, labelPositions)
  runtime.projectionTexture.update()

  runtime.projectedPickEntries = projectedObjects.map((entry) => ({
    object: entry.object,
    screenX: entry.screenX,
    screenY: entry.screenY,
    radiusPx: entry.pickRadiusPx,
    depth: entry.depth,
  }))

  return {
    lod,
    trajectoryObjectId,
    visibleLabelIds: [...packetLabelLayout.visibleLabelIds, ...labelLayout.visibleLabelIds].sort((left, right) => left.localeCompare(right)),
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
  const runtimeRefs = useRef<SceneRuntimeRefs | null>(null)
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
  }, [aidVisibility, backendStars, guidedObjectIds, initialViewState, objects, observer, onAtmosphereStatusChange, onSelectObject, onViewStateChange, projectionMode, scenePacket, selectedObjectId, sunState])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return undefined
    }

    const engine = new Engine(canvas, true, {
      antialias: true,
      preserveDrawingBuffer: false,
      stencil: true,
    })
    const scene = new Scene(engine)
    const camera = new UniversalCamera('sky-engine-camera', new Vector3(0, 0, -10), scene)
    camera.mode = Camera.ORTHOGRAPHIC_CAMERA
    camera.minZ = 0.1
    camera.maxZ = 50
    camera.setTarget(Vector3.Zero())

    const projectionPlane = MeshBuilder.CreatePlane('sky-engine-projection-plane', { size: 1 }, scene)
    projectionPlane.position = Vector3.Zero()
    projectionPlane.isPickable = false

    const projectionMaterial = new StandardMaterial('sky-engine-projection-material', scene)
    projectionMaterial.disableLighting = true
    projectionMaterial.backFaceCulling = false
    const projectionTexture = new DynamicTexture('sky-engine-projection-texture', { width: 2, height: 2 }, scene, false)
    projectionTexture.hasAlpha = false
    projectionMaterial.diffuseTexture = projectionTexture
    projectionMaterial.emissiveTexture = projectionTexture
    projectionPlane.material = projectionMaterial

    runtimeRefs.current = {
      scene,
      engine,
      camera,
      canvas,
      projectionPlane,
      projectionMaterial,
      projectionTexture,
      centerDirection: horizontalToDirection(
        propsRef.current.initialViewState.centerAltDeg,
        propsRef.current.initialViewState.centerAzDeg,
      ),
      targetVector: null,
      currentFov: clampSkyEngineFov(degreesToRadians(propsRef.current.initialViewState.fovDegrees)),
      desiredFov: clampSkyEngineFov(degreesToRadians(propsRef.current.initialViewState.fovDegrees)),
      selectedObjectId: propsRef.current.selectedObjectId,
      activePointerId: null,
      dragAnchorDirection: null,
      dragStartX: 0,
      dragStartY: 0,
      dragMoved: false,
      projectedPickEntries: [],
      lastFrameTime: performance.now(),
      lastReportedFovTenths: null,
      lastReportedCenterAltTenths: null,
      lastReportedCenterAzTenths: null,
    }

    propsRef.current.onAtmosphereStatusChange({
      mode: 'fallback',
      message: 'Observer-centered stereographic projection active. Babylon is only the drawing surface.',
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
      runtime.dragAnchorDirection = unprojectViewportPoint(runtime.dragStartX, runtime.dragStartY, {
        centerDirection: runtime.centerDirection,
        fovRadians: runtime.currentFov,
        viewportWidth: bounds.width,
        viewportHeight: bounds.height,
        projectionMode: propsRef.current.projectionMode,
      })
      canvas.setPointerCapture(event.pointerId)
    }

    const handlePointerMove = (event: PointerEvent) => {
      const runtime = runtimeRefs.current

      if (runtime?.activePointerId !== event.pointerId || !runtime.dragAnchorDirection) {
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
        centerDirection: runtime.centerDirection,
        fovRadians: runtime.currentFov,
        viewportWidth: bounds.width,
        viewportHeight: bounds.height,
        projectionMode: propsRef.current.projectionMode,
      })
      runtime.centerDirection = rotateVectorTowardPointerAnchor(runtime.centerDirection, nextPointerDirection, runtime.dragAnchorDirection).normalizeToNew()
      runtime.targetVector = null
    }

    const releasePointer = (pointerId: number) => {
      const runtime = runtimeRefs.current

      if (runtime?.activePointerId !== pointerId) {
        return
      }

      runtime.activePointerId = null
      runtime.dragAnchorDirection = null
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

    const handleResize = () => engine.resize()
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

      syncNavigationState(runtime, latest.objects, latest.selectedObjectId)
      const navigation = updateObserverNavigation(runtime.centerDirection, runtime.currentFov, runtime.desiredFov, runtime.targetVector, deltaSeconds)
      runtime.centerDirection = navigation.centerDirection
      runtime.currentFov = navigation.fovRadians
      runtime.targetVector = navigation.targetVector

      const frame = renderProjectionFrame(runtime, latest)
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
        groundTextureMode: 'projection-screen',
        groundTextureAssetPath: 'observer-centered stereographic projection',
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
      runtimeRefs.current?.projectionTexture.dispose()
      runtimeRefs.current?.projectionPlane.dispose()
      runtimeRefs.current?.projectionMaterial.dispose()
      runtimeRefs.current = null
      scene.dispose()
      engine.dispose()
    }
  }, [])

  useEffect(() => {
    onAtmosphereStatusChange({
      mode: 'fallback',
      message: `Projection renderer active for ${sunState.phaseLabel.toLowerCase()} conditions.`,
    })
  }, [onAtmosphereStatusChange, sunState])

  return <canvas ref={canvasRef} className="sky-engine-scene__canvas" aria-label="Sky Engine scene" />
}