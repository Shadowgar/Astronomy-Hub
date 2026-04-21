import type { RuntimeStar, RuntimeStarCatalog } from '../contracts/stars'
import type { SkyTilePayload } from '../contracts/tiles'
import { nuniqToHealpixOrderAndPix } from './starsNuniq'

export type StarsListStatus = 'ok' | 'again'

export type StarsListSourceKey = RuntimeStarCatalog | null

type StarsListOptions = {
  readonly tiles: readonly SkyTilePayload[]
  readonly maxMag?: number
  readonly source?: StarsListSourceKey
  readonly hintNuniq?: bigint | number
  readonly visit: (star: RuntimeStar) => boolean | void
}

function normalizeMaxMag(maxMag?: number): number {
  return Number.isFinite(maxMag) ? maxMag as number : Number.POSITIVE_INFINITY
}

function resolveSourceCatalog(
  tiles: readonly SkyTilePayload[],
  source: StarsListSourceKey,
): RuntimeStarCatalog | null {
  if (source) {
    return source
  }
  const firstStar = tiles
    .slice()
    .sort((a, b) => a.level - b.level || a.tileId.localeCompare(b.tileId))
    .flatMap((tile) => tile.stars)
    .find((star) => star.catalog === 'hipparcos' || star.catalog === 'gaia')
  return firstStar?.catalog ?? null
}

function resolveHintTile(
  tiles: readonly SkyTilePayload[],
  hintNuniq: bigint | number,
): SkyTilePayload | null {
  const { order, pix } = nuniqToHealpixOrderAndPix(hintNuniq)
  for (const tile of tiles) {
    if (tile.provenance?.hipsOrder === order && tile.provenance?.hipsPix === pix) {
      return tile
    }
  }
  return null
}

/**
 * Source-faithful subset of `stars.c::stars_list` over loaded runtime survey tiles:
 * - select survey by source key (or default to first available loaded survey),
 * - with no hint: stable tile traversal, max-mag filtering, and early callback break,
 * - with hint: decode nuniq to `(order,pix)` and target that exact loaded tile,
 * - unresolved hint tile returns `again` (Stellarium `MODULE_AGAIN` seam).
 */
export function listRuntimeStarsFromTiles(options: StarsListOptions): StarsListStatus {
  const sourceCatalog = resolveSourceCatalog(options.tiles, options.source ?? null)
  const maxMag = normalizeMaxMag(options.maxMag)
  const sourceTiles = options.tiles
    .filter((tile) => tile.stars.some((star) => star.catalog === sourceCatalog))
    .slice()
    .sort((a, b) => a.level - b.level || a.tileId.localeCompare(b.tileId))

  if (sourceTiles.length === 0) {
    return 'ok'
  }

  if (options.hintNuniq != null) {
    const hintTile = resolveHintTile(sourceTiles, options.hintNuniq)
    if (!hintTile) {
      return 'again'
    }
    for (const star of hintTile.stars) {
      if (star.catalog !== sourceCatalog) {
        continue
      }
      if (star.mag > maxMag) {
        continue
      }
      if (options.visit(star)) {
        break
      }
    }
    return 'ok'
  }

  for (const tile of sourceTiles) {
    for (const star of tile.stars) {
      if (star.catalog !== sourceCatalog) {
        continue
      }
      if (star.mag > maxMag) {
        continue
      }
      if (options.visit(star)) {
        return 'ok'
      }
    }
  }
  return 'ok'
}
