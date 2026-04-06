import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Scene } from '@babylonjs/core/scene'

import type { SkyEngineSceneObject } from './types'

const DEGREE = Math.PI / 180
const STELLARIUM_MIN_FOV_DEGREES = 0.000278
const BABYLON_SAFE_MAX_FOV_DEGREES = 175

export const SKY_ENGINE_MIN_FOV = STELLARIUM_MIN_FOV_DEGREES * DEGREE
export const SKY_ENGINE_MAX_FOV = BABYLON_SAFE_MAX_FOV_DEGREES * DEGREE
const SKY_ENGINE_WHEEL_ZOOM_FACTOR = 1.05
const SKY_ENGINE_DEFAULT_FOV = 120 * DEGREE

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

function getPointerDirection(scene: Scene, camera: UniversalCamera, pointerX: number, pointerY: number) {
  const ray = scene.createPickingRay(pointerX, pointerY, Matrix.Identity(), camera)
  return ray.direction.normalizeToNew()
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

export function applyPointerAnchoredZoom(
  scene: Scene,
  camera: UniversalCamera,
  pointerX: number,
  pointerY: number,
  nextFov: number,
) {
  const previousPointerDirection = getPointerDirection(scene, camera, pointerX, pointerY)
  const currentTarget = camera.getTarget().subtract(camera.position)

  camera.fov = nextFov

  const nextPointerDirection = getPointerDirection(scene, camera, pointerX, pointerY)
  const nextTarget = rotateVectorTowardPointerAnchor(currentTarget, nextPointerDirection, previousPointerDirection)

  camera.setTarget(camera.position.add(nextTarget))
}

export function buildInitialViewTarget(objects: readonly SkyEngineSceneObject[], guidedObjectIds: readonly string[]) {
  const guidedSet = new Set(guidedObjectIds)
  const targetObjects = objects.filter(
    (object) => object.isAboveHorizon && (guidedSet.has(object.id) || object.source === 'computed_real_sky' || object.type === 'deep_sky'),
  )

  if (targetObjects.length === 0) {
    return new Vector3(0, 28, 90)
  }

  const total = targetObjects.reduce((accumulator, object) => {
    const direction = toSkyPosition(object.altitudeDeg, object.azimuthDeg, 1)
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

  const direction = total.scale(1 / totalWeight).normalize()
  const horizonBiasedDirection = new Vector3(
    direction.x * 0.94,
    Math.max(0.12, direction.y * 0.52 + 0.14),
    direction.z,
  ).normalize()

  return horizonBiasedDirection.scale(94)
}

export function getSelectionTargetVector(object: SkyEngineSceneObject) {
  const target = toSkyPosition(object.altitudeDeg, object.azimuthDeg, 92)
  const normalized = target.normalize()
  return new Vector3(normalized.x, Math.max(-0.08, normalized.y), normalized.z).normalize().scale(92)
}

export function getDesiredFovForObject(object: SkyEngineSceneObject | null) {
  if (!object) {
    return SKY_ENGINE_DEFAULT_FOV
  }

  return Number.NaN
}

export function updateObserverNavigation(
  camera: UniversalCamera,
  desiredFov: number,
  targetVector: Vector3 | null,
  deltaSeconds: number,
) {
  const fovEase = 1 - Math.pow(0.002, deltaSeconds * 4.2)
  camera.fov += (desiredFov - camera.fov) * fovEase

  if (!targetVector) {
    return null
  }

  const currentTarget = camera.getTarget()
  const lookEase = 1 - Math.pow(0.002, deltaSeconds * 2.9)
  const nextTarget = Vector3.Lerp(currentTarget, targetVector, lookEase)
  camera.setTarget(nextTarget)

  if (Vector3.Distance(nextTarget, targetVector) < 0.08) {
    return null
  }

  return targetVector
}
