import { describe, expect, it } from 'vitest'

import {
  computeEffectiveLimitingMagnitude,
  computeLimitingMagnitude,
  computeSkyBrightness,
  computeSkyBrightnessLimitingMagnitude,
} from '../src/features/sky-engine/skyBrightness'

const DEGREE = Math.PI / 180

describe('sky brightness model', () => {
  it('stays dark through astronomical night and ramps continuously into day', () => {
    const night = computeSkyBrightness(-18 * DEGREE)
    const twilight = computeSkyBrightness(-9 * DEGREE)
    const daylight = computeSkyBrightness(10 * DEGREE)

    expect(night).toBeLessThan(0.2)
    expect(twilight).toBeGreaterThan(night)
    expect(daylight).toBeGreaterThan(0.95)
  })

  it('produces a monotonic limiting magnitude response', () => {
    const nightLimit = computeLimitingMagnitude(0)
    const twilightLimit = computeLimitingMagnitude(0.5)
    const dayLimit = computeLimitingMagnitude(1)

    expect(nightLimit).toBeGreaterThan(5)
    expect(twilightLimit).toBeLessThan(nightLimit)
    expect(dayLimit).toBeLessThan(twilightLimit)
  })

  it('reveals more stars as the sun drops through twilight', () => {
    const civilLimit = computeSkyBrightnessLimitingMagnitude(-3)
    const nauticalLimit = computeSkyBrightnessLimitingMagnitude(-9)
    const astronomicalLimit = computeSkyBrightnessLimitingMagnitude(-15)

    expect(nauticalLimit).toBeGreaterThan(civilLimit)
    expect(astronomicalLimit).toBeGreaterThanOrEqual(nauticalLimit)
  })

  it('restores the night limiting magnitude below astronomical twilight', () => {
    expect(computeSkyBrightnessLimitingMagnitude(-18)).toBeCloseTo(computeSkyBrightnessLimitingMagnitude(-24), 3)
  })

  it('preserves zoom depth at night without leaking faint stars into daylight', () => {
    const darkWideLimit = computeEffectiveLimitingMagnitude(0, 120, 1)
    const darkCloseLimit = computeEffectiveLimitingMagnitude(0, 2.5, 1)
    const daylightCloseLimit = computeEffectiveLimitingMagnitude(1, 2.5, 0.05)
    const daylightWideLimit = computeEffectiveLimitingMagnitude(1, 120, 0.05)

    expect(darkCloseLimit).toBeGreaterThan(darkWideLimit)
    expect(daylightWideLimit).toBeLessThan(darkWideLimit)
    expect(daylightCloseLimit).toBeLessThan(darkCloseLimit)
  })
})