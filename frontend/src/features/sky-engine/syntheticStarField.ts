import { Vector3 } from '@babylonjs/core/Maths/math.vector'

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

export interface SyntheticSkyDensitySample {
  readonly id: string
  readonly direction: Vector3
  readonly magnitude: number
  readonly colorIndexBV: number
  readonly alpha: number
  readonly size: number
  readonly twinklePhase: number
  readonly bandWeight: number
}

export interface ProceduralSkyPatch {
  readonly id: string
  readonly direction: Vector3
  readonly radiusDeg: number
  readonly alpha: number
  readonly colorHex: string
  readonly bandWeight: number
}

const GALACTIC_POLE = new Vector3(0.46, 0.72, -0.52).normalize()

function fract(value: number) {
  return value - Math.floor(value)
}

function pseudoRandom(seed: number) {
  return fract(Math.sin(seed * 12.9898 + 78.233) * 43758.5453123)
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function smoothstep(edge0: number, edge1: number, value: number) {
  if (edge0 === edge1) {
    return value >= edge1 ? 1 : 0
  }

  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return amount * amount * (3 - 2 * amount)
}

function getFibonacciDirection(index: number, count: number, phase = 0) {
  const offset = 2 / count
  const increment = Math.PI * (3 - Math.sqrt(5))
  const y = ((index * offset) - 1) + offset * 0.5
  const radius = Math.sqrt(Math.max(0, 1 - y * y))
  const phi = ((index + phase) % count) * increment

  return new Vector3(Math.cos(phi) * radius, y, Math.sin(phi) * radius)
}

function getBandWeight(direction: Vector3) {
  const planeDistance = Math.abs(Vector3.Dot(direction, GALACTIC_POLE))
  const primaryBand = 1 - smoothstep(0.04, 0.72, planeDistance)
  const secondaryNoise = pseudoRandom(direction.x * 91 + direction.y * 173 + direction.z * 257)

  return clamp(primaryBand * 0.82 + secondaryNoise * 0.18, 0, 1)
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

export function buildSyntheticSkyDensityField(count = 2800): readonly SyntheticSkyDensitySample[] {
  return Array.from({ length: count }, (_, index) => {
    const direction = getFibonacciDirection(index, count, pseudoRandom(index + 19) * 0.37)
    const bandWeight = getBandWeight(direction)
    const brightnessNoise = pseudoRandom(index + 101)
    const magnitude = 4.9 + brightnessNoise * 9.2 - bandWeight * 1.6
    const magnitudeWeight = 1 - clamp((magnitude - 4.5) / 10, 0, 1)
    const colorIndexBV = -0.24 + pseudoRandom(index + 137) * 1.84

    return {
      id: `synthetic-density-star-${index}`,
      direction,
      magnitude,
      colorIndexBV,
      alpha: 0.045 + magnitudeWeight * 0.16 + pseudoRandom(index + 151) * 0.05 + bandWeight * 0.05,
      size: 0.14 + magnitudeWeight * 0.38 + pseudoRandom(index + 167) * 0.18,
      twinklePhase: pseudoRandom(index + 181) * Math.PI * 2,
      bandWeight,
    }
  }).sort((left, right) => left.magnitude - right.magnitude)
}

export function buildProceduralSkyBackdrop(count = 180): readonly ProceduralSkyPatch[] {
  return Array.from({ length: count }, (_, index) => {
    const direction = getFibonacciDirection(index, count, pseudoRandom(index + 211) * 0.58)
    const bandWeight = Math.pow(getBandWeight(direction), 1.2)
    const warmMix = pseudoRandom(index + 241)
    let baseColorIndex = 0.08

    if (warmMix > 0.66) {
      baseColorIndex = 1.08
    } else if (warmMix > 0.36) {
      baseColorIndex = 0.62
    }

    return {
      id: `procedural-sky-patch-${index}`,
      direction,
      radiusDeg: 5.5 + pseudoRandom(index + 227) * 15 + bandWeight * 8,
      alpha: 0.018 + bandWeight * 0.03 + pseudoRandom(index + 263) * 0.008,
      colorHex: resolveStarColorHex(baseColorIndex),
      bandWeight,
    }
  })
    .filter((patch) => patch.bandWeight > 0.14)
    .sort((left, right) => right.bandWeight - left.bandWeight)
}
