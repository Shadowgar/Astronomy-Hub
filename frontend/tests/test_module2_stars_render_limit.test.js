import { describe, expect, it } from 'vitest'

import {
  resolveStarsRenderLimitMagnitude,
} from '../src/features/sky-engine/engine/sky/runtime/stellariumPainterLimits.ts'

describe('module2 stars render limit (stars.c render_visitor limit_mag)', () => {
  it('uses exposure alone when painter limits are absent', () => {
    expect(resolveStarsRenderLimitMagnitude(8.5, null)).toBe(8.5)
    expect(resolveStarsRenderLimitMagnitude(8.5, undefined)).toBe(8.5)
  })

  it('matches fmin(exposure, stars_limit_mag, hard_limit_mag)', () => {
    const limits = { starsLimitMag: 7.2, hardLimitMag: 99 }
    expect(resolveStarsRenderLimitMagnitude(8.5, limits)).toBe(7.2)
    expect(resolveStarsRenderLimitMagnitude(6.0, limits)).toBe(6.0)
    expect(resolveStarsRenderLimitMagnitude(100, { starsLimitMag: 12, hardLimitMag: 10 })).toBe(10)
  })
})
