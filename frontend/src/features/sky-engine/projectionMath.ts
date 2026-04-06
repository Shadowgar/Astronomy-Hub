import { Vector3 } from '@babylonjs/core/Maths/math.vector'

const WORLD_UP = new Vector3(0, 1, 0)
const WORLD_NORTH = new Vector3(0, 0, 1)

export interface SkyProjectionView {
  centerDirection: Vector3
  fovRadians: number
  viewportWidth: number
  viewportHeight: number
}

export interface SkyProjectionBasis {
  center: Vector3
  east: Vector3
  north: Vector3
}

export interface SkyProjectedPoint {
  screenX: number
  screenY: number
  planeX: number
  planeY: number
  depth: number
  angularDistanceRad: number
}

function clampDot(value: number) {
  return Math.min(1, Math.max(-1, value))
}

export function normalizeDirection(direction: Vector3) {
  if (direction.lengthSquared() === 0) {
    return WORLD_NORTH.clone()
  }

  return direction.normalizeToNew()
}

export function horizontalToDirection(altitudeDeg: number, azimuthDeg: number) {
  const altitudeRad = (altitudeDeg * Math.PI) / 180
  const azimuthRad = (azimuthDeg * Math.PI) / 180
  const horizontalRadius = Math.cos(altitudeRad)

  return new Vector3(
    Math.sin(azimuthRad) * horizontalRadius,
    Math.sin(altitudeRad),
    Math.cos(azimuthRad) * horizontalRadius,
  )
}

export function directionToHorizontal(direction: Vector3) {
  const normalizedDirection = normalizeDirection(direction)
  const altitudeDeg = (Math.asin(clampDot(normalizedDirection.y)) * 180) / Math.PI
  const azimuthDeg = (((Math.atan2(normalizedDirection.x, normalizedDirection.z) * 180) / Math.PI) % 360 + 360) % 360

  return {
    altitudeDeg,
    azimuthDeg,
  }
}

export function buildProjectionBasis(centerDirection: Vector3): SkyProjectionBasis {
  const center = normalizeDirection(centerDirection)
  let east = Vector3.Cross(WORLD_UP, center)

  if (east.lengthSquared() < 1e-8) {
    east = Vector3.Cross(WORLD_NORTH, center)
  }

  east = east.normalizeToNew()
  const north = Vector3.Cross(center, east).normalizeToNew()

  return {
    center,
    east,
    north,
  }
}

export function getProjectionPlaneRadius(fovRadians: number) {
  return 2 * Math.tan(fovRadians / 4)
}

export function getProjectionScale(view: SkyProjectionView) {
  return (Math.min(view.viewportWidth, view.viewportHeight) * 0.5) / Math.max(getProjectionPlaneRadius(view.fovRadians), 1e-6)
}

export function projectDirectionToViewport(direction: Vector3, view: SkyProjectionView): SkyProjectedPoint | null {
  const basis = buildProjectionBasis(view.centerDirection)
  const normalizedDirection = normalizeDirection(direction)
  const eastComponent = Vector3.Dot(normalizedDirection, basis.east)
  const northComponent = Vector3.Dot(normalizedDirection, basis.north)
  const centerComponent = Vector3.Dot(normalizedDirection, basis.center)

  if (centerComponent <= -0.999999) {
    return null
  }

  const planeFactor = 2 / (1 + centerComponent)
  const planeX = eastComponent * planeFactor
  const planeY = northComponent * planeFactor
  const scale = getProjectionScale(view)

  return {
    screenX: view.viewportWidth * 0.5 + planeX * scale,
    screenY: view.viewportHeight * 0.5 - planeY * scale,
    planeX,
    planeY,
    depth: centerComponent,
    angularDistanceRad: Math.acos(clampDot(centerComponent)),
  }
}

export function projectHorizontalToViewport(altitudeDeg: number, azimuthDeg: number, view: SkyProjectionView) {
  return projectDirectionToViewport(horizontalToDirection(altitudeDeg, azimuthDeg), view)
}

export function unprojectViewportPoint(screenX: number, screenY: number, view: SkyProjectionView) {
  const basis = buildProjectionBasis(view.centerDirection)
  const scale = getProjectionScale(view)
  const planeX = (screenX - view.viewportWidth * 0.5) / Math.max(scale, 1e-6)
  const planeY = (view.viewportHeight * 0.5 - screenY) / Math.max(scale, 1e-6)
  const rhoSquared = planeX * planeX + planeY * planeY
  const denominator = rhoSquared + 4

  return normalizeDirection(
    basis.east.scale((4 * planeX) / denominator)
      .add(basis.north.scale((4 * planeY) / denominator))
      .add(basis.center.scale((4 - rhoSquared) / denominator)),
  )
}

export function isProjectedPointVisible(projectedPoint: SkyProjectedPoint, view: SkyProjectionView, marginPx = 0) {
  if (projectedPoint.angularDistanceRad > view.fovRadians * 0.5) {
    return false
  }

  return !(
    projectedPoint.screenX < -marginPx ||
    projectedPoint.screenX > view.viewportWidth + marginPx ||
    projectedPoint.screenY < -marginPx ||
    projectedPoint.screenY > view.viewportHeight + marginPx
  )
}