import { describe, expect, it } from 'vitest'

import { resolveSkyEnginePickSelection } from '../src/features/sky-engine/pickTargets'

function entry(overrides = {}) {
  return {
    object: {
      id: 'obj',
      name: 'Object',
      type: 'star',
      source: 'engine_catalog_tile',
      altitudeDeg: 35,
      azimuthDeg: 120,
      magnitude: 2,
      colorHex: '#ffffff',
      summary: 'test',
      description: 'test',
      truthNote: 'test',
      trackingMode: 'fixed_equatorial',
      isAboveHorizon: true,
      ...overrides.object,
    },
    screenX: 100,
    screenY: 100,
    radiusPx: 12,
    depth: 0.2,
    ...overrides,
  }
}

describe('pointer selection parity', () => {
  it('chooses nearest hit target without object-type priority bias', () => {
    const planet = entry({
      object: { id: 'planet', name: 'Planet', type: 'planet', source: 'computed_ephemeris' },
      screenX: 120,
      screenY: 100,
      radiusPx: 24,
    })
    const star = entry({
      object: { id: 'star', name: 'Star', type: 'star', source: 'engine_catalog_tile' },
      screenX: 112,
      screenY: 100,
      radiusPx: 10,
    })

    const picked = resolveSkyEnginePickSelection([planet, star], 111, 100)
    expect(picked).toBe('star')
  })

  it('falls back to depth only when distance tie is effectively equal', () => {
    const nearDepth = entry({
      object: { id: 'a', name: 'A', type: 'deep_sky', source: 'computed_real_sky' },
      screenX: 100,
      screenY: 100,
      radiusPx: 20,
      depth: 0.4,
    })
    const farDepth = entry({
      object: { id: 'b', name: 'B', type: 'deep_sky', source: 'computed_real_sky' },
      screenX: 100.2,
      screenY: 100.2,
      radiusPx: 20,
      depth: 0.1,
    })

    const picked = resolveSkyEnginePickSelection([nearDepth, farDepth], 100.1, 100.1)
    expect(picked).toBe('b')
  })
})
