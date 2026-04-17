import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import type { LinesMesh } from '@babylonjs/core/Meshes/linesMesh'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import type { Scene } from '@babylonjs/core/scene'

import type { SkyLodState } from './skyLod'

function buildPointerTexture(skipTopStroke: boolean) {
  const texture = new DynamicTexture('sky-engine-pointer-texture', { width: 128, height: 128 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  context.clearRect(0, 0, 128, 128)
  context.strokeStyle = 'rgba(255, 255, 255, 0.96)'
  context.lineWidth = 6
  const strokes = [
    [24, 46, 24, 24, 46, 24],
    [82, 24, 104, 24, 104, 46],
    [24, 82, 24, 104, 46, 104],
    [82, 104, 104, 104, 104, 82],
  ]
  ;(skipTopStroke ? strokes.slice(0, 3) : strokes).forEach(([x1, y1, x2, y2, x3, y3]) => {
    context.beginPath()
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
    context.lineTo(x3, y3)
    context.stroke()
  })
  texture.update()

  return texture
}

export function createPointerRenderer(scene: Scene) {
  const pointerTexture = buildPointerTexture(false)
  const pointerTextureNoTopStroke = buildPointerTexture(true)
  const pointerMesh = MeshBuilder.CreatePlane('sky-engine-pointer-marker', { width: 1, height: 1 }, scene)
  pointerMesh.billboardMode = Mesh.BILLBOARDMODE_ALL
  pointerMesh.isPickable = false
  pointerMesh.isVisible = false

  const pointerMaterial = new StandardMaterial('sky-engine-pointer-material', scene)
  pointerMaterial.disableLighting = true
  pointerMaterial.backFaceCulling = false
  pointerMaterial.diffuseTexture = pointerTexture
  pointerMaterial.opacityTexture = pointerTexture
  pointerMaterial.useAlphaFromDiffuseTexture = true
  pointerMesh.material = pointerMaterial

  let tether: LinesMesh | null = null

  return {
    sync(
      objectPosition: Vector3 | null,
      labelPosition: Vector3 | null,
      colorHex: string,
      lod: SkyLodState,
      animationTime: number,
      skipTopBar: boolean,
    ) {
      if (!objectPosition) {
        pointerMesh.isVisible = false
        tether?.dispose()
        tether = null
        return
      }

      pointerMesh.isVisible = true
      pointerMesh.position.copyFrom(objectPosition)
      pointerMesh.scaling.setAll((1.3 + lod.closeBlend * 0.8) * (1 + Math.sin(animationTime * 2.2) * 0.05))
      const activePointerTexture = skipTopBar ? pointerTextureNoTopStroke : pointerTexture
      pointerMaterial.diffuseTexture = activePointerTexture
      pointerMaterial.opacityTexture = activePointerTexture
      pointerMaterial.emissiveColor = Color3.FromHexString(colorHex).scale(1.12)
      pointerMaterial.alpha = 0.92

      tether?.dispose()
      tether = null

      if (!labelPosition) {
        return
      }

      tether = MeshBuilder.CreateLines('sky-engine-pointer-tether', {
        points: [objectPosition.clone(), labelPosition.clone()],
        updatable: false,
      }, scene)
      tether.color = Color3.FromHexString(colorHex).scale(0.88)
      tether.alpha = 0.58
      tether.isPickable = false
    },

    dispose() {
      tether?.dispose()
      pointerMesh.dispose()
      pointerMaterial.dispose()
      pointerTexture.dispose()
      pointerTextureNoTopStroke.dispose()
    },
  }
}
