/**
 * Faithful port of Stellarium `src/modules/stars.c::compute_pv` and
 * `src/modules/stars.c::star_get_astrom` (pinned commit `63fb3279…`).
 *
 * `computeCatalogStarPv` precomputes the BCRS pv-vector for a catalogue
 * star at J2000.0 — matching the static `pvo[2][3]` that `stars.c`
 * stores on every `star_t` after loading a tile.
 *
 * `starAstrometricIcrfVector` returns the astrometric position as seen
 * from the Earth centre (pvo[0] linearly propagated to observer TT,
 * then minus `obs->earth_pvb[0]`, normalised) — the exact vector that
 * Stellarium's `render_visitor` passes to `painter_project` in
 * `FRAME_ASTROM`.
 *
 * Units:
 *   - `raRad`, `decRad`             : ICRS radians at catalogue epoch
 *   - `pmRaStarRad`                 : μ_RA* (= pmRA · cos(dec)) rad/year
 *   - `pmDecRad`                    : rad/year
 *   - `plxArcsec`                   : arcseconds
 *   - `epochYear`                   : Besselian year (2000.0 default)
 *
 * Consumers must pass proper motions already in the catalogue convention
 * μ_RA* (cos-dec applied), matching the Stellarium source attribute
 * (`pm_ra` is read in mas/yr directly and Stellarium divides by
 * `cos(de)` internally before feeding `eraStarpv`).
 */
import { ERFA_DJM00, ERFA_DMAS2R } from './erfaConstants'
import { eraEpb2jd, eraStarpv } from './erfaStarpv'

export interface CatalogStarPv {
  /** BCRS position (AU) at J2000.0 after catalogue-epoch propagation. */
  readonly p: readonly [number, number, number]
  /** BCRS velocity (AU/day) at J2000.0, zero when `plx <= 0`. */
  readonly v: readonly [number, number, number]
  /** Heliocentric distance (AU) at J2000.0 (NaN when Stellarium would set NaN). */
  readonly distanceAu: number
  /** `iwarn` bitmask returned by `eraStarpv`. */
  readonly iwarn: number
}

/** Stellarium `stars.c::compute_pv`. */
export function computeCatalogStarPv(
  raRad: number,
  decRad: number,
  pmRaStarRad: number,
  pmDecRad: number,
  plxArcsec: number,
  epochYear: number,
): CatalogStarPv {
  let plx = Number.isFinite(plxArcsec) ? plxArcsec : 0
  let pde = Number.isFinite(pmDecRad) ? pmDecRad : 0
  let pra = Number.isFinite(pmRaStarRad) ? pmRaStarRad : 0

  if (plx <= 0) {
    plx = 0
    pde = 0
    pra = 0
  }

  const cosDec = Math.cos(decRad)
  const pmRaDraDt = cosDec !== 0 ? pra / cosDec : 0

  const { pv, iwarn } = eraStarpv(raRad, decRad, pmRaDraDt, pde, plx, 0)

  const distanceAu = iwarn & 1
    ? Number.NaN
    : Math.hypot(pv[0][0], pv[0][1], pv[0][2])

  const { djm } = eraEpb2jd(epochYear)
  const dt = ERFA_DJM00 - djm

  const p: readonly [number, number, number] = [
    pv[0][0] + pv[1][0] * dt,
    pv[0][1] + pv[1][1] * dt,
    pv[0][2] + pv[1][2] * dt,
  ]
  const v: readonly [number, number, number] = [pv[1][0], pv[1][1], pv[1][2]]

  return { p, v, distanceAu, iwarn }
}

/** Stellarium `stars.c::star_get_astrom`. */
export function starAstrometricIcrfVector(
  pv: CatalogStarPv,
  ttMjd: number,
  earthPvAu: readonly [number, number, number],
): readonly [number, number, number] {
  const dt = ttMjd - ERFA_DJM00
  const x = pv.p[0] + pv.v[0] * dt - earthPvAu[0]
  const y = pv.p[1] + pv.v[1] * dt - earthPvAu[1]
  const z = pv.p[2] + pv.v[2] * dt - earthPvAu[2]
  const norm = Math.hypot(x, y, z)
  if (norm === 0) {
    return [0, 0, 0]
  }
  return [x / norm, y / norm, z / norm]
}

/**
 * Convenience helper: take Hub catalogue units (mas/yr, mas, deg) and
 * return the J2000.0 pv. Matches Stellarium JSON path
 * `pm_ra * ERFA_DMAS2R` etc.
 */
export function computeCatalogStarPvFromCatalogueUnits(input: {
  raDeg: number
  decDeg: number
  pmRaMasYr?: number
  pmDecMasYr?: number
  parallaxMas?: number
  /** Besselian year of catalogue epoch; defaults to 2000. */
  epochYear?: number
}): CatalogStarPv {
  const raRad = (input.raDeg * Math.PI) / 180
  const decRad = (input.decDeg * Math.PI) / 180
  const pmRaRad = (input.pmRaMasYr ?? 0) * ERFA_DMAS2R
  const pmDecRad = (input.pmDecMasYr ?? 0) * ERFA_DMAS2R
  const plxArcsec = (input.parallaxMas ?? 0) / 1000
  const epochYear = input.epochYear && input.epochYear > 0 ? input.epochYear : 2000
  return computeCatalogStarPv(raRad, decRad, pmRaRad, pmDecRad, plxArcsec, epochYear)
}
