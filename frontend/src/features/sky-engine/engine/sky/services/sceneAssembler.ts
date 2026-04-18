import type { SkyScenePacket } from '../contracts/scene'
import type { RuntimeStar } from '../contracts/stars'
import type { SkyEngineQuery, SkyTilePayload, SkyTileRepositoryLoadResult } from '../contracts/tiles'
import { dedupeRuntimeStars } from '../core/dedupe'
import { buildSkyDiagnostics } from '../diagnostics/skyDiagnostics'
import { raDecToObserverUnitVector } from '../transforms/coordinates'
const DEFAULT_REPOSITORY_STATE: Pick<SkyTileRepositoryLoadResult, 'mode' | 'sourceLabel' | 'sourceError'> = {
  mode: 'hipparcos',
  sourceLabel: 'Sky tile repository',
  sourceError: null,
}

function resolveStarLabel(star: RuntimeStar) {
  return star.properName ?? star.bayer ?? star.flamsteed
}

export function assembleSkyScenePacket(
  query: SkyEngineQuery,
  tiles: readonly SkyTilePayload[],
  repositoryState: Pick<SkyTileRepositoryLoadResult, 'mode' | 'sourceLabel' | 'sourceError'> = DEFAULT_REPOSITORY_STATE,
): SkyScenePacket {
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
      .filter((star) => star.mag <= query.limitingMagnitude),
  )

  const visibleStars = dedupedStars.flatMap((star) => {
    const { vector, horizontalCoordinates } = raDecToObserverUnitVector(
      star.raDeg,
      star.decDeg,
      query.observer,
      query.observerFrameAstrometry,
    )

    return [{
      id: star.id,
      x: vector.x,
      y: vector.y,
      z: vector.z,
      mag: star.mag,
      colorIndex: star.colorIndex,
      label: resolveStarLabel(star),
      tier: star.tier,
      isAboveHorizon: horizontalCoordinates.isAboveHorizon,
    }]
  }).sort((left, right) => left.mag - right.mag || left.id.localeCompare(right.id))

  const labels = visibleStars
    .flatMap((star) => {
      const candidate = labelCandidateMap.get(star.id)
      const fallbackLabel = star.label
      const labelText = candidate?.text ?? fallbackLabel

      if (!star.isAboveHorizon) {
        return []
      }

      if (!labelText || (!candidate && star.mag > 2.5)) {
        return []
      }

      return [{
        id: star.id,
        text: labelText,
        x: star.x,
        y: star.y,
        z: star.z,
        priority: Math.max(candidate?.priority ?? 0, Math.max(1, Math.round((14 - star.mag) * 10))),
      }]
    })
    .sort((left, right) => right.priority - left.priority || left.text.localeCompare(right.text))

  return {
    stars: visibleStars.map(({ isAboveHorizon: _isAboveHorizon, ...star }) => star),
    labels,
    diagnostics: buildSkyDiagnostics(query, tiles, visibleStars.length, repositoryState),
  }
}