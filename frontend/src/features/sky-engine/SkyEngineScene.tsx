import React, { useEffect, useRef } from 'react'

import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import '@babylonjs/core/Culling/ray'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { Scene } from '@babylonjs/core/scene'

import { computeObjectTrajectorySamples } from './astronomy'
import { setupSkyAtmosphere } from './atmosphere'
import {
  buildSkyEnginePickTargets,
  clearSkyEnginePickTargets,
  getSkyEnginePickColliderDiameter,
  writeSkyEnginePickTargets,
} from './pickTargets'
import type { SkyEngineAtmosphereStatus, SkyEngineObserver, SkyEngineSceneObject, SkyEngineSunState } from './types'

interface SkyEngineSceneProps {
  readonly observer: SkyEngineObserver
  readonly objects: readonly SkyEngineSceneObject[]
  readonly sunState: SkyEngineSunState
  readonly selectedObjectId: string | null
  readonly onSelectObject: (objectId: string | null) => void
  readonly onAtmosphereStatusChange: (status: SkyEngineAtmosphereStatus) => void
}

interface RenderedObjectRefs {
  marker: Mesh
  label: Mesh
  selectionRing: Mesh
  meshes: Mesh[]
  pickMesh: Mesh
  markerMaterial: StandardMaterial
  labelMaterial: StandardMaterial
  selectionMaterial: StandardMaterial
  labelTexture: DynamicTexture
  selectedLabelTexture: DynamicTexture
  baseColor: Color3
  object: SkyEngineSceneObject
  markerBaseAlpha: number
  labelBaseAlpha: number
  pickRadiusPx: number
  twinklePhase: number
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

const SKY_RADIUS = 120
const HORIZON_RADIUS = SKY_RADIUS * 0.92
const LABEL_WIDTH = 11.2
const LABEL_HEIGHT = 3.15
const SKY_ENGINE_SCENE_STATE_ATTRIBUTE = 'data-sky-engine-scene-state'
const SKY_ENGINE_GROUND_TEXTURE_URL = '/sky-engine-assets/oras-grass.jpg'
const TRAJECTORY_HOUR_OFFSETS = Array.from({ length: 25 }, (_, index) => index - 12)
const CARDINAL_MARKERS = [
  { label: 'N', azimuthDeg: 0 },
  { label: 'E', azimuthDeg: 90 },
  { label: 'S', azimuthDeg: 180 },
  { label: 'W', azimuthDeg: 270 },
] as const
const MAX_PRIORITY_STAR_LABELS = 3

type LabelVariant = 'cardinal' | 'priority' | 'selected' | 'temporary'

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
  const texture = new DynamicTexture(`sky-engine-label-${text}`, { width: 512, height: 128 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const isSelected = variant === 'selected'
  const isTemporary = variant === 'temporary'
  const isCardinal = variant === 'cardinal'
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
  }

  context.clearRect(0, 0, 512, 128)
  context.fillStyle = background
  context.beginPath()
  context.roundRect(14, 20, 484, 88, isSelected ? 32 : 26)
  context.fill()
  context.strokeStyle = stroke
  context.lineWidth = isSelected ? 4.5 : 2
  context.stroke()
  context.fillStyle = '#eff8ff'
  context.font = isSelected ? '600 42px sans-serif' : '600 36px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.shadowColor = 'rgba(0, 0, 0, 0.55)'
  context.shadowBlur = isSelected ? 14 : 7
  context.fillText(text, 256, 64)
  texture.update()

  return texture
}

function buildStarPointTexture(name: string) {
  const texture = new DynamicTexture(name, { width: 48, height: 48 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  context.clearRect(0, 0, 48, 48)

  const halo = context.createRadialGradient(24, 24, 0.75, 24, 24, 6)
  halo.addColorStop(0, 'rgba(255,255,255,1)')
  halo.addColorStop(0.18, 'rgba(255,255,255,0.96)')
  halo.addColorStop(0.34, 'rgba(255,255,255,0.34)')
  halo.addColorStop(0.72, 'rgba(255,255,255,0.08)')
  halo.addColorStop(1, 'rgba(255,255,255,0)')

  context.fillStyle = halo
  context.beginPath()
  context.arc(24, 24, 6, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = 'rgba(255,255,255,1)'
  context.beginPath()
  context.arc(24, 24, 1.35, 0, Math.PI * 2)
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

function buildSelectionRingTexture() {
  const texture = new DynamicTexture('sky-engine-selection-ring', { width: 128, height: 128 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  context.clearRect(0, 0, 128, 128)
  context.strokeStyle = 'rgba(255,255,255,0.94)'
  context.lineWidth = 8
  context.beginPath()
  context.arc(64, 64, 42, 0, Math.PI * 2)
  context.stroke()

  context.strokeStyle = 'rgba(255,255,255,0.22)'
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

function writeSceneState(
  canvas: HTMLCanvasElement,
  selectedObjectId: string | null,
  trajectoryObjectId: string | null,
  visibleLabelIds: readonly string[],
  groundTextureMode: 'oras-grass.jpg_tiled',
  groundTextureAssetPath: string,
) {
  canvas.setAttribute(
    SKY_ENGINE_SCENE_STATE_ATTRIBUTE,
    JSON.stringify({
      horizonVisible: true,
      cardinals: CARDINAL_MARKERS.map((marker) => marker.label),
      selectedObjectId,
      trajectoryObjectId,
      visibleLabelIds,
      groundTextureMode,
      groundTextureAssetPath,
    }),
  )
}

function clearSceneState(canvas: HTMLCanvasElement) {
  canvas.removeAttribute(SKY_ENGINE_SCENE_STATE_ATTRIBUTE)
}

function buildInitialViewTarget(objects: readonly SkyEngineSceneObject[]) {
  const preferredObjects = objects.filter(
    (object) => object.source === 'computed_real_sky' && object.isAboveHorizon,
  )
  const targetObjects = preferredObjects.length > 0 ? preferredObjects : objects.filter((object) => object.isAboveHorizon)

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
    Math.max(0.16, direction.y * 0.68 + 0.12),
    direction.z,
  ).normalize()

  return horizonBiasedDirection.scale(90)
}

function getMarkerDiameter(object: SkyEngineSceneObject) {
  if (object.source === 'computed_real_sky') {
    const normalizedMagnitude = Math.min(1, Math.max(0, 1 - (object.magnitude + 1.5) / 7.2))
    return 0.26 + normalizedMagnitude * 0.46
  }

  if (object.type === 'planet') {
    return 3.4
  }

  if (object.type === 'deep_sky') {
    return 2.8
  }

  return 2.4
}

function getPriorityLabelIds(objects: readonly SkyEngineSceneObject[]) {
  return new Set(
    objects
      .filter((object) => object.source === 'computed_real_sky' && object.isAboveHorizon)
      .sort((left, right) => left.magnitude - right.magnitude)
      .slice(0, MAX_PRIORITY_STAR_LABELS)
      .map((object) => object.id),
  )
}

function getLabelVisibility(
  refs: RenderedObjectRefs,
  isSelected: boolean,
  isComputedStar: boolean,
  isPriorityLabel: boolean,
  sunState: SkyEngineSunState,
) {
  if (!isSelected && !isPriorityLabel) {
    return 0
  }

  if (isSelected) {
    return 1
  }

  if (!isComputedStar) {
    return 0.88
  }

  return Math.max(0.64, sunState.visualCalibration.starLabelVisibility * 0.95)
}

function getLabelScale(isSelected: boolean, isPriorityLabel: boolean) {
  if (isSelected) {
    return 1.04
  }

  if (isPriorityLabel) {
    return 0.9
  }

  return 0.78
}

function applyRenderedObjectState(
  refs: RenderedObjectRefs,
  selectedObjectId: string | null,
  sunState: SkyEngineSunState,
  priorityLabelIds: ReadonlySet<string>,
) {
  const isSelected = refs.object.id === selectedObjectId
  const isComputedStar = refs.object.source === 'computed_real_sky'
  const isPriorityLabel = priorityLabelIds.has(refs.object.id)
  const markerVisibility = isComputedStar ? sunState.visualCalibration.starVisibility : 1
  const labelVisibility = getLabelVisibility(refs, isSelected, isComputedStar, isPriorityLabel, sunState)
  const labelScale = getLabelScale(isSelected, isPriorityLabel)

  const markerAlpha = refs.markerBaseAlpha * markerVisibility
  const labelAlpha = refs.labelBaseAlpha * labelVisibility
  const emissiveScale = isComputedStar ? 0.28 + markerVisibility * 0.5 : 0.92
  const labelBrightness = isComputedStar ? 0.72 + labelVisibility * 0.28 : 1

  refs.markerMaterial.alpha = Math.min(1, markerAlpha + (isSelected ? 0.08 : 0))
  refs.labelMaterial.alpha = Math.min(1, labelAlpha)
  refs.selectionMaterial.alpha = isSelected ? 0.96 : 0
  refs.markerMaterial.emissiveColor = refs.baseColor.scale(isSelected ? 1.18 : emissiveScale)
  refs.markerMaterial.diffuseColor = refs.baseColor.scale(isComputedStar ? 0.01 + markerVisibility * 0.03 : 0.16)
  refs.labelMaterial.emissiveColor = new Color3(labelBrightness, labelBrightness, labelBrightness)
  const activeLabelTexture = isSelected ? refs.selectedLabelTexture : refs.labelTexture
  refs.labelMaterial.diffuseTexture = activeLabelTexture
  refs.labelMaterial.opacityTexture = activeLabelTexture
  refs.label.isVisible = refs.labelMaterial.alpha > 0.02
  refs.selectionRing.isVisible = isSelected
  refs.selectionRing.scaling.setAll(isSelected ? 1.06 : 1)

  refs.marker.scaling.setAll(isSelected ? 1.1 : 1)
  refs.label.scaling.set(labelScale, labelScale, 1)

  refs.meshes.forEach((mesh) => {
    if (mesh !== refs.marker && mesh !== refs.selectionRing) {
      mesh.scaling.setAll(1)
    }
  })
}

function getPickRadiusPx(object: SkyEngineSceneObject) {
  if (object.source === 'computed_real_sky') {
    return 26
  }

  return object.type === 'planet' ? 24 : 22
}

function syncSceneSelectionState(
  runtime: SceneRuntimeRefs,
  renderedRefs: Record<string, RenderedObjectRefs>,
  observer: SkyEngineObserver,
  objects: readonly SkyEngineSceneObject[],
  selectedObjectId: string | null,
  sunState: SkyEngineSunState,
) {
  const selectedObject = objects.find((object) => object.id === selectedObjectId) ?? null
  const priorityLabelIds = getPriorityLabelIds(objects)

  Object.values(renderedRefs).forEach((refs) => {
    applyRenderedObjectState(refs, selectedObjectId, sunState, priorityLabelIds)
  })

  runtime.trajectoryMesh?.dispose()
  runtime.trajectoryMesh = null
  runtime.trajectoryMarkers.forEach((marker) => marker.dispose())
  runtime.trajectoryMarkers = []

  if (selectedObject?.source === 'computed_real_sky') {
    const trajectorySamples = computeObjectTrajectorySamples(
      observer,
      selectedObject.timestampIso ?? new Date().toISOString(),
      selectedObject,
      TRAJECTORY_HOUR_OFFSETS,
    )
      .filter((sample) => sample.altitudeDeg >= -2)
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
      trajectory.alpha = 0.58
      trajectory.isPickable = false
      runtime.trajectoryMesh = trajectory

      const lastTrajectoryPoint = trajectoryPoints[trajectoryPoints.length - 1]
      const anchorPoints = [trajectoryPoints[0], lastTrajectoryPoint]
      anchorPoints.forEach((point, index) => {
        if (!point) {
          return
        }

        const marker = MeshBuilder.CreatePlane(
          `sky-engine-trajectory-anchor-${selectedObject.id}-${index}`,
          { width: 1.35, height: 1.35 },
          runtime.scene,
        )
        marker.position = point.clone()
        marker.billboardMode = Mesh.BILLBOARDMODE_ALL
        marker.isPickable = false

        const material = new StandardMaterial(`sky-engine-trajectory-anchor-material-${selectedObject.id}-${index}`, runtime.scene)
        material.disableLighting = true
        material.backFaceCulling = false
        material.diffuseTexture = buildMarkerTexture(`sky-engine-trajectory-anchor-texture-${selectedObject.id}-${index}`)
        material.opacityTexture = material.diffuseTexture
        material.useAlphaFromDiffuseTexture = true
        material.emissiveColor = Color3.FromHexString(selectedObject.colorHex).scale(index === 0 ? 0.52 : 0.84)
        material.alpha = index === 0 ? 0.42 : 0.68
        marker.material = material
        runtime.trajectoryMarkers.push(marker)
      })
    }
  }

  const visibleLabelIds = Object.values(renderedRefs)
    .filter((refs) => refs.label.isVisible)
    .map((refs) => refs.object.id)

  writeSceneState(
    runtime.canvas,
    selectedObjectId,
    selectedObject?.source === 'computed_real_sky' ? selectedObject.id : null,
    visibleLabelIds.slice().sort((left, right) => left.localeCompare(right)),
    runtime.groundTextureMode,
    runtime.groundTextureAssetPath,
  )

  if (selectedObject?.isAboveHorizon) {
    runtime.targetVector = toSkyPosition(selectedObject.altitudeDeg, selectedObject.azimuthDeg, 90)
  }
}

export default function SkyEngineScene({
  observer,
  objects,
  sunState,
  selectedObjectId,
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

    syncSceneSelectionState(runtime, renderedObjectRefs.current, observer, objects, selectedObjectId, sunState)

    return undefined
  }, [objects, observer, selectedObjectId, sunState])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

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
    camera.setTarget(buildInitialViewTarget(objects))
    camera.attachControl(canvas, true)
    camera.inputs.attached.keyboard?.detachControl()
    camera.angularSensibility = 2400
    camera.speed = 0
    camera.minZ = 0.1
    camera.maxZ = SKY_RADIUS * 2
    camera.fov = 1.02

    const atmosphere = setupSkyAtmosphere(scene, camera, sunState)
    onAtmosphereStatusChange(atmosphere.status)

    const starSpriteTexture = buildStarPointTexture('sky-engine-star-sprite')
    const markerSpriteTexture = buildMarkerTexture('sky-engine-marker-sprite')
    const selectionRingTexture = buildSelectionRingTexture()
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
    const horizonMaterial = new StandardMaterial('sky-engine-horizon-material', scene)
    horizonMaterial.emissiveColor = Color3.FromHexString(calibration.horizonColorHex)
    horizonMaterial.alpha = 0.82
    horizonRing.material = horizonMaterial

    CARDINAL_MARKERS.forEach((marker) => {
      const markerPosition = toSkyPosition(0, marker.azimuthDeg, HORIZON_RADIUS)

      const post = MeshBuilder.CreateCylinder(
        `sky-engine-cardinal-post-${marker.label}`,
        { height: 2.8, diameter: 0.14 },
        scene,
      )
      post.position = new Vector3(markerPosition.x, 1.4, markerPosition.z)
      post.isPickable = false

      const postMaterial = new StandardMaterial(`sky-engine-cardinal-post-material-${marker.label}`, scene)
      postMaterial.disableLighting = true
      postMaterial.emissiveColor = Color3.FromHexString(calibration.horizonColorHex).scale(0.92)
      post.material = postMaterial

      const label = MeshBuilder.CreatePlane(
        `sky-engine-cardinal-label-${marker.label}`,
        { width: 5.6, height: 2.6 },
        scene,
      )
      label.position = new Vector3(markerPosition.x, 4.4, markerPosition.z)
      label.billboardMode = Mesh.BILLBOARDMODE_ALL
      label.isPickable = false

      const labelMaterial = new StandardMaterial(`sky-engine-cardinal-label-material-${marker.label}`, scene)
      labelMaterial.disableLighting = true
      labelMaterial.diffuseTexture = buildLabelTexture(marker.label, 'cardinal')
      labelMaterial.opacityTexture = labelMaterial.diffuseTexture
      labelMaterial.useAlphaFromDiffuseTexture = true
      labelMaterial.backFaceCulling = false
      labelMaterial.emissiveColor = Color3.FromHexString(calibration.horizonColorHex)
      labelMaterial.alpha = 0.92
      label.material = labelMaterial
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
      markerMaterial.diffuseTexture = object.source === 'computed_real_sky' ? starSpriteTexture : markerSpriteTexture
      markerMaterial.opacityTexture = markerMaterial.diffuseTexture
      markerMaterial.useAlphaFromDiffuseTexture = true
      marker.material = markerMaterial

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
      label.position = position.add(new Vector3(0, 4.6, 0))
      label.billboardMode = Mesh.BILLBOARDMODE_ALL
      label.isPickable = false
      label.isVisible = false
      label.metadata = { objectId: object.id, objectName: object.name, pickRole: 'label' }

      const labelTexture = buildLabelTexture(object.name, object.source === 'temporary_scene_seed' ? 'temporary' : 'priority')
      const selectedLabelTexture = buildLabelTexture(object.name, 'selected')
      const labelMaterial = new StandardMaterial(`sky-label-material-${object.id}`, scene)
      labelMaterial.disableLighting = true
      labelMaterial.emissiveColor = new Color3(1, 1, 1)
      labelMaterial.opacityTexture = labelTexture
      labelMaterial.diffuseTexture = labelTexture
      labelMaterial.useAlphaFromDiffuseTexture = true
      labelMaterial.backFaceCulling = false
      label.material = labelMaterial

      const markerBaseAlpha = object.source === 'temporary_scene_seed' ? 0.74 : 1
      const labelBaseAlpha = object.source === 'temporary_scene_seed' ? 0.84 : 1
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
        meshes: [marker, selectionRing, label, pickCollider],
        pickMesh: pickCollider,
        markerMaterial,
        labelMaterial,
        selectionMaterial,
        labelTexture,
        selectedLabelTexture,
        baseColor: Color3.FromHexString(object.colorHex),
        object,
        markerBaseAlpha,
        labelBaseAlpha,
        pickRadiusPx: getPickRadiusPx(object),
        twinklePhase: hashObjectPhase(object.id),
      }

      applyRenderedObjectState(
        renderedObjectRefs.current[object.id],
        selectedObjectId,
        sunState,
        getPriorityLabelIds(objects),
      )
    })

    syncSceneSelectionState(runtimeRefs.current, renderedObjectRefs.current, observer, objects, selectedObjectId, sunState)

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
          if (refs.object.source !== 'computed_real_sky') {
            return
          }

          const twinkleAmount = 1 + Math.sin(animationTime * 1.6 + refs.twinklePhase) * 0.035 * starVisibility
          const isSelected = refs.object.id === selectedObjectId
          refs.marker.scaling.setAll((isSelected ? 1.1 : 1) * twinkleAmount)
          refs.selectionRing.scaling.setAll(isSelected ? 1.04 + Math.sin(animationTime * 2.2) * 0.05 : 1)
          refs.markerMaterial.emissiveColor = refs.baseColor.scale(
            (isSelected ? 0.88 : 0.42) + starVisibility * (0.48 + (twinkleAmount - 1) * 1.6),
          )
        })

        horizonBlendMaterial.alpha = groundShading.horizonAlpha + Math.sin(animationTime * 0.42) * 0.015
        horizonNearBandMaterial.alpha = Math.max(0.12, groundShading.horizonAlpha - 0.05 + Math.sin(animationTime * 0.6) * 0.012)
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
      atmosphere.dispose()
      scene.dispose()
      engine.dispose()
      renderedObjectRefs.current = {}
    }
  }, [objects, observer, onAtmosphereStatusChange, onSelectObject, sunState])

  return <canvas ref={canvasRef} className="sky-engine-scene__canvas" aria-label="Sky Engine scene" />
}