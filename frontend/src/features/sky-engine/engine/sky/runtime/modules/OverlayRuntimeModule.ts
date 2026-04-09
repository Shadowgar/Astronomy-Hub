import type { SkyModule } from '../SkyModule'
import { prepareDirectOverlayFrame } from '../../../../directOverlayLayer'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'

export function createOverlayRuntimeModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-overlay-runtime-module',
    renderOrder: 40,
    render({ runtime, services, getProps }) {
      const latest = getProps()
      const projectedFrame = runtime.projectedSceneFrame

      if (!projectedFrame) {
        return
      }

      const overlayFrame = prepareDirectOverlayFrame(
        projectedFrame.view,
        services.observerService.getObserver(),
        projectedFrame.projectedObjects,
        latest.scenePacket,
        latest.selectedObjectId,
        latest.aidVisibility,
      )
      const overlayState = runtime.directOverlayLayer.sync(
        overlayFrame,
        projectedFrame.projectedObjects,
        projectedFrame.width,
        projectedFrame.height,
        runtime.camera,
        runtime.engine,
        latest.selectedObjectId,
        new Set(latest.guidedObjectIds),
        latest.sunState,
        projectedFrame.lod.labelCap,
        projectedFrame.currentFovDegrees,
      )

      runtime.visibleLabelIds = overlayState.visibleLabelIds
      runtime.trajectoryObjectId = overlayState.trajectoryObjectId
    },
  }
}
