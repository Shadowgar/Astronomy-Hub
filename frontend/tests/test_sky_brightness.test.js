import { describe, expect, it } from 'vitest'

import {
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

    expect(night).toBe(0)
    expect(twilight).toBeGreaterThan(night)
    expect(daylight).toBe(1)
  })

  it('produces a monotonic limiting magnitude response', () => {
    const nightLimit = computeLimitingMagnitude(0)
    const twilightLimit = computeLimitingMagnitude(0.5)
    const dayLimit = computeLimitingMagnitude(1)

    expect(nightLimit).toBe(6.5)
    expect(twilightLimit).toBeLessThan(nightLimit)
    expect(dayLimit).toBe(-1)
  })

  it('reveals more stars as the sun drops through twilight', () => {
    const civilLimit = computeSkyBrightnessLimitingMagnitude(-3)
    const nauticalLimit = computeSkyBrightnessLimitingMagnitude(-9)
    const astronomicalLimit = computeSkyBrightnessLimitingMagnitude(-15)

    expect(nauticalLimit).toBeGreaterThan(civilLimit)
    expect(astronomicalLimit).toBeGreaterThan(nauticalLimit)
  })

  it('restores the night limiting magnitude below astronomical twilight', () => {
    expect(computeSkyBrightnessLimitingMagnitude(-18)).toBe(6.5)
    expect(computeSkyBrightnessLimitingMagnitude(-24)).toBe(6.5)
  })
})