import { describe, expect, it } from 'vitest'

import { __fileTileRepositoryInternals } from '../src/features/sky-engine/engine/sky/adapters/fileTileRepository'

describe('file tile repository bounds helpers', () => {
  it('treats RA ranges crossing 0° as wrapped intervals', () => {
    const { isRaWithinBounds } = __fileTileRepositoryInternals

    expect(isRaWithinBounds(359, 350, 10)).toBe(true)
    expect(isRaWithinBounds(2, 350, 10)).toBe(true)
    expect(isRaWithinBounds(20, 350, 10)).toBe(false)
  })

  it('computes wrapped interval midpoint for fallback healpix sampling', () => {
    const { centerRaForBounds } = __fileTileRepositoryInternals

    expect(centerRaForBounds(350, 10)).toBeCloseTo(0, 12)
    expect(centerRaForBounds(170, 190)).toBeCloseTo(180, 12)
  })
})
