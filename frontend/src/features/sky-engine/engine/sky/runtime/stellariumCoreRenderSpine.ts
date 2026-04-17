import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../SkyEngineRuntimeBridge'

/**
 * Stellarium `core_render` preamble (`core.c` ~521–571), control order only:
 * 1. Window / projection (`core_get_proj`: viewport sync; stereographic `fovy` from `computeStereographicFovAxes` lives in `SkyProjectionService.createView`)
 * 2. `observer_update` — ensure observer matches current props (full ERFA parity deferred)
 * 3. Magnitude limits for painter (`compute_vmag_for_radius` → `stars_limit_mag`, `hints_limit_mag`) — stub magnitudes
 * 4. `labels_reset()` — clear `runtime.visibleLabelIds`; overlay repopulates later in the render pass (or restores last sync when cadence skips)
 *
 * Then `obj_render` on sorted modules, `paint_finish` ≈ `scene.render()`, then `post_render` (`SkyModule.postRender`).
 */
export function runStellariumCoreRenderSpine(
  services: SkySceneRuntimeServices,
  runtime: SceneRuntimeRefs,
  getProps: () => ScenePropsSnapshot,
): void {
  const width = Math.max(1, runtime.canvas.clientWidth)
  const height = Math.max(1, runtime.canvas.clientHeight)
  services.projectionService.syncViewport(width, height)

  const latest = getProps()
  services.observerService.syncObserver(latest.observer)

  const fovDeg = Math.max(0.5, services.projectionService.getCurrentFovDegrees())
  runtime.corePainterLimits = {
    starsLimitMag: Math.min(14, 2 + 120 / fovDeg),
    hintsLimitMag: Math.min(12, 1 + 80 / fovDeg),
  }

  runtime.visibleLabelIds = []
}
