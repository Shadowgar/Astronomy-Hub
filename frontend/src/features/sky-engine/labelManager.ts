import type { Camera } from '@babylonjs/core/Cameras/camera'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Scene } from '@babylonjs/core/scene'

import { getLabelOffsetRadius } from './objectClassRenderer'
import type { SkyEngineSceneObject, SkyEngineSunState } from './types'

export const MAX_VISIBLE_LABELS = 7

export type LabelVariant = 'cardinal' | 'priority' | 'selected' | 'temporary' | 'moon' | 'planet' | 'deep_sky'

export interface LabelRenderRef {
  readonly label: Mesh
  readonly labelMaterial: StandardMaterial
  readonly object: SkyEngineSceneObject
  currentLabelAlpha: number
  currentLabelScale: number
}

export interface LabelRectangle {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface LabelLayoutState {
  readonly wasVisible: boolean
  readonly rectangle: LabelRectangle
  readonly inViewport: boolean
  readonly projectedX: number
  readonly projectedY: number
  readonly projectedDepth: number
  readonly scale: number
  readonly priority: number
  readonly signature: string
  readonly markerRadiusPx: number
  readonly occluded: boolean
}

export interface LabelLayoutResult {
  readonly visibleLabelIds: readonly string[]
  readonly nextLayoutState: Map<string, LabelLayoutState>
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function hashObjectValue(value: string) {
  return Array.from(value).reduce((accumulator, character, index) => accumulator + (character.codePointAt(0) ?? 0) * (index + 1), 0)
}

function rectanglesOverlap(
  left: LabelRectangle,
  right: LabelRectangle,
) {
  return !(
    left.x + left.width < right.x ||
    right.x + right.width < left.x ||
    left.y + left.height < right.y ||
    right.y + right.height < left.y
  )
}

function getOverlapArea(left: LabelRectangle, right: LabelRectangle) {
  const overlapWidth = Math.max(0, Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x))
  const overlapHeight = Math.max(0, Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y))

  return overlapWidth * overlapHeight
}

function getRectangleCenterDistance(left: LabelRectangle, right: LabelRectangle) {
  const leftCenterX = left.x + left.width * 0.5
  const leftCenterY = left.y + left.height * 0.5
  const rightCenterX = right.x + right.width * 0.5
  const rightCenterY = right.y + right.height * 0.5

  return Math.hypot(leftCenterX - rightCenterX, leftCenterY - rightCenterY)
}

function isInsideExpandedViewport(rectangle: LabelRectangle, viewport: { x: number; y: number; width: number; height: number }, margin: number) {
  return (
    rectangle.x + rectangle.width >= viewport.x - margin &&
    rectangle.y + rectangle.height >= viewport.y - margin &&
    rectangle.x <= viewport.x + viewport.width + margin &&
    rectangle.y <= viewport.y + viewport.height + margin
  )
}

export function buildLabelTexture(text: string, variant: LabelVariant = 'priority') {
  const texture = new DynamicTexture(`sky-engine-label-${text}-${variant}`, { width: 768, height: 192 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const isSelected = variant === 'selected'
  const backgrounds: Record<LabelVariant, string> = {
    cardinal: 'rgba(8, 15, 26, 0.82)',
    priority: 'rgba(7, 12, 20, 0.72)',
    selected: 'rgba(10, 18, 28, 0.98)',
    temporary: 'rgba(33, 23, 16, 0.9)',
    moon: 'rgba(31, 27, 18, 0.92)',
    planet: 'rgba(19, 18, 26, 0.88)',
    deep_sky: 'rgba(24, 16, 34, 0.9)',
  }
  const strokes: Record<LabelVariant, string> = {
    cardinal: 'rgba(120, 181, 239, 0.7)',
    priority: 'rgba(105, 167, 221, 0.5)',
    selected: 'rgba(230, 244, 255, 0.98)',
    temporary: 'rgba(237, 183, 122, 0.72)',
    moon: 'rgba(249, 227, 177, 0.82)',
    planet: 'rgba(213, 196, 252, 0.74)',
    deep_sky: 'rgba(193, 156, 255, 0.74)',
  }

  context.clearRect(0, 0, 768, 192)
  context.fillStyle = backgrounds[variant]
  context.beginPath()
  context.roundRect(18, 28, 732, 136, isSelected ? 36 : 28)
  context.fill()
  context.strokeStyle = strokes[variant]
  context.lineWidth = isSelected ? 4.5 : 2.4
  context.stroke()
  context.fillStyle = '#eef7ff'
  context.font = isSelected ? '600 58px sans-serif' : '600 46px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.shadowColor = 'rgba(0, 0, 0, 0.58)'
  context.shadowBlur = isSelected ? 16 : 8
  context.fillText(text, 384, 96)
  texture.update()

  return texture
}

export function getLabelVariantForObject(object: SkyEngineSceneObject): LabelVariant {
  if (object.type === 'moon') {
    return 'moon'
  }

  if (object.type === 'planet') {
    return 'planet'
  }

  if (object.type === 'deep_sky') {
    return object.source === 'temporary_scene_seed' ? 'temporary' : 'deep_sky'
  }

  if (object.source === 'temporary_scene_seed') {
    return 'temporary'
  }

  return 'priority'
}

export function getLabelAnchorPosition(markerPosition: Vector3, object: SkyEngineSceneObject) {
  const outward = markerPosition.normalize()
  const tangentRight = Vector3.Cross(outward, Vector3.Up()).normalize()
  const tangentUp = Vector3.Cross(tangentRight, outward).normalize()
  const angle = (hashObjectValue(object.id) % 360) * (Math.PI / 180)
  const radius = getLabelOffsetRadius(object)
  const radialOffset = tangentRight.scale(Math.cos(angle) * radius).add(tangentUp.scale(Math.sin(angle) * radius * 0.72 + radius * 0.68))

  return markerPosition.add(radialOffset)
}

function getLabelPriority(object: SkyEngineSceneObject, isSelected: boolean, guidedObjectIds: ReadonlySet<string>) {
  if (isSelected) {
    return 1000
  }

  if (!object.isAboveHorizon) {
    return 0
  }

  let priority = 18

  if (object.type === 'moon') {
    priority += 200
  } else if (object.type === 'planet') {
    priority += 120
  } else if (object.type === 'deep_sky') {
    priority += object.source === 'temporary_scene_seed' ? 10 : 22
  }

  if (guidedObjectIds.has(object.id)) {
    priority += object.guidanceTier === 'featured' ? 95 : 62
  }

  if (object.source === 'computed_real_sky') {
    priority += clamp(72 - object.magnitude * 13, 6, 72)
  }

  if (object.source === 'temporary_scene_seed') {
    priority -= 34
  }

  return priority
}

function getLabelAlpha(
  object: SkyEngineSceneObject,
  sunState: SkyEngineSunState,
  selectedObjectId: string | null,
  isSelected: boolean,
  isGuided: boolean,
) {
  let alpha = object.type === 'moon'
    ? 0.96
    : clamp(sunState.visualCalibration.starLabelVisibility * 0.82, 0.18, 0.74)

  if (object.type === 'planet') {
    alpha = Math.max(alpha, 0.72)
  }

  if (object.type === 'deep_sky') {
    alpha = object.source === 'temporary_scene_seed' ? 0.42 : 0.56
  }

  if (isGuided) {
    alpha = Math.min(0.92, alpha + 0.1)
  }

  if (selectedObjectId && !isSelected) {
    alpha *= 0.66
  }

  return alpha
}

function getLabelScale(projectedDepth: number, object: SkyEngineSceneObject, isSelected: boolean, isGuided: boolean) {
  let scale = clamp(1.04 - projectedDepth * 0.18, 0.68, 1.04)

  if (object.type === 'moon') {
    scale += 0.08
  }

  if (isGuided) {
    scale += 0.02
  }

  if (isSelected) {
    scale += 0.08
  }

  return clamp(scale, 0.7, 1.12)
}

interface LabelCandidate {
  readonly refs: LabelRenderRef
  readonly isSelected: boolean
  readonly priority: number
  readonly baseAlpha: number
  readonly scale: number
  readonly rectangle: LabelRectangle
  readonly inViewport: boolean
  readonly projectedX: number
  readonly projectedY: number
  readonly projectedDepth: number
  readonly signature: string
  readonly markerRadiusPx: number
  readonly occluded: boolean
}

function collectLabelCandidates(
  scene: Scene,
  camera: Camera,
  engine: Engine,
  renderedRefs: Record<string, LabelRenderRef>,
  selectedObjectId: string | null,
  guidedObjectIds: ReadonlySet<string>,
  sunState: SkyEngineSunState,
) {
  const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
  const candidates = Object.values(renderedRefs)
    .map((refs) => {
      const projected = Vector3.Project(
        refs.label.getAbsolutePosition(),
        Matrix.IdentityReadOnly,
        scene.getTransformMatrix(),
        viewport,
      )
      const isSelected = refs.object.id === selectedObjectId
      const isGuided = guidedObjectIds.has(refs.object.id)
      const scale = getLabelScale(projected.z, refs.object, isSelected, isGuided)
      let baseWidth = 176

      if (refs.object.type === 'moon') {
        baseWidth = 206
      } else if (refs.object.type === 'deep_sky') {
        baseWidth = refs.object.source === 'temporary_scene_seed' ? 178 : 186
      }

      const width = baseWidth * scale
      const height = 48 * scale
      const rectangle = {
        x: projected.x - width / 2,
        y: projected.y - height / 2,
        width,
        height,
      }
      const inDepthRange = projected.z >= 0 && projected.z <= 1
      const inViewport = isSelected
        ? inDepthRange &&
          rectangle.x + rectangle.width >= viewport.x - 24 &&
          rectangle.y + rectangle.height >= viewport.y - 24 &&
          rectangle.x <= viewport.x + viewport.width + 24 &&
          rectangle.y <= viewport.y + viewport.height + 24
        : inDepthRange &&
          rectangle.x >= viewport.x - 8 &&
          rectangle.y >= viewport.y - 8 &&
          rectangle.x + rectangle.width <= viewport.x + viewport.width + 8 &&
          rectangle.y + rectangle.height <= viewport.y + viewport.height + 8

      return {
        refs,
        isSelected,
        priority: getLabelPriority(refs.object, isSelected, guidedObjectIds),
        baseAlpha: getLabelAlpha(refs.object, sunState, selectedObjectId, isSelected, isGuided),
        scale,
        rectangle,
        inViewport,
        projectedX: projected.x,
        projectedY: projected.y,
        projectedDepth: projected.z,
        signature: refs.object.name,
        markerRadiusPx: getLabelOffsetRadius(refs.object),
        occluded: !refs.object.isAboveHorizon,
      } satisfies LabelCandidate
    })
    .sort((left, right) => right.priority - left.priority)

  return { candidates, viewport }
}

function applyLabelPresentation(refs: LabelRenderRef, targetAlpha: number, targetScale: number) {
  refs.currentLabelAlpha += (targetAlpha - refs.currentLabelAlpha) * 0.16
  refs.currentLabelScale += (targetScale - refs.currentLabelScale) * 0.2
  refs.labelMaterial.alpha = refs.currentLabelAlpha
  refs.label.isVisible = refs.currentLabelAlpha > 0.025
  refs.label.scaling.set(refs.currentLabelScale, refs.currentLabelScale, 1)
}

export function shouldKeepStableLabelVisibility(
  previousState: LabelLayoutState | undefined,
  candidate: Pick<LabelLayoutState, 'rectangle' | 'inViewport' | 'projectedDepth' | 'priority'>,
  viewport: { x: number; y: number; width: number; height: number },
  overlapAreaRatio: number,
) {
  if (!previousState?.wasVisible) {
    return false
  }

  const centerDistance = getRectangleCenterDistance(previousState.rectangle, candidate.rectangle)
  const smallMotion = centerDistance <= 18 && Math.abs(previousState.projectedDepth - candidate.projectedDepth) <= 0.06
  const withinExpandedViewport = isInsideExpandedViewport(candidate.rectangle, viewport, 22)
  const priorityStable = candidate.priority >= Math.max(1, previousState.priority - 12)

  return smallMotion && withinExpandedViewport && priorityStable && overlapAreaRatio <= 0.18
}

export function reusePreviousLabelLayout(
  scene: Scene,
  camera: Camera,
  engine: Engine,
  renderedRefs: Record<string, LabelRenderRef>,
  selectedObjectId: string | null,
  guidedObjectIds: ReadonlySet<string>,
  sunState: SkyEngineSunState,
  previousLayoutState: ReadonlyMap<string, LabelLayoutState>,
): LabelLayoutResult {
  const { candidates } = collectLabelCandidates(scene, camera, engine, renderedRefs, selectedObjectId, guidedObjectIds, sunState)
  const nextLayoutState = new Map<string, LabelLayoutState>()
  const visibleLabelIds: string[] = []

  candidates.forEach((candidate) => {
    const previousState = previousLayoutState.get(candidate.refs.object.id)
    const shouldShow = candidate.isSelected
      ? candidate.priority > 0
      : previousState?.wasVisible === true && candidate.inViewport && candidate.priority > 0

    applyLabelPresentation(candidate.refs, shouldShow ? candidate.baseAlpha : 0, candidate.scale)

    if (shouldShow) {
      visibleLabelIds.push(candidate.refs.object.id)
    }

    nextLayoutState.set(candidate.refs.object.id, {
      wasVisible: shouldShow,
      rectangle: candidate.rectangle,
      inViewport: candidate.inViewport,
      projectedX: candidate.projectedX,
      projectedY: candidate.projectedY,
      projectedDepth: candidate.projectedDepth,
      scale: candidate.scale,
      priority: candidate.priority,
      signature: candidate.signature,
      markerRadiusPx: candidate.markerRadiusPx,
      occluded: candidate.occluded,
    })
  })

  return {
    visibleLabelIds: visibleLabelIds.sort((left, right) => left.localeCompare(right)),
    nextLayoutState,
  }
}

export function resolveLabelLayout(
  scene: Scene,
  camera: Camera,
  engine: Engine,
  renderedRefs: Record<string, LabelRenderRef>,
  selectedObjectId: string | null,
  guidedObjectIds: ReadonlySet<string>,
  sunState: SkyEngineSunState,
  maxVisibleLabels = MAX_VISIBLE_LABELS,
  previousLayoutState: ReadonlyMap<string, LabelLayoutState> = new Map<string, LabelLayoutState>(),
) {
  const { candidates, viewport } = collectLabelCandidates(scene, camera, engine, renderedRefs, selectedObjectId, guidedObjectIds, sunState)
  const visibleRectangles: LabelRectangle[] = []
  const visibleLabelIds: string[] = []
  const nextLayoutState = new Map<string, LabelLayoutState>()

  let visibleCount = 0
  candidates.forEach((candidate) => {
    const allowByCap = candidate.isSelected || visibleCount < maxVisibleLabels
    const overlapRectangle = visibleRectangles.find((rectangle) => rectanglesOverlap(rectangle, candidate.rectangle))
    const overlapAreaRatio = overlapRectangle
      ? getOverlapArea(overlapRectangle, candidate.rectangle) / Math.max(1, Math.min(
          overlapRectangle.width * overlapRectangle.height,
          candidate.rectangle.width * candidate.rectangle.height,
        ))
      : 0
    const previousState = previousLayoutState.get(candidate.refs.object.id)
    const shouldShow = candidate.isSelected
      ? candidate.priority > 0
      : (
          candidate.inViewport &&
          allowByCap &&
          !overlapRectangle &&
          candidate.priority > 0
        ) || (
          allowByCap &&
          candidate.priority > 0 &&
          shouldKeepStableLabelVisibility(previousState, candidate, viewport, overlapAreaRatio)
        )
    const targetAlpha = shouldShow ? candidate.baseAlpha : 0
    applyLabelPresentation(candidate.refs, targetAlpha, candidate.scale)

    if (shouldShow) {
      visibleRectangles.push(candidate.rectangle)
      visibleLabelIds.push(candidate.refs.object.id)
      if (!candidate.isSelected) {
        visibleCount += 1
      }
    }

    nextLayoutState.set(candidate.refs.object.id, {
      wasVisible: shouldShow,
      rectangle: candidate.rectangle,
      inViewport: candidate.inViewport,
      projectedX: candidate.projectedX,
      projectedY: candidate.projectedY,
      projectedDepth: candidate.projectedDepth,
      scale: candidate.scale,
      priority: candidate.priority,
      signature: candidate.signature,
      markerRadiusPx: candidate.markerRadiusPx,
      occluded: candidate.occluded,
    })
  })

  return {
    visibleLabelIds: visibleLabelIds.sort((left, right) => left.localeCompare(right)),
    nextLayoutState,
  }
}
