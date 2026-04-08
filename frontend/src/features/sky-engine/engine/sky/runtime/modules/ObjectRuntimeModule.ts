import type { SkyModule } from '../SkyModule'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import {
  collectProjectedObjects,
  ensureSceneSurfaces,
  resolveViewTier,
  type RuntimeProjectedSceneFrame,
} from './runtimeFrame'

function syncDirectObjectLayer(
  runtime: SceneRuntimeRefs,
  services: SkySceneRuntimeServices,
  projectedFrame: RuntimeProjectedSceneFrame,
  latest: ScenePropsSnapshot,
) {
  runtime.directObjectLayer.sync(
    projectedFrame.projectedObjects,
    projectedFrame.width,
    projectedFrame.height,
    latest.sunState,
    latest.selectedObjectId,
    services.clockService.getAnimationTimeSeconds(),
  )
}

export function createObjectRuntimeModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-object-runtime-module',
    renderOrder: 20,
    update({ runtime, services, getProps }) {
      const latest = getProps()
      const { width, height } = ensureSceneSurfaces(runtime)

      services.projectionService.syncViewport(width, height)
      const view = services.projectionService.createView(
        services.navigationService.getCenterDirection(),
      )
      const currentFovDegrees = services.projectionService.getCurrentFovDegrees()
      const sceneTimestampIso = services.clockService.getSceneTimestampIso()
      const { projectedObjects, limitingMagnitude } = collectProjectedObjects(
        view,
        services.observerService.getObserver(),
        latest.objects,
        latest.scenePacket,
        latest.sunState,
        latest.selectedObjectId,
        sceneTimestampIso,
      )

      runtime.projectedSceneFrame = {
        width,
        height,
        currentFovDegrees,
        lod: resolveViewTier(currentFovDegrees),
        view,
        projectedObjects,
        limitingMagnitude,
        sceneTimestampIso,
      }
    },
    render({ runtime, services, getProps }) {
      const latest = getProps()
      const projectedFrame = runtime.projectedSceneFrame

      if (!projectedFrame) {
        return
      }

      syncDirectObjectLayer(runtime, services, projectedFrame, latest)
      runtime.projectedPickEntries = projectedFrame.projectedObjects.map((entry) => ({
        object: entry.object,
        screenX: entry.screenX,
        screenY: entry.screenY,
        radiusPx: entry.pickRadiusPx,
        depth: entry.depth,
      }))
    },
  }
}
