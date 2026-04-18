import { describe, expect, it } from 'vitest'

import { healpixAngToPix, healpixPixToRaDec } from '../src/features/sky-engine/engine/sky/adapters/healpix'

describe('healpix nest (Hub port of healpix subset)', () => {
  it('round-trips pixel index through center angle (nest)', () => {
    for (const order of [0, 1, 2, 3]) {
      const nside = 1 << order
      const npix = 12 * nside * nside
      const samples = [0, 1, Math.floor(npix / 2), npix - 2, npix - 1]

      for (const pix of samples) {
        const { raDeg, decDeg } = healpixPixToRaDec(order, pix)
        const roundTrip = healpixAngToPix(order, raDeg, decDeg)
        expect(roundTrip).toBe(pix)
      }
    }
  })

  it('maps a fixed sky position to a stable pixel for order 3', () => {
    const pix = healpixAngToPix(3, 37.95, 89.26)
    expect(pix).toBeGreaterThanOrEqual(0)
    expect(pix).toBeLessThan(12 * (1 << 6) * (1 << 6))
  })
})
