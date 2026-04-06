import type { Camera } from '@babylonjs/core/Cameras/camera'
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import type { Engine } from '@babylonjs/core/Engines/engine'
import type { Scene } from '@babylonjs/core/scene'

import type { SkyEnginePickTarget, SkyEngineSceneObject } from './types'

const PICK_TARGETS_DATA_ATTRIBUTE = 'data-sky-engine-pick-targets'

interface PickTargetMeshEntry {
  object: SkyEngineSceneObject
  pickMesh: AbstractMesh
  pickRadiusPx: number
}

export function getSkyEnginePickColliderDiameter(object: SkyEngineSceneObject) {
  if (object.source === 'computed_real_sky') {
    return object.type === 'star' ? 10 : 8.5
  }

  return object.type === 'planet' ? 7.5 : 6.8
}

function roundCoordinate(value: number) {
  return Math.round(value * 100) / 100
}

export function buildSkyEnginePickTargets(
  scene: Scene,
  camera: Camera,
  engine: Engine,
  entries: readonly PickTargetMeshEntry[],
): SkyEnginePickTarget[] {
  const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
  const viewportMinX = viewport.x
  const viewportMinY = viewport.y
  const viewportMaxX = viewport.x + viewport.width
  const viewportMaxY = viewport.y + viewport.height

  return entries.flatMap((entry) => {
    const projected = Vector3.Project(
      entry.pickMesh.getAbsolutePosition(),
      Matrix.IdentityReadOnly,
      scene.getTransformMatrix(),
      viewport,
    )

    if (projected.z < 0 || projected.z > 1) {
      return []
    }

    if (projected.x < viewportMinX || projected.x > viewportMaxX || projected.y < viewportMinY || projected.y > viewportMaxY) {
      return []
    }

    return [{
      objectId: entry.object.id,
      objectName: entry.object.name,
      screenX: roundCoordinate(projected.x),
      screenY: roundCoordinate(projected.y),
      radiusPx: entry.pickRadiusPx,
    }]
  })
}

export function writeSkyEnginePickTargets(canvas: HTMLCanvasElement, targets: readonly SkyEnginePickTarget[]) {
  canvas.setAttribute(PICK_TARGETS_DATA_ATTRIBUTE, JSON.stringify(targets))
}

export function clearSkyEnginePickTargets(canvas: HTMLCanvasElement) {
  canvas.removeAttribute(PICK_TARGETS_DATA_ATTRIBUTE)
}

export function getSkyEnginePickTargetsDataAttribute() {
  return PICK_TARGETS_DATA_ATTRIBUTE
}