/**
 * ERFA `eraApco` and dependencies used by Stellarium `observer_update_full` (`observer.c`).
 * Transcribed from `study/.../ext_src/erfa/erfa.c` (`eraApco`, `eraC2ixys`, `eraAper`, `eraPvtob`,
 * `eraTrxpv`, `eraPom00`, `eraTrxp`, `eraGd2gc`, `eraGd2gce`, `eraEform`, matrix helpers).
 */

import { ERFA_D2PI, ERFA_DAYSEC } from './erfaConstants'
import { eraApcs, type EraAstromApcsPartial } from './erfaApcs'
import type { MutableMatrix3 } from './erfaIau2006'
import { identityMatrix3 } from './erfaIau2006'

/** ERFA `eraASTROM` fields populated by `eraApco` (Hub mirror of `erfa.h`). */
export type EraAstrom = EraAstromApcsPartial & {
  along: number
  /** Geodetic latitude (radians); set from caller `phi` for Hub seam (C leaves unset). */
  phi: number
  xpl: number
  ypl: number
  sphi: number
  cphi: number
  diurab: number
  eral: number
  refa: number
  refb: number
}

type Pv2 = readonly [readonly [number, number, number], readonly [number, number, number]]

const ERFA_WGS84 = 1

function eraIr(r: MutableMatrix3): void {
  r[0][0] = 1.0
  r[0][1] = 0.0
  r[0][2] = 0.0
  r[1][0] = 0.0
  r[1][1] = 1.0
  r[1][2] = 0.0
  r[2][0] = 0.0
  r[2][1] = 0.0
  r[2][2] = 1.0
}

function eraCr(src: MutableMatrix3, dst: MutableMatrix3): void {
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      dst[i][j] = src[i][j]
    }
  }
}

function eraRz(psi: number, r: MutableMatrix3): void {
  const s = Math.sin(psi)
  const c = Math.cos(psi)
  const a00 = c * r[0][0] + s * r[1][0]
  const a01 = c * r[0][1] + s * r[1][1]
  const a02 = c * r[0][2] + s * r[1][2]
  const a10 = -s * r[0][0] + c * r[1][0]
  const a11 = -s * r[0][1] + c * r[1][1]
  const a12 = -s * r[0][2] + c * r[1][2]
  r[0][0] = a00
  r[0][1] = a01
  r[0][2] = a02
  r[1][0] = a10
  r[1][1] = a11
  r[1][2] = a12
}

function eraRy(theta: number, r: MutableMatrix3): void {
  const s = Math.sin(theta)
  const c = Math.cos(theta)
  const a00 = c * r[0][0] - s * r[2][0]
  const a01 = c * r[0][1] - s * r[2][1]
  const a02 = c * r[0][2] - s * r[2][2]
  const a20 = s * r[0][0] + c * r[2][0]
  const a21 = s * r[0][1] + c * r[2][1]
  const a22 = s * r[0][2] + c * r[2][2]
  r[0][0] = a00
  r[0][1] = a01
  r[0][2] = a02
  r[2][0] = a20
  r[2][1] = a21
  r[2][2] = a22
}

function eraRx(phi: number, r: MutableMatrix3): void {
  const s = Math.sin(phi)
  const c = Math.cos(phi)
  const a10 = c * r[1][0] + s * r[2][0]
  const a11 = c * r[1][1] + s * r[2][1]
  const a12 = c * r[1][2] + s * r[2][2]
  const a20 = -s * r[1][0] + c * r[2][0]
  const a21 = -s * r[1][1] + c * r[2][1]
  const a22 = -s * r[1][2] + c * r[2][2]
  r[1][0] = a10
  r[1][1] = a11
  r[1][2] = a12
  r[2][0] = a20
  r[2][1] = a21
  r[2][2] = a22
}

/** Celestial-to-intermediate matrix from CIP X,Y and CIO locator `s` (`eraC2ixys`). */
export function eraC2ixys(x: number, y: number, s: number, rc2i: MutableMatrix3): void {
  const r2 = x * x + y * y
  const e = r2 > 0.0 ? Math.atan2(y, x) : 0.0
  const d = Math.atan(Math.sqrt(r2 / (1.0 - r2)))
  eraIr(rc2i)
  eraRz(e, rc2i)
  eraRy(d, rc2i)
  eraRz(-(e + s), rc2i)
}

export function eraAper(theta: number, astrom: Pick<EraAstrom, 'along' | 'eral'>): void {
  astrom.eral = theta + astrom.along
}

function eraRxp(r: MutableMatrix3, p: readonly [number, number, number], rp: [number, number, number]): void {
  for (let j = 0; j < 3; j += 1) {
    let w = 0.0
    for (let i = 0; i < 3; i += 1) {
      w += r[j][i] * p[i]
    }
    rp[j] = w
  }
}

function eraRxpv(r: MutableMatrix3, pv: Pv2, rpv: [[number, number, number], [number, number, number]]): void {
  eraRxp(r, pv[0], rpv[0])
  eraRxp(r, pv[1], rpv[1])
}

function eraTr(r: MutableMatrix3, rt: MutableMatrix3): void {
  const wm: MutableMatrix3 = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      wm[i][j] = r[j][i]
    }
  }
  eraCr(wm, rt)
}

function eraTrxpv(r: MutableMatrix3, pv: Pv2, trpv: [[number, number, number], [number, number, number]]): void {
  const tr: MutableMatrix3 = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]
  eraTr(r, tr)
  eraRxpv(tr, pv, trpv)
}

function eraEform(n: number): { status: number; a: number; f: number } {
  switch (n) {
    case ERFA_WGS84:
      return { status: 0, a: 6378137.0, f: 1.0 / 298.257223563 }
    case 2:
      return { status: 0, a: 6378137.0, f: 1.0 / 298.257222101 }
    case 3:
      return { status: 0, a: 6378135.0, f: 1.0 / 298.26 }
    default:
      return { status: -1, a: 0.0, f: 0.0 }
  }
}

function eraGd2gce(
  a: number,
  f: number,
  elong: number,
  phi: number,
  height: number,
  xyz: [number, number, number],
): number {
  const sp = Math.sin(phi)
  const cp = Math.cos(phi)
  let w = 1.0 - f
  w *= w
  const d = cp * cp + w * sp * sp
  if (d <= 0.0) {
    return -1
  }
  const ac = a / Math.sqrt(d)
  const as = w * ac
  const r = (ac + height) * cp
  xyz[0] = r * Math.cos(elong)
  xyz[1] = r * Math.sin(elong)
  xyz[2] = (as + height) * sp
  return 0
}

function eraZpP(xyz: [number, number, number]): void {
  xyz[0] = 0.0
  xyz[1] = 0.0
  xyz[2] = 0.0
}

function eraGd2gc(n: number, elong: number, phi: number, height: number, xyz: [number, number, number]): number {
  const ef = eraEform(n)
  if (ef.status !== 0) {
    eraZpP(xyz)
    return ef.status
  }
  let j = eraGd2gce(ef.a, ef.f, elong, phi, height, xyz)
  if (j !== 0) {
    j = -2
  }
  if (j !== 0) {
    eraZpP(xyz)
  }
  return j
}

/** Polar motion matrix (`eraPom00`). */
export function eraPom00(xp: number, yp: number, sp: number, rpom: MutableMatrix3): void {
  eraIr(rpom)
  eraRz(sp, rpom)
  eraRy(-xp, rpom)
  eraRx(-yp, rpom)
}

function eraTrxp(r: MutableMatrix3, p: readonly [number, number, number], trp: [number, number, number]): void {
  const tr: MutableMatrix3 = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]
  eraTr(r, tr)
  eraRxp(tr, p, trp)
}

/** Terrestrial station PV in CIRS (`eraPvtob`). */
export function eraPvtob(
  elong: number,
  phi: number,
  hm: number,
  xp: number,
  yp: number,
  sp: number,
  theta: number,
  pv: [[number, number, number], [number, number, number]],
): void {
  const OM = (1.00273781191135448 * ERFA_D2PI) / ERFA_DAYSEC
  const xyzm: [number, number, number] = [0, 0, 0]
  void eraGd2gc(ERFA_WGS84, elong, phi, hm, xyzm)
  const rpm: MutableMatrix3 = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]
  eraPom00(xp, yp, sp, rpm)
  const xyz: [number, number, number] = [0, 0, 0]
  eraTrxp(rpm, xyzm, xyz)
  const x = xyz[0]
  const y = xyz[1]
  const z = xyz[2]
  const s = Math.sin(theta)
  const c = Math.cos(theta)
  pv[0][0] = c * x - s * y
  pv[0][1] = s * x + c * y
  pv[0][2] = z
  pv[1][0] = OM * (-s * x - c * y)
  pv[1][1] = OM * (c * x - s * y)
  pv[1][2] = 0.0
}

function emptyAstrom(): EraAstrom {
  const z: [number, number, number] = [0, 0, 0]
  return {
    pmt: 0,
    eb: [0, 0, 0],
    eh: [0, 0, 0],
    em: 0,
    v: [0, 0, 0],
    bm1: 0,
    bpn: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
    along: 0,
    phi: 0,
    xpl: 0,
    ypl: 0,
    sphi: 0,
    cphi: 0,
    diurab: 0,
    eral: 0,
    refa: 0,
    refb: 0,
  }
}

/**
 * Star-independent astrometry for a terrestrial observer (`eraApco`).
 * `ebpv`: barycentric Earth PV (AU, AU/day); `ehp`: heliocentric Earth position (AU); `theta`: ERA (rad).
 */
export function eraApco(
  date1: number,
  date2: number,
  ebpv: Pv2,
  ehp: readonly [number, number, number],
  x: number,
  y: number,
  s: number,
  theta: number,
  elong: number,
  phi: number,
  hm: number,
  xp: number,
  yp: number,
  sp: number,
  refa: number,
  refb: number,
): EraAstrom {
  const astrom = emptyAstrom()
  astrom.along = elong + sp
  const sl = Math.sin(astrom.along)
  const cl = Math.cos(astrom.along)
  astrom.xpl = xp * cl - yp * sl
  astrom.ypl = xp * sl + yp * cl
  astrom.sphi = Math.sin(phi)
  astrom.cphi = Math.cos(phi)
  astrom.refa = refa
  astrom.refb = refb
  astrom.phi = phi

  eraAper(theta, astrom)
  astrom.diurab = 0.0

  const r = identityMatrix3()
  eraC2ixys(x, y, s, r)

  const pvc: [[number, number, number], [number, number, number]] = [
    [0, 0, 0],
    [0, 0, 0],
  ]
  eraPvtob(elong, phi, hm, xp, yp, sp, theta, pvc)

  const pv: [[number, number, number], [number, number, number]] = [
    [0, 0, 0],
    [0, 0, 0],
  ]
  eraTrxpv(r, pvc, pv)

  eraApcs(date1, date2, pv, ebpv, ehp, astrom)
  eraCr(r, astrom.bpn)

  return astrom
}
