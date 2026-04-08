import { Camera } from '@babylonjs/core/Cameras/camera'
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Scene } from '@babylonjs/core/scene'

import {
  getSkyEngineFovDegrees,
  stabilizeSkyEngineCenterDirection,
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
  type SkyProjectionView,
} from './projectionMath'
import {
  buildAtmosphericExtinctionContext,
  computeObservedMagnitude,
} from './atmosphericExtinction'
import { computeEffectiveLimitingMagnitude, computeSkyBrightness } from './skyBrightness'
import { computeVisibilityAlpha, computeVisibilitySizeScale } from './starVisibility'
import { getStarRenderProfile, getStarRenderProfileForMagnitude } from './starRenderer'
import { buildSyntheticSkyDensityField } from './syntheticStarField'
import { createDirectObjectLayer, type DirectProjectedObjectEntry } from './directObjectLayer'
import { createDirectBackgroundLayer, prepareDirectBackgroundFrame } from './directBackgroundLayer'
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
import type { SkyModule } from './engine/sky/runtime/SkyModule'
import { SkyClockService } from './engine/sky/runtime/SkyClockService'
import { SkyInputService } from './engine/sky/runtime/SkyInputService'
import { SkyNavigationService } from './engine/sky/runtime/SkyNavigationService'
import { SkyObserverService } from './engine/sky/runtime/SkyObserverService'
import { SkyProjectionService } from './engine/sky/runtime/SkyProjectionService'

export interface SkyEngineSceneProps {
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

export interface ScenePropsSnapshot extends SkyEngineSceneProps {}

export interface SceneRuntimeRefs {
  scene: Scene
  engine: Engine
  camera: UniversalCamera
  canvas: HTMLCanvasElement
  backgroundCanvas: HTMLCanvasElement
  directBackgroundLayer: ReturnType<typeof createDirectBackgroundLayer>
  directObjectLayer: ReturnType<typeof createDirectObjectLayer>
  directOverlayLayer: ReturnType<typeof createDirectOverlayLayer>
  projectedPickEntries: ProjectedPickTargetEntry[]
  lastReportedFovTenths: number | null
  lastReportedCenterAltTenths: number | null
  lastReportedCenterAzTenths: number | null
}

export interface SkySceneRuntimeServices {
  readonly observerService: SkyObserverService
  readonly navigationService: SkyNavigationService
  readonly projectionService: SkyProjectionService
  readonly inputService: SkyInputService<ScenePropsSnapshot>
  readonly clockService: SkyClockService
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
export const DENSITY_STARS_CANVAS_FALLBACK = 'density-stars-canvas-fallback'
const SYNTHETIC_SKY_DENSITY_SAMPLES = buildSyntheticSkyDensityField(2800)
const SYNTHETIC_STAR_OVERLAP_CELL_PX = 24

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

export function clearSceneState(canvas: HTMLCanvasElement) {
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
  animationTime: number,
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

function collectProjectedObjects(
  view: SkyProjectionView,
  observer: SkyEngineObserver,
  objects: readonly SkyEngineSceneObject[],
  scenePacket: SkyScenePacket | null,
  sunState: SkyEngineSunState,
  selectedObjectId: string | null,
  sceneTimestampIso: string | undefined,
) {
  const fovDegrees = getSkyEngineFovDegrees(view.fovRadians)
  const centerAltitudeDeg = directionToHorizontal(view.centerDirection).altitudeDeg
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

function syncDirectObjectLayer(
  runtime: SceneRuntimeRefs,
  services: SkySceneRuntimeServices,
  projectedObjects: readonly ProjectedSceneObjectEntry[],
  latest: ScenePropsSnapshot,
  width: number,
  height: number,
) {
  runtime.directObjectLayer.sync(
    projectedObjects,
    width,
    height,
    latest.sunState,
    latest.selectedObjectId,
    services.clockService.getAnimationTimeSeconds(),
  )
}

export function renderSceneFrame(runtime: SceneRuntimeRefs, services: SkySceneRuntimeServices, latest: ScenePropsSnapshot) {
  const { width, height } = ensureSceneSurfaces(runtime)
  const backgroundContext = runtime.backgroundCanvas.getContext('2d') as CanvasRenderingContext2D
  services.projectionService.syncViewport(width, height)
  const view: SkyProjectionView = services.projectionService.createView(
    services.navigationService.getCenterDirection(),
  )
  const currentFovDegrees = services.projectionService.getCurrentFovDegrees()
  const sceneTimestampIso = services.clockService.getSceneTimestampIso()
  const lod = resolveViewTier(currentFovDegrees)
  const centerAltitudeDeg = directionToHorizontal(view.centerDirection).altitudeDeg
  const { projectedObjects, limitingMagnitude } = collectProjectedObjects(
    view,
    services.observerService.getObserver(),
    latest.objects,
    latest.scenePacket,
    latest.sunState,
    latest.selectedObjectId,
    sceneTimestampIso,
  )

  backgroundContext.clearRect(0, 0, width, height)
  const backgroundFrame = prepareDirectBackgroundFrame(view, latest.sunState, currentFovDegrees)
  runtime.directBackgroundLayer.sync(backgroundFrame)
  drawSyntheticDensityStars(
    backgroundContext,
    view,
    projectedObjects,
    latest.sunState,
    services.observerService.getObserver(),
    sceneTimestampIso,
    limitingMagnitude,
    services.clockService.getAnimationTimeSeconds(),
  )

  syncDirectObjectLayer(runtime, services, projectedObjects, latest, width, height)
  const overlayFrame = prepareDirectOverlayFrame(
    view,
    services.observerService.getObserver(),
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
    currentFovDegrees,
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

export function createSceneRuntimeState({
  canvas,
  backgroundCanvas,
}: {
  canvas: HTMLCanvasElement
  backgroundCanvas: HTMLCanvasElement
}) {
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

  return {
    scene,
    engine,
    camera,
    canvas,
    backgroundCanvas,
    directBackgroundLayer: createDirectBackgroundLayer(scene),
    directObjectLayer: createDirectObjectLayer(scene),
    directOverlayLayer: createDirectOverlayLayer(scene),
    projectedPickEntries: [],
    lastReportedFovTenths: null,
    lastReportedCenterAltTenths: null,
    lastReportedCenterAzTenths: null,
  } satisfies SceneRuntimeRefs
}

export function createSkySceneRuntimeServices(initialProps: ScenePropsSnapshot): SkySceneRuntimeServices {
  return {
    observerService: new SkyObserverService(initialProps.observer),
    navigationService: new SkyNavigationService({
      initialCenterDirection: stabilizeSkyEngineCenterDirection(
        horizontalToDirection(
          initialProps.initialViewState.centerAltDeg,
          initialProps.initialViewState.centerAzDeg,
        ),
      ),
      initialSelectedObjectId: initialProps.selectedObjectId,
    }),
    projectionService: new SkyProjectionService({
      initialProjectionMode: initialProps.projectionMode,
      initialFovDegrees: initialProps.initialViewState.fovDegrees,
    }),
    inputService: new SkyInputService(),
    clockService: new SkyClockService(),
  }
}

export function syncSkySceneRuntimeServices(services: SkySceneRuntimeServices, props: ScenePropsSnapshot) {
  services.observerService.syncObserver(props.observer)
  services.projectionService.syncProjectionMode(props.projectionMode)
  services.clockService.syncSceneTimestampFromObjects(props.objects)
}

function updateReportedViewState(runtime: SceneRuntimeRefs, latest: ScenePropsSnapshot, services: SkySceneRuntimeServices) {
  const currentFovTenths = Math.round(services.projectionService.getCurrentFovDegrees() * 10)
  const centerHorizontal = directionToHorizontal(services.navigationService.getCenterDirection())
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

  return {
    currentFovDegrees: currentFovTenths / 10,
  }
}

export function createSkySceneBridgeModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-scene-runtime-bridge',
    renderOrder: 100,
    start({ getProps }) {
      getProps().onAtmosphereStatusChange({
        mode: 'fallback',
        message: 'Direct Babylon background, object, aid, trajectory, and label rendering is active with a bounded density-star canvas fallback.',
      })
    },
    update({ runtime, services, getProps, deltaSeconds, markFrameDirty }) {
      const latest = getProps()
      services.navigationService.syncSelection(
        latest.objects,
        latest.selectedObjectId,
        services.projectionService,
      )
      const navigationChanged = services.navigationService.update(
        deltaSeconds,
        services.projectionService,
      )

      if (navigationChanged) {
        markFrameDirty()
      }
    },
    render({ runtime, services, getProps }) {
      const latest = getProps()
      const frame = renderSceneFrame(runtime, services, latest)
      const { currentFovDegrees } = updateReportedViewState(runtime, latest, services)

      writeSceneState({
        backendStarCount: latest.backendStars.length,
        canvas: runtime.canvas,
        objects: latest.objects,
        selectedObjectId: latest.selectedObjectId,
        trajectoryObjectId: frame.trajectoryObjectId,
        visibleLabelIds: frame.visibleLabelIds,
        guidedObjectIds: latest.guidedObjectIds,
        aidVisibility: latest.aidVisibility,
        currentFovDegrees,
        currentLodTier: frame.lod.tier,
        labelCap: frame.lod.labelCap,
        groundTextureMode: 'direct-babylon-background-object-and-overlay-layer',
        groundTextureAssetPath: `direct Babylon backdrop, glare, horizon blocking, objects, and overlays with ${DENSITY_STARS_CANVAS_FALLBACK}`,
      })

      writeSkyEnginePickTargets(runtime.canvas, buildSkyEnginePickTargets(runtime.projectedPickEntries))
    },
    dispose({ runtime }) {
      clearSkyEnginePickTargets(runtime.canvas)
      clearSceneState(runtime.canvas)
      runtime.directBackgroundLayer.dispose()
      runtime.directObjectLayer.dispose()
      runtime.directOverlayLayer.dispose()
    },
  }
}
