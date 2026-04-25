import {
  computeEffectiveLimitingMagnitude,
} from '../../../../skyBrightness'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import {
  resolveTonemapperLwmaxFromLuminance,
  STELLARIUM_TONEMAPPER_EXPOSURE,
  STELLARIUM_TONEMAPPER_P,
  updateAdaptedTonemapperLwmax,
} from '../../core/stellariumVisualMath'
import type { SkyModule } from '../SkyModule'
import type { SceneLuminanceReport, SkyBrightnessExposureState } from '../types'

const STELLARIUM_ADAPTATION_FRAME_SECONDS = 0.01666

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function computeContributorShare(contributor: number, total: number) {
  if (!Number.isFinite(total) || total <= 0) {
    return 0
  }

  return clamp(contributor / total, 0, 1)
}

export function evaluateSkyBrightnessExposureState(
  props: ScenePropsSnapshot,
  services: SkySceneRuntimeServices,
  sceneLuminanceReport: SceneLuminanceReport,
  previousState?: SkyBrightnessExposureState | null,
  deltaSeconds = STELLARIUM_ADAPTATION_FRAME_SECONDS,
): SkyBrightnessExposureState {
  const currentFovDegrees = services.projectionService.getCurrentFovDegrees()
  const targetSceneLuminance = sceneLuminanceReport.target
  const calibratedStarVisibility = clamp(props.sunState.visualCalibration.starVisibility, 0, 1)
  const calibratedStarFieldBrightness = clamp(props.sunState.visualCalibration.starFieldBrightness, 0, 1)
  const targetTonemapperLwmax = resolveTonemapperLwmaxFromLuminance(targetSceneLuminance)
  const adaptation = updateAdaptedTonemapperLwmax({
    previousLwmax: previousState?.tonemapperLwmax,
    targetLwmax: targetTonemapperLwmax,
    deltaSeconds,
    fastAdaptation: sceneLuminanceReport.targetFastAdaptation,
  })
  const tonemapperLwmax = adaptation.lwmax
  const adaptedSceneLuminance = tonemapperLwmax
  const adaptedSkyBrightness = sceneLuminanceReport.skyBrightness
  const adaptationLevel = clamp(1 - adaptedSkyBrightness, 0, 1)
  const visualAdaptationLevel = adaptationLevel
  const contributorTotal = Math.max(targetSceneLuminance, 1e-6)
  const skyShare = computeContributorShare(sceneLuminanceReport.sky, contributorTotal)
  const starShare = computeContributorShare(sceneLuminanceReport.stars, contributorTotal)
  const solarSystemShare = computeContributorShare(sceneLuminanceReport.solarSystem, contributorTotal)
  const sceneContrast = clamp(0.46 + visualAdaptationLevel * 0.62 * (1 - skyShare * 0.55), 0.46, 1.08)
  const starVisibility = clamp(calibratedStarVisibility * visualAdaptationLevel * (0.18 + (1 - skyShare) * 0.82), 0, 1)
  const starFieldBrightness = clamp(
    calibratedStarFieldBrightness * visualAdaptationLevel * (0.2 + (1 - skyShare) * 0.8),
    0,
    1,
  )
  const atmosphereExposure = clamp(props.sunState.visualCalibration.atmosphereExposure, 0.66, 1.08)
  const limitingMagnitude = computeEffectiveLimitingMagnitude({
    fovDegrees: currentFovDegrees,
    skyBrightness: adaptedSkyBrightness,
    tonemapperP: STELLARIUM_TONEMAPPER_P,
    tonemapperExposure: STELLARIUM_TONEMAPPER_EXPOSURE,
    tonemapperLwmax,
  })
  const milkyWayVisibility = clamp(
    (0.32 + starVisibility * 0.68) *
      (0.4 + starFieldBrightness * 0.6) *
      (0.35 + visualAdaptationLevel * 0.65),
    0,
    1,
  )
  const milkyWayContrast = clamp(sceneContrast * (0.45 + starShare * 0.45 + solarSystemShare * 0.1), 0.08, 1)
  const backdropAlpha = clamp(0.86 - starVisibility * 0.22 - starShare * 0.12 + skyShare * 0.03, 0.48, 0.9)

  return {
    skyBrightness: sceneLuminanceReport.skyBrightness,
    adaptationLevel,
    sceneContrast,
    limitingMagnitude,
    starVisibility,
    starFieldBrightness,
    atmosphereExposure,
    milkyWayVisibility,
    milkyWayContrast,
    backdropAlpha,
    nightSkyZenithLuminance: sceneLuminanceReport.nightSkyZenithLuminance,
    nightSkyHorizonLuminance: sceneLuminanceReport.nightSkyHorizonLuminance,
    sceneLuminanceSkyContributor: sceneLuminanceReport.sky,
    sceneLuminanceStarContributor: sceneLuminanceReport.stars,
    sceneLuminanceSolarSystemContributor: sceneLuminanceReport.solarSystem,
    sceneLuminanceStarSampleCount: sceneLuminanceReport.starSampleCount,
    sceneLuminanceSolarSystemSampleCount: sceneLuminanceReport.solarSystemSampleCount,
    sceneLuminance: targetSceneLuminance,
    adaptedSceneLuminance,
    targetTonemapperLwmax,
    adaptationSmoothing: adaptation.adaptationSmoothing,
    tonemapperP: STELLARIUM_TONEMAPPER_P,
    tonemapperExposure: STELLARIUM_TONEMAPPER_EXPOSURE,
    tonemapperLwmax,
    visualCalibration: props.sunState.visualCalibration,
  }
}

export function createSkyBrightnessExposureModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-brightness-exposure-runtime-module',
    renderOrder: 5,
    update({ runtime, services, getProps, deltaSeconds }) {
      const sceneLuminanceReport = runtime.sceneLuminanceReport
      if (!sceneLuminanceReport) {
        return
      }
      runtime.brightnessExposureState = evaluateSkyBrightnessExposureState(
        getProps(),
        services,
        sceneLuminanceReport,
        runtime.brightnessExposureState,
        deltaSeconds,
      )
    },
  }
}
