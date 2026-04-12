import {
  computeEffectiveLimitingMagnitude,
  computeSkyBrightnessFromLuminance,
  evaluateStellariumSkyBrightnessBaseline,
  resolveTonemapperLwmaxFromLuminance,
} from '../../../../skyBrightness'
import { horizontalToDirection } from '../../../../projectionMath'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import type { SkyModule } from '../SkyModule'
import type { SkyBrightnessExposureState } from '../types'

const FEET_TO_METERS = 0.3048
const STELLARIUM_TONEMAPPER_P = 2.2
const STELLARIUM_TONEMAPPER_EXPOSURE = 2
const STELLARIUM_DARK_ADAPTATION_RATE = 0.16
const STELLARIUM_ADAPTATION_FRAME_SECONDS = 0.01666
const STELLARIUM_MIN_SCENE_LUMINANCE = 1.75e-4
const STELLARIUM_POINT_SPREAD_RADIUS_RAD = (2.5 / 60) * (Math.PI / 180)
const STELLARIUM_MIN_POINT_AREA_SR = Math.PI * STELLARIUM_POINT_SPREAD_RADIUS_RAD * STELLARIUM_POINT_SPREAD_RADIUS_RAD
const STELLARIUM_ARCSECONDS_PER_RADIAN = 206264.80624709636
const MAX_BRIGHTNESS_STAR_SAMPLES = 640
const MAX_SOLAR_SYSTEM_SAMPLES = 32
const BRIGHTNESS_STAR_MAGNITUDE_CUTOFF = 6.2
const BRIGHTNESS_SOLAR_SYSTEM_MAGNITUDE_CUTOFF = 7.5

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function exp10(value: number) {
  return Math.exp(value * Math.log(10))
}

function estimateTelescopeLightGrasp(currentFovDegrees: number) {
  const fovRad = clamp(currentFovDegrees, 0.25, 180) * (Math.PI / 180)
  const fovEyeRad = 60 * (Math.PI / 180)
  const magnification = fovEyeRad / fovRad
  const exposure = Math.pow(Math.max(1, (5 * (Math.PI / 180)) / fovRad), 0.07)
  const lightGrasp = Math.max(0.4, magnification * magnification * exposure)
  return lightGrasp
}

function estimateTelescopeMagnification(currentFovDegrees: number) {
  const fovRad = clamp(currentFovDegrees, 0.25, 180) * (Math.PI / 180)
  const fovEyeRad = 60 * (Math.PI / 180)
  return fovEyeRad / fovRad
}

function estimateTelescopeGainMagnitude(currentFovDegrees: number) {
  return 2.5 * Math.log10(estimateTelescopeLightGrasp(currentFovDegrees))
}

function coreMagToIlluminance(magnitude: number) {
  return 10.7646e4 / (STELLARIUM_ARCSECONDS_PER_RADIAN * STELLARIUM_ARCSECONDS_PER_RADIAN) * exp10(-0.4 * magnitude)
}

function estimateStarLuminanceContributor(
  props: ScenePropsSnapshot,
  currentFovDegrees: number,
) {
  const lightGrasp = estimateTelescopeLightGrasp(currentFovDegrees)
  let samples = 0
  let illuminance = 0

  for (let index = 0; index < props.objects.length; index += 1) {
    const object = props.objects[index]
    if (object.type !== 'star') {
      continue
    }
    if (object.altitudeDeg <= -2) {
      continue
    }
    if (object.magnitude > BRIGHTNESS_STAR_MAGNITUDE_CUTOFF) {
      continue
    }
    illuminance += coreMagToIlluminance(object.magnitude)
    samples += 1
    if (samples >= MAX_BRIGHTNESS_STAR_SAMPLES) {
      break
    }
  }

  const apparentLuminance = illuminance > 0
    ? (illuminance * lightGrasp) / STELLARIUM_MIN_POINT_AREA_SR
    : 0
  const reportedLuminance = apparentLuminance > 0 ? Math.pow(apparentLuminance, 1 / 3) / 300 : 0

  return {
    luminance: reportedLuminance,
    sampleCount: samples,
  }
}

function smoothstep(edge0: number, edge1: number, value: number) {
  if (edge0 === edge1) {
    return value >= edge1 ? 1 : 0
  }
  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return amount * amount * (3 - 2 * amount)
}

function getAngularSeparationRadians(
  left: { x: number; y: number; z: number },
  right: { x: number; y: number; z: number },
) {
  const dot = clamp(left.x * right.x + left.y * right.y + left.z * right.z, -1, 1)
  return Math.acos(dot)
}

function estimateObjectAngularRadiusRadians(apparentSizeDeg: number | undefined) {
  if (!apparentSizeDeg || apparentSizeDeg <= 0) {
    return STELLARIUM_POINT_SPREAD_RADIUS_RAD
  }
  return Math.max(STELLARIUM_POINT_SPREAD_RADIUS_RAD, (apparentSizeDeg * Math.PI) / 360)
}

function estimateSolarSystemLuminanceContributor(
  props: ScenePropsSnapshot,
  currentFovDegrees: number,
  centerDirection: { x: number; y: number; z: number },
) {
  const magnification = estimateTelescopeMagnification(currentFovDegrees)
  const gainMagnitude = estimateTelescopeGainMagnitude(currentFovDegrees)
  const fovRad = clamp(currentFovDegrees, 0.25, 180) * (Math.PI / 180)
  let brightestLuminance = 0
  let samples = 0

  for (let index = 0; index < props.objects.length; index += 1) {
    const object = props.objects[index]
    if (object.type !== 'moon' && object.type !== 'planet') {
      continue
    }
    if (object.altitudeDeg <= -2) {
      continue
    }
    if (object.magnitude > BRIGHTNESS_SOLAR_SYSTEM_MAGNITUDE_CUTOFF) {
      continue
    }
    const objectDirection = horizontalToDirection(object.altitudeDeg, object.azimuthDeg)
    const angularRadius = estimateObjectAngularRadiusRadians(object.apparentSizeDeg)
    const separation = getAngularSeparationRadians(centerDirection, objectDirection)

    // core_report_vmag_in_fov style contributor approximation.
    let lum = coreMagToIlluminance(object.magnitude - gainMagnitude) / (Math.PI * angularRadius * angularRadius)
    const observedRadius = Math.max(STELLARIUM_POINT_SPREAD_RADIUS_RAD, angularRadius * magnification)
    lum *= Math.pow(observedRadius / (60 * (Math.PI / 180)), 1.2)
    lum = Math.pow(Math.max(lum, 0), 0.33) / 300
    lum *= smoothstep(fovRad * 0.75, 0, Math.max(0, separation - angularRadius))
    lum *= 7

    brightestLuminance = Math.max(brightestLuminance, lum)
    samples += 1
    if (samples >= MAX_SOLAR_SYSTEM_SAMPLES) {
      break
    }
  }

  return {
    luminance: brightestLuminance,
    sampleCount: samples,
  }
}

function resolveSceneLuminanceContributors(
  props: ScenePropsSnapshot,
  services: SkySceneRuntimeServices,
  baselineSkyLuminance: number,
  currentFovDegrees: number,
) {
  const centerDirection = services.navigationService.getCenterDirection()
  const star = estimateStarLuminanceContributor(props, currentFovDegrees)
  const solarSystem = estimateSolarSystemLuminanceContributor(props, currentFovDegrees, centerDirection)
  const sky = Math.max(0, baselineSkyLuminance)
  const target = Math.max(sky, star.luminance, solarSystem.luminance)
  return {
    sky,
    stars: star.luminance,
    solarSystem: solarSystem.luminance,
    target,
    starSampleCount: star.sampleCount,
    solarSystemSampleCount: solarSystem.sampleCount,
  }
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

function resolveTimestampIso(props: ScenePropsSnapshot) {
  return props.initialSceneTimestampIso ?? (props.observer as { timestampUtc?: string }).timestampUtc
}

function resolveObserverLatitudeDeg(props: ScenePropsSnapshot) {
  const observer = props.observer as ScenePropsSnapshot['observer'] & { latitudeDeg?: number }
  return observer.latitude ?? observer.latitudeDeg ?? 0
}

function resolveObserverElevationMeters(props: ScenePropsSnapshot) {
  const observer = props.observer as ScenePropsSnapshot['observer'] & {
    altitudeMeters?: number
    elevationM?: number
  }

  if (typeof observer.elevationFt === 'number') {
    return observer.elevationFt * FEET_TO_METERS
  }

  return observer.altitudeMeters ?? observer.elevationM ?? 0
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
  previousState?: SkyBrightnessExposureState | null,
  deltaSeconds = STELLARIUM_ADAPTATION_FRAME_SECONDS,
): SkyBrightnessExposureState {
  const sunAltitudeRad = (props.sunState.altitudeDeg * Math.PI) / 180
  const currentFovDegrees = services.projectionService.getCurrentFovDegrees()
  const moonObject = props.objects.find((object) => object.type === 'moon') ?? null
  const moonAltitudeRad = moonObject ? (moonObject.altitudeDeg * Math.PI) / 180 : null
  const calibratedStarVisibility = props.sunState.visualCalibration.starVisibility
  const calibratedStarFieldBrightness = props.sunState.visualCalibration.starFieldBrightness
  const calibratedAtmosphereExposure = props.sunState.visualCalibration.atmosphereExposure
  const baseline = evaluateStellariumSkyBrightnessBaseline({
    timestampIso: resolveTimestampIso(props),
    latitudeDeg: resolveObserverLatitudeDeg(props),
    observerElevationM: resolveObserverElevationMeters(props),
    sunAltitudeRad,
    moonAltitudeRad,
    moonMagnitude: moonObject?.magnitude,
  })
  const luminanceContributors = resolveSceneLuminanceContributors(
    props,
    services,
    baseline.zenithSkyLuminance,
    currentFovDegrees,
  )
  const targetSceneLuminance = luminanceContributors.target
  const adaptation = adaptSceneLuminance(
    previousState?.adaptedSceneLuminance,
    targetSceneLuminance,
    deltaSeconds,
  )
  const adaptedSkyBrightness = computeSkyBrightnessFromLuminance(adaptation.adaptedSceneLuminance)
  const adaptationLevel = buildAdaptationLevel(
    adaptedSkyBrightness,
    baseline.nightSkyZenithLuminance,
    baseline.nightSkyHorizonLuminance,
  )
  const sceneContrast = buildSceneContrast(
    baseline.skyBrightness,
    adaptationLevel,
    baseline.nightSkyZenithLuminance,
  )
  const starVisibility = buildStarVisibility(
    calibratedStarVisibility,
    baseline.skyBrightness,
    adaptationLevel,
  )
  const starFieldBrightness = buildStarFieldBrightness(
    calibratedStarFieldBrightness,
    adaptationLevel,
    sceneContrast,
  )
  const atmosphereExposure = buildAtmosphereExposure(
    calibratedAtmosphereExposure,
    baseline.skyBrightness,
    adaptationLevel,
  )
  const tonemapperLwmax = resolveTonemapperLwmaxFromLuminance(adaptation.adaptedSceneLuminance)
  const targetTonemapperLwmax = resolveTonemapperLwmaxFromLuminance(targetSceneLuminance)
  const limitingMagnitude = computeEffectiveLimitingMagnitude({
    fovDegrees: currentFovDegrees,
    skyBrightness: baseline.skyBrightness,
    tonemapperP: STELLARIUM_TONEMAPPER_P,
    tonemapperExposure: STELLARIUM_TONEMAPPER_EXPOSURE,
    tonemapperLwmax,
  })
  const milkyWayVisibility = buildMilkyWayVisibility(
    adaptationLevel,
    starVisibility,
    starFieldBrightness,
    baseline.nightSkyZenithLuminance,
  )
  const milkyWayContrast = buildMilkyWayContrast(
    adaptationLevel,
    sceneContrast,
    baseline.nightSkyZenithLuminance,
  )

  return {
    skyBrightness: baseline.skyBrightness,
    adaptationLevel,
    sceneContrast,
    limitingMagnitude,
    starVisibility,
    starFieldBrightness,
    atmosphereExposure,
    milkyWayVisibility,
    milkyWayContrast,
    backdropAlpha: clamp(
      buildBackdropAlpha(starVisibility) - milkyWayVisibility * 0.06 + baseline.skyBrightness * 0.04,
      0.62,
      0.94,
    ),
    nightSkyZenithLuminance: baseline.nightSkyZenithLuminance,
    nightSkyHorizonLuminance: baseline.nightSkyHorizonLuminance,
    sceneLuminanceSkyContributor: luminanceContributors.sky,
    sceneLuminanceStarContributor: luminanceContributors.stars,
    sceneLuminanceSolarSystemContributor: luminanceContributors.solarSystem,
    sceneLuminanceStarSampleCount: luminanceContributors.starSampleCount,
    sceneLuminanceSolarSystemSampleCount: luminanceContributors.solarSystemSampleCount,
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
      const nextState = evaluateSkyBrightnessExposureState(
        getProps(),
        services,
        runtime.brightnessExposureState,
        deltaSeconds,
      )
      runtime.brightnessExposureState = nextState
      runtime.runtimePerfTelemetry.latest = {
        ...runtime.runtimePerfTelemetry.latest,
        stepMs: {
          ...runtime.runtimePerfTelemetry.latest.stepMs,
          sceneLuminanceSkyContributor: nextState.sceneLuminanceSkyContributor,
          sceneLuminanceStarContributor: nextState.sceneLuminanceStarContributor,
          sceneLuminanceSolarSystemContributor: nextState.sceneLuminanceSolarSystemContributor,
          sceneLuminanceTarget: nextState.sceneLuminance,
          sceneLuminanceStarSampleCount: nextState.sceneLuminanceStarSampleCount,
          sceneLuminanceSolarSystemSampleCount: nextState.sceneLuminanceSolarSystemSampleCount,
        },
      }
    },
  }
}
