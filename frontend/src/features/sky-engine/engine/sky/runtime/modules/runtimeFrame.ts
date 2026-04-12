import { Vector3 } from '@babylonjs/core/Maths/math.vector'

import { getSkyEngineFovDegrees } from '../../../../observerNavigation'
import {
  directionToHorizontal,
  getProjectionScale,
  horizontalToDirection,
  isProjectedPointVisible,
  projectDirectionToViewport,
  type SkyProjectionView,
} from '../../../../projectionMath'
import {
  computeStellariumPointVisual,
  getStarRenderProfile,
  getStarRenderProfileForMagnitude,
  type StarRenderProfile,
} from '../../../../starRenderer'
import { computeVisibilityAlpha } from '../../../../starVisibility'
import { getDeepSkyMarkerDimensionsPx, getDeepSkyProjectionStyle, resolveDeepSkyAxes } from '../../../../dsoVisuals'
import type { SkyScenePacket } from '../..'
import type {
  SkyEngineAidVisibility,
  SkyEngineObserver,
  SkyEngineSceneObject,
  SkyEngineSunState,
  SkyEngineVisualCalibration,
} from '../../../../types'
import type { SkyBrightnessExposureState } from '../types'

export interface SceneViewLod {
  readonly tier: 'wide' | 'medium' | 'close'
  readonly labelCap: number
}

export interface ProjectedSceneObjectEntry {
  readonly object: SkyEngineSceneObject
  readonly screenX: number
  readonly screenY: number
  readonly depth: number
  readonly angularDistanceRad: number
  readonly markerRadiusPx: number
  readonly shapeWidthPx?: number
  readonly shapeHeightPx?: number
  readonly shapeRotationRad?: number
  readonly pickRadiusPx: number
  readonly renderAlpha: number
  readonly renderedMagnitude?: number
  readonly visibilityAlpha?: number
  readonly starProfile?: StarRenderProfile
}

export interface RuntimeProjectedSceneFrame {
  readonly width: number
  readonly height: number
  readonly currentFovDegrees: number
  readonly lod: SceneViewLod
  readonly view: SkyProjectionView
  readonly projectedObjects: readonly ProjectedSceneObjectEntry[]
  readonly limitingMagnitude: number
  readonly sceneTimestampIso: string | undefined
}

export interface RuntimeProjectedStarsFrame {
  readonly width: number
  readonly height: number
  readonly currentFovDegrees: number
  readonly lod: SceneViewLod
  readonly view: SkyProjectionView
  readonly projectedStars: readonly ProjectedSceneObjectEntry[]
  readonly limitingMagnitude: number
  readonly sceneTimestampIso: string | undefined
}

export interface StarProjectionTimingBreakdown {
  readonly transformMs: number
  readonly magnitudeFilterMs: number
  readonly visibilityFilterMs: number
  readonly sortingMs: number
  readonly allocationMs: number
  readonly totalMs: number
}

export interface ProjectedStarsResult {
  readonly projectedStars: readonly ProjectedSceneObjectEntry[]
  readonly limitingMagnitude: number
  readonly timing: StarProjectionTimingBreakdown
}

export interface NonStarProjectionTimingBreakdown {
  readonly transformMs: number
  readonly filteringMs: number
  readonly allocationMs: number
  readonly totalMs: number
}

export interface ProjectedNonStarObjectsResult {
  readonly projectedObjects: readonly ProjectedSceneObjectEntry[]
  readonly timing: NonStarProjectionTimingBreakdown
}

export interface SceneFrameStateWriteInput {
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

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

function isEngineTileSource(source: SkyEngineSceneObject['source']) {
  return source === 'engine_mock_tile' || source === 'engine_hipparcos_tile'
}

const STAR_MAGNITUDE_BREAK_MARGIN = 0
const STAR_DENSITY_CAP_WIDE = 700
const STAR_DENSITY_CAP_MEDIUM = 1200
const STAR_DENSITY_CAP_CLOSE = 2000
const EMPTY_PROJECTED_OBJECTS: readonly ProjectedSceneObjectEntry[] = []

let cachedStarOrderSignature = ''
let cachedOrderedStarsByMagnitude: SkyEngineSceneObject[] = []
let cachedNonStarOrderSignature = ''
let cachedNonStarObjects: SkyEngineSceneObject[] = []

function getStarOrderSignature(objects: readonly SkyEngineSceneObject[]) {
  const first = objects[0]?.id ?? 'none'
  const last = objects[objects.length - 1]?.id ?? 'none'
  return `${objects.length}:${first}:${last}`
}

function getOrderedStarsByMagnitude(objects: readonly SkyEngineSceneObject[]) {
  const signature = getStarOrderSignature(objects)
  if (cachedStarOrderSignature === signature) {
    return cachedOrderedStarsByMagnitude
  }

  cachedOrderedStarsByMagnitude = objects
    .filter((object) => object.type === 'star')
    .slice()
    .sort((left, right) => left.magnitude - right.magnitude || left.id.localeCompare(right.id))
  cachedStarOrderSignature = signature
  return cachedOrderedStarsByMagnitude
}

function getProjectedStarDensityCap(fovDegrees: number) {
  if (fovDegrees >= 90) {
    return STAR_DENSITY_CAP_WIDE
  }

  if (fovDegrees >= 35) {
    return STAR_DENSITY_CAP_MEDIUM
  }

  return STAR_DENSITY_CAP_CLOSE
}

function getOrderedNonStarObjects(objects: readonly SkyEngineSceneObject[]) {
  const signature = getStarOrderSignature(objects)
  if (cachedNonStarOrderSignature === signature) {
    return cachedNonStarObjects
  }

  cachedNonStarObjects = objects.filter((object) => object.type !== 'star')
  cachedNonStarOrderSignature = signature
  return cachedNonStarObjects
}

export function writeSceneState({
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
}: SceneFrameStateWriteInput) {
  canvas.setAttribute('data-sky-engine-scene-state', serializeSceneState({
    backendStarCount,
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
  }))
}

export function serializeSceneState({
  backendStarCount,
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
}: Omit<SceneFrameStateWriteInput, 'canvas'>) {
  const moonObject = objects.find((object) => object.type === 'moon')

  return JSON.stringify({
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
  })
}

export function clearSceneState(canvas: HTMLCanvasElement) {
  canvas.removeAttribute('data-sky-engine-scene-state')
}

export function resolveViewTier(fovDegrees: number): SceneViewLod {
  if (fovDegrees >= 90) {
    return { tier: 'wide', labelCap: 6 }
  }

  if (fovDegrees >= 35) {
    return { tier: 'medium', labelCap: 8 }
  }

  return { tier: 'close', labelCap: 10 }
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

function getObjectHorizonFade(_object: SkyEngineSceneObject, _centerAltitudeDeg: number, _fovDegrees: number) {
  return 1
}

function getObjectVisibilityAltitudeDeg(object: SkyEngineSceneObject, centerAltitudeDeg: number) {
  if (centerAltitudeDeg <= 0 && object.altitudeDeg < 0) {
    return Math.abs(object.altitudeDeg)
  }

  return object.altitudeDeg
}

function getProjectedDiscRadiusPx(apparentSizeDeg: number | undefined, scale: number, minimumRadiusPx: number, maximumRadiusPx: number) {
  if (!apparentSizeDeg || apparentSizeDeg <= 0) {
    return minimumRadiusPx
  }

  const angularRadius = (apparentSizeDeg * Math.PI) / 360
  const planeRadius = 2 * Math.tan(angularRadius / 2)
  return clamp(planeRadius * scale, minimumRadiusPx, maximumRadiusPx)
}

function getDeepSkyMarkerRadiusPx(object: SkyEngineSceneObject, scale: number) {
  const style = getDeepSkyProjectionStyle(object)
  const axes = resolveDeepSkyAxes(object)
  const projectedRadiusPx = getProjectedDiscRadiusPx(
    axes.majorAxis,
    scale,
    style.minimumMajorDiameterPx * 0.5,
    style.maximumMajorDiameterPx * 0.5,
  )
  const magnitudeBoostPx = clamp(
    1.7 - object.magnitude * 0.12,
    0.2,
    style.projectionMagnitudeBoostPx,
  )

  return clamp(
    projectedRadiusPx + magnitudeBoostPx,
    style.minimumMajorDiameterPx * 0.5,
    style.maximumMajorDiameterPx * 0.5,
  )
}

function resolveHorizontalTangentBasis(altitudeDeg: number, azimuthDeg: number) {
  const altitudeRad = degreesToRadians(altitudeDeg)
  const azimuthRad = degreesToRadians(azimuthDeg)

  return {
    east: new Vector3(
      Math.cos(azimuthRad),
      0,
      -Math.sin(azimuthRad),
    ).normalize(),
    north: new Vector3(
      -Math.sin(azimuthRad) * Math.sin(altitudeRad),
      Math.cos(altitudeRad),
      -Math.cos(azimuthRad) * Math.sin(altitudeRad),
    ).normalize(),
  }
}

function offsetDirectionByTangent(centerDirection: Vector3, tangentDirection: Vector3, angularDistanceDeg: number) {
  const offsetFactor = Math.tan(degreesToRadians(angularDistanceDeg))

  return centerDirection.add(tangentDirection.scale(offsetFactor)).normalizeToNew()
}

function getProjectedSegmentMetrics(
  startDirection: Vector3,
  endDirection: Vector3,
  view: SkyProjectionView,
) {
  const start = projectDirectionToViewport(startDirection, view)
  const end = projectDirectionToViewport(endDirection, view)

  if (!start || !end) {
    return null
  }

  const deltaX = end.screenX - start.screenX
  const deltaY = start.screenY - end.screenY

  return {
    lengthPx: Math.hypot(deltaX, deltaY),
    rotationRad: Math.atan2(deltaY, deltaX),
  }
}

function normalizeRotationRad(value: number) {
  let normalized = value

  while (normalized <= -Math.PI) {
    normalized += Math.PI * 2
  }

  while (normalized > Math.PI) {
    normalized -= Math.PI * 2
  }

  return normalized
}

function getProjectedDsoShape(
  object: SkyEngineSceneObject,
  view: SkyProjectionView,
  centerDirection: Vector3,
) {
  const style = getDeepSkyProjectionStyle(object)
  const axes = resolveDeepSkyAxes(object)
  const fallbackRadiusPx = getDeepSkyMarkerRadiusPx(object, getProjectionScale(view))
  const fallbackDimensions = getDeepSkyMarkerDimensionsPx(object, fallbackRadiusPx)
  const basis = resolveHorizontalTangentBasis(object.altitudeDeg, object.azimuthDeg)
  const orientationRad = degreesToRadians(axes.orientationDeg)
  const majorTangent = basis.north.scale(Math.cos(orientationRad)).add(basis.east.scale(Math.sin(orientationRad))).normalize()
  const minorTangent = basis.north.scale(-Math.sin(orientationRad)).add(basis.east.scale(Math.cos(orientationRad))).normalize()
  const majorSegment = getProjectedSegmentMetrics(
    offsetDirectionByTangent(centerDirection, majorTangent.scale(-1), axes.majorAxis * 0.5),
    offsetDirectionByTangent(centerDirection, majorTangent, axes.majorAxis * 0.5),
    view,
  )
  const minorSegment = getProjectedSegmentMetrics(
    offsetDirectionByTangent(centerDirection, minorTangent.scale(-1), axes.minorAxis * 0.5),
    offsetDirectionByTangent(centerDirection, minorTangent, axes.minorAxis * 0.5),
    view,
  )
  const magnitudeBoostPx = clamp(
    1.7 - object.magnitude * 0.12,
    0.2,
    style.projectionMagnitudeBoostPx,
  ) * 2

  let shapeWidthPx = clamp(
    Math.max(majorSegment?.lengthPx ?? fallbackDimensions.widthPx, style.minimumMajorDiameterPx) + magnitudeBoostPx,
    style.minimumMajorDiameterPx,
    style.maximumMajorDiameterPx,
  )
  let shapeHeightPx = clamp(
    Math.max(minorSegment?.lengthPx ?? fallbackDimensions.heightPx, style.minimumMinorDiameterPx) + magnitudeBoostPx,
    style.minimumMinorDiameterPx,
    Math.min(style.maximumMinorDiameterPx, shapeWidthPx),
  )
  let shapeRotationRad = majorSegment?.rotationRad ?? degreesToRadians(fallbackDimensions.rotationDeg)

  if (shapeHeightPx > shapeWidthPx) {
    const swappedWidthPx = shapeHeightPx
    shapeHeightPx = shapeWidthPx
    shapeWidthPx = swappedWidthPx
    shapeRotationRad += Math.PI * 0.5
  }

  if (Math.abs(shapeWidthPx - shapeHeightPx) < 0.35 || Math.abs(axes.majorAxis - axes.minorAxis) < 0.01) {
    shapeRotationRad = 0
  }

  return {
    markerRadiusPx: shapeWidthPx * 0.5,
    shapeWidthPx,
    shapeHeightPx,
    shapeRotationRad: normalizeRotationRad(shapeRotationRad),
  }
}

function getMarkerRadiusPx(
  object: SkyEngineSceneObject,
  view: SkyProjectionView,
  visualCalibration: SkyEngineVisualCalibration,
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
    return getDeepSkyMarkerRadiusPx(object, scale)
  }

  const profile = starProfile ?? getStarRenderProfile(object, visualCalibration)
  const starBase = Math.max(profile.coreRadiusPx * 1.1, profile.haloRadiusPx * 0.32, profile.diameter * 7.4)
  return clamp(starBase, 0.85, 7.6) * clamp(visualCalibration.starFieldBrightness * 1.02, 0.4, 1.08)
}

function getPickRadiusPx(object: SkyEngineSceneObject, markerRadiusPx: number, shapeWidthPx?: number, shapeHeightPx?: number) {
  const shapeRadiusPx = Math.max(shapeWidthPx ?? markerRadiusPx * 2, shapeHeightPx ?? markerRadiusPx * 2) * 0.5

  return Math.max(
    Math.max(object.type === 'moon' ? 36 : 0, shapeRadiusPx + 14),
    markerRadiusPx + 14,
  )
}

export function ensureSceneSurfaces(runtime: {
  engine: { getRenderWidth: () => number; getRenderHeight: () => number }
  backgroundCanvas: HTMLCanvasElement
  camera: {
    orthoLeft: number | null
    orthoRight: number | null
    orthoTop: number | null
    orthoBottom: number | null
  }
}) {
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

  return { width, height }
}

export function collectProjectedStars(
  view: SkyProjectionView,
  observer: SkyEngineObserver,
  objects: readonly SkyEngineSceneObject[],
  scenePacket: SkyScenePacket | null,
  sunState: SkyEngineSunState,
  brightnessExposureState: SkyBrightnessExposureState,
  selectedObjectId: string | null,
  sceneTimestampIso: string | undefined,
): ProjectedStarsResult {
  const totalStartMs = performance.now()
  let transformMs = 0
  let magnitudeFilterMs = 0
  let visibilityFilterMs = 0
  let sortingMs = 0
  let allocationMs = 0
  const fovDegrees = getSkyEngineFovDegrees(view.fovRadians)
  const centerAltitudeDeg = directionToHorizontal(view.centerDirection).altitudeDeg
  const limitingMagnitude = brightnessExposureState.limitingMagnitude
  const projectedStarDensityCap = getProjectedStarDensityCap(fovDegrees)
  const objectLookup = new Map(objects.map((object) => [object.id, object]))
  const projectedStars: ProjectedSceneObjectEntry[] = []
  const orderedStars = getOrderedStarsByMagnitude(objects)
  const projectedStarIndexById = new Map<string, number>()

  for (let index = 0; index < orderedStars.length; index += 1) {
    const object = orderedStars[index]
    if (!shouldRenderObject(object, centerAltitudeDeg, fovDegrees, sunState, selectedObjectId)) {
      continue
    }

    if (
      object.id !== selectedObjectId &&
      projectedStars.length >= projectedStarDensityCap
    ) {
      break
    }

    const magnitudeStartMs = performance.now()
    if (object.id !== selectedObjectId && object.magnitude > limitingMagnitude + STAR_MAGNITUDE_BREAK_MARGIN) {
      magnitudeFilterMs += performance.now() - magnitudeStartMs
      break
    }

    const renderedMagnitude = object.magnitude
    const visibilityAlpha = computeVisibilityAlpha(renderedMagnitude, limitingMagnitude)
    magnitudeFilterMs += performance.now() - magnitudeStartMs

    if (object.id !== selectedObjectId && visibilityAlpha <= 0) {
      continue
    }

    const pointVisual = computeStellariumPointVisual(
      renderedMagnitude,
      brightnessExposureState,
      Math.min(view.viewportWidth, view.viewportHeight),
    )

    if (object.id !== selectedObjectId && !pointVisual.visible) {
      break
    }

    const transformStartMs = performance.now()
    const projected = projectDirectionToViewport(horizontalToDirection(object.altitudeDeg, object.azimuthDeg), view)
    transformMs += performance.now() - transformStartMs

    const visibilityProjectionStartMs = performance.now()
    if (!projected || !isProjectedPointVisible(projected, view, 22)) {
      visibilityFilterMs += performance.now() - visibilityProjectionStartMs
      continue
    }
    visibilityFilterMs += performance.now() - visibilityProjectionStartMs

    const visibilityFilterStartMs = performance.now()
    const allocationStartMs = performance.now()
    const starProfile = getStarRenderProfileForMagnitude(
      renderedMagnitude,
      object.colorIndexBV,
      brightnessExposureState.visualCalibration,
      brightnessExposureState,
      Math.min(view.viewportWidth, view.viewportHeight),
      pointVisual,
    )
    const horizonFade = getObjectHorizonFade(object, centerAltitudeDeg, fovDegrees)
    const renderAlpha = clamp(horizonFade * starProfile.alpha, 0, 0.98)

    if (renderAlpha <= 0) {
      allocationMs += performance.now() - allocationStartMs
      visibilityFilterMs += performance.now() - visibilityFilterStartMs
      continue
    }
    const markerRadiusPx = Math.max(
      starProfile?.psfDiameterPx ? starProfile.psfDiameterPx * 0.5 : 0,
      getMarkerRadiusPx(object, view, brightnessExposureState.visualCalibration, starProfile),
    )

    projectedStars.push({
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
    })
    projectedStarIndexById.set(object.id, projectedStars.length - 1)
    allocationMs += performance.now() - allocationStartMs
    visibilityFilterMs += performance.now() - visibilityFilterStartMs
  }

  const packetProjectedObjects: ProjectedSceneObjectEntry[] = []
  ;(scenePacket?.stars ?? []).forEach((packetStar) => {
    const object = objectLookup.get(packetStar.id)

    if (!object) {
      return
    }

    const transformStartMs = performance.now()
    const projected = projectDirectionToViewport(new Vector3(packetStar.x, packetStar.y, packetStar.z), view)
    transformMs += performance.now() - transformStartMs

    const visibilityStartMs = performance.now()
    if (!projected || !isProjectedPointVisible(projected, view, 22)) {
      visibilityFilterMs += performance.now() - visibilityStartMs
      return
    }
    visibilityFilterMs += performance.now() - visibilityStartMs

    const magnitudeStartMs = performance.now()
    const renderedMagnitude = object.magnitude
    const visibilityAlpha = computeVisibilityAlpha(renderedMagnitude, limitingMagnitude)
    magnitudeFilterMs += performance.now() - magnitudeStartMs

    const visibilityFilterStartMs = performance.now()
    if (object.id !== selectedObjectId && visibilityAlpha <= 0) {
      visibilityFilterMs += performance.now() - visibilityFilterStartMs
      return
    }

    const pointVisual = computeStellariumPointVisual(
      renderedMagnitude,
      brightnessExposureState,
      Math.min(view.viewportWidth, view.viewportHeight),
    )

    if (object.id !== selectedObjectId && !pointVisual.visible) {
      visibilityFilterMs += performance.now() - visibilityFilterStartMs
      return
    }

    const allocationStartMs = performance.now()
    const starProfile = getStarRenderProfileForMagnitude(
      renderedMagnitude,
      object.colorIndexBV,
      brightnessExposureState.visualCalibration,
      brightnessExposureState,
      Math.min(view.viewportWidth, view.viewportHeight),
      pointVisual,
    )
    const horizonFade = getObjectHorizonFade(object, centerAltitudeDeg, fovDegrees)
    const renderAlpha = clamp(horizonFade * starProfile.alpha, 0, 0.98)

    if (renderAlpha <= 0) {
      allocationMs += performance.now() - allocationStartMs
      visibilityFilterMs += performance.now() - visibilityFilterStartMs
      return
    }
    const markerRadiusPx = Math.max(
      starProfile?.psfDiameterPx ? starProfile.psfDiameterPx * 0.5 : 0,
      getMarkerRadiusPx(object, view, brightnessExposureState.visualCalibration, starProfile),
    )
    packetProjectedObjects.push({
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
    })
    allocationMs += performance.now() - allocationStartMs
    visibilityFilterMs += performance.now() - visibilityFilterStartMs
  })

  if (packetProjectedObjects.length > 0) {
    const allocationMergeStartMs = performance.now()
    packetProjectedObjects.forEach((entry) => {
      const existingIndex = projectedStarIndexById.get(entry.object.id)
      if (existingIndex === undefined) {
        projectedStars.push(entry)
        projectedStarIndexById.set(entry.object.id, projectedStars.length - 1)
        return
      }

      projectedStars[existingIndex] = entry
    })
    allocationMs += performance.now() - allocationMergeStartMs
  }

  // Preserved for telemetry visibility; in optimized path sorting is intentionally skipped.
  sortingMs += 0

  const totalMs = performance.now() - totalStartMs
  return {
    projectedStars,
    limitingMagnitude,
    timing: {
      transformMs,
      magnitudeFilterMs,
      visibilityFilterMs,
      sortingMs,
      allocationMs,
      totalMs,
    },
  }
}

export function collectProjectedNonStarObjects(
  view: SkyProjectionView,
  objects: readonly SkyEngineSceneObject[],
  sunState: SkyEngineSunState,
  selectedObjectId: string | null,
) : ProjectedNonStarObjectsResult {
  const totalStartMs = performance.now()
  let transformMs = 0
  let filteringMs = 0
  let allocationMs = 0
  const fovDegrees = getSkyEngineFovDegrees(view.fovRadians)
  const centerAltitudeDeg = directionToHorizontal(view.centerDirection).altitudeDeg
  const orderedNonStars = getOrderedNonStarObjects(objects)

  if (orderedNonStars.length === 0) {
    const totalMs = performance.now() - totalStartMs
    return {
      projectedObjects: EMPTY_PROJECTED_OBJECTS,
      timing: {
        transformMs,
        filteringMs,
        allocationMs,
        totalMs,
      },
    }
  }

  const projectedObjects: ProjectedSceneObjectEntry[] = []

  orderedNonStars.forEach((object) => {
    const filteringStartMs = performance.now()
    if (!shouldRenderObject(object, centerAltitudeDeg, fovDegrees, sunState, selectedObjectId)) {
      filteringMs += performance.now() - filteringStartMs
      return
    }
    filteringMs += performance.now() - filteringStartMs

    const transformStartMs = performance.now()
  const centerDirection = horizontalToDirection(object.altitudeDeg, object.azimuthDeg)
  const projected = projectDirectionToViewport(centerDirection, view)
    transformMs += performance.now() - transformStartMs

    const filteringProjectedMs = performance.now()
    if (!projected || !isProjectedPointVisible(projected, view, 22)) {
      filteringMs += performance.now() - filteringProjectedMs
      return
    }
    filteringMs += performance.now() - filteringProjectedMs

    const filteringAlphaMs = performance.now()
    const horizonFade = getObjectHorizonFade(object, centerAltitudeDeg, fovDegrees)
    const renderAlpha = clamp(horizonFade, 0, 1)

    if (renderAlpha <= 0) {
      filteringMs += performance.now() - filteringAlphaMs
      return
    }
    filteringMs += performance.now() - filteringAlphaMs

    const allocationStartMs = performance.now()
    const projectedDsoShape = object.type === 'deep_sky'
      ? getProjectedDsoShape(object, view, centerDirection)
      : null
    const markerRadiusPx = projectedDsoShape?.markerRadiusPx ?? getMarkerRadiusPx(object, view, sunState.visualCalibration)

    projectedObjects.push({
      object,
      screenX: projected.screenX,
      screenY: projected.screenY,
      depth: projected.depth,
      angularDistanceRad: projected.angularDistanceRad,
      markerRadiusPx,
      shapeWidthPx: projectedDsoShape?.shapeWidthPx,
      shapeHeightPx: projectedDsoShape?.shapeHeightPx,
      shapeRotationRad: projectedDsoShape?.shapeRotationRad,
      pickRadiusPx: getPickRadiusPx(object, markerRadiusPx, projectedDsoShape?.shapeWidthPx, projectedDsoShape?.shapeHeightPx),
      renderAlpha,
      renderedMagnitude: object.magnitude,
    })
    allocationMs += performance.now() - allocationStartMs
  })

  const totalMs = performance.now() - totalStartMs
  return {
    projectedObjects,
    timing: {
      transformMs,
      filteringMs,
      allocationMs,
      totalMs,
    },
  }
}

export function mergeProjectedSceneObjects(
  projectedStars: readonly ProjectedSceneObjectEntry[],
  projectedObjects: readonly ProjectedSceneObjectEntry[],
) {
  if (projectedObjects.length === 0) {
    return projectedStars
  }

  if (projectedStars.length === 0) {
    return projectedObjects
  }

  const merged = new Array<ProjectedSceneObjectEntry>(projectedStars.length + projectedObjects.length)
  for (let index = 0; index < projectedStars.length; index += 1) {
    merged[index] = projectedStars[index]
  }
  for (let index = 0; index < projectedObjects.length; index += 1) {
    merged[projectedStars.length + index] = projectedObjects[index]
  }
  return merged
}

export function updateReportedViewState(
  runtime: {
    lastReportedFovTenths: number | null
    lastReportedCenterAltTenths: number | null
    lastReportedCenterAzTenths: number | null
  },
  latest: {
    onViewStateChange?: (viewState: { fovDegrees: number; centerAltDeg: number; centerAzDeg: number }) => void
  },
  currentFovDegrees: number,
  centerDirection: Vector3,
) {
  const currentFovTenths = Math.round(currentFovDegrees * 10)
  const currentCenterAltTenths = Math.round((Math.asin(clamp(centerDirection.y, -1, 1)) * 180 / Math.PI) * 10)
  const currentCenterAzTenths = Math.round((((Math.atan2(centerDirection.x, centerDirection.z) * 180 / Math.PI) + 360) % 360) * 10)

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

  return {
    currentFovDegrees: currentFovTenths / 10,
  }
}
