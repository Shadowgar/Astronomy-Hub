/**
 * ERFA `eraEors` — equation of the origins from classical NPB matrix and CIO locator s.
 * Wallace & Capitaine (2006). From `ext_src/erfa/erfa.c`.
 */

import type { ErfaMatrix3 } from './erfaBpn2xy'

export function eraEors(rnpb: ErfaMatrix3, s: number): number {
  const x = rnpb[2][0]
  const ax = x / (1.0 + rnpb[2][2])
  const xs = 1.0 - ax * x
  const ys = -ax * rnpb[2][1]
  const zs = -x
  const p = rnpb[0][0] * xs + rnpb[0][1] * ys + rnpb[0][2] * zs
  const q = rnpb[1][0] * xs + rnpb[1][1] * ys + rnpb[1][2] * zs
  return p !== 0 || q !== 0 ? s - Math.atan2(q, p) : s
}
