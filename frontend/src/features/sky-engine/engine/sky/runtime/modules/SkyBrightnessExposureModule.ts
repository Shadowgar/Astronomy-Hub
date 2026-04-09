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

function buildMilkyWayVisibility(
  skyBrightness: number,
  starVisibility: number,
  starFieldBrightness: number,
) {
  const darkness = clamp(1 - skyBrightness, 0, 1)
  const reveal = Math.pow(darkness, 1.65)

  return clamp(
    reveal * (0.24 + clamp(starVisibility, 0, 1) * 0.5 + clamp(starFieldBrightness, 0, 1) * 0.26),
    0,
    1,
  )
}

function buildMilkyWayContrast(
  skyBrightness: number,
  atmosphereExposure: number,
  nightSkyZenithLuminance: number,
) {
  const darkness = clamp(1 - skyBrightness, 0, 1)
  const darkSkyBias = clamp(1 - nightSkyZenithLuminance / 0.12, 0.18, 1)

  return clamp(
    Math.pow(darkness, 1.18) * (0.44 + clamp(atmosphereExposure, 0, 1.4) * 0.24) * darkSkyBias,
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
  const starVisibility = props.sunState.visualCalibration.starVisibility
  const starFieldBrightness = props.sunState.visualCalibration.starFieldBrightness
  const atmosphereExposure = props.sunState.visualCalibration.atmosphereExposure
  const skyBrightness = computeSkyBrightness(sunAltitudeRad)
  const nightSkyZenithLuminance = computeNightSkyLuminance(Math.PI / 2, sunAltitudeRad)
  const nightSkyHorizonLuminance = computeNightSkyLuminance(0, sunAltitudeRad)
  const limitingMagnitude = computeEffectiveLimitingMagnitude(
    skyBrightness,
    currentFovDegrees,
    starVisibility,
  )
  const milkyWayVisibility = buildMilkyWayVisibility(
    skyBrightness,
    starVisibility,
    starFieldBrightness,
  )
  const milkyWayContrast = buildMilkyWayContrast(
    skyBrightness,
    atmosphereExposure,
    nightSkyZenithLuminance,
  )

  return {
    skyBrightness,
    limitingMagnitude,
    starVisibility,
    starFieldBrightness,
    atmosphereExposure,
    milkyWayVisibility,
    milkyWayContrast,
    backdropAlpha: buildBackdropAlpha(starVisibility),
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
