import { describe, expect, it } from 'vitest'

import { multiplyMatrix3Erfa, transposeMatrix3 } from '../src/features/sky-engine/engine/sky/runtime/erfaIau2006.ts'
import { eraNut06a, eraPnm06a } from '../src/features/sky-engine/engine/sky/runtime/erfaPnm06a.ts'

describe('ERFA nutation / PNM06a (Stellarium erfa.c parity)', () => {
  it('eraNut06a is stable at TT = J2000.0 (golden from ported series)', () => {
    const { dpsi, deps } = eraNut06a(2451545.0, 0)
    expect(dpsi).toBeCloseTo(-6.754425598969512e-5, 14)
    expect(deps).toBeCloseTo(-2.7970831192374137e-5, 14)
  })

  it('eraPnm06a is orthogonal (rotation) at a modern epoch', () => {
    const r = eraPnm06a(2451545.0, -4515.3)
    const rt = transposeMatrix3(r)
    const i = multiplyMatrix3Erfa(r, rt)
    expect(i[0][0]).toBeCloseTo(1, 10)
    expect(i[1][1]).toBeCloseTo(1, 10)
    expect(i[2][2]).toBeCloseTo(1, 10)
    expect(i[0][1]).toBeCloseTo(0, 10)
    expect(i[0][2]).toBeCloseTo(0, 10)
    expect(i[1][2]).toBeCloseTo(0, 10)
    expect(Math.hypot(r[0][0], r[0][1], r[0][2])).toBeCloseTo(1, 10)
  })

  it('eraPnm06a determinant +1', () => {
    const r = eraPnm06a(2400000.5, 50123.2)
    const det =
      r[0][0] * (r[1][1] * r[2][2] - r[1][2] * r[2][1]) -
      r[0][1] * (r[1][0] * r[2][2] - r[1][2] * r[2][0]) +
      r[0][2] * (r[1][0] * r[2][1] - r[1][1] * r[2][0])
    expect(det).toBeCloseTo(1, 10)
  })
})
