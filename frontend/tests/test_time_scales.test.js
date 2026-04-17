import { describe, expect, it } from 'vitest'

import {
  deltaTSecondsFromTtMjd,
  dut1SecondsFromTimestampIso,
  toModifiedJulianDateTt,
  ttMinusUtcSeconds,
} from '../src/features/sky-engine/engine/sky/runtime/timeScales.ts'

describe('time scales (Stellarium deltat.c / leap table)', () => {
  it('matches SMH2016 ΔT near USNO spot checks (seconds; TT-based vs UT calendar differs slightly)', () => {
    const iso1980 = '1980-01-01T00:00:00.000Z'
    expect(deltaTSecondsFromTtMjd(toModifiedJulianDateTt(iso1980))).toBeCloseTo(50.5387, 0)

    const iso2000 = '2000-01-01T00:00:00.000Z'
    expect(deltaTSecondsFromTtMjd(toModifiedJulianDateTt(iso2000))).toBeCloseTo(63.8285, 0)

    const iso2010 = '2010-01-01T00:00:00.000Z'
    expect(deltaTSecondsFromTtMjd(toModifiedJulianDateTt(iso2010))).toBeCloseTo(66.0699, 0)

    const iso2017 = '2017-01-01T00:00:00.000Z'
    expect(deltaTSecondsFromTtMjd(toModifiedJulianDateTt(iso2017))).toBeCloseTo(68.5927, 0)
  })

  it('defines UT1−UTC as (TT−UTC) − ΔT (algebraic; same SMH model as Stellarium deltat)', () => {
    const iso = '2020-06-01T12:00:00.000Z'
    const ttMjd = toModifiedJulianDateTt(iso)
    const expected = ttMinusUtcSeconds(iso) - deltaTSecondsFromTtMjd(ttMjd)
    expect(dut1SecondsFromTimestampIso(iso)).toBeCloseTo(expected, 6)
  })
})
