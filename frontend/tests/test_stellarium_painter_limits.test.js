import { describe, expect, it } from 'vitest'

import {
  STELLARIUM_DEFAULT_DISPLAY_LIMIT_MAG,
  computeStellariumCorePainterLimits,
  computeVmagForRadius,
} from '../src/features/sky-engine/engine/sky/runtime/stellariumPainterLimits.ts'

describe('Stellarium core_render painter limits', () => {
  it('exposes hard_limit_mag default 99', () => {
    const limits = computeStellariumCorePainterLimits()
    expect(limits.hardLimitMag).toBe(STELLARIUM_DEFAULT_DISPLAY_LIMIT_MAG)
  })

  it('computes stars_limit_mag and hints_limit_mag from skip/show radii (monotonic)', () => {
    const limits = computeStellariumCorePainterLimits()
    expect(limits.hintsLimitMag).toBeLessThan(limits.starsLimitMag)
    expect(Number.isFinite(limits.starsLimitMag)).toBe(true)
    expect(Number.isFinite(limits.hintsLimitMag)).toBe(true)
  })

  it('matches dichotomy shape for compute_vmag_for_radius', () => {
    const a = computeVmagForRadius(0.25)
    const b = computeVmagForRadius(0.4)
    expect(b).toBeLessThan(a)
  })
})
