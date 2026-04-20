export interface CometCatalogEntry {
  readonly id: string
  readonly name: string
  readonly rightAscensionHours: number
  readonly declinationDeg: number
  readonly magnitude: number
  readonly orbitType: 'elliptic' | 'parabolic' | 'hyperbolic'
  readonly perihelionIso: string
  readonly dailyMotionRaHours: number
  readonly dailyMotionDecDeg: number
}

export const COMETS_CATALOG: readonly CometCatalogEntry[] = [
  {
    id: 'comet-1p-halley',
    name: "Halley's Comet",
    rightAscensionHours: 8.442,
    declinationDeg: 4.2,
    magnitude: 11.2,
    orbitType: 'elliptic',
    perihelionIso: '2061-07-28T00:00:00Z',
    dailyMotionRaHours: 0.006,
    dailyMotionDecDeg: 0.002,
  },
  {
    id: 'comet-c2023-a3',
    name: 'C/2023 A3 (Tsuchinshan-ATLAS)',
    rightAscensionHours: 17.23,
    declinationDeg: -12.6,
    magnitude: 9.8,
    orbitType: 'parabolic',
    perihelionIso: '2024-09-27T00:00:00Z',
    dailyMotionRaHours: 0.043,
    dailyMotionDecDeg: -0.028,
  },
]
