import { Vector3 } from '@babylonjs/core/Maths/math.vector'

import {
  buildAtmosphericExtinctionContext,
  computeObservedMagnitude,
} from '../../../../atmosphericExtinction'
import { getSkyEngineFovDegrees } from '../../../../observerNavigation'
import type { ProjectedPickTargetEntry } from '../../../../pickTargets'
import {
  directionToHorizontal,
  getProjectionScale,
  horizontalToDirection,
  isProjectedPointVisible,
  projectDirectionToViewport,
  type SkyProjectionView,
} from '../../../../projectionMath'
import { getStarRenderProfile, getStarRenderProfileForMagnitude, type StarRenderProfile } from '../../../../starRenderer'
import { computeVisibilityAlpha, computeVisibilitySizeScale } from '../../../../starVisibility'
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

function isEngineTileSource(source: SkyEngineSceneObject['source']) {
  return source === 'engine_mock_tile' || source === 'engine_hipparcos_tile'
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
  const moonObject = objects.find((object) => object.type === 'moon')

  canvas.setAttribute(
    'data-sky-engine-scene-state',
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
    return object.source === 'temporary_scene_seed' ? 7.2 : 8.4
  }

  const profile = starProfile ?? getStarRenderProfile(object, visualCalibration)
  const starBase = Math.max(profile.coreRadiusPx * 1.1, profile.haloRadiusPx * 0.32, profile.diameter * 7.4)
  return clamp(starBase, 0.85, 7.6) * clamp(visualCalibration.starFieldBrightness * 1.02, 0.4, 1.08)
}

function getPickRadiusPx(object: SkyEngineSceneObject, markerRadiusPx: number) {
  return Math.max(
    Math.max(object.type === 'moon' ? 36 : 0, markerRadiusPx + 14),
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
) {
  const fovDegrees = getSkyEngineFovDegrees(view.fovRadians)
  const centerAltitudeDeg = directionToHorizontal(view.centerDirection).altitudeDeg
  const extinction = buildAtmosphericExtinctionContext(observer, sceneTimestampIso)
  const limitingMagnitude = brightnessExposureState.limitingMagnitude
  const objectLookup = new Map(objects.map((object) => [object.id, object]))
  const projectedObjects = objects.flatMap((object) => {
    if (object.type !== 'star') {
      return []
    }

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
      ? getStarRenderProfileForMagnitude(renderedMagnitude, object.colorIndexBV, brightnessExposureState.visualCalibration)
      : undefined
    const markerRadiusPx = object.type === 'star'
      ? getMarkerRadiusPx(object, view, brightnessExposureState.visualCalibration, starProfile) * computeVisibilitySizeScale(visibilityAlpha)
      : getMarkerRadiusPx(object, view, brightnessExposureState.visualCalibration, starProfile)

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
      ? getStarRenderProfileForMagnitude(renderedMagnitude, object.colorIndexBV, brightnessExposureState.visualCalibration)
      : undefined
    const markerRadiusPx = object.type === 'star'
      ? getMarkerRadiusPx(object, view, brightnessExposureState.visualCalibration, starProfile) * computeVisibilitySizeScale(visibilityAlpha)
      : getMarkerRadiusPx(object, view, brightnessExposureState.visualCalibration, starProfile)

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

  return {
    projectedStars: Array.from(dedupedProjectedObjects.values())
      .sort((left, right) => left.depth - right.depth || (left.renderedMagnitude ?? left.object.magnitude) - (right.renderedMagnitude ?? right.object.magnitude)),
    limitingMagnitude,
  }
}

export function collectProjectedNonStarObjects(
  view: SkyProjectionView,
  objects: readonly SkyEngineSceneObject[],
  sunState: SkyEngineSunState,
  selectedObjectId: string | null,
) {
  const fovDegrees = getSkyEngineFovDegrees(view.fovRadians)
  const centerAltitudeDeg = directionToHorizontal(view.centerDirection).altitudeDeg

  return objects.flatMap((object) => {
    if (object.type === 'star') {
      return []
    }

    if (!shouldRenderObject(object, centerAltitudeDeg, fovDegrees, sunState, selectedObjectId)) {
      return []
    }

    const projected = projectDirectionToViewport(horizontalToDirection(object.altitudeDeg, object.azimuthDeg), view)

    if (!projected || !isProjectedPointVisible(projected, view, 22)) {
      return []
    }

    const horizonFade = getObjectHorizonFade(object, centerAltitudeDeg, fovDegrees)
    const renderAlpha = clamp(horizonFade, 0, 1)

    if (renderAlpha <= 0) {
      return []
    }

    const markerRadiusPx = getMarkerRadiusPx(object, view, sunState.visualCalibration)

    return [{
      object,
      screenX: projected.screenX,
      screenY: projected.screenY,
      depth: projected.depth,
      angularDistanceRad: projected.angularDistanceRad,
      markerRadiusPx,
      pickRadiusPx: getPickRadiusPx(object, markerRadiusPx),
      renderAlpha,
      renderedMagnitude: object.magnitude,
    }]
  })
}

export function mergeProjectedSceneObjects(
  projectedStars: readonly ProjectedSceneObjectEntry[],
  projectedObjects: readonly ProjectedSceneObjectEntry[],
) {
  return [...projectedStars, ...projectedObjects]
    .sort((left, right) => left.depth - right.depth || (left.renderedMagnitude ?? left.object.magnitude) - (right.renderedMagnitude ?? right.object.magnitude))
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
