/**
 * ERFA `eraBpn2xy` — CIP X,Y from bias-precession-nutation matrix (bottom row).
 * Transcribed from `ext_src/erfa/erfa.c`.
 */

import type { MutableMatrix3 } from './erfaIau2006'

export type ErfaMatrix3 =
  | MutableMatrix3
  | readonly [
      readonly [number, number, number],
      readonly [number, number, number],
      readonly [number, number, number],
    ]

/** Celestial Intermediate Pole X,Y in GCRS radians. */
export function eraBpn2xy(rbpn: ErfaMatrix3, out: { x: number; y: number } = { x: 0, y: 0 }): { x: number; y: number } {
  out.x = rbpn[2][0]
  out.y = rbpn[2][1]
  return out
}
