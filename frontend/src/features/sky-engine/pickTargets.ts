import type { SkyEnginePickTarget, SkyEngineSceneObject } from './types'

const PICK_TARGETS_DATA_ATTRIBUTE = 'data-sky-engine-pick-targets'

export interface ProjectedPickTargetEntry {
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
  entries: readonly ProjectedPickTargetEntry[],
): SkyEnginePickTarget[] {
  const targets = entries.map((target) => ({
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
  entries: readonly ProjectedPickTargetEntry[],
  screenX: number,
  screenY: number,
) {
  const candidates = entries
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