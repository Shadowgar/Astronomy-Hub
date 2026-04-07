import type { ObserverSnapshot } from './observer'
import type { RuntimeStar, SkyRuntimeTier } from './stars'

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
  labelCandidates?: string[]
}