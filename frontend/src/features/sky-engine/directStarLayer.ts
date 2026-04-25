import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Constants } from '@babylonjs/core/Engines/constants'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import '@babylonjs/core/Meshes/thinInstanceMesh'
import type { Scene } from '@babylonjs/core/scene'

import { buildSelectionRingTexture } from './objectClassRenderer'
import type { ProjectedSceneObjectEntry } from './engine/sky/runtime/modules/runtimeFrame'

export interface DirectStarLayerSyncTiming {
  readonly totalMs: number
  readonly instanceTransformMs: number
  readonly bufferUpdateMs: number
  readonly gpuUploadMs: number
  readonly selectionHighlightMs: number
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
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
  gradient.addColorStop(0.06, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.54)')
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)')
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
  markerMaterial.alphaMode = Constants.ALPHA_ADD
  markerMaterial.disableDepthWrite = true

  const markerMesh = MeshBuilder.CreatePlane('sky-engine-star-thin-instance-mesh', { width: 1, height: 1 }, scene)
  markerMesh.isPickable = false
  markerMesh.renderingGroupId = 1
  markerMesh.material = markerMaterial
  markerMesh.alwaysSelectAsActiveMesh = true

  const selectionRing = createSelectionRing(scene)
  let matrixBuffer = new Float32Array(0)
  let colorBuffer = new Float32Array(0)
  let capacity = 0
  let buffersBound = false
  let buffersNeedRebind = false
  let previousProjectedStars: readonly ProjectedSceneObjectEntry[] | null = null
  let previousViewportWidth = Number.NaN
  let previousViewportHeight = Number.NaN
  let previousSelectedObjectId: string | null = null

  const ensureCapacity = (nextCount: number) => {
    if (nextCount <= capacity) {
      return
    }

    capacity = Math.max(nextCount, Math.ceil(capacity * 1.5), 128)
    matrixBuffer = new Float32Array(capacity * 16)
    colorBuffer = new Float32Array(capacity * 4)
    buffersNeedRebind = true
  }

  return {
    sync(
      projectedStars: readonly ProjectedSceneObjectEntry[],
      viewportWidth: number,
      viewportHeight: number,
      selectedObjectId: string | null,
      _animationTime: number,
    ): DirectStarLayerSyncTiming {
      const syncStartMs = performance.now()
      const canReuseExistingInstanceData =
        previousProjectedStars === projectedStars &&
        previousViewportWidth === viewportWidth &&
        previousViewportHeight === viewportHeight &&
        previousSelectedObjectId === selectedObjectId

      if (canReuseExistingInstanceData) {
        return {
          totalMs: performance.now() - syncStartMs,
          instanceTransformMs: 0,
          bufferUpdateMs: 0,
          gpuUploadMs: 0,
          selectionHighlightMs: 0,
        }
      }

      if (projectedStars.length === 0) {
        markerMesh.thinInstanceCount = 0
        markerMesh.isVisible = false
        selectionRing.mesh.isVisible = false
        previousProjectedStars = projectedStars
        previousViewportWidth = viewportWidth
        previousViewportHeight = viewportHeight
        previousSelectedObjectId = selectedObjectId
        return {
          totalMs: performance.now() - syncStartMs,
          instanceTransformMs: 0,
          bufferUpdateMs: 0,
          gpuUploadMs: 0,
          selectionHighlightMs: 0,
        }
      }

      ensureCapacity(projectedStars.length)

      markerMesh.isVisible = true
      let selectedEntry: ProjectedSceneObjectEntry | null = null
      const transformStartMs = performance.now()

      for (let index = 0; index < projectedStars.length; index += 1) {
        const entry = projectedStars[index]
        const isSelected = entry.object.id === selectedObjectId
        const diameter = Math.max(1.8, entry.markerRadiusPx * 2.65)
        const boostedAlpha = clamp(Math.pow(entry.renderAlpha, 0.62) * 1.35, 0.12, 1)
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
          boostedAlpha,
        )

        if (isSelected) {
          selectedEntry = entry
        }
      }
      const instanceTransformMs = performance.now() - transformStartMs

      const bufferUpdateStartMs = performance.now()
      if (!buffersBound || buffersNeedRebind) {
        markerMesh.thinInstanceSetBuffer('matrix', matrixBuffer, 16, false)
        markerMesh.thinInstanceSetBuffer('color', colorBuffer, 4, false)
        buffersBound = true
        buffersNeedRebind = false
      } else {
        markerMesh.thinInstanceBufferUpdated('matrix')
        markerMesh.thinInstanceBufferUpdated('color')
      }
      markerMesh.thinInstanceCount = projectedStars.length
      const bufferUpdateMs = performance.now() - bufferUpdateStartMs
      const selectionStartMs = performance.now()

      if (!selectedEntry) {
        selectionRing.mesh.isVisible = false
        previousProjectedStars = projectedStars
        previousViewportWidth = viewportWidth
        previousViewportHeight = viewportHeight
        previousSelectedObjectId = selectedObjectId
        return {
          totalMs: performance.now() - syncStartMs,
          instanceTransformMs,
          bufferUpdateMs,
          gpuUploadMs: 0,
          selectionHighlightMs: performance.now() - selectionStartMs,
        }
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
      const selectionHighlightMs = performance.now() - selectionStartMs
      previousProjectedStars = projectedStars
      previousViewportWidth = viewportWidth
      previousViewportHeight = viewportHeight
      previousSelectedObjectId = selectedObjectId
      return {
        totalMs: performance.now() - syncStartMs,
        instanceTransformMs,
        bufferUpdateMs,
        gpuUploadMs: 0,
        selectionHighlightMs,
      }
    },

    dispose() {
      markerMesh.dispose()
      markerMaterial.dispose()
      markerTexture.dispose()
      selectionRing.mesh.dispose()
      selectionRing.material.dispose()
      selectionRing.texture.dispose()
    },
  }
}
