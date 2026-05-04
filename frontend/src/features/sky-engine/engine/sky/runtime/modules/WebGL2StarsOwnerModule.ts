import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import type { StellariumRendererContract } from '../../renderer/stellariumRendererContract'
import type { SkyModule } from '../SkyModule'
import { incrementSkyInteractionTraceCount } from '../interactionTrace'
import type { WebGL2StarsHarnessColorMode } from '../../../../webgl2StarsHarnessConfig'
import type { SkyTileCatalog } from '../../contracts/tiles'

const DEFAULT_PIXEL_RATIO = 1
const DEFAULT_DIAGNOSTICS_THROTTLE_MS = 250

function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now()
  }
  return Date.now()
}

export type WebGL2StarsOwnerDirectLayerStatus = 'visible' | 'suppressed' | 'fallback'

export interface WebGL2StarsOwnerDiagnostics {
  readonly ownerTrialEnabled: boolean
  readonly backendHealthy: boolean
  readonly fallbackActive: boolean
  readonly backendName: string | null
  readonly submittedPointCount: number
  readonly drawnPointCount: number
  readonly submittedPointItemCount: number
  readonly drawnPointItemCount: number
  readonly skippedUnsupportedItemCount: number
  readonly directStarLayerStarCount: number
  readonly directStarLayerAvailable: boolean
  readonly directStarLayerVisible: boolean
  readonly directStarLayerStatus: WebGL2StarsOwnerDirectLayerStatus
  readonly fallbackReason: string | null
  readonly frameRenderError: string | null
  readonly frameIndex: number
  readonly note: string | null
  readonly prepareFrameMs: number
  readonly submitFrameMs: number
  readonly renderFrameMs: number
  readonly totalFrameMs: number
  readonly frameDeltaMs: number | null
  readonly approximateFps: number | null
  readonly diagnosticsThrottled: boolean
  readonly diagnosticsThrottleMs: number
  readonly lastSuccessfulFrameCount: number | null
  readonly lastSuccessfulFrameAtIso: string | null
  readonly repositoryMode: SkyTileCatalog
  readonly scenePacketDataMode: ScenePropsSnapshot['scenePacket'] extends null ? never : string | null
  readonly scenePacketSourceLabel: string | null
  readonly scenePacketLimitingMagnitude: number | null
  readonly scenePacketStarsListVisitCount: number | null
  readonly scenePacketStarCount: number
  readonly rendererBoundaryPointCount: number
  readonly comparisonHarnessEnabled: boolean
  readonly pointScale: number
  readonly alphaScale: number
  readonly colorMode: WebGL2StarsHarnessColorMode
  readonly debugDarkModeEnabled: boolean
  readonly debugStarsVisibleOverrideEnabled: boolean
}

export function createWebGL2StarsOwnerModule(input: {
  enabled: boolean
  comparisonHarnessEnabled: boolean
  repositoryMode: SkyTileCatalog
  renderer: StellariumRendererContract
  forceFailure?: boolean
  pointScale?: number
  alphaScale?: number
  colorMode?: WebGL2StarsHarnessColorMode
  debugDarkModeEnabled?: boolean
  debugStarsVisibleOverrideEnabled?: boolean
  diagnosticsThrottleMs?: number
  getNowMs?: () => number
  getNowIso?: () => string
  onDiagnostics?: (diagnostics: WebGL2StarsOwnerDiagnostics) => void
}): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  let initialized = false
  let viewportWidth = 0
  let viewportHeight = 0
  let lastRenderAtMs: number | null = null
  let lastDiagnosticsAtMs = Number.NEGATIVE_INFINITY
  let lastSuccessfulFrameCount: number | null = null
  let lastSuccessfulFrameAtIso: string | null = null

  const pointScale = Number.isFinite(input.pointScale) ? Math.max(0.25, Math.min(6, input.pointScale ?? 1)) : 1
  const alphaScale = Number.isFinite(input.alphaScale) ? Math.max(0.1, Math.min(4, input.alphaScale ?? 1)) : 1
  const colorMode: WebGL2StarsHarnessColorMode = input.colorMode ?? 'payload'
  const diagnosticsThrottleMs = Math.max(0, input.diagnosticsThrottleMs ?? DEFAULT_DIAGNOSTICS_THROTTLE_MS)
  const resolveNowMs = input.getNowMs ?? nowMs
  const resolveNowIso = input.getNowIso ?? (() => new Date().toISOString())

  const emitDiagnostics = (
    diagnostics: Omit<
      WebGL2StarsOwnerDiagnostics,
      'ownerTrialEnabled' | 'comparisonHarnessEnabled' | 'diagnosticsThrottled' | 'diagnosticsThrottleMs'
    >,
  ) => {
    const currentNowMs = resolveNowMs()
    if (diagnosticsThrottleMs > 0 && currentNowMs - lastDiagnosticsAtMs < diagnosticsThrottleMs) {
      return
    }

    lastDiagnosticsAtMs = currentNowMs
    input.onDiagnostics?.({
      ownerTrialEnabled: input.enabled,
      comparisonHarnessEnabled: input.comparisonHarnessEnabled,
      diagnosticsThrottled: diagnosticsThrottleMs > 0,
      diagnosticsThrottleMs,
      ...diagnostics,
    })
  }

  const ensureInitialized = (runtime: SceneRuntimeRefs) => {
    const width = runtime.engine.getRenderWidth()
    const height = runtime.engine.getRenderHeight()

    if (!initialized) {
      input.renderer.init({
        viewport: {
          width,
          height,
          pixelRatio: DEFAULT_PIXEL_RATIO,
        },
      })
      initialized = true
      viewportWidth = width
      viewportHeight = height
      return
    }

    if (width !== viewportWidth || height !== viewportHeight) {
      input.renderer.resize({
        width,
        height,
        pixelRatio: DEFAULT_PIXEL_RATIO,
      })
      viewportWidth = width
      viewportHeight = height
    }
  }

  const setDirectStarLayerVisible = (runtime: SceneRuntimeRefs, visible: boolean) => {
    runtime.directStarLayer.setVisible(visible)
  }

  return {
    id: 'webgl2-stars-owner-module',
    renderOrder: 96,
    render({ runtime, services, getProps, frameState }) {
      if (!input.enabled) {
        setDirectStarLayerVisible(runtime, true)
        return
      }

      const currentNowMs = resolveNowMs()
      const frameDeltaMs = lastRenderAtMs == null ? null : currentNowMs - lastRenderAtMs
      const approximateFps = frameDeltaMs && frameDeltaMs > 0 ? 1000 / frameDeltaMs : null
      lastRenderAtMs = currentNowMs

      const props = getProps()
      const directStarLayerStarCount = runtime.projectedStarsFrame?.projectedStars.length ?? 0
      const commonDiagnostics = {
        repositoryMode: input.repositoryMode,
        scenePacketDataMode: props.scenePacket?.diagnostics?.dataMode ?? null,
        scenePacketSourceLabel: props.scenePacket?.diagnostics?.sourceLabel ?? null,
        scenePacketLimitingMagnitude: props.scenePacket?.diagnostics?.limitingMagnitude ?? null,
        scenePacketStarsListVisitCount: props.scenePacket?.diagnostics?.starsListVisitCount ?? null,
        scenePacketStarCount: props.scenePacket?.stars.length ?? 0,
        rendererBoundaryPointCount: runtime.rendererBoundaryStarsPointItem?.pointCount ?? 0,
        directStarLayerAvailable: runtime.directStarLayer != null,
        pointScale,
        alphaScale,
        colorMode,
        debugDarkModeEnabled: Boolean(input.debugDarkModeEnabled),
        debugStarsVisibleOverrideEnabled: Boolean(input.debugStarsVisibleOverrideEnabled),
      } as const

      if (!runtime.projectedStarsFrame || !runtime.rendererBoundaryStarsPointItem) {
        setDirectStarLayerVisible(runtime, true)
        emitDiagnostics({
          backendHealthy: false,
          backendName: null,
          submittedPointCount: 0,
          drawnPointCount: 0,
          submittedPointItemCount: 0,
          drawnPointItemCount: 0,
          skippedUnsupportedItemCount: 0,
          directStarLayerStarCount,
          directStarLayerVisible: true,
          directStarLayerStatus: 'visible',
          fallbackReason: 'Renderer boundary stars are not ready; directStarLayer remains visible.',
          frameRenderError: null,
          frameIndex: frameState.frameIndex,
          note: null,
          prepareFrameMs: 0,
          submitFrameMs: 0,
          renderFrameMs: 0,
          totalFrameMs: 0,
          frameDeltaMs,
          approximateFps,
          lastSuccessfulFrameCount,
          lastSuccessfulFrameAtIso,
          fallbackActive: true,
          ...commonDiagnostics,
        })
        return
      }

      try {
        ensureInitialized(runtime)

        if (input.forceFailure) {
          throw new Error('WebGL2 owner trial forced failure for fallback verification.')
        }

        const frameInput = {
          observer: {
            latitudeDeg: props.observer.latitude,
            longitudeDeg: props.observer.longitude,
            elevationM: props.observer.elevationFt * 0.3048,
          },
          time: {
            timestampIso: services.clockService.getSceneTimestampIso() ?? props.initialSceneTimestampIso,
            animationTimeSeconds: services.clockService.getAnimationTimeSeconds(),
          },
          projectionMode: props.projectionMode ?? 'stereographic',
          fovDegrees: props.initialViewState.fovDegrees,
          viewport: {
            width: runtime.engine.getRenderWidth(),
            height: runtime.engine.getRenderHeight(),
            pixelRatio: DEFAULT_PIXEL_RATIO,
          },
          camera: {
            centerDirection: services.navigationService.getCenterDirection(),
          },
        } as const

        input.renderer.prepareFrame(frameInput)
        input.renderer.submitFrame({
          frameInput,
          renderItems: [runtime.rendererBoundaryStarsPointItem],
          pointStyleCalibration: {
            pointScale,
            alphaScale,
            colorMode,
          },
        })
        const frameOutput = input.renderer.renderFrame()
        incrementSkyInteractionTraceCount(runtime.interactionTraceTelemetry, 'webgl2OwnerRenderFrameCount')
        incrementSkyInteractionTraceCount(
          runtime.interactionTraceTelemetry,
          'webgl2OwnerBufferUploadCount',
          frameOutput.diagnostics.submittedPointItemCount,
        )

        setDirectStarLayerVisible(runtime, false)
        lastSuccessfulFrameCount = frameOutput.diagnostics.lastFrameSequence
        lastSuccessfulFrameAtIso = resolveNowIso()
        emitDiagnostics({
          backendHealthy: true,
          fallbackActive: false,
          backendName: frameOutput.activeBackendName,
          submittedPointCount: frameOutput.diagnostics.submittedPointCount,
          drawnPointCount: frameOutput.diagnostics.drawnPointCount,
          submittedPointItemCount: frameOutput.diagnostics.submittedPointItemCount,
          drawnPointItemCount: frameOutput.diagnostics.drawnPointItemCount,
          skippedUnsupportedItemCount: frameOutput.diagnostics.skippedUnsupportedItemCount,
          directStarLayerStarCount,
          directStarLayerVisible: false,
          directStarLayerStatus: 'suppressed',
          fallbackReason: null,
          frameRenderError: null,
          frameIndex: frameState.frameIndex,
          note: frameOutput.diagnostics.notes[frameOutput.diagnostics.notes.length - 1] ?? null,
          prepareFrameMs: frameOutput.timing.prepareFrameMs,
          submitFrameMs: frameOutput.timing.submitFrameMs,
          renderFrameMs: frameOutput.timing.renderFrameMs,
          totalFrameMs: frameOutput.timing.totalFrameMs,
          frameDeltaMs,
          approximateFps,
          lastSuccessfulFrameCount,
          lastSuccessfulFrameAtIso,
          ...commonDiagnostics,
        })
      } catch (error) {
        const frameRenderError = error instanceof Error ? error.message : String(error)
        setDirectStarLayerVisible(runtime, true)
        emitDiagnostics({
          backendHealthy: false,
          fallbackActive: true,
          backendName: null,
          submittedPointCount: 0,
          drawnPointCount: 0,
          submittedPointItemCount: 0,
          drawnPointItemCount: 0,
          skippedUnsupportedItemCount: 0,
          directStarLayerStarCount,
          directStarLayerVisible: true,
          directStarLayerStatus: 'fallback',
          fallbackReason: frameRenderError,
          frameRenderError,
          frameIndex: frameState.frameIndex,
          note: null,
          prepareFrameMs: 0,
          submitFrameMs: 0,
          renderFrameMs: 0,
          totalFrameMs: 0,
          frameDeltaMs,
          approximateFps,
          lastSuccessfulFrameCount,
          lastSuccessfulFrameAtIso,
          ...commonDiagnostics,
        })
      }
    },
    dispose({ runtime }) {
      setDirectStarLayerVisible(runtime, true)
      input.renderer.dispose()
    },
  }
}