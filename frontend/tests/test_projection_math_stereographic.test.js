import { describe, expect, it } from 'vitest'

import { computeStereographicFovAxes } from '../src/features/sky-engine/projectionMath.ts'

describe('computeStereographicFovAxes (Stellarium proj_stereographic_compute_fov)', () => {
  it('uses the diameter as fovy when aspect >= 1', () => {
    const diameter = 1.2
    const { fovX, fovY } = computeStereographicFovAxes(diameter, 2)
    expect(fovY).toBeCloseTo(diameter, 10)
    expect(fovX).toBeGreaterThan(fovY)
  })

  it('uses the diameter as fovx when aspect < 1', () => {
    const diameter = 1.2
    const { fovX, fovY } = computeStereographicFovAxes(diameter, 0.5)
    expect(fovX).toBeCloseTo(diameter, 10)
    expect(fovY).toBeGreaterThan(fovX)
  })

  it('is symmetric at unit aspect', () => {
    const diameter = 0.9
    const { fovX, fovY } = computeStereographicFovAxes(diameter, 1)
    expect(fovX).toBeCloseTo(diameter, 10)
    expect(fovY).toBeCloseTo(diameter, 10)
  })
})
