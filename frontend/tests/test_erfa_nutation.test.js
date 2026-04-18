import { describe, expect, it } from 'vitest'

import { deriveObserverGeometry } from '../src/features/sky-engine/engine/sky/runtime/observerDerivedGeometry.ts'
import { observerEralStellariumRad } from '../src/features/sky-engine/engine/sky/runtime/erfaEarthRotation.ts'
import { eraBpn2xy } from '../src/features/sky-engine/engine/sky/runtime/erfaBpn2xy.ts'
import { eraEors } from '../src/features/sky-engine/engine/sky/runtime/erfaEors.ts'
import { multiplyMatrix3Erfa, transposeMatrix3 } from '../src/features/sky-engine/engine/sky/runtime/erfaIau2006.ts'
import { eraNut06a, eraPnm06a } from '../src/features/sky-engine/engine/sky/runtime/erfaPnm06a.ts'
import { eraS06 } from '../src/features/sky-engine/engine/sky/runtime/erfaS06.ts'

describe('ERFA nutation / PNM06a (Stellarium erfa.c parity)', () => {
  it('icrsToHorizontal × horizontalToIcrs is identity (observer frame chain)', () => {
    const g = deriveObserverGeometry(
      { label: 't', latitude: 51.5, longitude: -0.12, elevationFt: 80 },
      '2026-06-15T12:00:00.000Z',
      'full',
      null,
    )
    const prod = multiplyMatrix3Erfa(
      g.matrices.icrsToHorizontal,
      g.matrices.horizontalToIcrs,
    )
    expect(prod[0][0]).toBeCloseTo(1, 10)
    expect(prod[1][1]).toBeCloseTo(1, 10)
    expect(prod[2][2]).toBeCloseTo(1, 10)
    expect(prod[0][1]).toBeCloseTo(0, 10)
    expect(prod[0][2]).toBeCloseTo(0, 10)
    expect(prod[1][2]).toBeCloseTo(0, 10)
  })

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

  it('eraBpn2xy matches BPN bottom row', () => {
    const r = eraPnm06a(2451545.0, -1421.3)
    const xy = eraBpn2xy(r)
    expect(xy.x).toBe(r[2][0])
    expect(xy.y).toBe(r[2][1])
  })

  it('eraS06 / eraEors stable at TT = J2000.0 (goldens from ported series)', () => {
    const r = eraPnm06a(2451545.0, 0.0)
    const { x, y } = eraBpn2xy(r)
    const s = eraS06(2451545.0, 0.0, x, y)
    const eo = eraEors(r, s)
    expect(s).toBeCloseTo(-1.0133965177563803e-8, 14)
    expect(eo).toBeCloseTo(0.00006189010752393381, 12)
  })

  it('eraS06 / eraEors at mixed JD apportionment (ERA sample split)', () => {
    const r = eraPnm06a(2400000.5, 50123.2)
    const { x, y } = eraBpn2xy(r)
    const s = eraS06(2400000.5, 50123.2, x, y)
    const eo = eraEors(r, s)
    expect(s).toBeCloseTo(-3.693350919690419e-9, 12)
    expect(eo).toBeCloseTo(0.0008375055559364065, 12)
  })

  it('deriveObserverGeometry exposes CIP / s / EO / MJD seam', () => {
    const g = deriveObserverGeometry(
      { label: 't', latitude: 51.5, longitude: -0.12, elevationFt: 80 },
      '2026-06-15T12:00:00.000Z',
      'full',
      null,
    )
    expect(g.astrom.bpn[0][0]).not.toBeCloseTo(g.matrices.bpn[0][0], 6)
    expect(observerEralStellariumRad(g.utcJulianDate, g.longitudeRad, g.ttJulianDate)).toBeCloseTo(g.astrom.eral, 14)
    expect(g.observerSeam.eralRad).toBeCloseTo(g.astrom.eral, 14)
    expect(g.cipRad.x).toBeCloseTo(g.matrices.bpn[2][0], 15)
    expect(g.timeModifiedJulianDate.tt).toBeCloseTo(g.ttJulianDate - 2400000.5, 12)
    expect(g.cioLocatorSRad).toBeCloseTo(
      eraS06(2400000.5, g.ttJulianDate - 2400000.5, g.cipRad.x, g.cipRad.y),
      14,
    )
    expect(g.equationOfOriginsRad).toBeCloseTo(eraEors(g.matrices.bpn, g.cioLocatorSRad), 14)
  })
})
