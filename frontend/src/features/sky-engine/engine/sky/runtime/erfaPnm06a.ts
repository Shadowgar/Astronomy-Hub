/**
 * ERFA `eraNut06a`, `eraPnm06a` — IAU 2006/2000A classical NPB matrix, from `erfa.c`.
 */

import { ERFA_DJC, ERFA_DJ00 } from './erfaConstants'
import { eraFw2m, eraPfw06, type MutableMatrix3 } from './erfaIau2006'
import { eraNut00a } from './erfaNut00a'

export function eraNut06a(date1: number, date2: number): { dpsi: number; deps: number } {
  const t = (date1 - ERFA_DJ00 + date2) / ERFA_DJC
  const fj2 = -2.7774e-6 * t
  const { dpsi: dp, deps: de } = eraNut00a(date1, date2)
  return {
    dpsi: dp + dp * (0.4697e-6 + fj2),
    deps: de + de * fj2,
  }
}

export function eraPnm06a(date1: number, date2: number): MutableMatrix3 {
  const { gamb, phib, psib, epsa } = eraPfw06(date1, date2)
  const { dpsi: dp, deps: de } = eraNut06a(date1, date2)
  return eraFw2m(gamb, phib, psib + dp, epsa + de)
}

export function eraPnm06aFromTtJulianDate(ttJd: number): MutableMatrix3 {
  return eraPnm06a(2400000.5, ttJd - 2400000.5)
}
