export type SkyRuntimeTier = `T${number}`

export type RuntimeStar = {
  id: string
  sourceId?: string
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