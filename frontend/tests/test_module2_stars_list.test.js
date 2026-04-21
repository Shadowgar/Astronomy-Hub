import { describe, expect, it } from 'vitest'

import { healpixOrderPixToNuniq } from '../src/features/sky-engine/engine/sky/adapters/starsNuniq'
import { listRuntimeStarsFromTiles } from '../src/features/sky-engine/engine/sky/adapters/starsList'

describe('module2 stars.c stars_list parity seam', () => {
  const tiles = [
    {
      tileId: 'root-hip',
      level: 0,
      parentTileId: null,
      childTileIds: [],
      bounds: { raMinDeg: 0, raMaxDeg: 180, decMinDeg: 0, decMaxDeg: 90 },
      magMin: 0,
      magMax: 8,
      starCount: 3,
      stars: [
        { id: 'hip-bright', sourceId: 'HIP 1', raDeg: 10, decDeg: 10, mag: 1.1, tier: 'T0', catalog: 'hipparcos' },
        { id: 'hip-mid', sourceId: 'HIP 2', raDeg: 20, decDeg: 12, mag: 5.4, tier: 'T1', catalog: 'hipparcos' },
        { id: 'gaia-mixed', sourceId: 'Gaia DR3 1', raDeg: 22, decDeg: 13, mag: 6.2, tier: 'T2', catalog: 'gaia' },
      ],
      provenance: { catalog: 'multi-survey', sourcePath: 'fixtures', hipsOrder: 0, hipsPix: 3 },
    },
    {
      tileId: 'child-gaia',
      level: 1,
      parentTileId: 'root-hip',
      childTileIds: [],
      bounds: { raMinDeg: 0, raMaxDeg: 90, decMinDeg: 0, decMaxDeg: 45 },
      magMin: 5,
      magMax: 12,
      starCount: 2,
      stars: [
        { id: 'gaia-1', sourceId: 'Gaia DR3 2', raDeg: 30, decDeg: 11, mag: 8.1, tier: 'T2', catalog: 'gaia' },
        { id: 'gaia-2', sourceId: 'Gaia DR3 3', raDeg: 35, decDeg: 14, mag: 9.2, tier: 'T2', catalog: 'gaia' },
      ],
      provenance: { catalog: 'gaia', sourcePath: 'gaia/Norder1/Npix5.eph', hipsOrder: 1, hipsPix: 5 },
    },
  ]

  it('defaults to first available loaded source and filters by max_mag', () => {
    const visited = []
    const status = listRuntimeStarsFromTiles({
      tiles,
      maxMag: 6,
      visit: (star) => {
        visited.push(star.id)
      },
    })
    expect(status).toBe('ok')
    expect(visited).toEqual(['hip-bright', 'hip-mid'])
  })

  it('returns MODULE_AGAIN-style status when hint nuniq tile is unresolved', () => {
    const status = listRuntimeStarsFromTiles({
      tiles,
      source: 'gaia',
      hintNuniq: healpixOrderPixToNuniq(2, 9),
      visit: () => false,
    })
    expect(status).toBe('again')
  })

  it('uses hinted tile when available and supports early callback break', () => {
    const visited = []
    const status = listRuntimeStarsFromTiles({
      tiles,
      source: 'gaia',
      hintNuniq: healpixOrderPixToNuniq(1, 5),
      visit: (star) => {
        visited.push(star.id)
        return true
      },
    })
    expect(status).toBe('ok')
    expect(visited).toEqual(['gaia-1'])
  })
})
