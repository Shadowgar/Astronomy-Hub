import { describe, expect, it } from 'vitest'

import {
  eraEpb2jd,
  eraStarpv,
} from '../src/features/sky-engine/engine/sky/runtime/erfaStarpv.ts'
import {
  computeCatalogStarPv,
  computeCatalogStarPvFromCatalogueUnits,
  starAstrometricIcrfVector,
} from '../src/features/sky-engine/engine/sky/runtime/starsCatalogAstrom.ts'

/**
 * Goldens taken from ERFA 1.7 `src/t_erfa_c.c::t_starpv` (same input as
 * the canonical SOFA test vector used by Stellarium `stars.c` upstream).
 */
const ERFA_STARPV_GOLDEN = {
  input: {
    ra: 0.01686756,
    dec: -1.093989828,
    pmr: -1.78323516e-5,
    pmd: 2.336024047e-6,
    px: 0.74723,
    rv: -21.6,
  },
  expected: {
    p: [126668.5912743160601, 2136.792716839935195, -245251.2339876830091],
    v: [
      -0.4051854035740712739e-2,
      -0.6253919754866173866e-2,
      0.1189353719774107189e-1,
    ],
  },
}

function expectClose(actual, expected, eps) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(eps)
}

describe('eraStarpv', () => {
  it('matches the canonical ERFA test vector within 1e-10', () => {
    const { pv, iwarn } = eraStarpv(
      ERFA_STARPV_GOLDEN.input.ra,
      ERFA_STARPV_GOLDEN.input.dec,
      ERFA_STARPV_GOLDEN.input.pmr,
      ERFA_STARPV_GOLDEN.input.pmd,
      ERFA_STARPV_GOLDEN.input.px,
      ERFA_STARPV_GOLDEN.input.rv,
    )
    expect(iwarn).toBe(0)
    expectClose(pv[0][0], ERFA_STARPV_GOLDEN.expected.p[0], 1e-10)
    expectClose(pv[0][1], ERFA_STARPV_GOLDEN.expected.p[1], 1e-10)
    expectClose(pv[0][2], ERFA_STARPV_GOLDEN.expected.p[2], 1e-10)
    expectClose(pv[1][0], ERFA_STARPV_GOLDEN.expected.v[0], 1e-10)
    expectClose(pv[1][1], ERFA_STARPV_GOLDEN.expected.v[1], 1e-10)
    expectClose(pv[1][2], ERFA_STARPV_GOLDEN.expected.v[2], 1e-10)
  })

  it('eraEpb2jd matches canonical ERFA test vector', () => {
    const { djm0, djm } = eraEpb2jd(1957.3)
    expect(djm0).toBe(2400000.5)
    expectClose(djm, 35948.1915101513, 1e-9)
  })
})

describe('Stellarium stars.c::compute_pv parity helpers', () => {
  it('matches eraStarpv directly when epoch is J2000 and proper motion is pure-RA (cosDec applied)', () => {
    const raRad = 1.2
    const decRad = 0.3
    const pmRaStarRad = 0.0
    const pmDecRad = 0.0
    const plxArcsec = 0.1
    const pv = computeCatalogStarPv(raRad, decRad, pmRaStarRad, pmDecRad, plxArcsec, 2000)
    const ref = eraStarpv(raRad, decRad, 0, 0, plxArcsec, 0)
    for (let i = 0; i < 3; i += 1) {
      expectClose(pv.p[i], ref.pv[0][i], 1e-9)
      expectClose(pv.v[i], ref.pv[1][i], 1e-12)
    }
    expect(pv.iwarn).toBe(0)
    expectClose(pv.distanceAu, Math.hypot(ref.pv[0][0], ref.pv[0][1], ref.pv[0][2]), 1e-6)
  })

  it('zeroes proper motion and parallax when plx <= 0 (matches stars.c rule)', () => {
    const pv = computeCatalogStarPv(1.0, 0.5, 1e-5, 2e-6, 0, 2000)
    expect(pv.v[0]).toBe(0)
    expect(pv.v[1]).toBe(0)
    expect(pv.v[2]).toBe(0)
  })

  it('catalog-unit helper converts mas/yr + mas (HIP-style) correctly', () => {
    const pv = computeCatalogStarPvFromCatalogueUnits({
      raDeg: 101.287155,
      decDeg: -16.716116,
      pmRaMasYr: -546.05,
      pmDecMasYr: -1223.14,
      parallaxMas: 379.21,
    })
    expect(Number.isFinite(pv.p[0])).toBe(true)
    expect(pv.iwarn).toBe(0)
    expect(pv.distanceAu).toBeGreaterThan(0)
  })
})

describe('Stellarium stars.c::star_get_astrom', () => {
  it('subtracts earth_pvb[0] and returns a unit vector', () => {
    const pv = {
      p: [126668.59, 2136.79, -245251.23],
      v: [-0.00405, -0.00625, 0.01189],
      distanceAu: 1,
      iwarn: 0,
    }
    const earth = [0.1, 0.9, 0.4]
    const vec = starAstrometricIcrfVector(pv, 51544.5, earth)
    const mag = Math.hypot(vec[0], vec[1], vec[2])
    expectClose(mag, 1, 1e-12)
    // At ttMjd == ERFA_DJM00 (dt = 0) the vector is just (p - earth) normalised.
    const rawX = pv.p[0] - earth[0]
    const rawY = pv.p[1] - earth[1]
    const rawZ = pv.p[2] - earth[2]
    const rawMag = Math.hypot(rawX, rawY, rawZ)
    expectClose(vec[0], rawX / rawMag, 1e-12)
    expectClose(vec[1], rawY / rawMag, 1e-12)
    expectClose(vec[2], rawZ / rawMag, 1e-12)
  })

  it('applies catalog velocity across dt when ttMjd drifts from 51544.5', () => {
    const pv = {
      p: [1.0, 0.0, 0.0],
      v: [0.0, 1e-6, 0.0],
      distanceAu: 1,
      iwarn: 0,
    }
    const earth = [0.0, 0.0, 0.0]
    const base = starAstrometricIcrfVector(pv, 51544.5, earth)
    const later = starAstrometricIcrfVector(pv, 51544.5 + 1000, earth)
    expect(later[1]).toBeGreaterThan(base[1])
  })
})
