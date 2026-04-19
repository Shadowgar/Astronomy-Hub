import { describe, expect, it } from 'vitest'

import { bvToRgb } from '../src/features/sky-engine/engine/sky/adapters/bvToRgb'
import { resolveStarColorHex } from '../src/features/sky-engine/starRenderer.ts'

describe('bv_to_rgb (Stellarium src/algos/bv_to_rgb.c)', () => {
  it('matches reference samples (linear RGB + 8-bit hex)', () => {
    expect(bvToRgb(-0.5)).toEqual([0.602745, 0.713725, 1])
    expect(resolveStarColorHex(-0.5)).toBe('#9ab6ff')

    expect(bvToRgb(0)).toEqual([0.798196, 0.858824, 1])
    expect(resolveStarColorHex(0)).toBe('#ccdbff')

    expect(bvToRgb(0.65)).toEqual([1, 0.997504, 0.995009])
    expect(resolveStarColorHex(0.65)).toBe('#fffefe')

    expect(bvToRgb(2)).toEqual([1, 0.81734, 0.596904])
    expect(resolveStarColorHex(2)).toBe('#ffd098')

    expect(bvToRgb(3.499)).toEqual([1, 0.772549, 0.647059])
    expect(resolveStarColorHex(3.499)).toBe('#ffc5a5')
  })

  it('clamps B−V like C (×1000 then [-500, 3499])', () => {
    expect(bvToRgb(-10)).toEqual(bvToRgb(-0.5))
    expect(bvToRgb(99)).toEqual(bvToRgb(3.499))
  })
})
