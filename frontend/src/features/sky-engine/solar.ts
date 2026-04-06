import { computeHorizontalCoordinates, computeLocalSiderealTimeDeg, computeSolarEquatorialCoordinates } from './astronomy'
import type { SkyEngineObserver, SkyEngineSunPhase, SkyEngineSunState, SkyEngineVisualCalibration } from './types'

const DAYLIGHT_MIN_ALTITUDE_DEG = 8
const LOW_SUN_MIN_ALTITUDE_DEG = -8

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

function radiansToDegrees(value: number) {
  return (value * 180) / Math.PI
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function interpolate(start: number, end: number, amount: number) {
  return start + (end - start) * amount
}

function interpolateHex(startHex: string, endHex: string, amount: number) {
  const normalizedAmount = clamp01(amount)
  const parseChannel = (hex: string, index: number) => Number.parseInt(hex.slice(index, index + 2), 16)
  const start = startHex.replace('#', '')
  const end = endHex.replace('#', '')
  const red = Math.round(interpolate(parseChannel(start, 0), parseChannel(end, 0), normalizedAmount))
  const green = Math.round(interpolate(parseChannel(start, 2), parseChannel(end, 2), normalizedAmount))
  const blue = Math.round(interpolate(parseChannel(start, 4), parseChannel(end, 4), normalizedAmount))

  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function computeSkyDirection(altitudeDeg: number, azimuthDeg: number) {
  const altitudeRad = degreesToRadians(altitudeDeg)
  const azimuthRad = degreesToRadians(azimuthDeg)
  const horizontalRadius = Math.cos(altitudeRad)

  return {
    x: Math.sin(azimuthRad) * horizontalRadius,
    y: Math.sin(altitudeRad),
    z: Math.cos(azimuthRad) * horizontalRadius,
  }
}

export function deriveSunPhaseLabel(altitudeDeg: number): SkyEngineSunPhase {
  if (altitudeDeg >= DAYLIGHT_MIN_ALTITUDE_DEG) {
    return 'Daylight'
  }

  if (altitudeDeg >= LOW_SUN_MIN_ALTITUDE_DEG) {
    return 'Low Sun'
  }

  return 'Night'
}

export function deriveSunVisualCalibration(altitudeDeg: number): SkyEngineVisualCalibration {
  const phaseLabel = deriveSunPhaseLabel(altitudeDeg)

  if (phaseLabel === 'Daylight') {
    const amount = clamp01((altitudeDeg - DAYLIGHT_MIN_ALTITUDE_DEG) / 48)

    return {
      phaseLabel,
      directionalLightIntensity: interpolate(1.55, 2.35, amount),
      ambientLightIntensity: interpolate(0.22, 0.5, amount),
      directionalLightColorHex: interpolateHex('#ffd2a3', '#f5fbff', amount),
      ambientLightColorHex: interpolateHex('#35506d', '#8dc0ff', amount),
      backgroundColorHex: interpolateHex('#385e89', '#7bb1ff', amount),
      horizonColorHex: interpolateHex('#ffb777', '#d7ecff', amount),
      starVisibility: interpolate(0.18, 0.08, amount),
      starLabelVisibility: interpolate(0.24, 0.12, amount),
      atmosphereExposure: interpolate(0.95, 1.18, amount),
      atmosphereAerialPerspectiveIntensity: interpolate(0.58, 0.76, amount),
      atmosphereMultiScatteringIntensity: interpolate(1.08, 1.28, amount),
      atmosphereMieScatteringScale: interpolate(1.12, 1.24, amount),
    }
  }

  if (phaseLabel === 'Low Sun') {
    const amount = clamp01((altitudeDeg - LOW_SUN_MIN_ALTITUDE_DEG) / (DAYLIGHT_MIN_ALTITUDE_DEG - LOW_SUN_MIN_ALTITUDE_DEG))

    return {
      phaseLabel,
      directionalLightIntensity: interpolate(0.22, 1.45, amount),
      ambientLightIntensity: interpolate(0.08, 0.22, amount),
      directionalLightColorHex: interpolateHex('#ff8d4d', '#ffd7af', amount),
      ambientLightColorHex: interpolateHex('#243351', '#46617c', amount),
      backgroundColorHex: interpolateHex('#101d33', '#3d5f86', amount),
      horizonColorHex: interpolateHex('#ff884c', '#ffb375', amount),
      starVisibility: interpolate(0.55, 0.28, amount),
      starLabelVisibility: interpolate(0.62, 0.32, amount),
      atmosphereExposure: interpolate(0.82, 1.02, amount),
      atmosphereAerialPerspectiveIntensity: interpolate(0.44, 0.58, amount),
      atmosphereMultiScatteringIntensity: interpolate(1, 1.14, amount),
      atmosphereMieScatteringScale: interpolate(1.08, 1.2, amount),
    }
  }

  const amount = clamp01((altitudeDeg + 30) / (LOW_SUN_MIN_ALTITUDE_DEG + 30))

  return {
    phaseLabel,
    directionalLightIntensity: interpolate(0.05, 0.18, amount),
    ambientLightIntensity: interpolate(0.04, 0.09, amount),
    directionalLightColorHex: interpolateHex('#93bbff', '#7393c9', amount),
    ambientLightColorHex: interpolateHex('#13213a', '#223252', amount),
    backgroundColorHex: interpolateHex('#02060d', '#08182c', amount),
    horizonColorHex: interpolateHex('#18314d', '#32557a', amount),
    starVisibility: interpolate(1, 0.72, amount),
    starLabelVisibility: interpolate(1, 0.78, amount),
    atmosphereExposure: interpolate(0.76, 0.86, amount),
    atmosphereAerialPerspectiveIntensity: interpolate(0.28, 0.38, amount),
    atmosphereMultiScatteringIntensity: interpolate(0.84, 0.94, amount),
    atmosphereMieScatteringScale: interpolate(0.94, 1.04, amount),
  }
}

export function computeSunState(observer: SkyEngineObserver, timestampIso: string): SkyEngineSunState {
  const equatorialCoordinates = computeSolarEquatorialCoordinates(timestampIso)
  const horizontalCoordinates = computeHorizontalCoordinates(
    observer,
    timestampIso,
    equatorialCoordinates.rightAscensionHours,
    equatorialCoordinates.declinationDeg,
  )
  const skyDirection = computeSkyDirection(horizontalCoordinates.altitudeDeg, horizontalCoordinates.azimuthDeg)
  const localSiderealTimeDeg = computeLocalSiderealTimeDeg(observer.longitude, timestampIso)
  const visualCalibration = deriveSunVisualCalibration(horizontalCoordinates.altitudeDeg)

  return {
    altitudeDeg: horizontalCoordinates.altitudeDeg,
    azimuthDeg: horizontalCoordinates.azimuthDeg,
    isAboveHorizon: horizontalCoordinates.isAboveHorizon,
    phaseLabel: visualCalibration.phaseLabel,
    rightAscensionHours: equatorialCoordinates.rightAscensionHours,
    declinationDeg: equatorialCoordinates.declinationDeg,
    localSiderealTimeDeg,
    skyDirection,
    lightDirection: {
      x: -skyDirection.x,
      y: -skyDirection.y,
      z: -skyDirection.z,
    },
    visualCalibration,
  }
}