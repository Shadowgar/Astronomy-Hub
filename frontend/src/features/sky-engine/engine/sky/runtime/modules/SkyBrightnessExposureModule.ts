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
  const limitingMagnitude = computeEffectiveLimitingMagnitude(
    skyBrightness,
    currentFovDegrees,
    starVisibility,
  )

  return {
    skyBrightness,
    limitingMagnitude,
    starVisibility,
    starFieldBrightness,
    atmosphereExposure,
    backdropAlpha: buildBackdropAlpha(starVisibility),
    nightSkyZenithLuminance: computeNightSkyLuminance(Math.PI / 2, sunAltitudeRad),
    nightSkyHorizonLuminance: computeNightSkyLuminance(0, sunAltitudeRad),
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
