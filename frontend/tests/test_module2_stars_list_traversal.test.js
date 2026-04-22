import { describe, expect, it } from 'vitest'

import {
  StarsListTraversalCursor,
  buildStarsListTileTraversalState,
  compareStarsListTraversalTileOrder,
  visitStarsListNoHintTraversal,
} from '../src/features/sky-engine/engine/sky/adapters/starsListTraversal.ts'

const BASE_TILE = {
  bounds: { raMinDeg: 0, raMaxDeg: 180, decMinDeg: -90, decMaxDeg: 90 },
  labelCandidates: [],
  provenance: { catalog: 'hipparcos', sourcePath: 'fixtures', sourceKey: 'hip-main', sourceKeys: ['hip-main'] },
}

function buildTile(params) {
  return {
    ...BASE_TILE,
    tileId: params.tileId,
    level: params.level,
    parentTileId: params.parentTileId ?? null,
    childTileIds: params.childTileIds ?? [],
    magMin: params.magMin ?? 0,
    magMax: params.magMax ?? 10,
    starCount: params.stars?.length ?? 0,
    stars: params.stars ?? [],
    provenance: {
      ...BASE_TILE.provenance,
      hipsOrder: params.hipsOrder,
      hipsPix: params.hipsPix,
    },
  }
}

describe('module2 stars.c stars_list traversal cursor', () => {
  it('orders tiles by hips order/pix before level/id fallback', () => {
    const left = buildTile({ tileId: 'b', level: 1, hipsOrder: 1, hipsPix: 7 })
    const right = buildTile({ tileId: 'a', level: 0, hipsOrder: 1, hipsPix: 3 })
    expect(compareStarsListTraversalTileOrder(left, right)).toBeGreaterThan(0)
  })

  it('yields roots first and visits children only after pushChildrenForCurrentTile', () => {
    const state = buildStarsListTileTraversalState([
      buildTile({ tileId: 'root-b', level: 0, hipsOrder: 0, hipsPix: 5 }),
      buildTile({ tileId: 'root-a', level: 0, hipsOrder: 0, hipsPix: 3, childTileIds: ['child-a-0'] }),
      buildTile({ tileId: 'child-a-0', level: 1, parentTileId: 'root-a', hipsOrder: 1, hipsPix: 12 }),
    ])
    const cursor = new StarsListTraversalCursor(state)
    const seen = []

    const first = cursor.nextTile()
    seen.push(first?.tileId)
    cursor.pushChildrenForCurrentTile()

    const second = cursor.nextTile()
    seen.push(second?.tileId)
    cursor.pushChildrenForCurrentTile()

    const third = cursor.nextTile()
    seen.push(third?.tileId)
    cursor.pushChildrenForCurrentTile()

    expect(seen).toEqual(['root-a', 'child-a-0', 'root-b'])
  })

  it('skipChildrenForCurrentTile matches stars_list no-push path', () => {
    const state = buildStarsListTileTraversalState([
      buildTile({ tileId: 'root', level: 0, childTileIds: ['child'], hipsOrder: 0, hipsPix: 2 }),
      buildTile({ tileId: 'child', level: 1, parentTileId: 'root', hipsOrder: 1, hipsPix: 6 }),
      buildTile({ tileId: 'sibling', level: 0, hipsOrder: 0, hipsPix: 9 }),
    ])
    const cursor = new StarsListTraversalCursor(state)
    const seen = []

    const first = cursor.nextTile()
    seen.push(first?.tileId)
    cursor.skipChildrenForCurrentTile()

    const second = cursor.nextTile()
    seen.push(second?.tileId)
    cursor.pushChildrenForCurrentTile()

    expect(seen).toEqual(['root', 'sibling'])
    expect(cursor.nextTile()).toBe(null)
  })
})

describe('module2 stars.c stars_list no-hint traversal loop', () => {
  it('skips tiles with mag_min >= max_mag and does not descend into their children', () => {
    const tiles = [
      buildTile({
        tileId: 'root',
        level: 0,
        hipsOrder: 0,
        hipsPix: 1,
        magMin: 7,
        childTileIds: ['child'],
        stars: [{ id: 'root-star', sourceId: 'HIP 1', raDeg: 0, decDeg: 0, mag: 7.1, tier: 'T1', catalog: 'hipparcos' }],
      }),
      buildTile({
        tileId: 'child',
        level: 1,
        parentTileId: 'root',
        hipsOrder: 1,
        hipsPix: 4,
        stars: [{ id: 'child-star', sourceId: 'HIP 2', raDeg: 0, decDeg: 0, mag: 4.2, tier: 'T1', catalog: 'hipparcos' }],
      }),
      buildTile({
        tileId: 'other-root',
        level: 0,
        hipsOrder: 0,
        hipsPix: 9,
        stars: [{ id: 'other-star', sourceId: 'HIP 3', raDeg: 0, decDeg: 0, mag: 3.5, tier: 'T0', catalog: 'hipparcos' }],
      }),
    ]
    const visited = []
    visitStarsListNoHintTraversal({
      tiles,
      maxMag: 6,
      sourceCatalog: 'hipparcos',
      visit: (star) => {
        visited.push(star.id)
      },
    })
    expect(visited).toEqual(['other-star'])
  })

  it('continues when star vmag exceeds max_mag and still visits later rows in same tile', () => {
    const tiles = [
      buildTile({
        tileId: 'root',
        level: 0,
        hipsOrder: 0,
        hipsPix: 1,
        stars: [
          { id: 'too-faint', sourceId: 'HIP 1', raDeg: 0, decDeg: 0, mag: 9.5, tier: 'T2', catalog: 'hipparcos' },
          { id: 'bright-a', sourceId: 'HIP 2', raDeg: 0, decDeg: 0, mag: 5.2, tier: 'T1', catalog: 'hipparcos' },
          { id: 'bright-b', sourceId: 'HIP 3', raDeg: 0, decDeg: 0, mag: 4.4, tier: 'T1', catalog: 'hipparcos' },
        ],
      }),
    ]
    const visited = []
    visitStarsListNoHintTraversal({
      tiles,
      maxMag: 6,
      sourceCatalog: 'hipparcos',
      visit: (star) => {
        visited.push(star.id)
      },
    })
    expect(visited).toEqual(['bright-a', 'bright-b'])
  })

  it('stops traversal when callback returns true and does not descend children afterward', () => {
    const tiles = [
      buildTile({
        tileId: 'root',
        level: 0,
        hipsOrder: 0,
        hipsPix: 1,
        childTileIds: ['root-child'],
        stars: [
          { id: 'root-hit', sourceId: 'HIP 1', raDeg: 0, decDeg: 0, mag: 2.2, tier: 'T0', catalog: 'hipparcos' },
          { id: 'root-after', sourceId: 'HIP 2', raDeg: 0, decDeg: 0, mag: 3.3, tier: 'T1', catalog: 'hipparcos' },
        ],
      }),
      buildTile({
        tileId: 'root-child',
        level: 1,
        parentTileId: 'root',
        hipsOrder: 1,
        hipsPix: 7,
        stars: [{ id: 'child-star', sourceId: 'HIP 3', raDeg: 0, decDeg: 0, mag: 1.1, tier: 'T0', catalog: 'hipparcos' }],
      }),
      buildTile({
        tileId: 'next-root',
        level: 0,
        hipsOrder: 0,
        hipsPix: 8,
        stars: [{ id: 'next-star', sourceId: 'HIP 4', raDeg: 0, decDeg: 0, mag: 1.4, tier: 'T0', catalog: 'hipparcos' }],
      }),
    ]
    const visited = []
    visitStarsListNoHintTraversal({
      tiles,
      maxMag: 6,
      sourceCatalog: 'hipparcos',
      visit: (star) => {
        visited.push(star.id)
        return star.id === 'root-hit'
      },
    })
    expect(visited).toEqual(['root-hit'])
  })

  it('filters by source catalog in no-hint traversal', () => {
    const tiles = [
      buildTile({
        tileId: 'root',
        level: 0,
        hipsOrder: 0,
        hipsPix: 1,
        stars: [
          { id: 'hip-star', sourceId: 'HIP 1', raDeg: 0, decDeg: 0, mag: 2.2, tier: 'T0', catalog: 'hipparcos' },
          { id: 'gaia-star', sourceId: 'Gaia DR3 1', raDeg: 0, decDeg: 0, mag: 2.1, tier: 'T0', catalog: 'gaia' },
        ],
      }),
    ]
    const visited = []
    visitStarsListNoHintTraversal({
      tiles,
      maxMag: 6,
      sourceCatalog: 'gaia',
      visit: (star) => {
        visited.push(star.id)
      },
    })
    expect(visited).toEqual(['gaia-star'])
  })
})
