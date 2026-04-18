/**
 * ERFA `eraAb`, `eraLd`, `eraLdsun` — Stellarium `frames.c` `astrometric_to_apparent` (distant sources).
 * Transcribed from `study/.../ext_src/erfa/erfa.c`.
 */

import { ERFA_SRS } from './erfaConstants'

function eraPdp(a: readonly [number, number, number], b: readonly [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function eraPxp(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  axb: [number, number, number],
): void {
  const xa = a[0]
  const ya = a[1]
  const za = a[2]
  const xb = b[0]
  const yb = b[1]
  const zb = b[2]
  axb[0] = ya * zb - za * yb
  axb[1] = za * xb - xa * zb
  axb[2] = xa * yb - ya * xb
}

/** Light deflection by a solar-system body (`eraLd`). */
export function eraLd(
  bm: number,
  p: readonly [number, number, number],
  q: readonly [number, number, number],
  e: readonly [number, number, number],
  em: number,
  dlim: number,
  p1: [number, number, number],
): void {
  const qpe: [number, number, number] = [q[0] + e[0], q[1] + e[1], q[2] + e[2]]
  const qdqpe = eraPdp(q, qpe)
  const w = (bm * ERFA_SRS) / em / Math.max(qdqpe, dlim)
  const eq: [number, number, number] = [0, 0, 0]
  const peq: [number, number, number] = [0, 0, 0]
  eraPxp(e, q, eq)
  eraPxp(p, eq, peq)
  p1[0] = p[0] + w * peq[0]
  p1[1] = p[1] + w * peq[1]
  p1[2] = p[2] + w * peq[2]
}

/** Deflection of starlight by the Sun (`eraLdsun`). */
export function eraLdsun(
  p: readonly [number, number, number],
  e: readonly [number, number, number],
  em: number,
  p1: [number, number, number],
): void {
  let em2 = em * em
  if (em2 < 1.0) {
    em2 = 1.0
  }
  const dlim = 1e-6 / (em2 > 1.0 ? em2 : 1.0)
  eraLd(1.0, p, p, e, em, dlim, p1)
}

/** Annual aberration: natural → proper direction (`eraAb`). */
export function eraAb(
  pnat: readonly [number, number, number],
  v: readonly [number, number, number],
  s: number,
  bm1: number,
  ppr: [number, number, number],
): void {
  const pdv = eraPdp(pnat, v)
  const w1 = 1.0 + pdv / (1.0 + bm1)
  const w2 = ERFA_SRS / s
  let r2 = 0.0
  const p: [number, number, number] = [0, 0, 0]
  for (let i = 0; i < 3; i += 1) {
    const w = pnat[i] * bm1 + w1 * v[i] + w2 * (v[i] - pdv * pnat[i])
    p[i] = w
    r2 += w * w
  }
  const r = Math.sqrt(r2)
  for (let i = 0; i < 3; i += 1) {
    ppr[i] = p[i] / r
  }
}

/** Inputs needed from `EraAstrom` for distant-object apparent direction (Stellarium `astrometric_to_apparent`, `inf`). */
export type EraAstromApparentSlice = {
  readonly eh: readonly [number, number, number]
  readonly em: number
  readonly v: readonly [number, number, number]
  readonly bm1: number
}

/**
 * Stellarium `frames.c` `astrometric_to_apparent` when `inf` is true: `eraLdsun` then `eraAb`.
 * `icrsUnit` must be a unit 3-vector (BCRS natural direction).
 */
export function stellariumAstrometricToApparentIcrsUnit(
  astrom: EraAstromApparentSlice,
  icrsUnit: readonly [number, number, number],
): readonly [number, number, number] {
  const p: [number, number, number] = [icrsUnit[0], icrsUnit[1], icrsUnit[2]]
  eraLdsun(p, astrom.eh, astrom.em, p)
  eraAb(p, astrom.v, astrom.em, astrom.bm1, p)
  return p
}
