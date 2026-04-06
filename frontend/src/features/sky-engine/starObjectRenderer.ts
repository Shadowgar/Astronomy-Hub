import { Color3 } from '@babylonjs/core/Maths/math.color'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import type { Scene } from '@babylonjs/core/scene'

import { buildLabelTexture, getLabelAnchorPosition, getLabelVariantForObject, type LabelRenderRef } from './labelManager'
import { getSkyEnginePickColliderDiameter } from './pickTargets'
import { buildDedicatedStarTexture, getStarRenderProfile, type StarRenderProfile } from './starRenderer'
import { buildSyntheticStarField } from './syntheticStarField'
import type { SkyObjectRenderer, SkyRendererPickEntry, SkyRendererSyncInput } from './skyRendererContracts'
import { toSkyPosition } from './skyDomeMath'
import type { SkyEngineSceneObject } from './types'

const LABEL_WIDTH = 12
const LABEL_HEIGHT = 3.25

interface StarRenderEntry extends LabelRenderRef {
  readonly marker: Mesh
  readonly pickMesh: Mesh
  readonly markerMaterial: StandardMaterial
  readonly labelTexture: DynamicTexture
  readonly markerTexture: DynamicTexture
  object: SkyEngineSceneObject
  readonly pickRadiusPx: number
  readonly twinklePhase: number
  starProfile: StarRenderProfile
}

interface SyntheticStarEntry {
  readonly marker: Mesh
  readonly markerMaterial: StandardMaterial
  readonly size: number
  readonly alpha: number
  readonly twinklePhase: number
}

function hashPhase(value: string) {
  return Array.from(value).reduce((accumulator, character, index) => accumulator + (character.codePointAt(0) ?? 0) * (index + 1), 0) * 0.017
}

function buildSharedSyntheticTexture() {
  const texture = new DynamicTexture('sky-engine-synthetic-star-texture', { width: 64, height: 64 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const gradient = context.createRadialGradient(32, 32, 1, 32, 32, 30)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.96)')
  gradient.addColorStop(0.22, 'rgba(255, 255, 255, 0.68)')
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.16)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  context.clearRect(0, 0, 64, 64)
  context.fillStyle = gradient
  context.beginPath()
  context.arc(32, 32, 30, 0, Math.PI * 2)
  context.fill()
  texture.update()

  return texture
}

function createStarEntry(scene: Scene, object: SkyEngineSceneObject, starProfile: StarRenderProfile): StarRenderEntry {
  const markerTexture = buildDedicatedStarTexture(`sky-engine-star-marker-${object.id}`, starProfile)
  const labelTexture = buildLabelTexture(object.name, getLabelVariantForObject(object))

  const marker = MeshBuilder.CreatePlane(`sky-engine-star-${object.id}`, { width: 1, height: 1 }, scene)
  marker.billboardMode = Mesh.BILLBOARDMODE_ALL
  marker.isPickable = false

  const markerMaterial = new StandardMaterial(`sky-engine-star-material-${object.id}`, scene)
  markerMaterial.disableLighting = true
  markerMaterial.backFaceCulling = false
  markerMaterial.diffuseTexture = markerTexture
  markerMaterial.opacityTexture = markerTexture
  markerMaterial.useAlphaFromDiffuseTexture = true
  marker.material = markerMaterial

  const label = MeshBuilder.CreatePlane(`sky-engine-star-label-${object.id}`, { width: LABEL_WIDTH, height: LABEL_HEIGHT }, scene)
  label.billboardMode = Mesh.BILLBOARDMODE_ALL
  label.isPickable = false
  label.isVisible = false

  const labelMaterial = new StandardMaterial(`sky-engine-star-label-material-${object.id}`, scene)
  labelMaterial.disableLighting = true
  labelMaterial.backFaceCulling = false
  labelMaterial.diffuseTexture = labelTexture
  labelMaterial.opacityTexture = labelTexture
  labelMaterial.useAlphaFromDiffuseTexture = true
  labelMaterial.emissiveColor = Color3.White()
  label.material = labelMaterial

  const pickMesh = MeshBuilder.CreateSphere(
    `sky-engine-star-pick-${object.id}`,
    { diameter: getSkyEnginePickColliderDiameter(object), segments: 12 },
    scene,
  )
  pickMesh.isPickable = true
  const pickMaterial = new StandardMaterial(`sky-engine-star-pick-material-${object.id}`, scene)
  pickMaterial.disableLighting = true
  pickMaterial.alpha = 0.001
  pickMesh.material = pickMaterial

  return {
    marker,
    pickMesh,
    markerMaterial,
    label,
    labelMaterial,
    labelTexture,
    markerTexture,
    object,
    pickRadiusPx: 18,
    currentLabelAlpha: 0,
    currentLabelScale: 0.82,
    twinklePhase: hashPhase(object.id),
    starProfile,
  }
}

export function createStarRenderer(scene: Scene): SkyObjectRenderer {
  const entries = new Map<string, StarRenderEntry>()
  const syntheticTexture = buildSharedSyntheticTexture()
  const syntheticSamples = buildSyntheticStarField(1800)
  const syntheticEntries = syntheticSamples.map((sample) => {
    const marker = MeshBuilder.CreatePlane(`sky-engine-synthetic-star-${sample.id}`, { width: 1, height: 1 }, scene)
    marker.billboardMode = Mesh.BILLBOARDMODE_ALL
    marker.isPickable = false

    const markerMaterial = new StandardMaterial(`sky-engine-synthetic-star-material-${sample.id}`, scene)
    markerMaterial.disableLighting = true
    markerMaterial.backFaceCulling = false
    markerMaterial.diffuseTexture = syntheticTexture
    markerMaterial.opacityTexture = syntheticTexture
    markerMaterial.useAlphaFromDiffuseTexture = true
    markerMaterial.emissiveColor = Color3.FromHexString(sample.colorHex)
    marker.material = markerMaterial
    marker.position = toSkyPosition(sample.altitudeDeg, sample.azimuthDeg)

    return {
      marker,
      markerMaterial,
      size: sample.size,
      alpha: sample.alpha,
      twinklePhase: sample.twinklePhase,
    }
  })

  return {
    sync({ objects, selectedObjectId, guidedObjectIds, sunState, lod, animationTime }: SkyRendererSyncInput) {
      const starObjects = objects.filter((object) => object.type === 'star')
      const nextIds = new Set(starObjects.map((object) => object.id))

      Array.from(entries.keys()).forEach((objectId) => {
        if (nextIds.has(objectId)) {
          return
        }

        const entry = entries.get(objectId)

        if (!entry) {
          return
        }

        entry.marker.dispose()
        entry.pickMesh.dispose()
        entry.label.dispose()
        entry.markerMaterial.dispose()
        entry.labelMaterial.dispose()
        entry.markerTexture.dispose()
        entry.labelTexture.dispose()
        entries.delete(objectId)
      })

      starObjects.forEach((object) => {
        let entry = entries.get(object.id)
        const starProfile = getStarRenderProfile(object, sunState.visualCalibration)

        if (!entry) {
          entry = createStarEntry(scene, object, starProfile)
          entries.set(object.id, entry)
        }

        entry.starProfile = starProfile
        entry.object = object

        const isSelected = object.id === selectedObjectId
        const isGuided = guidedObjectIds.has(object.id)
        let emphasisScale = 1
        let guidedScale = 1

        if (isSelected) {
          emphasisScale = 1.3
        } else if (isGuided) {
          guidedScale = 1.12
        }
        const position = toSkyPosition(object.altitudeDeg, object.azimuthDeg)
        const twinkle = 1 + Math.sin(animationTime * 1.35 + entry.twinklePhase) * starProfile.twinkleAmplitude * sunState.visualCalibration.starVisibility
        const scale = starProfile.diameter * emphasisScale * guidedScale * (0.96 + lod.closeBlend * 0.26) * twinkle
        const alpha = starProfile.alpha * (0.82 + lod.mediumBlend * 0.14 + lod.closeBlend * 0.2)

        entry.marker.position.copyFrom(position)
        entry.marker.scaling.set(scale, scale, 1)
        entry.markerMaterial.emissiveColor = Color3.FromHexString(starProfile.colorHex).scale(starProfile.emissiveScale + (isSelected ? 0.3 : 0.1))
        entry.markerMaterial.alpha = alpha
        entry.pickMesh.position.copyFrom(position)
        entry.label.position = getLabelAnchorPosition(position, object)
        entry.labelMaterial.alpha = 0
      })

      syntheticEntries.forEach((entry, index) => {
        const visible = index < lod.syntheticStarCount
        entry.marker.isVisible = visible

        if (!visible) {
          return
        }

        const twinkle = 1 + Math.sin(animationTime * 0.8 + entry.twinklePhase) * sunState.visualCalibration.starTwinkleAmplitude * 0.7
        const scale = entry.size * (1.08 + lod.mediumBlend * 0.2 + lod.closeBlend * 0.34) * twinkle
        entry.marker.scaling.set(scale, scale, 1)
        entry.markerMaterial.alpha = entry.alpha * sunState.visualCalibration.starFieldBrightness * (0.5 + lod.mediumBlend * 0.28 + lod.closeBlend * 0.46)
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
      return entries.get(objectId)?.marker.getAbsolutePosition().clone() ?? null
    },

    dispose() {
      entries.forEach((entry) => {
        entry.marker.dispose()
        entry.pickMesh.dispose()
        entry.label.dispose()
        entry.markerMaterial.dispose()
        entry.labelMaterial.dispose()
        entry.markerTexture.dispose()
        entry.labelTexture.dispose()
      })
      syntheticEntries.forEach((entry) => {
        entry.marker.dispose()
        entry.markerMaterial.dispose()
      })
      syntheticTexture.dispose()
      entries.clear()
    },
  }
}