import {
  assembleSkyScenePacket,
  getSkyTileMaxLevel,
  type SkyEngineQuery,
  type SkyTileRepositoryLoadResult,
} from './engine/sky'
import type { ScenePropsSnapshot, SkyEngineSceneProps } from './SkyEngineRuntimeBridge'

export const HIPPARCOS_QUERY_LIMITING_MAGNITUDE_MAX = 8.5 - 0.001

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
  return [
    repositoryMode,
    String(query.maxTileLevel ?? getSkyTileMaxLevel()),
    query.limitingMagnitude.toFixed(2),
    query.activeTiers.join(','),
    query.visibleTileIds.join(','),
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