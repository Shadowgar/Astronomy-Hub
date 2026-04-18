/** ERFA `erfa.h` scalars used by ported routines. */
export const ERFA_DJ00 = 2451545.0
/** Julian years per day (ERFA `ERFA_DJY`) — used by `eraEpv00` time scale `t`. */
export const ERFA_DJY = 365.25
export const ERFA_DJC = 36525.0
export const ERFA_DAS2R = 4.848136811095359935899141e-6
export const ERFA_D2PI = 6.283185307179586476925287
/** Turns of arcseconds per circle (ERFA `ERFA_TURNAS`). */
export const ERFA_TURNAS = 1296000.0
/** Milliarcseconds to radians (`ERFA_DMAS2R`). */
export const ERFA_DMAS2R = ERFA_DAS2R / 1e3

/** SI seconds per day (`ERFA_DAYSEC`). */
export const ERFA_DAYSEC = 86400.0
/** Speed of light (m/s, `ERFA_CMPS`). */
export const ERFA_CMPS = 299792458.0
/** Astronomical unit in meters (`ERFA_DAU`). */
export const ERFA_DAU = 149597870.7e3
/** Light time for 1 au (s, `ERFA_AULT`). */
export const ERFA_AULT = ERFA_DAU / ERFA_CMPS
/** Schwarzschild radius of the Sun / au (`ERFA_SRS`) — `eraAb` / `eraLd`. */
export const ERFA_SRS = 1.97412574336e-8
