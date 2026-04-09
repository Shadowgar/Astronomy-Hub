import type { SkyModule } from '../SkyModule'
import { prepareDirectBackgroundFrame } from '../../../../directBackgroundLayer'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'

export function createAtmosphereModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-atmosphere-runtime-module',
    renderOrder: 10,
    render({ runtime, getProps }) {
      const latest = getProps()
      const projectedFrame = runtime.projectedSceneFrame

      if (!projectedFrame) {
        return
      }

      const backgroundFrame = prepareDirectBackgroundFrame(
        projectedFrame.view,
        latest.sunState,
        projectedFrame.currentFovDegrees,
      )
      runtime.directBackgroundLayer.sync(backgroundFrame)
    },
  }
}
