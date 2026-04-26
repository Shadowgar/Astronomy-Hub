import { describe, expect, it } from 'vitest'

import { healpixOrderPixToNuniq } from '../src/features/sky-engine/engine/sky/adapters/starsNuniq'
import {
  STARS_C_MODULE_AGAIN,
  addStarsCSurvey,
  addStarsCSurveyFromProperties,
  buildStarsCLifecycleFixture,
  buildStarsCSurveyPreloadRequests,
  buildStarsCTileFixture,
  compareStarsCSurveyByMaxVmag,
  createStarsCLifecycleState,
  createStarsCSurveyRuntime,
  createStarsCTileStore,
  findStarByHipFromLifecycleState,
  listStarsFromLifecycleState,
  parseStarsCSurveyProperties,
  parseStarsCTileRows,
} from '../src/features/sky-engine/engine/sky/adapters/starsCSurveyLifecyclePort'

function makeRow(overrides = {}) {
  return {
    type: 'STAR',
    gaia: 0n,
    hip: 0,
    vmag: 5,
    gmag: 5,
    ra: 10,
    de: 20,
    plx: 0.004,
    pra: 0.001,
    pde: -0.001,
    epoc: 2016,
    bv: 0.5,
    ids: '',
    spec: 'G2V',
    ...overrides,
  }
}

describe('module2 stars.c survey lifecycle port: properties and survey creation', () => {
  it('parses stars survey properties in hips property format', () => {
    const parsed = parseStarsCSurveyProperties([
      'type = stars',
      'hips_order_min = 3',
      'min_vmag = 2.5',
      'max_vmag = 11.2',
      'hips_release_date = 2025-10-12T00:00Z',
    ].join('\n'))

    expect(parsed.type).toBe('stars')
    expect(parsed.hipsOrderMin).toBe(3)
    expect(parsed.minVmag).toBe(2.5)
    expect(parsed.maxVmag).toBe(11.2)
    expect(parsed.hipsReleaseDate).toBe('2025-10-12T00:00Z')
  })

  it('defaults to permissive values when optional properties are missing', () => {
    const parsed = parseStarsCSurveyProperties('type = stars')
    expect(parsed.hipsOrderMin).toBe(0)
    expect(parsed.minVmag).toBe(-2)
    expect(Number.isNaN(parsed.maxVmag)).toBe(true)
    expect(parsed.hipsReleaseDate).toBeNull()
  })

  it('builds preload requests only for bright root-order surveys', () => {
    expect(buildStarsCSurveyPreloadRequests({ minOrder: 0, minVmag: -2 })).toHaveLength(12)
    expect(buildStarsCSurveyPreloadRequests({ minOrder: 1, minVmag: -2 })).toHaveLength(0)
    expect(buildStarsCSurveyPreloadRequests({ minOrder: 0, minVmag: 2 })).toHaveLength(0)
  })

  it('adds surveys sorted by max_vmag and raises Gaia min_vmag floor', () => {
    const empty = createStarsCLifecycleState()
    const stubStore = createStarsCTileStore()

    const hipBright = createStarsCSurveyRuntime({
      key: 'hip-bright',
      url: '/survey/hip-bright',
      properties: {
        type: 'stars',
        hipsOrderMin: 0,
        minVmag: -2,
        maxVmag: 6.5,
        hipsReleaseDate: null,
      },
      tileStore: stubStore,
    })

    const gaia = createStarsCSurveyRuntime({
      key: 'gaia',
      url: '/survey/gaia',
      properties: {
        type: 'stars',
        hipsOrderMin: 0,
        minVmag: 4,
        maxVmag: 20,
        hipsReleaseDate: null,
      },
      tileStore: stubStore,
    })

    const hipDeep = createStarsCSurveyRuntime({
      key: 'hip-deep',
      url: '/survey/hip-deep',
      properties: {
        type: 'stars',
        hipsOrderMin: 3,
        minVmag: 6.5,
        maxVmag: Number.NaN,
        hipsReleaseDate: null,
      },
      tileStore: stubStore,
    })

    let state = addStarsCSurvey(empty, hipDeep)
    state = addStarsCSurvey(state, gaia)
    state = addStarsCSurvey(state, hipBright)

    expect(state.surveys.map((survey) => survey.key)).toEqual(['hip-bright', 'gaia', 'hip-deep'])
    expect(state.surveys.find((survey) => survey.key === 'gaia')?.minVmag).toBe(6.5)
  })

  it('returns again when properties are not yet available', () => {
    const state = createStarsCLifecycleState()
    const result = addStarsCSurveyFromProperties({
      state,
      key: 'gaia',
      url: '/survey/gaia',
      propertiesText: '',
      tileStore: createStarsCTileStore(),
    })

    expect(result.status).toBe('again')
  })

  it('returns error when fetch status reports missing survey properties', () => {
    const state = createStarsCLifecycleState()
    const result = addStarsCSurveyFromProperties({
      state,
      key: 'missing',
      url: '/survey/missing',
      propertiesText: '',
      propertiesStatusCode: 404,
      tileStore: createStarsCTileStore(),
    })

    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.reason).toContain('status 404')
    }
  })

  it('returns error for non-stars source types', () => {
    const state = createStarsCLifecycleState()
    const result = addStarsCSurveyFromProperties({
      state,
      key: 'bad',
      url: '/survey/bad',
      propertiesText: 'type = image',
      tileStore: createStarsCTileStore(),
    })

    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.reason).toContain('not a star survey')
    }
  })

  it('compare helper follows survey_cmp max_vmag-only semantics', () => {
    const a = { maxVmag: 6.5 }
    const b = { maxVmag: Number.NaN }
    const c = { maxVmag: 4 }

    const ordered = [a, b, c].sort(compareStarsCSurveyByMaxVmag)
    expect(ordered).toEqual([c, a, b])
  })
})

describe('module2 stars.c survey lifecycle port: tile row normalization', () => {
  it('applies gaia overlap filter, default type/epoch, and HIP fallback IDs', () => {
    const parsed = parseStarsCTileRows({
      order: 0,
      pix: 1,
      rows: [
        makeRow({ hip: 11767, vmag: 2.1, gmag: 2.1, ids: '', type: '', epoc: 0 }),
        makeRow({ gaia: 111n, hip: 0, vmag: 2, gmag: 2, ids: 'GAIA 111' }),
      ],
      survey: { isGaia: true, minVmag: 2.05 },
    })

    expect(parsed.tile.stars).toHaveLength(1)
    const star = parsed.tile.stars[0]
    expect(star?.sourceId).toBe('HIP 11767')
    expect(star?.starType).toBe('*')
    expect(star?.epoch).toBe(2000)
    expect(star?.names).toEqual(['HIP 11767'])
  })

  it('zeroes parallax below Stellarium low-plx threshold', () => {
    const parsed = parseStarsCTileRows({
      order: 0,
      pix: 1,
      rows: [
        makeRow({ hip: 1, plx: 0.001, vmag: 2, gmag: 2 }),
        makeRow({ hip: 2, plx: 0.003, vmag: 3, gmag: 3 }),
      ],
      survey: { isGaia: false, minVmag: -2 },
    })

    expect(parsed.tile.stars[0]?.plxArcsec).toBe(0)
    expect(parsed.tile.stars[1]?.plxArcsec).toBe(0.003)
  })

  it('sorts stars by magnitude ascending for early-exit traversal compatibility', () => {
    const parsed = parseStarsCTileRows({
      order: 0,
      pix: 1,
      rows: [
        makeRow({ hip: 10, vmag: 7, gmag: 7 }),
        makeRow({ hip: 11, vmag: 2, gmag: 2 }),
        makeRow({ hip: 12, vmag: 4, gmag: 4 }),
      ],
      survey: { isGaia: false, minVmag: -2 },
    })

    expect(parsed.tile.stars.map((star) => star.hip)).toEqual([11, 12, 10])
    expect(parsed.tile.magMin).toBe(2)
    expect(parsed.tile.magMax).toBe(7)
    expect(parsed.tile.illuminance).toBeGreaterThan(0)
  })

  it('calculates transparency from children_mask like stars.c', () => {
    const parsed = parseStarsCTileRows({
      order: 0,
      pix: 1,
      rows: [makeRow({ hip: 1 })],
      survey: { isGaia: false, minVmag: -2 },
      childrenMask: 0b0101,
    })

    expect(parsed.transparency).toBe((~0b0101) & 15)
  })

  it('uses gmag when vmag is not finite', () => {
    const parsed = parseStarsCTileRows({
      order: 0,
      pix: 1,
      rows: [makeRow({ hip: 42, vmag: Number.NaN, gmag: 6.2 })],
      survey: { isGaia: false, minVmag: -2 },
    })

    expect(parsed.tile.stars[0]?.mag).toBe(6.2)
  })
})

describe('module2 stars.c survey lifecycle port: in-memory tile store', () => {
  it('returns pending while loading and tile when loaded', () => {
    const store = createStarsCTileStore()
    store.setPending(0, 3)

    expect(store.get(0, 3, false)).toEqual({ tile: null, code: 0 })

    const tile = buildStarsCTileFixture({
      order: 0,
      pix: 3,
      stars: [{ hip: 3, mag: 2.5 }],
    })
    store.setTile(tile)

    const loaded = store.get(0, 3, false)
    expect(loaded.code).toBe(200)
    expect(loaded.tile?.stars[0]?.hip).toBe(3)
  })

  it('returns explicit error code when set', () => {
    const store = createStarsCTileStore()
    store.setError(0, 99, 503)

    expect(store.get(0, 99, false)).toEqual({ tile: null, code: 503 })
  })

  it('maintains deterministic traversal order', () => {
    const store = createStarsCTileStore({
      traversal: [
        { order: 1, pix: 9 },
        { order: 0, pix: 2 },
      ],
    })

    expect(store.listTraversalTiles()).toEqual([
      { order: 0, pix: 2 },
      { order: 1, pix: 9 },
    ])
  })
})

describe('module2 stars.c survey lifecycle port: stars_list behavior', () => {
  it('no-hint traversal filters by max_mag and stops when callback interrupts', () => {
    const tileA = buildStarsCTileFixture({
      order: 0,
      pix: 0,
      stars: [
        { hip: 1, mag: 1.2 },
        { hip: 2, mag: 6.4 },
        { hip: 3, mag: 8.1 },
      ],
    })

    const tileB = buildStarsCTileFixture({
      order: 1,
      pix: 4,
      stars: [
        { hip: 4, mag: 2.1 },
        { hip: 5, mag: 2.2 },
      ],
    })

    const { state } = buildStarsCLifecycleFixture({
      key: 'hip-main',
      maxVmag: 6.5,
      tiles: [tileA, tileB],
    })

    const visited = []
    const status = listStarsFromLifecycleState({
      state,
      maxMag: 6.5,
      visit: (star) => {
        visited.push(star.hip)
        return star.hip === 4
      },
    })

    expect(status).toBe('ok')
    expect(visited).toEqual([1, 2, 4])
  })

  it('hinted traversal returns MODULE_AGAIN while tile is still loading', () => {
    const store = createStarsCTileStore()
    store.setPending(2, 12)

    const survey = createStarsCSurveyRuntime({
      key: 'hip-main',
      url: '/survey/hip-main',
      properties: {
        type: 'stars',
        hipsOrderMin: 0,
        minVmag: -2,
        maxVmag: 6.5,
        hipsReleaseDate: null,
      },
      tileStore: store,
    })

    const state = createStarsCLifecycleState([survey])
    const status = listStarsFromLifecycleState({
      state,
      hintNuniq: healpixOrderPixToNuniq(2, 12),
      maxMag: 0,
      visit: () => false,
    })

    expect(status).toBe(STARS_C_MODULE_AGAIN)
  })

  it('hinted traversal does not enforce local max_mag filtering', () => {
    const tile = buildStarsCTileFixture({
      order: 1,
      pix: 21,
      stars: [
        { hip: 21, mag: 9.5 },
        { hip: 22, mag: 1.2 },
      ],
    })

    const { state } = buildStarsCLifecycleFixture({
      key: 'hip-main',
      maxVmag: 6.5,
      tiles: [tile],
    })

    const visited = []
    const status = listStarsFromLifecycleState({
      state,
      hintNuniq: healpixOrderPixToNuniq(1, 21),
      maxMag: 2,
      visit: (star) => {
        visited.push(star.hip)
      },
    })

    expect(status).toBe('ok')
    expect(visited).toEqual([22, 21])
  })

  it('falls back to first survey when requested source key does not exist', () => {
    const tile = buildStarsCTileFixture({
      order: 0,
      pix: 2,
      stars: [{ hip: 88, mag: 2.8 }],
    })

    const fixture = buildStarsCLifecycleFixture({
      key: 'hip-main',
      tiles: [tile],
    })

    const state = createStarsCLifecycleState([fixture.survey])
    const visited = []
    listStarsFromLifecycleState({
      state,
      sourceKey: 'unknown',
      visit: (star) => {
        visited.push(star.hip)
      },
    })

    expect(visited).toEqual([88])
  })
})

describe('module2 stars.c survey lifecycle port: obj_get_by_hip behavior', () => {
  it('returns not-found when hip mapping is invalid', () => {
    const state = createStarsCLifecycleState([])
    expect(findStarByHipFromLifecycleState(state, 0)).toEqual({ status: 'not-found' })
  })

  it('returns pending when order-0 or order-1 tile is still loading', () => {
    const hip = 11767
    const pix0 = 0
    const pix1 = 3

    const store = createStarsCTileStore({
      traversal: [
        { order: 0, pix: pix0 },
        { order: 1, pix: pix1 },
      ],
    })
    store.setPending(0, pix0)

    const survey = createStarsCSurveyRuntime({
      key: 'hip-main',
      url: '/survey/hip-main',
      properties: {
        type: 'stars',
        hipsOrderMin: 0,
        minVmag: -2,
        maxVmag: 6.5,
        hipsReleaseDate: null,
      },
      tileStore: store,
    })

    const state = createStarsCLifecycleState([survey])
    const result = findStarByHipFromLifecycleState(state, hip)

    expect(result).toEqual({ status: 'pending' })
  })

  it('searches order 0 before order 1 and skips gaia surveys', () => {
    const hip = 11767

    const hipOrder0 = buildStarsCTileFixture({
      order: 0,
      pix: 0,
      stars: [{ hip, mag: 2.2, ids: 'HIP 11767' }],
    })
    const hipOrder1 = buildStarsCTileFixture({
      order: 1,
      pix: 3,
      stars: [{ hip, mag: 2.3, ids: 'HIP 11767' }],
    })
    const gaiaOrder0 = buildStarsCTileFixture({
      order: 0,
      pix: 0,
      isGaia: true,
      minVmag: 0,
      stars: [{ hip, mag: 2.1, gaia: 444n, ids: 'GAIA 444' }],
    })

    const hipFixture = buildStarsCLifecycleFixture({
      key: 'hip-main',
      tiles: [hipOrder0, hipOrder1],
    })
    const gaiaFixture = buildStarsCLifecycleFixture({
      key: 'gaia',
      isGaia: true,
      minVmag: 4,
      maxVmag: 20,
      tiles: [gaiaOrder0],
    })

    const state = createStarsCLifecycleState([gaiaFixture.survey, hipFixture.survey])
    const result = findStarByHipFromLifecycleState(state, hip)

    expect(result.status).toBe('found')
    if (result.status === 'found') {
      expect(result.star.catalog).toBe('hipparcos')
      expect(result.star.order).toBeUndefined()
      expect(result.star.hip).toBe(11767)
    }
  })
})
