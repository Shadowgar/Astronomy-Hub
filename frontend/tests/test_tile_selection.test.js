import { describe, expect, it } from 'vitest'

import {
  getSkyTileDescriptor,
  resolveLimitingMagnitude,
  selectVisibleTileIds,
} from '../src/features/sky-engine/engine/sky'

const BASE_OBSERVER = {
  timestampUtc: '2026-07-15T02:00:00.000Z',
  latitudeDeg: 44,
  longitudeDeg: -123,
  elevationM: 120,
  centerAltDeg: 28,
  centerAzDeg: 96,
  projection: 'stereographic',
}

describe('selectVisibleTileIds (module1 tile traversal, G3)', () => {
  it('stays at depth 1 for wide FOV with the same limiting-magnitude policy as buildSkyEngineQuery', () => {
    const observer = { ...BASE_OBSERVER, fovDeg: 100 }
    const limitingMagnitude = resolveLimitingMagnitude(100)
    const ids = selectVisibleTileIds(observer, limitingMagnitude, 3)

    expect(ids.length).toBeGreaterThan(0)
    expect(ids.every((tileId) => getSkyTileDescriptor(tileId, 3)?.level === 1)).toBe(true)
  })

  it('reaches depth 3 for telescopic FOV with the same limiting policy', () => {
    const observer = { ...BASE_OBSERVER, fovDeg: 4 }
    const limitingMagnitude = resolveLimitingMagnitude(4)
    const ids = selectVisibleTileIds(observer, limitingMagnitude, 3)

    expect(ids.some((tileId) => getSkyTileDescriptor(tileId, 3)?.level === 3)).toBe(true)
  })

  it('caps traversal when maxTileLevel is reduced', () => {
    const observer = { ...BASE_OBSERVER, fovDeg: 4 }
    const limitingMagnitude = resolveLimitingMagnitude(4)
    const ids = selectVisibleTileIds(observer, limitingMagnitude, 1)

    expect(ids.length).toBeGreaterThan(0)
    expect(ids.every((tileId) => (getSkyTileDescriptor(tileId, 1)?.level ?? -1) <= 1)).toBe(true)
  })
})
