import { describe, expect, it } from 'vitest'

import {
  eraAb,
  eraLdsun,
  stellariumApparentGcrsToAstrometricIcrsUnit,
  stellariumAstrometricToApparentIcrsUnit,
} from '../src/features/sky-engine/engine/sky/runtime/erfaAbLdsun.ts'
import { deriveObserverGeometry } from '../src/features/sky-engine/engine/sky/runtime/observerDerivedGeometry.ts'

describe('erfaAbLdsun (ERFA eraAb / eraLd / eraLdsun)', () => {
  it('eraAb matches PyERFA reference vector', () => {
    const hyp = Math.hypot(0.99, 0.1)
    const pnat = [0.99 / hyp, 0.1 / hyp, 0]
    const v = [1e-5, 2e-6, -3e-6]
    const out = /** @type {[number, number, number]} */ ([0, 0, 0])
    eraAb(pnat, v, 1.0123, 0.99999999995, out)
    expect(out[0]).toBeCloseTo(0.9949370900381376, 12)
    expect(out[1]).toBeCloseTo(0.10049968585743356, 12)
    expect(out[2]).toBeCloseTo(-2.9999848330846677e-6, 12)
    const n = Math.hypot(out[0], out[1], out[2])
    expect(n).toBeCloseTo(1, 12)
  })

  it('eraLdsun matches PyERFA for orthogonal p and e', () => {
    const p = /** @type {[number, number, number]} */ ([1, 0, 0])
    const e = [0, 1, 0]
    eraLdsun(p, e, 1.0, p)
    expect(p[0]).toBeCloseTo(1.0, 15)
    expect(p[1]).toBeCloseTo(1.97412574336e-8, 15)
    expect(p[2]).toBeCloseTo(0.0, 15)
  })

  it('apparent GCRS ↔ astrometric ICRS round-trip (Stellarium iteration)', () => {
    const astrom = {
      eh: /** @type {[number, number, number]} */ ([0, 1, 0]),
      em: 1.0,
      v: /** @type {[number, number, number]} */ ([1e-5, 2e-6, -3e-6]),
      bm1: 0.99999999995,
    }
    const icrs = [0.6, 0.7, 0.3583]
    const hyp = Math.hypot(icrs[0], icrs[1], icrs[2])
    const u = [icrs[0] / hyp, icrs[1] / hyp, icrs[2] / hyp]
    const app = stellariumAstrometricToApparentIcrsUnit(astrom, u)
    const back = stellariumApparentGcrsToAstrometricIcrsUnit(astrom, app)
    expect(back[0]).toBeCloseTo(u[0], 9)
    expect(back[1]).toBeCloseTo(u[1], 9)
    expect(back[2]).toBeCloseTo(u[2], 9)
  })

  it('stellariumAstrometricToApparentIcrsUnit matches PyERFA chain', () => {
    const astrom = {
      eh: /** @type {[number, number, number]} */ ([0, 1, 0]),
      em: 1.0,
      v: /** @type {[number, number, number]} */ ([1e-5, 2e-6, -3e-6]),
      bm1: 0.99999999995,
    }
    const out = stellariumAstrometricToApparentIcrsUnit(astrom, [1, 0, 0])
    expect(out[0]).toBeCloseTo(0.9999999999934605, 12)
    expect(out[1]).toBeCloseTo(2.0197310991112296e-6, 12)
    expect(out[2]).toBeCloseTo(-2.999985058634025e-6, 12)
    expect(Math.hypot(out[0], out[1], out[2])).toBeCloseTo(1, 12)
  })

  it('deriveObserverGeometry astrom drives finite aberration deflection', () => {
    const g = deriveObserverGeometry(
      { label: 't', latitude: 40, longitude: -74, elevationFt: 100 },
      '2024-06-15T12:00:00.000Z',
      'full',
      null,
    )
    const a = g.astrom
    const slice = { eh: a.eh, em: a.em, v: a.v, bm1: a.bm1 }
    const u = [1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)]
    const app = stellariumAstrometricToApparentIcrsUnit(slice, u)
    const dot = u[0] * app[0] + u[1] * app[1] + u[2] * app[2]
    expect(dot).toBeLessThan(1.0000001)
    expect(dot).toBeGreaterThan(0.999999)
    expect(Math.hypot(app[0], app[1], app[2])).toBeCloseTo(1, 10)
  })
})
