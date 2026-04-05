import React, { useEffect, useRef } from 'react'

import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
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
import type { SkyEngineAtmosphereStatus, SkyEngineObserver, SkyEngineSceneObject } from './types'

interface SkyEngineSceneProps {
  readonly observer: SkyEngineObserver
  readonly objects: readonly SkyEngineSceneObject[]
  readonly selectedObjectId: string | null
  readonly onSelectObject: (objectId: string | null) => void
  readonly onAtmosphereStatusChange: (status: SkyEngineAtmosphereStatus) => void
}

interface RenderedObjectRefs {
  meshes: Mesh[]
  material: StandardMaterial
  baseColor: Color3
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

  const context = texture.getContext()
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

export default function SkyEngineScene({
  observer,
  objects,
  selectedObjectId,
  onSelectObject,
  onAtmosphereStatusChange,
}: SkyEngineSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const renderedObjectRefs = useRef<Record<string, RenderedObjectRefs>>({})

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const engine = new Engine(canvas, true, {
      antialias: true,
      preserveDrawingBuffer: false,
      stencil: true,
    })
    const scene = new Scene(engine)
    scene.clearColor = new Color4(0.015, 0.024, 0.052, 1)

    const camera = new ArcRotateCamera('sky-engine-camera', -Math.PI / 2, Math.PI / 2.1, 0.12, Vector3.Zero(), scene)
    camera.attachControl(canvas, true)
    camera.lowerRadiusLimit = 0.05
    camera.upperRadiusLimit = 0.24
    camera.panningSensibility = 0
    camera.wheelPrecision = 40
    camera.pinchPrecision = 20
    camera.minZ = 0.001
    camera.fov = 1.18

    const atmosphere = setupSkyAtmosphere(scene, camera)
    onAtmosphereStatusChange(atmosphere.status)

    const glowLayer = new GlowLayer('sky-engine-glow', scene, {
      blurKernelSize: 64,
    })
    glowLayer.intensity = 0.8

    const horizonRing = MeshBuilder.CreateTorus('sky-engine-horizon', {
      diameter: SKY_RADIUS * 1.6,
      thickness: 0.18,
      tessellation: 128,
    }, scene)
    horizonRing.rotation.x = Math.PI / 2
    const horizonMaterial = new StandardMaterial('sky-engine-horizon-material', scene)
    horizonMaterial.emissiveColor = new Color3(0.21, 0.31, 0.47)
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
      }

      const marker = MeshBuilder.CreateSphere(`sky-object-${object.id}`, {
        diameter: markerDiameter,
        segments: 24,
      }, scene)
      marker.position = position
      marker.metadata = { objectId: object.id }

      const markerMaterial = new StandardMaterial(`sky-object-material-${object.id}`, scene)
      markerMaterial.disableLighting = true
      markerMaterial.emissiveColor = Color3.FromHexString(object.colorHex)
      markerMaterial.diffuseColor = markerMaterial.emissiveColor.scale(0.22)
      marker.material = markerMaterial

      const label = MeshBuilder.CreatePlane(`sky-label-${object.id}`, {
        width: LABEL_SIZE,
        height: LABEL_SIZE * 0.3,
      }, scene)
      label.position = position.add(new Vector3(0, 4.6, 0))
      label.billboardMode = Mesh.BILLBOARDMODE_ALL
      label.metadata = { objectId: object.id }

      const labelMaterial = new StandardMaterial(`sky-label-material-${object.id}`, scene)
      labelMaterial.disableLighting = true
      labelMaterial.emissiveColor = new Color3(1, 1, 1)
      labelMaterial.opacityTexture = buildLabelTexture(object.name)
      labelMaterial.diffuseTexture = labelMaterial.opacityTexture
      labelMaterial.useAlphaFromDiffuseTexture = true
      labelMaterial.backFaceCulling = false
      label.material = labelMaterial

      renderedObjectRefs.current[object.id] = {
        meshes: [marker, label],
        material: markerMaterial,
        baseColor: Color3.FromHexString(object.colorHex),
      }
    })

    scene.onPointerDown = (_, pickInfo) => {
      const objectId = pickInfo.pickedMesh?.metadata?.objectId
      onSelectObject(typeof objectId === 'string' ? objectId : null)
    }

    const handleResize = () => engine.resize()
    globalThis.addEventListener('resize', handleResize)

    engine.runRenderLoop(() => {
      scene.render()
    })

    return () => {
      globalThis.removeEventListener('resize', handleResize)
      glowLayer.dispose()
      horizonMaterial.dispose()
      atmosphere.dispose()
      scene.dispose()
      engine.dispose()
      renderedObjectRefs.current = {}
    }
  }, [objects, observer, onAtmosphereStatusChange, onSelectObject])

  useEffect(() => {
    Object.entries(renderedObjectRefs.current).forEach(([objectId, refs]) => {
      const isSelected = objectId === selectedObjectId
      refs.material.emissiveColor = isSelected ? refs.baseColor.scale(1.3) : refs.baseColor.clone()

      refs.meshes.forEach((mesh) => {
        mesh.scaling.setAll(isSelected ? 1.35 : 1)
      })
    })
  }, [selectedObjectId])

  return <canvas ref={canvasRef} className="sky-engine-scene__canvas" aria-label="Sky Engine scene" />
}