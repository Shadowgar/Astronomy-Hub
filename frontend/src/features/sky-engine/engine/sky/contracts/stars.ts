export type SkyRuntimeTier = 'T0' | 'T1' | 'T2' | 'T3'

export type RuntimeStar = {
  id: string
  raDeg: number
  decDeg: number
  pmRaMasYr?: number
  pmDecMasYr?: number
  parallaxMas?: number
  mag: number
  colorIndex?: number
  tier: SkyRuntimeTier
  properName?: string
  bayer?: string
  flamsteed?: string
  flags?: number
}