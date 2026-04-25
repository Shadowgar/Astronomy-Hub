import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../SkyEngineRuntimeBridge'
import {
  computeStellariumCorePainterLimits,
  STELLARIUM_CORE_DEFAULT_PAINTER_PARAMS,
} from './stellariumPainterLimits'

/**
 * Stellarium `core_render` preamble (`core.c` ~521–571), control order only:
 * 1. Window / projection (`core_get_proj`: viewport sync; stereographic `fovy` from `computeStereographicFovAxes` lives in `SkyProjectionService.createView`)
 * 2. Observer state is consumed from update preamble ownership (`runStellariumCoreUpdateObserverPreamble`).
 *    Render spine keeps observer sync side-effect free to preserve deterministic one-tick-per-frame cadence.
 * 3. `compute_vmag_for_radius` → `painter.stars_limit_mag`, `painter.hints_limit_mag`; `hard_limit_mag` (`core.c` ~543–561)
 * 4. `labels_reset()` — clear `runtime.visibleLabelIds`; overlay repopulates later (or restores last sync when cadence skips)
 *
 * `paint_prepare` / GL painter are not ported here; `SkyCore.render` runs this **before** any `module.render` (`obj_render` order).
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
  runtime.observerAstrometry ??= services.observerService.getDerivedGeometry()

  const currentFovDegrees = services.projectionService.getCurrentFovDegrees()
  const viewportMinSizePx = Math.max(1, Math.min(width, height))
  const brightness = runtime.brightnessExposureState

  runtime.corePainterLimits = computeStellariumCorePainterLimits({
    ...STELLARIUM_CORE_DEFAULT_PAINTER_PARAMS,
    tonemapperP: brightness?.tonemapperP ?? STELLARIUM_CORE_DEFAULT_PAINTER_PARAMS.tonemapperP,
    tonemapperExposure: brightness?.tonemapperExposure ?? STELLARIUM_CORE_DEFAULT_PAINTER_PARAMS.tonemapperExposure,
    tonemapperLwmax: brightness?.tonemapperLwmax ?? STELLARIUM_CORE_DEFAULT_PAINTER_PARAMS.tonemapperLwmax,
    fovDeg: currentFovDegrees,
    viewportMinSizePx,
  })

  runtime.visibleLabelIds = []
}
