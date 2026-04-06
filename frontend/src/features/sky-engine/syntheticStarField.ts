import { resolveStarColorHex } from './starRenderer'

export interface SyntheticStarSample {
  readonly id: string
  readonly altitudeDeg: number
  readonly azimuthDeg: number
  readonly magnitude: number
  readonly colorHex: string
  readonly alpha: number
  readonly size: number
  readonly twinklePhase: number
}

function fract(value: number) {
  return value - Math.floor(value)
}

function pseudoRandom(seed: number) {
  return fract(Math.sin(seed * 12.9898 + 78.233) * 43758.5453123)
}

export function buildSyntheticStarField(count = 720): readonly SyntheticStarSample[] {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))

  return Array.from({ length: count }, (_, index) => {
    const normalized = (index + 0.5) / count
    const altitudeDeg = Math.asin(normalized) * (180 / Math.PI)
    const azimuthDeg = ((index * goldenAngle) * 180 / Math.PI) % 360
    const brightnessNoise = pseudoRandom(index + 1)
    const magnitude = 1.8 + brightnessNoise * 4.7
    const colorIndexBV = -0.2 + pseudoRandom(index + 17) * 1.8

    return {
      id: `synthetic-star-${index}`,
      altitudeDeg,
      azimuthDeg: azimuthDeg < 0 ? azimuthDeg + 360 : azimuthDeg,
      magnitude,
      colorHex: resolveStarColorHex(colorIndexBV),
      alpha: 0.16 + pseudoRandom(index + 29) * 0.4,
      size: 0.09 + pseudoRandom(index + 41) * 0.14,
      twinklePhase: pseudoRandom(index + 53) * Math.PI * 2,
    }
  }).sort((left, right) => left.magnitude - right.magnitude)
}
