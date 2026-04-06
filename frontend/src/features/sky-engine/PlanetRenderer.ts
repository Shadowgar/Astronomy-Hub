import { Color3 } from '@babylonjs/core/Maths/math.color'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import type { Scene } from '@babylonjs/core/scene'

import { buildLabelTexture, getLabelAnchorPosition, getLabelVariantForObject, type LabelRenderRef } from './labelManager'
import { getSkyEnginePickColliderDiameter } from './pickTargets'
import type { SkyObjectRenderer, SkyRendererPickEntry, SkyRendererSyncInput } from './skyRendererContracts'
import { toSkyPosition } from './skyDomeMath'
import type { SkyEngineSceneObject } from './types'

const LABEL_WIDTH = 12
const LABEL_HEIGHT = 3.25

interface PlanetRenderEntry extends LabelRenderRef {
  readonly pointMesh: Mesh
  readonly discMesh: Mesh
  readonly textureMesh: Mesh
  readonly pickMesh: Mesh
  readonly pointMaterial: StandardMaterial
  readonly discMaterial: StandardMaterial
  readonly textureMaterial: StandardMaterial
  readonly labelTexture: DynamicTexture
  readonly pointTexture: DynamicTexture
  readonly discTexture: DynamicTexture
  readonly surfaceTexture: DynamicTexture
  readonly pickRadiusPx: number
  object: SkyEngineSceneObject
}

function buildGlowTexture(name: string, colorHex: string, radius = 32) {
  const texture = new DynamicTexture(name, { width: 96, height: 96 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const color = Color3.FromHexString(colorHex)
  const red = Math.round(color.r * 255)
  const green = Math.round(color.g * 255)
  const blue = Math.round(color.b * 255)
  const gradient = context.createRadialGradient(48, 48, 3, 48, 48, radius)

  gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0.96)`)
  gradient.addColorStop(0.28, `rgba(${red}, ${green}, ${blue}, 0.74)`)
  gradient.addColorStop(0.72, `rgba(${red}, ${green}, ${blue}, 0.16)`)
  gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`)
  context.clearRect(0, 0, 96, 96)
  context.fillStyle = gradient
  context.beginPath()
  context.arc(48, 48, radius, 0, Math.PI * 2)
  context.fill()
  texture.update()

  return texture
}

function buildPlanetSurfaceTexture(name: string, colorHex: string) {
  const texture = new DynamicTexture(name, { width: 192, height: 192 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const color = Color3.FromHexString(colorHex)
  const red = Math.round(color.r * 255)
  const green = Math.round(color.g * 255)
  const blue = Math.round(color.b * 255)
  const base = context.createRadialGradient(96, 96, 24, 96, 96, 84)

  base.addColorStop(0, `rgba(${Math.min(255, red + 30)}, ${Math.min(255, green + 24)}, ${Math.min(255, blue + 24)}, 0.98)`)
  base.addColorStop(1, `rgba(${Math.max(0, red - 18)}, ${Math.max(0, green - 20)}, ${Math.max(0, blue - 22)}, 0.98)`)
  context.clearRect(0, 0, 192, 192)
  context.fillStyle = base
  context.beginPath()
  context.arc(96, 96, 82, 0, Math.PI * 2)
  context.fill()

  context.strokeStyle = `rgba(${Math.max(0, red - 42)}, ${Math.max(0, green - 38)}, ${Math.max(0, blue - 34)}, 0.24)`
  context.lineWidth = 8
  ;[72, 96, 120].forEach((yPosition) => {
    context.beginPath()
    context.moveTo(36, yPosition)
    context.quadraticCurveTo(96, yPosition - 10, 156, yPosition)
    context.stroke()
  })
  texture.update()

  return texture
}

function createPlanetEntry(scene: Scene, object: SkyEngineSceneObject): PlanetRenderEntry {
  const pointTexture = buildGlowTexture(`sky-engine-planet-point-${object.id}`, object.colorHex)
  const discTexture = buildGlowTexture(`sky-engine-planet-disc-${object.id}`, object.colorHex, 24)
  const surfaceTexture = buildPlanetSurfaceTexture(`sky-engine-planet-surface-${object.id}`, object.colorHex)
  const labelTexture = buildLabelTexture(object.name, getLabelVariantForObject(object))

  const pointMesh = MeshBuilder.CreatePlane(`sky-engine-planet-point-${object.id}`, { width: 1, height: 1 }, scene)
  pointMesh.billboardMode = Mesh.BILLBOARDMODE_ALL
  pointMesh.isPickable = false
  const pointMaterial = new StandardMaterial(`sky-engine-planet-point-material-${object.id}`, scene)
  pointMaterial.disableLighting = true
  pointMaterial.backFaceCulling = false
  pointMaterial.diffuseTexture = pointTexture
  pointMaterial.opacityTexture = pointTexture
  pointMaterial.useAlphaFromDiffuseTexture = true
  pointMesh.material = pointMaterial

  const discMesh = MeshBuilder.CreatePlane(`sky-engine-planet-disc-${object.id}`, { width: 1, height: 1 }, scene)
  discMesh.billboardMode = Mesh.BILLBOARDMODE_ALL
  discMesh.isPickable = false
  const discMaterial = new StandardMaterial(`sky-engine-planet-disc-material-${object.id}`, scene)
  discMaterial.disableLighting = true
  discMaterial.backFaceCulling = false
  discMaterial.diffuseTexture = discTexture
  discMaterial.opacityTexture = discTexture
  discMaterial.useAlphaFromDiffuseTexture = true
  discMesh.material = discMaterial

  const textureMesh = MeshBuilder.CreatePlane(`sky-engine-planet-texture-${object.id}`, { width: 1, height: 1 }, scene)
  textureMesh.billboardMode = Mesh.BILLBOARDMODE_ALL
  textureMesh.isPickable = false
  const textureMaterial = new StandardMaterial(`sky-engine-planet-texture-material-${object.id}`, scene)
  textureMaterial.disableLighting = true
  textureMaterial.backFaceCulling = false
  textureMaterial.diffuseTexture = surfaceTexture
  textureMaterial.opacityTexture = surfaceTexture
  textureMaterial.useAlphaFromDiffuseTexture = true
  textureMesh.material = textureMaterial

  const label = MeshBuilder.CreatePlane(`sky-engine-planet-label-${object.id}`, { width: LABEL_WIDTH, height: LABEL_HEIGHT }, scene)
  label.billboardMode = Mesh.BILLBOARDMODE_ALL
  label.isPickable = false
  label.isVisible = false
  const labelMaterial = new StandardMaterial(`sky-engine-planet-label-material-${object.id}`, scene)
  labelMaterial.disableLighting = true
  labelMaterial.backFaceCulling = false
  labelMaterial.diffuseTexture = labelTexture
  labelMaterial.opacityTexture = labelTexture
  labelMaterial.useAlphaFromDiffuseTexture = true
  labelMaterial.emissiveColor = Color3.White()
  label.material = labelMaterial

  const pickMesh = MeshBuilder.CreateSphere(
    `sky-engine-planet-pick-${object.id}`,
    { diameter: getSkyEnginePickColliderDiameter(object), segments: 12 },
    scene,
  )
  pickMesh.isPickable = true
  const pickMaterial = new StandardMaterial(`sky-engine-planet-pick-material-${object.id}`, scene)
  pickMaterial.disableLighting = true
  pickMaterial.alpha = 0.001
  pickMesh.material = pickMaterial

  return {
    pointMesh,
    discMesh,
    textureMesh,
    pickMesh,
    pointMaterial,
    discMaterial,
    textureMaterial,
    label,
    labelMaterial,
    labelTexture,
    pointTexture,
    discTexture,
    surfaceTexture,
    object,
    pickRadiusPx: 24,
    currentLabelAlpha: 0,
    currentLabelScale: 0.82,
  }
}

export function createPlanetRenderer(scene: Scene): SkyObjectRenderer {
  const entries = new Map<string, PlanetRenderEntry>()

  return {
    sync({ objects, selectedObjectId, guidedObjectIds, lod }: SkyRendererSyncInput) {
      const planetObjects = objects.filter((object) => object.type === 'planet')
      const nextIds = new Set(planetObjects.map((object) => object.id))

      Array.from(entries.keys()).forEach((objectId) => {
        if (nextIds.has(objectId)) {
          return
        }

        const entry = entries.get(objectId)

        if (!entry) {
          return
        }

        entry.pointMesh.dispose()
        entry.discMesh.dispose()
        entry.textureMesh.dispose()
        entry.pickMesh.dispose()
        entry.label.dispose()
        entry.pointMaterial.dispose()
        entry.discMaterial.dispose()
        entry.textureMaterial.dispose()
        entry.labelMaterial.dispose()
        entry.labelTexture.dispose()
        entry.pointTexture.dispose()
        entry.discTexture.dispose()
        entry.surfaceTexture.dispose()
        entries.delete(objectId)
      })

      planetObjects.forEach((object) => {
        let entry = entries.get(object.id)

        if (!entry) {
          entry = createPlanetEntry(scene, object)
          entries.set(object.id, entry)
        }

        entry.object = object
        const isSelected = object.id === selectedObjectId
        const isGuided = guidedObjectIds.has(object.id)
        const position = toSkyPosition(object.altitudeDeg, object.azimuthDeg)
        const apparentBoost = 1 + (object.apparentSizeDeg ?? 0.02) * 28
        const pointSize = 0.55 * apparentBoost * (1 + lod.wideBlend * 0.3)
        const discSize = 0.85 * apparentBoost * (1 + lod.mediumBlend * 0.55 + lod.closeBlend * 0.2)
        const textureSize = 1.05 * apparentBoost * (1 + lod.closeBlend * 0.9)

        ;[entry.pointMesh, entry.discMesh, entry.textureMesh, entry.pickMesh].forEach((mesh) => mesh.position.copyFrom(position))
        entry.label.position = getLabelAnchorPosition(position, object)

        entry.pointMesh.scaling.set(pointSize * (isSelected ? 1.18 : 1), pointSize * (isSelected ? 1.18 : 1), 1)
        entry.discMesh.scaling.set(discSize * (isSelected ? 1.12 : 1), discSize * (isSelected ? 1.12 : 1), 1)
        entry.textureMesh.scaling.set(textureSize, textureSize, 1)

        entry.pointMaterial.emissiveColor = Color3.FromHexString(object.colorHex).scale(isGuided ? 1.18 : 0.98)
        entry.discMaterial.emissiveColor = Color3.FromHexString(object.colorHex).scale(0.88)
        entry.textureMaterial.emissiveColor = Color3.White().scale(0.96)

        entry.pointMaterial.alpha = Math.min(1, 0.84 * lod.wideBlend + 0.34 * lod.mediumBlend + (isSelected ? 0.12 : 0))
        entry.discMaterial.alpha = Math.min(1, 0.16 * lod.wideBlend + 0.82 * lod.mediumBlend + 0.42 * lod.closeBlend)
        entry.textureMaterial.alpha = Math.min(1, 0.06 * lod.mediumBlend + 0.88 * lod.closeBlend)
      })
    },

    getPickEntries() {
      return Array.from(entries.values()).map<SkyRendererPickEntry>((entry) => ({
        object: entry.object,
        pickMesh: entry.pickMesh,
        pickRadiusPx: entry.pickRadiusPx,
      }))
    },

    getLabelRefs() {
      return Object.fromEntries(Array.from(entries.values()).map((entry) => [entry.object.id, entry]))
    },

    getAnchor(objectId: string) {
      return entries.get(objectId)?.discMesh.getAbsolutePosition().clone() ?? null
    },

    dispose() {
      entries.forEach((entry) => {
        entry.pointMesh.dispose()
        entry.discMesh.dispose()
        entry.textureMesh.dispose()
        entry.pickMesh.dispose()
        entry.label.dispose()
        entry.pointMaterial.dispose()
        entry.discMaterial.dispose()
        entry.textureMaterial.dispose()
        entry.labelMaterial.dispose()
        entry.labelTexture.dispose()
        entry.pointTexture.dispose()
        entry.discTexture.dispose()
        entry.surfaceTexture.dispose()
      })
      entries.clear()
    },
  }
}
