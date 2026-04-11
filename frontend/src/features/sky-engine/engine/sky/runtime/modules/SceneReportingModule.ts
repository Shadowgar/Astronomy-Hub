import {
  buildSkyEnginePickTargets,
  clearSkyEnginePickTargets,
  getSkyEnginePickTargetsDataAttribute,
} from '../../../../pickTargets'
import type { SkyModule } from '../SkyModule'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import {
  clearSceneState,
  serializeSceneState,
  updateReportedViewState,
} from './runtimeFrame'

const STAR_RENDER_METRICS_ATTRIBUTE = 'data-sky-engine-star-render-metrics'
const RUNTIME_PERF_METRICS_ATTRIBUTE = 'data-sky-engine-runtime-perf'
const UI_PERF_METRICS_ATTRIBUTE = 'data-sky-engine-ui-perf'
const REPORTING_CADENCE_MS = 150

type UiPerfMetricsSnapshot = Record<string, number | boolean | string | null>

function readUiPerfMetrics(
  canvas: HTMLCanvasElement,
  state: { lastUiPerfRaw: string | null; lastUiPerfValue: UiPerfMetricsSnapshot | null },
) {
  const root = canvas.closest('.sky-engine-page')
  if (!root) {
    return null
  }

  const raw = root.getAttribute(UI_PERF_METRICS_ATTRIBUTE)
  if (!raw) {
    state.lastUiPerfRaw = null
    state.lastUiPerfValue = null
    return null
  }

  if (raw === state.lastUiPerfRaw) {
    return state.lastUiPerfValue
  }

  try {
    const parsed = JSON.parse(raw) as UiPerfMetricsSnapshot
    state.lastUiPerfRaw = raw
    state.lastUiPerfValue = parsed
    return parsed
  } catch {
    state.lastUiPerfRaw = raw
    state.lastUiPerfValue = null
    return null
  }
}

export function createSceneReportingModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  const reportingState = {
    lastPublishAtMs: 0,
    lastSceneStateJson: null as string | null,
    lastStarMetricsJson: null as string | null,
    lastRuntimePerfJson: null as string | null,
    lastPickTargetsJson: null as string | null,
    lastUiPerfRaw: null as string | null,
    lastUiPerfValue: null as UiPerfMetricsSnapshot | null,
  }

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

      const nowMs = performance.now()
      if (reportingState.lastPublishAtMs !== 0 && nowMs - reportingState.lastPublishAtMs < REPORTING_CADENCE_MS) {
        return
      }
      reportingState.lastPublishAtMs = nowMs

      const sceneStateJson = serializeSceneState({
        backendStarCount: latest.backendStars.length,
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
      if (sceneStateJson !== reportingState.lastSceneStateJson) {
        runtime.canvas.setAttribute('data-sky-engine-scene-state', sceneStateJson)
        reportingState.lastSceneStateJson = sceneStateJson
      }
      const starRenderMetricsJson = JSON.stringify({
        starThinInstanceCount: runtime.projectedStarsFrame?.projectedStars.length ?? 0,
        starMeshCount: runtime.scene.meshes.filter((mesh) => mesh.name.startsWith('sky-engine-star-')).length,
        starMaterialCount: runtime.scene.materials.filter((material) => material.name.startsWith('sky-engine-star-')).length,
        starTextureCount: runtime.scene.textures.filter((texture) => texture.name.startsWith('sky-engine-star-')).length,
      })
      if (starRenderMetricsJson !== reportingState.lastStarMetricsJson) {
        runtime.canvas.setAttribute(STAR_RENDER_METRICS_ATTRIBUTE, starRenderMetricsJson)
        reportingState.lastStarMetricsJson = starRenderMetricsJson
      }
      const latestPerf = runtime.runtimePerfTelemetry.latest
      const emaPerf = runtime.runtimePerfTelemetry.ema
      const projectionMs = (latestPerf.stepMs.collectProjectedStarsMs ?? 0) + (latestPerf.stepMs.collectProjectedNonStarObjectsMs ?? 0)
      const projectionShare = latestPerf.frameTotalMs > 0 ? projectionMs / latestPerf.frameTotalMs : 0
      const uiPerf = readUiPerfMetrics(runtime.canvas, reportingState)
      const moduleBreakdown = Object.keys(latestPerf.moduleMs)
        .sort((left, right) => left.localeCompare(right))
        .reduce<Record<string, { updateMs: number; renderMs: number; totalMs: number }>>((accumulator, moduleId) => {
          const updateMs = latestPerf.moduleUpdateMs[moduleId] ?? 0
          const renderMs = latestPerf.moduleRenderMs[moduleId] ?? 0
          accumulator[moduleId] = {
            updateMs,
            renderMs,
            totalMs: updateMs + renderMs,
          }
          return accumulator
        }, {})

      const runtimePerfJson = JSON.stringify({
        latest: latestPerf,
        ema: emaPerf,
        projectionShare,
        moduleBreakdown,
        uiPerf,
      })
      if (runtimePerfJson !== reportingState.lastRuntimePerfJson) {
        runtime.canvas.setAttribute(RUNTIME_PERF_METRICS_ATTRIBUTE, runtimePerfJson)
        reportingState.lastRuntimePerfJson = runtimePerfJson
      }

      const pickTargetsJson = JSON.stringify(buildSkyEnginePickTargets(runtime.projectedPickEntries))
      if (pickTargetsJson !== reportingState.lastPickTargetsJson) {
        runtime.canvas.setAttribute(getSkyEnginePickTargetsDataAttribute(), pickTargetsJson)
        reportingState.lastPickTargetsJson = pickTargetsJson
      }
    },
    dispose({ runtime }) {
      clearSkyEnginePickTargets(runtime.canvas)
      runtime.canvas.removeAttribute(STAR_RENDER_METRICS_ATTRIBUTE)
      runtime.canvas.removeAttribute(RUNTIME_PERF_METRICS_ATTRIBUTE)
      clearSceneState(runtime.canvas)
      reportingState.lastPublishAtMs = 0
      reportingState.lastSceneStateJson = null
      reportingState.lastStarMetricsJson = null
      reportingState.lastRuntimePerfJson = null
      reportingState.lastPickTargetsJson = null
      reportingState.lastUiPerfRaw = null
      reportingState.lastUiPerfValue = null
    },
  }
}
