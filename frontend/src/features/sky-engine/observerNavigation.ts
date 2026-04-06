import { Vector3 } from '@babylonjs/core/Maths/math.vector'

import { horizontalToDirection, normalizeDirection } from './projectionMath'
import type { SkyEngineSceneObject } from './types'

const DEGREE = Math.PI / 180
const STELLARIUM_MIN_FOV_DEGREES = 0.000278
const BABYLON_SAFE_MAX_FOV_DEGREES = 175

export const SKY_ENGINE_MIN_FOV = STELLARIUM_MIN_FOV_DEGREES * DEGREE
export const SKY_ENGINE_MAX_FOV = BABYLON_SAFE_MAX_FOV_DEGREES * DEGREE
const SKY_ENGINE_WHEEL_ZOOM_FACTOR = 1.05
const SKY_ENGINE_DEFAULT_FOV = 120 * DEGREE

function clampDotProduct(value: number) {
  return Math.min(1, Math.max(-1, value))
}

function rotateVectorAroundAxis(vector: Vector3, axis: Vector3, angle: number) {
  const normalizedAxis = axis.normalizeToNew()
  const cosAngle = Math.cos(angle)
  const sinAngle = Math.sin(angle)
  const parallelComponent = normalizedAxis.scale(Vector3.Dot(normalizedAxis, vector) * (1 - cosAngle))

  return vector.scale(cosAngle)
    .add(Vector3.Cross(normalizedAxis, vector).scale(sinAngle))
    .add(parallelComponent)
}

export function clampSkyEngineFov(fov: number) {
  return Math.min(SKY_ENGINE_MAX_FOV, Math.max(SKY_ENGINE_MIN_FOV, fov))
}

export function stepSkyEngineFov(currentFov: number, deltaY: number) {
  if (deltaY === 0) {
    return clampSkyEngineFov(currentFov)
  }

  const wheelDirection = Math.sign(deltaY)
  const zoomExponent = Math.max(1, Math.abs(deltaY) / 120) * 2
  const zoomScale = Math.pow(SKY_ENGINE_WHEEL_ZOOM_FACTOR, wheelDirection * zoomExponent)

  return clampSkyEngineFov(currentFov * zoomScale)
}

export function getSkyEngineFovDegrees(fovRadians: number) {
  return (fovRadians * 180) / Math.PI
}

export function rotateVectorTowardPointerAnchor(
  currentTarget: Vector3,
  nextPointerDirection: Vector3,
  previousPointerDirection: Vector3,
) {
  if (currentTarget.lengthSquared() === 0) {
    return currentTarget.clone()
  }

  const sourceDirection = nextPointerDirection.normalizeToNew()
  const targetDirection = previousPointerDirection.normalizeToNew()
  const dotProduct = clampDotProduct(Vector3.Dot(sourceDirection, targetDirection))

  if (dotProduct > 0.999999) {
    return currentTarget.clone()
  }

  let rotationAxis = Vector3.Cross(sourceDirection, targetDirection)

  if (rotationAxis.lengthSquared() < 1e-10) {
    rotationAxis = Vector3.Cross(sourceDirection, Math.abs(sourceDirection.y) < 0.98 ? Vector3.Up() : Vector3.Right())
  }

  const rotatedDirection = rotateVectorAroundAxis(
    currentTarget.normalizeToNew(),
    rotationAxis,
    Math.acos(dotProduct),
  )

  return rotatedDirection.normalize().scale(currentTarget.length())
}

export function buildInitialViewTarget(objects: readonly SkyEngineSceneObject[], guidedObjectIds: readonly string[]) {
  const guidedSet = new Set(guidedObjectIds)
  const targetObjects = objects.filter(
    (object) => object.isAboveHorizon && (guidedSet.has(object.id) || object.source === 'computed_real_sky' || object.type === 'deep_sky'),
  )

  if (targetObjects.length === 0) {
    return horizontalToDirection(16, 0)
  }

  const total = targetObjects.reduce((accumulator, object) => {
    const direction = horizontalToDirection(object.altitudeDeg, object.azimuthDeg)
    const isGuided = guidedSet.has(object.id)
    let weight = 1

    if (isGuided) {
      weight = 1.25
    }

    if (object.type === 'deep_sky') {
      weight = Math.max(weight, object.source === 'temporary_scene_seed' ? 1.02 : 1.08)
    }

    if (object.type === 'moon') {
      weight = 1.9
    }

    return accumulator.add(direction.scale(weight))
  }, Vector3.Zero())

  const totalWeight = targetObjects.reduce((accumulator, object) => {
    if (object.type === 'moon') {
      return accumulator + 1.9
    }

    if (object.type === 'deep_sky') {
      return accumulator + (object.source === 'temporary_scene_seed' ? 1.02 : 1.08)
    }

    return accumulator + (guidedSet.has(object.id) ? 1.25 : 1)
  }, 0)

  const direction = total.scale(1 / totalWeight).normalizeToNew()
  const horizonBiasedDirection = normalizeDirection(new Vector3(
    direction.x * 0.94,
    Math.max(0.12, direction.y * 0.52 + 0.14),
    direction.z,
  ))

  return horizonBiasedDirection
}

export function getSelectionTargetVector(object: SkyEngineSceneObject) {
  const target = horizontalToDirection(object.altitudeDeg, object.azimuthDeg)
  return normalizeDirection(new Vector3(target.x, Math.max(-0.08, target.y), target.z))
}

export function getDesiredFovForObject(object: SkyEngineSceneObject | null) {
  if (!object) {
    return SKY_ENGINE_DEFAULT_FOV
  }

  return Number.NaN
}

export function updateObserverNavigation(
  centerDirection: Vector3,
  currentFov: number,
  desiredFov: number,
  targetVector: Vector3 | null,
  deltaSeconds: number,
) {
  const fovEase = 1 - Math.pow(0.002, deltaSeconds * 4.2)
  const nextFov = currentFov + (desiredFov - currentFov) * fovEase

  if (!targetVector) {
    return {
      centerDirection: normalizeDirection(centerDirection),
      fovRadians: nextFov,
      targetVector: null,
    }
  }

  const lookEase = 1 - Math.pow(0.002, deltaSeconds * 2.9)
  const nextCenter = normalizeDirection(Vector3.Lerp(normalizeDirection(centerDirection), normalizeDirection(targetVector), lookEase))

  if (Vector3.Dot(nextCenter, normalizeDirection(targetVector)) > 0.99995) {
    return {
      centerDirection: normalizeDirection(targetVector),
      fovRadians: nextFov,
      targetVector: null,
    }
  }

  return {
    centerDirection: nextCenter,
    fovRadians: nextFov,
    targetVector,
  }
}
