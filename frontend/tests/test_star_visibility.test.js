import { describe, expect, it } from 'vitest'

import { computeVisibilityAlpha, computeVisibilitySizeScale } from '../src/features/sky-engine/starVisibility'

describe('star visibility smoothing', () => {
  it('returns zero when a star is beyond the limiting magnitude', () => {
    expect(computeVisibilityAlpha(5.1, 5)).toBe(0)
  })

  it('returns one when a star is comfortably above the threshold', () => {
    expect(computeVisibilityAlpha(3.5, 5, 0.8)).toBe(1)
  })

  it('applies a smooth quadratic fade inside the transition band', () => {
    const nearThreshold = computeVisibilityAlpha(4.9, 5, 0.8)
    const midBand = computeVisibilityAlpha(4.6, 5, 0.8)
    const brightSide = computeVisibilityAlpha(4.3, 5, 0.8)

    expect(midBand).toBeGreaterThan(nearThreshold)
    expect(brightSide).toBeGreaterThan(midBand)
    expect(nearThreshold).toBeGreaterThan(0)
    expect(brightSide).toBeLessThan(1)
  })

  it('keeps size changes mild compared with alpha changes', () => {
    expect(computeVisibilitySizeScale(0)).toBeCloseTo(0.88, 6)
    expect(computeVisibilitySizeScale(1)).toBeCloseTo(1, 6)
  })
})