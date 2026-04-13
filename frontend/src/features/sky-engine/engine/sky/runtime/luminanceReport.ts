import { horizontalToDirection } from '../../../projectionMath'
import {
  buildStellariumSkyBrightnessContext,
  computeSkyBrightnessFromLuminance,
  computeStellariumSkyLuminance,
  evaluateStellariumSkyBrightnessBaseline,
} from '../../../skyBrightness'
import type { ScenePropsSnapshot, SkySceneRuntimeServices } from '../../../SkyEngineRuntimeBridge'
import {
  coreIlluminanceToLumApparent,
  coreMagToIlluminance,
  coreReportVmagInFovLuminance,
} from '../core/stellariumVisualMath'
import type { SceneLuminanceReport } from './types'

const FEET_TO_METERS = 0.3048
const STELLARIUM_POINT_SPREAD_RADIUS_RAD = (2.5 / 60) * (Math.PI / 180)
const MAX_BRIGHTNESS_STAR_SAMPLES = 640
const MAX_SOLAR_SYSTEM_SAMPLES = 32
const BRIGHTNESS_STAR_MAGNITUDE_CUTOFF = 6.2
const BRIGHTNESS_SOLAR_SYSTEM_MAGNITUDE_CUTOFF = 7.5
const SKY_LUMINANCE_SAMPLE_COLUMNS = 8
const SKY_LUMINANCE_SAMPLE_ROWS = 6

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function estimateStarLuminanceContributor(
  props: ScenePropsSnapshot,
  currentFovDegrees: number,
) {
  let samples = 0
  let illuminance = 0

  for (const object of props.objects) {
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
    ? coreIlluminanceToLumApparent(illuminance, 0, currentFovDegrees)
    : 0
  const reportedLuminance = apparentLuminance > 0 ? Math.pow(apparentLuminance, 1 / 3) / 300 : 0

  return {
    luminance: reportedLuminance,
    sampleCount: samples,
  }
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
  let brightestLuminance = 0
  let samples = 0

  for (const object of props.objects) {
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

    const lum = coreReportVmagInFovLuminance({
      magnitude: object.magnitude,
      angularRadiusRad: angularRadius,
      separationRad: Math.max(0, separation - angularRadius),
      fovDegrees: currentFovDegrees,
    })

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

function evaluateVisibleSkyLuminance(
  props: ScenePropsSnapshot,
  services: SkySceneRuntimeServices,
  moonObject: ScenePropsSnapshot['objects'][number] | null,
  baseline: ReturnType<typeof evaluateStellariumSkyBrightnessBaseline>,
) {
  const centerDirection = services.navigationService.getCenterDirection()

  if (
    typeof services.projectionService.createView !== 'function' ||
    typeof services.projectionService.unproject !== 'function'
  ) {
    return {
      averageLuminance: baseline.zenithSkyLuminance,
      maxLuminance: baseline.zenithSkyLuminance,
      sampleCount: 1,
    }
  }

  const view = services.projectionService.createView(centerDirection)
  const sunDirection = horizontalToDirection(props.sunState.altitudeDeg, props.sunState.azimuthDeg)
  const moonDirection = moonObject
    ? horizontalToDirection(moonObject.altitudeDeg, moonObject.azimuthDeg)
    : null
  const context = buildStellariumSkyBrightnessContext({
    timestampIso: resolveTimestampIso(props),
    latitudeDeg: resolveObserverLatitudeDeg(props),
    observerElevationM: resolveObserverElevationMeters(props),
    sunAltitudeRad: (props.sunState.altitudeDeg * Math.PI) / 180,
    moonAltitudeRad: moonObject ? (moonObject.altitudeDeg * Math.PI) / 180 : null,
    moonMagnitude: moonObject?.magnitude,
  })
  let totalLuminance = 0
  let maxLuminance = 0
  let sampleCount = 0

  for (let row = 0; row < SKY_LUMINANCE_SAMPLE_ROWS; row += 1) {
    const screenY = ((row + 0.5) / SKY_LUMINANCE_SAMPLE_ROWS) * view.viewportHeight

    for (let column = 0; column < SKY_LUMINANCE_SAMPLE_COLUMNS; column += 1) {
      const screenX = ((column + 0.5) / SKY_LUMINANCE_SAMPLE_COLUMNS) * view.viewportWidth
      const sampleDirection = services.projectionService.unproject(
        screenX,
        screenY,
        centerDirection,
        view.fovRadians,
      )
      const cosZenithDistance = clamp(sampleDirection.y, 0, 1)

      if (cosZenithDistance <= 0) {
        continue
      }

      const cosMoonDistance = moonDirection
        ? clamp(
          sampleDirection.x * moonDirection.x +
            sampleDirection.y * moonDirection.y +
            sampleDirection.z * moonDirection.z,
          -1,
          1,
        )
        : -1
      const cosSunDistance = clamp(
        sampleDirection.x * sunDirection.x +
          sampleDirection.y * sunDirection.y +
          sampleDirection.z * sunDirection.z,
        -1,
        1,
      )
      const luminance = computeStellariumSkyLuminance(context, {
        cosMoonDistance,
        cosSunDistance,
        cosZenithDistance,
      })

      totalLuminance += luminance
      maxLuminance = Math.max(maxLuminance, luminance)
      sampleCount += 1
    }
  }

  if (sampleCount === 0) {
    return {
      averageLuminance: baseline.zenithSkyLuminance,
      maxLuminance: baseline.zenithSkyLuminance,
      sampleCount: 1,
    }
  }

  return {
    averageLuminance: totalLuminance / sampleCount,
    maxLuminance,
    sampleCount,
  }
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
  const sky = evaluateVisibleSkyLuminance(props, services, moonObject, baseline)
  const star = estimateStarLuminanceContributor(props, currentFovDegrees)
  const solarSystem = estimateSolarSystemLuminanceContributor(props, currentFovDegrees, centerDirection)
  const target = Math.max(sky.maxLuminance, star.luminance, solarSystem.luminance)
  const targetFastAdaptation = target === sky.maxLuminance && target > 0

  return {
    skyBrightness: computeSkyBrightnessFromLuminance(sky.averageLuminance),
    skyAverageLuminance: sky.averageLuminance,
    skySampleCount: sky.sampleCount,
    nightSkyZenithLuminance: baseline.nightSkyZenithLuminance,
    nightSkyHorizonLuminance: baseline.nightSkyHorizonLuminance,
    sky: sky.maxLuminance,
    stars: star.luminance,
    solarSystem: solarSystem.luminance,
    target,
    targetFastAdaptation,
    starSampleCount: star.sampleCount,
    solarSystemSampleCount: solarSystem.sampleCount,
  }
}
