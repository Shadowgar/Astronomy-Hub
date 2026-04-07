import { describe, expect, it } from 'vitest'

import {
  assembleSkyScenePacket,
  buildSkyEngineQuery,
  getSkyTileDescriptor,
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

  it('keeps near-horizon stars in the scene packet but avoids raw catalog id labels', () => {
    const query = {
      observer: {
        ...BASE_OBSERVER,
        fovDeg: 30,
      },
      limitingMagnitude: 10,
      activeTiers: ['T0', 'T1'],
      visibleTileIds: ['root-ne'],
    }
    const tiles = [{
      tileId: 'root-ne',
      level: 1,
      stars: [{
        id: 'test-near-horizon',
        sourceId: 'HIP 99999',
        raDeg: 269.15,
        decDeg: 4.7,
        mag: 1.1,
        tier: 'T0',
      }],
      labelCandidates: [],
    }]

    const scenePacket = assembleSkyScenePacket(query, tiles)

    expect(scenePacket.stars.some((star) => star.id === 'test-near-horizon')).toBe(true)
    expect(scenePacket.labels.some((label) => label.text === 'HIP 99999')).toBe(false)
  })
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
    expect(wideQuery.visibleTileIds.every((tileId) => getSkyTileDescriptor(tileId)?.level === 1)).toBe(true)
    expect(closeQuery.visibleTileIds.some((tileId) => getSkyTileDescriptor(tileId)?.level === 3)).toBe(true)
  })

  it('assembles a deduped scene packet from the mocked tiles', async () => {
    const query = {
      observer: {
        ...BASE_OBSERVER,
        fovDeg: 3,
      },
      limitingMagnitude: 13.5,
      activeTiers: ['T0', 'T1', 'T2', 'T3'],
      visibleTileIds: ['root-ne-se-nw-nw'],
    }
    const tileResult = await mockSkyTileRepository.loadTiles(query)
    const scenePacket = assembleSkyScenePacket(query, tileResult.tiles, tileResult)
    const starIds = scenePacket.stars.map((star) => star.id)

    expect(new Set(starIds).size).toBe(starIds.length)
    expect(scenePacket.stars.length).toBeGreaterThan(0)
    expect(scenePacket.labels.some((label) => label.text === 'Vega')).toBe(true)
    expect(scenePacket.diagnostics.activeTiles).toBe(tileResult.tiles.length)
    expect(scenePacket.diagnostics.activeTiers).toEqual(['T0', 'T1', 'T2', 'T3'])
    expect(scenePacket.diagnostics.tileLevels).toContain(3)
    expect(scenePacket.diagnostics.maxTileDepthReached).toBe(3)
    expect(scenePacket.diagnostics.tilesPerLevel['3']).toBeGreaterThan(0)
    expect(scenePacket.diagnostics.dataMode).toBe('mock')
  })

  it('increases star density when deeper tiles are selected', async () => {
    const wideQuery = buildSkyEngineQuery({
      ...BASE_OBSERVER,
      fovDeg: 120,
    })
    const closeQuery = buildSkyEngineQuery({
      ...BASE_OBSERVER,
      fovDeg: 4,
    })
    const wideTileResult = await mockSkyTileRepository.loadTiles(wideQuery)
    const closeTileResult = await mockSkyTileRepository.loadTiles(closeQuery)
    const widePacket = assembleSkyScenePacket(wideQuery, wideTileResult.tiles, wideTileResult)
    const closePacket = assembleSkyScenePacket(closeQuery, closeTileResult.tiles, closeTileResult)

    expect(closePacket.diagnostics.maxTileDepthReached).toBeGreaterThan(widePacket.diagnostics.maxTileDepthReached)
    expect(closePacket.stars.length).toBeGreaterThan(widePacket.stars.length)
  })
})