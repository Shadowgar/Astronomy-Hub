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
import { SKY_ENGINE_CONSTELLATION_SEGMENTS } from './constellations'
import {
  buildSkyEnginePickTargets,
  clearSkyEnginePickTargets,
  getSkyEnginePickColliderDiameter,
  writeSkyEnginePickTargets,
} from './pickTargets'
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
const MAX_VISIBLE_LABELS = 6

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

  refs.markerMaterial.alpha = clamp(markerAlpha + (isSelected ? 0.08 : 0), 0.12, 1)
  refs.selectionMaterial.alpha = isSelected ? 0.96 : 0
  refs.guidanceMaterial.alpha = getGuidanceAlpha(isGuided, isSelected, hasActiveSelection)
  refs.selectionRing.isVisible = isSelected
  refs.guidanceRing.isVisible = refs.guidanceMaterial.alpha > 0.02
  refs.labelMaterial.diffuseTexture = isSelected ? refs.selectedLabelTexture : refs.labelTexture
  refs.labelMaterial.opacityTexture = isSelected ? refs.selectedLabelTexture : refs.labelTexture
  refs.markerMaterial.emissiveColor = getMarkerEmissiveColor(refs, isSelected, sunState)
  refs.markerMaterial.diffuseColor = getMarkerDiffuseColor(refs, sunState)
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
          ? buildMoonTexture(
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
    runtime.targetVector = toSkyPosition(selectedObject.altitudeDeg, selectedObject.azimuthDeg, 90)
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
    camera.setTarget(buildInitialViewTarget(objects, guidedObjectIds))

    camera.attachControl(canvas, true)
    camera.inputs.attached.keyboard?.detachControl()
    camera.angularSensibility = 2400
    camera.speed = 0
    camera.minZ = 0.1
    camera.maxZ = SKY_RADIUS * 2
    camera.fov = 1.02

    const atmosphere = setupSkyAtmosphere(scene, camera, sunState)
    onAtmosphereStatusChange(atmosphere.status)

    const guidedObjectSet = new Set(guidedObjectIds)
    const starSpriteTexture = buildStarPointTexture('sky-engine-star-sprite')
    const markerSpriteTexture = buildMarkerTexture('sky-engine-marker-sprite')
    const selectionRingTexture = buildSelectionRingTexture('sky-engine-selection-ring')
    const guidanceRingTexture = buildSelectionRingTexture('sky-engine-guidance-ring', '#f0d28d', 0.42, 0.16)
    const groundTexture = buildAssetGroundTexture(scene, 'sky-engine-ground-texture', 24)
    const localGroundTexture = buildAssetGroundTexture(scene, 'sky-engine-local-ground-texture', 10)
    const horizonBandTexture = buildRadialBandTexture('sky-engine-horizon-band-texture', calibration.horizonColorHex, 0.56)
    const nearGroundTexture = buildGroundDepthTexture('sky-engine-ground-depth-texture')
    const groundShading = getGroundShading(sunState)

    const groundDisk = MeshBuilder.CreateDisc(
      'sky-engine-ground-disk',
      {
        radius: SKY_RADIUS * 1.38,
        tessellation: 160,
        sideOrientation: Mesh.DOUBLESIDE,
      },
      scene,
    )
    groundDisk.rotation.x = Math.PI / 2
    groundDisk.position.y = -2.4
    groundDisk.isPickable = false
    const groundMaterial = new StandardMaterial('sky-engine-ground-material', scene)
    groundMaterial.disableLighting = true
    groundMaterial.diffuseTexture = groundTexture
    groundMaterial.emissiveTexture = groundTexture
    groundMaterial.diffuseColor = groundShading.diffuse
    groundMaterial.emissiveColor = groundShading.emissive
    groundMaterial.specularColor = Color3.Black()
    groundMaterial.alpha = 1
    groundDisk.material = groundMaterial

    const localGroundDisk = MeshBuilder.CreateDisc(
      'sky-engine-local-ground-disk',
      {
        radius: SKY_RADIUS * 0.3,
        tessellation: 80,
        sideOrientation: Mesh.DOUBLESIDE,
      },
      scene,
    )
    localGroundDisk.rotation.x = Math.PI / 2
    localGroundDisk.position.y = -1.6
    localGroundDisk.isPickable = false
    const localGroundMaterial = new StandardMaterial('sky-engine-local-ground-material', scene)
    localGroundMaterial.disableLighting = true
    localGroundMaterial.diffuseTexture = localGroundTexture
    localGroundMaterial.emissiveTexture = localGroundTexture
    localGroundMaterial.diffuseColor = groundShading.diffuse.scale(1.05)
    localGroundMaterial.emissiveColor = groundShading.localEmissive
    localGroundMaterial.specularColor = Color3.Black()
    localGroundMaterial.alpha = 1
    localGroundDisk.material = localGroundMaterial

    const groundDepthDisc = MeshBuilder.CreateDisc(
      'sky-engine-ground-depth-disc',
      {
        radius: SKY_RADIUS * 0.96,
        tessellation: 120,
        sideOrientation: Mesh.DOUBLESIDE,
      },
      scene,
    )
    groundDepthDisc.rotation.x = Math.PI / 2
    groundDepthDisc.position.y = -1.3
    groundDepthDisc.isPickable = false
    const groundDepthMaterial = new StandardMaterial('sky-engine-ground-depth-material', scene)
    groundDepthMaterial.disableLighting = true
    groundDepthMaterial.diffuseTexture = nearGroundTexture
    groundDepthMaterial.opacityTexture = nearGroundTexture
    groundDepthMaterial.useAlphaFromDiffuseTexture = true
    groundDepthMaterial.backFaceCulling = false
    groundDepthMaterial.emissiveColor = Color3.Black()
    groundDepthMaterial.alpha = groundShading.overlayAlpha
    groundDepthDisc.material = groundDepthMaterial

    const horizonBlend = MeshBuilder.CreateDisc(
      'sky-engine-horizon-blend',
      {
        radius: HORIZON_RADIUS * 1.08,
        tessellation: 160,
        sideOrientation: Mesh.DOUBLESIDE,
      },
      scene,
    )
    horizonBlend.rotation.x = Math.PI / 2
    horizonBlend.position.y = -0.18
    horizonBlend.isPickable = false
    const horizonBlendMaterial = new StandardMaterial('sky-engine-horizon-blend-material', scene)
    horizonBlendMaterial.disableLighting = true
    horizonBlendMaterial.diffuseTexture = horizonBandTexture
    horizonBlendMaterial.opacityTexture = horizonBandTexture
    horizonBlendMaterial.useAlphaFromDiffuseTexture = true
    horizonBlendMaterial.backFaceCulling = false
    horizonBlendMaterial.emissiveColor = Color3.FromHexString(calibration.horizonColorHex).scale(0.26)
    horizonBlendMaterial.alpha = groundShading.horizonAlpha
    horizonBlend.material = horizonBlendMaterial

    const horizonNearBand = MeshBuilder.CreateDisc(
      'sky-engine-horizon-near-band',
      {
        radius: HORIZON_RADIUS * 0.995,
        tessellation: 160,
        sideOrientation: Mesh.DOUBLESIDE,
      },
      scene,
    )
    horizonNearBand.rotation.x = Math.PI / 2
    horizonNearBand.position.y = 0.12
    horizonNearBand.isPickable = false
    const horizonNearBandMaterial = new StandardMaterial('sky-engine-horizon-near-band-material', scene)
    horizonNearBandMaterial.disableLighting = true
    horizonNearBandMaterial.diffuseTexture = horizonBandTexture
    horizonNearBandMaterial.opacityTexture = horizonBandTexture
    horizonNearBandMaterial.useAlphaFromDiffuseTexture = true
    horizonNearBandMaterial.backFaceCulling = false
    horizonNearBandMaterial.emissiveColor = Color3.FromHexString(calibration.horizonColorHex).scale(0.34)
    horizonNearBandMaterial.alpha = Math.max(0.18, groundShading.horizonAlpha - 0.05)
    horizonNearBand.material = horizonNearBandMaterial

    const horizonRing = MeshBuilder.CreateTorus('sky-engine-horizon', {
      diameter: HORIZON_RADIUS * 2,
      thickness: 0.24,
      tessellation: 128,
    }, scene)
    horizonRing.rotation.x = Math.PI / 2
    horizonRing.isPickable = false
    horizonRing.isVisible = aidVisibility.azimuthRing
    const horizonMaterial = new StandardMaterial('sky-engine-horizon-material', scene)
    horizonMaterial.emissiveColor = Color3.FromHexString(calibration.horizonColorHex)
    horizonMaterial.alpha = 0.82
    horizonRing.material = horizonMaterial

    const aidMeshes: Mesh[] = [horizonRing]
    CARDINAL_MARKERS.forEach((marker) => {
      const markerPosition = toSkyPosition(0, marker.azimuthDeg, HORIZON_RADIUS)

      const post = MeshBuilder.CreateCylinder(
        `sky-engine-cardinal-post-${marker.label}`,
        { height: 2.8, diameter: 0.14 },
        scene,
      )
      post.position = new Vector3(markerPosition.x, 1.4, markerPosition.z)
      post.isPickable = false
      post.isVisible = aidVisibility.azimuthRing

      const postMaterial = new StandardMaterial(`sky-engine-cardinal-post-material-${marker.label}`, scene)
      postMaterial.disableLighting = true
      postMaterial.emissiveColor = Color3.FromHexString(calibration.horizonColorHex).scale(0.92)
      post.material = postMaterial
      aidMeshes.push(post)

      const label = MeshBuilder.CreatePlane(
        `sky-engine-cardinal-label-${marker.label}`,
        { width: 5.6, height: 2.6 },
        scene,
      )
      label.position = new Vector3(markerPosition.x, 4.4, markerPosition.z)
      label.billboardMode = Mesh.BILLBOARDMODE_ALL
      label.isPickable = false
      label.isVisible = aidVisibility.azimuthRing

      const labelMaterial = new StandardMaterial(`sky-engine-cardinal-label-material-${marker.label}`, scene)
      labelMaterial.disableLighting = true
      labelMaterial.diffuseTexture = buildLabelTexture(marker.label, 'cardinal')
      labelMaterial.opacityTexture = labelMaterial.diffuseTexture
      labelMaterial.useAlphaFromDiffuseTexture = true
      labelMaterial.backFaceCulling = false
      labelMaterial.emissiveColor = Color3.FromHexString(calibration.horizonColorHex)
      labelMaterial.alpha = 0.92
      label.material = labelMaterial
      aidMeshes.push(label)
    })

    ALTITUDE_RING_DEGREES.forEach((altitudeDeg) => {
      const ring = MeshBuilder.CreateLines(
        `sky-engine-altitude-ring-${altitudeDeg}`,
        { points: buildAidRingPoints(altitudeDeg) },
        scene,
      )
      ring.color = Color3.FromHexString('#7db2e4')
      ring.alpha = 0.18
      ring.isPickable = false
      ring.isVisible = aidVisibility.altitudeRings
      aidMeshes.push(ring)

      const labelPosition = toSkyPosition(altitudeDeg, 315, SKY_RADIUS * 0.994)
      const label = MeshBuilder.CreatePlane(
        `sky-engine-altitude-label-${altitudeDeg}`,
        { width: 6.5, height: 2.4 },
        scene,
      )
      label.position = labelPosition.add(new Vector3(0, 1.8, 0))
      label.billboardMode = Mesh.BILLBOARDMODE_ALL
      label.isPickable = false
      label.isVisible = aidVisibility.altitudeRings

      const labelMaterial = new StandardMaterial(`sky-engine-altitude-label-material-${altitudeDeg}`, scene)
      labelMaterial.disableLighting = true
      labelMaterial.diffuseTexture = buildLabelTexture(`${altitudeDeg}°`, 'cardinal')
      labelMaterial.opacityTexture = labelMaterial.diffuseTexture
      labelMaterial.useAlphaFromDiffuseTexture = true
      labelMaterial.backFaceCulling = false
      labelMaterial.emissiveColor = Color3.FromHexString('#7db2e4')
      labelMaterial.alpha = 0.44
      label.material = labelMaterial
      aidMeshes.push(label)
    })

    const constellationObjects = new Map(objects.map((object) => [object.id, object]))
    SKY_ENGINE_CONSTELLATION_SEGMENTS.forEach((segment) => {
      segment.pairs.forEach(([startId, endId], pairIndex) => {
        const startObject = constellationObjects.get(startId)
        const endObject = constellationObjects.get(endId)

        if (!startObject || !endObject) {
          return
        }

        const line = MeshBuilder.CreateLines(
          `sky-engine-constellation-${segment.id}-${pairIndex}`,
          {
            points: [
              toSkyPosition(startObject.altitudeDeg, startObject.azimuthDeg, SKY_RADIUS * 0.997),
              toSkyPosition(endObject.altitudeDeg, endObject.azimuthDeg, SKY_RADIUS * 0.997),
            ],
          },
          scene,
        )
        line.color = Color3.FromHexString('#7ea9ff')
        line.alpha = 0.2
        line.isPickable = false
        line.isVisible = aidVisibility.constellations
        aidMeshes.push(line)
      })
    })

    renderedObjectRefs.current = {}
    runtimeRefs.current = {
      scene,
      engine,
      camera,
      canvas,
      trajectoryMesh: null,
      trajectoryMarkers: [],
      groundTextureMode: 'oras-grass.jpg_tiled',
      groundTextureAssetPath: SKY_ENGINE_GROUND_TEXTURE_URL,
      desiredFov: camera.fov,
      targetVector: null,
    }

    objects.forEach((object) => {
      const position = toSkyPosition(object.altitudeDeg, object.azimuthDeg, SKY_RADIUS)
      const markerDiameter = getMarkerDiameter(object)
      const markerTexture = getMarkerTextureForObject(object, starSpriteTexture, markerSpriteTexture)

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
      markerMaterial.emissiveColor = Color3.FromHexString(object.colorHex)
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
      label.position = position.add(new Vector3(0, getLabelOffsetY(object), 0))
      label.billboardMode = Mesh.BILLBOARDMODE_ALL
      label.isPickable = false
      label.isVisible = false
      label.metadata = { objectId: object.id, objectName: object.name, pickRole: 'label' }

      const labelTexture = buildLabelTexture(
        object.type === 'moon' && object.phaseLabel ? `${object.name} · ${object.phaseLabel}` : object.name,
        getLabelVariantForObject(object),
      )
      const selectedLabelTexture = buildLabelTexture(object.name, 'selected')
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
        baseColor: Color3.FromHexString(object.colorHex),
        object,
        markerBaseAlpha: getMarkerBaseAlpha(object),
        pickRadiusPx: getPickRadiusPx(object),
        twinklePhase: hashObjectPhase(object.id),
        currentLabelAlpha: 0,
        currentLabelScale: 0.82,
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

    scene.onPointerDown = (_, pickInfo) => {
      const objectId = pickInfo.pickedMesh?.metadata?.objectId

      if (typeof objectId === 'string') {
        onSelectObject(objectId)
      }
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const runtime = runtimeRefs.current

      if (!runtime) {
        return
      }

      runtime.desiredFov = Math.min(1.18, Math.max(0.58, runtime.desiredFov + Math.sign(event.deltaY) * 0.04))
    }

    const handleResize = () => engine.resize()
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    globalThis.addEventListener('resize', handleResize)

    engine.runRenderLoop(() => {
      const runtime = runtimeRefs.current

      if (runtime) {
        runtime.camera.fov += (runtime.desiredFov - runtime.camera.fov) * 0.14

        if (runtime.targetVector) {
          const currentTarget = runtime.camera.getTarget()
          const nextTarget = Vector3.Lerp(currentTarget, runtime.targetVector, 0.045)
          runtime.camera.setTarget(nextTarget)

          if (Vector3.Distance(nextTarget, runtime.targetVector) < 0.1) {
            runtime.targetVector = null
          }
        }

        const animationTime = performance.now() * 0.001
        const starVisibility = sunState.visualCalibration.starVisibility

        Object.values(renderedObjectRefs.current).forEach((refs) => {
          const isSelected = refs.object.id === selectedObjectId
          const isMoon = refs.object.type === 'moon'
          const twinkleAmount = isMoon
            ? 1 + Math.sin(animationTime * 0.4 + refs.twinklePhase) * 0.01
            : 1 + Math.sin(animationTime * 1.6 + refs.twinklePhase) * 0.03 * starVisibility
          refs.marker.scaling.setAll((isSelected ? 1.12 : 1) * twinkleAmount)
          refs.selectionRing.scaling.setAll(isSelected ? 1.04 + Math.sin(animationTime * 2.2) * 0.05 : 1)
          refs.guidanceRing.scaling.setAll(1 + Math.sin(animationTime * 1.2 + refs.twinklePhase) * 0.04)
          if (refs.object.source === 'computed_real_sky') {
            refs.markerMaterial.emissiveColor = refs.baseColor.scale(
              (isSelected ? 0.88 : 0.42) + starVisibility * (0.48 + (twinkleAmount - 1) * 1.6),
            )
          }
        })

        const visibleLabelIds = resolveLabelLayout(
          scene,
          camera,
          engine,
          renderedObjectRefs.current,
          selectedObjectId,
          guidedObjectSet,
          sunState,
        )

        horizonBlendMaterial.alpha = groundShading.horizonAlpha + Math.sin(animationTime * 0.42) * 0.015
        horizonNearBandMaterial.alpha = Math.max(0.12, groundShading.horizonAlpha - 0.05 + Math.sin(animationTime * 0.6) * 0.012)

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
      runtimeRefs.current = null
      starSpriteTexture.dispose()
      markerSpriteTexture.dispose()
      selectionRingTexture.dispose()
      guidanceRingTexture.dispose()
      groundTexture.dispose()
      localGroundTexture.dispose()
      horizonBandTexture.dispose()
      nearGroundTexture.dispose()
      groundMaterial.dispose()
      localGroundMaterial.dispose()
      groundDepthMaterial.dispose()
      horizonBlendMaterial.dispose()
      horizonNearBandMaterial.dispose()
      horizonMaterial.dispose()
      aidMeshes.forEach((mesh) => {
        if (!mesh.isDisposed()) {
          mesh.dispose(false, true)
        }
      })
      Object.values(renderedObjectRefs.current).forEach((refs) => {
        refs.labelTexture.dispose()
        refs.selectedLabelTexture.dispose()
        if (refs.markerTexture !== starSpriteTexture && refs.markerTexture !== markerSpriteTexture) {
          refs.markerTexture.dispose()
        }
      })
      atmosphere.dispose()
      scene.dispose()
      engine.dispose()
      renderedObjectRefs.current = {}
    }
  }, [aidVisibility, guidedObjectIds, objects, observer, onAtmosphereStatusChange, onSelectObject, selectedObjectId, sunState])

  return <canvas ref={canvasRef} className="sky-engine-scene__canvas" aria-label="Sky Engine scene" />
}