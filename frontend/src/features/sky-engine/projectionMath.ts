import { Vector3 } from '@babylonjs/core/Maths/math.vector'

export type SkyProjectionMode = 'stereographic' | 'gnomonic' | 'orthographic'

const WORLD_UP = new Vector3(0, 1, 0)
const WORLD_NORTH = new Vector3(0, 0, 1)

export interface SkyProjectionView {
  centerDirection: Vector3
  fovRadians: number
  viewportWidth: number
  viewportHeight: number
  projectionMode?: SkyProjectionMode
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

interface SkyProjectionViewportScales {
  x: number
  y: number
}

function clampDot(value: number) {
  return Math.min(1, Math.max(-1, value))
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
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
  const { altitudeDeg, azimuthDeg } = directionToHorizontal(center)
  const altitudeRad = degreesToRadians(altitudeDeg)
  const azimuthRad = degreesToRadians(azimuthDeg)
  const east = new Vector3(
    Math.cos(azimuthRad),
    0,
    -Math.sin(azimuthRad),
  ).normalizeToNew()
  const north = new Vector3(
    -Math.sin(azimuthRad) * Math.sin(altitudeRad),
    Math.cos(altitudeRad),
    -Math.cos(azimuthRad) * Math.sin(altitudeRad),
  ).normalizeToNew()

  return {
    center,
    east,
    north,
  }
}

export function getProjectionPlaneRadius(fovRadians: number) {
  return 2 * Math.tan(fovRadians / 4)
}

/**
 * Stellarium `projection_compute_fovs` for stereographic (`proj_stereographic_compute_fov` in
 * `proj_stereographic.c`). `fovDiameterRad` is `core->fov` (angular diameter in radians).
 * `aspectWidthOverHeight` is viewport width / height.
 */
export function computeStereographicFovAxes(fovDiameterRad: number, aspectWidthOverHeight: number): { fovX: number; fovY: number } {
  if (aspectWidthOverHeight < 1) {
    const fovx = fovDiameterRad
    const fovy = 4 * Math.atan(Math.tan(fovDiameterRad / 4) / aspectWidthOverHeight)
    return { fovX: fovx, fovY: fovy }
  }

  const fovy = fovDiameterRad
  const fovx = 4 * Math.atan(Math.tan(fovDiameterRad / 4) * aspectWidthOverHeight)
  return { fovX: fovx, fovY: fovy }
}

function getProjectionPlaneRadiusForMode(fovRadians: number, projectionMode: SkyProjectionMode) {
  if (projectionMode === 'gnomonic') {
    return Math.tan(fovRadians / 2)
  }

  if (projectionMode === 'orthographic') {
    return Math.sin(fovRadians / 2)
  }

  return getProjectionPlaneRadius(fovRadians)
}

export function getProjectionScale(view: SkyProjectionView) {
  const scales = getProjectionViewportScales(view)
  return Math.min(scales.x, scales.y)
}

function getProjectionViewportScales(view: SkyProjectionView): SkyProjectionViewportScales {
  const projectionRadius = Math.max(getProjectionPlaneRadiusForMode(view.fovRadians, view.projectionMode ?? 'stereographic'), 1e-6)
  const uniformScale = (Math.min(view.viewportWidth, view.viewportHeight) * 0.5) / projectionRadius

  return {
    x: uniformScale,
    y: uniformScale,
  }
}

export function projectDirectionToViewport(direction: Vector3, view: SkyProjectionView): SkyProjectedPoint | null {
  const basis = buildProjectionBasis(view.centerDirection)
  const normalizedDirection = normalizeDirection(direction)
  const eastComponent = Vector3.Dot(normalizedDirection, basis.east)
  const northComponent = Vector3.Dot(normalizedDirection, basis.north)
  const centerComponent = Vector3.Dot(normalizedDirection, basis.center)
  const projectionMode = view.projectionMode ?? 'stereographic'

  if (centerComponent <= -0.999999) {
    return null
  }

  if (projectionMode === 'gnomonic' && centerComponent <= 0) {
    return null
  }

  let planeX = 0
  let planeY = 0

  if (projectionMode === 'orthographic') {
    planeX = eastComponent
    planeY = northComponent
  } else if (projectionMode === 'gnomonic') {
    planeX = eastComponent / Math.max(centerComponent, 1e-6)
    planeY = northComponent / Math.max(centerComponent, 1e-6)
  } else {
    const planeFactor = 2 / (1 + centerComponent)
    planeX = eastComponent * planeFactor
    planeY = northComponent * planeFactor
  }

  const scales = getProjectionViewportScales(view)

  return {
    screenX: view.viewportWidth * 0.5 + planeX * scales.x,
    screenY: view.viewportHeight * 0.5 - planeY * scales.y,
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
  const scales = getProjectionViewportScales(view)
  const planeX = (screenX - view.viewportWidth * 0.5) / Math.max(scales.x, 1e-6)
  const planeY = (view.viewportHeight * 0.5 - screenY) / Math.max(scales.y, 1e-6)
  const projectionMode = view.projectionMode ?? 'stereographic'

  if (projectionMode === 'orthographic') {
    const radiusSquared = planeX * planeX + planeY * planeY
    const centerComponent = Math.sqrt(Math.max(0, 1 - radiusSquared))

    return normalizeDirection(
      basis.east.scale(planeX)
        .add(basis.north.scale(planeY))
        .add(basis.center.scale(centerComponent)),
    )
  }

  if (projectionMode === 'gnomonic') {
    return normalizeDirection(
      basis.east.scale(planeX)
        .add(basis.north.scale(planeY))
        .add(basis.center),
    )
  }

  const rhoSquared = planeX * planeX + planeY * planeY
  const denominator = rhoSquared + 4

  return normalizeDirection(
    basis.east.scale((4 * planeX) / denominator)
      .add(basis.north.scale((4 * planeY) / denominator))
      .add(basis.center.scale((4 - rhoSquared) / denominator)),
  )
}

export function isProjectedPointVisible(projectedPoint: SkyProjectedPoint, view: SkyProjectionView, marginPx = 0) {
  if ((view.projectionMode ?? 'stereographic') === 'orthographic' && projectedPoint.depth < 0) {
    return false
  }

  return !(
    projectedPoint.screenX < -marginPx ||
    projectedPoint.screenX > view.viewportWidth + marginPx ||
    projectedPoint.screenY < -marginPx ||
    projectedPoint.screenY > view.viewportHeight + marginPx
  )
}