/**
 * Subset of ERFA/SOFA Earth rotation (Stellarium `ext_src/erfa/erfa.c` `eraEra00`, `eraAnp`).
 * Used for `astrom->eral = theta + along` before full `eraApco` port.
 */

const ERFA_DJ00 = 2451545.0
const ERFA_D2PI = 6.283185307179586476925287

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

/** MJD split: `dj1 = 2400000.5`, `dj2` = UT1 as MJD (preserves precision like ERFA examples). */
export function eraEra00FromUt1JulianDate(ut1Jd: number) {
  return eraEra00(2400000.5, ut1Jd - 2400000.5)
}

/**
 * Stellarium `eraApco` / `eraAper`: `eral = theta + along` with `along ≈ elong` (TIO s′ omitted).
 */
export function localEarthRotationAngleRad(ut1Jd: number, longitudeRad: number) {
  return eraEra00FromUt1JulianDate(ut1Jd) + longitudeRad
}
