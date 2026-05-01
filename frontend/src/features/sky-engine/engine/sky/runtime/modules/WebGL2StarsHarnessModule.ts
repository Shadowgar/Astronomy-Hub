import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import type { StellariumRendererContract } from '../../renderer/stellariumRendererContract'
import type { SkyModule } from '../SkyModule'
import type { WebGL2StarsHarnessMode } from '../../../../webgl2StarsHarnessConfig'

export interface WebGL2StarsHarnessDiagnostics {
  readonly comparisonModeEnabled: boolean
  readonly comparisonMode: WebGL2StarsHarnessMode
  readonly backendActive: boolean
  readonly backendName: string | null
  readonly submittedPointCount: number
  readonly drawnPointCount: number
  readonly submittedPointItemCount: number
  readonly drawnPointItemCount: number
  readonly directStarLayerStarCount: number
  readonly frameIndex: number
  readonly note: string | null
}

const DEFAULT_PIXEL_RATIO = 1

export function createWebGL2StarsHarnessModule(input: {
  enabled: boolean
  comparisonMode: WebGL2StarsHarnessMode
  renderer: StellariumRendererContract
  onDiagnostics?: (diagnostics: WebGL2StarsHarnessDiagnostics) => void
}): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  let initialized = false
  let viewportWidth = 0
  let viewportHeight = 0

  const emitDiagnostics = (
    diagnostics: Omit<WebGL2StarsHarnessDiagnostics, 'comparisonMode' | 'comparisonModeEnabled'>,
  ) => {
    input.onDiagnostics?.({
      comparisonModeEnabled: input.enabled,
      comparisonMode: input.comparisonMode,
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

  return {
    id: 'webgl2-stars-harness-module',
    renderOrder: 95,
    render({ runtime, services, getProps, frameState }) {
      if (!input.enabled) {
        return
      }

      ensureInitialized(runtime)

      const props = getProps()
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

      const renderItems = runtime.rendererBoundaryStarsPointItem
        ? [runtime.rendererBoundaryStarsPointItem]
        : []

      try {
        input.renderer.prepareFrame(frameInput)
        input.renderer.submitFrame({
          frameInput,
          renderItems,
        })
        const frameOutput = input.renderer.renderFrame()

        emitDiagnostics({
          backendActive: true,
          backendName: frameOutput.activeBackendName,
          submittedPointCount: frameOutput.diagnostics.submittedPointCount,
          drawnPointCount: frameOutput.diagnostics.drawnPointCount,
          submittedPointItemCount: frameOutput.diagnostics.submittedPointItemCount,
          drawnPointItemCount: frameOutput.diagnostics.drawnPointItemCount,
          directStarLayerStarCount: runtime.projectedStarsFrame?.projectedStars.length ?? 0,
          frameIndex: frameState.frameIndex,
          note: frameOutput.diagnostics.notes[frameOutput.diagnostics.notes.length - 1] ?? null,
        })
      } catch (error) {
        emitDiagnostics({
          backendActive: false,
          backendName: null,
          submittedPointCount: 0,
          drawnPointCount: 0,
          submittedPointItemCount: 0,
          drawnPointItemCount: 0,
          directStarLayerStarCount: runtime.projectedStarsFrame?.projectedStars.length ?? 0,
          frameIndex: frameState.frameIndex,
          note: error instanceof Error ? error.message : String(error),
        })
      }
    },
    dispose() {
      input.renderer.dispose()
    },
  }
}
