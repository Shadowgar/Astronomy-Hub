import {
  assembleSkyScenePacket,
  formatHipsViewportKey,
  getSkyTileMaxLevel,
  type SkyEngineQuery,
  type SkyTileRepositoryLoadResult,
} from './engine/sky'
import type { ScenePropsSnapshot, SkyEngineSceneProps } from './SkyEngineRuntimeBridge'

export const HIPPARCOS_QUERY_LIMITING_MAGNITUDE_MAX = 8.5 - 0.001
const GAIA_SURVEY_ACTIVATION_MAGNITUDE = 8.5

export function resolveRepositoryQueryLimitingMagnitude(
  repositoryMode: SkyEngineSceneProps['repositoryMode'],
  limitingMagnitude: number,
) {
  if (repositoryMode === 'hipparcos') {
    return Math.min(limitingMagnitude, HIPPARCOS_QUERY_LIMITING_MAGNITUDE_MAX)
  }

  return limitingMagnitude
}

export function buildRuntimeTileQuerySignature(
  query: SkyEngineQuery,
  repositoryMode: SkyEngineSceneProps['repositoryMode'],
) {
  const normalizedActiveTiers = [...query.activeTiers].sort()
  const normalizedVisibleTileIds = [...query.visibleTileIds].sort()
  const surveyPhase = repositoryMode !== 'multi-survey'
    ? repositoryMode
    : (query.limitingMagnitude >= GAIA_SURVEY_ACTIVATION_MAGNITUDE ? 'gaia-active' : 'hipparcos-only')
  const vpSig = formatHipsViewportKey(query.hipsViewport)
  return [
    repositoryMode,
    surveyPhase,
    String(query.maxTileLevel ?? getSkyTileMaxLevel()),
    normalizedActiveTiers.join(','),
    normalizedVisibleTileIds.join(','),
    vpSig,
  ].join(':')
}

export function resolveScenePacketForQuery(config: {
  query: SkyEngineQuery
  repositoryMode: SkyEngineSceneProps['repositoryMode']
  runtimeTiles: NonNullable<SkyTileRepositoryLoadResult['tiles']>
  tileLoadResult: SkyTileRepositoryLoadResult | null
  resolvedTileQuerySignature: string
  previousScenePacket: ScenePropsSnapshot['scenePacket']
}) {
  const tileQuerySignature = buildRuntimeTileQuerySignature(config.query, config.repositoryMode)
  // Only treat tile payloads as authoritative for this `query` when the active repository
  // signature matches. A previous multi-survey "promotion" path reused `tileLoadResult` even
  // when signatures diverged, which could pair a *new* `visibleTileIds` set with *stale*
  // `runtimeTiles` — yielding empty star packets, **Listed 0**, and confusing HUD state.
  const matchingTileLoadResult = config.tileLoadResult != null && config.resolvedTileQuerySignature === tileQuerySignature
    ? config.tileLoadResult
    : null

  return {
    tileQuerySignature,
    scenePacket: matchingTileLoadResult == null
      ? (config.previousScenePacket ?? null)
      : assembleSkyScenePacket(config.query, config.runtimeTiles, matchingTileLoadResult),
    hasResolvedTilesForQuery: matchingTileLoadResult != null,
  }
}