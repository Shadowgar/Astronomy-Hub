import {
  buildSkyEnginePickTargets,
  clearSkyEnginePickTargets,
  getSkyEnginePickTargetsDataAttribute,
} from '../../../../pickTargets'
import type { SkyModule } from '../SkyModule'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import type { SkyPainterFinalizedBatch, SkyPainterQueuedCall } from '../renderer/painterPort'
import { executePainterBackendPlan, mapPainterBatchesToBackendPlan } from '../renderer/painterBackendPort'
import {
  clearSceneState,
  serializeSceneState,
} from './runtimeFrame'

const STAR_RENDER_METRICS_ATTRIBUTE = 'data-sky-engine-star-render-metrics'
const RUNTIME_PERF_METRICS_ATTRIBUTE = 'data-sky-engine-runtime-perf'
const UI_PERF_METRICS_ATTRIBUTE = 'data-sky-engine-ui-perf'
const REPORTING_CADENCE_MS = 250

type UiPerfMetricsSnapshot = Record<string, number | boolean | string | null>

type PainterStarTelemetrySnapshot = {
  frameIndex: number
  hasPaintStarsDrawIntent: boolean
  painterStarCommandCount: number
  painterStarPayloadStarCount: number | null
  directStarSyncCount: number | null
  projectedStarCount: number | null
  renderedStarCount: number | null
  magnitudeRange: {
    limitingMagnitude: number | null
    minRenderedMagnitude: number | null
    maxRenderedMagnitude: number | null
  }
  renderAlphaRange: {
    minRenderAlpha: number | null
    maxRenderAlpha: number | null
  }
  view: {
    fovDegrees: number | null
    projectionMode: string | null
  }
  finalizedCommandCountAfterPaintFinish: number
  finalizedPainterStarCommandCountAfterPaintFinish: number
  finalizedPainterBatchCount: number
  finalizedPainterStarsBatchCount: number
  starsBatchStarCount: number | null
  starsBatchExecutionStatus: string | null
  backendMappedBatchCount: number
  backendMappedStarsBatchCount: number
  backendMappedStarsCount: number
  backendUnsupportedBatchCount: number
  backendExecutionEnabled: boolean
  backendExecutionStatus: string | null
  backendSideBySideExecutionCount: number
  backendExecutionDisabledCount: number
  painterOwnedStarLayerCreated: boolean
  painterOwnedStarLayerSynced: boolean
  painterOwnedStarLayerStarCount: number
  directStarLayerStillActive: boolean
  comparison: {
    painterVsDirectDelta: number | null
    painterVsProjectedDelta: number | null
    painterVsRenderedDelta: number | null
    batchVsDirectDelta: number | null
    batchVsProjectedDelta: number | null
    batchVsRenderedDelta: number | null
    backendMappedVsDirectDelta: number | null
    backendMappedVsBatchDelta: number | null
    painterOwnedVsDirectDelta: number | null
  }
}

type StarsDrawIntentCommand = SkyPainterQueuedCall<'paint_stars_draw_intent'>

function isStarsDrawIntentCommand(command: SkyPainterQueuedCall): command is StarsDrawIntentCommand {
  return command.fn === 'paint_stars_draw_intent'
}

function isStarsBatch(batch: SkyPainterFinalizedBatch): batch is Extract<SkyPainterFinalizedBatch, { kind: 'stars' }> {
  return batch.kind === 'stars'
}

function buildModuleBreakdown(latestPerf: SceneRuntimeRefs['runtimePerfTelemetry']['latest']) {
  return Object.keys(latestPerf.moduleMs)
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
}

type PainterBatchTelemetryState = {
  readonly drawQueue: ReadonlyArray<SkyPainterQueuedCall>
  readonly finalizedCommands: ReadonlyArray<SkyPainterQueuedCall>
  readonly finalizedBatches: ReadonlyArray<SkyPainterFinalizedBatch>
}

function resolveNullableDelta(left: number | null, right: number | null): number | null {
  if (left == null || right == null) {
    return null
  }
  return left - right
}

function resolveBatchAggregate(finalizedStarsBatches: Array<Extract<SkyPainterFinalizedBatch, { kind: 'stars' }>>) {
  let starsBatchStarCount = 0
  let starsBatchExecutionStatus: string | null = null
  for (const batch of finalizedStarsBatches) {
    starsBatchStarCount += batch.starCount
    starsBatchExecutionStatus = batch.executionStatus
  }
  return {
    starsBatchStarCount,
    starsBatchExecutionStatus,
  }
}

function buildPainterStarTelemetry(params: {
  frameIndex: number
  painter: PainterBatchTelemetryState
  latestPerf: SceneRuntimeRefs['runtimePerfTelemetry']['latest']
  latestProjectionMode: string | null | undefined
  projectedStarCount: number | null
  backendMappingPlan: ReturnType<typeof mapPainterBatchesToBackendPlan>
  backendExecutionPlan: ReturnType<typeof executePainterBackendPlan>
}): PainterStarTelemetrySnapshot {
  const starIntentCommands = params.painter.drawQueue.filter(isStarsDrawIntentCommand)
  const finalizedStarIntentCommands = params.painter.finalizedCommands.filter(isStarsDrawIntentCommand)
  const finalizedBatches = params.painter.finalizedBatches
  const finalizedStarsBatches = finalizedBatches.filter(isStarsBatch)

  let lastStarIntentCommand: StarsDrawIntentCommand | null = null
  for (const command of starIntentCommands) {
    lastStarIntentCommand = command
  }

  const batchAggregate = resolveBatchAggregate(finalizedStarsBatches)

  const painterStarPayloadStarCount = typeof lastStarIntentCommand?.payload.starCount === 'number'
    ? lastStarIntentCommand.payload.starCount
    : null
  const directStarSyncCount = typeof params.latestPerf.stepMs.starLayerSyncCount === 'number'
    ? params.latestPerf.stepMs.starLayerSyncCount
    : params.projectedStarCount
  const renderedStarCount = Number.isFinite(params.latestPerf.starCount) ? params.latestPerf.starCount : null
  const batchStarCountForDelta = finalizedStarsBatches.length > 0 ? batchAggregate.starsBatchStarCount : null

  return {
    frameIndex: params.frameIndex,
    hasPaintStarsDrawIntent: starIntentCommands.length > 0,
    painterStarCommandCount: starIntentCommands.length,
    painterStarPayloadStarCount,
    directStarSyncCount,
    projectedStarCount: params.projectedStarCount,
    renderedStarCount,
    magnitudeRange: {
      limitingMagnitude: lastStarIntentCommand?.payload.magnitude.limitingMagnitude ?? null,
      minRenderedMagnitude: lastStarIntentCommand?.payload.magnitude.minRenderedMagnitude ?? null,
      maxRenderedMagnitude: lastStarIntentCommand?.payload.magnitude.maxRenderedMagnitude ?? null,
    },
    renderAlphaRange: {
      minRenderAlpha: lastStarIntentCommand?.payload.magnitude.minRenderAlpha ?? null,
      maxRenderAlpha: lastStarIntentCommand?.payload.magnitude.maxRenderAlpha ?? null,
    },
    view: {
      fovDegrees: lastStarIntentCommand?.payload.view.fovDegrees ?? null,
      projectionMode: lastStarIntentCommand?.payload.view.projectionMode ?? params.latestProjectionMode ?? null,
    },
    finalizedCommandCountAfterPaintFinish: params.painter.finalizedCommands.length,
    finalizedPainterStarCommandCountAfterPaintFinish: finalizedStarIntentCommands.length,
    finalizedPainterBatchCount: finalizedBatches.length,
    finalizedPainterStarsBatchCount: finalizedStarsBatches.length,
    starsBatchStarCount: batchStarCountForDelta,
    starsBatchExecutionStatus: batchAggregate.starsBatchExecutionStatus,
    backendMappedBatchCount: params.backendMappingPlan.summary.mappedBatchCount,
    backendMappedStarsBatchCount: params.backendMappingPlan.summary.mappedStarsBatchCount,
    backendMappedStarsCount: params.backendExecutionPlan.summary.mappedStarsCount,
    backendUnsupportedBatchCount: params.backendMappingPlan.summary.unsupportedBatchCount,
    backendExecutionEnabled: params.backendExecutionPlan.summary.executionEnabled,
    backendExecutionStatus: params.backendExecutionPlan.summary.executionStatus,
    backendSideBySideExecutionCount: params.backendExecutionPlan.summary.sideBySideExecutionCount,
    backendExecutionDisabledCount: params.backendExecutionPlan.summary.executionDisabledCount,
    painterOwnedStarLayerCreated: params.backendExecutionPlan.summary.painterOwnedStarLayerCreated,
    painterOwnedStarLayerSynced: params.backendExecutionPlan.summary.painterOwnedStarLayerSynced,
    painterOwnedStarLayerStarCount: params.backendExecutionPlan.summary.painterOwnedStarLayerStarCount,
    directStarLayerStillActive: params.backendExecutionPlan.summary.directStarLayerStillActive,
    comparison: {
      painterVsDirectDelta: resolveNullableDelta(painterStarPayloadStarCount, directStarSyncCount),
      painterVsProjectedDelta: resolveNullableDelta(painterStarPayloadStarCount, params.projectedStarCount),
      painterVsRenderedDelta: resolveNullableDelta(painterStarPayloadStarCount, renderedStarCount),
      batchVsDirectDelta: resolveNullableDelta(batchStarCountForDelta, directStarSyncCount),
      batchVsProjectedDelta: resolveNullableDelta(batchStarCountForDelta, params.projectedStarCount),
      batchVsRenderedDelta: resolveNullableDelta(batchStarCountForDelta, renderedStarCount),
      backendMappedVsDirectDelta: resolveNullableDelta(
        params.backendExecutionPlan.summary.mappedStarsCount,
        directStarSyncCount,
      ),
      backendMappedVsBatchDelta: resolveNullableDelta(
        params.backendExecutionPlan.summary.mappedStarsCount,
        batchStarCountForDelta,
      ),
      painterOwnedVsDirectDelta: resolveNullableDelta(
        params.backendExecutionPlan.summary.painterOwnedStarLayerSynced
          ? params.backendExecutionPlan.summary.painterOwnedStarLayerStarCount
          : null,
        directStarSyncCount,
      ),
    },
  }
}

function toDatasetKey(attribute: string) {
  return attribute
    .replace(/^data-/, '')
    .split('-')
    .map((segment, index) => (index === 0 ? segment : `${segment[0]?.toUpperCase() ?? ''}${segment.slice(1)}`))
    .join('')
}

function setDatasetAttribute(element: HTMLElement, attribute: string, value: string) {
  element.dataset[toDatasetKey(attribute)] = value
}

function isHtmlElement(value: unknown): value is HTMLElement {
  return typeof HTMLElement !== 'undefined' && value instanceof HTMLElement
}

function readUiPerfMetrics(
  canvas: HTMLCanvasElement,
  state: { lastUiPerfRaw: string | null; lastUiPerfValue: UiPerfMetricsSnapshot | null },
) {
  const root = canvas.closest('.sky-engine-page')
  if (!isHtmlElement(root)) {
    return null
  }

  const raw = root.dataset.skyEngineUiPerf ?? null
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
    shouldPublishRuntimePerfAtPostRender: false,
    lastSceneStateJson: null as string | null,
    lastStarMetricsJson: null as string | null,
    lastRuntimePerfJson: null as string | null,
    lastPickTargetsJson: null as string | null,
    lastUiPerfRaw: null as string | null,
    lastUiPerfValue: null as UiPerfMetricsSnapshot | null,
  }

  return {
    id: 'sky-scene-reporting-runtime-module',
    renderOrder: 105,
    render({ runtime, services, getProps }) {
      const latest = getProps()
      const projectedFrame = runtime.projectedSceneFrame

      if (!projectedFrame) {
        return
      }

      const currentFovDegrees = Number(projectedFrame.currentFovDegrees.toFixed(1))

      const nowMs = performance.now()
      reportingState.shouldPublishRuntimePerfAtPostRender =
        reportingState.lastPublishAtMs === 0 || nowMs - reportingState.lastPublishAtMs >= REPORTING_CADENCE_MS
      if (!reportingState.shouldPublishRuntimePerfAtPostRender) {
        return
      }
      reportingState.lastPublishAtMs = nowMs

      const sceneStateJson = serializeSceneState({
        backendStarCount: latest.backendStars.length,
        objects: latest.objects,
        dataMode: latest.scenePacket?.diagnostics?.dataMode ?? 'loading',
        sourceLabel: latest.scenePacket?.diagnostics?.sourceLabel ?? 'Loading tiles…',
        selectedObjectId: latest.selectedObjectId,
        trajectoryObjectId: runtime.trajectoryObjectId,
        visibleLabelIds: runtime.visibleLabelIds,
        guidedObjectIds: latest.guidedObjectIds,
        aidVisibility: latest.aidVisibility,
        currentFovDegrees,
        currentLodTier: projectedFrame.lod.tier,
        labelCap: projectedFrame.lod.labelCap,
        groundTextureMode: 'direct-babylon-background-object-and-overlay-layer',
        groundTextureAssetPath: 'direct Babylon backdrop, glare, horizon blocking, objects, and overlays',
      })
      if (sceneStateJson !== reportingState.lastSceneStateJson) {
        setDatasetAttribute(runtime.canvas, 'data-sky-engine-scene-state', sceneStateJson)
        reportingState.lastSceneStateJson = sceneStateJson
      }
      const starRenderMetricsJson = JSON.stringify({
        starThinInstanceCount: runtime.projectedStarsFrame?.projectedStars.length ?? 0,
        starMeshCount: runtime.scene.meshes.filter((mesh) => mesh.name.startsWith('sky-engine-star-')).length,
        starMaterialCount: runtime.scene.materials.filter((material) => material.name.startsWith('sky-engine-star-')).length,
        starTextureCount: runtime.scene.textures.filter((texture) => texture.name.startsWith('sky-engine-star-')).length,
      })
      if (starRenderMetricsJson !== reportingState.lastStarMetricsJson) {
        setDatasetAttribute(runtime.canvas, STAR_RENDER_METRICS_ATTRIBUTE, starRenderMetricsJson)
        reportingState.lastStarMetricsJson = starRenderMetricsJson
      }
      const pickTargetsJson = JSON.stringify(buildSkyEnginePickTargets(runtime.projectedPickEntries))
      if (pickTargetsJson !== reportingState.lastPickTargetsJson) {
        setDatasetAttribute(runtime.canvas, getSkyEnginePickTargetsDataAttribute(), pickTargetsJson)
        reportingState.lastPickTargetsJson = pickTargetsJson
      }
    },
    postRender({ runtime, services, getProps, frameState }) {
      if (!reportingState.shouldPublishRuntimePerfAtPostRender) {
        return
      }

      const latestPerf = runtime.runtimePerfTelemetry.latest
      const emaPerf = runtime.runtimePerfTelemetry.ema
      const projectionMs = (latestPerf.stepMs.collectProjectedStarsMs ?? 0) + (latestPerf.stepMs.collectProjectedNonStarObjectsMs ?? 0)
      const projectionShare = latestPerf.frameTotalMs > 0 ? projectionMs / latestPerf.frameTotalMs : 0
      const uiPerf = readUiPerfMetrics(runtime.canvas, reportingState)
      const moduleBreakdown = buildModuleBreakdown(latestPerf)

      const latest = getProps()
      const painter = frameState.render.painter
      const backendMappingPlan = mapPainterBatchesToBackendPlan({
        finalizedBatches: painter.finalizedBatches,
      })
      const backendExecutionPlan = executePainterBackendPlan({
        finalizedBatches: painter.finalizedBatches,
        mappingPlan: backendMappingPlan,
        executionEnabled: runtime.painterBackendExecutionEnabled,
        sideBySideRenderer: runtime.directStarLayer,
        painterOwnedStarLayer: runtime.painterOwnedStarBackendLayer,
        projectedStarsFrame: runtime.projectedStarsFrame
          ? {
              projectedStars: runtime.projectedStarsFrame.projectedStars,
              width: runtime.projectedStarsFrame.width,
              height: runtime.projectedStarsFrame.height,
            }
          : null,
        selectedObjectId: latest.selectedObjectId,
        animationTimeSeconds: services.clockService.getAnimationTimeSeconds(),
        directStarLayerStillActive: (latestPerf.stepMs.starLayerSyncCallCount ?? 0) > 0,
      })
      const painterStarTelemetry = buildPainterStarTelemetry({
        frameIndex: frameState.frameIndex,
        painter,
        latestPerf,
        latestProjectionMode: latest.projectionMode,
        projectedStarCount: runtime.projectedStarsFrame?.projectedStars.length ?? null,
        backendMappingPlan,
        backendExecutionPlan,
      })

      const runtimePerfJson = JSON.stringify({
        latest: latestPerf,
        ema: emaPerf,
        projectionShare,
        moduleBreakdown,
        brightnessExposureState: runtime.brightnessExposureState,
        painterStarTelemetry,
        uiPerf,
      })
      if (runtimePerfJson !== reportingState.lastRuntimePerfJson) {
        setDatasetAttribute(runtime.canvas, RUNTIME_PERF_METRICS_ATTRIBUTE, runtimePerfJson)
        reportingState.lastRuntimePerfJson = runtimePerfJson
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
      reportingState.shouldPublishRuntimePerfAtPostRender = false
    },
  }
}
