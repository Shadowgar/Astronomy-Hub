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

const STAR_RENDER_METRICS_ATTRIBUTE = 'data-sky-engine-star-render-metrics'
const RUNTIME_PERF_METRICS_ATTRIBUTE = 'data-sky-engine-runtime-perf'

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
      runtime.canvas.setAttribute(
        STAR_RENDER_METRICS_ATTRIBUTE,
        JSON.stringify({
          starThinInstanceCount: runtime.projectedStarsFrame?.projectedStars.length ?? 0,
          starMeshCount: runtime.scene.meshes.filter((mesh) => mesh.name.startsWith('sky-engine-star-')).length,
          starMaterialCount: runtime.scene.materials.filter((material) => material.name.startsWith('sky-engine-star-')).length,
          starTextureCount: runtime.scene.textures.filter((texture) => texture.name.startsWith('sky-engine-star-')).length,
        }),
      )
      const latestPerf = runtime.runtimePerfTelemetry.latest
      const emaPerf = runtime.runtimePerfTelemetry.ema
      const projectionMs = (latestPerf.stepMs.collectProjectedStarsMs ?? 0) + (latestPerf.stepMs.collectProjectedNonStarObjectsMs ?? 0)
      const projectionShare = latestPerf.frameTotalMs > 0 ? projectionMs / latestPerf.frameTotalMs : 0
      runtime.canvas.setAttribute(
        RUNTIME_PERF_METRICS_ATTRIBUTE,
        JSON.stringify({
          latest: latestPerf,
          ema: emaPerf,
          projectionShare,
        }),
      )

      writeSkyEnginePickTargets(runtime.canvas, buildSkyEnginePickTargets(runtime.projectedPickEntries))
    },
    dispose({ runtime }) {
      clearSkyEnginePickTargets(runtime.canvas)
      runtime.canvas.removeAttribute(STAR_RENDER_METRICS_ATTRIBUTE)
      runtime.canvas.removeAttribute(RUNTIME_PERF_METRICS_ATTRIBUTE)
      clearSceneState(runtime.canvas)
    },
  }
}
