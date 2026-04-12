import type { SkyModule } from '../SkyModule'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'

export function createDsoRuntimeModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-dso-runtime-module',
    renderOrder: 29,
    render({ runtime, getProps }) {
      const projectedFrame = runtime.projectedSceneFrame

      if (!projectedFrame) {
        runtime.directDsoLayer.sync([], 0, 0, null)
        return
      }

      const syncStartMs = performance.now()
      runtime.directDsoLayer.sync(
        runtime.projectedDsoObjects,
        projectedFrame.width,
        projectedFrame.height,
        getProps().selectedObjectId,
      )
      const syncElapsedMs = performance.now() - syncStartMs

      runtime.runtimePerfTelemetry.latest = {
        ...runtime.runtimePerfTelemetry.latest,
        stepMs: {
          ...runtime.runtimePerfTelemetry.latest.stepMs,
          dsoLayerSyncMs: syncElapsedMs,
        },
      }
    },
  }
}