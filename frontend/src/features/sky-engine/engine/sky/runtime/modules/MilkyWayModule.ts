import type { ObserverSnapshot } from '../../contracts/observer'
import type { SkyModule } from '../SkyModule'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import { directionToHorizontal, type SkyProjectionView } from '../../../../projectionMath'
import type { SkyBrightnessExposureState } from '../types'
import { renderHipsSurveyToCanvas } from './hipsImageLayer'

const DEFAULT_MILKY_HIPS_BASE_URL = 'https://alasky.cds.unistra.fr/MilkyWay' // CDI/Aladin HiPS source used by Stellarium Web

export interface MilkyWayRenderState {
  readonly visibility: number
  readonly contrast: number
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function smoothstep(edge0: number, edge1: number, value: number) {
  if (edge0 === edge1) {
    return value >= edge1 ? 1 : 0
  }
  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return amount * amount * (3 - 2 * amount)
}

function limitingMagnitudeVisibilityGate(limitingMagnitude: number | undefined) {
  if (limitingMagnitude === undefined || !Number.isFinite(limitingMagnitude)) {
    return 1
  }

  return clamp((limitingMagnitude - 1) / 5, 0, 1)
}

function buildObserverSnapshot(
  view: SkyProjectionView,
  projectionMode: ObserverSnapshot['projection'],
  latitudeDeg: number,
  longitudeDeg: number,
  timestampUtc: string,
): ObserverSnapshot {
  const centerHorizontal = directionToHorizontal(view.centerDirection)

  return {
    timestampUtc,
    latitudeDeg,
    longitudeDeg,
    fovDeg: (view.fovRadians * 180) / Math.PI,
    centerAltDeg: centerHorizontal.altitudeDeg,
    centerAzDeg: centerHorizontal.azimuthDeg,
    projection: projectionMode,
  }
}

export function evaluateMilkyWayRenderState(
  brightnessExposureState: SkyBrightnessExposureState,
  limitingMagnitude?: number,
  fovDegrees?: number,
): MilkyWayRenderState {
  const gate = limitingMagnitudeVisibilityGate(limitingMagnitude)
  const fovVisibility = Number.isFinite(fovDegrees) ? smoothstep(20, 10, fovDegrees ?? 20) : 1
  const lwskyAverageProxy = Math.max(
    1e-6,
    ((brightnessExposureState.nightSkyZenithLuminance + brightnessExposureState.nightSkyHorizonLuminance) * 0.5),
  )
  const atmosphereVisibility = clamp(Math.pow(0.01 / lwskyAverageProxy, 0.55), 0.18, 1)

  return {
    visibility: clamp(brightnessExposureState.milkyWayVisibility * gate * fovVisibility * atmosphereVisibility, 0, 1),
    contrast: clamp(brightnessExposureState.milkyWayContrast, 0.06, 1),
  }
}

export function createMilkyWayModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-milky-way-runtime-module',
    renderOrder: 5,
    render({ runtime, getProps }) {
      const projectedFrame = runtime.projectedSceneFrame
      const brightnessExposureState = runtime.brightnessExposureState
      const context = runtime.backgroundCanvas.getContext('2d')

      if (!projectedFrame || !brightnessExposureState || !context) {
        if (context && runtime.backgroundCanvas.width > 0 && runtime.backgroundCanvas.height > 0) {
          context.clearRect(0, 0, runtime.backgroundCanvas.width, runtime.backgroundCanvas.height)
        }
        return
      }

      context.clearRect(0, 0, projectedFrame.width, projectedFrame.height)

      const latest = getProps()
      const timestampUtc = projectedFrame.sceneTimestampIso

      if (!timestampUtc) {
        return
      }

      const renderState = evaluateMilkyWayRenderState(
        brightnessExposureState,
        projectedFrame.limitingMagnitude,
        projectedFrame.currentFovDegrees,
      )
      const alpha = clamp(renderState.visibility * (0.46 + renderState.contrast * 0.54), 0, 1)

      if (alpha <= 0.001) {
        return
      }

      const observerSnapshot = buildObserverSnapshot(
        projectedFrame.view,
        projectedFrame.view.projectionMode ?? 'stereographic',
        latest.observer.latitude,
        latest.observer.longitude,
        timestampUtc,
      )
      const stats = renderHipsSurveyToCanvas({
        context,
        view: projectedFrame.view,
        observerSnapshot,
        observerFrameAstrometry: latest.observerFrameAstrometry,
        survey: {
          id: 'milky-way',
          baseUrl: DEFAULT_MILKY_HIPS_BASE_URL,
          extension: 'jpg',
          minOrder: 0,
          maxOrder: 9,
          tileWidthPx: 512,
        },
        alpha,
      })

      runtime.runtimePerfTelemetry.latest = {
        ...runtime.runtimePerfTelemetry.latest,
        stepMs: {
          ...runtime.runtimePerfTelemetry.latest.stepMs,
          milkyAlpha: alpha,
          milkyRequestedTiles: stats.requestedTileCount,
          milkyRenderedTiles: stats.renderedTileCount,
          milkyFallbackTiles: stats.fallbackTileCount,
        },
      }
    },
  }
}
