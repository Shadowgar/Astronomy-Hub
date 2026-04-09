import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import type { Scene } from '@babylonjs/core/scene'

import { buildObjectMarkerTexture, buildSelectionRingTexture } from './objectClassRenderer'
import type { StarRenderProfile } from './starRenderer'
import type { SkyEngineSceneObject, SkyEngineSunState } from './types'

export interface DirectProjectedObjectEntry {
  readonly object: SkyEngineSceneObject
  readonly screenX: number
  readonly screenY: number
  readonly depth: number
  readonly markerRadiusPx: number
  readonly renderAlpha: number
  readonly starProfile?: StarRenderProfile
}

interface DirectObjectEntry {
  readonly mesh: Mesh
  readonly material: StandardMaterial
  texture: DynamicTexture
  signature: string
  twinklePhase: number
}

interface SelectionRingEntry {
  readonly mesh: Mesh
  readonly material: StandardMaterial
  readonly texture: DynamicTexture
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function hashPhase(value: string) {
  return Array.from(value).reduce((accumulator, character, index) => accumulator + (character.codePointAt(0) ?? 0) * (index + 1), 0) * 0.017
}

function toViewportPlanePosition(entry: DirectProjectedObjectEntry, viewportWidth: number, viewportHeight: number) {
  return new Vector3(
    entry.screenX - viewportWidth * 0.5,
    viewportHeight * 0.5 - entry.screenY,
    clamp(entry.depth * 0.01, 0, 0.01),
  )
}

function buildTextureSignature(entry: DirectProjectedObjectEntry) {
  const { object, starProfile } = entry

  if (object.type === 'moon') {
    return [
      object.type,
      object.id,
      object.illuminationFraction ?? 0,
      object.brightLimbAngleDeg ?? 0,
      object.waxing ? 'waxing' : 'waning',
    ].join(':')
  }

  if (object.type === 'star' && starProfile) {
    return [object.type, object.id, starProfile.colorHex].join(':')
  }

  return [object.type, object.id, object.colorHex].join(':')
}

function createObjectEntry(scene: Scene, entry: DirectProjectedObjectEntry, sunState: SkyEngineSunState): DirectObjectEntry {
  const texture = buildObjectMarkerTexture(
    `sky-engine-direct-object-${entry.object.id}`,
    entry.object,
    sunState.visualCalibration,
    entry.starProfile,
  )
  texture.hasAlpha = true

  const mesh = MeshBuilder.CreatePlane(`sky-engine-direct-object-mesh-${entry.object.id}`, { width: 1, height: 1 }, scene)
  mesh.isPickable = false
  mesh.renderingGroupId = 1

  const material = new StandardMaterial(`sky-engine-direct-object-material-${entry.object.id}`, scene)
  material.disableLighting = true
  material.backFaceCulling = false
  material.diffuseTexture = texture
  material.opacityTexture = texture
  material.useAlphaFromDiffuseTexture = true
  material.emissiveColor = Color3.White()
  mesh.material = material

  return {
    mesh,
    material,
    texture,
    signature: buildTextureSignature(entry),
    twinklePhase: hashPhase(entry.object.id),
  }
}

function createSelectionRing(scene: Scene): SelectionRingEntry {
  const texture = buildSelectionRingTexture('sky-engine-direct-selection-ring')
  texture.hasAlpha = true

  const mesh = MeshBuilder.CreatePlane('sky-engine-direct-selection-ring-mesh', { width: 1, height: 1 }, scene)
  mesh.isPickable = false
  mesh.renderingGroupId = 2

  const material = new StandardMaterial('sky-engine-direct-selection-ring-material', scene)
  material.disableLighting = true
  material.backFaceCulling = false
  material.diffuseTexture = texture
  material.opacityTexture = texture
  material.useAlphaFromDiffuseTexture = true
  material.emissiveColor = Color3.White()
  mesh.material = material

  return {
    mesh,
    material,
    texture,
  }
}

function disposeObjectEntry(entry: DirectObjectEntry) {
  entry.mesh.dispose()
  entry.material.dispose()
  entry.texture.dispose()
}

export function createDirectObjectLayer(scene: Scene) {
  const entries = new Map<string, DirectObjectEntry>()
  const selectionRing = createSelectionRing(scene)

  return {
    sync(
      projectedObjects: readonly DirectProjectedObjectEntry[],
      viewportWidth: number,
      viewportHeight: number,
      sunState: SkyEngineSunState,
      selectedObjectId: string | null,
      animationTime: number,
    ) {
      const nextIds = new Set(projectedObjects.map((entry) => entry.object.id))

      Array.from(entries.keys()).forEach((objectId) => {
        if (nextIds.has(objectId)) {
          return
        }

        const entry = entries.get(objectId)

        if (!entry) {
          return
        }

        disposeObjectEntry(entry)
        entries.delete(objectId)
      })

      let selectedEntry: DirectProjectedObjectEntry | null = null

      projectedObjects.forEach((projectedObject) => {
        let entry = entries.get(projectedObject.object.id)

        if (!entry) {
          entry = createObjectEntry(scene, projectedObject, sunState)
          entries.set(projectedObject.object.id, entry)
        }

        const nextSignature = buildTextureSignature(projectedObject)

        if (entry.signature !== nextSignature) {
          entry.texture.dispose()
          entry.texture = buildObjectMarkerTexture(
            `sky-engine-direct-object-${projectedObject.object.id}`,
            projectedObject.object,
            sunState.visualCalibration,
            projectedObject.starProfile,
          )
          entry.texture.hasAlpha = true
          entry.material.diffuseTexture = entry.texture
          entry.material.opacityTexture = entry.texture
          entry.signature = nextSignature
        }

        const isSelected = projectedObject.object.id === selectedObjectId
        const basePosition = toViewportPlanePosition(projectedObject, viewportWidth, viewportHeight)
        const twinkle = projectedObject.object.type === 'star'
          ? 1 + Math.sin(animationTime * 1.35 + entry.twinklePhase) * (projectedObject.starProfile?.twinkleAmplitude ?? 0)
          : 1
        const emphasisScale = isSelected ? 1.16 : 1
        const diameter = projectedObject.object.type === 'star'
          ? Math.max(
              0.9,
              (projectedObject.starProfile?.psfDiameterPx ?? projectedObject.markerRadiusPx * 2.2) * emphasisScale * twinkle,
            )
          : Math.max(2, projectedObject.markerRadiusPx * 2 * emphasisScale * twinkle)

        entry.mesh.position.copyFrom(basePosition)
        entry.mesh.scaling.set(diameter, diameter, 1)
        entry.mesh.isVisible = projectedObject.renderAlpha > 0.001

        if (projectedObject.object.type === 'star') {
          entry.material.emissiveColor = Color3.FromHexString(projectedObject.starProfile?.colorHex ?? projectedObject.object.colorHex)
            .scale((projectedObject.starProfile?.emissiveScale ?? 1) * (isSelected ? 1.08 : 1))
        } else if (projectedObject.object.type === 'deep_sky') {
          entry.material.emissiveColor = Color3.FromHexString(projectedObject.object.colorHex).scale(0.9)
        } else {
          entry.material.emissiveColor = Color3.White()
        }

        entry.material.alpha = projectedObject.object.type === 'star'
          ? clamp(projectedObject.renderAlpha * (0.58 + (projectedObject.starProfile?.alpha ?? 0.4) * 0.62) + (isSelected ? 0.08 : 0), 0, 1)
          : clamp(projectedObject.renderAlpha + (isSelected ? 0.08 : 0), 0, 1)

        if (isSelected) {
          selectedEntry = projectedObject
        }
      })

      if (selectedEntry === null) {
        selectionRing.mesh.isVisible = false
        return
      }

      const finalSelectedEntry: DirectProjectedObjectEntry = selectedEntry

      selectionRing.mesh.isVisible = true
      selectionRing.mesh.position.copyFrom(toViewportPlanePosition(finalSelectedEntry, viewportWidth, viewportHeight))
      const selectionDiameter = Math.max(20, finalSelectedEntry.markerRadiusPx * 2 + 22)
      selectionRing.mesh.scaling.set(selectionDiameter, selectionDiameter, 1)
      selectionRing.material.alpha = clamp(0.72 + finalSelectedEntry.renderAlpha * 0.18, 0, 0.94)
    },

    dispose() {
      entries.forEach(disposeObjectEntry)
      entries.clear()
      selectionRing.mesh.dispose()
      selectionRing.material.dispose()
      selectionRing.texture.dispose()
    },
  }
}
