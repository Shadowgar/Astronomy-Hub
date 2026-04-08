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

import { computeObjectTrajectorySamples } from './astronomy'
import { SKY_ENGINE_CONSTELLATION_SEGMENTS } from './constellations'
import type { SkyScenePacket } from './engine/sky'
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
  type SkyProjectionView,
} from './projectionMath'
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

const TRAJECTORY_HOUR_OFFSETS = [-6, -3, 0, 3, 6] as const
const COMPASS_CARDINALS = [
  { label: 'N', azimuthDeg: 0 },
  { label: 'E', azimuthDeg: 90 },
  { label: 'S', azimuthDeg: 180 },
  { label: 'W', azimuthDeg: 270 },
] as const

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
  return source === 'engine_mock_tile' || source === 'engine_hipparcos_tile'
}

function getBelowHorizonVisibility(centerAltitudeDeg: number) {
  return centerAltitudeDeg < 0 ? 1 : 0
}

function toViewportPlanePosition(screenX: number, screenY: number, viewportWidth: number, viewportHeight: number, depth = 0.02) {
  return new Vector3(
    screenX - viewportWidth * 0.5,
    viewportHeight * 0.5 - screenY,
    depth,
  )
}

function buildConstantAltitudeCurve(view: SkyProjectionView, altitudeDeg: number) {
  const points: Vector3[] = []

  for (let azimuthDeg = 0; azimuthDeg <= 360; azimuthDeg += 4) {
    const projected = projectHorizontalToViewport(altitudeDeg, azimuthDeg, view)

    if (projected && isProjectedPointVisible(projected, view, 24)) {
      points.push(toViewportPlanePosition(projected.screenX, projected.screenY, view.viewportWidth, view.viewportHeight))
    }
  }

  return points
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
      id: `azimuth-tick-${azimuthDeg}`,
      points: [
        toViewportPlanePosition(outerPoint.screenX, outerPoint.screenY, view.viewportWidth, view.viewportHeight),
        toViewportPlanePosition(innerPoint.screenX, innerPoint.screenY, view.viewportWidth, view.viewportHeight),
      ],
      colorHex: isCardinal ? '#dcf0ff' : isMajor ? '#abd6ff' : '#84baf0',
      alpha: isCardinal ? 0.92 : isMajor ? 0.62 : 0.36,
    }]
  })
}

function buildTrajectoryLine(
  view: SkyProjectionView,
  observer: SkyEngineObserver,
  selectedObject: SkyEngineSceneObject | null,
) {
  if (!selectedObject || selectedObject.trackingMode === 'static') {
    return { trajectoryObjectId: null, line: null }
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
    .map((sample) => toViewportPlanePosition(sample.screenX, sample.screenY, view.viewportWidth, view.viewportHeight, 0.03))

  return {
    trajectoryObjectId: selectedObject.id,
    line: points.length >= 2
      ? {
          id: `trajectory-${selectedObject.id}`,
          points,
          colorHex: selectedObject.colorHex,
          alpha: selectedObject.type === 'moon' ? 0.68 : 0.54,
        }
      : null,
  }
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
  projectedObjects: readonly OverlayProjectedObjectEntry[],
  aidVisibility: SkyEngineAidVisibility,
  selectedObject: SkyEngineSceneObject | null,
) {
  const lines: OverlayLineEntry[] = []
  const cardinals: OverlayCardinalEntry[] = []
  const centerAltitudeDeg = directionToHorizontal(view.centerDirection).altitudeDeg

  if (aidVisibility.altitudeRings) {
    ;[15, 30, 45, 60].forEach((altitudeDeg) => {
      const points = buildConstantAltitudeCurve(view, altitudeDeg)

      if (points.length >= 2) {
        lines.push({
          id: `altitude-ring-${altitudeDeg}`,
          points,
          colorHex: '#9ecbff',
          alpha: 0.11,
        })
      }
    })

    if (getBelowHorizonVisibility(centerAltitudeDeg) > 0.08) {
      ;[-15, -30, -45].forEach((altitudeDeg) => {
        const points = buildConstantAltitudeCurve(view, altitudeDeg)

        if (points.length >= 2) {
          lines.push({
            id: `altitude-ring-${altitudeDeg}`,
            points,
            colorHex: '#8ebfff',
            alpha: 0.08,
          })
        }
      })
    }
  }

  if (aidVisibility.azimuthRing) {
    const horizonPoints = buildConstantAltitudeCurve(view, 0)

    if (horizonPoints.length >= 2) {
      lines.push({
        id: 'horizon-ring',
        points: horizonPoints,
        colorHex: '#cfe7ff',
        alpha: 0.62,
      })
    }

    lines.push(...buildAzimuthTickSegments(view))

    COMPASS_CARDINALS.forEach((cardinal) => {
      const projected = projectHorizontalToViewport(7.6, cardinal.azimuthDeg, view)

      if (!projected || !isProjectedPointVisible(projected, view, 22)) {
        return
      }

      cardinals.push({
        id: `cardinal-${cardinal.label}`,
        text: cardinal.label,
        screenX: projected.screenX,
        screenY: projected.screenY,
      })
    })
  }

  if (aidVisibility.constellations) {
    const projectedLookup = new Map(projectedObjects.map((entry) => [entry.object.id, entry]))

    SKY_ENGINE_CONSTELLATION_SEGMENTS.forEach((constellation) => {
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
      })
    })
  }

  const trajectory = buildTrajectoryLine(view, observer, selectedObject)

  if (trajectory.line) {
    lines.push(trajectory.line)
  }

  return {
    lines,
    cardinals,
    trajectoryObjectId: trajectory.trajectoryObjectId,
  }
}

export function prepareDirectOverlayFrame(
  view: SkyProjectionView,
  observer: SkyEngineObserver,
  projectedObjects: readonly OverlayProjectedObjectEntry[],
  scenePacket: SkyScenePacket | null,
  selectedObjectId: string | null,
  aidVisibility: SkyEngineAidVisibility,
) {
  const selectedObject = projectedObjects.find((entry) => entry.object.id === selectedObjectId)?.object ?? null
  const { lines, cardinals, trajectoryObjectId } = prepareAidLines(view, observer, projectedObjects, aidVisibility, selectedObject)
  const packetTextById = new Map((scenePacket?.labels ?? []).map((label) => [label.id, label.text]))
  const labelIds = new Set<string>()
  const labels: OverlayLabelEntry[] = []

  projectedObjects.forEach((entry) => {
    if (isEngineTileSource(entry.object.source) || labelIds.has(entry.object.id)) {
      return
    }

    labelIds.add(entry.object.id)
    labels.push({
      object: entry.object,
      text: packetTextById.get(entry.object.id) ?? entry.object.name,
    })
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
      const nextLabelIds = new Set(frame.labels.map((label) => label.object.id))
      Array.from(labelMeshes.keys()).forEach((objectId) => {
        if (nextLabelIds.has(objectId)) {
          return
        }

        const entry = labelMeshes.get(objectId)

        if (!entry) {
          return
        }

        disposeCachedLabelMesh(entry)
        labelMeshes.delete(objectId)
      })

      const nextProjectionState = new Map<string, OverlayLabelProjectionSnapshot>()
      frame.labels.forEach((labelEntry) => {
        const projected = projectedLookup.get(labelEntry.object.id)

        if (!projected) {
          return
        }

        const variant = labelEntry.object.id === selectedObjectId ? 'selected' : getLabelVariantForObject(labelEntry.object)
        const nextSignature = createLabelSignature(labelEntry.text, variant)
        let meshEntry = labelMeshes.get(labelEntry.object.id)

        if (!meshEntry) {
          meshEntry = createCachedLabelMesh(labelEntry.object, labelEntry.text, variant)
          labelMeshes.set(labelEntry.object.id, meshEntry)
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
        nextProjectionState.set(labelEntry.object.id, {
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
