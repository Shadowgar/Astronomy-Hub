import type { ObserverSnapshot } from './observer'
import type { RuntimeStar, SkyRuntimeTier } from './stars'

export type SkyTileCatalog = 'mock' | 'hipparcos' | 'gaia' | 'multi-survey'

export type SkyTileBounds = {
  raMinDeg: number
  raMaxDeg: number
  decMinDeg: number
  decMaxDeg: number
}

export type SkyEngineQuery = {
  observer: ObserverSnapshot
  limitingMagnitude: number
  activeTiers: SkyRuntimeTier[]
  visibleTileIds: string[]
  maxTileLevel?: number
}

export type SkyTileLabelCandidate = {
  starId: string
  label: string
  priority: number
}

export type SkyTileProvenance = {
  catalog: SkyTileCatalog
  sourcePath: string
  generator?: string
  generatedAt?: string
  sourceRecordCount?: number
  tierSet?: SkyRuntimeTier[]
}

export type SkyTilePayload = {
  tileId: string
  level: number
  parentTileId: string | null
  childTileIds: string[]
  bounds: SkyTileBounds
  magMin: number
  magMax: number
  starCount: number
  stars: RuntimeStar[]
  labelCandidates?: SkyTileLabelCandidate[]
  provenance?: SkyTileProvenance
}

export type SkyTileAssetManifest = {
  schemaVersion: 'sky-runtime-tile.v1'
  catalog: Extract<SkyTileCatalog, 'hipparcos'>
  tileIndex: 'equatorial-quadtree-v1'
  generatedAt: string
  generator: string
  sourcePath: string
  sourceRecordCount: number
  maxLevel: number
  tileCount: number
  totalStarRecords: number
  tiles: Record<string, {
    path: string
    level: number
    starCount: number
    magMin: number
    magMax: number
  }>
}

export type SkyTileRepositoryLoadResult = {
  mode: SkyTileCatalog
  sourceLabel: string
  sourceError?: string | null
  manifest?: SkyTileAssetManifest
  tiles: SkyTilePayload[]
}

export interface SkyTileRepository {
  loadTiles: (query: SkyEngineQuery) => Promise<SkyTileRepositoryLoadResult>
}