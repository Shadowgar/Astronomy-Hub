import {
  computeEffectiveLimitingMagnitude,
  computeSkyBrightnessFromLuminance,
  resolveTonemapperLwmaxFromLuminance,
} from '../../../../skyBrightness'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import type { SkyModule } from '../SkyModule'
import type { SceneLuminanceReport, SkyBrightnessExposureState } from '../types'

const STELLARIUM_TONEMAPPER_P = 2.2
const STELLARIUM_TONEMAPPER_EXPOSURE = 2
const STELLARIUM_DARK_ADAPTATION_RATE = 0.16
const STELLARIUM_ADAPTATION_FRAME_SECONDS = 0.01666
const STELLARIUM_MIN_SCENE_LUMINANCE = 1.75e-4

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function buildBackdropAlpha(starVisibility: number) {
  return clamp(0.9 - starVisibility * 0.18, 0.68, 0.92)
}

function buildAdaptationLevel(
  adaptedSkyBrightness: number,
  nightSkyZenithLuminance: number,
  nightSkyHorizonLuminance: number,
) {
  const darkness = clamp(1 - adaptedSkyBrightness, 0, 1)
  const darkSkyBias = clamp(
    1 - (nightSkyZenithLuminance * 0.72 + nightSkyHorizonLuminance * 0.28) / 0.06,
    0.18,
    1,
  )

  return clamp(Math.pow(darkness, 1.34) * (0.72 + darkSkyBias * 0.28), 0, 1)
}

function buildSceneContrast(
  skyBrightness: number,
  adaptationLevel: number,
  nightSkyZenithLuminance: number,
) {
  const darkSkyBias = clamp(1 - nightSkyZenithLuminance / 0.08, 0.22, 1)

  return clamp(
    0.48 + adaptationLevel * 0.5 + darkSkyBias * 0.18 - skyBrightness * 0.12,
    0.46,
    1.08,
  )
}

function buildStarVisibility(
  calibratedVisibility: number,
  skyBrightness: number,
  adaptationLevel: number,
) {
  const darkness = clamp(1 - skyBrightness, 0, 1)

  return clamp(
    calibratedVisibility * (0.12 + adaptationLevel * 0.88) * (0.16 + darkness * 0.84),
    0.02,
    1,
  )
}

function buildStarFieldBrightness(
  calibratedFieldBrightness: number,
  adaptationLevel: number,
  sceneContrast: number,
) {
  return clamp(
    calibratedFieldBrightness * (0.18 + adaptationLevel * 0.82) * (0.3 + sceneContrast * 0.7),
    0.04,
    1,
  )
}

function buildAtmosphereExposure(
  calibratedAtmosphereExposure: number,
  skyBrightness: number,
  adaptationLevel: number,
) {
  return clamp(
    calibratedAtmosphereExposure * (1.02 - adaptationLevel * 0.16 + skyBrightness * 0.08),
    0.66,
    1.08,
  )
}

function buildMilkyWayVisibility(
  adaptationLevel: number,
  starVisibility: number,
  starFieldBrightness: number,
  nightSkyZenithLuminance: number,
) {
  const darkSkyBias = clamp(1 - nightSkyZenithLuminance / 0.05, 0.12, 1)

  return clamp(
    Math.pow(adaptationLevel, 1.55) *
      darkSkyBias *
      (0.18 + clamp(starVisibility, 0, 1) * 0.48 + clamp(starFieldBrightness, 0, 1) * 0.34),
    0,
    1,
  )
}

function buildMilkyWayContrast(
  adaptationLevel: number,
  sceneContrast: number,
  nightSkyZenithLuminance: number,
) {
  const darkSkyBias = clamp(1 - nightSkyZenithLuminance / 0.12, 0.18, 1)

  return clamp(
    Math.pow(adaptationLevel, 1.12) * (0.38 + clamp(sceneContrast, 0.4, 1.2) * 0.44) * darkSkyBias,
    0.04,
    1,
  )
}

function adaptSceneLuminance(
  previousLuminance: number | undefined,
  targetLuminance: number,
  deltaSeconds: number,
) {
  const safeTargetLuminance = Math.max(targetLuminance, STELLARIUM_MIN_SCENE_LUMINANCE)

  if (!previousLuminance || !Number.isFinite(previousLuminance)) {
    return {
      adaptedSceneLuminance: safeTargetLuminance,
      adaptationSmoothing: 1,
    }
  }

  const safePreviousLuminance = Math.max(previousLuminance, STELLARIUM_MIN_SCENE_LUMINANCE)

  if (safeTargetLuminance >= safePreviousLuminance) {
    return {
      adaptedSceneLuminance: safeTargetLuminance,
      adaptationSmoothing: 1,
    }
  }

  const adaptationSmoothing = Math.min(
    (STELLARIUM_DARK_ADAPTATION_RATE * Math.max(deltaSeconds, 0.001)) / STELLARIUM_ADAPTATION_FRAME_SECONDS,
    0.5,
  )

  return {
    adaptedSceneLuminance: Math.exp(
      Math.log(safePreviousLuminance)
        + (Math.log(safeTargetLuminance) - Math.log(safePreviousLuminance)) * adaptationSmoothing,
    ),
    adaptationSmoothing,
  }
}

export function evaluateSkyBrightnessExposureState(
  props: ScenePropsSnapshot,
  services: SkySceneRuntimeServices,
  sceneLuminanceReport: SceneLuminanceReport,
  previousState?: SkyBrightnessExposureState | null,
  deltaSeconds = STELLARIUM_ADAPTATION_FRAME_SECONDS,
): SkyBrightnessExposureState {
  const currentFovDegrees = services.projectionService.getCurrentFovDegrees()
  const calibratedStarVisibility = props.sunState.visualCalibration.starVisibility
  const calibratedStarFieldBrightness = props.sunState.visualCalibration.starFieldBrightness
  const calibratedAtmosphereExposure = props.sunState.visualCalibration.atmosphereExposure
  const targetSceneLuminance = sceneLuminanceReport.target
  const adaptation = adaptSceneLuminance(
    previousState?.adaptedSceneLuminance,
    targetSceneLuminance,
    deltaSeconds,
  )
  const adaptedSkyBrightness = computeSkyBrightnessFromLuminance(adaptation.adaptedSceneLuminance)
  const adaptationLevel = buildAdaptationLevel(
    adaptedSkyBrightness,
    sceneLuminanceReport.nightSkyZenithLuminance,
    sceneLuminanceReport.nightSkyHorizonLuminance,
  )
  const sceneContrast = buildSceneContrast(
    sceneLuminanceReport.skyBrightness,
    adaptationLevel,
    sceneLuminanceReport.nightSkyZenithLuminance,
  )
  const starVisibility = buildStarVisibility(
    calibratedStarVisibility,
    sceneLuminanceReport.skyBrightness,
    adaptationLevel,
  )
  const starFieldBrightness = buildStarFieldBrightness(
    calibratedStarFieldBrightness,
    adaptationLevel,
    sceneContrast,
  )
  const atmosphereExposure = buildAtmosphereExposure(
    calibratedAtmosphereExposure,
    sceneLuminanceReport.skyBrightness,
    adaptationLevel,
  )
  const tonemapperLwmax = resolveTonemapperLwmaxFromLuminance(adaptation.adaptedSceneLuminance)
  const targetTonemapperLwmax = resolveTonemapperLwmaxFromLuminance(targetSceneLuminance)
  const limitingMagnitude = computeEffectiveLimitingMagnitude({
    fovDegrees: currentFovDegrees,
    skyBrightness: sceneLuminanceReport.skyBrightness,
    tonemapperP: STELLARIUM_TONEMAPPER_P,
    tonemapperExposure: STELLARIUM_TONEMAPPER_EXPOSURE,
    tonemapperLwmax,
  })
  const milkyWayVisibility = buildMilkyWayVisibility(
    adaptationLevel,
    starVisibility,
    starFieldBrightness,
    sceneLuminanceReport.nightSkyZenithLuminance,
  )
  const milkyWayContrast = buildMilkyWayContrast(
    adaptationLevel,
    sceneContrast,
    sceneLuminanceReport.nightSkyZenithLuminance,
  )

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
    backdropAlpha: clamp(
      buildBackdropAlpha(starVisibility) - milkyWayVisibility * 0.06 + sceneLuminanceReport.skyBrightness * 0.04,
      0.62,
      0.94,
    ),
    nightSkyZenithLuminance: sceneLuminanceReport.nightSkyZenithLuminance,
    nightSkyHorizonLuminance: sceneLuminanceReport.nightSkyHorizonLuminance,
    sceneLuminanceSkyContributor: sceneLuminanceReport.sky,
    sceneLuminanceStarContributor: sceneLuminanceReport.stars,
    sceneLuminanceSolarSystemContributor: sceneLuminanceReport.solarSystem,
    sceneLuminanceStarSampleCount: sceneLuminanceReport.starSampleCount,
    sceneLuminanceSolarSystemSampleCount: sceneLuminanceReport.solarSystemSampleCount,
    sceneLuminance: targetSceneLuminance,
    adaptedSceneLuminance: adaptation.adaptedSceneLuminance,
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
