import { describe, expect, it } from 'vitest'

import { hipGetPix } from '../src/features/sky-engine/engine/sky/adapters/hipGetPix'
import { healpixOrderPixToNuniq } from '../src/features/sky-engine/engine/sky/adapters/starsNuniq'
import {
  STARS_C_MODULE_AGAIN,
  addStarsCModuleDataSource,
  buildStarsCModuleFixtureRuntime,
  computeStarsCModuleRuntimeDigest,
  findByDesignationFromStarsCModule,
  findStarByHipFromStarsCModule,
  listStarsFromStarsCModule,
  parseStarsCModuleProperties,
  renderStarsCModule,
} from '../src/features/sky-engine/engine/sky/adapters/starsCModuleRuntimePort'

describe('module2 stars.c module runtime port', () => {
  it('parses stars properties payload in hips format', () => {
    const parsed = parseStarsCModuleProperties([
      'type = stars',
      'hips_order_min = 2',
      'min_vmag = 1.5',
      'max_vmag = 12.4',
      'hips_release_date = 2025-02-01T00:00:00Z',
    ].join('\n'))

    expect(parsed.type).toBe('stars')
    expect(parsed.minOrder).toBe(2)
    expect(parsed.minVmag).toBe(1.5)
    expect(parsed.maxVmag).toBe(12.4)
    expect(parsed.releaseDate).toBe('2025-02-01T00:00:00Z')
  })

  it('returns MODULE_AGAIN while datasource properties are unresolved', () => {
    const runtime = buildStarsCModuleFixtureRuntime({ surveys: [] })
    const result = addStarsCModuleDataSource(runtime, {
      key: 'pending',
      url: '/catalog/pending',
      propertiesText: null,
      tileStore: {
        listTraversalTiles: () => [],
        getTile: () => ({ tile: null, code: 0 }),
        preloadRootLevel: () => undefined,
      },
    })

    expect(result.status).toBe(STARS_C_MODULE_AGAIN)
  })

  it('sorts surveys by max_vmag and promotes gaia min_vmag floor', () => {
    const runtime = buildStarsCModuleFixtureRuntime({
      surveys: [
        {
          key: 'gaia',
          isGaia: true,
          minVmag: 3,
          maxVmag: 20,
          tiles: [],
        },
        {
          key: 'hip-bright',
          minVmag: -2,
          maxVmag: 6.5,
          tiles: [],
        },
        {
          key: 'hip-deep',
          minVmag: 6.5,
          maxVmag: Number.NaN,
          tiles: [],
        },
      ],
    })

    expect(runtime.surveys.map((survey) => survey.key)).toEqual(['hip-bright', 'gaia', 'hip-deep'])
    expect(runtime.surveys.find((survey) => survey.key === 'gaia')?.minVmag).toBe(6.5)
  })

  it('list surface mirrors no-hint and hint behavior', () => {
    const hip11767Order0 = hipGetPix(11767, 0)
    const runtime = buildStarsCModuleFixtureRuntime({
      surveys: [
        {
          key: 'hip-main',
          minVmag: -2,
          maxVmag: 6.5,
          tiles: [
            {
              order: 0,
              pix: hip11767Order0,
              stars: [
                { hip: 11767, vmag: 2.1, raDeg: 0, decDeg: 0 },
                { hip: 2, vmag: 8.2, raDeg: 5, decDeg: 0 },
              ],
            },
          ],
        },
      ],
    })

    const listed = listStarsFromStarsCModule({
      runtime,
      maxMag: 6.5,
    })
    expect(listed.status).toBe(0)
    expect(listed.visited.map((star) => star.hip)).toEqual([11767])

    const hinted = listStarsFromStarsCModule({
      runtime,
      maxMag: 1,
      hintNuniq: healpixOrderPixToNuniq(0, hip11767Order0),
    })
    expect(hinted.status).toBe(0)
    expect(hinted.visited.map((star) => star.hip)).toEqual([11767, 2])
  })

  it('returns MODULE_AGAIN for hinted tile loading state', () => {
    const runtime = buildStarsCModuleFixtureRuntime({
      surveys: [
        {
          key: 'hip-main',
          tiles: [],
        },
      ],
    })

    const hinted = listStarsFromStarsCModule({
      runtime,
      maxMag: 6,
      hintNuniq: healpixOrderPixToNuniq(2, 99),
    })

    expect(hinted.status).toBe(-1)
  })

  it('obj_get_by_hip traversal probes order 0 then 1 and skips gaia-only matches', () => {
    const hip11767Order0 = hipGetPix(11767, 0)
    const runtime = buildStarsCModuleFixtureRuntime({
      surveys: [
        {
          key: 'gaia',
          isGaia: true,
          minVmag: 3,
          maxVmag: 20,
          tiles: [
            {
              order: 0,
              pix: hip11767Order0,
              stars: [{ hip: 11767, gaia: BigInt('111'), vmag: 2, raDeg: 0, decDeg: 0 }],
            },
          ],
        },
        {
          key: 'hip-main',
          minVmag: -2,
          maxVmag: 6.5,
          tiles: [
            {
              order: 0,
              pix: hip11767Order0,
              stars: [{ hip: 11767, vmag: 2.1, raDeg: 0, decDeg: 0 }],
            },
          ],
        },
      ],
    })

    const lookup = findStarByHipFromStarsCModule(runtime, 11767)
    expect(lookup.status).toBe('found')
    if (lookup.status === 'found') {
      expect(lookup.surveyKey).toBe('hip-main')
      expect(lookup.star.hip).toBe(11767)
    }
  })

  it('render visitor aggregates traversal entries and illuminance', () => {
    const runtime = buildStarsCModuleFixtureRuntime({
      surveys: [
        {
          key: 'hip-main',
          minVmag: -2,
          maxVmag: 6.5,
          tiles: [
            {
              order: 0,
              pix: 3,
              stars: [{ hip: 11767, vmag: 2.1, raDeg: 2, decDeg: 1 }],
            },
          ],
        },
      ],
    })

    const rendered = renderStarsCModule({
      runtime,
      starsLimitMagnitude: 6.5,
      hardLimitMagnitude: 6.5,
      projectStar: (star) => ({
        screenX: star.raDeg,
        screenY: star.decDeg,
        depth: 1,
        angularDistanceRad: 0,
      }),
      isPointClipped: () => false,
      isTileClipped: () => false,
    })

    expect(rendered.entries.length).toBe(1)
    expect(rendered.totalTileRequests).toBeGreaterThan(0)
    expect(rendered.loadedTileCount).toBeGreaterThan(0)
    expect(rendered.totalIlluminance).toBeGreaterThan(0)
  })

  it('designation lookup supports gaia and hip expressions', () => {
    const hip11767Order0 = hipGetPix(11767, 0)
    const runtime = buildStarsCModuleFixtureRuntime({
      surveys: [
        {
          key: 'hip-main',
          minVmag: -2,
          maxVmag: 6.5,
          tiles: [
            { order: 0, pix: hip11767Order0, stars: [{ hip: 11767, vmag: 2.1, raDeg: 0, decDeg: 0 }] },
          ],
        },
        {
          key: 'gaia',
          isGaia: true,
          minVmag: 3,
          maxVmag: 20,
          tiles: [
            { order: 0, pix: 3, stars: [{ gaia: BigInt('219547565555375488'), vmag: 2.1, raDeg: 0, decDeg: 0 }] },
          ],
        },
      ],
    })

    const gaia = findByDesignationFromStarsCModule(runtime, 'gaia 219547565555375488')
    expect(gaia.status).toBe('found')

    const hip = findByDesignationFromStarsCModule(runtime, 'hip 11767')
    expect(hip.status).toBe('found')
  })

  it('computes deterministic digest for the runtime seam', () => {
    const runtime = buildStarsCModuleFixtureRuntime({
      surveys: [
        {
          key: 'hip-main',
          minVmag: -2,
          maxVmag: 6.5,
          tiles: [
            { order: 0, pix: 3, stars: [{ hip: 11767, vmag: 2.1, raDeg: 0, decDeg: 0 }] },
          ],
        },
      ],
    })

    const digest = computeStarsCModuleRuntimeDigest({
      runtime,
      starsLimitMagnitude: 6.5,
      hardLimitMagnitude: 6.4,
    })

    expect(digest).toContain('surveys:')
    expect(digest).toContain('render:')
    expect(digest).toContain('lookup:')
  })
})
