/**
 * ERFA `eraStarpv` — convert star catalogue parameters (ICRS spherical
 * position, proper motions, parallax, radial velocity) to a pv-vector
 * (BCRS position + velocity, AU, AU/day) at catalogue epoch.
 *
 * Faithful port of ERFA 1.7 `src/starpv.c`
 * (`Stellarium/stellarium-web-engine` pinned commit `63fb3279…`
 * consumes this via `src/modules/stars.c::compute_pv`).
 *
 * Input conventions (identical to ERFA):
 *   - `pmr` is dRA/dt in radians/year (NOT `pmRA * cos(dec)`).
 *   - `pmd` is dDec/dt in radians/year.
 *   - `px`  is parallax in arcseconds.
 *   - `rv`  is radial velocity in km/s (positive = receding).
 *
 * `iwarn` bitmask mirrors ERFA: bit 0 = px below `PXMIN`, bit 1 = speed
 * clamped, bit 2 = relativistic iteration failed to converge.
 */
import {
  ERFA_CMPS,
  ERFA_DAU,
  ERFA_DAYSEC,
  ERFA_DJY,
  ERFA_DR2AS,
} from './erfaConstants'

const PXMIN = 1e-7
const VELMAX = 0.5
const IMAX = 100
const DC_AU_PER_DAY = (ERFA_DAYSEC * ERFA_CMPS) / ERFA_DAU

export type EraPv = [
  [number, number, number],
  [number, number, number],
]

export interface EraStarpvResult {
  pv: EraPv
  iwarn: number
}

function eraS2pv(
  theta: number,
  phi: number,
  r: number,
  td: number,
  pd: number,
  rd: number,
): EraPv {
  const st = Math.sin(theta)
  const ct = Math.cos(theta)
  const sp = Math.sin(phi)
  const cp = Math.cos(phi)
  const rcp = r * cp
  const x = rcp * ct
  const y = rcp * st
  const rpd = r * pd
  const w = rpd * sp - cp * rd

  return [
    [x, y, r * sp],
    [-y * td - w * ct, x * td - w * st, rpd * cp + sp * rd],
  ]
}

export function eraStarpv(
  ra: number,
  dec: number,
  pmr: number,
  pmd: number,
  px: number,
  rv: number,
): EraStarpvResult {
  let iwarn = 0
  let w: number
  if (px >= PXMIN) {
    w = px
  } else {
    w = PXMIN
    iwarn |= 1
  }

  const r = ERFA_DR2AS / w
  const rd = (ERFA_DAYSEC * rv * 1e3) / ERFA_DAU
  const rad = pmr / ERFA_DJY
  const decd = pmd / ERFA_DJY

  const pv = eraS2pv(ra, dec, r, rad, decd, rd)

  const v = Math.hypot(pv[1][0], pv[1][1], pv[1][2])
  if (v / DC_AU_PER_DAY > VELMAX) {
    pv[1][0] = 0
    pv[1][1] = 0
    pv[1][2] = 0
    iwarn |= 2
  }

  const pmag = Math.hypot(pv[0][0], pv[0][1], pv[0][2])
  const xhat: [number, number, number] = pmag === 0
    ? [0, 0, 0]
    : [pv[0][0] / pmag, pv[0][1] / pmag, pv[0][2] / pmag]

  const vsr =
    xhat[0] * pv[1][0] + xhat[1] * pv[1][1] + xhat[2] * pv[1][2]
  const usr: [number, number, number] = [
    vsr * xhat[0],
    vsr * xhat[1],
    vsr * xhat[2],
  ]
  const ust: [number, number, number] = [
    pv[1][0] - usr[0],
    pv[1][1] - usr[1],
    pv[1][2] - usr[2],
  ]
  const vst = Math.hypot(ust[0], ust[1], ust[2])

  const betsr = vsr / DC_AU_PER_DAY
  const betst = vst / DC_AU_PER_DAY

  let bett = betst
  let betr = betsr
  let d = 0
  let del = 0
  let odd = 0
  let oddel = 0
  let od = 0
  let odel = 0
  let i = 0
  for (; i < IMAX; i++) {
    d = 1.0 + betr
    const w2 = betr * betr + bett * bett
    del = -w2 / (Math.sqrt(1.0 - w2) + 1.0)
    betr = d * betsr + del
    bett = d * betst
    if (i > 0) {
      const dd = Math.abs(d - od)
      const ddel = Math.abs(del - odel)
      if (i > 1 && dd >= odd && ddel >= oddel) {
        break
      }
      odd = dd
      oddel = ddel
    }
    od = d
    odel = del
  }
  if (i >= IMAX) {
    iwarn |= 4
  }

  const ut: [number, number, number] = [d * ust[0], d * ust[1], d * ust[2]]
  const urScale = DC_AU_PER_DAY * (d * betsr + del)
  const ur: [number, number, number] = [
    urScale * xhat[0],
    urScale * xhat[1],
    urScale * xhat[2],
  ]
  pv[1][0] = ur[0] + ut[0]
  pv[1][1] = ur[1] + ut[1]
  pv[1][2] = ur[2] + ut[2]

  return { pv, iwarn }
}

/**
 * ERFA `eraEpb2jd` — Besselian Epoch to JD (returns two-part form).
 * Faithful port of ERFA 1.7 `src/epb2jd.c`. Used by Stellarium
 * `stars.c::compute_pv` to propagate catalogue-epoch to J2000.0.
 */
export function eraEpb2jd(epb: number): { djm0: number; djm: number } {
  return {
    djm0: 2400000.5,
    djm: 15019.81352 + (epb - 1900.0) * 365.242198781,
  }
}
