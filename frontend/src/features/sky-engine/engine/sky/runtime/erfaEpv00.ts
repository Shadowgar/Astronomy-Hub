/**
 * ERFA `eraEpv00` — Earth position and velocity (heliocentric + barycentric, BCRS), from `erfa.c`.
 */

import { ERFA_DJ00, ERFA_DJY } from './erfaConstants'
import {
  ERFA_EPV00_E0X,
  ERFA_EPV00_E0Y,
  ERFA_EPV00_E0Z,
  ERFA_EPV00_E1X,
  ERFA_EPV00_E1Y,
  ERFA_EPV00_E1Z,
  ERFA_EPV00_E2X,
  ERFA_EPV00_E2Y,
  ERFA_EPV00_E2Z,
  ERFA_EPV00_S0X,
  ERFA_EPV00_S0Y,
  ERFA_EPV00_S0Z,
  ERFA_EPV00_S1X,
  ERFA_EPV00_S1Y,
  ERFA_EPV00_S1Z,
  ERFA_EPV00_S2X,
  ERFA_EPV00_S2Y,
  ERFA_EPV00_S2Z,
} from './erfaEpv00Tables.generated'

/** DE405-alignment matrix (ecliptic → BCRS), ERFA `eraEpv00` static `am**`. */
const AM12 = 0.000000211284
const AM13 = -0.000000091603
const AM21 = -0.000000230286
const AM22 = 0.917482137087
const AM23 = -0.397776982902
const AM32 = 0.397776982902
const AM33 = 0.917482137087

const CE0 = [ERFA_EPV00_E0X, ERFA_EPV00_E0Y, ERFA_EPV00_E0Z] as const
const CE1 = [ERFA_EPV00_E1X, ERFA_EPV00_E1Y, ERFA_EPV00_E1Z] as const
const CE2 = [ERFA_EPV00_E2X, ERFA_EPV00_E2Y, ERFA_EPV00_E2Z] as const
const CS0 = [ERFA_EPV00_S0X, ERFA_EPV00_S0Y, ERFA_EPV00_S0Z] as const
const CS1 = [ERFA_EPV00_S1X, ERFA_EPV00_S1Y, ERFA_EPV00_S1Z] as const
const CS2 = [ERFA_EPV00_S2X, ERFA_EPV00_S2Y, ERFA_EPV00_S2Z] as const

function nterms3(coeffs: readonly number[]): number {
  return coeffs.length / 3
}

function rotateEclipticToBcrs(
  x: number,
  y: number,
  z: number,
): readonly [number, number, number] {
  return [x + AM12 * y + AM13 * z, AM21 * x + AM22 * y + AM23 * z, AM32 * y + AM33 * z]
}

export type EraEpv00PvhPvb = {
  readonly pvh: readonly [readonly [number, number, number], readonly [number, number, number]]
  readonly pvb: readonly [readonly [number, number, number], readonly [number, number, number]]
}

/**
 * @returns status `0` = OK, `1` = warning (|t| > 100 Julian years from J2000, outside 1900–2100 AD model band).
 */
export function eraEpv00(date1: number, date2: number): { status: 0 | 1; pvh: EraEpv00PvhPvb['pvh']; pvb: EraEpv00PvhPvb['pvb'] } {
  const t = ((date1 - ERFA_DJ00) + date2) / ERFA_DJY
  const t2 = t * t
  const jstat: 0 | 1 = Math.abs(t) <= 100.0 ? 0 : 1

  const ph = [0, 0, 0]
  const vh = [0, 0, 0]
  const pb = [0, 0, 0]
  const vb = [0, 0, 0]

  const ne0 = CE0.map(nterms3)
  const ne1 = CE1.map(nterms3)
  const ne2 = CE2.map(nterms3)
  const ns0 = CS0.map(nterms3)
  const ns1 = CS1.map(nterms3)
  const ns2 = CS2.map(nterms3)

  for (let i = 0; i < 3; i += 1) {
    let xyz = 0.0
    let xyzd = 0.0

    let coeffs = CE0[i]
    let nterms = ne0[i]
    let idx = 0
    for (let j = 0; j < nterms; j += 1) {
      const a = coeffs[idx++]
      const b = coeffs[idx++]
      const c = coeffs[idx++]
      const p = b + c * t
      xyz += a * Math.cos(p)
      xyzd -= a * c * Math.sin(p)
    }

    coeffs = CE1[i]
    nterms = ne1[i]
    idx = 0
    for (let j = 0; j < nterms; j += 1) {
      const a = coeffs[idx++]
      const b = coeffs[idx++]
      const c = coeffs[idx++]
      const ct = c * t
      const p = b + ct
      const cp = Math.cos(p)
      xyz += a * t * cp
      xyzd += a * (cp - ct * Math.sin(p))
    }

    coeffs = CE2[i]
    nterms = ne2[i]
    idx = 0
    for (let j = 0; j < nterms; j += 1) {
      const a = coeffs[idx++]
      const b = coeffs[idx++]
      const c = coeffs[idx++]
      const ct = c * t
      const p = b + ct
      const cp = Math.cos(p)
      xyz += a * t2 * cp
      xyzd += a * t * (2.0 * cp - ct * Math.sin(p))
    }

    ph[i] = xyz
    vh[i] = xyzd / ERFA_DJY

    coeffs = CS0[i]
    nterms = ns0[i]
    idx = 0
    for (let j = 0; j < nterms; j += 1) {
      const a = coeffs[idx++]
      const b = coeffs[idx++]
      const c = coeffs[idx++]
      const p = b + c * t
      xyz += a * Math.cos(p)
      xyzd -= a * c * Math.sin(p)
    }

    coeffs = CS1[i]
    nterms = ns1[i]
    idx = 0
    for (let j = 0; j < nterms; j += 1) {
      const a = coeffs[idx++]
      const b = coeffs[idx++]
      const c = coeffs[idx++]
      const ct = c * t
      const p = b + ct
      const cp = Math.cos(p)
      xyz += a * t * cp
      xyzd += a * (cp - ct * Math.sin(p))
    }

    coeffs = CS2[i]
    nterms = ns2[i]
    idx = 0
    for (let j = 0; j < nterms; j += 1) {
      const a = coeffs[idx++]
      const b = coeffs[idx++]
      const c = coeffs[idx++]
      const ct = c * t
      const p = b + ct
      const cp = Math.cos(p)
      xyz += a * t2 * cp
      xyzd += a * t * (2.0 * cp - ct * Math.sin(p))
    }

    pb[i] = xyz
    vb[i] = xyzd / ERFA_DJY
  }

  const pvh0 = rotateEclipticToBcrs(ph[0], ph[1], ph[2])
  const pvh1 = rotateEclipticToBcrs(vh[0], vh[1], vh[2])
  const pvb0 = rotateEclipticToBcrs(pb[0], pb[1], pb[2])
  const pvb1 = rotateEclipticToBcrs(vb[0], vb[1], vb[2])

  return {
    status: jstat,
    pvh: [pvh0, pvh1],
    pvb: [pvb0, pvb1],
  }
}
