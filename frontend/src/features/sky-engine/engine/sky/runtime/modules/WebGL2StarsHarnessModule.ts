import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import { createPointRenderItem } from '../../renderer/renderItems'
import type { StellariumRendererContract } from '../../renderer/stellariumRendererContract'
import type { SkyModule } from '../SkyModule'
import type { WebGL2StarsHarnessColorMode, WebGL2StarsHarnessMode } from '../../../../webgl2StarsHarnessConfig'
import type { SkyTileCatalog } from '../../contracts/tiles'

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
  readonly syntheticDenseGridEnabled: boolean
  readonly syntheticDensePointCount: number
  readonly repositoryMode: SkyTileCatalog
  readonly scenePacketDataMode: ScenePropsSnapshot['scenePacket'] extends null ? never : string | null
  readonly scenePacketSourceLabel: string | null
  readonly scenePacketLimitingMagnitude: number | null
  readonly scenePacketStarsListVisitCount: number | null
  readonly scenePacketStarCount: number
  readonly rendererBoundaryPointCount: number
  readonly pointScale: number
  readonly alphaScale: number
  readonly colorMode: WebGL2StarsHarnessColorMode
  readonly debugDarkModeEnabled: boolean
  readonly debugStarsVisibleOverrideEnabled: boolean
}

const DEFAULT_PIXEL_RATIO = 1

export function createWebGL2StarsHarnessModule(input: {
  enabled: boolean
  comparisonMode: WebGL2StarsHarnessMode
  repositoryMode: SkyTileCatalog
  renderer: StellariumRendererContract
  denseVerificationGridEnabled?: boolean
  denseVerificationGridSize?: number
  pointScale?: number
  alphaScale?: number
  colorMode?: WebGL2StarsHarnessColorMode
  debugDarkModeEnabled?: boolean
  debugStarsVisibleOverrideEnabled?: boolean
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

  const denseGridSize = Math.max(4, Math.min(64, input.denseVerificationGridSize ?? 12))
  const pointScale = Number.isFinite(input.pointScale) ? Math.max(0.25, Math.min(6, input.pointScale ?? 1)) : 1
  const alphaScale = Number.isFinite(input.alphaScale) ? Math.max(0.1, Math.min(4, input.alphaScale ?? 1)) : 1
  const colorMode: WebGL2StarsHarnessColorMode = input.colorMode ?? 'payload'

  const buildDenseVerificationPointItem = (width: number, height: number) => {
    const columns = denseGridSize
    const rows = denseGridSize
    const payload: number[] = []
    const xStep = width / (columns + 1)
    const yStep = height / (rows + 1)

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = (column + 1) * xStep
        const y = (row + 1) * yStep
        const normalizedDepth = row / Math.max(rows - 1, 1)
        payload.push(
          x,
          y,
          normalizedDepth,
          2.8,
          210,
          255,
          255,
          225,
        )
      }
    }

    return createPointRenderItem({
      order: 900,
      pointCount: columns * rows,
      vertexPayload: payload,
      sourceModule: 'webgl2-harness-dense-grid',
      sourceObjectId: null,
      dimensions: '2d',
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

      const denseGridItem = input.denseVerificationGridEnabled
        ? buildDenseVerificationPointItem(frameInput.viewport.width, frameInput.viewport.height)
        : null
      const renderItems = denseGridItem
        ? [denseGridItem]
        : runtime.rendererBoundaryStarsPointItem
          ? [runtime.rendererBoundaryStarsPointItem]
          : []

      try {
        input.renderer.prepareFrame(frameInput)
        input.renderer.submitFrame({
          frameInput,
          renderItems,
          pointStyleCalibration: {
            pointScale,
            alphaScale,
            colorMode,
          },
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
          syntheticDenseGridEnabled: Boolean(denseGridItem),
          syntheticDensePointCount: denseGridItem?.pointCount ?? 0,
          repositoryMode: input.repositoryMode,
          scenePacketDataMode: props.scenePacket?.diagnostics?.dataMode ?? null,
          scenePacketSourceLabel: props.scenePacket?.diagnostics?.sourceLabel ?? null,
          scenePacketLimitingMagnitude: props.scenePacket?.diagnostics?.limitingMagnitude ?? null,
          scenePacketStarsListVisitCount: props.scenePacket?.diagnostics?.starsListVisitCount ?? null,
          scenePacketStarCount: props.scenePacket?.stars.length ?? 0,
          rendererBoundaryPointCount: runtime.rendererBoundaryStarsPointItem?.pointCount ?? 0,
          pointScale,
          alphaScale,
          colorMode,
          debugDarkModeEnabled: Boolean(input.debugDarkModeEnabled),
          debugStarsVisibleOverrideEnabled: Boolean(input.debugStarsVisibleOverrideEnabled),
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
          syntheticDenseGridEnabled: Boolean(input.denseVerificationGridEnabled),
          syntheticDensePointCount: input.denseVerificationGridEnabled ? denseGridSize * denseGridSize : 0,
          repositoryMode: input.repositoryMode,
          scenePacketDataMode: props.scenePacket?.diagnostics?.dataMode ?? null,
          scenePacketSourceLabel: props.scenePacket?.diagnostics?.sourceLabel ?? null,
          scenePacketLimitingMagnitude: props.scenePacket?.diagnostics?.limitingMagnitude ?? null,
          scenePacketStarsListVisitCount: props.scenePacket?.diagnostics?.starsListVisitCount ?? null,
          scenePacketStarCount: props.scenePacket?.stars.length ?? 0,
          rendererBoundaryPointCount: runtime.rendererBoundaryStarsPointItem?.pointCount ?? 0,
          pointScale,
          alphaScale,
          colorMode,
          debugDarkModeEnabled: Boolean(input.debugDarkModeEnabled),
          debugStarsVisibleOverrideEnabled: Boolean(input.debugStarsVisibleOverrideEnabled),
        })
      }
    },
    dispose() {
      input.renderer.dispose()
    },
  }
}
