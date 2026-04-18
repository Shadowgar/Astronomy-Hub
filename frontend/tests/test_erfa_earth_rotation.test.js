import { describe, expect, it } from 'vitest'

import {
  eraEra00,
  eraEra00FromUtcJulianDate,
  eraEra00FromUt1JulianDate,
  eraSp00,
  localEarthRotationAngleRad,
} from '../src/features/sky-engine/engine/sky/runtime/erfaEarthRotation.ts'

describe('erfaEarthRotation (eraEra00 port)', () => {
  it('matches ERFA two-part splits at J2000.0 UT1', () => {
    const jd = 2451545.0
    const a = eraEra00FromUt1JulianDate(jd)
    const b = eraEra00(2400000.5, jd - 2400000.5)
    const c = eraEra00(jd, 0)
    expect(a).toBeCloseTo(b, 12)
    expect(a).toBeCloseTo(c, 12)
    expect(a).toBeCloseTo(4.894961212823757, 10)
  })

  it('matches eral = ERA + longitude + sp (TIO at J2000 sp≈0)', () => {
    const jd = 2451545.0
    const lon = 0.5
    expect(localEarthRotationAngleRad(jd, lon, jd)).toBeCloseTo(eraEra00FromUt1JulianDate(jd) + lon, 12)
  })

  it('eraEra00FromUtcJulianDate matches DJM0 + MJD split', () => {
    const utc = 2460483.000800741
    expect(eraEra00FromUtcJulianDate(utc)).toBeCloseTo(eraEra00(2400000.5, utc - 2400000.5), 15)
  })

  it('eraSp00 is invariant to equivalent TT two-part splits', () => {
    const tt = 2460483.2716340744
    const a = eraSp00(2400000.5, tt - 2400000.5)
    const b = eraSp00(tt, 0)
    expect(a).toBeCloseTo(b, 15)
  })
})
