import type { ObserverSnapshot } from './observer'
import type { RuntimeStar, SkyRuntimeTier } from './stars'

export type SkyEngineQuery = {
  observer: ObserverSnapshot
  limitingMagnitude: number
  activeTiers: SkyRuntimeTier[]
  visibleTileIds: string[]
}

export type SkyTilePayload = {
  tileId: string
  level: number
  magMin: number
  magMax: number
  starCount: number
  stars: RuntimeStar[]
  labelCandidates?: string[]
}