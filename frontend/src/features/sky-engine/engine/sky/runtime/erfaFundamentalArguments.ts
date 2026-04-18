/**
 * ERFA fundamental arguments `eraFa*03` (IERS 2003) — literal subset needed by
 * `eraNut00a` / planetary nutation. Transcribed from `ext_src/erfa/erfa.c`.
 */

import { ERFA_D2PI, ERFA_DAS2R, ERFA_TURNAS } from './erfaConstants'

function cFmod(x: number, y: number): number {
  return x - y * Math.trunc(x / y)
}

export function eraFal03(t: number): number {
  const a = cFmod(
    485868.249036 +
      t * (1717915923.2178 + t * (31.8792 + t * (0.051635 + t * -0.0002447))),
    ERFA_TURNAS,
  )
  return a * ERFA_DAS2R
}

/** Mean anomaly of the Sun, IERS 2003 (for `eraS06` and nutation). */
export function eraFalp03(t: number): number {
  const a = cFmod(
    1287104.793048 +
      t * (129596581.0481 + t * (-0.5532 + t * (0.000136 + t * -0.00001149))),
    ERFA_TURNAS,
  )
  return a * ERFA_DAS2R
}

export function eraFaf03(t: number): number {
  const a = cFmod(
    335779.526232 +
      t * (1739527262.8478 + t * (-12.7512 + t * (-0.001037 + t * 0.00000417))),
    ERFA_TURNAS,
  )
  return a * ERFA_DAS2R
}

/** Mean elongation of the Moon from the Sun, IERS 2003 (`eraS06`, nutation). */
export function eraFad03(t: number): number {
  const a = cFmod(
    1072260.703692 +
      t * (1602961601.209 + t * (-6.3706 + t * (0.006593 + t * -0.00003169))),
    ERFA_TURNAS,
  )
  return a * ERFA_DAS2R
}

export function eraFaom03(t: number): number {
  const a = cFmod(
    450160.398036 +
      t * (-6962890.5431 + t * (7.4722 + t * (0.007702 + t * -0.00005939))),
    ERFA_TURNAS,
  )
  return a * ERFA_DAS2R
}

export function eraFae03(t: number): number {
  return cFmod(1.753470314 + 628.3075849991 * t, ERFA_D2PI)
}

export function eraFame03(t: number): number {
  return cFmod(4.402608842 + 2608.7903141574 * t, ERFA_D2PI)
}

export function eraFave03(t: number): number {
  return cFmod(3.176146697 + 1021.3285546211 * t, ERFA_D2PI)
}

export function eraFama03(t: number): number {
  return cFmod(6.203480913 + 334.06124267 * t, ERFA_D2PI)
}

export function eraFaju03(t: number): number {
  return cFmod(0.599546497 + 52.9690962641 * t, ERFA_D2PI)
}

export function eraFasa03(t: number): number {
  return cFmod(0.874016757 + 21.329910496 * t, ERFA_D2PI)
}

export function eraFaur03(t: number): number {
  return cFmod(5.481293872 + 7.4781598567 * t, ERFA_D2PI)
}

export function eraFapa03(t: number): number {
  return (0.02438175 + 0.00000538691 * t) * t
}
