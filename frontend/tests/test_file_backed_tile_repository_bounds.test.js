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

  it('orders surveys by maxVmag with NaN treated as +infinity', () => {
    const { compareSurveyByMaxVmag } = __fileTileRepositoryInternals
    const surveys = [
      { key: 'deep', minVmag: 10, maxVmag: Number.NaN, catalog: 'hipparcos', loadTile: async () => null },
      { key: 'bright', minVmag: -2, maxVmag: 6.5, catalog: 'hipparcos', loadTile: async () => null },
      { key: 'mid', minVmag: 6.5, maxVmag: 9.5, catalog: 'hipparcos', loadTile: async () => null },
    ]
    const ordered = surveys.slice().sort(compareSurveyByMaxVmag)
    expect(ordered.map((survey) => survey.key)).toEqual(['bright', 'mid', 'deep'])
  })

  it('promotes Gaia minVmag to the brightest non-Gaia survey maxVmag', () => {
    const { normalizeSurveyOrderingAndGaiaGate } = __fileTileRepositoryInternals
    const ordered = normalizeSurveyOrderingAndGaiaGate([
      { key: 'gaia', catalog: 'gaia', minVmag: 4, maxVmag: 20, loadTile: async () => null },
      { key: 'hipparcos', catalog: 'hipparcos', minVmag: -2, maxVmag: 6.5, loadTile: async () => null },
      { key: 'deep-local', catalog: 'hipparcos', minVmag: 6.5, maxVmag: 9.2, loadTile: async () => null },
    ])
    const gaia = ordered.find((survey) => survey.key === 'gaia')
    expect(gaia?.minVmag).toBe(9.2)
  })
})
