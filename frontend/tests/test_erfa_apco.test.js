import { describe, expect, it } from 'vitest'

import { eraApco } from '../src/features/sky-engine/engine/sky/runtime/erfaApco.ts'

/** Official ERFA/PyERFA `test_ufunc.py::test_apco` vector (SOFA release test). */
const APCO_SOFA_CASE = {
  date1: 2456384.5,
  date2: 0.970031644,
  ebpv: [
    [-0.974170438, -0.211520082, -0.0917583024],
    [0.00364365824, -0.0154287319, -0.00668922024],
  ],
  ehp: [-0.973458265, -0.209215307, -0.0906996477],
  x: 0.0013122272,
  y: -2.92808623e-5,
  s: 3.05749468e-8,
  theta: 3.14540971,
  elong: -0.527800806,
  phi: -1.2345856,
  hm: 2738.0,
  xp: 2.47230737e-7,
  yp: 1.82640464e-6,
  sp: -3.01974337e-11,
  refa: 0.000201418779,
  refb: -2.36140831e-7,
  golden: {
    pmt: 13.25248468622587269,
    eb: [-0.974182711063032272, -0.2115130190135344832, -0.09179840186949532298],
    eh: [-0.9736425571689739035, -0.2092452125849330936, -0.09075578152243272599],
    em: 0.9998233241709957653,
    v: [0.2078704992916728762e-4, -0.8955360107151952319e-4, -0.3863338994288951082e-4],
    bm1: 0.9999999950277561236,
    bpn: [
      [0.9999991390295159156, -0.113633665377160963e-7, -0.1312227200895260194e-2],
      [0.4978650072505016932e-7, 0.9999999995713154868, 0.292808221787231568e-4],
      [0.1312227200000000000e-2, -0.2928086230000000000e-4, 0.9999991386008323373],
    ],
    along: -0.5278008060295995734,
    xpl: 0.1133427418130752958e-5,
    ypl: 0.1453347595780646207e-5,
    sphi: -0.9440115679003211329,
    cphi: 0.3299123514971474711,
    diurab: 0,
    eral: 2.617608903970400427,
    refa: 0.201418779e-3,
    refb: -0.236140831e-6,
  },
}

function expectClose(a, b, rtol, atol) {
  expect(Math.abs(a - b)).toBeLessThanOrEqual(Math.max(rtol * Math.abs(b), atol))
}

describe('eraApco', () => {
  it('matches SOFA/PyERFA release test vector (test_ufunc.test_apco)', () => {
    const c = APCO_SOFA_CASE
    const a = eraApco(
      c.date1,
      c.date2,
      c.ebpv,
      c.ehp,
      c.x,
      c.y,
      c.s,
      c.theta,
      c.elong,
      c.phi,
      c.hm,
      c.xp,
      c.yp,
      c.sp,
      c.refa,
      c.refb,
    )
    const g = c.golden
    expectClose(a.pmt, g.pmt, 1e-11, 1e-14)
    for (let i = 0; i < 3; i += 1) {
      expectClose(a.eb[i], g.eb[i], 1e-12, 1e-15)
      expectClose(a.eh[i], g.eh[i], 1e-12, 1e-15)
      expectClose(a.v[i], g.v[i], 1e-15, 1e-22)
    }
    expectClose(a.em, g.em, 1e-12, 1e-15)
    expectClose(a.bm1, g.bm1, 1e-12, 1e-15)
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        expect(a.bpn[i][j]).toBeCloseTo(g.bpn[i][j], 10)
      }
    }
    expectClose(a.along, g.along, 2e-12, 1e-15)
    expectClose(a.xpl, g.xpl, 1e-12, 1e-16)
    expectClose(a.ypl, g.ypl, 1e-12, 1e-16)
    expectClose(a.sphi, g.sphi, 1e-12, 1e-15)
    expectClose(a.cphi, g.cphi, 1e-12, 1e-15)
    expect(a.diurab).toBe(g.diurab)
    expectClose(a.eral, g.eral, 1e-12, 1e-15)
    expectClose(a.refa, g.refa, 1e-15, 3e-18)
    expectClose(a.refb, g.refb, 1e-15, 3e-18)
    expect(a.phi).toBe(c.phi)
  })
})
