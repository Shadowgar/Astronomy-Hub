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
  manifest_version: 'tier2',
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
    {
      tier: 2,
      tile_id: 'tier2-mid-stars',
      lookup_key: 'sky:tier2:mid-stars',
      source: 'hipparcos_subset',
      object_count: 2,
      magnitude_min: 2.01,
      magnitude_max: 7.21,
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
  {
    id: 'hip-11767',
    type: 'star',
    name: 'HIP 11767',
    engine: 'sky_engine',
    right_ascension: 2.524166,
    declination: 15.345,
    magnitude: 2.01,
    color_index: 0.12,
  },
  {
    id: 'hip-53910',
    type: 'star',
    name: 'HIP 53910',
    engine: 'sky_engine',
    right_ascension: 11.022222,
    declination: -3.12,
    magnitude: 7.21,
    color_index: 0.64,
  },
]

describe('Sky backend tile manifest pipeline', () => {
  it('parses the backend tier 1 manifest contract', () => {
    const manifest = parseBackendSkyStarTileManifestPayload(BACKEND_MANIFEST_PAYLOAD)

    expect(manifest).toBeTruthy()
    expect(manifest?.manifest_version).toBe('tier2')
    expect(manifest?.tiles).toHaveLength(2)
    expect(manifest?.tiles[0]?.lookup_key).toBe('sky:tier1:tier1-bright-stars')
    expect(manifest?.tiles[1]?.lookup_key).toBe('sky:tier2:mid-stars')
  })

  it('resolves both manifest tiles and returns a magnitude-sorted merged backend dataset', () => {
    const manifest = parseBackendSkyStarTileManifestPayload(BACKEND_MANIFEST_PAYLOAD)
    const manifestState = createSkyBackendTileManifestState(manifest)
    const registry = resolveSkyBackendTileRegistry(manifestState, BACKEND_SCENE_STARS)
    const resolvedStars = flattenResolvedSkyBackendTileRegistry(registry)

    expect(manifestState.tier).toBe(1)
    expect(manifestState.tiles).toHaveLength(2)
    expect(registry.tiles).toHaveLength(2)
    expect(registry.tiles[0]?.resolvedObjectCount).toBe(2)
    expect(registry.tiles[1]?.resolvedObjectCount).toBe(2)
    expect(registry.totalResolvedStars).toBe(4)
    expect(registry.tilesByLookupKey.get('sky:tier1:tier1-bright-stars')).toHaveLength(2)
    expect(registry.tilesByLookupKey.get('sky:tier2:mid-stars')).toHaveLength(2)
    expect(resolvedStars.map((star) => star.id)).toEqual(['star-sirius', 'star-vega', 'hip-11767', 'hip-53910'])
  })
})