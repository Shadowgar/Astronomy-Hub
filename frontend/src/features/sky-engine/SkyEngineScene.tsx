import React, { useEffect, useRef } from 'react'

import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import '@babylonjs/core/Culling/ray'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { Scene } from '@babylonjs/core/scene'

import { computeObjectTrajectorySamples } from './astronomy'
import { setupSkyAtmosphere } from './atmosphere'
import {
  buildLabelTexture as buildManagedLabelTexture,
  getLabelAnchorPosition,
  getLabelVariantForObject as getManagedLabelVariantForObject,
  resolveLabelLayout as resolveManagedLabelLayout,
} from './labelManager'
import { createLandscapeLayer } from './landscapeLayer'
import {
  buildMoonTexture as buildObjectMoonTexture,
  buildObjectMarkerTexture,
  buildSelectionRingTexture as buildManagedSelectionRingTexture,
  getMarkerBaseAlpha as getManagedMarkerBaseAlpha,
  getObjectMarkerDiameter,
  getObjectPickRadiusPx,
} from './objectClassRenderer'
import {
  applyPointerAnchoredZoom,
  buildInitialViewTarget as buildObserverInitialViewTarget,
  getSkyEngineFovDegrees,
  getDesiredFovForObject,
  getSelectionTargetVector,
  stepSkyEngineFov,
  updateObserverNavigation,
} from './observerNavigation'
import {
  buildSkyEnginePickTargets,
  clearSkyEnginePickTargets,
  getSkyEnginePickColliderDiameter,
  resolveSkyEnginePickSelection,
  writeSkyEnginePickTargets,
} from './pickTargets'
import { getStarRenderProfile, type StarRenderProfile } from './starRenderer'
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

interface RenderedObjectRefs {
  marker: Mesh
  label: Mesh
  selectionRing: Mesh
  guidanceRing: Mesh
  meshes: Mesh[]
  pickMesh: Mesh
  markerMaterial: StandardMaterial
  labelMaterial: StandardMaterial
  selectionMaterial: StandardMaterial
  guidanceMaterial: StandardMaterial
  labelTexture: DynamicTexture
  selectedLabelTexture: DynamicTexture
  markerTexture: DynamicTexture | Texture
  baseColor: Color3
  object: SkyEngineSceneObject
  markerBaseAlpha: number
  pickRadiusPx: number
  twinklePhase: number
  currentLabelAlpha: number
  currentLabelScale: number
  starProfile: StarRenderProfile | null
}

interface SceneRuntimeRefs {
  scene: Scene
  engine: Engine
  camera: UniversalCamera
  canvas: HTMLCanvasElement
  trajectoryMesh: Mesh | null
  trajectoryMarkers: Mesh[]
  groundTextureMode: 'oras-grass.jpg_tiled'
  groundTextureAssetPath: string
  desiredFov: number
  targetVector: Vector3 | null
  homeVector: Vector3
  selectedObjectId: string | null
  lastFrameTime: number
  lastReportedFovTenths: number | null
  landscapeLayer: ReturnType<typeof createLandscapeLayer>
}

interface SceneStateWriteInput {
  canvas: HTMLCanvasElement
  objects: readonly SkyEngineSceneObject[]
  selectedObjectId: string | null
  trajectoryObjectId: string | null
  visibleLabelIds: readonly string[]
  guidedObjectIds: readonly string[]
  aidVisibility: SkyEngineAidVisibility
  groundTextureMode: 'oras-grass.jpg_tiled'
  groundTextureAssetPath: string
  currentFovDegrees: number
}

const SKY_RADIUS = 120
const HORIZON_RADIUS = SKY_RADIUS * 0.92
const LABEL_WIDTH = 12
const LABEL_HEIGHT = 3.25
const SKY_ENGINE_SCENE_STATE_ATTRIBUTE = 'data-sky-engine-scene-state'
const SKY_ENGINE_GROUND_TEXTURE_URL = '/sky-engine-assets/oras-grass.jpg'
const TRAJECTORY_HOUR_OFFSETS = Array.from({ length: 25 }, (_, index) => index - 12)
const CARDINAL_MARKERS = [
  { label: 'N', azimuthDeg: 0 },
  { label: 'E', azimuthDeg: 90 },
  { label: 'S', azimuthDeg: 180 },
  { label: 'W', azimuthDeg: 270 },
] as const
const ALTITUDE_RING_DEGREES = [30, 60] as const
const MAX_VISIBLE_LABELS = 7

type LabelVariant = 'cardinal' | 'priority' | 'selected' | 'temporary' | 'moon'

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function toSkyPosition(altitudeDeg: number, azimuthDeg: number, radius: number) {
  const altitude = (altitudeDeg * Math.PI) / 180
  const azimuth = (azimuthDeg * Math.PI) / 180
  const horizontalRadius = Math.cos(altitude) * radius

  return new Vector3(
    Math.sin(azimuth) * horizontalRadius,
    Math.sin(altitude) * radius,
    Math.cos(azimuth) * horizontalRadius,
  )
}

function buildLabelTexture(text: string, variant: LabelVariant = 'priority') {
  const texture = new DynamicTexture(`sky-engine-label-${text}-${variant}`, { width: 768, height: 192 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const isSelected = variant === 'selected'
  const isTemporary = variant === 'temporary'
  const isCardinal = variant === 'cardinal'
  const isMoon = variant === 'moon'
  let background = 'rgba(6, 12, 22, 0.74)'
  let stroke = 'rgba(112, 164, 215, 0.56)'

  if (isSelected) {
    background = 'rgba(7, 15, 24, 0.98)'
    stroke = 'rgba(226, 242, 255, 0.98)'
  } else if (isCardinal) {
    background = 'rgba(6, 12, 22, 0.84)'
    stroke = 'rgba(120, 181, 239, 0.72)'
  } else if (isTemporary) {
    background = 'rgba(32, 24, 11, 0.82)'
    stroke = 'rgba(230, 186, 122, 0.72)'
  } else if (isMoon) {
    background = 'rgba(30, 28, 19, 0.92)'
    stroke = 'rgba(249, 227, 177, 0.84)'
  }

  context.clearRect(0, 0, 768, 192)
  context.fillStyle = background
  context.beginPath()
  context.roundRect(20, 30, 728, 132, isSelected ? 36 : 28)
  context.fill()
  context.strokeStyle = stroke
  context.lineWidth = isSelected ? 5 : 2.5
  context.stroke()
  context.fillStyle = '#eff8ff'
  context.font = isSelected ? '600 58px sans-serif' : '600 48px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.shadowColor = 'rgba(0, 0, 0, 0.55)'
  context.shadowBlur = isSelected ? 16 : 8
  context.fillText(text, 384, 96)
  texture.update()

  return texture
}

function buildStarPointTexture(name: string) {
  const texture = new DynamicTexture(name, { width: 64, height: 64 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  context.clearRect(0, 0, 64, 64)

  const halo = context.createRadialGradient(32, 32, 1, 32, 32, 8)
  halo.addColorStop(0, 'rgba(255,255,255,1)')
  halo.addColorStop(0.2, 'rgba(255,255,255,0.98)')
  halo.addColorStop(0.38, 'rgba(255,255,255,0.36)')
  halo.addColorStop(0.76, 'rgba(255,255,255,0.08)')
  halo.addColorStop(1, 'rgba(255,255,255,0)')

  context.fillStyle = halo
  context.beginPath()
  context.arc(32, 32, 8, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = 'rgba(255,255,255,1)'
  context.beginPath()
  context.arc(32, 32, 1.6, 0, Math.PI * 2)
  context.fill()
  texture.update()

  return texture
}

function buildMarkerTexture(name: string) {
  const texture = new DynamicTexture(name, { width: 64, height: 64 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  context.clearRect(0, 0, 64, 64)

  const halo = context.createRadialGradient(32, 32, 2.5, 32, 32, 18)
  halo.addColorStop(0, 'rgba(255,255,255,1)')
  halo.addColorStop(0.2, 'rgba(255,255,255,0.96)')
  halo.addColorStop(0.42, 'rgba(255,255,255,0.54)')
  halo.addColorStop(0.78, 'rgba(255,255,255,0.12)')
  halo.addColorStop(1, 'rgba(255,255,255,0)')

  context.fillStyle = halo
  context.beginPath()
  context.arc(32, 32, 18, 0, Math.PI * 2)
  context.fill()
  texture.update()

  return texture
}

function buildMoonTexture(name: string, illuminationFraction = 0.5, brightLimbAngleDeg = 0, waxing = true) {
  const texture = new DynamicTexture(name, { width: 256, height: 256 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const imageData = context.createImageData(256, 256)
  const sunX = Math.sin((brightLimbAngleDeg * Math.PI) / 180) * (waxing ? 1 : -1)
  const sunY = -Math.cos((brightLimbAngleDeg * Math.PI) / 180)
  const phaseAngle = Math.acos(clamp(1 - illuminationFraction * 2, -1, 1))
  const sunZ = Math.cos(phaseAngle)

  for (let pixelY = 0; pixelY < 256; pixelY += 1) {
    for (let pixelX = 0; pixelX < 256; pixelX += 1) {
      const normalizedX = (pixelX - 128) / 90
      const normalizedY = (pixelY - 128) / 90
      const radiusSquared = normalizedX * normalizedX + normalizedY * normalizedY

      if (radiusSquared > 1) {
        continue
      }

      const normalizedZ = Math.sqrt(1 - radiusSquared)
      const light = Math.max(0, normalizedX * sunX + normalizedY * sunY + normalizedZ * sunZ)
      const rim = 1 - Math.sqrt(radiusSquared)
      const brightness = clamp(0.14 + light * 0.86 + rim * 0.08, 0, 1)
      const index = (pixelY * 256 + pixelX) * 4
      imageData.data[index] = Math.round(210 + brightness * 34)
      imageData.data[index + 1] = Math.round(205 + brightness * 30)
      imageData.data[index + 2] = Math.round(190 + brightness * 24)
      imageData.data[index + 3] = 255
    }
  }

  context.clearRect(0, 0, 256, 256)
  const halo = context.createRadialGradient(128, 128, 40, 128, 128, 118)
  halo.addColorStop(0, 'rgba(255, 244, 214, 0.18)')
  halo.addColorStop(0.55, 'rgba(255, 244, 214, 0.08)')
  halo.addColorStop(1, 'rgba(255, 244, 214, 0)')
  context.fillStyle = halo
  context.beginPath()
  context.arc(128, 128, 118, 0, Math.PI * 2)
  context.fill()
  context.putImageData(imageData, 0, 0)
  texture.update()

  return texture
}

function buildAssetGroundTexture(scene: Scene, name: string, tileScale: number) {
  const texture = new Texture(SKY_ENGINE_GROUND_TEXTURE_URL, scene, false, true, Texture.TRILINEAR_SAMPLINGMODE)
  texture.hasAlpha = false
  texture.wrapU = Texture.WRAP_ADDRESSMODE
  texture.wrapV = Texture.WRAP_ADDRESSMODE
  texture.name = name
  texture.uScale = tileScale
  texture.vScale = tileScale
  texture.level = 0.96

  return texture
}

function buildRadialBandTexture(name: string, colorHex: string, alpha = 0.42) {
  const texture = new DynamicTexture(name, { width: 1024, height: 1024 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const color = Color3.FromHexString(colorHex)
  const [red, green, blue] = [color.r, color.g, color.b].map((channel) => Math.round(channel * 255))
  const gradient = context.createRadialGradient(512, 512, 280, 512, 512, 512)

  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(0.56, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(0.78, `rgba(${red}, ${green}, ${blue}, ${alpha * 0.2})`)
  gradient.addColorStop(0.92, `rgba(${red}, ${green}, ${blue}, ${alpha})`)
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

  context.clearRect(0, 0, 1024, 1024)
  context.fillStyle = gradient
  context.fillRect(0, 0, 1024, 1024)
  texture.update()

  return texture
}

function buildGroundDepthTexture(name: string) {
  const texture = new DynamicTexture(name, { width: 1024, height: 1024 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const gradient = context.createRadialGradient(512, 512, 180, 512, 512, 512)

  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(0.58, 'rgba(0, 0, 0, 0.08)')
  gradient.addColorStop(0.86, 'rgba(0, 0, 0, 0.34)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.62)')

  context.clearRect(0, 0, 1024, 1024)
  context.fillStyle = gradient
  context.fillRect(0, 0, 1024, 1024)
  texture.update()

  return texture
}

function buildSelectionRingTexture(name: string, colorHex = '#ffffff', coreAlpha = 0.94, rimAlpha = 0.22) {
  const texture = new DynamicTexture(name, { width: 128, height: 128 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const color = Color3.FromHexString(colorHex)
  const [red, green, blue] = [color.r, color.g, color.b].map((channel) => Math.round(channel * 255))
  context.clearRect(0, 0, 128, 128)
  context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${coreAlpha})`
  context.lineWidth = 8
  context.beginPath()
  context.arc(64, 64, 42, 0, Math.PI * 2)
  context.stroke()

  context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${rimAlpha})`
  context.lineWidth = 2
  context.beginPath()
  context.arc(64, 64, 52, 0, Math.PI * 2)
  context.stroke()
  texture.update()

  return texture
}

function hashObjectPhase(value: string) {
  return Array.from(value).reduce((accumulator, character, index) => {
    return accumulator + (character.codePointAt(0) ?? 0) * (index + 1)
  }, 0) * 0.017
}

function getGroundShading(sunState: SkyEngineSunState) {
  if (sunState.phaseLabel === 'Night') {
    return {
      diffuse: Color3.FromHexString('#294038'),
      emissive: Color3.FromHexString('#0f1d1f').scale(0.3),
      localEmissive: Color3.FromHexString('#16312b').scale(0.44),
      overlayAlpha: 0.46,
      horizonAlpha: 0.34,
    }
  }

  if (sunState.phaseLabel === 'Low Sun') {
    return {
      diffuse: Color3.FromHexString('#596045'),
      emissive: Color3.FromHexString('#443927').scale(0.18),
      localEmissive: Color3.FromHexString('#64513a').scale(0.26),
      overlayAlpha: 0.32,
      horizonAlpha: 0.28,
    }
  }

  return {
    diffuse: Color3.FromHexString('#7b6e4f'),
    emissive: Color3.FromHexString('#5e4d33').scale(0.08),
    localEmissive: Color3.FromHexString('#756346').scale(0.14),
    overlayAlpha: 0.18,
    horizonAlpha: 0.22,
  }
}

function writeSceneState({
  canvas,
  objects,
  selectedObjectId,
  trajectoryObjectId,
  visibleLabelIds,
  guidedObjectIds,
  aidVisibility,
  groundTextureMode,
  groundTextureAssetPath,
  currentFovDegrees,
}: SceneStateWriteInput) {
  const moonObject = objects.find((object) => object.type === 'moon')

  canvas.setAttribute(
    SKY_ENGINE_SCENE_STATE_ATTRIBUTE,
    JSON.stringify({
      horizonVisible: true,
      cardinals: CARDINAL_MARKERS.map((marker) => marker.label),
      selectedObjectId,
      trajectoryObjectId,
      visibleLabelIds,
      guidanceObjectIds: guidedObjectIds,
      moonObjectId: moonObject?.id ?? null,
      controlledLabelCount: visibleLabelIds.length,
      labelCap: MAX_VISIBLE_LABELS,
      aidVisibility,
      groundTextureMode,
      groundTextureAssetPath,
      currentFovDegrees,
    }),
  )
}

function clearSceneState(canvas: HTMLCanvasElement) {
  canvas.removeAttribute(SKY_ENGINE_SCENE_STATE_ATTRIBUTE)
}

function buildInitialViewTarget(objects: readonly SkyEngineSceneObject[], guidedObjectIds: readonly string[]) {
  const guidedSet = new Set(guidedObjectIds)
  const targetObjects = objects.filter((object) => object.isAboveHorizon && (guidedSet.has(object.id) || object.source === 'computed_real_sky'))

  if (targetObjects.length === 0) {
    return new Vector3(0, 28, 90)
  }

  const total = targetObjects.reduce((accumulator, object) => {
    const direction = toSkyPosition(object.altitudeDeg, object.azimuthDeg, 1)
    return accumulator.add(direction)
  }, Vector3.Zero())

  const direction = total.scale(1 / targetObjects.length).normalize()
  const horizonBiasedDirection = new Vector3(
    direction.x * 0.96,
    Math.max(0.16, direction.y * 0.7 + 0.12),
    direction.z,
  ).normalize()

  return horizonBiasedDirection.scale(90)
}

function getMarkerDiameter(object: SkyEngineSceneObject) {
  if (object.type === 'moon') {
    return 7.8
  }

  if (object.source === 'computed_real_sky') {
    const normalizedMagnitude = Math.min(1, Math.max(0, 1 - (object.magnitude + 1.5) / 7.2))
    return 0.28 + normalizedMagnitude * 0.52
  }

  if (object.type === 'deep_sky') {
    return 2.8
  }

  return 2.5
}

function getPickRadiusPx(object: SkyEngineSceneObject) {
  if (object.type === 'moon') {
    return 34
  }

  if (object.source === 'computed_real_sky') {
    return 26
  }

  return object.type === 'planet' ? 24 : 22
}

function getLabelOffsetY(object: SkyEngineSceneObject) {
  if (object.type === 'moon') {
    return 6.6
  }

  if (object.type === 'deep_sky') {
    return 5
  }

  return 4.5
}

function getLabelPriority(object: SkyEngineSceneObject, isSelected: boolean, guidedObjectIds: ReadonlySet<string>) {
  if (isSelected) {
    return 1000
  }

  if (!object.isAboveHorizon) {
    return 0
  }

  let priority = 20

  if (object.type === 'moon') {
    priority += 170
  }

  if (guidedObjectIds.has(object.id)) {
    priority += 90
  }

  if (object.source === 'computed_real_sky') {
    priority += clamp(80 - object.magnitude * 14, 10, 80)
  } else if (object.source === 'temporary_scene_seed') {
    priority += 18
  }

  if (object.guidanceTier === 'featured') {
    priority += 24
  }

  return priority
}

function rectanglesOverlap(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number },
) {
  return !(
    left.x + left.width < right.x ||
    right.x + right.width < left.x ||
    left.y + left.height < right.y ||
    right.y + right.height < left.y
  )
}

function getLabelScaleBoost(isSelected: boolean, isGuided: boolean) {
  if (isSelected) {
    return 0.08
  }

  if (isGuided) {
    return 0.04
  }

  return 0
}

function resolveLabelLayout(
  scene: Scene,
  camera: UniversalCamera,
  engine: Engine,
  renderedRefs: Record<string, RenderedObjectRefs>,
  selectedObjectId: string | null,
  guidedObjectIds: ReadonlySet<string>,
  sunState: SkyEngineSunState,
) {
  const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
  const visibleRectangles: Array<{ x: number; y: number; width: number; height: number }> = []
  const visibleLabelIds: string[] = []
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
      const scale = clamp(1.14 - projected.z * 0.3 + getLabelScaleBoost(isSelected, isGuided), 0.72, 1.12)
      const width = 180 * scale
      const height = 46 * scale
      const rectangle = {
        x: projected.x - width / 2,
        y: projected.y - height / 2,
        width,
        height,
      }
      const inViewport =
        projected.z >= 0 &&
        projected.z <= 1 &&
        rectangle.x >= viewport.x - 6 &&
        rectangle.y >= viewport.y - 6 &&
        rectangle.x + rectangle.width <= viewport.x + viewport.width + 6 &&
        rectangle.y + rectangle.height <= viewport.y + viewport.height + 6

      let baseAlpha = refs.object.type === 'moon' ? 0.96 : Math.max(0.24, sunState.visualCalibration.starLabelVisibility * 0.88)
      if (refs.object.source === 'temporary_scene_seed') {
        baseAlpha = 0.58
      }
      if (isGuided) {
        baseAlpha = Math.min(0.94, baseAlpha + 0.12)
      }
      if (selectedObjectId && !isSelected) {
        baseAlpha *= 0.84
      }

      return {
        refs,
        isSelected,
        priority: getLabelPriority(refs.object, isSelected, guidedObjectIds),
        baseAlpha,
        scale,
        rectangle,
        inViewport,
      }
    })
    .sort((left, right) => right.priority - left.priority)

  let visibleCount = 0
  candidates.forEach((candidate) => {
    const allowByCap = candidate.isSelected || visibleCount < MAX_VISIBLE_LABELS
    const overlaps = visibleRectangles.some((rectangle) => rectanglesOverlap(rectangle, candidate.rectangle))
    const shouldShow = candidate.inViewport && allowByCap && (!overlaps || candidate.isSelected) && candidate.priority > 0
    const targetAlpha = shouldShow ? candidate.baseAlpha : 0
    candidate.refs.currentLabelAlpha += (targetAlpha - candidate.refs.currentLabelAlpha) * 0.18
    candidate.refs.currentLabelScale += (candidate.scale - candidate.refs.currentLabelScale) * 0.22
    candidate.refs.labelMaterial.alpha = candidate.refs.currentLabelAlpha
    candidate.refs.label.isVisible = candidate.refs.currentLabelAlpha > 0.03
    candidate.refs.label.scaling.set(candidate.refs.currentLabelScale, candidate.refs.currentLabelScale, 1)

    if (shouldShow) {
      visibleRectangles.push(candidate.rectangle)
      visibleLabelIds.push(candidate.refs.object.id)
      if (!candidate.isSelected) {
        visibleCount += 1
      }
    }
  })

  return visibleLabelIds.sort((left, right) => left.localeCompare(right))
}

function buildAidRingPoints(altitudeDeg: number, radius = SKY_RADIUS * 0.994, steps = 96) {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const azimuthDeg = (index / steps) * 360
    return toSkyPosition(altitudeDeg, azimuthDeg, radius)
  })
}

function getGuidanceAlpha(isGuided: boolean, isSelected: boolean, hasActiveSelection: boolean) {
  if (!isGuided || isSelected) {
    return 0
  }

  return hasActiveSelection ? 0.16 : 0.34
}

function getMarkerVisibility(refs: RenderedObjectRefs, sunState: SkyEngineSunState) {
  if (refs.object.type === 'moon') {
    return 0.98
  }

  if (refs.object.source === 'computed_real_sky') {
    return sunState.visualCalibration.starVisibility
  }

  return 1
}

function getMarkerEmissiveColor(refs: RenderedObjectRefs, isSelected: boolean, sunState: SkyEngineSunState) {
  if (refs.object.type === 'moon') {
    return refs.baseColor.scale(0.6 + (refs.object.illuminationFraction ?? 0.5) * 0.58)
  }

  if (refs.object.source === 'computed_real_sky') {
    return refs.baseColor.scale((isSelected ? 0.98 : 0.38) + sunState.visualCalibration.starVisibility * 0.52)
  }

  return refs.baseColor.scale(isSelected ? 1.16 : 0.86)
}

function getMarkerDiffuseColor(refs: RenderedObjectRefs, sunState: SkyEngineSunState) {
  if (refs.object.type === 'moon') {
    return refs.baseColor.scale(0.18)
  }

  if (refs.object.source === 'computed_real_sky') {
    return refs.baseColor.scale(0.01 + sunState.visualCalibration.starVisibility * 0.03)
  }

  return refs.baseColor.scale(0.16)
}

function applyRenderedObjectState(
  refs: RenderedObjectRefs,
  selectedObjectId: string | null,
  guidedObjectIds: ReadonlySet<string>,
  sunState: SkyEngineSunState,
) {
  const isSelected = refs.object.id === selectedObjectId
  const isGuided = guidedObjectIds.has(refs.object.id)
  const hasActiveSelection = selectedObjectId !== null
  const deEmphasis = hasActiveSelection && !isSelected ? 0.68 : 1
  const markerAlpha = refs.markerBaseAlpha * getMarkerVisibility(refs, sunState) * deEmphasis

  if (refs.starProfile) {
    refs.markerMaterial.alpha = clamp(refs.starProfile.alpha * getMarkerVisibility(refs, sunState) * deEmphasis + (isSelected ? 0.05 : 0), 0.08, 1)
    refs.markerMaterial.emissiveColor = refs.baseColor.scale((isSelected ? 1.02 : refs.starProfile.emissiveScale) + (isGuided ? 0.08 : 0))
    refs.markerMaterial.diffuseColor = refs.baseColor.scale(refs.starProfile.diffuseScale)
  } else {
    refs.markerMaterial.alpha = clamp(markerAlpha + (isSelected ? 0.08 : 0), 0.12, 1)
    refs.markerMaterial.emissiveColor = getMarkerEmissiveColor(refs, isSelected, sunState)
    refs.markerMaterial.diffuseColor = getMarkerDiffuseColor(refs, sunState)
  }

  refs.selectionMaterial.alpha = isSelected ? 0.96 : 0
  refs.guidanceMaterial.alpha = getGuidanceAlpha(isGuided, isSelected, hasActiveSelection)
  refs.selectionRing.isVisible = isSelected
  refs.guidanceRing.isVisible = refs.guidanceMaterial.alpha > 0.02
  refs.labelMaterial.diffuseTexture = isSelected ? refs.selectedLabelTexture : refs.labelTexture
  refs.labelMaterial.opacityTexture = isSelected ? refs.selectedLabelTexture : refs.labelTexture
}

function syncSceneSelectionState(
  runtime: SceneRuntimeRefs,
  renderedRefs: Record<string, RenderedObjectRefs>,
  observer: SkyEngineObserver,
  objects: readonly SkyEngineSceneObject[],
  selectedObjectId: string | null,
  guidedObjectIds: ReadonlySet<string>,
  sunState: SkyEngineSunState,
) {
  const selectedObject = objects.find((object) => object.id === selectedObjectId) ?? null
  const selectionChanged = runtime.selectedObjectId !== selectedObjectId

  runtime.selectedObjectId = selectedObjectId

  Object.values(renderedRefs).forEach((refs) => {
    applyRenderedObjectState(refs, selectedObjectId, guidedObjectIds, sunState)
  })

  runtime.trajectoryMesh?.dispose()
  runtime.trajectoryMesh = null
  runtime.trajectoryMarkers.forEach((marker) => marker.dispose())
  runtime.trajectoryMarkers = []

  if (selectedObject && selectedObject.trackingMode !== 'static') {
    const trajectorySamples = computeObjectTrajectorySamples(
      observer,
      selectedObject.timestampIso ?? new Date().toISOString(),
      selectedObject,
      TRAJECTORY_HOUR_OFFSETS,
    ).filter((sample) => sample.altitudeDeg >= -2)
    const trajectoryPoints = trajectorySamples.map((sample) =>
      toSkyPosition(sample.altitudeDeg, sample.azimuthDeg, SKY_RADIUS * 0.992),
    )

    if (trajectoryPoints.length >= 2) {
      const trajectory = MeshBuilder.CreateDashedLines(
        `sky-engine-trajectory-${selectedObject.id}`,
        {
          points: trajectoryPoints,
          dashSize: 2.2,
          gapSize: 1.1,
          dashNb: Math.max(24, trajectoryPoints.length * 2),
        },
        runtime.scene,
      )
      trajectory.color = Color3.FromHexString(selectedObject.colorHex).scale(0.94)
      trajectory.alpha = 0.52
      trajectory.isPickable = false
      runtime.trajectoryMesh = trajectory

      const lastTrajectoryPoint = getLastPoint(trajectoryPoints)
      const anchorPoints = [trajectoryPoints[0], lastTrajectoryPoint].filter(
        (point): point is Vector3 => point instanceof Vector3,
      )
      anchorPoints.forEach((point, index) => {
        const marker = MeshBuilder.CreatePlane(
          `sky-engine-trajectory-anchor-${selectedObject.id}-${index}`,
          { width: selectedObject.type === 'moon' ? 1.75 : 1.35, height: selectedObject.type === 'moon' ? 1.75 : 1.35 },
          runtime.scene,
        )
        marker.position = point.clone()
        marker.billboardMode = Mesh.BILLBOARDMODE_ALL
        marker.isPickable = false

        const material = new StandardMaterial(`sky-engine-trajectory-anchor-material-${selectedObject.id}-${index}`, runtime.scene)
        material.disableLighting = true
        material.backFaceCulling = false
        material.diffuseTexture = selectedObject.type === 'moon'
          ? buildObjectMoonTexture(
              `sky-engine-trajectory-anchor-texture-${selectedObject.id}-${index}`,
              selectedObject.illuminationFraction,
              selectedObject.brightLimbAngleDeg,
              selectedObject.waxing,
            )
          : buildMarkerTexture(`sky-engine-trajectory-anchor-texture-${selectedObject.id}-${index}`)
        material.opacityTexture = material.diffuseTexture
        material.useAlphaFromDiffuseTexture = true
        material.emissiveColor = Color3.FromHexString(selectedObject.colorHex).scale(index === 0 ? 0.52 : 0.84)
        material.alpha = index === 0 ? 0.42 : 0.68
        marker.material = material
        runtime.trajectoryMarkers.push(marker)
      })
    }
  }

  if (selectedObject?.isAboveHorizon) {
    runtime.targetVector = getSelectionTargetVector(selectedObject)
  } else if (!selectedObject && selectionChanged) {
    runtime.targetVector = runtime.homeVector.clone()
  }

  if (selectionChanged) {
    runtime.desiredFov = getDesiredFovForObject(selectedObject)
  }

  if (!selectedObject || selectedObject.trackingMode === 'static') {
    return null
  }

  return selectedObject.id
}

function getMarkerTextureForObject(
  object: SkyEngineSceneObject,
  starSpriteTexture: DynamicTexture,
  markerSpriteTexture: DynamicTexture,
) {
  if (object.type === 'moon') {
    return buildMoonTexture(`sky-engine-moon-${object.id}`, object.illuminationFraction, object.brightLimbAngleDeg, object.waxing)
  }

  if (object.source === 'computed_real_sky') {
    return starSpriteTexture
  }

  return markerSpriteTexture
}

function getLabelVariantForObject(object: SkyEngineSceneObject): LabelVariant {
  if (object.type === 'moon') {
    return 'moon'
  }

  if (object.source === 'temporary_scene_seed') {
    return 'temporary'
  }

  return 'priority'
}

function getMarkerBaseAlpha(object: SkyEngineSceneObject) {
  if (object.source === 'temporary_scene_seed') {
    return 0.74
  }

  return 1
}

function getLastPoint(points: readonly Vector3[]) {
  let lastPoint: Vector3 | undefined

  points.forEach((point) => {
    lastPoint = point
  })

  return lastPoint
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
  const renderedObjectRefs = useRef<Record<string, RenderedObjectRefs>>({})
  const runtimeRefs = useRef<SceneRuntimeRefs | null>(null)

  useEffect(() => {
    const runtime = runtimeRefs.current

    if (!runtime) {
      return undefined
    }

    syncSceneSelectionState(
      runtime,
      renderedObjectRefs.current,
      observer,
      objects,
      selectedObjectId,

      new Set(guidedObjectIds),
      sunState,
    )

    return undefined
  }, [guidedObjectIds, objects, observer, selectedObjectId, sunState])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return undefined
    }

    const calibration = sunState.visualCalibration
    const engine = new Engine(canvas, true, {

      antialias: true,
      preserveDrawingBuffer: false,
      stencil: true,
    })
    const scene = new Scene(engine)
    scene.clearColor = Color4.FromColor3(Color3.FromHexString(calibration.backgroundColorHex), 1)
    scene.ambientColor = Color3.FromHexString(calibration.ambientLightColorHex)
    scene.skipPointerMovePicking = true

    const camera = new UniversalCamera('sky-engine-camera', Vector3.Zero(), scene)
    const initialViewTarget = buildObserverInitialViewTarget(objects, guidedObjectIds)
    camera.setTarget(initialViewTarget)

    camera.attachControl(canvas, true)
    camera.inputs.attached.keyboard?.detachControl()
    camera.angularSensibility = 3200
    camera.inertia = 0.86
    camera.speed = 0
    camera.minZ = 0.1
    camera.maxZ = SKY_RADIUS * 2
    camera.fov = getDesiredFovForObject(null)

    const atmosphere = setupSkyAtmosphere(scene, camera, sunState)
    onAtmosphereStatusChange(atmosphere.status)

    const guidedObjectSet = new Set(guidedObjectIds)
    const selectionRingTexture = buildManagedSelectionRingTexture('sky-engine-selection-ring')
    const guidanceRingTexture = buildManagedSelectionRingTexture('sky-engine-guidance-ring', '#f0d28d', 0.42, 0.16)
    const landscapeLayer = createLandscapeLayer(scene, calibration, sunState, aidVisibility, objects)

    renderedObjectRefs.current = {}
    runtimeRefs.current = {
      scene,
      engine,
      camera,
      canvas,
      trajectoryMesh: null,
      trajectoryMarkers: [],
      groundTextureMode: landscapeLayer.groundTextureMode,
      groundTextureAssetPath: landscapeLayer.groundTextureAssetPath,
      desiredFov: camera.fov,
      targetVector: null,
      homeVector: initialViewTarget.clone(),
      selectedObjectId,
      lastFrameTime: performance.now(),
      lastReportedFovTenths: null,
      landscapeLayer,
    }

    objects.forEach((object) => {
      const position = toSkyPosition(object.altitudeDeg, object.azimuthDeg, SKY_RADIUS)
      const starProfile = object.type === 'star' && object.source === 'computed_real_sky'
        ? getStarRenderProfile(object, sunState.visualCalibration)
        : null
      const markerDiameter = getObjectMarkerDiameter(object, sunState.visualCalibration, starProfile ?? undefined)
      const markerTexture = buildObjectMarkerTexture(
        `sky-engine-marker-${object.id}`,
        object,
        sunState.visualCalibration,
        starProfile ?? undefined,
      )

      const marker = MeshBuilder.CreatePlane(`sky-object-${object.id}`, {
        width: markerDiameter,
        height: markerDiameter,
      }, scene)
      marker.position = position
      marker.billboardMode = Mesh.BILLBOARDMODE_ALL
      marker.isPickable = false
      marker.metadata = { objectId: object.id, objectName: object.name, pickRole: 'marker' }

      const markerMaterial = new StandardMaterial(`sky-object-material-${object.id}`, scene)
      markerMaterial.disableLighting = true
      markerMaterial.backFaceCulling = false
      markerMaterial.emissiveColor = Color3.FromHexString(starProfile?.colorHex ?? object.colorHex)
      markerMaterial.diffuseColor = markerMaterial.emissiveColor.scale(0.14)
      markerMaterial.diffuseTexture = markerTexture
      markerMaterial.opacityTexture = markerTexture
      markerMaterial.useAlphaFromDiffuseTexture = true
      marker.material = markerMaterial

      const guidanceRing = MeshBuilder.CreatePlane(`sky-guidance-${object.id}`, {
        width: markerDiameter * (object.type === 'moon' ? 1.7 : 2.9),
        height: markerDiameter * (object.type === 'moon' ? 1.7 : 2.9),
      }, scene)
      guidanceRing.position = position.clone()
      guidanceRing.billboardMode = Mesh.BILLBOARDMODE_ALL
      guidanceRing.isPickable = false
      guidanceRing.isVisible = false

      const guidanceMaterial = new StandardMaterial(`sky-guidance-material-${object.id}`, scene)
      guidanceMaterial.disableLighting = true
      guidanceMaterial.backFaceCulling = false
      guidanceMaterial.diffuseTexture = guidanceRingTexture
      guidanceMaterial.opacityTexture = guidanceRingTexture
      guidanceMaterial.useAlphaFromDiffuseTexture = true
      guidanceMaterial.emissiveColor = Color3.FromHexString(object.type === 'moon' ? '#f4e1aa' : '#8fd1ff')
      guidanceMaterial.alpha = 0
      guidanceRing.material = guidanceMaterial

      const selectionRing = MeshBuilder.CreatePlane(`sky-selection-${object.id}`, {
        width: markerDiameter * 2.35,
        height: markerDiameter * 2.35,
      }, scene)
      selectionRing.position = position.clone()
      selectionRing.billboardMode = Mesh.BILLBOARDMODE_ALL
      selectionRing.isPickable = false
      selectionRing.isVisible = false

      const selectionMaterial = new StandardMaterial(`sky-selection-material-${object.id}`, scene)
      selectionMaterial.disableLighting = true
      selectionMaterial.backFaceCulling = false
      selectionMaterial.diffuseTexture = selectionRingTexture
      selectionMaterial.opacityTexture = selectionRingTexture
      selectionMaterial.useAlphaFromDiffuseTexture = true
      selectionMaterial.emissiveColor = Color3.FromHexString(object.colorHex).scale(1.18)
      selectionMaterial.alpha = 0
      selectionRing.material = selectionMaterial

      const label = MeshBuilder.CreatePlane(`sky-label-${object.id}`, {
        width: LABEL_WIDTH,
        height: LABEL_HEIGHT,
      }, scene)
      label.position = getLabelAnchorPosition(position, object)
      label.billboardMode = Mesh.BILLBOARDMODE_ALL
      label.isPickable = false
      label.isVisible = false
      label.metadata = { objectId: object.id, objectName: object.name, pickRole: 'label' }

      const labelTexture = buildManagedLabelTexture(
        object.type === 'moon' && object.phaseLabel ? `${object.name} · ${object.phaseLabel}` : object.name,
        getManagedLabelVariantForObject(object),
      )
      const selectedLabelTexture = buildManagedLabelTexture(object.name, 'selected')
      const labelMaterial = new StandardMaterial(`sky-label-material-${object.id}`, scene)
      labelMaterial.disableLighting = true
      labelMaterial.emissiveColor = new Color3(1, 1, 1)
      labelMaterial.opacityTexture = labelTexture
      labelMaterial.diffuseTexture = labelTexture
      labelMaterial.useAlphaFromDiffuseTexture = true
      labelMaterial.backFaceCulling = false
      label.material = labelMaterial

      const pickCollider = MeshBuilder.CreateSphere(`sky-pick-${object.id}`, {
        diameter: getSkyEnginePickColliderDiameter(object),
        segments: 12,
      }, scene)
      pickCollider.position = position.clone()
      pickCollider.isPickable = true
      pickCollider.metadata = { objectId: object.id, objectName: object.name, pickRole: 'collider' }

      const pickMaterial = new StandardMaterial(`sky-pick-material-${object.id}`, scene)
      pickMaterial.disableLighting = true
      pickMaterial.alpha = 0.001
      pickMaterial.emissiveColor = Color3.Black()
      pickMaterial.diffuseColor = Color3.Black()
      pickCollider.material = pickMaterial

      renderedObjectRefs.current[object.id] = {
        marker,
        label,
        selectionRing,
        guidanceRing,
        meshes: [marker, guidanceRing, selectionRing, label, pickCollider],
        pickMesh: pickCollider,
        markerMaterial,
        labelMaterial,
        selectionMaterial,
        guidanceMaterial,
        labelTexture,
        selectedLabelTexture,
        markerTexture,
        baseColor: Color3.FromHexString(starProfile?.colorHex ?? object.colorHex),
        object,
        markerBaseAlpha: getManagedMarkerBaseAlpha(object),
        pickRadiusPx: getObjectPickRadiusPx(object),
        twinklePhase: hashObjectPhase(object.id),
        currentLabelAlpha: 0,
        currentLabelScale: 0.82,
        starProfile,
      }

      applyRenderedObjectState(renderedObjectRefs.current[object.id], selectedObjectId, guidedObjectSet, sunState)
    })

    let trajectoryObjectId = syncSceneSelectionState(
      runtimeRefs.current,
      renderedObjectRefs.current,
      observer,
      objects,
      selectedObjectId,
      guidedObjectSet,
      sunState,
    )

    scene.onPointerDown = () => {
      const objectId = resolveSkyEnginePickSelection(
        scene,
        camera,
        engine,
        Object.values(renderedObjectRefs.current).map((refs) => ({
          object: refs.object,
          pickMesh: refs.pickMesh,
          pickRadiusPx: refs.pickRadiusPx,
        })),
        scene.pointerX,
        scene.pointerY,
      )

      onSelectObject(objectId)
    }

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

      if (selectedObjectId) {
        runtime.camera.fov = nextDesiredFov
      } else {
        const bounds = canvas.getBoundingClientRect()
        applyPointerAnchoredZoom(
          runtime.scene,
          runtime.camera,
          event.clientX - bounds.left,
          event.clientY - bounds.top,
          nextDesiredFov,
        )
        runtime.targetVector = null
      }

      runtime.desiredFov = nextDesiredFov
    }

    const handleResize = () => engine.resize()
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    globalThis.addEventListener('resize', handleResize)

    engine.runRenderLoop(() => {
      const runtime = runtimeRefs.current

      if (runtime) {
        const now = performance.now()
        const deltaSeconds = Math.min(0.05, (now - runtime.lastFrameTime) * 0.001)
        runtime.lastFrameTime = now
        runtime.targetVector = updateObserverNavigation(runtime.camera, runtime.desiredFov, runtime.targetVector, deltaSeconds)
        const currentFovTenths = Math.round(getSkyEngineFovDegrees(runtime.camera.fov) * 10)

        if (currentFovTenths !== runtime.lastReportedFovTenths) {
          runtime.lastReportedFovTenths = currentFovTenths
          onViewStateChange?.({ fovDegrees: currentFovTenths / 10 })
        }

        const animationTime = performance.now() * 0.001
        const starVisibility = sunState.visualCalibration.starVisibility

        Object.values(renderedObjectRefs.current).forEach((refs) => {
          const isSelected = refs.object.id === selectedObjectId
          let twinkleAmount = 1 + Math.sin(animationTime * 0.8 + refs.twinklePhase) * 0.015

          if (refs.starProfile) {
            twinkleAmount = 1 + Math.sin(animationTime * 1.35 + refs.twinklePhase) * refs.starProfile.twinkleAmplitude * starVisibility
          } else if (refs.object.type === 'moon') {
            twinkleAmount = 1 + Math.sin(animationTime * 0.32 + refs.twinklePhase) * 0.008
          }

          refs.marker.scaling.setAll((isSelected ? 1.12 : 1) * twinkleAmount)
          refs.selectionRing.scaling.setAll(isSelected ? 1.04 + Math.sin(animationTime * 2.2) * 0.05 : 1)
          refs.guidanceRing.scaling.setAll(1 + Math.sin(animationTime * 1.2 + refs.twinklePhase) * 0.04)
          if (refs.starProfile) {
            refs.markerMaterial.emissiveColor = refs.baseColor.scale(
              (isSelected ? 0.92 : refs.starProfile.emissiveScale) + starVisibility * (0.34 + (twinkleAmount - 1) * 1.2),
            )
          }
        })

        const visibleLabelIds = resolveManagedLabelLayout(
          scene,
          camera,
          engine,
          renderedObjectRefs.current,
          selectedObjectId,
          guidedObjectSet,
          sunState,
        )

        runtime.landscapeLayer.update(animationTime)

        trajectoryObjectId = selectedObjectId
          ? objects.find((object) => object.id === selectedObjectId && object.trackingMode !== 'static')?.id ?? null
          : null

        writeSceneState({
          canvas,
          objects,
          selectedObjectId,
          trajectoryObjectId,
          visibleLabelIds,
          guidedObjectIds,
          aidVisibility,
          groundTextureMode: runtime.groundTextureMode,
          groundTextureAssetPath: runtime.groundTextureAssetPath,
          currentFovDegrees: currentFovTenths / 10,
        })
      }

      scene.render()
      writeSkyEnginePickTargets(
        canvas,
        buildSkyEnginePickTargets(
          scene,
          camera,
          engine,
          Object.values(renderedObjectRefs.current).map((refs) => ({
            object: refs.object,
            pickMesh: refs.pickMesh,
            pickRadiusPx: refs.pickRadiusPx,
          })),
        ),
      )
    })

    return () => {
      canvas.removeEventListener('wheel', handleWheel)
      globalThis.removeEventListener('resize', handleResize)
      clearSkyEnginePickTargets(canvas)
      clearSceneState(canvas)
      runtimeRefs.current?.trajectoryMesh?.dispose()
      runtimeRefs.current?.trajectoryMarkers.forEach((marker) => marker.dispose())
      runtimeRefs.current?.landscapeLayer.dispose()
      runtimeRefs.current = null
      selectionRingTexture.dispose()
      guidanceRingTexture.dispose()
      Object.values(renderedObjectRefs.current).forEach((refs) => {
        refs.labelTexture.dispose()
        refs.selectedLabelTexture.dispose()
        refs.markerTexture.dispose()
      })
      atmosphere.dispose()
      scene.dispose()
      engine.dispose()
      renderedObjectRefs.current = {}
    }
  }, [aidVisibility, guidedObjectIds, objects, observer, onAtmosphereStatusChange, onSelectObject, onViewStateChange, selectedObjectId, sunState])

  return <canvas ref={canvasRef} className="sky-engine-scene__canvas" aria-label="Sky Engine scene" />
}