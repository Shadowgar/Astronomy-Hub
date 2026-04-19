import { describe, expect, it } from 'vitest'

import { getStarRenderProfile } from '../src/features/sky-engine/starRenderer.ts'

const NIGHT_CALIBRATION = {
  phaseLabel: 'Night',
  directionalLightIntensity: 0,
  ambientLightIntensity: 0,
  directionalLightColorHex: '#ffffff',
  ambientLightColorHex: '#ffffff',
  backgroundColorHex: '#000000',
  skyZenithColorHex: '#000000',
  skyHorizonColorHex: '#000000',
  twilightBandColorHex: '#000000',
  horizonColorHex: '#000000',
  horizonGlowColorHex: '#000000',
  horizonGlowAlpha: 0,
  landscapeFogColorHex: '#000000',
  groundTintHex: '#000000',
  landscapeShadowAlpha: 0,
  starVisibility: 1,
  starFieldBrightness: 0.92,
  starLabelVisibility: 1,
  starHaloVisibility: 1,
  starTwinkleAmplitude: 0.08,
  atmosphereExposure: 1,
  atmosphereAerialPerspectiveIntensity: 0,
  atmosphereMultiScatteringIntensity: 0,
  atmosphereMieScatteringScale: 0,
}

function createStar(magnitude) {
  return {
    id: `star-${magnitude}`,
    name: `Star ${magnitude}`,
    type: 'star',
    altitudeDeg: 45,
    azimuthDeg: 120,
    magnitude,
    colorHex: '#ffffff',
    summary: 'test star',
    description: 'test star',
    truthNote: 'test',
    source: 'backend_star_catalog',
    trackingMode: 'fixed_equatorial',
    rightAscensionHours: 1,
    declinationDeg: 1,
    colorIndexBV: 0.6,
    timestampIso: '2026-04-07T00:00:00Z',
    isAboveHorizon: true,
  }
}

describe('star magnitude visual scaling', () => {
  it('makes bright stars larger and brighter than dim stars', () => {
    const bright = getStarRenderProfile(createStar(0.2), NIGHT_CALIBRATION)
    const medium = getStarRenderProfile(createStar(3.4), NIGHT_CALIBRATION)
    const dim = getStarRenderProfile(createStar(7.1), NIGHT_CALIBRATION)

    expect(bright.diameter).toBeGreaterThan(medium.diameter)
    expect(medium.diameter).toBeGreaterThan(dim.diameter)
    expect(bright.coreRadiusPx).toBeGreaterThan(medium.coreRadiusPx)
    expect(medium.coreRadiusPx).toBeGreaterThan(dim.coreRadiusPx)
    expect(bright.alpha).toBeGreaterThanOrEqual(medium.alpha)
    expect(medium.alpha).toBeGreaterThan(dim.alpha)
  })

  it('keeps faint stars visible with a non-zero floor', () => {
    /** Magnitude where `coreGetPointForMagnitude` still reports visible luminance (see `stellariumVisualMath`). */
    const faint = getStarRenderProfile(createStar(6.2), NIGHT_CALIBRATION)

    expect(faint.diameter).toBeGreaterThanOrEqual(0.1)
    expect(faint.coreRadiusPx).toBeGreaterThanOrEqual(0.52)
    expect(faint.alpha).toBeGreaterThanOrEqual(0.04)
    expect(faint.haloAlpha).toBeGreaterThanOrEqual(0.012)
  })
})
