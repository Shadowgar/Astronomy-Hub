import { describe, expect, it } from 'vitest'

import {
  buildAtmosphericExtinctionContext,
  computeAirmassFromAltitude,
  computeAtmosphericTransmission,
  computeObservedMagnitude,
} from '../src/features/sky-engine/atmosphericExtinction'

const TEST_OBSERVER = {
  label: 'Test Observer',
  latitude: 40.7128,
  longitude: -74.006,
  elevationFt: 33,
}

describe('atmospheric extinction', () => {
  it('keeps zenith airmass close to one', () => {
    expect(computeAirmassFromAltitude(90)).toBeCloseTo(1, 4)
  })

  it('increases sharply toward the horizon', () => {
    expect(computeAirmassFromAltitude(5)).toBeGreaterThan(computeAirmassFromAltitude(45))
    expect(computeAirmassFromAltitude(45)).toBeGreaterThan(computeAirmassFromAltitude(90))
  })

  it('computes a positive Stellarium-style extinction coefficient', () => {
    const extinction = buildAtmosphericExtinctionContext(TEST_OBSERVER, '2025-01-15T03:00:00Z')

    expect(extinction.extinctionCoefficient).toBeGreaterThan(0)
    expect(extinction.extinctionCoefficient).toBeLessThan(1)
  })

  it('reduces transmission toward the horizon', () => {
    const extinction = buildAtmosphericExtinctionContext(TEST_OBSERVER, '2025-01-15T03:00:00Z')
    const zenithTransmission = computeAtmosphericTransmission(extinction, 90)
    const midSkyTransmission = computeAtmosphericTransmission(extinction, 30)
    const horizonTransmission = computeAtmosphericTransmission(extinction, 5)

    expect(zenithTransmission).toBeGreaterThan(midSkyTransmission)
    expect(midSkyTransmission).toBeGreaterThan(horizonTransmission)
    expect(horizonTransmission).toBeGreaterThan(0)
  })

  it('dims observed magnitude toward the horizon', () => {
    const extinction = buildAtmosphericExtinctionContext(TEST_OBSERVER, '2025-01-15T03:00:00Z')
    const intrinsicMagnitude = 2
    const zenithMagnitude = computeObservedMagnitude(intrinsicMagnitude, extinction, 90)
    const horizonMagnitude = computeObservedMagnitude(intrinsicMagnitude, extinction, 5)

    expect(horizonMagnitude).toBeGreaterThan(zenithMagnitude)
    expect(zenithMagnitude).toBeGreaterThan(intrinsicMagnitude)
  })
})