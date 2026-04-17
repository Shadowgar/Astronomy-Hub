/**
 * IAU 2006 bias-precession and ecliptic matrix (ERFA `eraObl06`, `eraPfw06`, `eraFw2m`,
 * `eraPmat06`, `eraEcm06`) — literal transcription of `ext_src/erfa/erfa.c`.
 */

import { ERFA_DAS2R, ERFA_DJC, ERFA_DJ00 } from './erfaConstants'

export type MutableMatrix3 = [[number, number, number], [number, number, number], [number, number, number]]

export function identityMatrix3(): MutableMatrix3 {
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]
}

/** Standard row-major: (ab)[i][j] = sum_k a[i][k]*b[k][j] — matches ERFA `eraRxr`. */
export function multiplyMatrix3Erfa(a: MutableMatrix3, b: MutableMatrix3): MutableMatrix3 {
  const out: MutableMatrix3 = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      let w = 0
      for (let k = 0; k < 3; k += 1) {
        w += a[i][k] * b[k][j]
      }
      out[i][j] = w
    }
  }
  return out
}

export function transposeMatrix3(m: MutableMatrix3): MutableMatrix3 {
  return [
    [m[0][0], m[1][0], m[2][0]],
    [m[0][1], m[1][1], m[2][1]],
    [m[0][2], m[1][2], m[2][2]],
  ]
}

function rotationX(phi: number): MutableMatrix3 {
  const c = Math.cos(phi)
  const s = Math.sin(phi)
  return [
    [1, 0, 0],
    [0, c, s],
    [0, -s, c],
  ]
}

function rotationZ(psi: number): MutableMatrix3 {
  const c = Math.cos(psi)
  const s = Math.sin(psi)
  return [
    [c, s, 0],
    [-s, c, 0],
    [0, 0, 1],
  ]
}

export function eraObl06(date1: number, date2: number) {
  const t = (date1 - ERFA_DJ00 + date2) / ERFA_DJC
  const a = -0.0000000434 * t
  const b = (-0.000000576 + a) * t
  const c = (0.0020034 + b) * t
  const d = (-0.0001831 + c) * t
  const e = (-46.836769 + d) * t
  return (84381.406 + e) * ERFA_DAS2R
}

export function eraPfw06(date1: number, date2: number) {
  const t = (date1 - ERFA_DJ00 + date2) / ERFA_DJC
  const gamb =
    (-0.052928 +
      (10.556378 +
        (0.4932044 + (-0.00031238 + (-0.000002788 + 0.000000026 * t) * t) * t) * t) *
        t) *
    ERFA_DAS2R
  const phib =
    (84381.412819 +
      (-46.811016 +
        (0.0511268 +
          (0.00053289 + (-0.00000044 + -0.0000000176 * t) * t) * t) *
          t) *
        t) *
    ERFA_DAS2R
  const psib =
    (-0.041775 +
      (5038.481484 +
        (1.5584175 + (-0.00018522 + (-0.000026452 + -0.0000000148 * t) * t) * t) * t) *
        t) *
    ERFA_DAS2R
  const epsa = eraObl06(date1, date2)
  return { gamb, phib, psib, epsa }
}

/** Fukushima–Williams bias × precession matrix (IAU 2006). */
export function eraFw2m(gamb: number, phib: number, psi: number, eps: number): MutableMatrix3 {
  let r = rotationZ(gamb)
  r = multiplyMatrix3Erfa(rotationX(phib), r)
  r = multiplyMatrix3Erfa(rotationZ(-psi), r)
  r = multiplyMatrix3Erfa(rotationX(-eps), r)
  return r
}

export function eraPmat06(date1: number, date2: number): MutableMatrix3 {
  const { gamb, phib, psib, epsa } = eraPfw06(date1, date2)
  return eraFw2m(gamb, phib, psib, epsa)
}

/**
 * ICRS equatorial to ecliptic rotation matrix (IAU 2006), ERFA `eraEcm06`.
 * Same sense as Stellarium `update_matrices` input to `mat3_invert` / naming in `observer.h`.
 */
export function eraEcm06(date1: number, date2: number): MutableMatrix3 {
  const ob = eraObl06(date1, date2)
  const bp = eraPmat06(date1, date2)
  const e = rotationX(ob)
  return multiplyMatrix3Erfa(e, bp)
}

export function eraEcm06FromTtJulianDate(ttJd: number): MutableMatrix3 {
  return eraEcm06(2400000.5, ttJd - 2400000.5)
}

/** ICRS → ecliptic (of-date); inverse is transpose for rotations. */
export function icrsToEclipticMatrixFromTt(ttJd: number): MutableMatrix3 {
  return eraEcm06FromTtJulianDate(ttJd)
}

export function eclipticToIcrsMatrixFromTt(ttJd: number): MutableMatrix3 {
  return transposeMatrix3(eraEcm06FromTtJulianDate(ttJd))
}
