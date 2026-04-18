import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/features/sky-engine/engine/sky/adapters/ephCodec', () => ({
  parseSurveyProperties: vi.fn(() => ({
    minOrder: 3,
    releaseDate: '2018-08-28T08:10Z',
    tileFormat: ['eph'],
    minVmag: 6.5,
    maxVmag: 20,
  })),
  buildHipsTilePath: vi.fn((basePath, order, pix, extension) => `${basePath}/Norder${order}/Npix${pix}.${extension}`),
  decodeEphTile: vi.fn(async (_buffer, options) => ({
    stars: [
      {
        id: 'gaia-inside',
        sourceId: 'Gaia DR3 1',
        raDeg: 200,
        decDeg: 10,
        mag: Math.max(options?.minVmag ?? -2, 10.2),
        tier: 'T2',
      },
      {
        id: 'gaia-outside',
        sourceId: 'Gaia DR3 2',
        raDeg: 10,
        decDeg: 10,
        mag: 11,
        tier: 'T2',
      },
    ],
  })),
}))

vi.mock('../src/features/sky-engine/engine/sky/adapters/healpix', () => ({
  healpixPixToRaDec: vi.fn((_order, pix) => ({
    raDeg: pix === 0 ? 200 : 20,
    decDeg: 10,
  })),
  healpixAngToPix: vi.fn(() => 0),
}))

import { createFileBackedSkyTileRepository } from '../src/features/sky-engine/engine/sky'

const TEST_QUERY = {
  observer: {
    timestampUtc: '2026-07-15T02:00:00.000Z',
    latitudeDeg: 44,
    longitudeDeg: -123,
    elevationM: 120,
    fovDeg: 10,
    centerAltDeg: 28,
    centerAzDeg: 96,
    projection: 'stereographic',
  },
  limitingMagnitude: 5.8,
  activeTiers: ['T0', 'T1', 'T2'],
  visibleTileIds: ['root-ne'],
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('file-backed sky tile repository Gaia flow', () => {
  it('activates Gaia on narrow FOV and merges decoded stars on tile path', async () => {
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
                magMin: 1,
                magMax: 1,
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
            magMin: 1,
            magMax: 1,
            starCount: 1,
            stars: [{
              id: 'hip-1',
              sourceId: 'HIP 1',
              raDeg: 185,
              decDeg: 10,
              mag: 1,
              tier: 'T0',
            }],
            labelCandidates: [],
          }),
        }
      }

      if (assetPath === '/sky-engine-assets/catalog/gaia/properties') {
        return {
          ok: true,
          text: async () => 'hips_order_min = 3\nhips_release_date = 2018-08-28T08:10Z\nhips_tile_format = eph\n',
        }
      }

      if (assetPath === '/sky-engine-assets/catalog/gaia/mirror-manifest.json') {
        return {
          ok: true,
          json: async () => ({
            minOrder: 3,
            maxOrder: 5,
            mirroredAt: '2026-04-13T07:33:44.844Z',
            sourceUrl: 'https://data.stellarium.org/surveys/gaia',
            totalTileCount: 16088,
            tileCountByOrder: { '3': 768, '4': 3064, '5': 12256 },
          }),
        }
      }

      if (String(assetPath).startsWith('/sky-engine-assets/catalog/gaia/Norder')) {
        return {
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(16),
        }
      }

      throw new Error(`Unexpected asset request: ${assetPath}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    const result = await repository.loadTiles(TEST_QUERY)
    const mergedTile = result.tiles.find((tile) => tile.tileId === 'root-ne')
    const ids = mergedTile?.stars.map((star) => star.id) ?? []

    expect(result.mode).toBe('multi-survey')
    expect(result.sourceLabel).toContain('Hipparcos + Gaia HiPS')
    expect(ids).toContain('hip-1')
    expect(ids).toContain('gaia-inside')
    expect(ids).not.toContain('gaia-outside')
    expect(fetchMock.mock.calls.some(([assetPath]) => String(assetPath).includes('/sky-engine-assets/catalog/gaia/Norder'))).toBe(true)
  })
})
