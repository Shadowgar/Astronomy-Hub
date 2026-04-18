import { describe, expect, it } from 'vitest'

import { eraEpv00 } from '../src/features/sky-engine/engine/sky/runtime/erfaEpv00.ts'

function expectVecClose(actual, expected, eps) {
  expect(actual.length).toBe(expected.length)
  for (let i = 0; i < actual.length; i += 1) {
    expect(Math.abs(actual[i] - expected[i])).toBeLessThanOrEqual(eps)
  }
}

/** Goldens from PyERFA `erfa.epv00` (same ERFA algorithm as study `erfa.c`). */
const GOLDEN_J2000 = {
  status: 0,
  pvhPos: [-0.17713507281322974, 0.8874285242954301, 0.3847428889988798],
  pvhVel: [-0.017207624698327994, -0.002898167850821792, -0.001256394678695151],
  pvbPos: [-0.1842715329099724, 0.884781510192107, 0.3838199324398591],
  pvbVel: [-0.01720224630718366, -0.002904925940146081, -0.0012594275302390552],
}

const GOLDEN_2024 = {
  status: 0,
  pvhPos: [-0.3265530015769943, 0.8511124703978801, 0.3689511108224134],
  pvhVel: [-0.016515491587748364, -0.0053019655823964415, -0.0022980848635084034],
  pvbPos: [-0.3344736315948633, 0.848301747345881, 0.36796116762476794],
  pvbVel: [-0.016510551610782388, -0.005308347889398901, -0.002300903123362575],
}

const GOLDEN_2101 = {
  status: 1,
  pvhPos: [-0.17464134482151925, 0.8879463991720479, 0.3847358889183205],
  pvhVel: [-0.017208801748377026, -0.0028579483504749684, -0.001237166100166109],
  pvbPos: [-0.16623490051428466, 0.8890016563235187, 0.38491708423376053],
  pvbVel: [-0.01721017328030111, -0.0028503794659975007, -0.001233906331340288],
}

describe('eraEpv00', () => {
  it('matches PyERFA at J2000', () => {
    const r = eraEpv00(2451545.0, 0.0)
    expect(r.status).toBe(GOLDEN_J2000.status)
    expectVecClose(r.pvh[0], GOLDEN_J2000.pvhPos, 3e-15)
    expectVecClose(r.pvh[1], GOLDEN_J2000.pvhVel, 3e-15)
    expectVecClose(r.pvb[0], GOLDEN_J2000.pvbPos, 3e-15)
    expectVecClose(r.pvb[1], GOLDEN_J2000.pvbVel, 3e-15)
  })

  it('matches PyERFA at JD TT 2460320.0 (same sum as PyERFA golden)', () => {
    const r = eraEpv00(2460320.0, 0.0)
    expect(r.status).toBe(GOLDEN_2024.status)
    expectVecClose(r.pvh[0], GOLDEN_2024.pvhPos, 2e-14)
    expectVecClose(r.pvh[1], GOLDEN_2024.pvhVel, 2e-14)
    expectVecClose(r.pvb[0], GOLDEN_2024.pvbPos, 2e-14)
    expectVecClose(r.pvb[1], GOLDEN_2024.pvbVel, 2e-14)
  })

  it('returns status +1 outside 1900–2100 band (PyERFA warning)', () => {
    const r = eraEpv00(2488070.5, 0.0)
    expect(r.status).toBe(GOLDEN_2101.status)
    expectVecClose(r.pvh[0], GOLDEN_2101.pvhPos, 2e-14)
    expectVecClose(r.pvb[0], GOLDEN_2101.pvbPos, 2e-14)
  })
})
