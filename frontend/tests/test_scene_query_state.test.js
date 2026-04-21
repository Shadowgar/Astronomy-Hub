import { describe, expect, it } from 'vitest'

import {
  HIPPARCOS_QUERY_LIMITING_MAGNITUDE_MAX,
  buildRuntimeTileQuerySignature,
  resolveRepositoryQueryLimitingMagnitude,
  resolveScenePacketForQuery,
} from '../src/features/sky-engine/sceneQueryState'

const BASE_QUERY = {
  observer: {
    timestampUtc: '2026-04-13T09:00:00.000Z',
    latitudeDeg: 41.321903,
    longitudeDeg: -79.585394,
    elevationM: 432.816,
    fovDeg: 5,
    centerAltDeg: 72.8,
    centerAzDeg: 91.2,
    projection: 'stereographic',
  },
  limitingMagnitude: 8.5,
  activeTiers: ['T0', 'T1', 'T2'],
  visibleTileIds: ['root-ne-ne-ne'],
  maxTileLevel: 3,
}

const PREVIOUS_SCENE_PACKET = {
  stars: [{ id: 'previous-star', x: 0, y: 0, z: 1, mag: 1, colorIndex: 0, label: 'Prev', tier: 'T0' }],
  labels: [],
  diagnostics: {},
}

describe('scene query state', () => {
  it('does not churn tile signature for small limiting-magnitude drift', () => {
    const low = buildRuntimeTileQuerySignature(
      { ...BASE_QUERY, limitingMagnitude: 8.51 },
      'multi-survey',
    )
    const high = buildRuntimeTileQuerySignature(
      { ...BASE_QUERY, limitingMagnitude: 8.93 },
      'multi-survey',
    )
    expect(low).toBe(high)
  })

  it('switches tile signature when crossing Gaia activation threshold', () => {
    const hipOnly = buildRuntimeTileQuerySignature(
      { ...BASE_QUERY, limitingMagnitude: 8.49 },
      'multi-survey',
    )
    const gaiaActive = buildRuntimeTileQuerySignature(
      { ...BASE_QUERY, limitingMagnitude: 8.5 },
      'multi-survey',
    )
    expect(hipOnly).not.toBe(gaiaActive)
  })

  it('changes tile signature when hipsViewport projection scale or height changes (G5 tile reload)', () => {
    const base = buildRuntimeTileQuerySignature(BASE_QUERY, 'hipparcos')
    const taller = buildRuntimeTileQuerySignature(
      {
        ...BASE_QUERY,
        hipsViewport: { windowHeightPx: 1080, projectionMat11: 1.2 },
      },
      'hipparcos',
    )
    const sharper = buildRuntimeTileQuerySignature(
      {
        ...BASE_QUERY,
        hipsViewport: { windowHeightPx: 1080, projectionMat11: 2.4 },
      },
      'hipparcos',
    )
    expect(taller).not.toBe(base)
    expect(sharper).not.toBe(taller)
  })

  it('caps Hipparcos runtime queries at the Hipparcos catalog ceiling', () => {
    expect(resolveRepositoryQueryLimitingMagnitude('hipparcos', 11.4)).toBe(HIPPARCOS_QUERY_LIMITING_MAGNITUDE_MAX)
    expect(resolveRepositoryQueryLimitingMagnitude('mock', 11.4)).toBe(11.4)
    expect(resolveRepositoryQueryLimitingMagnitude('multi-survey', 11.4)).toBe(11.4)
  })

  it('keeps the previous scene packet while a deeper tile query is still unresolved', () => {
    const result = resolveScenePacketForQuery({
      query: BASE_QUERY,
      repositoryMode: 'hipparcos',
      runtimeTiles: [],
      tileLoadResult: {
        mode: 'hipparcos',
        sourceLabel: 'Hipparcos',
        tiles: [],
      },
      resolvedTileQuerySignature: 'hipparcos:hipparcos:3:T0,T1:root-ne',
      previousScenePacket: PREVIOUS_SCENE_PACKET,
    })

    expect(result.hasResolvedTilesForQuery).toBe(false)
    expect(result.scenePacket).toBe(PREVIOUS_SCENE_PACKET)
    expect(result.tileQuerySignature).toBe(buildRuntimeTileQuerySignature(BASE_QUERY, 'hipparcos'))
  })

  it('does not reuse multi-survey tile payloads when the tile query signature is out of sync', () => {
    const result = resolveScenePacketForQuery({
      query: { ...BASE_QUERY, visibleTileIds: ['root-ne-ne-sw'] },
      repositoryMode: 'multi-survey',
      runtimeTiles: [],
      tileLoadResult: {
        mode: 'multi-survey',
        sourceLabel: 'Multi',
        sourceError: null,
        tiles: [],
      },
      resolvedTileQuerySignature: 'stale-signature-not-matching',
      previousScenePacket: PREVIOUS_SCENE_PACKET,
    })

    expect(result.hasResolvedTilesForQuery).toBe(false)
    expect(result.scenePacket).toBe(PREVIOUS_SCENE_PACKET)
  })

  it('assembles a fresh packet once matching tiles have been loaded for the query', () => {
    const query = {
      ...BASE_QUERY,
      limitingMagnitude: 6.5,
      visibleTileIds: ['root-ne-ne'],
      activeTiers: ['T0', 'T1'],
    }
    const runtimeTiles = [{
      tileId: 'root-ne-ne',
      level: 2,
      parentTileId: 'root-ne',
      childTileIds: [],
      bounds: {
        raMinDeg: 270,
        raMaxDeg: 315,
        decMinDeg: 22.5,
        decMaxDeg: 45,
      },
      magMin: 0.03,
      magMax: 0.03,
      starCount: 1,
      stars: [{
        id: 'hip-91262',
        sourceId: 'HIP 91262',
        raDeg: 279.23473479,
        decDeg: 38.78368896,
        mag: 0.03,
        colorIndex: 0,
        tier: 'T0',
        properName: 'Vega',
        catalog: 'hipparcos',
      }],
      labelCandidates: [{ starId: 'hip-91262', label: 'Vega', priority: 200 }],
      provenance: {
        catalog: 'hipparcos',
        sourcePath: 'test',
      },
    }]
    const resolvedSignature = buildRuntimeTileQuerySignature(query, 'hipparcos')

    const result = resolveScenePacketForQuery({
      query,
      repositoryMode: 'hipparcos',
      runtimeTiles,
      tileLoadResult: {
        mode: 'hipparcos',
        sourceLabel: 'Hipparcos',
        tiles: runtimeTiles,
      },
      resolvedTileQuerySignature: resolvedSignature,
      previousScenePacket: PREVIOUS_SCENE_PACKET,
    })

    expect(result.hasResolvedTilesForQuery).toBe(true)
    expect(result.scenePacket?.stars).toHaveLength(1)
    expect(result.scenePacket?.stars[0]?.id).toBe('hip-91262')
  })
})