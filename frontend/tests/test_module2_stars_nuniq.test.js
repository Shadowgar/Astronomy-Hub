import { describe, expect, it } from 'vitest'

import {
  decodeEphTileNuniq,
  encodeEphTileNuniq,
} from '../src/features/sky-engine/engine/sky/adapters/ephCodec'
import {
  healpixOrderPixToNuniq,
  nuniqToHealpixOrderAndPix,
} from '../src/features/sky-engine/engine/sky/adapters/starsNuniq'

describe('stars.c nuniq_to_pix (via decodeEphTileNuniq)', () => {
  it('round-trips order/pix through nuniq', () => {
    for (const order of [0, 1, 3, 5]) {
      const pix = order === 0 ? 0 : 7
      const nuniq = encodeEphTileNuniq(order, pix)
      expect(nuniqToHealpixOrderAndPix(nuniq)).toEqual(decodeEphTileNuniq(nuniq))
      expect(nuniqToHealpixOrderAndPix(nuniq)).toEqual({ order, pix })
    }
  })

  it('matches explicit stars.c-style index formula for sample values', () => {
    const samples = [16n, 1028n, 1_048_576n]
    for (const nuniq of samples) {
      const n = Number(nuniq)
      const order = Math.floor(Math.log2(Math.floor(n / 4)) / 2)
      const pix = n - 4 * (1 << (2 * order))
      expect(nuniqToHealpixOrderAndPix(nuniq)).toEqual({ order, pix })
    }
  })

  it('healpixOrderPixToNuniq aliases encodeEphTileNuniq', () => {
    expect(healpixOrderPixToNuniq(2, 42)).toBe(encodeEphTileNuniq(2, 42))
  })
})
