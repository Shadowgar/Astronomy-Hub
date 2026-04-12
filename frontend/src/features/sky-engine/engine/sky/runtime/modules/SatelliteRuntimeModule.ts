import type { SkyModule } from '../SkyModule'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'

export function createSatelliteRuntimeModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-satellite-runtime-module',
    renderOrder: 29,
    render({ runtime, getProps }) {
      const projectedFrame = runtime.projectedSceneFrame

      if (!projectedFrame) {
        runtime.directSatelliteLayer.sync([], 0, 0, null)
        return
      }

      const syncStartMs = performance.now()
      runtime.directSatelliteLayer.sync(
        runtime.projectedSatelliteObjects,
        projectedFrame.width,
        projectedFrame.height,
        getProps().selectedObjectId,
      )
      const syncElapsedMs = performance.now() - syncStartMs

      runtime.runtimePerfTelemetry.latest = {
        ...runtime.runtimePerfTelemetry.latest,
        stepMs: {
          ...runtime.runtimePerfTelemetry.latest.stepMs,
          satelliteLayerSyncMs: syncElapsedMs,
        },
      }
    },
  }
}