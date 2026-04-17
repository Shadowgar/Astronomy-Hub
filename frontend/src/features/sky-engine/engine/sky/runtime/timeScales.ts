type LeapSecondEntry = {
  readonly effectiveUtcIso: string
  readonly taiMinusUtcSeconds: number
}

// Leap-second epochs from IERS history; enough to reproduce modern Stellarium-era UTC/TT conversion.
const LEAP_SECONDS: readonly LeapSecondEntry[] = [
  { effectiveUtcIso: '1972-01-01T00:00:00Z', taiMinusUtcSeconds: 10 },
  { effectiveUtcIso: '1972-07-01T00:00:00Z', taiMinusUtcSeconds: 11 },
  { effectiveUtcIso: '1973-01-01T00:00:00Z', taiMinusUtcSeconds: 12 },
  { effectiveUtcIso: '1974-01-01T00:00:00Z', taiMinusUtcSeconds: 13 },
  { effectiveUtcIso: '1975-01-01T00:00:00Z', taiMinusUtcSeconds: 14 },
  { effectiveUtcIso: '1976-01-01T00:00:00Z', taiMinusUtcSeconds: 15 },
  { effectiveUtcIso: '1977-01-01T00:00:00Z', taiMinusUtcSeconds: 16 },
  { effectiveUtcIso: '1978-01-01T00:00:00Z', taiMinusUtcSeconds: 17 },
  { effectiveUtcIso: '1979-01-01T00:00:00Z', taiMinusUtcSeconds: 18 },
  { effectiveUtcIso: '1980-01-01T00:00:00Z', taiMinusUtcSeconds: 19 },
  { effectiveUtcIso: '1981-07-01T00:00:00Z', taiMinusUtcSeconds: 20 },
  { effectiveUtcIso: '1982-07-01T00:00:00Z', taiMinusUtcSeconds: 21 },
  { effectiveUtcIso: '1983-07-01T00:00:00Z', taiMinusUtcSeconds: 22 },
  { effectiveUtcIso: '1985-07-01T00:00:00Z', taiMinusUtcSeconds: 23 },
  { effectiveUtcIso: '1988-01-01T00:00:00Z', taiMinusUtcSeconds: 24 },
  { effectiveUtcIso: '1990-01-01T00:00:00Z', taiMinusUtcSeconds: 25 },
  { effectiveUtcIso: '1991-01-01T00:00:00Z', taiMinusUtcSeconds: 26 },
  { effectiveUtcIso: '1992-07-01T00:00:00Z', taiMinusUtcSeconds: 27 },
  { effectiveUtcIso: '1993-07-01T00:00:00Z', taiMinusUtcSeconds: 28 },
  { effectiveUtcIso: '1994-07-01T00:00:00Z', taiMinusUtcSeconds: 29 },
  { effectiveUtcIso: '1996-01-01T00:00:00Z', taiMinusUtcSeconds: 30 },
  { effectiveUtcIso: '1997-07-01T00:00:00Z', taiMinusUtcSeconds: 31 },
  { effectiveUtcIso: '1999-01-01T00:00:00Z', taiMinusUtcSeconds: 32 },
  { effectiveUtcIso: '2006-01-01T00:00:00Z', taiMinusUtcSeconds: 33 },
  { effectiveUtcIso: '2009-01-01T00:00:00Z', taiMinusUtcSeconds: 34 },
  { effectiveUtcIso: '2012-07-01T00:00:00Z', taiMinusUtcSeconds: 35 },
  { effectiveUtcIso: '2015-07-01T00:00:00Z', taiMinusUtcSeconds: 36 },
  { effectiveUtcIso: '2017-01-01T00:00:00Z', taiMinusUtcSeconds: 37 },
]

const TT_MINUS_TAI_SECONDS = 32.184

/**
 * Stephenson–Morrison–Hohenkerk 2016 ΔT = TT − UT1 (seconds), Stellarium `algos/deltat.c`.
 * `ttMjd` is TT as a modified Julian date (same convention as `eraEpj(ERFA_DJM0, tt)` input).
 */
const SMH2016: readonly (readonly [number, number, number, number, number, number])[] = [
  [-720, 400, 20550.593, -21268.478, 11863.418, -4541.129],
  [400, 1000, 6604.404, -5981.266, -505.093, 1349.609],
  [1000, 1500, 1467.654, -2452.187, 2460.927, -1183.759],
  [1500, 1600, 292.635, -216.322, -43.614, 56.681],
  [1600, 1650, 89.38, -66.754, 31.607, -10.497],
  [1650, 1720, 43.736, -49.043, 0.227, 15.811],
  [1720, 1800, 10.73, -1.321, 62.25, -52.946],
  [1800, 1810, 18.714, -4.457, -1.509, 2.507],
  [1810, 1820, 15.255, 0.046, 6.012, -4.634],
  [1820, 1830, 16.679, -1.831, -7.889, 3.799],
  [1830, 1840, 10.758, -6.211, 3.509, -0.388],
  [1840, 1850, 7.668, -0.357, 2.345, -0.338],
  [1850, 1855, 9.317, 1.659, 0.332, -0.932],
  [1855, 1860, 10.376, -0.472, -2.463, 1.596],
  [1860, 1865, 9.038, -0.61, 2.325, -2.497],
  [1865, 1870, 8.256, -3.45, -5.166, 2.729],
  [1870, 1875, 2.369, -5.596, 3.02, -0.919],
  [1875, 1880, -1.126, -2.312, 0.264, -0.037],
  [1880, 1885, -3.211, -1.894, 0.154, 0.562],
  [1885, 1890, -4.388, 0.101, 1.841, -1.438],
  [1890, 1895, -3.884, -0.531, -2.473, 1.87],
  [1895, 1900, -5.017, 0.134, 3.138, -0.232],
  [1900, 1905, -1.977, 5.715, 2.443, -1.257],
  [1905, 1910, 4.923, 6.828, -1.329, 0.72],
  [1910, 1915, 11.142, 6.33, 0.831, -0.825],
  [1915, 1920, 17.479, 5.518, -1.643, 0.262],
  [1920, 1925, 21.617, 3.02, -0.856, 0.008],
  [1925, 1930, 23.789, 1.333, -0.831, 0.127],
  [1930, 1935, 24.418, 0.052, -0.449, 0.142],
  [1935, 1940, 24.164, -0.419, -0.022, 0.702],
  [1940, 1945, 24.426, 1.645, 2.086, -1.106],
  [1945, 1950, 27.05, 2.499, -1.232, 0.614],
  [1950, 1953, 28.932, 1.127, 0.22, -0.277],
  [1953, 1956, 30.002, 0.737, -0.61, 0.631],
  [1956, 1959, 30.76, 1.409, 1.282, -0.799],
  [1959, 1962, 32.652, 1.577, -1.115, 0.507],
  [1962, 1965, 33.621, 0.868, 0.406, 0.199],
  [1965, 1968, 35.093, 2.275, 1.002, -0.414],
  [1968, 1971, 37.956, 3.035, -0.242, 0.202],
  [1971, 1974, 40.951, 3.157, 0.364, -0.229],
  [1974, 1977, 44.244, 3.198, -0.323, 0.172],
  [1977, 1980, 47.291, 3.069, 0.193, -0.192],
  [1980, 1983, 50.361, 2.878, -0.384, 0.081],
  [1983, 1986, 52.936, 2.354, -0.14, -0.166],
  [1986, 1989, 54.984, 1.577, -0.637, 0.448],
  [1989, 1992, 56.373, 1.649, 0.709, -0.277],
  [1992, 1995, 58.453, 2.235, -0.122, 0.111],
  [1995, 1998, 60.677, 2.324, 0.212, -0.315],
  [1998, 2001, 62.899, 1.804, -0.732, 0.112],
  [2001, 2004, 64.082, 0.675, -0.396, 0.193],
  [2004, 2007, 64.555, 0.463, 0.184, -0.008],
  [2007, 2010, 65.194, 0.809, 0.161, -0.101],
  [2010, 2013, 66.063, 0.828, -0.142, 0.168],
  [2013, 2016, 66.917, 1.046, 0.36, -0.282],
]

export function toJulianDateUtc(timestampIso: string) {
  return new Date(timestampIso).getTime() / 86400000 + 2440587.5
}

export function taiMinusUtcSeconds(timestampIso: string) {
  const timestampMs = Date.parse(timestampIso)
  if (!Number.isFinite(timestampMs)) {
    return 37
  }
  let value = 10
  for (const entry of LEAP_SECONDS) {
    if (timestampMs >= Date.parse(entry.effectiveUtcIso)) {
      value = entry.taiMinusUtcSeconds
    } else {
      break
    }
  }
  return value
}

export function ttMinusUtcSeconds(timestampIso: string) {
  return TT_MINUS_TAI_SECONDS + taiMinusUtcSeconds(timestampIso)
}

export function toJulianDateTt(timestampIso: string) {
  return toJulianDateUtc(timestampIso) + ttMinusUtcSeconds(timestampIso) / 86400
}

export function toModifiedJulianDateTt(timestampIso: string) {
  return toJulianDateTt(timestampIso) - 2400000.5
}

/** ERFA `eraEpj(ERFA_DJM0, ttMjd)` — Julian epoch for TT expressed as MJD. */
export function julianEpochFromTtMjd(ttMjd: number) {
  return 2000 + (ttMjd - 51544.5) / 365.25
}

export function deltaTSecondsFromTtMjd(ttMjd: number) {
  const y = julianEpochFromTtMjd(ttMjd)
  if (y < -720) {
    const fact = (y - 1825) / 100
    return -320 + 32.5 * fact * fact
  }
  if (y > 2016) {
    const t = y - 2000
    const dt2016 = 62.92 + 0.32217 * 16 + 0.005589 * 16 * 16
    return 62.92 + 0.32217 * t + 0.005589 * t * t - (dt2016 - 68.1024)
  }
  let i = 0
  while (i < SMH2016.length && SMH2016[i][1] < y) {
    i += 1
  }
  const row = SMH2016[Math.min(i, SMH2016.length - 1)]
  const t = (y - row[0]) / (row[1] - row[0])
  return ((row[5] * t + row[4]) * t + row[3]) * t + row[2]
}

/** UT1 Julian date from TT via ΔT = TT − UT1 (Stellarium `deltat` + ERFA TT/UT1 split). */
export function ut1JulianDateFromTimestampIso(timestampIso: string) {
  const ttJd = toJulianDateTt(timestampIso)
  const ttMjd = ttJd - 2400000.5
  return ttJd - deltaTSecondsFromTtMjd(ttMjd) / 86400
}

/**
 * UT1 − UTC = (TT − UTC) − (TT − UT1) = `ttMinusUtcSeconds` − ΔT (seconds).
 * Matches the algebraic identity used once full ERFA `tt2utc` / IERS EOP are in play.
 */
export function dut1SecondsFromTimestampIso(timestampIso: string) {
  return ttMinusUtcSeconds(timestampIso) - deltaTSecondsFromTtMjd(toModifiedJulianDateTt(timestampIso))
}
