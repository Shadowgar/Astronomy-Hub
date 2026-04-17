import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../SkyEngineRuntimeBridge'

/**
 * Stellarium `core_update_observer` (`navigation.c`), control order only.
 *
 * - `core_update_time` — scene clock: `SkyClockService.advanceFrame` in `updateServices` (runs before this preamble).
 * - `core_update_fov` + `core_update_direction` — `SkyNavigationService.update` (FOV ease + center/target).
 * - `core_update_mount` — identity until mount pipeline exists.
 *
 * Runs before `DL_SORT` / `module_update` (see `SkyCore.update`).
 */
export function runStellariumCoreUpdateObserverPreamble(ctx: {
  runtime: SceneRuntimeRefs
  services: SkySceneRuntimeServices
  getProps: () => ScenePropsSnapshot
  deltaSeconds: number
  markFrameDirty: () => void
}): void {
  const { runtime, services, getProps, deltaSeconds, markFrameDirty } = ctx
  const latest = getProps()

  services.observerService.syncObserver(latest.observer)
  services.observerService.frameTick()

  services.navigationService.syncSelection(latest.objects, latest.selectedObjectId, services.projectionService)

  const cameraUpdateStartMs = performance.now()
  const navigationChanged = services.navigationService.update(deltaSeconds, services.projectionService)
  const cameraUpdateMs = performance.now() - cameraUpdateStartMs

  runtime.runtimePerfTelemetry.latest = {
    ...runtime.runtimePerfTelemetry.latest,
    stepMs: {
      ...runtime.runtimePerfTelemetry.latest.stepMs,
      cameraUpdateMs,
    },
  }

  if (navigationChanged) {
    markFrameDirty()
  }
}
