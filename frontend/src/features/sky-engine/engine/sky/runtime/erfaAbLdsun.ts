/**
 * ERFA `eraAb`, `eraLd`, `eraLdsun` — Stellarium `frames.c` `astrometric_to_apparent` / `apparent_to_astrometric` (distant sources).
 * Transcribed from `study/.../ext_src/erfa/erfa.c`.
 */

import type { EraAstrom } from './erfaApco'
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

function normalizeTuple3(t: readonly [number, number, number]): [number, number, number] {
  const n = Math.hypot(t[0], t[1], t[2])
  if (n === 0) {
    return [0, 0, 1]
  }
  return [t[0] / n, t[1] / n, t[2] / n]
}

/** Stellarium `frames.c` `apparent_to_astrometric` for `inf` (fixed-point iteration). */
export function stellariumApparentGcrsToAstrometricIcrsUnit(
  astrom: EraAstromApparentSlice,
  apparentGcrsUnit: readonly [number, number, number],
): readonly [number, number, number] {
  const inp = normalizeTuple3(apparentGcrsUnit)
  let a: [number, number, number] = [inp[0], inp[1], inp[2]]
  const tol = Math.cos((0.001 / 3600) * (Math.PI / 180))
  for (let i = 0; i < 10; i += 1) {
    const bRaw = stellariumAstrometricToApparentIcrsUnit(astrom, a)
    const bN = normalizeTuple3(bRaw)
    const delta: [number, number, number] = [bN[0] - inp[0], bN[1] - inp[1], bN[2] - inp[2]]
    a = normalizeTuple3([a[0] - delta[0], a[1] - delta[1], a[2] - delta[2]])
    const dot = bN[0] * inp[0] + bN[1] * inp[1] + bN[2] * inp[2]
    if (dot > tol) {
      break
    }
  }
  return a
}

/** CIO `bpn` + aberration slice for `convertObserverFrameVector` (`frames.c`). */
export type StellariumFrameAstrometry = EraAstromApparentSlice & {
  readonly bpn: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
    readonly [number, number, number],
  ]
}

export function stellariumFrameAstrometryFromEraAstrom(ast: EraAstrom): StellariumFrameAstrometry {
  return {
    eh: [ast.eh[0], ast.eh[1], ast.eh[2]],
    em: ast.em,
    v: [ast.v[0], ast.v[1], ast.v[2]],
    bm1: ast.bm1,
    bpn: [
      [ast.bpn[0][0], ast.bpn[0][1], ast.bpn[0][2]],
      [ast.bpn[1][0], ast.bpn[1][1], ast.bpn[1][2]],
      [ast.bpn[2][0], ast.bpn[2][1], ast.bpn[2][2]],
    ],
  }
}
