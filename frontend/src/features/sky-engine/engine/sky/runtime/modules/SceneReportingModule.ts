import {
  buildSkyEnginePickTargets,
  clearSkyEnginePickTargets,
  writeSkyEnginePickTargets,
} from '../../../../pickTargets'
import type { SkyModule } from '../SkyModule'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import {
  clearSceneState,
  updateReportedViewState,
  writeSceneState,
} from './runtimeFrame'

export function createSceneReportingModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-scene-reporting-runtime-module',
    renderOrder: 90,
    render({ runtime, services, getProps }) {
      const latest = getProps()
      const projectedFrame = runtime.projectedSceneFrame

      if (!projectedFrame) {
        return
      }

      const { currentFovDegrees } = updateReportedViewState(
        runtime,
        latest,
        projectedFrame.currentFovDegrees,
        services.navigationService.getCenterDirection(),
      )

      writeSceneState({
        backendStarCount: latest.backendStars.length,
        canvas: runtime.canvas,
        objects: latest.objects,
        selectedObjectId: latest.selectedObjectId,
        trajectoryObjectId: runtime.trajectoryObjectId,
        visibleLabelIds: runtime.visibleLabelIds,
        guidedObjectIds: latest.guidedObjectIds,
        aidVisibility: latest.aidVisibility,
        currentFovDegrees,
        currentLodTier: projectedFrame.lod.tier,
        labelCap: projectedFrame.lod.labelCap,
        groundTextureMode: 'direct-babylon-background-object-and-overlay-layer',
        groundTextureAssetPath: 'direct Babylon backdrop, glare, horizon blocking, objects, and overlays with density-stars-canvas-fallback',
      })

      writeSkyEnginePickTargets(runtime.canvas, buildSkyEnginePickTargets(runtime.projectedPickEntries))
    },
    dispose({ runtime }) {
      clearSkyEnginePickTargets(runtime.canvas)
      clearSceneState(runtime.canvas)
    },
  }
}
