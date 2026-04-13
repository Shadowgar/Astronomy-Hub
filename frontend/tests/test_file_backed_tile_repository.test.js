import { afterEach, describe, expect, it, vi } from 'vitest'

import { createFileBackedSkyTileRepository } from '../src/features/sky-engine/engine/sky'

const TEST_QUERY = {
  observer: {
    timestampUtc: '2026-07-15T02:00:00.000Z',
    latitudeDeg: 44,
    longitudeDeg: -123,
    elevationM: 120,
    fovDeg: 80,
    centerAltDeg: 28,
    centerAzDeg: 96,
    projection: 'stereographic',
  },
  limitingMagnitude: 8.5,
  activeTiers: ['T0', 'T1', 'T2'],
  visibleTileIds: ['root-nw', 'root-ne'],
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('file-backed sky tile repository', () => {
  it('loads emitted Hipparcos tiles and synthesizes empty visible tiles that were not written', async () => {
    const repository = createFileBackedSkyTileRepository('/sky-engine-assets/catalog/hipparcos/manifest.json')
    const fetchMock = vi.fn(async (assetPath) => {
      if (assetPath === '/sky-engine-assets/catalog/hipparcos/manifest.json') {
        return {
          ok: true,
          json: async () => ({
            schemaVersion: 'sky-runtime-tile.v1',
            catalog: 'hipparcos',
            tileIndex: 'equatorial-quadtree-v1',
            generatedAt: '2026-04-06T00:00:00Z',
            generator: 'test',
            sourcePath: 'fixtures/hip_main.dat',
            sourceRecordCount: 1,
            maxLevel: 3,
            tileCount: 1,
            totalStarRecords: 1,
            tiles: {
              'root-nw': {
                path: 'tiles/root-nw.json',
                level: 0,
                starCount: 1,
                magMin: 1.98,
                magMax: 1.98,
              },
            },
          }),
        }
      }

      if (assetPath === '/sky-engine-assets/catalog/hipparcos/tiles/root-nw.json') {
        return {
          ok: true,
          json: async () => ({
            tileId: 'root-nw',
            level: 0,
            parentTileId: null,
            childTileIds: ['root-nw-nw', 'root-nw-ne', 'root-nw-sw', 'root-nw-se'],
            bounds: {
              raMinDeg: 0,
              raMaxDeg: 180,
              decMinDeg: 0,
              decMaxDeg: 90,
            },
            magMin: 1.98,
            magMax: 1.98,
            starCount: 1,
            stars: [{
              id: 'hip-11767',
              sourceId: 'HIP 11767',
              raDeg: 37.954515,
              decDeg: 89.264109,
              mag: 1.98,
              tier: 'T0',
              properName: 'Polaris',
            }],
            labelCandidates: [{ starId: 'hip-11767', label: 'Polaris', priority: 180 }],
            provenance: {
              catalog: 'hipparcos',
              sourcePath: 'fixtures/hip_main.dat',
            },
          }),
        }
      }

      if (assetPath === '/sky-engine-assets/catalog/hipparcos/hipparcos_tier2_subset.json') {
        return {
          ok: true,
          json: async () => [],
        }
      }

      throw new Error(`Unexpected asset request: ${assetPath}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    const result = await repository.loadTiles(TEST_QUERY)
    const emptyTile = result.tiles.find((tile) => tile.tileId === 'root-ne')

    expect(result.mode).toBe('hipparcos')
    expect(result.tiles).toHaveLength(2)
    expect(result.sourceLabel).toContain('multi-survey')
    expect(result.tiles.find((tile) => tile.tileId === 'root-nw')?.stars[0]?.properName).toBe('Polaris')
    expect(emptyTile?.starCount).toBe(0)
    expect(emptyTile?.provenance?.catalog).toBe('hipparcos')
  })

  it('activates the supplemental survey only when limiting magnitude reaches its range', async () => {
    const repository = createFileBackedSkyTileRepository('/sky-engine-assets/catalog/hipparcos/manifest.json')
    const fetchMock = vi.fn(async (assetPath) => {
      if (assetPath === '/sky-engine-assets/catalog/hipparcos/manifest.json') {
        return {
          ok: true,
          json: async () => ({
            schemaVersion: 'sky-runtime-tile.v1',
            catalog: 'hipparcos',
            tileIndex: 'equatorial-quadtree-v1',
            generatedAt: '2026-04-06T00:00:00Z',
            generator: 'test',
            sourcePath: 'fixtures/hip_main.dat',
            sourceRecordCount: 1,
            maxLevel: 3,
            tileCount: 1,
            totalStarRecords: 1,
            tiles: {
              'root-ne': {
                path: 'tiles/root-ne.json',
                level: 0,
                starCount: 1,
                magMin: 1.0,
                magMax: 1.0,
              },
            },
          }),
        }
      }

      if (assetPath === '/sky-engine-assets/catalog/hipparcos/tiles/root-ne.json') {
        return {
          ok: true,
          json: async () => ({
            tileId: 'root-ne',
            level: 0,
            parentTileId: null,
            childTileIds: ['root-ne-nw', 'root-ne-ne', 'root-ne-sw', 'root-ne-se'],
            bounds: {
              raMinDeg: 180,
              raMaxDeg: 360,
              decMinDeg: 0,
              decMaxDeg: 90,
            },
            magMin: 1.0,
            magMax: 1.0,
            starCount: 1,
            stars: [{
              id: 'hip-1',
              sourceId: 'HIP 1',
              raDeg: 185,
              decDeg: 10,
              mag: 1.0,
              tier: 'T0',
            }],
            labelCandidates: [],
          }),
        }
      }

      if (assetPath === '/sky-engine-assets/catalog/hipparcos/hipparcos_tier2_subset.json') {
        return {
          ok: true,
          json: async () => [{
            id: 'hip-2',
            name: 'HIP 2',
            right_ascension: 12.6,
            declination: 10,
            magnitude: 7.3,
            color_index: 0.2,
          }],
        }
      }

      throw new Error(`Unexpected asset request: ${assetPath}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    const wideResult = await repository.loadTiles({
      ...TEST_QUERY,
      limitingMagnitude: 5.8,
      activeTiers: ['T0', 'T1'],
      visibleTileIds: ['root-ne'],
    })
    const closeResult = await repository.loadTiles({
      ...TEST_QUERY,
      limitingMagnitude: 7.5,
      activeTiers: ['T0', 'T1', 'T2'],
      visibleTileIds: ['root-ne'],
    })

    expect(wideResult.tiles[0].stars.some((star) => star.id === 'hip-2')).toBe(false)
    expect(closeResult.tiles[0].stars.some((star) => star.id === 'hip-2')).toBe(true)
    expect(closeResult.sourceLabel).toContain('multi-survey')
  })
})
