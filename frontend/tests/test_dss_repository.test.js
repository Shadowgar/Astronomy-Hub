import { beforeEach, describe, expect, it, vi } from 'vitest'

import { loadDssManifest, loadDssPatches } from '../src/features/sky-engine/engine/sky/adapters/dssRepository'

describe('DSS repository manifest loader', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('loads and validates DSS manifest patches', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        source: 'dss',
        generated_at: '2026-04-17T00:00:00Z',
        surveys: [{
          id: 'dss-colored',
          title: 'Digitized Sky Survey Colored',
          frame: 'icrs',
          tileFormat: 'jpg',
          visibleByDefault: true,
        }],
        patches: [{
          id: 'dss-1',
          name: 'Patch 1',
          rightAscensionHours: 10.5,
          declinationDeg: -20.1,
          radiusDeg: 4.2,
          intensity: 0.6,
        }],
      }),
    })

    const patches = await loadDssPatches()
    const manifest = await loadDssManifest()
    expect(patches).toHaveLength(1)
    expect(patches[0].id).toBe('dss-1')
    expect(manifest.surveys[0].id).toBe('dss-colored')
  })
})
