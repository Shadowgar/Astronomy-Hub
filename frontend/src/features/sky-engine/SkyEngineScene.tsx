import React, { useEffect, useRef } from 'react'

import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import '@babylonjs/core/Culling/ray'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
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
  baseColor: Color3
  object: SkyEngineSceneObject
  markerBaseAlpha: number
  labelBaseAlpha: number
  pickRadiusPx: number
}

interface SceneRuntimeRefs {
  scene: Scene
  engine: Engine
  camera: UniversalCamera
  canvas: HTMLCanvasElement
  trajectoryMesh: Mesh | null
}

const SKY_RADIUS = 120
const HORIZON_RADIUS = SKY_RADIUS * 0.92
const LABEL_SIZE = 10
const SKY_ENGINE_SCENE_STATE_ATTRIBUTE = 'data-sky-engine-scene-state'
const TRAJECTORY_HOUR_OFFSETS = Array.from({ length: 25 }, (_, index) => index - 12)
const CARDINAL_MARKERS = [
  { label: 'N', azimuthDeg: 0 },
  { label: 'E', azimuthDeg: 90 },
  { label: 'S', azimuthDeg: 180 },
  { label: 'W', azimuthDeg: 270 },
] as const

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

function buildLabelTexture(text: string) {
  const texture = new DynamicTexture(`sky-engine-label-${text}`, { width: 512, height: 128 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  context.clearRect(0, 0, 512, 128)
  context.fillStyle = 'rgba(7, 13, 23, 0.8)'
  context.fillRect(0, 20, 512, 88)
  context.strokeStyle = 'rgba(158, 210, 255, 0.85)'
  context.lineWidth = 4
  context.strokeRect(10, 20, 492, 88)
  context.fillStyle = '#eff8ff'
  context.font = 'bold 42px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, 256, 64)
  texture.update()

  return texture
}

function buildSpriteTexture(name: string, edgeAlpha: number) {
  const texture = new DynamicTexture(name, { width: 128, height: 128 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  context.clearRect(0, 0, 128, 128)

  const halo = context.createRadialGradient(64, 64, 6, 64, 64, 58)
  halo.addColorStop(0, 'rgba(255,255,255,1)')
  halo.addColorStop(0.18, 'rgba(255,255,255,0.98)')
  halo.addColorStop(0.34, 'rgba(255,255,255,0.52)')
  halo.addColorStop(0.62, `rgba(255,255,255,${edgeAlpha})`)
  halo.addColorStop(1, 'rgba(255,255,255,0)')

  context.fillStyle = halo
  context.beginPath()
  context.arc(64, 64, 58, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = 'rgba(255,255,255,1)'
  context.beginPath()
  context.arc(64, 64, 8, 0, Math.PI * 2)
  context.fill()
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

function writeSceneState(canvas: HTMLCanvasElement, selectedObjectId: string | null, trajectoryObjectId: string | null) {
  canvas.setAttribute(
    SKY_ENGINE_SCENE_STATE_ATTRIBUTE,
    JSON.stringify({
      horizonVisible: true,
      cardinals: CARDINAL_MARKERS.map((marker) => marker.label),
      selectedObjectId,
      trajectoryObjectId,
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

  return total.scale(1 / targetObjects.length).normalize().scale(90)
}

function getMarkerDiameter(object: SkyEngineSceneObject) {
  if (object.source === 'computed_real_sky') {
    const brightnessBoost = Math.max(0, Math.min(2.2, 2.6 - object.magnitude))
    return 1.35 + brightnessBoost * 0.48
  }

  if (object.type === 'planet') {
    return 3.4
  }

  if (object.type === 'deep_sky') {
    return 2.8
  }

  return 2.4
}

function applyRenderedObjectState(refs: RenderedObjectRefs, selectedObjectId: string | null, sunState: SkyEngineSunState) {
  const isSelected = refs.object.id === selectedObjectId
  const isComputedStar = refs.object.source === 'computed_real_sky'
  const markerVisibility = isComputedStar ? sunState.visualCalibration.starVisibility : 1
  const showLabel = isSelected || refs.object.source === 'temporary_scene_seed'
  let labelVisibility = 0

  if (showLabel) {
    labelVisibility = isComputedStar ? Math.max(0.72, sunState.visualCalibration.starLabelVisibility) : 0.84
  }

  const markerAlpha = refs.markerBaseAlpha * markerVisibility
  const labelAlpha = refs.labelBaseAlpha * labelVisibility
  const emissiveScale = isComputedStar ? 0.42 + markerVisibility * 0.7 : 0.92
  const labelBrightness = isComputedStar ? 0.72 + labelVisibility * 0.28 : 1

  refs.markerMaterial.alpha = Math.min(1, markerAlpha + (isSelected ? 0.24 : 0))
  refs.labelMaterial.alpha = Math.min(1, labelAlpha)
  refs.selectionMaterial.alpha = isSelected ? 0.96 : 0
  refs.markerMaterial.emissiveColor = refs.baseColor.scale(isSelected ? 1.3 : emissiveScale)
  refs.markerMaterial.diffuseColor = refs.baseColor.scale(isComputedStar ? 0.04 + markerVisibility * 0.12 : 0.18)
  refs.labelMaterial.emissiveColor = new Color3(labelBrightness, labelBrightness, labelBrightness)
  refs.label.isVisible = refs.labelMaterial.alpha > 0.02
  refs.selectionRing.isVisible = isSelected
  refs.selectionRing.scaling.setAll(isSelected ? 1.06 : 1)

  refs.marker.scaling.setAll(isSelected ? 1.18 : 1)

  refs.meshes.forEach((mesh) => {
    if (mesh !== refs.marker && mesh !== refs.selectionRing) {
      mesh.scaling.setAll(1)
    }
  })
}

function getPickRadiusPx(object: SkyEngineSceneObject) {
  if (object.source === 'computed_real_sky') {
    return 28
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

  Object.values(renderedRefs).forEach((refs) => {
    applyRenderedObjectState(refs, selectedObjectId, sunState)
  })

  runtime.trajectoryMesh?.dispose()
  runtime.trajectoryMesh = null

  if (selectedObject?.source === 'computed_real_sky') {
    const trajectoryPoints = computeObjectTrajectorySamples(
      observer,
      selectedObject.timestampIso ?? new Date().toISOString(),
      selectedObject,
      TRAJECTORY_HOUR_OFFSETS,
    )
      .filter((sample) => sample.altitudeDeg >= -2)
      .map((sample) => toSkyPosition(sample.altitudeDeg, sample.azimuthDeg, SKY_RADIUS * 0.992))

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
      trajectory.alpha = 0.88
      trajectory.isPickable = false
      runtime.trajectoryMesh = trajectory
    }
  }

  writeSceneState(
    runtime.canvas,
    selectedObjectId,
    selectedObject?.source === 'computed_real_sky' ? selectedObject.id : null,
  )
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

    const starSpriteTexture = buildSpriteTexture('sky-engine-star-sprite', 0.08)
    const markerSpriteTexture = buildSpriteTexture('sky-engine-marker-sprite', 0.16)
    const selectionRingTexture = buildSelectionRingTexture()

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
    const groundMaterial = new StandardMaterial('sky-engine-ground-material', scene)
    groundMaterial.disableLighting = true
    groundMaterial.emissiveColor = Color3.FromHexString(calibration.backgroundColorHex).scale(0.18)
    groundMaterial.diffuseColor = Color3.FromHexString('#040810')
    groundMaterial.alpha = 0.96
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
    const localGroundMaterial = new StandardMaterial('sky-engine-local-ground-material', scene)
    localGroundMaterial.disableLighting = true
    localGroundMaterial.emissiveColor = Color3.FromHexString(calibration.horizonColorHex).scale(0.12)
    localGroundMaterial.diffuseColor = Color3.FromHexString('#07101c')
    localGroundMaterial.alpha = 0.84
    localGroundDisk.material = localGroundMaterial

    const horizonRing = MeshBuilder.CreateTorus('sky-engine-horizon', {
      diameter: HORIZON_RADIUS * 2,
      thickness: 0.24,
      tessellation: 128,
    }, scene)
    horizonRing.rotation.x = Math.PI / 2
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
      labelMaterial.diffuseTexture = buildLabelTexture(marker.label)
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
      markerMaterial.diffuseColor = markerMaterial.emissiveColor.scale(0.22)
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
        width: object.source === 'computed_real_sky' ? LABEL_SIZE * 1.15 : LABEL_SIZE,
        height: LABEL_SIZE * 0.3,
      }, scene)
      label.position = position.add(new Vector3(0, 4.6, 0))
      label.billboardMode = Mesh.BILLBOARDMODE_ALL
      label.isPickable = false
      label.isVisible = false
      label.metadata = { objectId: object.id, objectName: object.name, pickRole: 'label' }

      const labelMaterial = new StandardMaterial(`sky-label-material-${object.id}`, scene)
      labelMaterial.disableLighting = true
      labelMaterial.emissiveColor = new Color3(1, 1, 1)
      labelMaterial.opacityTexture = buildLabelTexture(object.name)
      labelMaterial.diffuseTexture = labelMaterial.opacityTexture
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
        baseColor: Color3.FromHexString(object.colorHex),
        object,
        markerBaseAlpha,
        labelBaseAlpha,
        pickRadiusPx: getPickRadiusPx(object),
      }

      applyRenderedObjectState(renderedObjectRefs.current[object.id], selectedObjectId, sunState)
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
      camera.fov = Math.min(1.22, Math.max(0.56, camera.fov + Math.sign(event.deltaY) * 0.045))
    }

    const handleResize = () => engine.resize()
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    globalThis.addEventListener('resize', handleResize)

    engine.runRenderLoop(() => {
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
      runtimeRefs.current = null
      starSpriteTexture.dispose()
      markerSpriteTexture.dispose()
      selectionRingTexture.dispose()
      groundMaterial.dispose()
      localGroundMaterial.dispose()
      horizonMaterial.dispose()
      atmosphere.dispose()
      scene.dispose()
      engine.dispose()
      renderedObjectRefs.current = {}
    }
  }, [objects, observer, onAtmosphereStatusChange, onSelectObject, sunState])

  return <canvas ref={canvasRef} className="sky-engine-scene__canvas" aria-label="Sky Engine scene" />
}