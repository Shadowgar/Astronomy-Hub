import type { SkyScenePacket } from '../contracts/scene'
import type { RuntimeStar } from '../contracts/stars'
import type { SkyEngineQuery, SkyTilePayload } from '../contracts/tiles'
import { dedupeRuntimeStars } from '../core/dedupe'
import { buildSkyDiagnostics } from '../diagnostics/skyDiagnostics'
import { raDecToObserverUnitVector } from '../transforms/coordinates'

function resolveStarLabel(star: RuntimeStar) {
  return star.properName ?? star.bayer ?? star.flamsteed
}

export function assembleSkyScenePacket(query: SkyEngineQuery, tiles: readonly SkyTilePayload[]): SkyScenePacket {
  const activeTierSet = new Set(query.activeTiers)
  const visibleTileSet = new Set(query.visibleTileIds)
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
    .filter((star) => Boolean(star.label) && star.mag <= 2.5)
    .map((star) => ({
      id: star.id,
      text: star.label as string,
      x: star.x,
      y: star.y,
      z: star.z,
      priority: Math.max(1, Math.round((14 - star.mag) * 10)),
    }))
    .sort((left, right) => right.priority - left.priority || left.text.localeCompare(right.text))

  return {
    stars: visibleStars,
    labels,
    diagnostics: buildSkyDiagnostics(query, tiles, visibleStars.length),
  }
}