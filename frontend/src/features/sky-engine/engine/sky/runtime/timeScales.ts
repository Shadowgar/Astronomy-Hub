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
