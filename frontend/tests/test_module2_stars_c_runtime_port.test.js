import { describe, expect, it } from 'vitest'
import { hipGetPix } from '../src/features/sky-engine/engine/sky/adapters/hipGetPix'
import { healpixOrderPixToNuniq } from '../src/features/sky-engine/engine/sky/adapters/starsNuniq'
import {
  MODULE_AGAIN,
  addStarsPortSurvey,
  compareStarsPortSurveyByMaxVmag,
  createLoadedTilesPortSurvey,
  createStarsPortState,
  findStarByHipFromPortSurveys,
  listStarsFromPortSurvey,
  resolveStarsPortSurveyBySource,
} from '../src/features/sky-engine/engine/sky/adapters/starsCRuntimePort'

function makeStar(id, hip, mag, catalog = 'hipparcos') {
  return {
    id,
    sourceId: hip == null ? id : `HIP ${hip}`,
    raDeg: 0,
    decDeg: 0,
    mag,
    tier: 'T0',
    catalog,
  }
}

function makeTile({
  tileId,
  level,
  order,
  pix,
  stars,
  magMin = 0,
}) {
  return {
    tileId,
    level,
    parentTileId: null,
    childTileIds: [],
    bounds: { raMinDeg: 0, raMaxDeg: 1, decMinDeg: 0, decMaxDeg: 1 },
    magMin,
    magMax: 10,
    starCount: stars.length,
    stars,
    provenance: {
      catalog: 'multi-survey',
      sourcePath: 'fixture',
      sourceKey: 'hip-main',
      sourceKeys: ['hip-main'],
      hipsTiles: [{ sourceKey: 'hip-main', order, pix }],
    },
  }
}

function makeSurveyForOrdering({ key, minVmag, maxVmag, isGaia = false }) {
  return {
    key,
    minOrder: 0,
    minVmag,
    maxVmag,
    isGaia,
    listTraversalTiles: () => [],
    getTile: () => ({ tile: null, code: 404 }),
  }
}

function createTraversalSurvey() {
  const tiles = new Map([
    ['0:1', {
      order: 0,
      pix: 1,
      magMin: 0,
      stars: [
        makeStar('hip-1', 1, 1.1),
        makeStar('hip-2', 2, 7.5),
        makeStar('hip-3', 3, 5.2),
      ],
    }],
    ['1:5', {
      order: 1,
      pix: 5,
      magMin: 9,
      stars: [makeStar('hip-faint', 4, 9.5)],
    }],
    ['1:6', {
      order: 1,
      pix: 6,
      magMin: 0,
      stars: [
        makeStar('hip-5', 5, 2.4),
        makeStar('hip-6', 6, 3.6),
      ],
    }],
  ])

  return {
    key: 'hip-main',
    minOrder: 0,
    minVmag: -2,
    maxVmag: 6.5,
    isGaia: false,
    listTraversalTiles: () => [
      { order: 0, pix: 1 },
      { order: 1, pix: 5 },
      { order: 1, pix: 6 },
    ],
    getTile: (order, pix) => {
      const tile = tiles.get(`${order}:${pix}`) ?? null
      if (!tile) {
        return { tile: null, code: 404 }
      }
      return { tile, code: 200 }
    },
  }
}

function createHintSurvey({ missingCode = 0 } = {}) {
  const tiles = new Map([
    ['1:9', {
      order: 1,
      pix: 9,
      magMin: 0,
      stars: [
        makeStar('hip-10', 10, 8.5),
        makeStar('hip-11', 11, 2.1),
        makeStar('hip-12', 12, 9.2),
      ],
    }],
  ])

  return {
    key: 'hip-main',
    minOrder: 0,
    minVmag: -2,
    maxVmag: 6.5,
    isGaia: false,
    listTraversalTiles: () => [],
    getTile: (order, pix) => {
      const tile = tiles.get(`${order}:${pix}`) ?? null
      if (!tile) {
        return { tile: null, code: missingCode }
      }
      return { tile, code: 200 }
    },
  }
}

function makeSurveyForLookup({ key, isGaia = false, entries, pending = [] }) {
  const tiles = new Map(entries)
  const pendingSet = new Set(pending)

  return {
    key,
    minOrder: 0,
    minVmag: -2,
    maxVmag: isGaia ? 20 : 6.5,
    isGaia,
    listTraversalTiles: () => [],
    getTile: (order, pix) => {
      const tileKey = `${order}:${pix}`
      if (pendingSet.has(tileKey)) {
        return { tile: null, code: 0 }
      }
      const tile = tiles.get(tileKey) ?? null
      if (!tile) {
        return { tile: null, code: 404 }
      }
      return { tile, code: 200 }
    },
  }
}

describe('module2 stars.c runtime port: survey ordering and gaia gating', () => {
  it('compares by max_vmag only and sends NaN to the end', () => {
    const surveys = [
      makeSurveyForOrdering({ key: 'deep', minVmag: 6, maxVmag: Number.NaN }),
      makeSurveyForOrdering({ key: 'mid', minVmag: 0, maxVmag: 6.5 }),
      makeSurveyForOrdering({ key: 'bright', minVmag: -2, maxVmag: 4 }),
    ]

    const ordered = surveys.slice().sort(compareStarsPortSurveyByMaxVmag)
    expect(ordered.map((survey) => survey.key)).toEqual(['bright', 'mid', 'deep'])
  })

  it('adds surveys, sorts, and raises Gaia min_vmag by finite non-Gaia max_vmag values', () => {
    let state = createStarsPortState()

    state = addStarsPortSurvey(state, makeSurveyForOrdering({ key: 'hip-main', minVmag: -2, maxVmag: 6.5 }))
    state = addStarsPortSurvey(state, makeSurveyForOrdering({ key: 'hip-deep', minVmag: 6.5, maxVmag: Number.NaN }))
    state = addStarsPortSurvey(state, makeSurveyForOrdering({ key: 'gaia', minVmag: 4, maxVmag: 20, isGaia: true }))

    expect(state.surveys.map((survey) => survey.key)).toEqual(['hip-main', 'gaia', 'hip-deep'])

    const gaia = state.surveys.find((survey) => survey.key === 'gaia')
    expect(gaia?.minVmag).toBe(6.5)
  })

  it('resolves requested survey by key and falls back to first survey when missing', () => {
    const first = makeSurveyForOrdering({ key: 'hip-main', minVmag: -2, maxVmag: 6.5 })
    const second = makeSurveyForOrdering({ key: 'gaia', minVmag: 4, maxVmag: 20, isGaia: true })
    const state = createStarsPortState([first, second])

    expect(resolveStarsPortSurveyBySource(state, 'gaia')?.key).toBe('gaia')
    expect(resolveStarsPortSurveyBySource(state, 'does-not-exist')?.key).toBe('hip-main')
    expect(resolveStarsPortSurveyBySource(state, null)?.key).toBe('hip-main')
  })
})

describe('module2 stars.c runtime port: stars_list no-hint traversal', () => {

  it('filters by max_mag and continues after over-limit rows', () => {
    const survey = createTraversalSurvey()
    const visited = []

    const status = listStarsFromPortSurvey({
      survey,
      maxMag: 6,
      visit: (star) => {
        visited.push(star.id)
      },
    })

    expect(status).toBe('ok')
    expect(visited).toEqual(['hip-1', 'hip-3', 'hip-5', 'hip-6'])
  })

  it('skips tiles with mag_min >= max_mag', () => {
    const survey = createTraversalSurvey()
    const visited = []

    listStarsFromPortSurvey({
      survey,
      maxMag: 8,
      visit: (star) => {
        visited.push(star.id)
      },
    })

    expect(visited).not.toContain('hip-faint')
  })

  it('stops traversal when visitor asks to break', () => {
    const survey = createTraversalSurvey()
    const visited = []

    listStarsFromPortSurvey({
      survey,
      maxMag: 10,
      visit: (star) => {
        visited.push(star.id)
        return star.id === 'hip-5'
      },
    })

    expect(visited).toEqual(['hip-1', 'hip-2', 'hip-3', 'hip-faint', 'hip-5'])
  })

  it('treats non-finite max_mag as infinity', () => {
    const survey = createTraversalSurvey()
    const visited = []

    listStarsFromPortSurvey({
      survey,
      maxMag: Number.NaN,
      visit: (star) => {
        visited.push(star.id)
      },
    })

    expect(visited).toEqual(['hip-1', 'hip-2', 'hip-3', 'hip-faint', 'hip-5', 'hip-6'])
  })
})

describe('module2 stars.c runtime port: stars_list hinted nuniq traversal', () => {

  it('returns MODULE_AGAIN when hinted tile is still loading', () => {
    const survey = createHintSurvey({ missingCode: 0 })
    const status = listStarsFromPortSurvey({
      survey,
      hintNuniq: healpixOrderPixToNuniq(2, 9999),
      maxMag: 1,
      visit: () => false,
    })

    expect(status).toBe(MODULE_AGAIN)
  })

  it('returns ok on missing hinted tile when loader returns non-zero code', () => {
    const survey = createHintSurvey({ missingCode: 404 })
    const status = listStarsFromPortSurvey({
      survey,
      hintNuniq: healpixOrderPixToNuniq(2, 9999),
      maxMag: 1,
      visit: () => false,
    })

    expect(status).toBe('ok')
  })

  it('does not apply local max_mag filter on hinted traversal', () => {
    const survey = createHintSurvey()
    const visited = []

    const status = listStarsFromPortSurvey({
      survey,
      hintNuniq: healpixOrderPixToNuniq(1, 9),
      maxMag: 1,
      visit: (star) => {
        visited.push(star.id)
      },
    })

    expect(status).toBe('ok')
    expect(visited).toEqual(['hip-10', 'hip-11', 'hip-12'])
  })

  it('honors visitor break semantics in hinted traversal', () => {
    const survey = createHintSurvey()
    const visited = []

    listStarsFromPortSurvey({
      survey,
      hintNuniq: healpixOrderPixToNuniq(1, 9),
      visit: (star) => {
        visited.push(star.id)
        return star.id === 'hip-11'
      },
    })

    expect(visited).toEqual(['hip-10', 'hip-11'])
  })
})

describe('module2 stars.c runtime port: obj_get_by_hip semantics', () => {

  it('returns not-found for HIP values without pix mapping', () => {
    const state = createStarsPortState([])
    const result = findStarByHipFromPortSurveys(state, 0)
    expect(result).toEqual({ status: 'not-found' })
  })

  it('returns pending when a required tile is still loading', () => {
    const hip = 11767
    const order0Pix = hipGetPix(hip, 0)
    const survey = makeSurveyForLookup({
      key: 'hip-main',
      entries: [],
      pending: [`0:${order0Pix}`],
    })

    const state = createStarsPortState([survey])
    const result = findStarByHipFromPortSurveys(state, hip)
    expect(result).toEqual({ status: 'pending' })
  })

  it('returns first non-gaia HIP match and skips Gaia surveys', () => {
    const hip = 11767
    const order0Pix = hipGetPix(hip, 0)
    const order1Pix = hipGetPix(hip, 1)

    const gaiaSurvey = makeSurveyForLookup({
      key: 'gaia',
      isGaia: true,
      entries: [
        [`0:${order0Pix}`, {
          order: 0,
          pix: order0Pix,
          magMin: 0,
          stars: [makeStar('gaia-11767', 11767, 2.1, 'gaia')],
        }],
      ],
    })

    const hipSurvey = makeSurveyForLookup({
      key: 'hip-main',
      entries: [
        [`0:${order0Pix}`, {
          order: 0,
          pix: order0Pix,
          magMin: 0,
          stars: [makeStar('hip-11767-a', 11767, 2)],
        }],
        [`1:${order1Pix}`, {
          order: 1,
          pix: order1Pix,
          magMin: 0,
          stars: [makeStar('hip-11767-b', 11767, 2.2)],
        }],
      ],
    })

    const state = createStarsPortState([gaiaSurvey, hipSurvey])
    const result = findStarByHipFromPortSurveys(state, hip)

    expect(result.status).toBe('found')
    if (result.status === 'found') {
      expect(result.star.id).toBe('hip-11767-a')
    }
  })

  it('checks order 0 before order 1 as in source traversal', () => {
    const hip = 11767
    const order0Pix = hipGetPix(hip, 0)
    const order1Pix = hipGetPix(hip, 1)

    const survey = makeSurveyForLookup({
      key: 'hip-main',
      entries: [
        [`0:${order0Pix}`, {
          order: 0,
          pix: order0Pix,
          magMin: 0,
          stars: [makeStar('hip-order0', hip, 2.1)],
        }],
        [`1:${order1Pix}`, {
          order: 1,
          pix: order1Pix,
          magMin: 0,
          stars: [makeStar('hip-order1', hip, 2.2)],
        }],
      ],
    })

    const state = createStarsPortState([survey])
    const result = findStarByHipFromPortSurveys(state, hip)

    expect(result.status).toBe('found')
    if (result.status === 'found') {
      expect(result.star.id).toBe('hip-order0')
    }
  })

  it('returns not-found when no matching HIP is present in loaded surveys', () => {
    const hip = 91262
    const survey = makeSurveyForLookup({
      key: 'hip-main',
      entries: [
        ['0:3', {
          order: 0,
          pix: 3,
          magMin: 0,
          stars: [makeStar('hip-other', 11767, 2.1)],
        }],
        ['1:15', {
          order: 1,
          pix: 15,
          magMin: 0,
          stars: [makeStar('hip-other-2', 11768, 2.2)],
        }],
      ],
    })

    const state = createStarsPortState([survey])
    const result = findStarByHipFromPortSurveys(state, hip)
    expect(result).toEqual({ status: 'not-found' })
  })
})

describe('module2 stars.c runtime port: loaded tiles survey adapter', () => {
  it('maps provenance hips tiles into deterministic traversal and lookup', () => {
    const tiles = [
      makeTile({
        tileId: 't-root',
        level: 0,
        order: 0,
        pix: 3,
        stars: [makeStar('hip-root', 11767, 2.1)],
      }),
      makeTile({
        tileId: 't-child',
        level: 1,
        order: 1,
        pix: 15,
        stars: [makeStar('hip-child', 11767, 2.2)],
      }),
    ]

    const survey = createLoadedTilesPortSurvey({
      key: 'hip-main',
      tiles,
      isGaia: false,
      maxVmag: 6.5,
    })

    expect(survey.listTraversalTiles()).toEqual([
      { order: 0, pix: 3 },
      { order: 1, pix: 15 },
    ])

    const rootTile = survey.getTile(0, 3, false)
    expect(rootTile.code).toBe(200)
    expect(rootTile.tile?.stars.map((star) => star.id)).toEqual(['hip-root'])
  })

  it('returns configured missing hint code when tile is absent', () => {
    const survey = createLoadedTilesPortSurvey({
      key: 'hip-main',
      tiles: [],
      isGaia: false,
      missingHintCode: 0,
    })

    const tile = survey.getTile(1, 99, false)
    expect(tile).toEqual({ tile: null, code: 0 })
  })

  it('supports state composition for lookup and list operations', () => {
    const hip = 11767
    const order0Pix = hipGetPix(hip, 0)

    const hipTiles = [
      makeTile({
        tileId: 'hip-root',
        level: 0,
        order: 0,
        pix: order0Pix,
        stars: [makeStar('hip-11767', 11767, 2.1)],
      }),
    ]
    const gaiaTiles = [
      makeTile({
        tileId: 'gaia-root',
        level: 0,
        order: 0,
        pix: order0Pix,
        stars: [makeStar('gaia-11767', 11767, 2.1, 'gaia')],
      }),
    ]

    const state = createStarsPortState([
      createLoadedTilesPortSurvey({ key: 'gaia', tiles: gaiaTiles, isGaia: true, minVmag: 4, maxVmag: 20 }),
      createLoadedTilesPortSurvey({ key: 'hip-main', tiles: hipTiles, isGaia: false, minVmag: -2, maxVmag: 6.5 }),
    ])

    const lookup = findStarByHipFromPortSurveys(state, 11767)
    expect(lookup.status).toBe('found')
    if (lookup.status === 'found') {
      expect(lookup.star.id).toBe('hip-11767')
    }

    const visited = []
    const status = listStarsFromPortSurvey({
      survey: resolveStarsPortSurveyBySource(state, 'hip-main'),
      maxMag: 6,
      visit: (star) => {
        visited.push(star.id)
      },
    })

    expect(status).toBe('ok')
    expect(visited).toEqual(['hip-11767'])
  })
})
