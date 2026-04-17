import { describe, expect, it } from 'vitest'

import {
  eraEra00,
  eraEra00FromUt1JulianDate,
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

  it('matches eral = ERA + longitude (radians)', () => {
    const jd = 2451545.0
    const lon = 0.5
    expect(localEarthRotationAngleRad(jd, lon)).toBeCloseTo(eraEra00FromUt1JulianDate(jd) + lon, 12)
  })
})
