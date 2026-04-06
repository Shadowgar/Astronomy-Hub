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
  buildInitialViewTarget as buildObserverInitialViewTarget,
  getDesiredFovForObject,
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
  getProjectionScale,
  horizontalToDirection,
  isProjectedPointVisible,
  projectDirectionToViewport,
  projectHorizontalToViewport,
  type SkyProjectionView,
  unprojectViewportPoint,
} from './projectionMath'
import type {
  SkyEngineAidVisibility,
  SkyEngineAtmosphereStatus,
  SkyEngineObserver,
  SkyEngineSceneObject,
  SkyEngineSunState,
} from './types'

interface SkyEngineSceneProps {
  readonly observer: SkyEngineObserver
  readonly objects: readonly SkyEngineSceneObject[]
  readonly sunState: SkyEngineSunState
  readonly selectedObjectId: string | null
  readonly guidedObjectIds: readonly string[]
  readonly aidVisibility: SkyEngineAidVisibility
  readonly onSelectObject: (objectId: string | null) => void
  readonly onAtmosphereStatusChange: (status: SkyEngineAtmosphereStatus) => void
  readonly onViewStateChange?: (viewState: { fovDegrees: number }) => void
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
}

interface SceneStateWriteInput {
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
const CONSTELLATION_SEGMENTS = [
  ['sky-real-vega', 'sky-real-sheliak'],
  ['sky-real-vega', 'sky-real-sulafat'],
  ['sky-real-deneb', 'sky-real-albireo'],
  ['sky-real-altair', 'sky-real-tarazed'],
] as const

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function writeSceneState({
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
  if (object.id === selectedObjectId) {
    return true
  }

  if (!object.isAboveHorizon && object.source !== 'temporary_scene_seed') {
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
  skyGradient.addColorStop(0.68, sunState.visualCalibration.skyHorizonColorHex)
  skyGradient.addColorStop(1, sunState.visualCalibration.backgroundColorHex)
  context.fillStyle = skyGradient
  context.fillRect(0, 0, width, height)

  const horizonBand = context.createLinearGradient(0, height * 0.58, 0, height)
  horizonBand.addColorStop(0, hexToRgba(sunState.visualCalibration.twilightBandColorHex, 0))
  horizonBand.addColorStop(0.36, hexToRgba(sunState.visualCalibration.horizonGlowColorHex, sunState.visualCalibration.horizonGlowAlpha))
  horizonBand.addColorStop(1, hexToRgba(sunState.visualCalibration.groundTintHex, 0.88))
  context.fillStyle = horizonBand
  context.fillRect(0, height * 0.52, width, height * 0.48)

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

function drawAidLayers(
  context: CanvasRenderingContext2D,
  view: SkyProjectionView,
  aidVisibility: SkyEngineAidVisibility,
  sunState: SkyEngineSunState,
) {
  if (aidVisibility.altitudeRings) {
    ;[15, 30, 45, 60].forEach((altitudeDeg) => {
      drawCurve(context, buildConstantAltitudeCurve(view, altitudeDeg), hexToRgba('#9ecbff', 0.14), 1, true)
    })
  }

  if (aidVisibility.azimuthRing) {
    drawCurve(context, buildConstantAltitudeCurve(view, 0), hexToRgba(sunState.visualCalibration.horizonColorHex, 0.82), 2.2)
  }

  if (!aidVisibility.azimuthRing) {
    return
  }

  context.save()
  context.fillStyle = 'rgba(231, 241, 255, 0.82)'
  context.font = '600 14px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  ;[
    { label: 'N', altitudeDeg: 3, azimuthDeg: 0 },
    { label: 'E', altitudeDeg: 3, azimuthDeg: 90 },
    { label: 'S', altitudeDeg: 3, azimuthDeg: 180 },
    { label: 'W', altitudeDeg: 3, azimuthDeg: 270 },
  ].forEach((cardinal) => {
    const projected = projectHorizontalToViewport(cardinal.altitudeDeg, cardinal.azimuthDeg, view)

    if (projected && isProjectedPointVisible(projected, view, 18)) {
      context.fillText(cardinal.label, projected.screenX, projected.screenY)
    }
  })

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
  context.fillStyle = 'rgba(250, 241, 216, 0.96)'
  context.beginPath()
  context.arc(x, y, radius, 0, Math.PI * 2)
  context.fill()

  const waxingOffset = (object.waxing ? -1 : 1) * radius * clamp(1 - (object.illuminationFraction ?? 0.5) * 1.2, -0.88, 0.88)
  context.fillStyle = 'rgba(20, 24, 36, 0.42)'
  context.beginPath()
  context.arc(x + waxingOffset, y, radius * 0.96, 0, Math.PI * 2)
  context.fill()

  const halo = context.createRadialGradient(x, y, radius * 0.2, x, y, radius * 2.3)
  halo.addColorStop(0, 'rgba(255, 249, 223, 0.18)')
  halo.addColorStop(1, 'rgba(255, 249, 223, 0)')
  context.fillStyle = halo
  context.beginPath()
  context.arc(x, y, radius * 2.3, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function drawPlanet(context: CanvasRenderingContext2D, object: SkyEngineSceneObject, x: number, y: number, radius: number) {
  context.save()
  const halo = context.createRadialGradient(x, y, radius * 0.2, x, y, radius * 2.4)
  halo.addColorStop(0, hexToRgba(object.colorHex, 0.92))
  halo.addColorStop(0.4, hexToRgba(object.colorHex, 0.54))
  halo.addColorStop(1, hexToRgba(object.colorHex, 0))
  context.fillStyle = halo
  context.beginPath()
  context.arc(x, y, radius * 2.4, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = hexToRgba(object.colorHex, 0.96)
  context.beginPath()
  context.arc(x, y, radius, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function drawStar(context: CanvasRenderingContext2D, object: SkyEngineSceneObject, x: number, y: number, radius: number, alpha: number) {
  context.save()
  const halo = context.createRadialGradient(x, y, 0, x, y, radius * 3.4)
  halo.addColorStop(0, hexToRgba(object.colorHex, alpha))
  halo.addColorStop(0.32, hexToRgba(object.colorHex, alpha * 0.42))
  halo.addColorStop(1, hexToRgba(object.colorHex, 0))
  context.fillStyle = halo
  context.beginPath()
  context.arc(x, y, radius * 3.4, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = hexToRgba(object.colorHex, Math.min(1, alpha + 0.14))
  context.beginPath()
  context.arc(x, y, radius, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function drawProjectedObjects(
  context: CanvasRenderingContext2D,
  view: SkyProjectionView,
  objects: readonly SkyEngineSceneObject[],
  sunState: SkyEngineSunState,
  selectedObjectId: string | null,
) {
  const fovDegrees = getSkyEngineFovDegrees(view.fovRadians)
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
  }).sort((left, right) => left.depth - right.depth || left.object.magnitude - right.object.magnitude)

  projectedObjects.forEach((entry) => {
    if (entry.object.type === 'moon') {
      drawMoon(context, entry.object, entry.screenX, entry.screenY, entry.markerRadiusPx)
      return
    }

    if (entry.object.type === 'planet') {
      drawPlanet(context, entry.object, entry.screenX, entry.screenY, entry.markerRadiusPx)
      return
    }

    if (entry.object.type === 'deep_sky') {
      drawDeepSkyMarker(context, entry.object, entry.screenX, entry.screenY, entry.markerRadiusPx)
      return
    }

    drawStar(
      context,
      entry.object,
      entry.screenX,
      entry.screenY,
      entry.markerRadiusPx,
      clamp(sunState.visualCalibration.starVisibility * 0.96, 0.28, 0.98),
    )
  })

  return projectedObjects
}

function drawLabels(
  context: CanvasRenderingContext2D,
  projectedObjects: readonly ProjectedSceneObjectEntry[],
  selectedObjectId: string | null,
  guidedObjectIds: ReadonlySet<string>,
  labelCap: number,
) {
  const placedRectangles: LabelLayoutEntry[] = []
  const visibleLabelIds: string[] = []
  const labelPositions = new Map<string, { x: number; y: number }>()
  const candidates = [...projectedObjects].sort((left, right) => {
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
    runtime.targetVector = buildObserverInitialViewTarget(objects, [])
  }

  if (selectionChanged && !selectedObject) {
    runtime.desiredFov = getDesiredFovForObject(null)
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
  }
  const lod = resolveViewTier(getSkyEngineFovDegrees(runtime.currentFov))

  drawAidLayers(context, view, latest.aidVisibility, latest.sunState)
  const projectedObjects = drawProjectedObjects(context, view, latest.objects, latest.sunState, latest.selectedObjectId)

  if (latest.aidVisibility.constellations) {
    drawConstellationOverlay(context, projectedObjects)
  }

  const selectedObject = latest.objects.find((object) => object.id === latest.selectedObjectId) ?? null
  const trajectoryObjectId = drawTrajectory(context, view, latest.observer, selectedObject)
  const labelLayout = drawLabels(context, projectedObjects, latest.selectedObjectId, new Set(latest.guidedObjectIds), lod.labelCap)
  drawSelectionPointer(context, projectedObjects, latest.selectedObjectId, labelLayout.labelPositions)
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
    visibleLabelIds: labelLayout.visibleLabelIds,
  }
}

export default function SkyEngineScene({
  observer,
  objects,
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
    observer,
    objects,
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
      observer,
      objects,
      sunState,
      selectedObjectId,
      guidedObjectIds,
      aidVisibility,
      onSelectObject,
      onAtmosphereStatusChange,
      onViewStateChange,
    }
  }, [aidVisibility, guidedObjectIds, objects, observer, onAtmosphereStatusChange, onSelectObject, onViewStateChange, selectedObjectId, sunState])

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
      centerDirection: buildObserverInitialViewTarget(propsRef.current.objects, propsRef.current.guidedObjectIds),
      targetVector: null,
      currentFov: getDesiredFovForObject(null),
      desiredFov: getDesiredFovForObject(null),
      selectedObjectId: propsRef.current.selectedObjectId,
      activePointerId: null,
      dragAnchorDirection: null,
      dragStartX: 0,
      dragStartY: 0,
      dragMoved: false,
      projectedPickEntries: [],
      lastFrameTime: performance.now(),
      lastReportedFovTenths: null,
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
      }
      const nextView: SkyProjectionView = {
        centerDirection: runtime.centerDirection,
        fovRadians: nextDesiredFov,
        viewportWidth: bounds.width,
        viewportHeight: bounds.height,
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

      if (currentFovTenths !== runtime.lastReportedFovTenths) {
        runtime.lastReportedFovTenths = currentFovTenths
        latest.onViewStateChange?.({ fovDegrees: currentFovTenths / 10 })
      }

      writeSceneState({
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