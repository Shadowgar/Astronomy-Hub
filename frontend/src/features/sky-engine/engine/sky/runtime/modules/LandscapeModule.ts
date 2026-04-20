import type { SkyModule } from '../SkyModule'
import { prepareDirectLandscapeFrame } from '../../../../directBackgroundLayer'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'

export function createLandscapeModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-landscape-runtime-module',
    renderOrder: 40,
    render({ runtime, getProps }) {
      const latest = getProps()
      const projectedFrame = runtime.projectedSceneFrame

      if (!projectedFrame) {
        return
      }

      const landscapeFrame = prepareDirectLandscapeFrame(
        projectedFrame.view,
        latest.sunState,
        projectedFrame.currentFovDegrees,
      )
      if (!latest.aidVisibility.landscape) {
        runtime.directBackgroundLayer.syncLandscape({
          ...landscapeFrame,
          ribbons: [],
        })
        return
      }
      runtime.directBackgroundLayer.syncLandscape(landscapeFrame)
    },
  }
}
