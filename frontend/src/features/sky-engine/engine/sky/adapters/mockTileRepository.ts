import type { SkyTilePayload, SkyTileRepository } from '../contracts/tiles'
import type { RuntimeStar, SkyRuntimeTier } from '../contracts/stars'
import { getAllSkyTileDescriptors } from '../core/tileIndex'

const NAMED_STARS: RuntimeStar[] = [
  {
    id: 'star-polaris',
    sourceId: 'HIP 11767',
    raDeg: 37.954515,
    decDeg: 89.264109,
    mag: 1.98,
    colorIndex: 0.6,
    tier: 'T0',
    properName: 'Polaris',
  },
  {
    id: 'star-kochab',
    sourceId: 'HIP 72607',
    raDeg: 222.676361,
    decDeg: 74.155503,
    mag: 2.08,
    colorIndex: 1.47,
    tier: 'T1',
    properName: 'Kochab',
  },
  {
    id: 'star-vega',
    sourceId: 'HIP 91262',
    raDeg: 279.234735,
    decDeg: 38.783689,
    mag: 0.03,
    colorIndex: 0,
    tier: 'T0',
    properName: 'Vega',
  },
  {
    id: 'star-deneb',
    sourceId: 'HIP 102098',
    raDeg: 310.35798,
    decDeg: 45.280339,
    mag: 1.25,
    colorIndex: 0.09,
    tier: 'T0',
    properName: 'Deneb',
  },
  {
    id: 'star-altair',
    sourceId: 'HIP 97649',
    raDeg: 297.695835,
    decDeg: 8.868321,
    mag: 0.77,
    colorIndex: 0.22,
    tier: 'T1',
    properName: 'Altair',
  },
  {
    id: 'star-albireo',
    sourceId: 'HIP 95947',
    raDeg: 292.68042,
    decDeg: 27.959681,
    mag: 3.05,
    colorIndex: 1.09,
    tier: 'T1',
    properName: 'Albireo',
  },
  {
    id: 'star-tarazed',
    sourceId: 'HIP 97278',
    raDeg: 296.56491,
    decDeg: 10.613268,
    mag: 2.72,
    colorIndex: 1.5,
    tier: 'T1',
    properName: 'Tarazed',
  },
  {
    id: 'star-sheliak',
    sourceId: 'HIP 92420',
    raDeg: 282.519975,
    decDeg: 33.362667,
    mag: 3.45,
    colorIndex: -0.03,
    tier: 'T2',
    properName: 'Sheliak',
  },
  {
    id: 'star-sulafat',
    sourceId: 'HIP 93194',
    raDeg: 284.73594,
    decDeg: 32.689557,
    mag: 3.25,
    colorIndex: -0.02,
    tier: 'T2',
    properName: 'Sulafat',
  },
  {
    id: 'star-arcturus',
    sourceId: 'HIP 69673',
    raDeg: 214.015315,
    decDeg: 19.18241,
    mag: -0.05,
    colorIndex: 1.23,
    tier: 'T0',
    properName: 'Arcturus',
  },
  {
    id: 'star-izar',
    sourceId: 'HIP 72105',
    raDeg: 221.246734,
    decDeg: 27.074173,
    mag: 2.35,
    colorIndex: 0.9,
    tier: 'T1',
    properName: 'Izar',
  },
]

function hashString(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

function createSeededRandom(seedText: string) {
  let seed = hashString(seedText) || 1

  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}

function resolveAnonymousStarCount(level: number) {
  if (level === 0) {
    return 1
  }

  if (level === 1) {
    return 3
  }

  if (level === 2) {
    return 6
  }

  return 10
}

function resolveMagnitudeBand(level: number) {
  if (level === 0) {
    return { magMin: -1, magMax: 4.5 }
  }

  if (level === 1) {
    return { magMin: 1, magMax: 6.8 }
  }

  if (level === 2) {
    return { magMin: 2.5, magMax: 9.8 }
  }

  return { magMin: 4, magMax: 13.2 }
}

function resolveTierForMagnitude(mag: number): SkyRuntimeTier {
  if (mag <= 2.5) {
    return 'T0'
  }

  if (mag <= 6.5) {
    return 'T1'
  }

  if (mag <= 10.5) {
    return 'T2'
  }

  return 'T3'
}

function boundsContainPoint(raDeg: number, decDeg: number, bounds: SkyTilePayload['bounds']) {
  return raDeg >= bounds.raMinDeg && raDeg < bounds.raMaxDeg && decDeg >= bounds.decMinDeg && decDeg < bounds.decMaxDeg
}

function buildAnonymousStars(tileId: string, level: number, bounds: SkyTilePayload['bounds']) {
  const random = createSeededRandom(tileId)
  const magnitudeBand = resolveMagnitudeBand(level)
  const starCount = resolveAnonymousStarCount(level)

  return Array.from({ length: starCount }, (_, starIndex) => {
    const raDeg = bounds.raMinDeg + random() * (bounds.raMaxDeg - bounds.raMinDeg)
    const decDeg = bounds.decMinDeg + random() * (bounds.decMaxDeg - bounds.decMinDeg)
    const mag = Number((magnitudeBand.magMin + random() * (magnitudeBand.magMax - magnitudeBand.magMin)).toFixed(2))
    const colorIndex = Number((-0.05 + random() * 1.65).toFixed(2))

    return {
      id: `${tileId}-anon-${starIndex + 1}`,
      raDeg,
      decDeg,
      mag,
      colorIndex,
      tier: resolveTierForMagnitude(mag),
    } satisfies RuntimeStar
  })
}

function buildTilePayloadMap() {
  return getAllSkyTileDescriptors().reduce<Record<string, SkyTilePayload>>((payloads, descriptor) => {
    const namedStars = NAMED_STARS.filter((star) => boundsContainPoint(star.raDeg, star.decDeg, descriptor.bounds))
    const anonymousStars = buildAnonymousStars(descriptor.tileId, descriptor.level, descriptor.bounds)
    const stars = [...namedStars, ...anonymousStars]
    const magnitudeBand = resolveMagnitudeBand(descriptor.level)

    payloads[descriptor.tileId] = {
      tileId: descriptor.tileId,
      level: descriptor.level,
      parentTileId: descriptor.parentTileId,
      childTileIds: [...descriptor.childTileIds],
      bounds: descriptor.bounds,
      magMin: magnitudeBand.magMin,
      magMax: magnitudeBand.magMax,
      starCount: stars.length,
      stars,
      labelCandidates: namedStars.map((star) => ({
        starId: star.id,
        label: star.properName ?? star.bayer ?? star.flamsteed ?? star.sourceId ?? star.id,
        priority: Math.max(60, Math.round((10 - star.mag) * 16)),
      })),
      provenance: {
        catalog: 'mock',
        sourcePath: 'in-memory://mock-sky-tiles',
        generator: 'createMockTileRepository',
        tierSet: Array.from(new Set(stars.map((star) => star.tier))).sort(),
      },
    }

    return payloads
  }, {})
}

const MOCK_TILE_PAYLOADS = buildTilePayloadMap()

function cloneTile(tile: SkyTilePayload): SkyTilePayload {
  return {
    ...tile,
    childTileIds: [...tile.childTileIds],
    bounds: { ...tile.bounds },
    stars: tile.stars.map((star) => ({ ...star })),
    labelCandidates: tile.labelCandidates ? tile.labelCandidates.map((candidate) => ({ ...candidate })) : undefined,
    provenance: tile.provenance ? { ...tile.provenance, tierSet: tile.provenance.tierSet ? [...tile.provenance.tierSet] : undefined } : undefined,
  }
}

export function createMockTileRepository(): SkyTileRepository {
  return {
    async loadTiles(query) {
      return {
        mode: 'mock',
        sourceLabel: 'Mock tile repository',
        sourceError: null,
        tiles: query.visibleTileIds
        .map((tileId) => MOCK_TILE_PAYLOADS[tileId])
        .filter((tile): tile is SkyTilePayload => tile != null)
        .map(cloneTile),
      }
    },
  }
}

export const mockSkyTileRepository = createMockTileRepository()