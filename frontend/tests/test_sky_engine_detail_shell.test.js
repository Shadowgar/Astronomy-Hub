import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import SkyEngineDetailShell from '../src/features/sky-engine/SkyEngineDetailShell'

function renderDetail(selectedObject) {
  return renderToStaticMarkup(
    React.createElement(SkyEngineDetailShell, {
      selectedObject,
      selectionStatus: selectedObject ? 'active' : 'idle',
      hiddenSelectionName: null,
      onClearSelection: () => {},
    }),
  )
}

describe('SkyEngineDetailShell parity facts', () => {
  it('renders phase and apparent-size facts for ephemeris planets', () => {
    const html = renderDetail({
      id: 'sky-planet-saturn',
      name: 'Saturn',
      type: 'planet',
      altitudeDeg: 24,
      azimuthDeg: 140,
      magnitude: 0.8,
      colorHex: '#e2cf9c',
      summary: 'test',
      description: 'test',
      truthNote: 'test',
      source: 'computed_ephemeris',
      trackingMode: 'fixed_equatorial',
      isAboveHorizon: true,
      apparentSizeDeg: 0.3,
      phaseAngle: 0.52,
      phaseLabel: 'Gibbous',
      illuminationFraction: 0.86,
      ringOpening: 0.42,
    })

    expect(html).toContain('Apparent size: 0.3°')
    expect(html).toContain('Phase angle:')
    expect(html).toContain('Ring opening: 42%')
  })

  it('renders backend satellite detail route when present', () => {
    const html = renderDetail({
      id: 'sat-opal',
      name: 'OPAL',
      type: 'satellite',
      altitudeDeg: 24,
      azimuthDeg: 140,
      magnitude: 99,
      colorHex: '#8ee7ff',
      summary: 'test',
      description: 'test',
      truthNote: 'test',
      source: 'backend_satellite_scene',
      trackingMode: 'static',
      isAboveHorizon: true,
      detailRoute: '/satellites/opal',
    })

    expect(html).toContain('Source detail route: /satellites/opal')
  })
})
