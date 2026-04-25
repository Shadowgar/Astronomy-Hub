import type { SkyModule } from '../SkyModule'
import { directionToHorizontal, type SkyProjectionView } from '../../../../projectionMath'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import type { SkyBrightnessExposureState } from '../types'
import { loadDssManifest, type DssManifestPayload, type DssSurveyRecord } from '../../adapters/dssRepository'
import {
  buildStellariumTelescopeState,
  tonemapperMap,
  STELLARIUM_DEFAULT_BORTLE_INDEX,
} from '../../core/stellariumVisualMath'
import { STELLARIUM_DEFAULT_DISPLAY_LIMIT_MAG } from '../stellariumPainterLimits'
import { renderHipsSurveyToCanvas } from './hipsImageLayer'

const DEFAULT_DSS_HIPS_BASE_URL = 'https://alasky.cds.unistra.fr/DSS/DSSColor'

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

function mix(left: number, right: number, amount: number) {
  return left + (right - left) * amount
}

function computeDssFovVisibilityAlpha(fovDegrees: number) {
  return smoothstep(20, 10, fovDegrees)
}

function computeDssDisplayLimitMagnitudeAlpha(limitingMagnitude: number) {
  if (!Number.isFinite(limitingMagnitude)) {
    return 0
  }
  if (limitingMagnitude >= 14) {
    return 1
  }
  const ratio = clamp((14 - limitingMagnitude) / 10, 0, 1)
  return 1 - ratio
}

export function computeDssLayerAlpha(
  params: {
    fovDegrees: number
    displayLimitMagnitude: number
    tonemapperP: number
    tonemapperExposure: number
    tonemapperLwmax: number
    sceneLuminanceSkyContributor: number
    bortleIndex?: number
  },
  brightnessExposureState: Pick<SkyBrightnessExposureState, 'milkyWayVisibility' | 'milkyWayContrast'>,
) {
  // Source alignment (`modules/dss.c`):
  // - base luminance path uses telescope + tonemapper
  // - close-FOV visibility gate (20°->10°)
  // - display limit magnitude gate uses `core->display_limit_mag` (hard painter limit)
  // - atmosphere average luminance attenuates contrast
  const telescope = buildStellariumTelescopeState(params.fovDegrees)
  const tonemapper = {
    p: params.tonemapperP,
    exposure: params.tonemapperExposure,
    lwmax: params.tonemapperLwmax,
  }
  const fovVisibility = computeDssFovVisibilityAlpha(params.fovDegrees)
  const limitingMagnitudeVisibility = computeDssDisplayLimitMagnitudeAlpha(params.displayLimitMagnitude)
  let luminance = 0.02
  luminance *= telescope.lightGrasp
  luminance /= Math.pow(Math.max(telescope.magnification, 1e-6), 2)
  let contrast = tonemapperMap(luminance, tonemapper)
  const bortleIndex = params.bortleIndex ?? STELLARIUM_DEFAULT_BORTLE_INDEX
  contrast *= (8 / 6) * ((9 - bortleIndex) / 8)
  contrast = Math.max(0, contrast)
  contrast *= fovVisibility

  const atmosphereAverage = Math.max(1e-6, params.sceneLuminanceSkyContributor)
  contrast *= Math.min(0.004 / atmosphereAverage, 1)
  contrast *= clamp(
    brightnessExposureState.milkyWayVisibility * (0.55 + brightnessExposureState.milkyWayContrast * 0.45),
    0,
    1.2,
  )

  return clamp(Math.min(contrast, 1.2) * limitingMagnitudeVisibility, 0, 1.2)
}

function buildObserverSnapshot(view: SkyProjectionView, latitudeDeg: number, longitudeDeg: number, timestampUtc: string) {
  const centerHorizontal = directionToHorizontal(view.centerDirection)

  return {
    timestampUtc,
    latitudeDeg,
    longitudeDeg,
    fovDeg: (view.fovRadians * 180) / Math.PI,
    centerAltDeg: centerHorizontal.altitudeDeg,
    centerAzDeg: centerHorizontal.azimuthDeg,
    projection: view.projectionMode ?? 'stereographic',
  } as const
}

function resolveActiveDssSurvey(manifest: DssManifestPayload | null): DssSurveyRecord | null {
  if (!manifest?.surveys.length) {
    return null
  }
  const visible = manifest.surveys.find((survey) => survey.visibleByDefault)
  return visible ?? manifest.surveys[0] ?? null
}

export function createBackgroundRuntimeModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  let dssManifest: DssManifestPayload | null = null
  let dssReady = false
  let dssLoadError: string | null = null

  return {
    id: 'sky-background-runtime-module',
    renderOrder: 6,
    start({ requestRender }) {
      void loadDssManifest()
        .then((manifest) => {
          dssManifest = manifest
          dssReady = true
          dssLoadError = null
          requestRender()
        })
        .catch((error) => {
          dssReady = true
          dssLoadError = error instanceof Error ? error.message : String(error)
          requestRender()
        })
    },
    render({ runtime, getProps, services }) {
      const latest = getProps()
      const projectedFrame = runtime.projectedSceneFrame
      const brightnessExposureState = runtime.brightnessExposureState
      if (!projectedFrame || !brightnessExposureState) {
        return
      }
      const backgroundContext = runtime.backgroundCanvas.getContext('2d')
      if (!backgroundContext) {
        return
      }

      const dssBaseAlpha = computeDssLayerAlpha(
        {
          fovDegrees: projectedFrame.currentFovDegrees,
          displayLimitMagnitude: runtime.corePainterLimits?.hardLimitMag ?? STELLARIUM_DEFAULT_DISPLAY_LIMIT_MAG,
          tonemapperP: brightnessExposureState.tonemapperP,
          tonemapperExposure: brightnessExposureState.tonemapperExposure,
          tonemapperLwmax: brightnessExposureState.tonemapperLwmax,
          sceneLuminanceSkyContributor: brightnessExposureState.sceneLuminanceSkyContributor,
        },
        brightnessExposureState,
      )
      if (dssBaseAlpha <= (3 / 255)) {
        return
      }
      const survey = resolveActiveDssSurvey(dssManifest)
      const timestampUtc = projectedFrame.sceneTimestampIso ?? services.clockService.getSceneTimestampIso()
      const observerSnapshot = buildObserverSnapshot(
        projectedFrame.view,
        latest.observer.latitude,
        latest.observer.longitude,
        timestampUtc,
      )
      const hipsStats = renderHipsSurveyToCanvas({
        context: backgroundContext,
        view: projectedFrame.view,
        observerSnapshot,
        observerFrameAstrometry: latest.observerFrameAstrometry,
        survey: {
          id: survey?.id ?? 'dss-default',
          baseUrl: survey?.hipsServiceUrl ?? DEFAULT_DSS_HIPS_BASE_URL,
          extension: survey?.tileFormat ?? 'jpg',
          minOrder: 0,
          maxOrder: 9,
          tileWidthPx: 512,
        },
        alpha: dssBaseAlpha,
      })
      runtime.runtimePerfTelemetry.latest = {
        ...runtime.runtimePerfTelemetry.latest,
        stepMs: {
          ...runtime.runtimePerfTelemetry.latest.stepMs,
          dssPatchCount: hipsStats.requestedTileCount,
          dssReady: dssReady ? 1 : 0,
          dssLoadError: dssLoadError ? 1 : 0,
          dssAlpha: dssBaseAlpha,
          dssDisplayLimitMag: runtime.corePainterLimits?.hardLimitMag ?? STELLARIUM_DEFAULT_DISPLAY_LIMIT_MAG,
          dssRenderedTiles: hipsStats.renderedTileCount,
          dssFallbackTiles: hipsStats.fallbackTileCount,
        },
      }
    },
  }
}
