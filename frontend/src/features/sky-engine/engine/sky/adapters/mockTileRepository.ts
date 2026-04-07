import type { SkyEngineQuery, SkyTilePayload } from '../contracts/tiles'

export interface SkyTileRepository {
  loadTiles: (query: SkyEngineQuery) => SkyTilePayload[]
}

const MOCK_TILE_PAYLOADS: Record<string, SkyTilePayload> = {
  'tile-north-bright': {
    tileId: 'tile-north-bright',
    level: 0,
    magMin: 1.9,
    magMax: 5.1,
    starCount: 3,
    stars: [
      {
        id: 'star-polaris',
        raDeg: 37.954515,
        decDeg: 89.264109,
        mag: 1.98,
        colorIndex: 0.6,
        tier: 'T0',
        properName: 'Polaris',
      },
      {
        id: 'star-kochab',
        raDeg: 222.676361,
        decDeg: 74.155503,
        mag: 2.08,
        colorIndex: 1.47,
        tier: 'T1',
        properName: 'Kochab',
      },
      {
        id: 'star-north-anon-1',
        raDeg: 229.5,
        decDeg: 67.1,
        mag: 5.1,
        colorIndex: 0.42,
        tier: 'T1',
      },
    ],
    labelCandidates: ['star-polaris', 'star-kochab'],
  },
  'tile-east-bright': {
    tileId: 'tile-east-bright',
    level: 1,
    magMin: -0.1,
    magMax: 4.1,
    starCount: 4,
    stars: [
      {
        id: 'star-vega',
        raDeg: 279.234735,
        decDeg: 38.783689,
        mag: 0.03,
        colorIndex: 0,
        tier: 'T0',
        properName: 'Vega',
      },
      {
        id: 'star-deneb',
        raDeg: 310.35798,
        decDeg: 45.280339,
        mag: 1.25,
        colorIndex: 0.09,
        tier: 'T0',
        properName: 'Deneb',
      },
      {
        id: 'star-altair',
        raDeg: 297.695835,
        decDeg: 8.868321,
        mag: 0.77,
        colorIndex: 0.22,
        tier: 'T1',
        properName: 'Altair',
      },
      {
        id: 'star-east-anon-1',
        raDeg: 289.2,
        decDeg: 21.4,
        mag: 4.1,
        colorIndex: 0.36,
        tier: 'T1',
      },
    ],
    labelCandidates: ['star-vega', 'star-deneb', 'star-altair'],
  },
  'tile-east-detail': {
    tileId: 'tile-east-detail',
    level: 2,
    magMin: 0,
    magMax: 13.1,
    starCount: 9,
    stars: [
      {
        id: 'star-vega',
        raDeg: 279.234735,
        decDeg: 38.783689,
        mag: 0.03,
        colorIndex: 0,
        tier: 'T0',
        properName: 'Vega',
      },
      {
        id: 'star-albireo',
        raDeg: 292.68042,
        decDeg: 27.959681,
        mag: 3.05,
        colorIndex: 1.09,
        tier: 'T1',
        properName: 'Albireo',
      },
      {
        id: 'star-tarazed',
        raDeg: 296.56491,
        decDeg: 10.613268,
        mag: 2.72,
        colorIndex: 1.5,
        tier: 'T1',
        properName: 'Tarazed',
      },
      {
        id: 'star-sheliak',
        raDeg: 282.519975,
        decDeg: 33.362667,
        mag: 3.45,
        colorIndex: -0.03,
        tier: 'T2',
        properName: 'Sheliak',
      },
      {
        id: 'star-sulafat',
        raDeg: 284.73594,
        decDeg: 32.689557,
        mag: 3.25,
        colorIndex: -0.02,
        tier: 'T2',
        properName: 'Sulafat',
      },
      {
        id: 'star-east-anon-2',
        raDeg: 288.3,
        decDeg: 18.2,
        mag: 7.2,
        colorIndex: 0.44,
        tier: 'T2',
      },
      {
        id: 'star-east-anon-3',
        raDeg: 293.7,
        decDeg: 24.1,
        mag: 8.1,
        colorIndex: 0.71,
        tier: 'T2',
      },
      {
        id: 'star-east-anon-4',
        raDeg: 295.4,
        decDeg: 16.9,
        mag: 10.8,
        colorIndex: 0.27,
        tier: 'T3',
      },
      {
        id: 'star-east-anon-5',
        raDeg: 291.6,
        decDeg: 14.2,
        mag: 12.9,
        colorIndex: 0.54,
        tier: 'T3',
      },
    ],
    labelCandidates: ['star-vega', 'star-albireo', 'star-tarazed'],
  },
  'tile-west-bright': {
    tileId: 'tile-west-bright',
    level: 1,
    magMin: -0.1,
    magMax: 5.4,
    starCount: 3,
    stars: [
      {
        id: 'star-arcturus',
        raDeg: 214.015315,
        decDeg: 19.18241,
        mag: -0.05,
        colorIndex: 1.23,
        tier: 'T0',
        properName: 'Arcturus',
      },
      {
        id: 'star-izar',
        raDeg: 221.246734,
        decDeg: 27.074173,
        mag: 2.35,
        colorIndex: 0.9,
        tier: 'T1',
        properName: 'Izar',
      },
      {
        id: 'star-west-anon-1',
        raDeg: 210.8,
        decDeg: 12.4,
        mag: 5.4,
        colorIndex: 0.58,
        tier: 'T1',
      },
    ],
    labelCandidates: ['star-arcturus', 'star-izar'],
  },
}

function cloneTile(tile: SkyTilePayload): SkyTilePayload {
  return {
    ...tile,
    stars: tile.stars.map((star) => ({ ...star })),
    labelCandidates: tile.labelCandidates ? [...tile.labelCandidates] : undefined,
  }
}

export function createMockTileRepository(): SkyTileRepository {
  return {
    loadTiles(query) {
      return query.visibleTileIds
        .map((tileId) => MOCK_TILE_PAYLOADS[tileId])
        .filter((tile): tile is SkyTilePayload => tile != null)
        .map(cloneTile)
    },
  }
}

export const mockSkyTileRepository = createMockTileRepository()