import type { SkyScenePacket } from '../contracts/scene'
import type { RuntimeStar } from '../contracts/stars'
import type { SkyEngineQuery, SkyTilePayload, SkyTileRepositoryLoadResult } from '../contracts/tiles'
import { dedupeRuntimeStars } from '../core/dedupe'
import { buildSkyDiagnostics } from '../diagnostics/skyDiagnostics'
import { raDecToObserverUnitVector } from '../transforms/coordinates'

function resolveStarLabel(star: RuntimeStar) {
  return star.properName ?? star.bayer ?? star.flamsteed ?? star.sourceId
}

export function assembleSkyScenePacket(
  query: SkyEngineQuery,
  tiles: readonly SkyTilePayload[],
  repositoryState: Pick<SkyTileRepositoryLoadResult, 'mode' | 'sourceLabel' | 'sourceError'> = {
    mode: 'mock',
    sourceLabel: 'Mock tile repository',
    sourceError: null,
  },
): SkyScenePacket {
  const activeTierSet = new Set(query.activeTiers)
  const visibleTileSet = new Set(query.visibleTileIds)
  const labelCandidateMap = tiles
    .filter((tile) => visibleTileSet.has(tile.tileId))
    .flatMap((tile) => tile.labelCandidates ?? [])
    .reduce<Map<string, { text: string; priority: number }>>((candidates, candidate) => {
      const current = candidates.get(candidate.starId)

      if (!current || candidate.priority > current.priority) {
        candidates.set(candidate.starId, {
          text: candidate.label,
          priority: candidate.priority,
        })
      }

      return candidates
    }, new Map())
  const dedupedStars = dedupeRuntimeStars(
    tiles
      .filter((tile) => visibleTileSet.has(tile.tileId))
      .flatMap((tile) => tile.stars)
      .filter((star) => activeTierSet.has(star.tier))
      .filter((star) => star.mag <= query.limitingMagnitude),
  )

  const visibleStars = dedupedStars.flatMap((star) => {
    const { vector, horizontalCoordinates } = raDecToObserverUnitVector(star.raDeg, star.decDeg, query.observer)

    if (!horizontalCoordinates.isAboveHorizon) {
      return []
    }

    return [{
      id: star.id,
      x: vector.x,
      y: vector.y,
      z: vector.z,
      mag: star.mag,
      colorIndex: star.colorIndex,
      label: resolveStarLabel(star),
      tier: star.tier,
    }]
  }).sort((left, right) => left.mag - right.mag || left.id.localeCompare(right.id))

  const labels = visibleStars
    .flatMap((star) => {
      const candidate = labelCandidateMap.get(star.id)
      const fallbackLabel = star.label

      if (!candidate && (!fallbackLabel || star.mag > 2.5)) {
        return []
      }

      return [{
        id: star.id,
        text: candidate?.text ?? (fallbackLabel as string),
        x: star.x,
        y: star.y,
        z: star.z,
        priority: Math.max(candidate?.priority ?? 0, Math.max(1, Math.round((14 - star.mag) * 10))),
      }]
    })
    .sort((left, right) => right.priority - left.priority || left.text.localeCompare(right.text))

  return {
    stars: visibleStars,
    labels,
    diagnostics: buildSkyDiagnostics(query, tiles, visibleStars.length, repositoryState),
  }
}