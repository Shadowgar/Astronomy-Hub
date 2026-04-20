export interface MinorPlanetCatalogEntry {
  readonly id: string
  readonly name: string
  readonly rightAscensionHours: number
  readonly declinationDeg: number
  readonly magnitude: number
  readonly absoluteMagnitude: number
  readonly slopeParameterG: number
  readonly orbitEpochIso: string
  readonly dailyMotionRaHours: number
  readonly dailyMotionDecDeg: number
}

export const MINOR_PLANETS_CATALOG: readonly MinorPlanetCatalogEntry[] = [
  {
    id: 'minor-1-ceres',
    name: 'Ceres',
    rightAscensionHours: 19.403,
    declinationDeg: -23.14,
    magnitude: 8.1,
    absoluteMagnitude: 3.34,
    slopeParameterG: 0.12,
    orbitEpochIso: '2026-01-01T00:00:00Z',
    dailyMotionRaHours: 0.019,
    dailyMotionDecDeg: 0.011,
  },
  {
    id: 'minor-4-vesta',
    name: 'Vesta',
    rightAscensionHours: 14.245,
    declinationDeg: -9.86,
    magnitude: 6.9,
    absoluteMagnitude: 3.2,
    slopeParameterG: 0.32,
    orbitEpochIso: '2026-01-01T00:00:00Z',
    dailyMotionRaHours: 0.026,
    dailyMotionDecDeg: 0.008,
  },
  {
    id: 'minor-2-pallas',
    name: 'Pallas',
    rightAscensionHours: 7.112,
    declinationDeg: 22.47,
    magnitude: 8.7,
    absoluteMagnitude: 4.13,
    slopeParameterG: 0.11,
    orbitEpochIso: '2026-01-01T00:00:00Z',
    dailyMotionRaHours: 0.014,
    dailyMotionDecDeg: -0.006,
  },
]
