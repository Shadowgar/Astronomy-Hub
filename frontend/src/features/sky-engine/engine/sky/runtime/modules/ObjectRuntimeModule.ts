import type { SkyModule } from '../SkyModule'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import {
  collectProjectedNonStarObjects,
  mergeProjectedSceneObjects,
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
    renderOrder: 30,
    update({ runtime, services, getProps }) {
      const latest = getProps()
      const projectedStarsFrame = runtime.projectedStarsFrame

      if (!projectedStarsFrame) {
        runtime.projectedSceneFrame = null
        return
      }

      const projectedObjects = collectProjectedNonStarObjects(
        projectedStarsFrame.view,
        latest.objects,
        latest.sunState,
        latest.selectedObjectId,
      )

      runtime.projectedSceneFrame = {
        width: projectedStarsFrame.width,
        height: projectedStarsFrame.height,
        currentFovDegrees: projectedStarsFrame.currentFovDegrees,
        lod: projectedStarsFrame.lod,
        view: projectedStarsFrame.view,
        projectedObjects: mergeProjectedSceneObjects(projectedStarsFrame.projectedStars, projectedObjects),
        limitingMagnitude: projectedStarsFrame.limitingMagnitude,
        sceneTimestampIso: projectedStarsFrame.sceneTimestampIso,
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
