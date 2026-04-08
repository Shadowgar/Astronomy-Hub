import { resolveLimitingMagnitude } from './engine/sky/core/magnitudePolicy'

const DEGREES_TO_RADIANS = Math.PI / 180
const ASTRONOMICAL_TWILIGHT_ALTITUDE = -18 * DEGREES_TO_RADIANS
const DAYLIGHT_TRANSITION_ALTITUDE = 10 * DEGREES_TO_RADIANS
const DARK_SKY_LIMITING_MAGNITUDE = 6.5

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

// Lightweight Schaefer-style proxy aligned to Stellarium's skybrightness shape:
// continuous dark-night -> twilight -> daylight growth driven by sun altitude.
export function computeSkyBrightness(sunAltitudeRad: number): number {
  const normalizedAltitude = clamp(
    (sunAltitudeRad - ASTRONOMICAL_TWILIGHT_ALTITUDE) /
      (DAYLIGHT_TRANSITION_ALTITUDE - ASTRONOMICAL_TWILIGHT_ALTITUDE),
    0,
    1,
  )

  return Math.pow(normalizedAltitude, 2.2)
}

// Night ~= +6.5, day ~= -1.0.
export function computeLimitingMagnitude(brightness: number): number {
  return 6.5 - clamp(brightness, 0, 1) * 7.5
}

export function computeEffectiveLimitingMagnitude(brightness: number, fovDegrees: number, starVisibility = 1): number {
  const skyBrightnessLimit = computeLimitingMagnitude(brightness)
  const displayLimit = resolveLimitingMagnitude(fovDegrees)
  const zoomGain = displayLimit - DARK_SKY_LIMITING_MAGNITUDE
  const visibility = clamp(starVisibility, 0, 1)

  return clamp(Math.min(displayLimit, skyBrightnessLimit + zoomGain * visibility), -1, displayLimit)
}

export function computeSkyBrightnessLimitingMagnitude(sunAltitudeDeg: number): number {
  return computeLimitingMagnitude(computeSkyBrightness(sunAltitudeDeg * DEGREES_TO_RADIANS))
}