import type { SkyEngineObserver } from './types'

const DEGREES_TO_RADIANS = Math.PI / 180
const FEET_TO_METERS = 0.3048
const DEFAULT_TEMPERATURE_C = 15
const DEFAULT_RELATIVE_HUMIDITY_PERCENT = 40

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function exp10(value: number) {
  return Math.pow(10, value)
}

function resolveExtinctionMonth(timestampIso?: string) {
  if (!timestampIso) {
    return 6
  }

  const timestamp = new Date(timestampIso)

  if (Number.isNaN(timestamp.getTime())) {
    return 6
  }

  return timestamp.getUTCMonth() + 1
}

export interface AtmosphericExtinctionContext {
  extinctionCoefficient: number
}

export function computeAirmassFromCosZenith(cosZenithDistance: number) {
  if (cosZenithDistance <= 0) {
    return 40
  }

  return 1 / (cosZenithDistance + 0.025 * Math.exp(-11 * cosZenithDistance))
}

export function computeAirmassFromAltitude(altitudeDeg: number) {
  return computeAirmassFromCosZenith(Math.sin(altitudeDeg * DEGREES_TO_RADIANS))
}

export function buildAtmosphericExtinctionContext(
  observer: SkyEngineObserver,
  timestampIso?: string,
): AtmosphericExtinctionContext {
  const altitudeMeters = Math.max(0, observer.elevationFt * FEET_TO_METERS)
  const latitudeRad = observer.latitude * DEGREES_TO_RADIANS
  const month = resolveExtinctionMonth(timestampIso)
  const seasonalAngle = (month - 3) * 0.52359878
  const latitudeSign = observer.latitude >= 0 ? 1 : -1
  const relativeHumidityFraction = clamp(DEFAULT_RELATIVE_HUMIDITY_PERCENT / 100, 0.01, 0.99)

  const rayleighExtinction = 0.1066 * Math.exp(-altitudeMeters / 8200)
  const aerosolExtinction = 0.1 * Math.exp(-altitudeMeters / 1500)
    * Math.pow(1 - 0.32 / Math.log(relativeHumidityFraction), 1.33)
    * (1 + 0.33 * latitudeSign * Math.sin(seasonalAngle))
  const ozoneExtinction = 0.031 * Math.exp(-altitudeMeters / 8200)
    * (3 + 0.4 * (latitudeRad * Math.cos(seasonalAngle) - Math.cos(3 * latitudeRad))) / 3
  const waterVaporExtinction = 0.031 * 0.94 * relativeHumidityFraction
    * Math.exp(DEFAULT_TEMPERATURE_C / 15)
    * Math.exp(-altitudeMeters / 8200)

  return {
    extinctionCoefficient: Math.max(0, rayleighExtinction + aerosolExtinction + ozoneExtinction + waterVaporExtinction),
  }
}

export function computeAtmosphericTransmission(
  extinction: AtmosphericExtinctionContext,
  altitudeDeg: number,
) {
  const airmass = computeAirmassFromAltitude(altitudeDeg)
  return exp10(-0.4 * extinction.extinctionCoefficient * airmass)
}

export function computeObservedMagnitude(
  intrinsicMagnitude: number,
  extinction: AtmosphericExtinctionContext,
  altitudeDeg: number,
) {
  return intrinsicMagnitude + extinction.extinctionCoefficient * computeAirmassFromAltitude(altitudeDeg)
}