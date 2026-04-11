import { Color3 } from '@babylonjs/core/Maths/math.color'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import '@babylonjs/core/Meshes/thinInstanceMesh'
import type { Scene } from '@babylonjs/core/scene'

import { buildSelectionRingTexture } from './objectClassRenderer'
import type { ProjectedSceneObjectEntry } from './engine/sky/runtime/modules/runtimeFrame'

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function hashPhase(value: string) {
  return Array.from(value).reduce((accumulator, character, index) => accumulator + (character.codePointAt(0) ?? 0) * (index + 1), 0) * 0.017
}

function fillMatrix(
  output: Float32Array,
  offset: number,
  scaleX: number,
  scaleY: number,
  positionX: number,
  positionY: number,
  positionZ: number,
) {
  output[offset + 0] = scaleX
  output[offset + 1] = 0
  output[offset + 2] = 0
  output[offset + 3] = 0

  output[offset + 4] = 0
  output[offset + 5] = scaleY
  output[offset + 6] = 0
  output[offset + 7] = 0

  output[offset + 8] = 0
  output[offset + 9] = 0
  output[offset + 10] = 1
  output[offset + 11] = 0

  output[offset + 12] = positionX
  output[offset + 13] = positionY
  output[offset + 14] = positionZ
  output[offset + 15] = 1
}

function writeHexColor(output: Float32Array, offset: number, hexColor: string, alpha: number) {
  output[offset + 0] = Number.parseInt(hexColor.slice(1, 3), 16) / 255
  output[offset + 1] = Number.parseInt(hexColor.slice(3, 5), 16) / 255
  output[offset + 2] = Number.parseInt(hexColor.slice(5, 7), 16) / 255
  output[offset + 3] = alpha
}

function createStarTexture(scene: Scene) {
  const texture = new DynamicTexture('sky-engine-star-thin-instance-texture', { width: 64, height: 64 }, scene, true)
  texture.hasAlpha = true
  const context = texture.getContext()
  const gradient = context.createRadialGradient(32, 32, 1, 32, 32, 31)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.95)')
  gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.3)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  context.clearRect(0, 0, 64, 64)
  context.fillStyle = gradient
  context.beginPath()
  context.arc(32, 32, 31, 0, Math.PI * 2)
  context.fill()
  texture.update()
  return texture
}

function createSelectionRing(scene: Scene) {
  const texture = buildSelectionRingTexture('sky-engine-star-selection-ring')
  texture.hasAlpha = true

  const mesh = MeshBuilder.CreatePlane('sky-engine-star-selection-ring-mesh', { width: 1, height: 1 }, scene)
  mesh.isPickable = false
  mesh.renderingGroupId = 2

  const material = new StandardMaterial('sky-engine-star-selection-ring-material', scene)
  material.disableLighting = true
  material.backFaceCulling = false
  material.diffuseTexture = texture
  material.opacityTexture = texture
  material.useAlphaFromDiffuseTexture = true
  material.emissiveColor = Color3.White()
  mesh.material = material
  mesh.isVisible = false

  return {
    mesh,
    material,
    texture,
  }
}

export function createDirectStarLayer(scene: Scene) {
  const markerTexture = createStarTexture(scene)
  const markerMaterial = new StandardMaterial('sky-engine-star-thin-instance-material', scene)
  markerMaterial.disableLighting = true
  markerMaterial.backFaceCulling = false
  markerMaterial.diffuseTexture = markerTexture
  markerMaterial.opacityTexture = markerTexture
  markerMaterial.useAlphaFromDiffuseTexture = true
  markerMaterial.pointsCloud = false
  markerMaterial.emissiveColor = Color3.White()
  markerMaterial.alpha = 1

  const markerMesh = MeshBuilder.CreatePlane('sky-engine-star-thin-instance-mesh', { width: 1, height: 1 }, scene)
  markerMesh.isPickable = false
  markerMesh.renderingGroupId = 1
  markerMesh.material = markerMaterial
  markerMesh.alwaysSelectAsActiveMesh = true

  const selectionRing = createSelectionRing(scene)
  const phaseByStarId = new Map<string, number>()
  let matrixBuffer = new Float32Array(0)
  let colorBuffer = new Float32Array(0)
  let capacity = 0

  const ensureCapacity = (nextCount: number) => {
    if (nextCount <= capacity) {
      return
    }

    capacity = Math.max(nextCount, Math.ceil(capacity * 1.5), 128)
    matrixBuffer = new Float32Array(capacity * 16)
    colorBuffer = new Float32Array(capacity * 4)
  }

  return {
    sync(
      projectedStars: readonly ProjectedSceneObjectEntry[],
      viewportWidth: number,
      viewportHeight: number,
      selectedObjectId: string | null,
      animationTime: number,
    ) {
      if (projectedStars.length === 0) {
        markerMesh.thinInstanceCount = 0
        markerMesh.isVisible = false
        selectionRing.mesh.isVisible = false
        return
      }

      ensureCapacity(projectedStars.length)

      markerMesh.isVisible = true
      let selectedEntry: ProjectedSceneObjectEntry | null = null

      for (let index = 0; index < projectedStars.length; index += 1) {
        const entry = projectedStars[index]
        const phase = phaseByStarId.get(entry.object.id) ?? hashPhase(entry.object.id)
        phaseByStarId.set(entry.object.id, phase)
        const isSelected = entry.object.id === selectedObjectId
        const twinkle = 1 + Math.sin(animationTime * 1.35 + phase) * (entry.starProfile?.twinkleAmplitude ?? 0)
        const emphasisScale = isSelected ? 1.16 : 1
        const diameter = Math.max(
          0.9,
          (entry.starProfile?.psfDiameterPx ?? entry.markerRadiusPx * 2.2) * emphasisScale * twinkle,
        )
        const matrixOffset = index * 16
        const colorOffset = index * 4
        fillMatrix(
          matrixBuffer,
          matrixOffset,
          diameter,
          diameter,
          entry.screenX - viewportWidth * 0.5,
          viewportHeight * 0.5 - entry.screenY,
          clamp(entry.depth * 0.01, 0, 0.01),
        )
        writeHexColor(
          colorBuffer,
          colorOffset,
          entry.starProfile?.colorHex ?? entry.object.colorHex,
          clamp(entry.renderAlpha * (0.58 + (entry.starProfile?.alpha ?? 0.4) * 0.62) + (isSelected ? 0.08 : 0), 0, 1),
        )

        if (isSelected) {
          selectedEntry = entry
        }
      }

      markerMesh.thinInstanceSetBuffer('matrix', matrixBuffer, 16, true)
      markerMesh.thinInstanceSetBuffer('color', colorBuffer, 4, true)
      markerMesh.thinInstanceCount = projectedStars.length

      if (!selectedEntry) {
        selectionRing.mesh.isVisible = false
        return
      }

      selectionRing.mesh.isVisible = true
      selectionRing.mesh.position.set(
        selectedEntry.screenX - viewportWidth * 0.5,
        viewportHeight * 0.5 - selectedEntry.screenY,
        clamp(selectedEntry.depth * 0.01, 0, 0.01),
      )
      const selectionDiameter = Math.max(20, selectedEntry.markerRadiusPx * 2 + 22)
      selectionRing.mesh.scaling.set(selectionDiameter, selectionDiameter, 1)
      selectionRing.material.alpha = clamp(0.72 + selectedEntry.renderAlpha * 0.18, 0, 0.94)
    },

    dispose() {
      phaseByStarId.clear()
      markerMesh.dispose()
      markerMaterial.dispose()
      markerTexture.dispose()
      selectionRing.mesh.dispose()
      selectionRing.material.dispose()
      selectionRing.texture.dispose()
    },
  }
}
