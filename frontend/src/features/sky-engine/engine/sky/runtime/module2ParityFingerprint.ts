/**
 * Stable fingerprint for module 2 “stars port” algorithms (G4): BV, nuniq, limit magnitude, `hip_get_pix`.
 * No I/O — pure functions only. Drift in snapshot = intentional port change or regression.
 */

import { bvToRgb } from '../adapters/bvToRgb'
import { encodeEphTileNuniq } from '../adapters/ephCodec'
import { nuniqToHealpixOrderAndPix } from '../adapters/starsNuniq'
import { hipGetPix } from '../adapters/hipGetPix'
import { resolveStarsRenderLimitMagnitude } from './stellariumPainterLimits'

const DECIMALS = 12

function q(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Number(value.toFixed(DECIMALS))
}

function triplet(rgb: readonly [number, number, number]): string {
  return `${q(rgb[0])},${q(rgb[1])},${q(rgb[2])}`
}

/**
 * Canonical string for the module 2 ported surface. Two runs on the same build MUST match bitwise.
 */
export function computeModule2PortFingerprint(): string {
  const parts: string[] = []

  const bvSamples = [-0.2, 0, 0.58, 1.2, 2.0]
  for (const bv of bvSamples) {
    parts.push(`bv:${bv}:${triplet(bvToRgb(bv))}`)
  }

  const order = 3
  const pix = 42
  const nuniq = encodeEphTileNuniq(order, pix)
  const decoded = nuniqToHealpixOrderAndPix(nuniq)
  const roundTrip = encodeEphTileNuniq(decoded.order, decoded.pix)
  parts.push(`nuniq:${nuniq.toString()}:${decoded.order}:${decoded.pix}:${roundTrip === nuniq ? '1' : '0'}`)

  parts.push(
    `lim:${resolveStarsRenderLimitMagnitude(6.5, { starsLimitMag: 7.2, hardLimitMag: 99 })}`,
  )
  parts.push(`lim-null:${resolveStarsRenderLimitMagnitude(8, null)}`)
  parts.push(
    `lim-cap:${resolveStarsRenderLimitMagnitude(12, { starsLimitMag: 6, hardLimitMag: 10 })}`,
  )

  const hipSamples = [0, 1, 11767, 91262, 120415]
  for (const hip of hipSamples) {
    parts.push(`hip:${hip}:${hipGetPix(hip, 0)}:${hipGetPix(hip, 1)}:${hipGetPix(hip, 2)}`)
  }

  return parts.join('::')
}
