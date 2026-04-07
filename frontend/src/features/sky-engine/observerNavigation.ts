import { Vector3 } from '@babylonjs/core/Maths/math.vector'

import { directionToHorizontal, horizontalToDirection, normalizeDirection } from './projectionMath'
import type { SkyEngineSceneObject } from './types'

const DEGREE = Math.PI / 180
const STELLARIUM_MIN_FOV_DEGREES = 0.000278
const BABYLON_SAFE_MAX_FOV_DEGREES = 175
const SKY_ENGINE_MAX_PITCH_DEGREES = 89.95

export const SKY_ENGINE_MIN_FOV = STELLARIUM_MIN_FOV_DEGREES * DEGREE
export const SKY_ENGINE_MAX_FOV = BABYLON_SAFE_MAX_FOV_DEGREES * DEGREE
const SKY_ENGINE_WHEEL_ZOOM_FACTOR = 1.05

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

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

export function stabilizeSkyEngineCenterDirection(direction: Vector3) {
  const normalizedDirection = normalizeDirection(direction)
  const horizontal = directionToHorizontal(normalizedDirection)
  const clampedAltitudeDeg = clamp(horizontal.altitudeDeg, -SKY_ENGINE_MAX_PITCH_DEGREES, SKY_ENGINE_MAX_PITCH_DEGREES)

  return normalizeDirection(horizontalToDirection(clampedAltitudeDeg, horizontal.azimuthDeg))
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

  return stabilizeSkyEngineCenterDirection(rotatedDirection).scale(currentTarget.length())
}

export function getSelectionTargetVector(object: SkyEngineSceneObject) {
  const target = horizontalToDirection(object.altitudeDeg, object.azimuthDeg)
  return normalizeDirection(target)
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
      centerDirection: stabilizeSkyEngineCenterDirection(centerDirection),
      fovRadians: nextFov,
      targetVector: null,
    }
  }

  const lookEase = 1 - Math.pow(0.002, deltaSeconds * 2.9)
  const nextCenter = stabilizeSkyEngineCenterDirection(
    Vector3.Lerp(normalizeDirection(centerDirection), normalizeDirection(targetVector), lookEase),
  )

  if (Vector3.Dot(nextCenter, normalizeDirection(targetVector)) > 0.99995) {
    return {
      centerDirection: stabilizeSkyEngineCenterDirection(targetVector),
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
