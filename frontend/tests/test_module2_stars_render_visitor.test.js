import { describe, expect, it } from 'vitest'

import { visitStarsRenderTiles } from '../src/features/sky-engine/engine/sky/runtime/starsRenderVisitor.ts'

function buildPacket(overrides = {}) {
  return {
    stars: [
      { id: 'root-bright', x: 1, y: 0, z: 0, mag: 2, tier: 'bright' },
      { id: 'root-faint', x: 0, y: 1, z: 0, mag: 8, tier: 'faint' },
      { id: 'child-one', x: 0, y: 0, z: 1, mag: 3, tier: 'bright' },
      { id: 'child-two', x: -1, y: 0, z: 0, mag: 4.5, tier: 'medium' },
      { id: 'sibling', x: 0, y: -1, z: 0, mag: 1.2, tier: 'bright' },
    ],
    starTiles: [
      {
        tileId: 'root-a',
        level: 0,
        parentTileId: null,
        childTileIds: ['root-a-nw', 'root-a-ne'],
        magMin: 1,
        magMax: 9,
        starIds: ['root-bright', 'root-faint'],
      },
      {
        tileId: 'root-a-nw',
        level: 1,
        parentTileId: 'root-a',
        childTileIds: [],
        magMin: 3,
        magMax: 4,
        starIds: ['child-one'],
      },
      {
        tileId: 'root-a-ne',
        level: 1,
        parentTileId: 'root-a',
        childTileIds: [],
        magMin: 4.5,
        magMax: 5,
        starIds: ['child-two'],
      },
      {
        tileId: 'root-b',
        level: 0,
        parentTileId: null,
        childTileIds: [],
        magMin: 1,
        magMax: 2,
        starIds: ['sibling'],
      },
    ],
    diagnostics: {
      dataMode: 'hipparcos',
      sourceLabel: 'test',
      limitingMagnitude: 8,
      activeTiles: 4,
      visibleStars: 5,
      starsListVisitCount: 0,
      activeTiers: ['bright'],
      tileLevels: [0, 1],
      tilesPerLevel: { '0': 2, '1': 2 },
      maxTileDepthReached: 1,
      visibleTileIds: ['root-a', 'root-a-nw', 'root-a-ne', 'root-b'],
    },
    labels: [],
    ...overrides,
  }
}

describe('module2 stars.c render_visitor traversal', () => {
  it('uses fmin(stars_limit_mag, hard_limit_mag) and breaks tile star loops at first overflow', () => {
    const entries = visitStarsRenderTiles({
      scenePacket: buildPacket(),
      starsLimitMagnitude: 7.5,
      hardLimitMagnitude: 4,
      projectStar: (star) => ({
        planeX: star.x,
        planeY: star.y,
        screenX: star.x,
        screenY: star.y,
        depth: 0.5,
        angularDistanceRad: 0.1,
      }),
      isPointClipped: () => false,
    })

    // stars.c::render_visitor (line 658): limit_mag = fmin(stars_limit_mag, hard_limit_mag).
    expect(entries.map((entry) => entry.star.id)).toEqual(['root-bright', 'child-one', 'sibling'])
    // stars.c::render_visitor (lines 675-677): stop the tile loop at first `s->vmag > limit_mag`.
    expect(entries.some((entry) => entry.star.id === 'root-faint')).toBe(false)
  })

  it('keeps native tile traversal order and descends only when tile.mag_max > limit_mag', () => {
    const visitedTileOrder = []
    const entries = visitStarsRenderTiles({
      scenePacket: buildPacket({
        starTiles: [
          {
            tileId: 'root-a',
            level: 0,
            parentTileId: null,
            childTileIds: ['root-a-nw', 'root-a-ne'],
            magMin: 1,
            magMax: 3.2,
            starIds: ['root-bright'],
          },
          {
            tileId: 'root-a-nw',
            level: 1,
            parentTileId: 'root-a',
            childTileIds: [],
            magMin: 3,
            magMax: 4,
            starIds: ['child-one'],
          },
          {
            tileId: 'root-a-ne',
            level: 1,
            parentTileId: 'root-a',
            childTileIds: [],
            magMin: 4.5,
            magMax: 5,
            starIds: ['child-two'],
          },
          {
            tileId: 'root-b',
            level: 0,
            parentTileId: null,
            childTileIds: [],
            magMin: 1,
            magMax: 2,
            starIds: ['sibling'],
          },
        ],
      }),
      starsLimitMagnitude: 3.2,
      hardLimitMagnitude: 9,
      projectStar: (star) => ({
        planeX: star.x,
        planeY: star.y,
        screenX: star.x,
        screenY: star.y,
        depth: 0.5,
        angularDistanceRad: 0.1,
      }),
      isPointClipped: () => false,
      isTileClipped: (tile) => {
        visitedTileOrder.push(tile.tileId)
        return false
      },
    })

    // stars.c::stars_render (lines 736-741): iterator visits parents first and only pushes children when visitor returns `1`.
    expect(visitedTileOrder).toEqual(['root-a', 'root-b'])
    // stars.c::render_visitor (lines 714-716): `return 1` only when `tile->mag_max > limit_mag`.
    expect(entries.map((entry) => entry.star.id)).toEqual(['root-bright', 'sibling'])
  })

  it('applies per-tile mag_min gate and point-clipped skip before enqueueing stars', () => {
    const entries = visitStarsRenderTiles({
      scenePacket: buildPacket({
        starTiles: [
          {
            tileId: 'root-a',
            level: 0,
            parentTileId: null,
            childTileIds: [],
            magMin: 9.1,
            magMax: 9.6,
            starIds: ['root-faint'],
          },
          {
            tileId: 'root-b',
            level: 0,
            parentTileId: null,
            childTileIds: [],
            magMin: 1,
            magMax: 2,
            starIds: ['sibling'],
          },
        ],
        diagnostics: {
          ...buildPacket().diagnostics,
          visibleTileIds: ['root-a', 'root-b'],
        },
      }),
      starsLimitMagnitude: 8,
      hardLimitMagnitude: 8,
      projectStar: (star) => ({
        planeX: star.x,
        planeY: star.y,
        screenX: star.x,
        screenY: star.y,
        depth: 0.5,
        angularDistanceRad: 0.1,
      }),
      isPointClipped: (projected) => projected.screenY < 0,
    })

    // stars.c::render_visitor (lines 671-672): skip whole tile when `tile->mag_min > limit_mag`.
    expect(entries.some((entry) => entry.tileId === 'root-a')).toBe(false)
    // stars.c::render_visitor + painter clip behavior: skip projected points that are clipped.
    expect(entries.some((entry) => entry.star.id === 'sibling')).toBe(false)
  })
})
