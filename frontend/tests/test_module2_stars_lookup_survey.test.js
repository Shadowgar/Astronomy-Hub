import { describe, expect, it } from 'vitest'

import { findRuntimeStarByHipInTiles } from '../src/features/sky-engine/engine/sky/adapters/starsLookup.ts'

describe('module2 stars.c obj_get_by_hip survey traversal', () => {
  it('returns null when hip_get_pix mapping is missing before survey traversal', () => {
    const result = findRuntimeStarByHipInTiles([], 9999999)
    // stars.c::obj_get_by_hip (lines 932-936): if hip_get_pix returns -1, return null / 404.
    expect(result).toBe(null)
  })

  it('uses hip_get_pix(hip,2)-keyed survey buckets instead of linear whole-tile scans', () => {
    const tiles = [
      {
        tileId: 'root-sw',
        level: 0,
        parentTileId: null,
        childTileIds: [],
        bounds: { raMinDeg: 0, raMaxDeg: 180, decMinDeg: -90, decMaxDeg: 0 },
        magMin: 0,
        magMax: 7,
        starCount: 1,
        stars: [
          { id: 'hip-11767', sourceId: 'HIP 11767', raDeg: 37.954515, decDeg: 89.264109, mag: 1.98, tier: 'T0', catalog: 'hipparcos' },
        ],
      },
      {
        tileId: 'root-ne',
        level: 0,
        parentTileId: null,
        childTileIds: [],
        bounds: { raMinDeg: 180, raMaxDeg: 360, decMinDeg: 0, decMaxDeg: 90 },
        magMin: 0,
        magMax: 7,
        starCount: 1,
        stars: [
          { id: 'hip-91262', sourceId: 'HIP 91262', raDeg: 279.234735, decDeg: 38.783689, mag: 0.03, tier: 'T0', catalog: 'hipparcos' },
        ],
      },
    ]

    const result = findRuntimeStarByHipInTiles(tiles, 91262)
    // stars.c::obj_get_by_hip (lines 931-944): iterate by hip_get_pix buckets and return first matching HIP object.
    expect(result?.id).toBe('hip-91262')
  })

  it('keeps non-Gaia precedence and returns first matching HIP in stable tile/row order', () => {
    const tiles = [
      {
        tileId: 'root-ne',
        level: 0,
        parentTileId: null,
        childTileIds: [],
        bounds: { raMinDeg: 180, raMaxDeg: 360, decMinDeg: 0, decMaxDeg: 90 },
        magMin: 0,
        magMax: 7,
        starCount: 3,
        stars: [
          { id: 'gaia-11767', sourceId: 'HIP 11767', raDeg: 37.954515, decDeg: 89.264109, mag: 2.1, tier: 'T1', catalog: 'gaia' },
          { id: 'hip-11767-a', sourceId: 'HIP 11767', raDeg: 37.954515, decDeg: 89.264109, mag: 2.0, tier: 'T0', catalog: 'hipparcos' },
          { id: 'hip-11767-b', sourceId: 'HIP 11767', raDeg: 37.954515, decDeg: 89.264109, mag: 2.2, tier: 'T1', catalog: 'hipparcos' },
        ],
      },
    ]

    const result = findRuntimeStarByHipInTiles(tiles, 11767)
    // stars.c::obj_get_by_hip (lines 937-944): Gaia surveys skipped and first matching non-Gaia source is returned.
    expect(result?.id).toBe('hip-11767-a')
  })
})
