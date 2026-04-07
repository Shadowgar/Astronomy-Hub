import type { SkyScenePacket } from '../contracts/scene'
import type { SkyEngineQuery, SkyTilePayload } from '../contracts/tiles'

export type SkyDiagnosticsSnapshot = SkyScenePacket['diagnostics'] & {
  visibleTileIds: string[]
}

export function buildSkyDiagnostics(query: SkyEngineQuery, tiles: readonly SkyTilePayload[], visibleStars: number): SkyDiagnosticsSnapshot {
  return {
    limitingMagnitude: query.limitingMagnitude,
    activeTiles: tiles.length,
    visibleStars,
    activeTiers: [...query.activeTiers],
    visibleTileIds: [...query.visibleTileIds],
  }
}

export function formatSkyDiagnosticsSummary(diagnostics: SkyDiagnosticsSnapshot) {
  return [
    `m${diagnostics.limitingMagnitude.toFixed(1)}`,
    `${diagnostics.activeTiles} tiles`,
    `${diagnostics.visibleStars} stars`,
    diagnostics.activeTiers.join('/'),
  ].join(' · ')
}