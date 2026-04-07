import { describe, expect, it } from 'vitest'

import {
  assembleSkyScenePacket,
  buildSkyEngineQuery,
  mockSkyTileRepository,
  resolveLimitingMagnitude,
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

describe('sky engine runtime slice', () => {
  it('maps field of view to the starter limiting magnitude law', () => {
    expect(resolveLimitingMagnitude(120)).toBe(5.5)
    expect(resolveLimitingMagnitude(90)).toBe(6.2)
    expect(resolveLimitingMagnitude(30)).toBe(8.5)
    expect(resolveLimitingMagnitude(2.5)).toBe(13.5)
  })

  it('activates deeper tiers as the observer narrows the field', () => {
    const wideQuery = buildSkyEngineQuery({
      ...BASE_OBSERVER,
      fovDeg: 100,
    })
    const closeQuery = buildSkyEngineQuery({
      ...BASE_OBSERVER,
      fovDeg: 4,
    })

    expect(wideQuery.activeTiers).toEqual(['T0', 'T1'])
    expect(closeQuery.activeTiers).toEqual(['T0', 'T1', 'T2', 'T3'])
    expect(closeQuery.visibleTileIds).toContain('tile-east-detail')
  })

  it('assembles a deduped scene packet from the mocked tiles', () => {
    const query = buildSkyEngineQuery({
      ...BASE_OBSERVER,
      fovDeg: 3,
    })
    const tiles = mockSkyTileRepository.loadTiles(query)
    const scenePacket = assembleSkyScenePacket(query, tiles)
    const starIds = scenePacket.stars.map((star) => star.id)

    expect(new Set(starIds).size).toBe(starIds.length)
    expect(starIds).toContain('star-vega')
    expect(scenePacket.labels.some((label) => label.text === 'Vega')).toBe(true)
    expect(scenePacket.diagnostics.activeTiles).toBe(tiles.length)
    expect(scenePacket.diagnostics.activeTiers).toEqual(['T0', 'T1', 'T2', 'T3'])
  })
})