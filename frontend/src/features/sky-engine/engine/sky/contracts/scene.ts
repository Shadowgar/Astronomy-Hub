import type { SkyRuntimeTier } from './stars'

export type SkyScenePacket = {
  stars: Array<{
    id: string
    x: number
    y: number
    z: number
    mag: number
    colorIndex?: number
    label?: string
    tier: SkyRuntimeTier
  }>
  labels: Array<{
    id: string
    text: string
    x: number
    y: number
    z: number
    priority: number
  }>
  diagnostics: {
    limitingMagnitude: number
    activeTiles: number
    visibleStars: number
    activeTiers: string[]
  }
}