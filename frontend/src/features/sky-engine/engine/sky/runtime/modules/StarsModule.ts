import type { SkyModule } from '../SkyModule'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import {
  collectProjectedStars,
  ensureSceneSurfaces,
  resolveViewTier,
} from './runtimeFrame'

export function createStarsModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-stars-runtime-module',
    renderOrder: 20,
    update({ runtime, services, getProps }) {
      const latest = getProps()
      const brightnessExposureState = runtime.brightnessExposureState
      const { width, height } = ensureSceneSurfaces(runtime)

      services.projectionService.syncViewport(width, height)
      const view = services.projectionService.createView(
        services.navigationService.getCenterDirection(),
      )
      const currentFovDegrees = services.projectionService.getCurrentFovDegrees()
      const sceneTimestampIso = services.clockService.getSceneTimestampIso()
      if (!brightnessExposureState) {
        return
      }
      const { projectedStars, limitingMagnitude } = collectProjectedStars(
        view,
        services.observerService.getObserver(),
        latest.objects,
        latest.scenePacket,
        latest.sunState,
        brightnessExposureState,
        latest.selectedObjectId,
        sceneTimestampIso,
      )

      runtime.projectedStarsFrame = {
        width,
        height,
        currentFovDegrees,
        lod: resolveViewTier(currentFovDegrees),
        view,
        projectedStars,
        limitingMagnitude,
        sceneTimestampIso,
      }
    },
  }
}
