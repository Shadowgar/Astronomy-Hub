import { describe, expect, it } from 'vitest'

import {
  createSkyBackendTileManifestState,
  flattenResolvedSkyBackendTileRegistry,
  resolveSkyBackendTileRegistry,
} from '../src/features/sky-engine/backendTileRegistry'
import { parseBackendSkyStarTileManifestPayload } from '../src/features/scene/contracts'

const BACKEND_MANIFEST_PAYLOAD = {
  scope: 'sky',
  engine: 'sky_engine',
  manifest_version: 'tier1',
  generated_at: '2026-04-07T05:00:00Z',
  tiles: [
    {
      tier: 1,
      tile_id: 'tier1-bright-stars',
      lookup_key: 'sky:tier1:tier1-bright-stars',
      source: 'bright_star_catalog',
      object_count: 2,
      magnitude_min: -1.46,
      magnitude_max: 0.03,
    },
  ],
  degraded: false,
  missing_sources: [],
}

const BACKEND_SCENE_STARS = [
  {
    id: 'star-sirius',
    type: 'star',
    name: 'Sirius',
    engine: 'sky_engine',
    right_ascension: 6.7525,
    declination: -16.7161,
    magnitude: -1.46,
    color_index: 0,
  },
  {
    id: 'star-vega',
    type: 'star',
    name: 'Vega',
    engine: 'sky_engine',
    right_ascension: 18.6156,
    declination: 38.7837,
    magnitude: 0.03,
    color_index: 0,
  },
]

describe('Sky backend tile manifest pipeline', () => {
  it('parses the backend tier 1 manifest contract', () => {
    const manifest = parseBackendSkyStarTileManifestPayload(BACKEND_MANIFEST_PAYLOAD)

    expect(manifest).toBeTruthy()
    expect(manifest?.manifest_version).toBe('tier1')
    expect(manifest?.tiles).toHaveLength(1)
    expect(manifest?.tiles[0]?.lookup_key).toBe('sky:tier1:tier1-bright-stars')
  })

  it('resolves manifest tiles to the backend bright-star dataset through the tile registry', () => {
    const manifest = parseBackendSkyStarTileManifestPayload(BACKEND_MANIFEST_PAYLOAD)
    const manifestState = createSkyBackendTileManifestState(manifest)
    const registry = resolveSkyBackendTileRegistry(manifestState, BACKEND_SCENE_STARS)
    const resolvedStars = flattenResolvedSkyBackendTileRegistry(registry)

    expect(manifestState.tier).toBe(1)
    expect(manifestState.tiles).toHaveLength(1)
    expect(registry.tiles).toHaveLength(1)
    expect(registry.tiles[0]?.resolvedObjectCount).toBe(2)
    expect(registry.totalResolvedStars).toBe(2)
    expect(registry.tilesByLookupKey.get('sky:tier1:tier1-bright-stars')).toHaveLength(2)
    expect(resolvedStars.map((star) => star.id)).toEqual(['star-sirius', 'star-vega'])
  })
})