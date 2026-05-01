import type { SkyScenePacket } from '../contracts/scene'

type PacketStar = SkyScenePacket['stars'][number]
type PacketStarTile = SkyScenePacket['starTiles'][number]

export type StarsRenderVisitorProjectedPoint = {
  readonly planeX: number
  readonly planeY: number
  readonly screenX: number
  readonly screenY: number
  readonly depth: number
  readonly angularDistanceRad: number
}

export type StarsRenderVisitorEntry = {
  readonly star: PacketStar
  readonly tileId: string
  readonly projectedPoint: StarsRenderVisitorProjectedPoint
}

type VisitTileContext = {
  readonly tile: PacketStarTile
  readonly stars: readonly PacketStar[]
}

export type VisitStarsRenderTilesInput = {
  readonly scenePacket: SkyScenePacket | null
  readonly starsLimitMagnitude: number
  readonly hardLimitMagnitude: number
  readonly projectStar: (star: PacketStar) => StarsRenderVisitorProjectedPoint | null
  readonly isPointClipped: (projected: StarsRenderVisitorProjectedPoint) => boolean
  readonly isTileClipped?: (tile: PacketStarTile) => boolean
}

type VisitTileResult = {
  readonly entries: StarsRenderVisitorEntry[]
  readonly shouldDescend: boolean
}

function getTileOrder(scenePacket: SkyScenePacket, tilesById: Map<string, PacketStarTile>) {
  const configuredOrder = scenePacket.diagnostics.visibleTileIds.filter((tileId) => tilesById.has(tileId))
  const roots: string[] = []

  for (const tileId of configuredOrder) {
    const tile = tilesById.get(tileId)
    if (!tile) {
      continue
    }
    if (tile.parentTileId == null || !tilesById.has(tile.parentTileId)) {
      roots.push(tileId)
    }
  }

  if (roots.length > 0) {
    return roots
  }

  // Fallback: if diagnostics roots are absent, recover root tiles directly from
  // scenePacket.starTiles so traversal still mirrors stars.c root->children walk.
  for (const tile of scenePacket.starTiles) {
    if (tile.parentTileId == null || !tilesById.has(tile.parentTileId)) {
      roots.push(tile.tileId)
    }
  }

  return roots
}

function sortStarsByMagnitude(stars: readonly PacketStar[]) {
  return [...stars].sort((left, right) => left.mag - right.mag || left.id.localeCompare(right.id))
}

function visitTile({
  tile,
  stars,
}: VisitTileContext, input: VisitStarsRenderTilesInput, limitMagnitude: number): VisitTileResult {
  // stars.c::render_visitor (lines 671-672): tile-level magnitude gate.
  if (tile.magMin > limitMagnitude) {
    return { entries: [], shouldDescend: false }
  }
  // stars.c::render_visitor (lines 661-663): clipped tiles early-exit.
  if (input.isTileClipped?.(tile) === true) {
    return { entries: [], shouldDescend: false }
  }

  const entries: StarsRenderVisitorEntry[] = []
  for (const star of sortStarsByMagnitude(stars)) {
    // stars.c::render_visitor (lines 675-677): stars are sorted by vmag; break at first overflow.
    if (star.mag > limitMagnitude) {
      break
    }
    const projectedPoint = input.projectStar(star)
    // stars.c::render_visitor (lines 679-680): skip stars failing painter_project.
    if (!projectedPoint) {
      continue
    }
    // stars.c::render_visitor clipped-point behavior via painter clip gate.
    if (input.isPointClipped(projectedPoint)) {
      continue
    }
    entries.push({
      star,
      tileId: tile.tileId,
      projectedPoint,
    })
  }

  // stars.c::render_visitor (lines 714-716): descend only when mag_max exceeds limit_mag.
  return {
    entries,
    shouldDescend: tile.magMax > limitMagnitude,
  }
}

export function visitStarsRenderTiles(input: VisitStarsRenderTilesInput): StarsRenderVisitorEntry[] {
  const scenePacket = input.scenePacket
  if (!scenePacket) {
    return []
  }

  // stars.c::render_visitor (line 658): limit_mag = fmin(stars_limit_mag, hard_limit_mag).
  const limitMagnitude = Math.min(input.starsLimitMagnitude, input.hardLimitMagnitude)
  const starById = new Map(scenePacket.stars.map((star) => [star.id, star] as const))
  const tilesById = new Map(scenePacket.starTiles.map((tile) => [tile.tileId, tile] as const))
  const roots = getTileOrder(scenePacket, tilesById)
  const visited = new Set<string>()
  const entries: StarsRenderVisitorEntry[] = []

  function walk(tileId: string) {
    if (visited.has(tileId)) {
      return
    }
    visited.add(tileId)
    const tile = tilesById.get(tileId)
    if (!tile) {
      return
    }
    const stars = tile.starIds
      .map((starId) => starById.get(starId))
      .filter((star): star is PacketStar => Boolean(star))
    const result = visitTile({ tile, stars }, input, limitMagnitude)
    entries.push(...result.entries)

    if (!result.shouldDescend) {
      return
    }
    for (const childTileId of tile.childTileIds) {
      if (!tilesById.has(childTileId)) {
        continue
      }
      walk(childTileId)
    }
  }

  for (const rootId of roots) {
    walk(rootId)
  }

  return entries
}
