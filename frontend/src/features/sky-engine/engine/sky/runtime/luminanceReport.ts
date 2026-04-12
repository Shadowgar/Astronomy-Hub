import { horizontalToDirection } from '../../../projectionMath'
import { evaluateStellariumSkyBrightnessBaseline } from '../../../skyBrightness'
import type { ScenePropsSnapshot, SkySceneRuntimeServices } from '../../../SkyEngineRuntimeBridge'
import type { SceneLuminanceReport } from './types'

const FEET_TO_METERS = 0.3048
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

export function evaluateSceneLuminanceReport(
  props: ScenePropsSnapshot,
  services: SkySceneRuntimeServices,
): SceneLuminanceReport {
  const sunAltitudeRad = (props.sunState.altitudeDeg * Math.PI) / 180
  const currentFovDegrees = services.projectionService.getCurrentFovDegrees()
  const moonObject = props.objects.find((object) => object.type === 'moon') ?? null
  const moonAltitudeRad = moonObject ? (moonObject.altitudeDeg * Math.PI) / 180 : null
  const baseline = evaluateStellariumSkyBrightnessBaseline({
    timestampIso: resolveTimestampIso(props),
    latitudeDeg: resolveObserverLatitudeDeg(props),
    observerElevationM: resolveObserverElevationMeters(props),
    sunAltitudeRad,
    moonAltitudeRad,
    moonMagnitude: moonObject?.magnitude,
  })

  const centerDirection = services.navigationService.getCenterDirection()
  const star = estimateStarLuminanceContributor(props, currentFovDegrees)
  const solarSystem = estimateSolarSystemLuminanceContributor(props, currentFovDegrees, centerDirection)
  const sky = Math.max(0, baseline.zenithSkyLuminance)
  const target = Math.max(sky, star.luminance, solarSystem.luminance)

  return {
    skyBrightness: baseline.skyBrightness,
    nightSkyZenithLuminance: baseline.nightSkyZenithLuminance,
    nightSkyHorizonLuminance: baseline.nightSkyHorizonLuminance,
    sky,
    stars: star.luminance,
    solarSystem: solarSystem.luminance,
    target,
    starSampleCount: star.sampleCount,
    solarSystemSampleCount: solarSystem.sampleCount,
  }
}
