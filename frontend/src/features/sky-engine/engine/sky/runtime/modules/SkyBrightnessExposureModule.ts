import { computeNightSkyLuminance } from '../../../../nightSkyBackground'
import { computeEffectiveLimitingMagnitude, computeSkyBrightness } from '../../../../skyBrightness'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import type { SkyModule } from '../SkyModule'
import type { SkyBrightnessExposureState } from '../types'

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function buildBackdropAlpha(starVisibility: number) {
  return clamp(0.9 - starVisibility * 0.18, 0.68, 0.92)
}

function buildAdaptationLevel(
  skyBrightness: number,
  nightSkyZenithLuminance: number,
  nightSkyHorizonLuminance: number,
) {
  const darkness = clamp(1 - skyBrightness, 0, 1)
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

export function evaluateSkyBrightnessExposureState(
  props: ScenePropsSnapshot,
  services: SkySceneRuntimeServices,
): SkyBrightnessExposureState {
  const sunAltitudeRad = (props.sunState.altitudeDeg * Math.PI) / 180
  const currentFovDegrees = services.projectionService.getCurrentFovDegrees()
  const calibratedStarVisibility = props.sunState.visualCalibration.starVisibility
  const calibratedStarFieldBrightness = props.sunState.visualCalibration.starFieldBrightness
  const calibratedAtmosphereExposure = props.sunState.visualCalibration.atmosphereExposure
  const skyBrightness = computeSkyBrightness(sunAltitudeRad)
  const nightSkyZenithLuminance = computeNightSkyLuminance(Math.PI / 2, sunAltitudeRad)
  const nightSkyHorizonLuminance = computeNightSkyLuminance(0, sunAltitudeRad)
  const adaptationLevel = buildAdaptationLevel(
    skyBrightness,
    nightSkyZenithLuminance,
    nightSkyHorizonLuminance,
  )
  const sceneContrast = buildSceneContrast(
    skyBrightness,
    adaptationLevel,
    nightSkyZenithLuminance,
  )
  const starVisibility = buildStarVisibility(
    calibratedStarVisibility,
    skyBrightness,
    adaptationLevel,
  )
  const starFieldBrightness = buildStarFieldBrightness(
    calibratedStarFieldBrightness,
    adaptationLevel,
    sceneContrast,
  )
  const atmosphereExposure = buildAtmosphereExposure(
    calibratedAtmosphereExposure,
    skyBrightness,
    adaptationLevel,
  )
  const limitingMagnitude = computeEffectiveLimitingMagnitude(
    skyBrightness,
    currentFovDegrees,
    starVisibility,
  )
  const milkyWayVisibility = buildMilkyWayVisibility(
    adaptationLevel,
    starVisibility,
    starFieldBrightness,
    nightSkyZenithLuminance,
  )
  const milkyWayContrast = buildMilkyWayContrast(
    adaptationLevel,
    sceneContrast,
    nightSkyZenithLuminance,
  )

  return {
    skyBrightness,
    adaptationLevel,
    sceneContrast,
    limitingMagnitude,
    starVisibility,
    starFieldBrightness,
    atmosphereExposure,
    milkyWayVisibility,
    milkyWayContrast,
    backdropAlpha: clamp(
      buildBackdropAlpha(starVisibility) - milkyWayVisibility * 0.06 + skyBrightness * 0.04,
      0.62,
      0.94,
    ),
    nightSkyZenithLuminance,
    nightSkyHorizonLuminance,
    visualCalibration: props.sunState.visualCalibration,
  }
}

export function createSkyBrightnessExposureModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-brightness-exposure-runtime-module',
    renderOrder: 5,
    update({ runtime, services, getProps }) {
      runtime.brightnessExposureState = evaluateSkyBrightnessExposureState(getProps(), services)
    },
  }
}
