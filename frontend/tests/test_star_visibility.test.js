import { describe, expect, it } from 'vitest'

import { computeVisibilityAlpha, computeVisibilitySizeScale } from '../src/features/sky-engine/starVisibility'

describe('star visibility thresholding', () => {
  it('returns zero when a star is beyond the limiting magnitude', () => {
    expect(computeVisibilityAlpha(5.1, 5)).toBe(0)
  })

  it('returns one when a star is comfortably above the threshold', () => {
    expect(computeVisibilityAlpha(3.5, 5, 0.8)).toBe(1)
  })

  it('uses a hard visibility threshold with no fade band', () => {
    expect(computeVisibilityAlpha(4.9, 5, 0.8)).toBe(1)
    expect(computeVisibilityAlpha(5.0, 5, 0.8)).toBe(1)
    expect(computeVisibilityAlpha(5.01, 5, 0.8)).toBe(0)
  })

  it('keeps point size unchanged through visibility thresholding', () => {
    expect(computeVisibilitySizeScale(0)).toBeCloseTo(1, 6)
    expect(computeVisibilitySizeScale(1)).toBeCloseTo(1, 6)
  })
})
