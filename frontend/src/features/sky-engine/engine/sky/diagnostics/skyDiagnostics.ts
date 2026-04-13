import type { SkyScenePacket } from '../contracts/scene'
import type { SkyEngineQuery, SkyTilePayload, SkyTileRepositoryLoadResult } from '../contracts/tiles'

export type SkyDiagnosticsSnapshot = SkyScenePacket['diagnostics'] & {
  visibleTileIds: string[]
}

export function buildSkyDiagnostics(
  query: SkyEngineQuery,
  tiles: readonly SkyTilePayload[],
  visibleStars: number,
  repositoryState: Pick<SkyTileRepositoryLoadResult, 'mode' | 'sourceLabel' | 'sourceError'>,
): SkyDiagnosticsSnapshot {
  const tileLevels = Array.from(new Set(tiles.map((tile) => tile.level))).sort((left, right) => left - right)
  const tilesPerLevel = tiles.reduce<Record<string, number>>((counts, tile) => {
    const key = String(tile.level)
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
  const maxTileDepthReached = tileLevels.reduce((maximumLevel, level) => Math.max(maximumLevel, level), 0)

  return {
    dataMode: repositoryState.mode,
    sourceLabel: repositoryState.sourceLabel,
    sourceError: repositoryState.sourceError,
    limitingMagnitude: query.limitingMagnitude,
    activeTiles: tiles.length,
    visibleStars,
    activeTiers: [...query.activeTiers],
    tileLevels,
    tilesPerLevel,
    maxTileDepthReached,
    visibleTileIds: [...query.visibleTileIds],
  }
}

export function formatSkyDiagnosticsSummary(diagnostics: SkyDiagnosticsSnapshot) {
  return [
    diagnostics.dataMode === 'multi-survey'
      ? 'MULTI'
      : diagnostics.dataMode === 'hipparcos'
        ? 'HIP'
        : diagnostics.dataMode === 'gaia'
          ? 'GAIA'
          : 'MOCK',
    `m${diagnostics.limitingMagnitude.toFixed(1)}`,
    `${diagnostics.activeTiles} tiles`,
    `${diagnostics.visibleStars} stars`,
    `L${diagnostics.maxTileDepthReached}`,
  ].join(' · ')
}