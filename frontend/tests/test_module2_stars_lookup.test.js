import { describe, expect, it } from 'vitest'

import { findRuntimeStarByHipInTiles } from '../src/features/sky-engine/engine/sky/adapters/starsLookup.ts'

describe('module2 stars.c obj_get_by_hip-style lookup', () => {
  it('returns null when hip_get_pix does not map the HIP', () => {
    expect(findRuntimeStarByHipInTiles([], 0)).toBe(null)
  })

  it('finds matching non-Gaia star by HIP from loaded tiles', () => {
    const result = findRuntimeStarByHipInTiles([
      {
        tileId: 'root-ne',
        level: 0,
        parentTileId: null,
        childTileIds: [],
        bounds: { raMinDeg: 180, raMaxDeg: 360, decMinDeg: 0, decMaxDeg: 90 },
        magMin: 1,
        magMax: 6,
        starCount: 2,
        stars: [
          { id: 'hip-11767', sourceId: 'HIP 11767', raDeg: 37.954515, decDeg: 89.264109, mag: 1.98, tier: 'T0', catalog: 'hipparcos' },
          { id: 'gaia-11767', sourceId: 'HIP 11767', raDeg: 37.954515, decDeg: 89.264109, mag: 2.1, tier: 'T1', catalog: 'gaia' },
        ],
      },
    ], 11767)

    expect(result?.id).toBe('hip-11767')
  })

  it('skips Gaia stars even if HIP text matches', () => {
    const result = findRuntimeStarByHipInTiles([
      {
        tileId: 'root-ne',
        level: 0,
        parentTileId: null,
        childTileIds: [],
        bounds: { raMinDeg: 180, raMaxDeg: 360, decMinDeg: 0, decMaxDeg: 90 },
        magMin: 1,
        magMax: 6,
        starCount: 1,
        stars: [
          { id: 'gaia-91262', sourceId: 'HIP 91262', raDeg: 279.234735, decDeg: 38.783689, mag: 0.03, tier: 'T0', catalog: 'gaia' },
        ],
      },
    ], 91262)

    expect(result).toBe(null)
  })
})
