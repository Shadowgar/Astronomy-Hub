import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'

import type { SkyEngineSceneObject } from './types'

function toSkyPosition(altitudeDeg: number, azimuthDeg: number, radius: number) {
  const altitude = (altitudeDeg * Math.PI) / 180
  const azimuth = (azimuthDeg * Math.PI) / 180
  const horizontalRadius = Math.cos(altitude) * radius

  return new Vector3(
    Math.sin(azimuth) * horizontalRadius,
    Math.sin(altitude) * radius,
    Math.cos(azimuth) * horizontalRadius,
  )
}

export function buildInitialViewTarget(objects: readonly SkyEngineSceneObject[], guidedObjectIds: readonly string[]) {
  const guidedSet = new Set(guidedObjectIds)
  const targetObjects = objects.filter(
    (object) => object.isAboveHorizon && (guidedSet.has(object.id) || object.source === 'computed_real_sky'),
  )

  if (targetObjects.length === 0) {
    return new Vector3(0, 28, 90)
  }

  const total = targetObjects.reduce((accumulator, object) => {
    const direction = toSkyPosition(object.altitudeDeg, object.azimuthDeg, 1)
    const isGuided = guidedSet.has(object.id)
    let weight = 1

    if (isGuided) {
      weight = 1.4
    }

    if (object.type === 'moon') {
      weight = 2.35
    }

    return accumulator.add(direction.scale(weight))
  }, Vector3.Zero())

  const totalWeight = targetObjects.reduce((accumulator, object) => {
    if (object.type === 'moon') {
      return accumulator + 2.35
    }

    return accumulator + (guidedSet.has(object.id) ? 1.4 : 1)
  }, 0)

  const direction = total.scale(1 / totalWeight).normalize()
  const horizonBiasedDirection = new Vector3(
    direction.x * 0.96,
    Math.max(0.12, direction.y * 0.68 + 0.14),
    direction.z,
  ).normalize()

  return horizonBiasedDirection.scale(92)
}

export function getSelectionTargetVector(object: SkyEngineSceneObject) {
  const target = toSkyPosition(object.altitudeDeg, object.azimuthDeg, 92)
  const normalized = target.normalize()
  return new Vector3(normalized.x, Math.max(-0.08, normalized.y), normalized.z).normalize().scale(92)
}

export function getDesiredFovForObject(object: SkyEngineSceneObject | null) {
  if (!object) {
    return 1.02
  }

  if (object.type === 'moon') {
    return 0.78
  }

  if (object.type === 'deep_sky') {
    return 0.84
  }

  if (object.type === 'planet') {
    return 0.82
  }

  return 0.88
}

export function updateObserverNavigation(
  camera: UniversalCamera,
  desiredFov: number,
  targetVector: Vector3 | null,
  deltaSeconds: number,
) {
  const fovEase = 1 - Math.pow(0.002, deltaSeconds * 5.2)
  camera.fov += (desiredFov - camera.fov) * fovEase

  if (!targetVector) {
    return null
  }

  const currentTarget = camera.getTarget()
  const lookEase = 1 - Math.pow(0.002, deltaSeconds * 3.6)
  const nextTarget = Vector3.Lerp(currentTarget, targetVector, lookEase)
  camera.setTarget(nextTarget)

  if (Vector3.Distance(nextTarget, targetVector) < 0.08) {
    return null
  }

  return targetVector
}
