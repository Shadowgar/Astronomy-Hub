/**
 * Stellarium / ERFA observer seam types — stubs until EOP + full `eraApco` / `ri2h` PM.
 * Polar motion: zeros = no PM applied in Hub matrices (see `module-inventory` Module 0).
 */

/** IERS CIP + ERFA `eraASTROM` polar motion (radians). All zero until EOP integration. */
export interface SkyPolarMotionStub {
  /** IERS pole x (CIP), radians. */
  readonly xpRad: number
  /** IERS pole y (CIP), radians. */
  readonly ypRad: number
  /** ERFA `eraASTROM.xpl` — x wrt local meridian, radians. */
  readonly xplRad: number
  /** ERFA `eraASTROM.ypl` — y wrt local meridian, radians. */
  readonly yplRad: number
}

export const ZERO_POLAR_MOTION_STUB: SkyPolarMotionStub = Object.freeze({
  xpRad: 0,
  ypRad: 0,
  xplRad: 0,
  yplRad: 0,
})

/**
 * Scalars aligned with Stellarium `observer_t` (`elong`, `phi`, `hm`) and `eraASTROM.eral`,
 * in radians / meters as in ERFA.
 */
export interface SkyObserverSeamScalars {
  /** `observer_t.elong` — geodetic longitude (radians). */
  readonly elongRad: number
  /** `observer_t.phi` — geodetic latitude (radians). */
  readonly phiRad: number
  /** `observer_t.hm` — height above ellipsoid (meters). */
  readonly hmMeters: number
  /** `eraASTROM.eral` — local Earth rotation angle (radians; Hub ERA + λ + s′ analog). */
  readonly eralRad: number
}
