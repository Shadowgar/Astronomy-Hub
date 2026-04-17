import type { SkyModule } from '../SkyModule'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'

export function createPlanetRuntimeModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-planet-runtime-module',
    renderOrder: 30,
    render({ runtime, getProps }) {
      const projectedFrame = runtime.projectedSceneFrame

      if (!projectedFrame) {
        runtime.directPlanetLayer.sync([], 0, 0, null)
        return
      }

      const syncStartMs = performance.now()
      runtime.directPlanetLayer.sync(
        runtime.projectedPlanetObjects,
        projectedFrame.width,
        projectedFrame.height,
        getProps().selectedObjectId,
      )
      const syncElapsedMs = performance.now() - syncStartMs

      runtime.runtimePerfTelemetry.latest = {
        ...runtime.runtimePerfTelemetry.latest,
        stepMs: {
          ...runtime.runtimePerfTelemetry.latest.stepMs,
          planetLayerSyncMs: syncElapsedMs,
        },
      }
    },
  }
}