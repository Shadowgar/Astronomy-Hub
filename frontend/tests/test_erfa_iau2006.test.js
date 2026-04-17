import { describe, expect, it } from 'vitest'

import {
  eclipticToIcrsMatrixFromTt,
  eraObl06,
  icrsToEclipticMatrixFromTt,
  multiplyMatrix3Erfa,
  transposeMatrix3,
} from '../src/features/sky-engine/engine/sky/runtime/erfaIau2006.ts'

describe('erfaIau2006', () => {
  it('eraObl06 at J2000 matches mean obliquity (arcsec → rad)', () => {
    const ob = eraObl06(2451545.0, 0)
    expect(ob).toBeCloseTo(84381.406 * 4.848136811095359935899141e-6, 10)
  })

  it('ecliptic matrices are orthonormal inverses', () => {
    const ttJd = 2460000.0
    const a = icrsToEclipticMatrixFromTt(ttJd)
    const b = eclipticToIcrsMatrixFromTt(ttJd)
    const i = multiplyMatrix3Erfa(a, b)
    expect(i[0][0]).toBeCloseTo(1, 10)
    expect(i[1][1]).toBeCloseTo(1, 10)
    expect(i[2][2]).toBeCloseTo(1, 10)
    expect(i[0][1]).toBeCloseTo(0, 10)
    expect(transposeMatrix3(a)[0][0]).toBeCloseTo(b[0][0], 12)
  })
})
