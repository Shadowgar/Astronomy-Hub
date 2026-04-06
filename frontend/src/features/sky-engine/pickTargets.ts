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

interface ProjectedPickTarget {
  object: SkyEngineSceneObject
  screenX: number
  screenY: number
  radiusPx: number
  depth: number
}

export function getSkyEnginePickColliderDiameter(object: SkyEngineSceneObject) {
  if (object.type === 'moon') {
    return 10.8
  }

  if (object.source === 'computed_real_sky') {
    return object.type === 'star' ? 6.4 : 7.2
  }

  if (object.type === 'planet') {
    return 6.4
  }

  return object.source === 'temporary_scene_seed' ? 4.2 : 5.2
}

function roundCoordinate(value: number) {
  return Math.round(value * 100) / 100
}

function getProjectedPickTargets(
  scene: Scene,
  camera: Camera,
  engine: Engine,
  entries: readonly PickTargetMeshEntry[],
): ProjectedPickTarget[] {
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

    if (
      projected.x < viewportMinX - entry.pickRadiusPx ||
      projected.x > viewportMaxX + entry.pickRadiusPx ||
      projected.y < viewportMinY - entry.pickRadiusPx ||
      projected.y > viewportMaxY + entry.pickRadiusPx
    ) {
      return []
    }

    return [{
      object: entry.object,
      screenX: projected.x,
      screenY: projected.y,
      radiusPx: entry.pickRadiusPx,
      depth: projected.z,
    }]
  })
}

function getObjectPickPriority(object: SkyEngineSceneObject) {
  if (object.type === 'moon') {
    return 40
  }

  if (object.type === 'planet') {
    return 30
  }

  if (object.type === 'star') {
    return object.source === 'computed_real_sky' ? 24 : 20
  }

  return object.source === 'temporary_scene_seed' ? 4 : 10
}

export function buildSkyEnginePickTargets(
  scene: Scene,
  camera: Camera,
  engine: Engine,
  entries: readonly PickTargetMeshEntry[],
): SkyEnginePickTarget[] {
  const targets = getProjectedPickTargets(scene, camera, engine, entries).map((target) => ({
    objectId: target.object.id,
    objectName: target.object.name,
    objectType: target.object.type,
    objectSource: target.object.source,
    screenX: roundCoordinate(target.screenX),
    screenY: roundCoordinate(target.screenY),
    radiusPx: target.radiusPx,
  }))

  const seenObjectIds = new Set<string>()

  return targets.filter((target) => {
    if (seenObjectIds.has(target.objectId)) {
      return false
    }

    seenObjectIds.add(target.objectId)
    return true
  })
}

export function resolveSkyEnginePickSelection(
  scene: Scene,
  camera: Camera,
  engine: Engine,
  entries: readonly PickTargetMeshEntry[],
  screenX: number,
  screenY: number,
) {
  const candidates = getProjectedPickTargets(scene, camera, engine, entries)
    .map((target) => {
      const distanceX = target.screenX - screenX
      const distanceY = target.screenY - screenY
      const distancePx = Math.hypot(distanceX, distanceY)

      return {
        ...target,
        distancePx,
        normalizedDistance: distancePx / Math.max(target.radiusPx, 1),
        priority: getObjectPickPriority(target.object),
      }
    })
    .filter((target) => target.distancePx <= target.radiusPx)
    .sort((left, right) => {
      const normalizedDelta = left.normalizedDistance - right.normalizedDistance

      if (Math.abs(normalizedDelta) > 0.08) {
        return normalizedDelta
      }

      const priorityDelta = right.priority - left.priority

      if (priorityDelta !== 0) {
        return priorityDelta
      }

      const distanceDelta = left.distancePx - right.distancePx

      if (Math.abs(distanceDelta) > 1) {
        return distanceDelta
      }

      const depthDelta = left.depth - right.depth

      if (Math.abs(depthDelta) > 0.015) {
        return depthDelta
      }

      return left.object.name.localeCompare(right.object.name)
    })

  return candidates[0]?.object.id ?? null
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