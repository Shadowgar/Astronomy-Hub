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
  getStarRenderProfileForMagnitude,
  type StarRenderProfile,
} from '../../../../starRenderer'
import { getDeepSkyMarkerDimensionsPx, getDeepSkyProjectionStyle, resolveDeepSkyAxes } from '../../../../dsoVisuals'
import type { SkyScenePacket } from '../..'
import type {
  SkyEngineAidVisibility,
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
  dataMode: 'mock' | 'hipparcos' | 'gaia' | 'multi-survey' | 'loading'
  sourceLabel: string
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

function smoothstep(edge0: number, edge1: number, value: number) {
  if (edge0 === edge1) {
    return value < edge0 ? 0 : 1
  }

  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function mix(start: number, end: number, amount: number) {
  return start + (end - start) * clamp(amount, 0, 1)
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

function isEngineTileSource(source: SkyEngineSceneObject['source']) {
  return source === 'engine_catalog_tile'
}

const STAR_MAGNITUDE_BREAK_MARGIN = 0
const EMPTY_PROJECTED_OBJECTS: readonly ProjectedSceneObjectEntry[] = []
const SATELLITE_UNMODELED_MAGNITUDE_SENTINEL = 90

let cachedNonStarOrderSignature = ''
let cachedNonStarObjects: SkyEngineSceneObject[] = []

interface PlanetRenderSizing {
  readonly markerRadiusPx: number
  readonly modelAlpha: number
  readonly pointLuminance: number
}

function getObjectOrderSignature(objects: readonly SkyEngineSceneObject[]) {
  const first = objects[0]?.id ?? 'none'
  const [lastObject] = objects.slice(-1)
  const last = lastObject?.id ?? 'none'
  return `${objects.length}:${first}:${last}`
}

function getPlanetRenderSizing(
  object: SkyEngineSceneObject,
  view: SkyProjectionView,
  brightnessExposureState: SkyBrightnessExposureState | undefined,
  fovDegrees: number,
) : PlanetRenderSizing {
  const scale = getProjectionScale(view)
  const viewportMinSizePx = Math.max(1, Math.min(view.viewportWidth, view.viewportHeight))
  const pointVisual = computeStellariumPointVisual(object.magnitude, brightnessExposureState, viewportMinSizePx, fovDegrees)
  const pointRadiusPx = pointVisual.radiusPx
  const pointAngularRadius = getApparentAngleForPointRadius(scale, pointRadiusPx * 2)
  const angularDiameterRad = degreesToRadians(object.apparentSizeDeg ?? 0)
  const moonArtificialScale = getMoonArtificialScale(object, fovDegrees, viewportMinSizePx)
  const modelScale = object.type === 'moon' ? 4 : 2
  const scaledAngularDiameter = angularDiameterRad * moonArtificialScale
  let modelAlpha = 0

  if (scaledAngularDiameter > 0 && modelScale * scaledAngularDiameter >= pointAngularRadius) {
    modelAlpha = smoothstep(1, 0.5, pointAngularRadius / Math.max(modelScale * scaledAngularDiameter, 1e-8))
  }

  if (object.type === 'moon') {
    modelAlpha = 1
  }

  const discRadiusPx = getPointRadiusForApparentAngle(scale, scaledAngularDiameter * 0.5)
  return {
    markerRadiusPx: pointRadiusPx * (1 - modelAlpha) + discRadiusPx * modelAlpha,
    modelAlpha,
    pointLuminance: pointVisual.luminance,
  }
}

function resolveDsoLodBounds(
  style: ReturnType<typeof getDeepSkyProjectionStyle>,
  fovDegrees: number,
) {
  const closeBlend = 1 - smoothstep(12, 78, fovDegrees)

  return {
    minimumMajorDiameterPx: mix(style.minimumMajorDiameterPx * 0.42, style.minimumMajorDiameterPx * 0.98, closeBlend),
    minimumMinorDiameterPx: mix(style.minimumMinorDiameterPx * 0.42, style.minimumMinorDiameterPx * 0.98, closeBlend),
    maximumMajorDiameterPx: mix(style.maximumMajorDiameterPx * 0.72, style.maximumMajorDiameterPx * 1.56, closeBlend),
    maximumMinorDiameterPx: mix(style.maximumMinorDiameterPx * 0.72, style.maximumMinorDiameterPx * 1.56, closeBlend),
    magnitudeBoostScale: mix(0.84, 1.26, closeBlend),
  }
}

function getOrderedNonStarObjects(objects: readonly SkyEngineSceneObject[]) {
  const signature = getObjectOrderSignature(objects)
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
  dataMode,
  sourceLabel,
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
  canvas.dataset.skyEngineSceneState = serializeSceneState({
    backendStarCount,
    objects,
    dataMode,
    sourceLabel,
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
  })
}

export function serializeSceneState({
  backendStarCount,
  objects,
  dataMode,
  sourceLabel,
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
    dataMode,
    sourceLabel,
    labelCap,
    aidVisibility,
    currentFovDegrees,
    currentLodTier,
    groundTextureMode,
    groundTextureAssetPath,
  })
}

export function clearSceneState(canvas: HTMLCanvasElement) {
  delete canvas.dataset.skyEngineSceneState
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
  if (object.type !== 'star' && isEngineTileSource(object.source)) {
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

function getApparentAngleForPointRadius(scale: number, radiusPx: number) {
  const planeRadius = radiusPx / Math.max(scale, 1e-6)
  return 2 * Math.atan(planeRadius / 2)
}

function getPointRadiusForApparentAngle(scale: number, angularRadiusRad: number) {
  const planeRadius = 2 * Math.tan(Math.max(0, angularRadiusRad) / 2)
  return Math.max(0, planeRadius * scale)
}

function getMoonArtificialScale(object: SkyEngineSceneObject, fovDegrees: number, viewportMinSizePx: number) {
  if (object.type !== 'moon') {
    return 1
  }

  const angularDiameterRad = degreesToRadians(object.apparentSizeDeg ?? 0)
  if (angularDiameterRad <= 0) {
    return 1
  }

  const moonAngularDiameterFromEarth = degreesToRadians(0.55)
  const starScaleScreenFactor = clamp(viewportMinSizePx / 600, 0.7, 1.5)
  let scale = degreesToRadians(fovDegrees) / degreesToRadians(20)

  scale /= angularDiameterRad / moonAngularDiameterFromEarth
  scale /= starScaleScreenFactor
  return Math.max(1, scale)
}

function getDeepSkyMarkerRadiusPx(object: SkyEngineSceneObject, scale: number, fovDegrees: number) {
  const style = getDeepSkyProjectionStyle(object)
  const lodBounds = resolveDsoLodBounds(style, fovDegrees)
  const axes = resolveDeepSkyAxes(object)
  const projectedRadiusPx = getProjectedDiscRadiusPx(
    axes.majorAxis,
    scale,
    lodBounds.minimumMajorDiameterPx * 0.5,
    lodBounds.maximumMajorDiameterPx * 0.5,
  )
  const magnitudeBoostPx = clamp(
    (1.7 - object.magnitude * 0.12) * lodBounds.magnitudeBoostScale,
    0.2,
    style.projectionMagnitudeBoostPx * lodBounds.magnitudeBoostScale,
  )

  return clamp(
    projectedRadiusPx + magnitudeBoostPx,
    lodBounds.minimumMajorDiameterPx * 0.5,
    lodBounds.maximumMajorDiameterPx * 0.5,
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
  fovDegrees: number,
) {
  const style = getDeepSkyProjectionStyle(object)
  const lodBounds = resolveDsoLodBounds(style, fovDegrees)
  const axes = resolveDeepSkyAxes(object)
  const fallbackRadiusPx = getDeepSkyMarkerRadiusPx(object, getProjectionScale(view), fovDegrees)
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
    (1.7 - object.magnitude * 0.12) * lodBounds.magnitudeBoostScale,
    0.2,
    style.projectionMagnitudeBoostPx * lodBounds.magnitudeBoostScale,
  ) * 2

  let shapeWidthPx = clamp(
    Math.max(majorSegment?.lengthPx ?? fallbackDimensions.widthPx, lodBounds.minimumMajorDiameterPx) + magnitudeBoostPx,
    lodBounds.minimumMajorDiameterPx,
    lodBounds.maximumMajorDiameterPx,
  )
  let shapeHeightPx = clamp(
    Math.max(minorSegment?.lengthPx ?? fallbackDimensions.heightPx, lodBounds.minimumMinorDiameterPx) + magnitudeBoostPx,
    lodBounds.minimumMinorDiameterPx,
    Math.min(lodBounds.maximumMinorDiameterPx, shapeWidthPx),
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
  _visualCalibration: SkyEngineVisualCalibration,
  fovDegrees: number,
  brightnessExposureState?: SkyBrightnessExposureState,
  starProfile?: StarRenderProfile,
) {
  const scale = getProjectionScale(view)

  if (object.type === 'moon' || object.type === 'planet') {
    return getPlanetRenderSizing(object, view, brightnessExposureState, fovDegrees).markerRadiusPx
  }

  if (object.type === 'satellite') {
    return 5.2
  }

  if (object.type === 'minor_planet') {
    return 3.6
  }

  if (object.type === 'comet') {
    return 4.6
  }

  if (object.type === 'meteor_shower') {
    return 4.2
  }

  if (object.type === 'deep_sky') {
    return getDeepSkyMarkerRadiusPx(object, scale, fovDegrees)
  }

  return clamp(starProfile?.coreRadiusPx ?? 0, 0, 50)
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

type CollectProjectedStarsInput = {
  view: SkyProjectionView
  objects: readonly SkyEngineSceneObject[]
  scenePacket: SkyScenePacket | null
  sunState: SkyEngineSunState
  brightnessExposureState: SkyBrightnessExposureState
}

type ProjectedStarAttempt = {
  entry: ProjectedSceneObjectEntry | null
  shouldBreak: boolean
  transformMs: number
  magnitudeFilterMs: number
  visibilityFilterMs: number
  allocationMs: number
  lastMagnitude: number
  lastPointVisual: ReturnType<typeof computeStellariumPointVisual> | null
}

type ProjectedStarVisualState = {
  lastMagnitude: number
  lastPointVisual: ReturnType<typeof computeStellariumPointVisual> | null
}

function projectScenePacketStar(
  packetStar: SkyScenePacket['stars'][number],
  object: SkyEngineSceneObject,
  input: CollectProjectedStarsInput,
  centerAltitudeDeg: number,
  fovDegrees: number,
  viewportMinSizePx: number,
  visualState: ProjectedStarVisualState,
): ProjectedStarAttempt {
  let transformMs = 0
  let magnitudeFilterMs = 0
  let visibilityFilterMs = 0
  let allocationMs = 0
  let { lastMagnitude, lastPointVisual } = visualState

  if (!shouldRenderObject(object, centerAltitudeDeg, fovDegrees, input.sunState, null)) {
    return { entry: null, shouldBreak: false, transformMs, magnitudeFilterMs, visibilityFilterMs, allocationMs, lastMagnitude, lastPointVisual }
  }

  const magnitudeStartMs = performance.now()
  const renderedMagnitude = packetStar.mag
  if (renderedMagnitude > input.brightnessExposureState.limitingMagnitude + STAR_MAGNITUDE_BREAK_MARGIN) {
    magnitudeFilterMs += performance.now() - magnitudeStartMs
    return { entry: null, shouldBreak: true, transformMs, magnitudeFilterMs, visibilityFilterMs, allocationMs, lastMagnitude, lastPointVisual }
  }
  if (renderedMagnitude !== lastMagnitude || lastPointVisual == null) {
    lastMagnitude = renderedMagnitude
    lastPointVisual = computeStellariumPointVisual(
      renderedMagnitude,
      input.brightnessExposureState,
      viewportMinSizePx,
      fovDegrees,
    )
  }
  const pointVisual = lastPointVisual
  magnitudeFilterMs += performance.now() - magnitudeStartMs

  if (!pointVisual.visible || pointVisual.luminance <= 0) {
    return { entry: null, shouldBreak: false, transformMs, magnitudeFilterMs, visibilityFilterMs, allocationMs, lastMagnitude, lastPointVisual }
  }

  const transformStartMs = performance.now()
  const projected = projectDirectionToViewport(new Vector3(packetStar.x, packetStar.y, packetStar.z), input.view)
  transformMs += performance.now() - transformStartMs

  const visibilityStartMs = performance.now()
  if (!projected || !isProjectedPointVisible(projected, input.view, 22)) {
    visibilityFilterMs += performance.now() - visibilityStartMs
    return { entry: null, shouldBreak: false, transformMs, magnitudeFilterMs, visibilityFilterMs, allocationMs, lastMagnitude, lastPointVisual }
  }
  visibilityFilterMs += performance.now() - visibilityStartMs

  const visibilityFilterStartMs = performance.now()
  const allocationStartMs = performance.now()
  const starProfile = getStarRenderProfileForMagnitude(
    renderedMagnitude,
    object.colorIndexBV,
    input.brightnessExposureState.visualCalibration,
    input.brightnessExposureState,
    viewportMinSizePx,
    pointVisual,
  )
  const renderAlpha = clamp(getObjectHorizonFade(object, centerAltitudeDeg, fovDegrees) * pointVisual.luminance, 0, 1)

  if (renderAlpha <= 0) {
    allocationMs += performance.now() - allocationStartMs
    visibilityFilterMs += performance.now() - visibilityFilterStartMs
    return { entry: null, shouldBreak: false, transformMs, magnitudeFilterMs, visibilityFilterMs, allocationMs, lastMagnitude, lastPointVisual }
  }

  const entry = {
    object,
    screenX: projected.screenX,
    screenY: projected.screenY,
    depth: projected.depth,
    angularDistanceRad: projected.angularDistanceRad,
    markerRadiusPx: pointVisual.radiusPx,
    pickRadiusPx: getPickRadiusPx(object, pointVisual.radiusPx),
    renderAlpha,
    renderedMagnitude,
    visibilityAlpha: pointVisual.luminance,
    starProfile,
  } satisfies ProjectedSceneObjectEntry
  allocationMs += performance.now() - allocationStartMs
  visibilityFilterMs += performance.now() - visibilityFilterStartMs
  return { entry, shouldBreak: false, transformMs, magnitudeFilterMs, visibilityFilterMs, allocationMs, lastMagnitude, lastPointVisual }
}

export function collectProjectedStars(input: CollectProjectedStarsInput): ProjectedStarsResult {
  const totalStartMs = performance.now()
  let transformMs = 0
  let magnitudeFilterMs = 0
  let visibilityFilterMs = 0
  let sortingMs = 0
  let allocationMs = 0
  const fovDegrees = getSkyEngineFovDegrees(input.view.fovRadians)
  const centerAltitudeDeg = directionToHorizontal(input.view.centerDirection).altitudeDeg
  const limitingMagnitude = input.brightnessExposureState.limitingMagnitude
  const objectLookup = new Map(input.objects.map((object) => [object.id, object]))
  const projectedStars: ProjectedSceneObjectEntry[] = []
  const viewportMinSizePx = Math.min(input.view.viewportWidth, input.view.viewportHeight)
  let lastMagnitude = Number.NaN
  let lastPointVisual = null as ReturnType<typeof computeStellariumPointVisual> | null

  for (const packetStar of input.scenePacket?.stars ?? []) {
    const object = objectLookup.get(packetStar.id)

    if (!object) {
      continue
    }

    const attempt = projectScenePacketStar(
      packetStar,
      object,
      input,
      centerAltitudeDeg,
      fovDegrees,
      viewportMinSizePx,
      { lastMagnitude, lastPointVisual },
    )
    transformMs += attempt.transformMs
    magnitudeFilterMs += attempt.magnitudeFilterMs
    visibilityFilterMs += attempt.visibilityFilterMs
    allocationMs += attempt.allocationMs
    lastMagnitude = attempt.lastMagnitude
    lastPointVisual = attempt.lastPointVisual

    if (attempt.entry) {
      projectedStars.push(attempt.entry)
    }
    if (attempt.shouldBreak) {
      break
    }
  }

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
  brightnessExposureState: SkyBrightnessExposureState | undefined,
  limitingMagnitude: number,
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

    if (object.type === 'planet' && object.magnitude > limitingMagnitude) {
      filteringMs += performance.now() - filteringStartMs
      return
    }

    if ((object.type === 'minor_planet' || object.type === 'comet') && object.magnitude > limitingMagnitude) {
      filteringMs += performance.now() - filteringStartMs
      return
    }

    // Stellarium painter gating: deep-sky objects obey visibility magnitude limits
    // produced upstream by core_render + exposure state before projection/render.
    if (object.type === 'deep_sky' && object.magnitude > limitingMagnitude) {
      filteringMs += performance.now() - filteringStartMs
      return
    }

    // Satellites currently carry placeholder magnitude when photometry is not modeled.
    // Only apply magnitude gate when a modeled value is present.
    if (
      object.type === 'satellite' &&
      object.magnitude < SATELLITE_UNMODELED_MAGNITUDE_SENTINEL &&
      object.magnitude > limitingMagnitude
    ) {
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
    const planetSizing = (object.type === 'planet' || object.type === 'moon')
      ? getPlanetRenderSizing(object, view, brightnessExposureState, fovDegrees)
      : null
    const planetAlpha = planetSizing
      ? planetSizing.pointLuminance * (1 - planetSizing.modelAlpha) + planetSizing.modelAlpha
      : 1
    const renderAlpha = clamp(horizonFade * Math.max(planetAlpha, 0.04), 0, 1)

    if (renderAlpha <= 0) {
      filteringMs += performance.now() - filteringAlphaMs
      return
    }
    filteringMs += performance.now() - filteringAlphaMs

    const allocationStartMs = performance.now()
    const projectedDsoShape = object.type === 'deep_sky'
      ? getProjectedDsoShape(object, view, centerDirection, fovDegrees)
      : null
    const markerRadiusPx = projectedDsoShape?.markerRadiusPx
      ?? planetSizing?.markerRadiusPx
      ?? getMarkerRadiusPx(object, view, sunState.visualCalibration, fovDegrees, brightnessExposureState)

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
