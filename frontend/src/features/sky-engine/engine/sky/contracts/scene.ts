import type { SkyRuntimeTier } from './stars'
import type { SkyTileCatalog } from './tiles'

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
  starTiles: Array<{
    tileId: string
    level: number
    parentTileId: string | null
    childTileIds: string[]
    magMin: number
    magMax: number
    starIds: string[]
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
    dataMode: SkyTileCatalog
    sourceLabel: string
    sourceError?: string | null
    limitingMagnitude: number
    activeTiles: number
    visibleStars: number
    /**
     * Count of `stars.c::stars_list` callback visits from `listRuntimeStarsFromTiles` in `starsList.ts`
     * over **visible** tiles (`query.visibleTileIds`) at `limitingMagnitude` (no nuniq hint).
     * Mirrors loaded-tile list semantics alongside deduped scene stars (counts may differ).
     */
    starsListVisitCount: number
    activeTiers: string[]
    tileLevels: number[]
    tilesPerLevel: Record<string, number>
    maxTileDepthReached: number
    visibleTileIds: string[]
  }
}
