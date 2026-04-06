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

interface DsoRenderEntry extends LabelRenderRef {
  readonly hazeMesh: Mesh
  readonly symbolMesh: Mesh
  readonly pickMesh: Mesh
  readonly hazeMaterial: StandardMaterial
  readonly symbolMaterial: StandardMaterial
  readonly hazeTexture: DynamicTexture
  readonly symbolTexture: DynamicTexture
  readonly labelTexture: DynamicTexture
  object: SkyEngineSceneObject
  readonly pickRadiusPx: number
}

function buildDsoTexture(name: string, colorHex: string) {
  const texture = new DynamicTexture(name, { width: 128, height: 128 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const color = Color3.FromHexString(colorHex)
  const red = Math.round(color.r * 255)
  const green = Math.round(color.g * 255)
  const blue = Math.round(color.b * 255)
  const gradient = context.createRadialGradient(64, 64, 12, 64, 64, 54)

  gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0.44)`)
  gradient.addColorStop(0.52, `rgba(${red}, ${green}, ${blue}, 0.14)`)
  gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`)
  context.clearRect(0, 0, 128, 128)
  context.fillStyle = gradient
  context.beginPath()
  context.arc(64, 64, 54, 0, Math.PI * 2)
  context.fill()
  texture.update()

  return texture
}

function buildDsoSymbolTexture(name: string, colorHex: string) {
  const texture = new DynamicTexture(name, { width: 128, height: 128 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const color = Color3.FromHexString(colorHex)
  const red = Math.round(color.r * 255)
  const green = Math.round(color.g * 255)
  const blue = Math.round(color.b * 255)

  context.clearRect(0, 0, 128, 128)
  context.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.88)`
  context.lineWidth = 5
  context.beginPath()
  context.moveTo(64, 18)
  context.lineTo(104, 64)
  context.lineTo(64, 110)
  context.lineTo(24, 64)
  context.closePath()
  context.stroke()
  context.beginPath()
  context.arc(64, 64, 24, 0, Math.PI * 2)
  context.stroke()
  texture.update()

  return texture
}

function createDsoEntry(scene: Scene, object: SkyEngineSceneObject): DsoRenderEntry {
  const hazeTexture = buildDsoTexture(`sky-engine-dso-haze-${object.id}`, object.colorHex)
  const symbolTexture = buildDsoSymbolTexture(`sky-engine-dso-symbol-${object.id}`, object.colorHex)
  const labelTexture = buildLabelTexture(object.name, getLabelVariantForObject(object))

  const hazeMesh = MeshBuilder.CreatePlane(`sky-engine-dso-haze-${object.id}`, { width: 1, height: 1 }, scene)
  hazeMesh.billboardMode = Mesh.BILLBOARDMODE_ALL
  hazeMesh.isPickable = false
  const hazeMaterial = new StandardMaterial(`sky-engine-dso-haze-material-${object.id}`, scene)
  hazeMaterial.disableLighting = true
  hazeMaterial.backFaceCulling = false
  hazeMaterial.diffuseTexture = hazeTexture
  hazeMaterial.opacityTexture = hazeTexture
  hazeMaterial.useAlphaFromDiffuseTexture = true
  hazeMesh.material = hazeMaterial

  const symbolMesh = MeshBuilder.CreatePlane(`sky-engine-dso-symbol-${object.id}`, { width: 1, height: 1 }, scene)
  symbolMesh.billboardMode = Mesh.BILLBOARDMODE_ALL
  symbolMesh.isPickable = false
  const symbolMaterial = new StandardMaterial(`sky-engine-dso-symbol-material-${object.id}`, scene)
  symbolMaterial.disableLighting = true
  symbolMaterial.backFaceCulling = false
  symbolMaterial.diffuseTexture = symbolTexture
  symbolMaterial.opacityTexture = symbolTexture
  symbolMaterial.useAlphaFromDiffuseTexture = true
  symbolMaterial.emissiveColor = Color3.White()
  symbolMesh.material = symbolMaterial

  const label = MeshBuilder.CreatePlane(`sky-engine-dso-label-${object.id}`, { width: LABEL_WIDTH, height: LABEL_HEIGHT }, scene)
  label.billboardMode = Mesh.BILLBOARDMODE_ALL
  label.isPickable = false
  label.isVisible = false
  const labelMaterial = new StandardMaterial(`sky-engine-dso-label-material-${object.id}`, scene)
  labelMaterial.disableLighting = true
  labelMaterial.backFaceCulling = false
  labelMaterial.diffuseTexture = labelTexture
  labelMaterial.opacityTexture = labelTexture
  labelMaterial.useAlphaFromDiffuseTexture = true
  labelMaterial.emissiveColor = Color3.White()
  label.material = labelMaterial

  const pickMesh = MeshBuilder.CreateSphere(
    `sky-engine-dso-pick-${object.id}`,
    { diameter: getSkyEnginePickColliderDiameter(object), segments: 12 },
    scene,
  )
  pickMesh.isPickable = true
  const pickMaterial = new StandardMaterial(`sky-engine-dso-pick-material-${object.id}`, scene)
  pickMaterial.disableLighting = true
  pickMaterial.alpha = 0.001
  pickMesh.material = pickMaterial

  return {
    hazeMesh,
    symbolMesh,
    pickMesh,
    hazeMaterial,
    symbolMaterial,
    label,
    labelMaterial,
    hazeTexture,
    symbolTexture,
    labelTexture,
    object,
    pickRadiusPx: object.source === 'temporary_scene_seed' ? 13 : 16,
    currentLabelAlpha: 0,
    currentLabelScale: 0.82,
  }
}

export function createDsoRenderer(scene: Scene): SkyObjectRenderer {
  const entries = new Map<string, DsoRenderEntry>()

  return {
    sync({ objects, selectedObjectId, guidedObjectIds, lod }: SkyRendererSyncInput) {
      const dsoObjects = objects.filter((object) => object.type === 'deep_sky')
      const nextIds = new Set(dsoObjects.map((object) => object.id))

      Array.from(entries.keys()).forEach((objectId) => {
        if (nextIds.has(objectId)) {
          return
        }

        const entry = entries.get(objectId)

        if (!entry) {
          return
        }

        entry.hazeMesh.dispose()
        entry.symbolMesh.dispose()
        entry.pickMesh.dispose()
        entry.label.dispose()
        entry.hazeMaterial.dispose()
        entry.symbolMaterial.dispose()
        entry.labelMaterial.dispose()
        entry.hazeTexture.dispose()
        entry.symbolTexture.dispose()
        entry.labelTexture.dispose()
        entries.delete(objectId)
      })

      dsoObjects.forEach((object) => {
        let entry = entries.get(object.id)

        if (!entry) {
          entry = createDsoEntry(scene, object)
          entries.set(object.id, entry)
        }

        entry.object = object
        const isSelected = object.id === selectedObjectId
        const isGuided = guidedObjectIds.has(object.id)
        const position = toSkyPosition(object.altitudeDeg, object.azimuthDeg)
        const hazeScale = 1.1 + lod.mediumBlend * 0.8 + lod.closeBlend * 1.6
        const symbolScale = 0.9 + lod.mediumBlend * 0.45 + lod.closeBlend * 0.85
        const baseAlpha = object.source === 'temporary_scene_seed' ? 0.78 : 0.56

        ;[entry.hazeMesh, entry.symbolMesh, entry.pickMesh].forEach((mesh) => mesh.position.copyFrom(position))
        entry.label.position = getLabelAnchorPosition(position, object)
        entry.hazeMesh.scaling.set(hazeScale, hazeScale, 1)
        entry.symbolMesh.scaling.set(symbolScale * (isSelected ? 1.12 : 1), symbolScale * (isSelected ? 1.12 : 1), 1)
        entry.hazeMaterial.alpha = baseAlpha * (0.12 * lod.wideBlend + 0.48 * lod.mediumBlend + 0.84 * lod.closeBlend + (isGuided ? 0.08 : 0))
        entry.symbolMaterial.alpha = baseAlpha * (0.18 * lod.wideBlend + 0.74 * lod.mediumBlend + 0.92 * lod.closeBlend + (isSelected ? 0.1 : 0))
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
      return entries.get(objectId)?.symbolMesh.getAbsolutePosition().clone() ?? null
    },

    dispose() {
      entries.forEach((entry) => {
        entry.hazeMesh.dispose()
        entry.symbolMesh.dispose()
        entry.pickMesh.dispose()
        entry.label.dispose()
        entry.hazeMaterial.dispose()
        entry.symbolMaterial.dispose()
        entry.labelMaterial.dispose()
        entry.hazeTexture.dispose()
        entry.symbolTexture.dispose()
        entry.labelTexture.dispose()
      })
      entries.clear()
    },
  }
}
