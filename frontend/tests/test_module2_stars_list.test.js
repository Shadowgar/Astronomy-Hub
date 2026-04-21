import { describe, expect, it } from 'vitest'

import { healpixOrderPixToNuniq } from '../src/features/sky-engine/engine/sky/adapters/starsNuniq'
import { listRuntimeStarsFromTiles } from '../src/features/sky-engine/engine/sky/adapters/starsList'
import { assembleSkyScenePacket } from '../src/features/sky-engine/engine/sky/services/sceneAssembler.ts'

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
      provenance: { catalog: 'multi-survey', sourcePath: 'fixtures', sourceKey: 'hip-main', sourceKeys: ['hip-main'], hipsOrder: 0, hipsPix: 3 },
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
      provenance: {
        catalog: 'gaia',
        sourcePath: 'gaia/Norder1/Npix5.eph',
        sourceKey: 'gaia',
        sourceKeys: ['gaia'],
        hipsOrder: 1,
        hipsPix: 5,
        hipsTiles: [{ sourceKey: 'gaia', order: 1, pix: 5 }, { sourceKey: 'gaia', order: 1, pix: 6 }],
      },
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

  it('selects source tiles by source key when explicitly requested', () => {
    const visited = []
    const status = listRuntimeStarsFromTiles({
      tiles,
      source: 'gaia',
      maxMag: 9,
      visit: (star) => {
        visited.push(star.id)
      },
    })
    expect(status).toBe('ok')
    expect(visited).toEqual(['gaia-1'])
  })

  it('falls back to first available survey source when requested source key is unknown', () => {
    const visited = []
    const status = listRuntimeStarsFromTiles({
      tiles,
      source: 'unknown-survey-key',
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

  it('matches hinted nuniq against merged hipsTiles provenance entries', () => {
    const visited = []
    const status = listRuntimeStarsFromTiles({
      tiles,
      source: 'gaia',
      hintNuniq: healpixOrderPixToNuniq(1, 6),
      visit: (star) => {
        visited.push(star.id)
      },
    })
    expect(status).toBe('ok')
    expect(visited).toEqual(['gaia-1', 'gaia-2'])
  })

  it('prunes tiles by magMin and breaks per-tile traversal once max_mag is exceeded', () => {
    const visited = []
    const status = listRuntimeStarsFromTiles({
      tiles: [
        ...tiles,
        {
          tileId: 'deep-hip',
          level: 2,
          parentTileId: 'root-hip',
          childTileIds: [],
          bounds: { raMinDeg: 0, raMaxDeg: 90, decMinDeg: 0, decMaxDeg: 45 },
          magMin: 8.5,
          magMax: 12,
          starCount: 2,
          stars: [
            { id: 'hip-faint-a', sourceId: 'HIP 1001', raDeg: 10, decDeg: 10, mag: 9.1, tier: 'T2', catalog: 'hipparcos' },
            { id: 'hip-faint-b', sourceId: 'HIP 1002', raDeg: 11, decDeg: 11, mag: 10.2, tier: 'T2', catalog: 'hipparcos' },
          ],
          provenance: { catalog: 'hipparcos', sourcePath: 'fixtures', sourceKey: 'hip-main', sourceKeys: ['hip-main'] },
        },
        {
          tileId: 'mixed-order',
          level: 1,
          parentTileId: 'root-hip',
          childTileIds: [],
          bounds: { raMinDeg: 90, raMaxDeg: 180, decMinDeg: 0, decMaxDeg: 45 },
          magMin: 1,
          magMax: 9,
          starCount: 3,
          stars: [
            { id: 'hip-too-faint', sourceId: 'HIP 2003', raDeg: 100, decDeg: 10, mag: 8.7, tier: 'T2', catalog: 'hipparcos' },
            { id: 'hip-ok-2', sourceId: 'HIP 2002', raDeg: 101, decDeg: 10, mag: 4.2, tier: 'T1', catalog: 'hipparcos' },
            { id: 'hip-ok-1', sourceId: 'HIP 2001', raDeg: 102, decDeg: 10, mag: 2.1, tier: 'T0', catalog: 'hipparcos' },
          ],
          provenance: { catalog: 'hipparcos', sourcePath: 'fixtures', sourceKey: 'hip-main', sourceKeys: ['hip-main'] },
        },
      ],
      source: 'hip-main',
      maxMag: 6,
      visit: (star) => {
        visited.push(star.id)
      },
    })
    expect(status).toBe('ok')
    expect(visited).toEqual(['hip-bright', 'hip-mid', 'hip-ok-1', 'hip-ok-2'])
  })

  it('scene packet diagnostics run stars_list visit count over visible tiles (live path)', () => {
    const query = {
      observer: {
        timestampUtc: '2026-04-13T09:00:00.000Z',
        latitudeDeg: 41.32,
        longitudeDeg: -79.58,
        elevationM: 400,
        fovDeg: 60,
        centerAltDeg: 45,
        centerAzDeg: 180,
        projection: 'stereographic',
      },
      limitingMagnitude: 6,
      activeTiers: ['T0', 'T1', 'T2'],
      visibleTileIds: ['root-hip', 'child-gaia'],
      maxTileLevel: 3,
    }
    const repo = { mode: 'multi-survey', sourceLabel: 'fixture', sourceError: null }
    const packet = assembleSkyScenePacket(query, tiles, repo)
    expect(packet.diagnostics.starsListVisitCount).toBe(2)
  })
})
