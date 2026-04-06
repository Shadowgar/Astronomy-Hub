import React, { useEffect, useRef } from 'react'

import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import '@babylonjs/core/Culling/ray'
import { Engine } from '@babylonjs/core/Engines/engine'
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { Scene } from '@babylonjs/core/scene'

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
  meshes: Mesh[]
  pickMesh: Mesh
  markerMaterial: StandardMaterial
  labelMaterial: StandardMaterial
  baseColor: Color3
  object: SkyEngineSceneObject
  markerBaseAlpha: number
  labelBaseAlpha: number
  pickRadiusPx: number
}

const SKY_RADIUS = 120
const LABEL_SIZE = 10

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

function applyRenderedObjectState(refs: RenderedObjectRefs, selectedObjectId: string | null, sunState: SkyEngineSunState) {
  const isSelected = refs.object.id === selectedObjectId
  const isComputedStar = refs.object.source === 'computed_real_sky'
  const markerVisibility = isComputedStar ? sunState.visualCalibration.starVisibility : 1
  const labelVisibility = isComputedStar ? sunState.visualCalibration.starLabelVisibility : 1
  const markerAlpha = refs.markerBaseAlpha * markerVisibility
  const labelAlpha = refs.labelBaseAlpha * labelVisibility
  const emissiveScale = isComputedStar ? 0.48 + markerVisibility * 0.76 : 1
  const labelBrightness = isComputedStar ? 0.58 + labelVisibility * 0.42 : 1

  refs.markerMaterial.alpha = Math.min(1, markerAlpha + (isSelected ? 0.24 : 0))
  refs.labelMaterial.alpha = Math.min(1, labelAlpha + (isSelected ? 0.22 : 0))
  refs.markerMaterial.emissiveColor = refs.baseColor.scale(isSelected ? 1.45 : emissiveScale)
  refs.markerMaterial.diffuseColor = refs.baseColor.scale(isComputedStar ? 0.08 + markerVisibility * 0.18 : 0.22)
  refs.labelMaterial.emissiveColor = new Color3(labelBrightness, labelBrightness, labelBrightness)

  refs.meshes.forEach((mesh) => {
    mesh.scaling.setAll(isSelected ? 1.35 : 1)
  })
}

function getPickRadiusPx(object: SkyEngineSceneObject) {
  if (object.source === 'computed_real_sky') {
    return 28
  }

  return object.type === 'planet' ? 24 : 22
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
    scene.clearColor = new Color4(0.015, 0.024, 0.052, 1)

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

    const glowLayer = new GlowLayer('sky-engine-glow', scene, {
      blurKernelSize: 64,
    })
    glowLayer.intensity = 0.18 + calibration.starVisibility * 0.62

    const horizonRing = MeshBuilder.CreateTorus('sky-engine-horizon', {
      diameter: SKY_RADIUS * 1.6,
      thickness: 0.18,
      tessellation: 128,
    }, scene)
    horizonRing.rotation.x = Math.PI / 2
    const horizonMaterial = new StandardMaterial('sky-engine-horizon-material', scene)
    horizonMaterial.emissiveColor = Color3.FromHexString(calibration.horizonColorHex)
    horizonMaterial.alpha = 0.75
    horizonRing.material = horizonMaterial

    renderedObjectRefs.current = {}

    objects.forEach((object) => {
      const position = toSkyPosition(object.altitudeDeg, object.azimuthDeg, SKY_RADIUS)
      let markerDiameter = 2.6

      if (object.type === 'planet') {
        markerDiameter = 3.8
      } else if (object.type === 'deep_sky') {
        markerDiameter = 3.2
      } else if (object.source === 'computed_real_sky') {
        markerDiameter = 4.2
      }

      if (object.source === 'temporary_scene_seed') {
        markerDiameter -= 0.35
      }

      const marker = MeshBuilder.CreateSphere(`sky-object-${object.id}`, {
        diameter: markerDiameter,
        segments: 24,
      }, scene)
      marker.position = position
      marker.metadata = { objectId: object.id, objectName: object.name, pickRole: 'marker' }

      const markerMaterial = new StandardMaterial(`sky-object-material-${object.id}`, scene)
      markerMaterial.disableLighting = true
      markerMaterial.emissiveColor = Color3.FromHexString(object.colorHex)
      markerMaterial.diffuseColor = markerMaterial.emissiveColor.scale(0.22)
      marker.material = markerMaterial

      const label = MeshBuilder.CreatePlane(`sky-label-${object.id}`, {
        width: object.source === 'computed_real_sky' ? LABEL_SIZE * 1.15 : LABEL_SIZE,
        height: LABEL_SIZE * 0.3,
      }, scene)
      label.position = position.add(new Vector3(0, 4.6, 0))
      label.billboardMode = Mesh.BILLBOARDMODE_ALL
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
        meshes: [marker, label, pickCollider],
        pickMesh: pickCollider,
        markerMaterial,
        labelMaterial,
        baseColor: Color3.FromHexString(object.colorHex),
        object,
        markerBaseAlpha,
        labelBaseAlpha,
        pickRadiusPx: getPickRadiusPx(object),
      }

      applyRenderedObjectState(renderedObjectRefs.current[object.id], selectedObjectId, sunState)
    })

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
      glowLayer.dispose()
      horizonMaterial.dispose()
      atmosphere.dispose()
      scene.dispose()
      engine.dispose()
      renderedObjectRefs.current = {}
    }
  }, [objects, observer, onAtmosphereStatusChange, onSelectObject, sunState])

  useEffect(() => {
    Object.values(renderedObjectRefs.current).forEach((refs) => {
      applyRenderedObjectState(refs, selectedObjectId, sunState)
    })
  }, [selectedObjectId, sunState])

  return <canvas ref={canvasRef} className="sky-engine-scene__canvas" aria-label="Sky Engine scene" />
}