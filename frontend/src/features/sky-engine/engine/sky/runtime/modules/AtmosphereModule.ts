import type { SkyModule } from '../SkyModule'
import { prepareDirectAtmosphereFrame } from '../../../../directBackgroundLayer'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'

export function createAtmosphereModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-atmosphere-runtime-module',
    renderOrder: 35,
    render({ runtime, getProps }) {
      const latest = getProps()
      const projectedFrame = runtime.projectedSceneFrame
      const brightnessExposureState = runtime.brightnessExposureState

      if (!projectedFrame || !brightnessExposureState) {
        return
      }

      const atmosphereFrame = prepareDirectAtmosphereFrame(
        projectedFrame.view,
        latest.sunState,
        projectedFrame.currentFovDegrees,
        brightnessExposureState,
      )
      runtime.directBackgroundLayer.syncAtmosphere(atmosphereFrame)
    },
  }
}
