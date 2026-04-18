/**
 * ERFA `eraS06` — CIO locator s from CIP X,Y (IAU 2006 / 2000A). From `ext_src/erfa/erfa.c`.
 */

import { ERFA_DAS2R, ERFA_DJ00, ERFA_DJC } from './erfaConstants'
import {
  eraFae03,
  eraFaf03,
  eraFad03,
  eraFal03,
  eraFalp03,
  eraFaom03,
  eraFapa03,
  eraFave03,
} from './erfaFundamentalArguments'

type S06Term = {
  readonly nfa: readonly [number, number, number, number, number, number, number, number]
  readonly s: number
  readonly c: number
}

/* Polynomial coefficients for s + XY/2 (microarcseconds before DAS2R). */
const sp: readonly number[] = [94.0e-6, 3808.65e-6, -122.68e-6, -72574.11e-6, 27.98e-6, 15.62e-6]

const s0: readonly S06Term[] = [
  { nfa: [0, 0, 0, 0, 1, 0, 0, 0], s: -2640.73e-6, c: 0.39e-6 },
  { nfa: [0, 0, 0, 0, 2, 0, 0, 0], s: -63.53e-6, c: 0.02e-6 },
  { nfa: [0, 0, 2, -2, 3, 0, 0, 0], s: -11.75e-6, c: -0.01e-6 },
  { nfa: [0, 0, 2, -2, 1, 0, 0, 0], s: -11.21e-6, c: -0.01e-6 },
  { nfa: [0, 0, 2, -2, 2, 0, 0, 0], s: 4.57e-6, c: 0.0e-6 },
  { nfa: [0, 0, 2, 0, 3, 0, 0, 0], s: -2.02e-6, c: 0.0e-6 },
  { nfa: [0, 0, 2, 0, 1, 0, 0, 0], s: -1.98e-6, c: 0.0e-6 },
  { nfa: [0, 0, 0, 0, 3, 0, 0, 0], s: 1.72e-6, c: 0.0e-6 },
  { nfa: [0, 1, 0, 0, 1, 0, 0, 0], s: 1.41e-6, c: 0.01e-6 },
  { nfa: [0, 1, 0, 0, -1, 0, 0, 0], s: 1.26e-6, c: 0.01e-6 },
  { nfa: [1, 0, 0, 0, -1, 0, 0, 0], s: 0.63e-6, c: 0.0e-6 },
  { nfa: [1, 0, 0, 0, 1, 0, 0, 0], s: 0.63e-6, c: 0.0e-6 },
  { nfa: [0, 1, 2, -2, 3, 0, 0, 0], s: -0.46e-6, c: 0.0e-6 },
  { nfa: [0, 1, 2, -2, 1, 0, 0, 0], s: -0.45e-6, c: 0.0e-6 },
  { nfa: [0, 0, 4, -4, 4, 0, 0, 0], s: -0.36e-6, c: 0.0e-6 },
  { nfa: [0, 0, 1, -1, 1, -8, 12, 0], s: 0.24e-6, c: 0.12e-6 },
  { nfa: [0, 0, 2, 0, 0, 0, 0, 0], s: -0.32e-6, c: 0.0e-6 },
  { nfa: [0, 0, 2, 0, 2, 0, 0, 0], s: -0.28e-6, c: 0.0e-6 },
  { nfa: [1, 0, 2, 0, 3, 0, 0, 0], s: -0.27e-6, c: 0.0e-6 },
  { nfa: [1, 0, 2, 0, 1, 0, 0, 0], s: -0.26e-6, c: 0.0e-6 },
  { nfa: [0, 0, 2, -2, 0, 0, 0, 0], s: 0.21e-6, c: 0.0e-6 },
  { nfa: [0, 1, -2, 2, -3, 0, 0, 0], s: -0.19e-6, c: 0.0e-6 },
  { nfa: [0, 1, -2, 2, -1, 0, 0, 0], s: -0.18e-6, c: 0.0e-6 },
  { nfa: [0, 0, 0, 0, 0, 8, -13, -1], s: 0.1e-6, c: -0.05e-6 },
  { nfa: [0, 0, 0, 2, 0, 0, 0, 0], s: -0.15e-6, c: 0.0e-6 },
  { nfa: [2, 0, -2, 0, -1, 0, 0, 0], s: 0.14e-6, c: 0.0e-6 },
  { nfa: [0, 1, 2, -2, 2, 0, 0, 0], s: 0.14e-6, c: 0.0e-6 },
  { nfa: [1, 0, 0, -2, 1, 0, 0, 0], s: -0.14e-6, c: 0.0e-6 },
  { nfa: [1, 0, 0, -2, -1, 0, 0, 0], s: -0.14e-6, c: 0.0e-6 },
  { nfa: [0, 0, 4, -2, 4, 0, 0, 0], s: -0.13e-6, c: 0.0e-6 },
  { nfa: [0, 0, 2, -2, 4, 0, 0, 0], s: 0.11e-6, c: 0.0e-6 },
  { nfa: [1, 0, -2, 0, -3, 0, 0, 0], s: -0.11e-6, c: 0.0e-6 },
  { nfa: [1, 0, -2, 0, -1, 0, 0, 0], s: -0.11e-6, c: 0.0e-6 },
]

const s1: readonly S06Term[] = [
  { nfa: [0, 0, 0, 0, 2, 0, 0, 0], s: -0.07e-6, c: 3.57e-6 },
  { nfa: [0, 0, 0, 0, 1, 0, 0, 0], s: 1.73e-6, c: -0.03e-6 },
  { nfa: [0, 0, 2, -2, 3, 0, 0, 0], s: 0.0e-6, c: 0.48e-6 },
]

const s2: readonly S06Term[] = [
  { nfa: [0, 0, 0, 0, 1, 0, 0, 0], s: 743.52e-6, c: -0.17e-6 },
  { nfa: [0, 0, 2, -2, 2, 0, 0, 0], s: 56.91e-6, c: 0.06e-6 },
  { nfa: [0, 0, 2, 0, 2, 0, 0, 0], s: 9.84e-6, c: -0.01e-6 },
  { nfa: [0, 0, 0, 0, 2, 0, 0, 0], s: -8.85e-6, c: 0.01e-6 },
  { nfa: [0, 1, 0, 0, 0, 0, 0, 0], s: -6.38e-6, c: -0.05e-6 },
  { nfa: [1, 0, 0, 0, 0, 0, 0, 0], s: -3.07e-6, c: 0.0e-6 },
  { nfa: [0, 1, 2, -2, 2, 0, 0, 0], s: 2.23e-6, c: 0.0e-6 },
  { nfa: [0, 0, 2, 0, 1, 0, 0, 0], s: 1.67e-6, c: 0.0e-6 },
  { nfa: [1, 0, 2, 0, 2, 0, 0, 0], s: 1.3e-6, c: 0.0e-6 },
  { nfa: [0, 1, -2, 2, -2, 0, 0, 0], s: 0.93e-6, c: 0.0e-6 },
  { nfa: [1, 0, 0, -2, 0, 0, 0, 0], s: 0.68e-6, c: 0.0e-6 },
  { nfa: [0, 0, 2, -2, 1, 0, 0, 0], s: -0.55e-6, c: 0.0e-6 },
  { nfa: [1, 0, -2, 0, -2, 0, 0, 0], s: 0.53e-6, c: 0.0e-6 },
  { nfa: [0, 0, 0, 2, 0, 0, 0, 0], s: -0.27e-6, c: 0.0e-6 },
  { nfa: [1, 0, 0, 0, 1, 0, 0, 0], s: -0.27e-6, c: 0.0e-6 },
  { nfa: [1, 0, -2, -2, -2, 0, 0, 0], s: -0.26e-6, c: 0.0e-6 },
  { nfa: [1, 0, 0, 0, -1, 0, 0, 0], s: -0.25e-6, c: 0.0e-6 },
  { nfa: [1, 0, 2, 0, 1, 0, 0, 0], s: 0.22e-6, c: 0.0e-6 },
  { nfa: [2, 0, 0, -2, 0, 0, 0, 0], s: -0.21e-6, c: 0.0e-6 },
  { nfa: [2, 0, -2, 0, -1, 0, 0, 0], s: 0.2e-6, c: 0.0e-6 },
  { nfa: [0, 0, 2, 2, 2, 0, 0, 0], s: 0.17e-6, c: 0.0e-6 },
  { nfa: [2, 0, 2, 0, 2, 0, 0, 0], s: 0.13e-6, c: 0.0e-6 },
  { nfa: [2, 0, 0, 0, 0, 0, 0, 0], s: -0.13e-6, c: 0.0e-6 },
  { nfa: [1, 0, 2, -2, 2, 0, 0, 0], s: -0.12e-6, c: 0.0e-6 },
  { nfa: [0, 0, 2, 0, 0, 0, 0, 0], s: -0.11e-6, c: 0.0e-6 },
]

const s3: readonly S06Term[] = [
  { nfa: [0, 0, 0, 0, 1, 0, 0, 0], s: 0.3e-6, c: -23.42e-6 },
  { nfa: [0, 0, 2, -2, 2, 0, 0, 0], s: -0.03e-6, c: -1.46e-6 },
  { nfa: [0, 0, 2, 0, 2, 0, 0, 0], s: -0.01e-6, c: -0.25e-6 },
  { nfa: [0, 0, 0, 0, 2, 0, 0, 0], s: 0.0e-6, c: 0.23e-6 },
]

const s4: readonly S06Term[] = [{ nfa: [0, 0, 0, 0, 1, 0, 0, 0], s: -0.26e-6, c: -0.01e-6 }]

function sumTerms(terms: readonly S06Term[], fa: readonly number[], base: number): number {
  let w = base
  for (let i = terms.length - 1; i >= 0; i--) {
    const row = terms[i]
    let a = 0.0
    for (let j = 0; j < 8; j++) {
      a += row.nfa[j] * fa[j]
    }
    w += row.s * Math.sin(a) + row.c * Math.cos(a)
  }
  return w
}

/**
 * CIO locator s (radians), consistent with IAU 2006/2000A P/N and supplied CIP x,y.
 *
 * @param date1 date2 TT as two-part Julian Date (ERFA convention).
 */
export function eraS06(date1: number, date2: number, x: number, y: number): number {
  const t = (date1 - ERFA_DJ00 + date2) / ERFA_DJC
  const fa: number[] = [
    eraFal03(t),
    eraFalp03(t),
    eraFaf03(t),
    eraFad03(t),
    eraFaom03(t),
    eraFave03(t),
    eraFae03(t),
    eraFapa03(t),
  ]

  const w0 = sumTerms(s0, fa, sp[0]!)
  const w1 = sumTerms(s1, fa, sp[1]!)
  const w2 = sumTerms(s2, fa, sp[2]!)
  const w3 = sumTerms(s3, fa, sp[3]!)
  const w4 = sumTerms(s4, fa, sp[4]!)
  const w5 = sp[5]!

  const inner = w4 + w5 * t
  const s =
    (w0 + (w1 + (w2 + (w3 + inner * t) * t) * t) * t) * ERFA_DAS2R - (x * y) / 2.0
  return s
}
