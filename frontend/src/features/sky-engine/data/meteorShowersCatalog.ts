export interface MeteorShowerCatalogEntry {
  readonly id: string
  readonly name: string
  readonly rightAscensionHours: number
  readonly declinationDeg: number
  readonly peakIso: string
  readonly zenithRatePerHour: number
  readonly dailyMotionRaHours: number
  readonly dailyMotionDecDeg: number
}

export const METEOR_SHOWERS_CATALOG: readonly MeteorShowerCatalogEntry[] = [
  {
    id: 'meteor-perseids',
    name: 'Perseids',
    rightAscensionHours: 3.08,
    declinationDeg: 58.2,
    peakIso: '2026-08-12T03:00:00Z',
    zenithRatePerHour: 90,
    dailyMotionRaHours: 0.013,
    dailyMotionDecDeg: 0.004,
  },
  {
    id: 'meteor-geminids',
    name: 'Geminids',
    rightAscensionHours: 7.47,
    declinationDeg: 32.3,
    peakIso: '2026-12-14T02:00:00Z',
    zenithRatePerHour: 120,
    dailyMotionRaHours: 0.011,
    dailyMotionDecDeg: -0.003,
  },
]
