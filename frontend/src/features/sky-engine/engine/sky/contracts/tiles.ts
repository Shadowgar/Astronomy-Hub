import type { ObserverSnapshot } from './observer'
import type { RuntimeStar, SkyRuntimeTier } from './stars'
import type { ObserverAstrometrySnapshot } from '../transforms/coordinates'

/** Optional screen hint for HiPS order (`hips_get_render_order`); supply from the active render/viewport when available. */
export type SkyEngineHipsViewport = {
  windowHeightPx: number
  /**
   * Vertical projection scale for `hips_get_render_order`, **Hub-normalized** as `projectionScalePx / windowHeightPx`
   * (Stellarium `fabs(painter->proj->mat[1][1])` in the same dimensionless ratio with `window_size[1]`).
   */
  projectionMat11: number
  tileWidthPx?: number
}

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
  /**
   * When set, Gaia Eph tile fetch uses `hips_get_render_order`-style order vs quadtree level (see `resolveGaiaHealpixOrder`).
   */
  hipsViewport?: SkyEngineHipsViewport
  /**
   * When set (Hub Module 0), star scene assembly uses Stellarium CIO + aberration (`convertObserverFrameVector`).
   */
  observerFrameAstrometry?: ObserverAstrometrySnapshot
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