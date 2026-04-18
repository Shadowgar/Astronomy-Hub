import { describe, expect, it } from 'vitest'

import { eraApcs } from '../src/features/sky-engine/engine/sky/runtime/erfaApcs.ts'
import { ERFA_AULT, ERFA_DAU, ERFA_DJ00, ERFA_DAYSEC } from '../src/features/sky-engine/engine/sky/runtime/erfaConstants.ts'

describe('eraApcs', () => {
  it('computes pmt, eb, eh, em, v, bm1, bpn for a simple geometry (pv = 0)', () => {
    const date1 = ERFA_DJ00
    const date2 = 0.0
    const pv = [
      [0, 0, 0],
      [0, 0, 0],
    ]
    const ebpv = [
      [1, 2, 3],
      [0.1, 0, 0],
    ]
    const ehp = [10, 0, 0]
    const astrom = {
      pmt: -1,
      eb: [0, 0, 0],
      eh: [0, 0, 0],
      em: -1,
      v: [0, 0, 0],
      bm1: -1,
      bpn: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
    }
    eraApcs(date1, date2, pv, ebpv, ehp, astrom)
    expect(astrom.pmt).toBeCloseTo(0, 15)
    expect(astrom.eb).toEqual([1, 2, 3])
    expect(astrom.em).toBeCloseTo(10, 15)
    expect(astrom.eh[0]).toBeCloseTo(1, 15)
    expect(astrom.eh[1]).toBeCloseTo(0, 15)
    expect(astrom.eh[2]).toBeCloseTo(0, 15)
    const CR = ERFA_AULT / ERFA_DAYSEC
    expect(astrom.v[0]).toBeCloseTo(0.1 * CR, 15)
    expect(astrom.v[1]).toBeCloseTo(0, 15)
    expect(astrom.v[2]).toBeCloseTo(0, 15)
    const v2 = astrom.v[0] ** 2 + astrom.v[1] ** 2 + astrom.v[2] ** 2
    expect(astrom.bm1).toBeCloseTo(Math.sqrt(1 - v2), 15)
    expect(astrom.bpn[0][0]).toBe(1)
    expect(astrom.bpn[1][1]).toBe(1)
    expect(astrom.bpn[2][2]).toBe(1)
  })

  it('maps geocentric offset in meters into eb / ph (non-zero pv)', () => {
    const date1 = 2400000.5
    const date2 = 50123.2
    const dpMeters = ERFA_DAU
    const pv = [
      [dpMeters, 0, 0],
      [0, 0, 0],
    ]
    const ebpv = [
      [0, 0, 0],
      [0, 0, 0],
    ]
    const ehp = [0, 0, 0]
    const astrom = {
      pmt: 0,
      eb: [0, 0, 0],
      eh: [0, 0, 0],
      em: 0,
      v: [0, 0, 0],
      bm1: 0,
      bpn: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
    }
    eraApcs(date1, date2, pv, ebpv, ehp, astrom)
    expect(astrom.eb[0]).toBeCloseTo(1, 15)
    expect(astrom.eh[0]).toBeCloseTo(1, 15)
    expect(astrom.em).toBeCloseTo(1, 15)
  })
})
