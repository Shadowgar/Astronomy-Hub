import type { SkyScenePacket } from '../contracts/scene'
import type { SkyEngineQuery, SkyTilePayload, SkyTileRepositoryLoadResult } from '../contracts/tiles'
import { listRuntimeStarsFromTiles } from '../adapters/starsList'

export type SkyDiagnosticsSnapshot = SkyScenePacket['diagnostics'] & {
  visibleTileIds: string[]
}

function countStarsListVisitsForVisibleTiles(
  query: SkyEngineQuery,
  tiles: readonly SkyTilePayload[],
  maxMag: number,
): number {
  const visible = new Set(query.visibleTileIds)
  const visibleTiles = tiles.filter((tile) => visible.has(tile.tileId))
  let count = 0
  listRuntimeStarsFromTiles({
    tiles: visibleTiles,
    maxMag,
    visit: () => {
      count += 1
    },
  })
  return count
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
  const starsListVisitCount = countStarsListVisitsForVisibleTiles(query, tiles, query.limitingMagnitude)

  return {
    dataMode: repositoryState.mode,
    sourceLabel: repositoryState.sourceLabel,
    sourceError: repositoryState.sourceError,
    limitingMagnitude: query.limitingMagnitude,
    activeTiles: tiles.length,
    visibleStars,
    starsListVisitCount,
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