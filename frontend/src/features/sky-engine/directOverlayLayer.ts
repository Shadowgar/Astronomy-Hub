import type { Camera } from '@babylonjs/core/Cameras/camera'
import type { Engine } from '@babylonjs/core/Engines/engine'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import type { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import type { LinesMesh } from '@babylonjs/core/Meshes/linesMesh'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import type { Scene } from '@babylonjs/core/scene'

import { computeHorizontalCoordinates } from './astronomy'
import { getSkyEngineSkyCulture } from './constellations'
import { type SkyScenePacket } from './engine/sky'
import {
  buildLabelTexture,
  getLabelVariantForObject,
  resolveLabelLayout,
  reusePreviousLabelLayout,
  type LabelLayoutState,
  type LabelRenderRef,
  type LabelVariant,
} from './labelManager'
import {
  directionToHorizontal,
  isProjectedPointVisible,
  projectHorizontalToViewport,
  unprojectViewportPoint,
  type SkyProjectionView,
} from './projectionMath'
import { horizontalToRaDec } from './engine/sky/transforms/coordinates'
import type { SkyEngineAidVisibility, SkyEngineObserver, SkyEngineSceneObject, SkyEngineSunState } from './types'

interface OverlayProjectedObjectEntry {
  readonly object: SkyEngineSceneObject
  readonly screenX: number
  readonly screenY: number
  readonly depth: number
  readonly markerRadiusPx: number
}

interface OverlayLineEntry {
  readonly id: string
  readonly points: Vector3[]
  readonly colorHex: string
  readonly alpha: number
}

interface OverlayCardinalEntry {
  readonly id: string
  readonly text: string
  readonly screenX: number
  readonly screenY: number
}

interface OverlayLabelEntry {
  readonly id: string
  readonly anchorObjectId: string
  readonly object: SkyEngineSceneObject
  readonly text: string
}

export interface PreparedDirectOverlayFrame {
  readonly lines: readonly OverlayLineEntry[]
  readonly cardinals: readonly OverlayCardinalEntry[]
  readonly labels: readonly OverlayLabelEntry[]
  readonly trajectoryObjectId: string | null
}

interface LabelMeshEntry {
  readonly label: Mesh
  readonly labelMaterial: StandardMaterial
  object: SkyEngineSceneObject
  currentLabelAlpha: number
  currentLabelScale: number
  texture: DynamicTexture
  signature: string
}

interface CardinalMeshEntry {
  readonly mesh: Mesh
  readonly material: StandardMaterial
  readonly texture: DynamicTexture
}

const STELLARIUM_AZIMUTHAL_GRID_COLOR_HEX = '#6c4329'
const STELLARIUM_AZIMUTHAL_GRID_ALPHA = 1
const STELLARIUM_AZIMUTHAL_GRID_DIVISIONS = 6
const STELLARIUM_AZIMUTHAL_GRID_MAX_STEP_DEG = 15
const STELLARIUM_AZIMUTHAL_GRID_SAMPLE_MARGIN_PX = 24
const STELLARIUM_AZIMUTHAL_FOV_SAMPLE_GRID_SIZE = 3
const STELLARIUM_AZIMUTH_STEPS_DEG = [15, 5, 1] as const
const STELLARIUM_ALTITUDE_STEPS_DEG = [20, 10, 5, 1] as const
const STELLARIUM_EQUATORIAL_GRID_COLOR_HEX = '#2a81ad'
const STELLARIUM_EQUATORIAL_GRID_ALPHA = 0.38
const STELLARIUM_RIGHT_ASCENSION_STEPS_DEG = [15, 5, 2.5, 1.25, 0.25] as const
const STELLARIUM_DECLINATION_STEPS_DEG = [20, 10, 5, 1] as const
const STELLARIUM_EQUATORIAL_RIGHT_ASCENSION_MAJOR_STEPS_DEG = [60, 30, 15, 5, 2.5, 1.25, 0.25] as const
const STELLARIUM_EQUATORIAL_DECLINATION_MAJOR_STEPS_DEG = [45, 30, 20, 10, 5, 1] as const
const STELLARIUM_EQUATORIAL_MAX_RIGHT_ASCENSION_LINES = 8
const STELLARIUM_EQUATORIAL_MAX_DECLINATION_LINES = 7

const LABEL_RELAYOUT_MOTION_PX = 18
const LABEL_RELAYOUT_DEPTH_DELTA = 0.06
const LABEL_RELAYOUT_FOV_DELTA_DEG = 6

interface CachedLabelTextureEntry {
  readonly texture: DynamicTexture
  references: number
}

interface OverlayLabelProjectionSnapshot {
  readonly screenX: number
  readonly screenY: number
  readonly depth: number
  readonly markerRadiusPx: number
  readonly signature: string
  readonly occluded: boolean
}

interface LabelLayoutFrameState {
  readonly visibleLabelIds: readonly string[]
  readonly layoutState: ReadonlyMap<string, LabelLayoutState>
  readonly projectionState: ReadonlyMap<string, OverlayLabelProjectionSnapshot>
  readonly fovDegrees: number
  readonly labelCap: number
  readonly selectedObjectId: string | null
  readonly guidedSignature: string
  readonly viewportWidth: number
  readonly viewportHeight: number
}

function isEngineTileSource(source: SkyEngineSceneObject['source']) {
  return source === 'engine_mock_tile' || source === 'engine_catalog_tile'
}

function toViewportPlanePosition(screenX: number, screenY: number, viewportWidth: number, viewportHeight: number, depth = 0.02) {
  return new Vector3(
    screenX - viewportWidth * 0.5,
    viewportHeight * 0.5 - screenY,
    depth,
  )
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function wrapDegrees(value: number) {
  return ((value % 360) + 360) % 360
}

function getSignedAngleDeltaDegrees(value: number, center: number) {
  return ((value - center + 540) % 360) - 180
}

interface AzimuthalViewportRange {
  readonly centerAzimuthDeg: number
  readonly centerAltitudeDeg: number
  readonly azimuthMinOffsetDeg: number
  readonly azimuthMaxOffsetDeg: number
  readonly altitudeMinOffsetDeg: number
  readonly altitudeMaxOffsetDeg: number
  readonly azimuthFovDeg: number
  readonly altitudeFovDeg: number
}

interface EquatorialViewportRange {
  readonly centerRightAscensionDeg: number
  readonly centerDeclinationDeg: number
  readonly rightAscensionMinOffsetDeg: number
  readonly rightAscensionMaxOffsetDeg: number
  readonly declinationMinOffsetDeg: number
  readonly declinationMaxOffsetDeg: number
  readonly rightAscensionFovDeg: number
  readonly declinationFovDeg: number
}

function estimateAzimuthalViewportRange(view: SkyProjectionView): AzimuthalViewportRange {
  const centerHorizontal = directionToHorizontal(view.centerDirection)
  let azimuthMinOffsetDeg = 0
  let azimuthMaxOffsetDeg = 0
  let altitudeMinOffsetDeg = 0
  let altitudeMaxOffsetDeg = 0

  for (let row = 0; row < STELLARIUM_AZIMUTHAL_FOV_SAMPLE_GRID_SIZE; row += 1) {
    for (let column = 0; column < STELLARIUM_AZIMUTHAL_FOV_SAMPLE_GRID_SIZE; column += 1) {
      const screenX = (column / (STELLARIUM_AZIMUTHAL_FOV_SAMPLE_GRID_SIZE - 1)) * view.viewportWidth
      const screenY = (row / (STELLARIUM_AZIMUTHAL_FOV_SAMPLE_GRID_SIZE - 1)) * view.viewportHeight
      const sampleHorizontal = directionToHorizontal(unprojectViewportPoint(screenX, screenY, view))
      const azimuthOffsetDeg = getSignedAngleDeltaDegrees(sampleHorizontal.azimuthDeg, centerHorizontal.azimuthDeg)
      const altitudeOffsetDeg = sampleHorizontal.altitudeDeg - centerHorizontal.altitudeDeg

      azimuthMinOffsetDeg = Math.min(azimuthMinOffsetDeg, azimuthOffsetDeg)
      azimuthMaxOffsetDeg = Math.max(azimuthMaxOffsetDeg, azimuthOffsetDeg)
      altitudeMinOffsetDeg = Math.min(altitudeMinOffsetDeg, altitudeOffsetDeg)
      altitudeMaxOffsetDeg = Math.max(altitudeMaxOffsetDeg, altitudeOffsetDeg)
    }
  }

  return {
    centerAzimuthDeg: centerHorizontal.azimuthDeg,
    centerAltitudeDeg: centerHorizontal.altitudeDeg,
    azimuthMinOffsetDeg,
    azimuthMaxOffsetDeg,
    altitudeMinOffsetDeg,
    altitudeMaxOffsetDeg,
    azimuthFovDeg: azimuthMaxOffsetDeg - azimuthMinOffsetDeg,
    altitudeFovDeg: altitudeMaxOffsetDeg - altitudeMinOffsetDeg,
  }
}

function horizontalToEquatorialCoordinates(
  altitudeDeg: number,
  azimuthDeg: number,
  observer: SkyEngineObserver,
  timestampIso: string,
) {
  const equatorial = horizontalToRaDec({
    timestampUtc: timestampIso,
    latitudeDeg: observer.latitude,
    longitudeDeg: observer.longitude,
    elevationM: observer.elevationFt * 0.3048,
    fovDeg: 60,
    centerAltDeg: altitudeDeg,
    centerAzDeg: azimuthDeg,
    projection: 'stereographic',
  })
  return {
    rightAscensionDeg: wrapDegrees(equatorial.raDeg),
    declinationDeg: equatorial.decDeg,
  }
}

function estimateEquatorialViewportRange(
  view: SkyProjectionView,
  observer: SkyEngineObserver,
  timestampIso: string,
): EquatorialViewportRange {
  const centerHorizontal = directionToHorizontal(view.centerDirection)
  const centerEquatorial = horizontalToEquatorialCoordinates(
    centerHorizontal.altitudeDeg,
    centerHorizontal.azimuthDeg,
    observer,
    timestampIso,
  )
  let rightAscensionMinOffsetDeg = 0
  let rightAscensionMaxOffsetDeg = 0
  let declinationMinOffsetDeg = 0
  let declinationMaxOffsetDeg = 0

  for (let row = 0; row < STELLARIUM_AZIMUTHAL_FOV_SAMPLE_GRID_SIZE; row += 1) {
    for (let column = 0; column < STELLARIUM_AZIMUTHAL_FOV_SAMPLE_GRID_SIZE; column += 1) {
      const screenX = (column / (STELLARIUM_AZIMUTHAL_FOV_SAMPLE_GRID_SIZE - 1)) * view.viewportWidth
      const screenY = (row / (STELLARIUM_AZIMUTHAL_FOV_SAMPLE_GRID_SIZE - 1)) * view.viewportHeight
      const sampleHorizontal = directionToHorizontal(unprojectViewportPoint(screenX, screenY, view))
      const sampleEquatorial = horizontalToEquatorialCoordinates(
        sampleHorizontal.altitudeDeg,
        sampleHorizontal.azimuthDeg,
        observer,
        timestampIso,
      )
      const rightAscensionOffsetDeg = getSignedAngleDeltaDegrees(sampleEquatorial.rightAscensionDeg, centerEquatorial.rightAscensionDeg)
      const declinationOffsetDeg = sampleEquatorial.declinationDeg - centerEquatorial.declinationDeg

      rightAscensionMinOffsetDeg = Math.min(rightAscensionMinOffsetDeg, rightAscensionOffsetDeg)
      rightAscensionMaxOffsetDeg = Math.max(rightAscensionMaxOffsetDeg, rightAscensionOffsetDeg)
      declinationMinOffsetDeg = Math.min(declinationMinOffsetDeg, declinationOffsetDeg)
      declinationMaxOffsetDeg = Math.max(declinationMaxOffsetDeg, declinationOffsetDeg)
    }
  }

  return {
    centerRightAscensionDeg: centerEquatorial.rightAscensionDeg,
    centerDeclinationDeg: centerEquatorial.declinationDeg,
    rightAscensionMinOffsetDeg,
    rightAscensionMaxOffsetDeg,
    declinationMinOffsetDeg,
    declinationMaxOffsetDeg,
    rightAscensionFovDeg: rightAscensionMaxOffsetDeg - rightAscensionMinOffsetDeg,
    declinationFovDeg: declinationMaxOffsetDeg - declinationMinOffsetDeg,
  }
}

function lookupClosestStepDegrees(steps: readonly number[], targetAngleDeg: number) {
  const targetSplits = 360 / Math.max(targetAngleDeg, 1e-6)
  let closestStep = steps[0]
  let closestDistance = Math.abs(360 / steps[0] - targetSplits)

  steps.slice(1).forEach((step) => {
    const distance = Math.abs(360 / step - targetSplits)

    if (distance < closestDistance) {
      closestStep = step
      closestDistance = distance
    }
  })

  return closestStep
}

function coarsenGridStepDegrees(
  visibleSpanDeg: number,
  stepDeg: number,
  majorStepsDeg: readonly number[],
  maxVisibleLines: number,
) {
  const requiredStepDeg = visibleSpanDeg / Math.max(maxVisibleLines, 1)

  if (stepDeg >= requiredStepDeg) {
    return stepDeg
  }

  for (const majorStepDeg of majorStepsDeg) {
    if (majorStepDeg >= requiredStepDeg) {
      return majorStepDeg
    }
  }

  return majorStepsDeg[0] ?? stepDeg
}

function buildDegreeSamples(startDeg: number, endDeg: number, stepDeg: number) {
  if (stepDeg <= 0) {
    return [startDeg, endDeg]
  }

  const samples: number[] = []
  const direction = startDeg <= endDeg ? 1 : -1
  const increment = Math.abs(stepDeg) * direction

  for (let currentDeg = startDeg; direction > 0 ? currentDeg <= endDeg + 1e-6 : currentDeg >= endDeg - 1e-6; currentDeg += increment) {
    samples.push(Number(currentDeg.toFixed(6)))
  }

  const [lastSample = endDeg] = samples.slice(-1)

  if (samples.length === 0 || Math.abs(lastSample - endDeg) > 1e-6) {
    samples.push(endDeg)
  }

  return samples
}

function buildProjectedCurveSegments(
  view: SkyProjectionView,
  sampleValues: readonly number[],
  projectSample: (sampleValue: number) => ReturnType<typeof projectHorizontalToViewport>,
  depth = 0.02,
) {
  const segments: Vector3[][] = []
  let currentSegment: Vector3[] = []
  let previousProjected: ReturnType<typeof projectHorizontalToViewport> = null
  const maxScreenGapPx = Math.max(view.viewportWidth, view.viewportHeight) * 0.35

  const flushSegment = () => {
    if (currentSegment.length >= 2) {
      segments.push(currentSegment)
    }

    currentSegment = []
  }

  sampleValues.forEach((sampleValue) => {
    const projected = projectSample(sampleValue)

    if (!projected || !isProjectedPointVisible(projected, view, STELLARIUM_AZIMUTHAL_GRID_SAMPLE_MARGIN_PX)) {
      flushSegment()
      previousProjected = null
      return
    }

    if (previousProjected) {
      const screenGapPx = Math.hypot(projected.screenX - previousProjected.screenX, projected.screenY - previousProjected.screenY)

      if (screenGapPx > maxScreenGapPx) {
        flushSegment()
      }
    }

    currentSegment.push(toViewportPlanePosition(projected.screenX, projected.screenY, view.viewportWidth, view.viewportHeight, depth))
    previousProjected = projected
  })

  flushSegment()
  return segments
}

function getCurveSampleStepDegrees(gridStepDeg: number) {
  if (gridStepDeg <= 1) {
    return 0.5
  }

  if (gridStepDeg <= 5) {
    return 1
  }

  return 2
}

function buildAzimuthalGridLines(
  view: SkyProjectionView,
  enabled: boolean,
) {
  if (!enabled) {
    return []
  }

  const lines: OverlayLineEntry[] = []
  const viewportRange = estimateAzimuthalViewportRange(view)
  const azimuthTargetStepDeg = Math.min(
    viewportRange.azimuthFovDeg / STELLARIUM_AZIMUTHAL_GRID_DIVISIONS,
    STELLARIUM_AZIMUTHAL_GRID_MAX_STEP_DEG,
  )
  const altitudeTargetStepDeg = Math.min(
    viewportRange.altitudeFovDeg / STELLARIUM_AZIMUTHAL_GRID_DIVISIONS,
    STELLARIUM_AZIMUTHAL_GRID_MAX_STEP_DEG,
  )
  const azimuthStepDeg = lookupClosestStepDegrees(STELLARIUM_AZIMUTH_STEPS_DEG, azimuthTargetStepDeg)
  const altitudeStepDeg = lookupClosestStepDegrees(STELLARIUM_ALTITUDE_STEPS_DEG, altitudeTargetStepDeg)
  const azimuthSampleStepDeg = getCurveSampleStepDegrees(azimuthStepDeg)
  const altitudeSampleStepDeg = getCurveSampleStepDegrees(altitudeStepDeg)
  const azimuthStartOffsetDeg = Math.max(-180, Math.floor((viewportRange.azimuthMinOffsetDeg - azimuthStepDeg) / azimuthStepDeg) * azimuthStepDeg)
  const azimuthEndOffsetDeg = Math.min(180, Math.ceil((viewportRange.azimuthMaxOffsetDeg + azimuthStepDeg) / azimuthStepDeg) * azimuthStepDeg)
  const minVisibleAltitudeDeg = clamp(
    Math.floor((viewportRange.centerAltitudeDeg + viewportRange.altitudeMinOffsetDeg - altitudeStepDeg) / altitudeStepDeg) * altitudeStepDeg,
    -90,
    90,
  )
  const maxVisibleAltitudeDeg = clamp(
    Math.ceil((viewportRange.centerAltitudeDeg + viewportRange.altitudeMaxOffsetDeg + altitudeStepDeg) / altitudeStepDeg) * altitudeStepDeg,
    -90,
    90,
  )

  const pushSegments = (idPrefix: string, segments: readonly Vector3[][]) => {
    segments.forEach((points, index) => {
      lines.push({
        id: `${idPrefix}-${index}`,
        points,
        colorHex: STELLARIUM_AZIMUTHAL_GRID_COLOR_HEX,
        alpha: STELLARIUM_AZIMUTHAL_GRID_ALPHA,
      })
    })
  }

  const horizonSegments = buildProjectedCurveSegments(
    view,
    buildDegreeSamples(azimuthStartOffsetDeg, azimuthEndOffsetDeg, altitudeSampleStepDeg),
    (azimuthOffsetDeg) => projectHorizontalToViewport(0, wrapDegrees(viewportRange.centerAzimuthDeg + azimuthOffsetDeg), view),
  )
  pushSegments('azimuthal-horizon', horizonSegments)

  for (let altitudeDeg = minVisibleAltitudeDeg; altitudeDeg <= maxVisibleAltitudeDeg + 1e-6; altitudeDeg += altitudeStepDeg) {
    if (Math.abs(altitudeDeg) <= 1e-6) {
      continue
    }

    const altitudeSegments = buildProjectedCurveSegments(
      view,
      buildDegreeSamples(azimuthStartOffsetDeg, azimuthEndOffsetDeg, altitudeSampleStepDeg),
      (azimuthOffsetDeg) => projectHorizontalToViewport(altitudeDeg, wrapDegrees(viewportRange.centerAzimuthDeg + azimuthOffsetDeg), view),
    )
    pushSegments(`azimuthal-altitude-${altitudeDeg}`, altitudeSegments)
  }

  for (let azimuthOffsetDeg = azimuthStartOffsetDeg; azimuthOffsetDeg <= azimuthEndOffsetDeg + 1e-6; azimuthOffsetDeg += azimuthStepDeg) {
    const azimuthDeg = wrapDegrees(viewportRange.centerAzimuthDeg + azimuthOffsetDeg)
    const meridianSegments = buildProjectedCurveSegments(
      view,
      buildDegreeSamples(minVisibleAltitudeDeg, maxVisibleAltitudeDeg, azimuthSampleStepDeg),
      (altitudeDeg) => projectHorizontalToViewport(altitudeDeg, azimuthDeg, view),
    )
    pushSegments(`azimuthal-azimuth-${azimuthDeg}`, meridianSegments)
  }

  return lines
}

function buildEquatorialGridLines(
  view: SkyProjectionView,
  observer: SkyEngineObserver,
  timestampIso: string,
  enabled: boolean,
) {
  if (!enabled) {
    return []
  }

  const lines: OverlayLineEntry[] = []
  const viewportRange = estimateEquatorialViewportRange(view, observer, timestampIso)
  const rightAscensionTargetStepDeg = Math.min(
    viewportRange.rightAscensionFovDeg / STELLARIUM_AZIMUTHAL_GRID_DIVISIONS,
    STELLARIUM_AZIMUTHAL_GRID_MAX_STEP_DEG,
  )
  const declinationTargetStepDeg = Math.min(
    viewportRange.declinationFovDeg / STELLARIUM_AZIMUTHAL_GRID_DIVISIONS,
    STELLARIUM_AZIMUTHAL_GRID_MAX_STEP_DEG,
  )
  const baseRightAscensionStepDeg = lookupClosestStepDegrees(STELLARIUM_RIGHT_ASCENSION_STEPS_DEG, rightAscensionTargetStepDeg)
  const baseDeclinationStepDeg = lookupClosestStepDegrees(STELLARIUM_DECLINATION_STEPS_DEG, declinationTargetStepDeg)
  const rightAscensionVisibleSpanDeg = viewportRange.rightAscensionFovDeg + baseRightAscensionStepDeg * 2
  const declinationVisibleSpanDeg = viewportRange.declinationFovDeg + baseDeclinationStepDeg * 2
  const rightAscensionStepDeg = coarsenGridStepDegrees(
    rightAscensionVisibleSpanDeg,
    baseRightAscensionStepDeg,
    STELLARIUM_EQUATORIAL_RIGHT_ASCENSION_MAJOR_STEPS_DEG,
    STELLARIUM_EQUATORIAL_MAX_RIGHT_ASCENSION_LINES,
  )
  const declinationStepDeg = coarsenGridStepDegrees(
    declinationVisibleSpanDeg,
    baseDeclinationStepDeg,
    STELLARIUM_EQUATORIAL_DECLINATION_MAJOR_STEPS_DEG,
    STELLARIUM_EQUATORIAL_MAX_DECLINATION_LINES,
  )
  const rightAscensionSampleStepDeg = getCurveSampleStepDegrees(rightAscensionStepDeg)
  const declinationSampleStepDeg = getCurveSampleStepDegrees(declinationStepDeg)
  const rightAscensionStartOffsetDeg = Math.max(-180, Math.floor((viewportRange.rightAscensionMinOffsetDeg - rightAscensionStepDeg) / rightAscensionStepDeg) * rightAscensionStepDeg)
  const rightAscensionEndOffsetDeg = Math.min(180, Math.ceil((viewportRange.rightAscensionMaxOffsetDeg + rightAscensionStepDeg) / rightAscensionStepDeg) * rightAscensionStepDeg)
  const minVisibleDeclinationDeg = clamp(
    Math.floor((viewportRange.centerDeclinationDeg + viewportRange.declinationMinOffsetDeg - declinationStepDeg) / declinationStepDeg) * declinationStepDeg,
    -90,
    90,
  )
  const maxVisibleDeclinationDeg = clamp(
    Math.ceil((viewportRange.centerDeclinationDeg + viewportRange.declinationMaxOffsetDeg + declinationStepDeg) / declinationStepDeg) * declinationStepDeg,
    -90,
    90,
  )

  const projectEquatorialSample = (rightAscensionDeg: number, declinationDeg: number) => {
    const horizontal = computeHorizontalCoordinates(observer, timestampIso, rightAscensionDeg / 15, declinationDeg)
    return projectHorizontalToViewport(horizontal.altitudeDeg, horizontal.azimuthDeg, view)
  }

  const pushSegments = (idPrefix: string, segments: readonly Vector3[][]) => {
    segments.forEach((points, index) => {
      lines.push({
        id: `${idPrefix}-${index}`,
        points,
        colorHex: STELLARIUM_EQUATORIAL_GRID_COLOR_HEX,
        alpha: STELLARIUM_EQUATORIAL_GRID_ALPHA,
      })
    })
  }

  for (let declinationDeg = minVisibleDeclinationDeg; declinationDeg <= maxVisibleDeclinationDeg + 1e-6; declinationDeg += declinationStepDeg) {
    const declinationSegments = buildProjectedCurveSegments(
      view,
      buildDegreeSamples(rightAscensionStartOffsetDeg, rightAscensionEndOffsetDeg, rightAscensionSampleStepDeg),
      (rightAscensionOffsetDeg) => projectEquatorialSample(
        wrapDegrees(viewportRange.centerRightAscensionDeg + rightAscensionOffsetDeg),
        declinationDeg,
      ),
    )
    pushSegments(`equatorial-declination-${declinationDeg}`, declinationSegments)
  }

  for (let rightAscensionOffsetDeg = rightAscensionStartOffsetDeg; rightAscensionOffsetDeg <= rightAscensionEndOffsetDeg + 1e-6; rightAscensionOffsetDeg += rightAscensionStepDeg) {
    const rightAscensionDeg = wrapDegrees(viewportRange.centerRightAscensionDeg + rightAscensionOffsetDeg)
    const rightAscensionSegments = buildProjectedCurveSegments(
      view,
      buildDegreeSamples(minVisibleDeclinationDeg, maxVisibleDeclinationDeg, declinationSampleStepDeg),
      (declinationDeg) => projectEquatorialSample(rightAscensionDeg, declinationDeg),
    )
    pushSegments(`equatorial-right-ascension-${rightAscensionDeg}`, rightAscensionSegments)
  }

  return lines
}

function createLabelSignature(text: string, variant: LabelVariant) {
  return `${text}:${variant}`
}

function getLabelPlaneSize(object: SkyEngineSceneObject) {
  if (object.type === 'moon') {
    return { width: 206, height: 48 }
  }

  if (object.type === 'deep_sky') {
    return { width: object.source === 'temporary_scene_seed' ? 178 : 186, height: 48 }
  }

  return { width: 176, height: 48 }
}

function createLabelMesh(
  scene: Scene,
  object: SkyEngineSceneObject,
  text: string,
  variant: LabelVariant,
  texture = buildLabelTexture(text, variant),
): LabelMeshEntry {
  const { width, height } = getLabelPlaneSize(object)
  texture.hasAlpha = true

  const mesh = MeshBuilder.CreatePlane(`sky-engine-overlay-label-${object.id}`, { width, height }, scene)
  mesh.isPickable = false
  mesh.renderingGroupId = 3

  const material = new StandardMaterial(`sky-engine-overlay-label-material-${object.id}`, scene)
  material.disableLighting = true
  material.backFaceCulling = false
  material.diffuseTexture = texture
  material.opacityTexture = texture
  material.useAlphaFromDiffuseTexture = true
  material.emissiveColor = Color3.White()
  material.alpha = 0
  mesh.material = material
  mesh.isVisible = false

  return {
    label: mesh,
    labelMaterial: material,
    object,
    currentLabelAlpha: 0,
    currentLabelScale: 1,
    texture,
    signature: createLabelSignature(text, variant),
  }
}

function disposeLabelMesh(entry: LabelMeshEntry) {
  entry.label.dispose()
  entry.labelMaterial.dispose()
}

function createCardinalMesh(scene: Scene, id: string, text: string) {
  const texture = buildLabelTexture(text, 'cardinal')
  texture.hasAlpha = true

  const mesh = MeshBuilder.CreatePlane(`sky-engine-overlay-cardinal-${id}`, { width: 34, height: 28 }, scene)
  mesh.isPickable = false
  mesh.renderingGroupId = 3

  const material = new StandardMaterial(`sky-engine-overlay-cardinal-material-${id}`, scene)
  material.disableLighting = true
  material.backFaceCulling = false
  material.diffuseTexture = texture
  material.opacityTexture = texture
  material.useAlphaFromDiffuseTexture = true
  material.emissiveColor = Color3.White()
  material.alpha = 0.9
  mesh.material = material

  return { mesh, material, texture }
}

function disposeCardinalMesh(entry: CardinalMeshEntry) {
  entry.mesh.dispose()
  entry.material.dispose()
  entry.texture.dispose()
}

function prepareAidLines(
  view: SkyProjectionView,
  observer: SkyEngineObserver,
  timestampIso: string,
  projectedObjects: readonly OverlayProjectedObjectEntry[],
  aidVisibility: SkyEngineAidVisibility,
  skyCultureId: string,
  hintsLimitMag?: number,
) {
  const lines = [
    ...buildAzimuthalGridLines(view, aidVisibility.azimuthRing),
    ...buildEquatorialGridLines(view, observer, timestampIso, aidVisibility.altitudeRings),
  ]
  const cardinals: OverlayCardinalEntry[] = []
  const labels: OverlayLabelEntry[] = []

  if (aidVisibility.constellations) {
    const constellationSegments = getSkyEngineSkyCulture(skyCultureId).constellations
    const projectedLookup = new Map(projectedObjects.map((entry) => [entry.object.id, entry]))
    const renderedBoundaryIds = new Set<string>()

    constellationSegments.forEach((constellation) => {
      const visibleAnchorsById = new Map<string, OverlayProjectedObjectEntry>()

      constellation.pairs.forEach(([leftId, rightId], index) => {
        const left = projectedLookup.get(leftId)
        const right = projectedLookup.get(rightId)

        if (!left || !right) {
          return
        }

        lines.push({
          id: `constellation-${constellation.id}-${index}`,
          points: [
            toViewportPlanePosition(left.screenX, left.screenY, view.viewportWidth, view.viewportHeight),
            toViewportPlanePosition(right.screenX, right.screenY, view.viewportWidth, view.viewportHeight),
          ],
          colorHex: '#7eabff',
          alpha: 0.18,
        })
        visibleAnchorsById.set(left.object.id, left)
        visibleAnchorsById.set(right.object.id, right)
      })

      constellation.boundarySegments.forEach((boundarySegment) => {
        const boundaryId = `constellation-boundary-${constellation.cultureId}-${boundarySegment.id}`

        if (renderedBoundaryIds.has(boundaryId)) {
          return
        }

        const startHorizontal = computeHorizontalCoordinates(
          observer,
          timestampIso,
          boundarySegment.startRightAscensionHours,
          boundarySegment.startDeclinationDeg,
        )
        const endHorizontal = computeHorizontalCoordinates(
          observer,
          timestampIso,
          boundarySegment.endRightAscensionHours,
          boundarySegment.endDeclinationDeg,
        )

        const left = projectHorizontalToViewport(startHorizontal.altitudeDeg, startHorizontal.azimuthDeg, view)
        const right = projectHorizontalToViewport(endHorizontal.altitudeDeg, endHorizontal.azimuthDeg, view)

        if (!left || !right) {
          return
        }

        if (!isProjectedPointVisible(left, view, 18) || !isProjectedPointVisible(right, view, 18)) {
          return
        }

        renderedBoundaryIds.add(boundaryId)
        lines.push({
          id: boundaryId,
          points: [
            toViewportPlanePosition(left.screenX, left.screenY, view.viewportWidth, view.viewportHeight),
            toViewportPlanePosition(right.screenX, right.screenY, view.viewportWidth, view.viewportHeight),
          ],
          colorHex: '#8a6b4c',
          alpha: 0.12,
        })
      })

      const visibleAnchors = Array.from(visibleAnchorsById.values())
      if (visibleAnchors.length === 0) {
        return
      }

      const labelAnchor = visibleAnchors
        .slice()
        .sort((left, right) =>
          left.object.magnitude - right.object.magnitude ||
          left.depth - right.depth ||
          left.object.id.localeCompare(right.object.id),
        )[0]
      const labelId = `constellation-label-${constellation.id}`
      if (hintsLimitMag !== undefined && labelAnchor.object.magnitude > hintsLimitMag) {
        return
      }
      labels.push({
        id: labelId,
        anchorObjectId: labelAnchor.object.id,
        object: {
          ...labelAnchor.object,
          id: labelId,
          name: constellation.label,
          type: 'deep_sky',
          source: 'temporary_scene_seed',
          summary: `${constellation.label} constellation (${constellation.canonicalCode})`,
          description: `${constellation.label} constellation label from active skyculture data (${constellation.cultureId}${constellation.cultureRegion ? ` · ${constellation.cultureRegion}` : ''}).`,
          constellation: constellation.label,
          trackingMode: 'static',
        },
        text: constellation.label,
      })
    })
  }

  return {
    lines,
    cardinals,
    labels,
    trajectoryObjectId: null,
  }
}

export function prepareDirectOverlayFrame(
  view: SkyProjectionView,
  observer: SkyEngineObserver,
  timestampIso: string,
  projectedObjects: readonly OverlayProjectedObjectEntry[],
  scenePacket: SkyScenePacket | null,
  selectedObjectId: string | null,
  aidVisibility: SkyEngineAidVisibility,
  skyCultureId: string,
  hintsLimitMag?: number,
) {
  const {
    lines,
    cardinals,
    labels: constellationLabels,
    trajectoryObjectId,
  } = prepareAidLines(view, observer, timestampIso, projectedObjects, aidVisibility, skyCultureId, hintsLimitMag)
  const packetTextById = new Map((scenePacket?.labels ?? []).map((label) => [label.id, label.text]))
  const labelIds = new Set<string>()
  const labels: OverlayLabelEntry[] = []

  projectedObjects.forEach((entry) => {
    if (isEngineTileSource(entry.object.source) || labelIds.has(entry.object.id)) {
      return
    }
    if (
      hintsLimitMag !== undefined &&
      entry.object.id !== selectedObjectId &&
      Number.isFinite(entry.object.magnitude) &&
      entry.object.magnitude > hintsLimitMag
    ) {
      return
    }

    labelIds.add(entry.object.id)
    labels.push({
      id: entry.object.id,
      anchorObjectId: entry.object.id,
      object: entry.object,
      text: packetTextById.get(entry.object.id) ?? entry.object.name,
    })
  })

  constellationLabels.forEach((labelEntry) => {
    if (labelIds.has(labelEntry.id)) {
      return
    }

    labelIds.add(labelEntry.id)
    labels.push(labelEntry)
  })

  return {
    lines,
    cardinals,
    labels,
    trajectoryObjectId,
  } satisfies PreparedDirectOverlayFrame
}

export function createDirectOverlayLayer(scene: Scene) {
  const lineMeshes = new Map<string, LinesMesh>()
  const labelMeshes = new Map<string, LabelMeshEntry>()
  const cardinalMeshes = new Map<string, CardinalMeshEntry>()
  const labelTextureCache = new Map<string, CachedLabelTextureEntry>()
  let labelLayoutFrameState: LabelLayoutFrameState = {
    visibleLabelIds: [],
    layoutState: new Map<string, LabelLayoutState>(),
    projectionState: new Map<string, OverlayLabelProjectionSnapshot>(),
    fovDegrees: Number.NaN,
    labelCap: -1,
    selectedObjectId: null,
    guidedSignature: '',
    viewportWidth: 0,
    viewportHeight: 0,
  }

  function acquireLabelTexture(signature: string, text: string, variant: LabelVariant) {
    const cached = labelTextureCache.get(signature)

    if (cached) {
      cached.references += 1
      return cached.texture
    }

    const texture = buildLabelTexture(text, variant)
    texture.hasAlpha = true
    labelTextureCache.set(signature, { texture, references: 1 })
    return texture
  }

  function releaseLabelTexture(signature: string) {
    const cached = labelTextureCache.get(signature)

    if (!cached) {
      return
    }

    cached.references -= 1

    if (cached.references > 0) {
      return
    }

    cached.texture.dispose()
    labelTextureCache.delete(signature)
  }

  function createCachedLabelMesh(object: SkyEngineSceneObject, text: string, variant: LabelVariant) {
    const signature = createLabelSignature(text, variant)
    const texture = acquireLabelTexture(signature, text, variant)
    return createLabelMesh(scene, object, text, variant, texture)
  }

  function replaceLabelTexture(entry: LabelMeshEntry, nextSignature: string, text: string, variant: LabelVariant) {
    if (entry.signature === nextSignature) {
      return
    }

    const nextTexture = acquireLabelTexture(nextSignature, text, variant)
    releaseLabelTexture(entry.signature)
    entry.texture = nextTexture
    entry.labelMaterial.diffuseTexture = nextTexture
    entry.labelMaterial.opacityTexture = nextTexture
    entry.signature = nextSignature
  }

  function disposeCachedLabelMesh(entry: LabelMeshEntry) {
    releaseLabelTexture(entry.signature)
    disposeLabelMesh(entry)
  }

  function buildGuidedSignature(guidedObjectIds: ReadonlySet<string>) {
    return Array.from(guidedObjectIds).sort((left, right) => left.localeCompare(right)).join('|')
  }

  function shouldForceLabelRelayout(
    previousState: LabelLayoutFrameState,
    projectionState: ReadonlyMap<string, OverlayLabelProjectionSnapshot>,
    selectedObjectId: string | null,
    guidedSignature: string,
    labelCap: number,
    currentFovDegrees: number,
    viewportWidth: number,
    viewportHeight: number,
  ) {
    if (!Number.isFinite(previousState.fovDegrees)) {
      return true
    }

    if (previousState.selectedObjectId !== selectedObjectId || previousState.labelCap !== labelCap || previousState.guidedSignature !== guidedSignature) {
      return true
    }

    if (previousState.viewportWidth !== viewportWidth || previousState.viewportHeight !== viewportHeight) {
      return true
    }

    if (Math.abs(previousState.fovDegrees - currentFovDegrees) >= LABEL_RELAYOUT_FOV_DELTA_DEG) {
      return true
    }

    if (previousState.projectionState.size !== projectionState.size) {
      return true
    }

    for (const [objectId, nextProjection] of Array.from(projectionState.entries())) {
      const previousProjection = previousState.projectionState.get(objectId)

      if (!previousProjection) {
        return true
      }

      if (previousProjection.signature !== nextProjection.signature || previousProjection.occluded !== nextProjection.occluded) {
        return true
      }

      const projectedMotion = Math.hypot(previousProjection.screenX - nextProjection.screenX, previousProjection.screenY - nextProjection.screenY)
      if (projectedMotion >= LABEL_RELAYOUT_MOTION_PX) {
        return true
      }

      if (Math.abs(previousProjection.depth - nextProjection.depth) >= LABEL_RELAYOUT_DEPTH_DELTA) {
        return true
      }
    }

    return false
  }

  return {
    sync(
      frame: PreparedDirectOverlayFrame,
      projectedObjects: readonly OverlayProjectedObjectEntry[],
      viewportWidth: number,
      viewportHeight: number,
      camera: Camera,
      engine: Engine,
      selectedObjectId: string | null,
      guidedObjectIds: ReadonlySet<string>,
      sunState: SkyEngineSunState,
      labelCap: number,
      currentFovDegrees: number,
    ) {
      const nextLineIds = new Set(frame.lines.map((line) => line.id))

      Array.from(lineMeshes.keys()).forEach((lineId) => {
        if (nextLineIds.has(lineId)) {
          return
        }

        const lineMesh = lineMeshes.get(lineId)

        if (!lineMesh) {
          return
        }

        lineMesh.dispose()
        lineMeshes.delete(lineId)
      })

      frame.lines.forEach((line) => {
        const existing = lineMeshes.get(line.id)
        const nextLine = MeshBuilder.CreateLines(
          `sky-engine-overlay-line-${line.id}`,
          {
            points: line.points,
            updatable: true,
            ...(existing ? { instance: existing } : {}),
          },
          scene,
        )

        nextLine.isPickable = false
        nextLine.renderingGroupId = 2
        nextLine.color = Color3.FromHexString(line.colorHex)
        nextLine.alpha = line.alpha
        lineMeshes.set(line.id, nextLine)
      })

      const nextCardinalIds = new Set(frame.cardinals.map((entry) => entry.id))
      Array.from(cardinalMeshes.keys()).forEach((cardinalId) => {
        if (nextCardinalIds.has(cardinalId)) {
          return
        }

        const entry = cardinalMeshes.get(cardinalId)

        if (!entry) {
          return
        }

        disposeCardinalMesh(entry)
        cardinalMeshes.delete(cardinalId)
      })

      frame.cardinals.forEach((cardinal) => {
        let entry = cardinalMeshes.get(cardinal.id)

        if (!entry) {
          entry = createCardinalMesh(scene, cardinal.id, cardinal.text)
          cardinalMeshes.set(cardinal.id, entry)
        }

        entry.mesh.isVisible = true
        entry.mesh.position.copyFrom(toViewportPlanePosition(cardinal.screenX, cardinal.screenY, viewportWidth, viewportHeight, 0.035))
      })

      const projectedLookup = new Map(projectedObjects.map((entry) => [entry.object.id, entry]))
      const nextLabelIds = new Set(frame.labels.map((label) => label.id))
      Array.from(labelMeshes.keys()).forEach((labelId) => {
        if (nextLabelIds.has(labelId)) {
          return
        }

        const entry = labelMeshes.get(labelId)

        if (!entry) {
          return
        }

        disposeCachedLabelMesh(entry)
        labelMeshes.delete(labelId)
      })

      const nextProjectionState = new Map<string, OverlayLabelProjectionSnapshot>()
      frame.labels.forEach((labelEntry) => {
        const projected = projectedLookup.get(labelEntry.anchorObjectId)

        if (!projected) {
          return
        }

        const variant = labelEntry.anchorObjectId === selectedObjectId ? 'selected' : getLabelVariantForObject(labelEntry.object)
        const nextSignature = createLabelSignature(labelEntry.text, variant)
        let meshEntry = labelMeshes.get(labelEntry.id)

        if (!meshEntry) {
          meshEntry = createCachedLabelMesh(labelEntry.object, labelEntry.text, variant)
          labelMeshes.set(labelEntry.id, meshEntry)
        }

        replaceLabelTexture(meshEntry, nextSignature, labelEntry.text, variant)

        meshEntry.object = labelEntry.object
        meshEntry.label.position.copyFrom(
          toViewportPlanePosition(
            projected.screenX + projected.markerRadiusPx + 12,
            projected.screenY - projected.markerRadiusPx - 10,
            viewportWidth,
            viewportHeight,
            0.04,
          ),
        )
        nextProjectionState.set(labelEntry.id, {
          screenX: projected.screenX,
          screenY: projected.screenY,
          depth: projected.depth,
          markerRadiusPx: projected.markerRadiusPx,
          signature: nextSignature,
          occluded: !labelEntry.object.isAboveHorizon,
        })
      })

      const guidedSignature = buildGuidedSignature(guidedObjectIds)
      const shouldRunFullRelayout = shouldForceLabelRelayout(
        labelLayoutFrameState,
        nextProjectionState,
        selectedObjectId,
        guidedSignature,
        labelCap,
        currentFovDegrees,
        viewportWidth,
        viewportHeight,
      )

      const labelLayoutResult = shouldRunFullRelayout
        ? resolveLabelLayout(
            scene,
            camera,
            engine,
            Object.fromEntries(labelMeshes.entries()) as Record<string, LabelRenderRef>,
            selectedObjectId,
            guidedObjectIds,
            sunState,
            labelCap,
            labelLayoutFrameState.layoutState,
          )
        : reusePreviousLabelLayout(
            scene,
            camera,
            engine,
            Object.fromEntries(labelMeshes.entries()) as Record<string, LabelRenderRef>,
            selectedObjectId,
            guidedObjectIds,
            sunState,
            labelLayoutFrameState.layoutState,
          )

      labelLayoutFrameState = {
        visibleLabelIds: labelLayoutResult.visibleLabelIds,
        layoutState: labelLayoutResult.nextLayoutState,
        projectionState: nextProjectionState,
        fovDegrees: currentFovDegrees,
        labelCap,
        selectedObjectId,
        guidedSignature,
        viewportWidth,
        viewportHeight,
      }

      return {
        visibleLabelIds: labelLayoutResult.visibleLabelIds,
        trajectoryObjectId: frame.trajectoryObjectId,
      }
    },

    dispose() {
      lineMeshes.forEach((mesh) => mesh.dispose())
      lineMeshes.clear()
      labelMeshes.forEach(disposeCachedLabelMesh)
      labelMeshes.clear()
      labelTextureCache.forEach((entry) => entry.texture.dispose())
      labelTextureCache.clear()
      cardinalMeshes.forEach(disposeCardinalMesh)
      cardinalMeshes.clear()
      labelLayoutFrameState = {
        visibleLabelIds: [],
        layoutState: new Map<string, LabelLayoutState>(),
        projectionState: new Map<string, OverlayLabelProjectionSnapshot>(),
        fovDegrees: Number.NaN,
        labelCap: -1,
        selectedObjectId: null,
        guidedSignature: '',
        viewportWidth: 0,
        viewportHeight: 0,
      }
    },
  }
}
