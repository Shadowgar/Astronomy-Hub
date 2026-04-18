/**
 * Subset of ERFA/SOFA Earth rotation (Stellarium `ext_src/erfa/erfa.c` `eraEra00`, `eraAnp`).
 * Used for `astrom->eral = theta + along` before full `eraApco` port.
 */

import { ERFA_DAS2R, ERFA_DJC, ERFA_D2PI, ERFA_DJ00 } from './erfaConstants'

/** ERFA / SOFA two-part JD reference `DJM0` (JD − 2400000.5 = MJD). */
const ERFA_DJM0 = 2400000.5

/**
 * IERS 2000 precession adjustment (radians), `eraSp00`.
 * Two-part TT Julian date should satisfy `date1 + date2` = TT JD (same split as `eraPnm06a` / `eraS06`).
 */
export function eraSp00(date1: number, date2: number) {
  const t = ((date1 - ERFA_DJ00) + date2) / ERFA_DJC
  return -47e-6 * t * ERFA_DAS2R
}

function eraAnp(angle: number) {
  let w = angle % ERFA_D2PI
  if (w < 0) {
    w += ERFA_D2PI
  }
  return w
}

/**
 * Earth rotation angle (radians, 0..2π). UT1 as two-part Julian date (ERFA convention).
 */
export function eraEra00(ut11: number, ut12: number) {
  let d1: number
  let d2: number
  if (ut11 < ut12) {
    d1 = ut11
    d2 = ut12
  } else {
    d1 = ut12
    d2 = ut11
  }
  const t = d1 + (d2 - ERFA_DJ00)
  const f = (d1 % 1) + (d2 % 1)
  return eraAnp(ERFA_D2PI * (f + 0.7790572732640 + 0.00273781191135448 * t))
}

/** MJD split: `dj1 = DJM0`, `dj2` = UT1 as MJD (preserves precision like ERFA examples). */
export function eraEra00FromUt1JulianDate(ut1Jd: number) {
  return eraEra00(ERFA_DJM0, ut1Jd - ERFA_DJM0)
}

/**
 * Earth rotation angle for Stellarium `observer_update_full` → `eraApco` (`theta`):
 * `eraEra00(DJM0, obs->utc)` (UTC-based split), not UT1.
 */
export function eraEra00FromUtcJulianDate(utcJd: number) {
  return eraEra00(ERFA_DJM0, utcJd - ERFA_DJM0)
}

/**
 * Stellarium `eraApco` / `eraAper`: **`astrom.eral`** = `eraEra00(DJM0, utc)` + longitude + `eraSp00` on TT
 * (`observer.c` uses UTC for `theta`; see `observer_update_full` comment about UT1).
 */
export function observerEralStellariumRad(utcJulianDate: number, longitudeRad: number, ttJulianDate: number) {
  return eraEra00FromUtcJulianDate(utcJulianDate) + longitudeRad + eraSp00(ERFA_DJM0, ttJulianDate - ERFA_DJM0)
}

/**
 * UT1-based local angle = `eraEra00(UT1)` + longitude + `eraSp00` (not used for Stellarium `ri2h`; kept for GMST/LST analogs).
 */
export function localEarthRotationAngleRad(ut1Jd: number, longitudeRad: number, ttJulianDate: number) {
  return eraEra00FromUt1JulianDate(ut1Jd) + longitudeRad + eraSp00(ERFA_DJM0, ttJulianDate - ERFA_DJM0)
}
