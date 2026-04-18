/**
 * ERFA `eraApcs` — star-independent astrometry for ICRS↔GCRS (observer geocentric PV known).
 * Transcribed from `study/.../ext_src/erfa/erfa.c`.
 */

import { ERFA_AULT, ERFA_DAU, ERFA_DAYSEC, ERFA_DJ00, ERFA_DJY } from './erfaConstants'
import type { MutableMatrix3 } from './erfaIau2006'
import { identityMatrix3 } from './erfaIau2006'

/** Subset of `eraASTROM` filled by `eraApcs` (other fields unchanged by this routine in C). */
export type EraAstromApcsPartial = {
  pmt: number
  eb: [number, number, number]
  eh: [number, number, number]
  em: number
  v: [number, number, number]
  bm1: number
  bpn: MutableMatrix3
}

function eraCp(p: readonly [number, number, number]): [number, number, number] {
  return [p[0], p[1], p[2]]
}

function eraZp(): [number, number, number] {
  return [0, 0, 0]
}

function eraPm(p: readonly [number, number, number]): number {
  return Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2])
}

function eraSxp(s: number, p: readonly [number, number, number]): [number, number, number] {
  return [s * p[0], s * p[1], s * p[2]]
}

/** Modulus and unit vector (`eraPn`). */
function eraPn(p: readonly [number, number, number]): { r: number; u: [number, number, number] } {
  const w = eraPm(p)
  if (w === 0.0) {
    return { r: w, u: eraZp() }
  }
  return { r: w, u: eraSxp(1.0 / w, p) }
}

type Pv2 = readonly [readonly [number, number, number], readonly [number, number, number]]

/**
 * @param astrom — only `along`…`refb` need pre-exist if chaining; this function overwrites
 *   `pmt`, `eb`, `eh`, `em`, `v`, `bm1`, `bpn` per ERFA.
 */
export function eraApcs(
  date1: number,
  date2: number,
  pv: Pv2,
  ebpv: Pv2,
  ehp: readonly [number, number, number],
  astrom: EraAstromApcsPartial,
): void {
  const AUDMS = ERFA_DAU / ERFA_DAYSEC
  const CR = ERFA_AULT / ERFA_DAYSEC

  astrom.pmt = (date1 - ERFA_DJ00 + date2) / ERFA_DJY

  const pb: [number, number, number] = [0, 0, 0]
  const vb: [number, number, number] = [0, 0, 0]
  const ph: [number, number, number] = [0, 0, 0]

  for (let i = 0; i < 3; i += 1) {
    const dp = pv[0][i] / ERFA_DAU
    const dv = pv[1][i] / AUDMS
    pb[i] = ebpv[0][i] + dp
    vb[i] = ebpv[1][i] + dv
    ph[i] = ehp[i] + dp
  }

  astrom.eb = eraCp(pb)

  const { r: em, u: eh } = eraPn(ph)
  astrom.em = em
  astrom.eh = eh

  let v2 = 0.0
  for (let i = 0; i < 3; i += 1) {
    const w = vb[i] * CR
    astrom.v[i] = w
    v2 += w * w
  }
  astrom.bm1 = Math.sqrt(1.0 - v2)

  astrom.bpn = identityMatrix3()
}
