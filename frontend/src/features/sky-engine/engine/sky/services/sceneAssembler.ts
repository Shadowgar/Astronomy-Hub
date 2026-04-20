import type { SkyScenePacket } from '../contracts/scene'
import type { RuntimeStar } from '../contracts/stars'
import type { SkyEngineQuery, SkyTilePayload, SkyTileRepositoryLoadResult } from '../contracts/tiles'
import { dedupeRuntimeStars } from '../core/dedupe'
import { buildSkyDiagnostics } from '../diagnostics/skyDiagnostics'
import { ERFA_DJM0 } from '../runtime/erfaConstants'
import {
  computeCatalogStarPvFromCatalogueUnits,
  starAstrometricIcrfVector,
  type CatalogStarPv,
} from '../runtime/starsCatalogAstrom'
import {
  convertObserverFrameVector,
  raDecToObserverUnitVector,
  unitVectorToHorizontalCoordinates,
  type ObserverAstrometrySnapshot,
  type UnitVector3,
} from '../transforms/coordinates'

/**
 * Per-star pv-vector cache matching Stellarium `stars.c` where `compute_pv`
 * runs once at tile load (`on_file_tile_loaded`) and every frame reads
 * from `star_t.pvo`. Hub tile stars are immutable reference objects
 * emitted from `dedupeRuntimeStars`, so a WeakMap keyed on the star
 * reference yields the same once-per-star behaviour without mutating
 * tile payloads.
 */
const catalogPvCache = new WeakMap<RuntimeStar, CatalogStarPv | null>()

function resolveCatalogPv(star: RuntimeStar): CatalogStarPv | null {
  const cached = catalogPvCache.get(star)
  if (cached !== undefined) {
    return cached
  }
  const parallaxMas = star.parallaxMas ?? 0
  // Stellarium `on_file_tile_loaded` rejects `plx < 2/1000 arcsec` as dirty
  // catalog data and falls back to `plx = 0`. `compute_pv` then zeroes
  // proper motion as well (`if (plx <= 0) plx = pde = pra = 0`), so for
  // those rows Hub should stay on the static ra/dec path.
  if (parallaxMas <= 2) {
    catalogPvCache.set(star, null)
    return null
  }
  const pv = computeCatalogStarPvFromCatalogueUnits({
    raDeg: star.raDeg,
    decDeg: star.decDeg,
    pmRaMasYr: star.pmRaMasYr,
    pmDecMasYr: star.pmDecMasYr,
    parallaxMas,
  })
  catalogPvCache.set(star, pv)
  return pv
}

function projectStarFromPv(
  pv: CatalogStarPv,
  astrometry: ObserverAstrometrySnapshot,
): { vector: UnitVector3; isAboveHorizon: boolean } | null {
  const ttJulianDate = astrometry.ttJulianDate
  const earthPv = astrometry.earthPv
  if (ttJulianDate == null || !earthPv) {
    return null
  }
  const ttMjd = ttJulianDate - ERFA_DJM0
  const icrf = starAstrometricIcrfVector(pv, ttMjd, earthPv)
  if (icrf[0] === 0 && icrf[1] === 0 && icrf[2] === 0) {
    return null
  }
  const observed = convertObserverFrameVector(
    { x: icrf[0], y: icrf[1], z: icrf[2] },
    'icrf',
    'observed_geom',
    astrometry,
  )
  const horizontal = unitVectorToHorizontalCoordinates(observed)
  return { vector: observed, isAboveHorizon: horizontal.isAboveHorizon }
}
const DEFAULT_REPOSITORY_STATE: Pick<SkyTileRepositoryLoadResult, 'mode' | 'sourceLabel' | 'sourceError'> = {
  mode: 'hipparcos',
  sourceLabel: 'Sky tile repository',
  sourceError: null,
}

export function assembleSkyScenePacket(
  query: SkyEngineQuery,
  tiles: readonly SkyTilePayload[],
  repositoryState: Pick<SkyTileRepositoryLoadResult, 'mode' | 'sourceLabel' | 'sourceError'> = DEFAULT_REPOSITORY_STATE,
): SkyScenePacket {
  const visibleTileSet = new Set(query.visibleTileIds)
  const visibleTilesById = new Map(
    tiles
      .filter((tile) => visibleTileSet.has(tile.tileId))
      .map((tile) => [tile.tileId, tile] as const),
  )
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
  )

  const visibleStars = dedupedStars.flatMap((star) => {
    const astrometrySnapshot = query.observerFrameAstrometry
    const catalogPv = astrometrySnapshot ? resolveCatalogPv(star) : null
    const projectedFromPv = catalogPv && astrometrySnapshot
      ? projectStarFromPv(catalogPv, astrometrySnapshot)
      : null

    if (projectedFromPv) {
      return [{
        id: star.id,
        x: projectedFromPv.vector.x,
        y: projectedFromPv.vector.y,
        z: projectedFromPv.vector.z,
        mag: star.mag,
        colorIndex: star.colorIndex,
        tier: star.tier,
        isAboveHorizon: projectedFromPv.isAboveHorizon,
      }]
    }

    const { vector, horizontalCoordinates } = raDecToObserverUnitVector(
      star.raDeg,
      star.decDeg,
      query.observer,
      astrometrySnapshot,
    )

    return [{
      id: star.id,
      x: vector.x,
      y: vector.y,
      z: vector.z,
      mag: star.mag,
      colorIndex: star.colorIndex,
      tier: star.tier,
      isAboveHorizon: horizontalCoordinates.isAboveHorizon,
    }]
  }).sort((left, right) => left.mag - right.mag || left.id.localeCompare(right.id))
  const starById = new Map(visibleStars.map((star) => [star.id, star] as const))
  const assignedStarIds = new Set<string>()
  const starTiles = query.visibleTileIds.flatMap((tileId) => {
    const tile = visibleTilesById.get(tileId)
    if (!tile) {
      return []
    }
    const starIds = [...tile.stars]
      .sort((left, right) => left.mag - right.mag || left.id.localeCompare(right.id))
      .flatMap((star) => {
        if (assignedStarIds.has(star.id)) {
          return []
        }
        if (!starById.has(star.id)) {
          return []
        }
        assignedStarIds.add(star.id)
        return [star.id]
      })

    return [{
      tileId: tile.tileId,
      level: tile.level,
      parentTileId: tile.parentTileId,
      childTileIds: [...(tile.childTileIds ?? [])],
      magMin: tile.magMin,
      magMax: tile.magMax,
      starIds,
    }]
  })

  const labels = visibleStars
    .flatMap((star) => {
      const candidate = labelCandidateMap.get(star.id)

      if (!star.isAboveHorizon) {
        return []
      }

      if (!candidate?.text) {
        return []
      }

      return [{
        id: star.id,
        text: candidate.text,
        x: star.x,
        y: star.y,
        z: star.z,
        priority: candidate.priority,
      }]
    })
    .sort((left, right) => right.priority - left.priority || left.text.localeCompare(right.text))

  return {
    stars: visibleStars.map(({ isAboveHorizon: _isAboveHorizon, ...star }) => star),
    starTiles,
    labels,
    diagnostics: buildSkyDiagnostics(query, tiles, visibleStars.length, repositoryState),
  }
}
