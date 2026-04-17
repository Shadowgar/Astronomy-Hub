import { describe, expect, it } from 'vitest'

import { prepareDirectOverlayFrame } from '../src/features/sky-engine/directOverlayLayer'

function createProjectedObject(overrides = {}) {
  return {
    object: {
      id: 'obj-1',
      name: 'Obj',
      type: 'planet',
      source: 'computed_ephemeris',
      magnitude: 2.5,
      altitudeDeg: 35,
      azimuthDeg: 140,
      colorHex: '#ffffff',
      summary: 'test',
      description: 'test',
      truthNote: 'test',
      trackingMode: 'fixed_equatorial',
      isAboveHorizon: true,
      ...overrides.object,
    },
    screenX: 400,
    screenY: 240,
    depth: 0.2,
    markerRadiusPx: 8,
    ...overrides,
  }
}

describe('overlay hints limiting-magnitude gating', () => {
  it('filters non-selected labels above hints limit magnitude', () => {
    const bright = createProjectedObject({
      object: { id: 'bright', magnitude: 2.2, name: 'Bright' },
    })
    const dim = createProjectedObject({
      object: { id: 'dim', magnitude: 8.4, name: 'Dim' },
      screenX: 420,
    })

    const frame = prepareDirectOverlayFrame(
      {
        centerDirection: { x: 0, y: 0, z: 1 },
        fovRadians: 1,
        viewportWidth: 800,
        viewportHeight: 400,
        projectionMode: 'stereographic',
      },
      {
        label: 'obs',
        latitude: 40,
        longitude: -79,
        elevationFt: 1200,
      },
      '2026-04-17T00:00:00.000Z',
      [bright, dim],
      null,
      null,
      {
        constellations: false,
        azimuthRing: false,
        altitudeRings: false,
      },
      'western',
      6.0,
    )

    const labelIds = frame.labels.map((label) => label.id)
    expect(labelIds).toContain('bright')
    expect(labelIds).not.toContain('dim')
  })

  it('keeps selected object label even above hints limit magnitude', () => {
    const selectedDim = createProjectedObject({
      object: { id: 'selected-dim', magnitude: 8.8, name: 'Selected Dim' },
    })

    const frame = prepareDirectOverlayFrame(
      {
        centerDirection: { x: 0, y: 0, z: 1 },
        fovRadians: 1,
        viewportWidth: 800,
        viewportHeight: 400,
        projectionMode: 'stereographic',
      },
      {
        label: 'obs',
        latitude: 40,
        longitude: -79,
        elevationFt: 1200,
      },
      '2026-04-17T00:00:00.000Z',
      [selectedDim],
      null,
      'selected-dim',
      {
        constellations: false,
        azimuthRing: false,
        altitudeRings: false,
      },
      'western',
      6.0,
    )

    expect(frame.labels.map((label) => label.id)).toContain('selected-dim')
  })
})
