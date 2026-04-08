import { describe, expect, it } from 'vitest'

import { computeNightSkyLuminance } from '../src/features/sky-engine/nightSkyBackground'

const DEGREE = Math.PI / 180

describe('night sky background luminance', () => {
  it('keeps the night sky above pure black', () => {
    expect(computeNightSkyLuminance(90 * DEGREE, -25 * DEGREE)).toBeGreaterThan(0)
  })

  it('keeps the horizon brighter than the zenith at night', () => {
    const horizon = computeNightSkyLuminance(0, -25 * DEGREE)
    const zenith = computeNightSkyLuminance(90 * DEGREE, -25 * DEGREE)

    expect(horizon).toBeGreaterThan(zenith)
  })

  it('smoothly increases toward twilight', () => {
    const deepNight = computeNightSkyLuminance(30 * DEGREE, -25 * DEGREE)
    const astronomicalTwilight = computeNightSkyLuminance(30 * DEGREE, -15 * DEGREE)
    const civilTwilight = computeNightSkyLuminance(30 * DEGREE, -4 * DEGREE)

    expect(astronomicalTwilight).toBeGreaterThan(deepNight)
    expect(civilTwilight).toBeGreaterThan(astronomicalTwilight)
  })

  it('is negligible during full daylight compared with night', () => {
    const daylight = computeNightSkyLuminance(30 * DEGREE, 20 * DEGREE)
    const night = computeNightSkyLuminance(30 * DEGREE, -25 * DEGREE)

    expect(daylight).toBeLessThan(night)
    expect(daylight).toBeLessThan(0.03)
  })
})