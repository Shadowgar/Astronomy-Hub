import { Color3 } from '@babylonjs/core/Maths/math.color'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import type { Scene } from '@babylonjs/core/scene'

import { buildLabelTexture, getLabelAnchorPosition, type LabelRenderRef } from './labelManager'
import { buildMoonTexture } from './objectClassRenderer'
import { getSkyEnginePickColliderDiameter } from './pickTargets'
import type { SkyObjectRenderer, SkyRendererPickEntry, SkyRendererSyncInput } from './skyRendererContracts'
import { toSkyPosition } from './skyDomeMath'
import type { SkyEngineSceneObject } from './types'

const LABEL_WIDTH = 12
const LABEL_HEIGHT = 3.25

interface MoonRenderEntry extends LabelRenderRef {
  readonly glowMesh: Mesh
  readonly discMesh: Mesh
  readonly pickMesh: Mesh
  readonly glowMaterial: StandardMaterial
  readonly discMaterial: StandardMaterial
  readonly labelTexture: DynamicTexture
  readonly glowTexture: DynamicTexture
  discTexture: DynamicTexture
  object: SkyEngineSceneObject
  readonly pickRadiusPx: number
}

function buildMoonGlowTexture() {
  const texture = new DynamicTexture('sky-engine-moon-glow', { width: 128, height: 128 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 58)
  gradient.addColorStop(0, 'rgba(255, 245, 214, 0.94)')
  gradient.addColorStop(0.34, 'rgba(255, 245, 214, 0.58)')
  gradient.addColorStop(0.74, 'rgba(255, 245, 214, 0.1)')
  gradient.addColorStop(1, 'rgba(255, 245, 214, 0)')
  context.clearRect(0, 0, 128, 128)
  context.fillStyle = gradient
  context.beginPath()
  context.arc(64, 64, 58, 0, Math.PI * 2)
  context.fill()
  texture.update()

  return texture
}

function createMoonEntry(scene: Scene, object: SkyEngineSceneObject): MoonRenderEntry {
  const glowTexture = buildMoonGlowTexture()
  const discTexture = buildMoonTexture(
    `sky-engine-moon-disc-${object.id}`,
    object.illuminationFraction,
    object.brightLimbAngleDeg,
    object.waxing,
  )
  const labelTexture = buildLabelTexture(object.phaseLabel ? `${object.name} · ${object.phaseLabel}` : object.name, 'moon')

  const glowMesh = MeshBuilder.CreatePlane(`sky-engine-moon-glow-${object.id}`, { width: 1, height: 1 }, scene)
  glowMesh.billboardMode = Mesh.BILLBOARDMODE_ALL
  glowMesh.isPickable = false
  const glowMaterial = new StandardMaterial(`sky-engine-moon-glow-material-${object.id}`, scene)
  glowMaterial.disableLighting = true
  glowMaterial.backFaceCulling = false
  glowMaterial.diffuseTexture = glowTexture
  glowMaterial.opacityTexture = glowTexture
  glowMaterial.useAlphaFromDiffuseTexture = true
  glowMesh.material = glowMaterial

  const discMesh = MeshBuilder.CreatePlane(`sky-engine-moon-disc-${object.id}`, { width: 1, height: 1 }, scene)
  discMesh.billboardMode = Mesh.BILLBOARDMODE_ALL
  discMesh.isPickable = false
  const discMaterial = new StandardMaterial(`sky-engine-moon-disc-material-${object.id}`, scene)
  discMaterial.disableLighting = true
  discMaterial.backFaceCulling = false
  discMaterial.diffuseTexture = discTexture
  discMaterial.opacityTexture = discTexture
  discMaterial.useAlphaFromDiffuseTexture = true
  discMesh.material = discMaterial

  const label = MeshBuilder.CreatePlane(`sky-engine-moon-label-${object.id}`, { width: LABEL_WIDTH, height: LABEL_HEIGHT }, scene)
  label.billboardMode = Mesh.BILLBOARDMODE_ALL
  label.isPickable = false
  label.isVisible = false
  const labelMaterial = new StandardMaterial(`sky-engine-moon-label-material-${object.id}`, scene)
  labelMaterial.disableLighting = true
  labelMaterial.backFaceCulling = false
  labelMaterial.diffuseTexture = labelTexture
  labelMaterial.opacityTexture = labelTexture
  labelMaterial.useAlphaFromDiffuseTexture = true
  labelMaterial.emissiveColor = Color3.White()
  label.material = labelMaterial

  const pickMesh = MeshBuilder.CreateSphere(
    `sky-engine-moon-pick-${object.id}`,
    { diameter: getSkyEnginePickColliderDiameter(object), segments: 12 },
    scene,
  )
  pickMesh.isPickable = true
  const pickMaterial = new StandardMaterial(`sky-engine-moon-pick-material-${object.id}`, scene)
  pickMaterial.disableLighting = true
  pickMaterial.alpha = 0.001
  pickMesh.material = pickMaterial

  return {
    glowMesh,
    discMesh,
    pickMesh,
    glowMaterial,
    discMaterial,
    label,
    labelMaterial,
    glowTexture,
    discTexture,
    labelTexture,
    object,
    pickRadiusPx: 32,
    currentLabelAlpha: 0,
    currentLabelScale: 0.82,
  }
}

export function createMoonRenderer(scene: Scene): SkyObjectRenderer {
  const entries = new Map<string, MoonRenderEntry>()

  return {
    sync({ objects, selectedObjectId, lod }: SkyRendererSyncInput) {
      const moonObjects = objects.filter((object) => object.type === 'moon')
      const nextIds = new Set(moonObjects.map((object) => object.id))

      Array.from(entries.keys()).forEach((objectId) => {
        if (nextIds.has(objectId)) {
          return
        }

        const entry = entries.get(objectId)

        if (!entry) {
          return
        }

        entry.glowMesh.dispose()
        entry.discMesh.dispose()
        entry.pickMesh.dispose()
        entry.label.dispose()
        entry.glowMaterial.dispose()
        entry.discMaterial.dispose()
        entry.labelMaterial.dispose()
        entry.glowTexture.dispose()
        entry.discTexture.dispose()
        entry.labelTexture.dispose()
        entries.delete(objectId)
      })

      moonObjects.forEach((object) => {
        let entry = entries.get(object.id)

        if (!entry) {
          entry = createMoonEntry(scene, object)
          entries.set(object.id, entry)
        }

        entry.object = object
        entry.discMaterial.diffuseTexture = entry.discTexture
        entry.discMaterial.opacityTexture = entry.discTexture
        const position = toSkyPosition(object.altitudeDeg, object.azimuthDeg)
        const isSelected = object.id === selectedObjectId
        const glowScale = 2.6 * (1 + lod.wideBlend * 0.2 + lod.mediumBlend * 0.18)
        const discScale = 1.5 * (1 + lod.mediumBlend * 0.34 + lod.closeBlend * 0.92)

        ;[entry.glowMesh, entry.discMesh, entry.pickMesh].forEach((mesh) => mesh.position.copyFrom(position))
        entry.label.position = getLabelAnchorPosition(position, object)
        entry.glowMesh.scaling.set(glowScale, glowScale, 1)
        entry.discMesh.scaling.set(discScale * (isSelected ? 1.12 : 1), discScale * (isSelected ? 1.12 : 1), 1)
        entry.glowMaterial.alpha = 0.5 + lod.wideBlend * 0.18 + lod.mediumBlend * 0.1
        entry.discMaterial.alpha = Math.min(1, 0.42 * lod.wideBlend + 0.78 * lod.mediumBlend + 0.96 * lod.closeBlend)
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
        entry.glowMesh.dispose()
        entry.discMesh.dispose()
        entry.pickMesh.dispose()
        entry.label.dispose()
        entry.glowMaterial.dispose()
        entry.discMaterial.dispose()
        entry.labelMaterial.dispose()
        entry.glowTexture.dispose()
        entry.discTexture.dispose()
        entry.labelTexture.dispose()
      })
      entries.clear()
    },
  }
}
