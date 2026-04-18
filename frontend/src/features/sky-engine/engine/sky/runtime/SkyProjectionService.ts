import type { Vector3 } from '@babylonjs/core/Maths/math.vector'

import {
  type SkyProjectedPoint,
  type SkyProjectionMode,
  type SkyProjectionView,
  computeStereographicFovAxes,
  getProjectionScale,
  isProjectedPointVisible,
  projectDirectionToViewport,
  projectHorizontalToViewport,
  unprojectViewportPoint,
} from '../../../projectionMath'
import { clampSkyEngineFov, getSkyEngineFovDegrees, stepSkyEngineFov } from '../../../observerNavigation'

export class SkyProjectionService {
  private projectionMode: SkyProjectionMode
  private viewportWidth = 1
  private viewportHeight = 1
  private currentFov: number
  private desiredFov: number

  constructor(config: { initialProjectionMode?: SkyProjectionMode; initialFovDegrees: number }) {
    this.projectionMode = config.initialProjectionMode ?? 'stereographic'
    this.currentFov = clampSkyEngineFov((config.initialFovDegrees * Math.PI) / 180)
    this.desiredFov = this.currentFov
  }

  syncProjectionMode(projectionMode?: SkyProjectionMode) {
    this.projectionMode = projectionMode ?? 'stereographic'
  }

  syncViewport(viewportWidth: number, viewportHeight: number) {
    this.viewportWidth = Math.max(1, viewportWidth)
    this.viewportHeight = Math.max(1, viewportHeight)
  }

  getViewportWidth() {
    return this.viewportWidth
  }

  getViewportHeight() {
    return this.viewportHeight
  }

  /** Viewport width / height (Stellarium `core_get_proj` aspect input). */
  getAspectRatio() {
    return this.viewportWidth / this.viewportHeight
  }

  /**
   * For stereographic, `SkyProjectionView.fovRadians` must follow `projection_init(..., fovy, ...)`:
   * `fovy` from `computeStereographicFovAxes` (not always equal to `core->fov` when aspect ≠ 1).
   * Other modes keep the stored diameter until their `projection_compute_fovs` port lands.
   */
  private resolveProjectionFovRadians(fovDiameterRad: number) {
    if (this.projectionMode !== 'stereographic') {
      return fovDiameterRad
    }

    return computeStereographicFovAxes(fovDiameterRad, this.getAspectRatio()).fovY
  }

  getProjectionMode() {
    return this.projectionMode
  }

  getCurrentFov() {
    return this.currentFov
  }

  getDesiredFov() {
    return this.desiredFov
  }

  setImmediateFov(fovRadians: number) {
    const nextFov = clampSkyEngineFov(fovRadians)
    this.currentFov = nextFov
    this.desiredFov = nextFov
  }

  setDesiredFov(fovRadians: number) {
    this.desiredFov = clampSkyEngineFov(fovRadians)
  }

  setCurrentFov(fovRadians: number) {
    this.currentFov = clampSkyEngineFov(fovRadians)
  }

  stepWheelFov(deltaY: number) {
    const nextDesiredFov = stepSkyEngineFov(this.desiredFov, deltaY)
    this.currentFov = nextDesiredFov
    this.desiredFov = nextDesiredFov
    return nextDesiredFov
  }

  getCurrentFovDegrees() {
    return getSkyEngineFovDegrees(this.currentFov)
  }

  createView(centerDirection: Vector3): SkyProjectionView {
    return {
      centerDirection,
      fovRadians: this.resolveProjectionFovRadians(this.currentFov),
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      projectionMode: this.projectionMode,
    }
  }

  createViewForFov(centerDirection: Vector3, fovRadians: number): SkyProjectionView {
    return {
      centerDirection,
      fovRadians: this.resolveProjectionFovRadians(fovRadians),
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      projectionMode: this.projectionMode,
    }
  }

  projectDirection(direction: Vector3, centerDirection: Vector3) {
    return projectDirectionToViewport(direction, this.createView(centerDirection))
  }

  projectHorizontal(altitudeDeg: number, azimuthDeg: number, centerDirection: Vector3) {
    return projectHorizontalToViewport(altitudeDeg, azimuthDeg, this.createView(centerDirection))
  }

  unproject(screenX: number, screenY: number, centerDirection: Vector3, fovRadians = this.currentFov) {
    return unprojectViewportPoint(screenX, screenY, this.createViewForFov(centerDirection, fovRadians))
  }

  isProjectedPointVisible(projectedPoint: SkyProjectedPoint, centerDirection: Vector3, marginPx = 0) {
    return isProjectedPointVisible(projectedPoint, this.createView(centerDirection), marginPx)
  }

  getProjectionScale(centerDirection: Vector3) {
    return getProjectionScale(this.createView(centerDirection))
  }
}
