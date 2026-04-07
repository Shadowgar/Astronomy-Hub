import type { SkyRuntimeTier } from './stars'
import type { SkyTileRepositoryMode } from './tiles'

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
    dataMode: SkyTileRepositoryMode
    sourceLabel: string
    sourceError?: string | null
    limitingMagnitude: number
    activeTiles: number
    visibleStars: number
    activeTiers: string[]
    tileLevels: number[]
    tilesPerLevel: Record<string, number>
    maxTileDepthReached: number
  }
}