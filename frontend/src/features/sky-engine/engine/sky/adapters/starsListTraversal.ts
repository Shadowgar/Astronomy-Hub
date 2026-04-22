import type { RuntimeStar, RuntimeStarCatalog } from '../contracts/stars'
import type { SkyTilePayload } from '../contracts/tiles'

type OrderedTile = {
  readonly tileId: string
  readonly tile: SkyTilePayload
}

export type StarsListTileTraversalState = {
  readonly roots: readonly OrderedTile[]
  readonly childrenByParentId: ReadonlyMap<string, readonly OrderedTile[]>
}

function byNumberAsc(left: number, right: number) {
  if (left < right) {
    return -1
  }
  if (left > right) {
    return 1
  }
  return 0
}

function resolveOrderingOrder(tile: SkyTilePayload) {
  return tile.provenance?.hipsOrder ?? tile.level
}

function resolveOrderingPix(tile: SkyTilePayload) {
  return tile.provenance?.hipsPix ?? Number.MAX_SAFE_INTEGER
}

/**
 * Deterministic tile ordering for the loaded-runtime `stars_list` seam.
 * We prioritize upstream HiPS identity when available, then fall back to
 * quadtree level/tile id for merged/runtime-only payloads.
 */
export function compareStarsListTraversalTileOrder(
  left: SkyTilePayload,
  right: SkyTilePayload,
): number {
  const orderCmp = byNumberAsc(resolveOrderingOrder(left), resolveOrderingOrder(right))
  if (orderCmp !== 0) {
    return orderCmp
  }
  const pixCmp = byNumberAsc(resolveOrderingPix(left), resolveOrderingPix(right))
  if (pixCmp !== 0) {
    return pixCmp
  }
  const levelCmp = byNumberAsc(left.level, right.level)
  if (levelCmp !== 0) {
    return levelCmp
  }
  return left.tileId.localeCompare(right.tileId)
}

function buildOrderedTiles(tiles: readonly SkyTilePayload[]): readonly OrderedTile[] {
  return tiles
    .slice()
    .sort(compareStarsListTraversalTileOrder)
    .map((tile) => ({
      tileId: tile.tileId,
      tile,
    }))
}

/**
 * Builds a loaded-tile traversal graph for `stars.c::stars_list` parity work.
 * Roots are tiles whose parent is not present in the active set (or null),
 * matching the way a HiPS iterator starts from top-level nodes.
 */
export function buildStarsListTileTraversalState(
  tiles: readonly SkyTilePayload[],
): StarsListTileTraversalState {
  const ordered = buildOrderedTiles(tiles)
  const orderedById = new Map(ordered.map((entry) => [entry.tileId, entry] as const))
  const childrenByParentId = new Map<string, OrderedTile[]>()
  const roots: OrderedTile[] = []

  for (const entry of ordered) {
    const parentId = entry.tile.parentTileId
    if (!parentId || !orderedById.has(parentId)) {
      roots.push(entry)
      continue
    }
    const current = childrenByParentId.get(parentId)
    if (current) {
      current.push(entry)
    } else {
      childrenByParentId.set(parentId, [entry])
    }
  }

  return {
    roots,
    childrenByParentId,
  }
}

type StarsListTraversalFrame = {
  readonly tile: SkyTilePayload
  childIndex: number
  shouldVisitChildren: boolean
}

/**
 * Explicit stack iterator mirroring the `hips_iter_next` + `hips_iter_push_children`
 * flow used by `stars.c::stars_list`.
 */
export class StarsListTraversalCursor {
  private readonly roots: readonly OrderedTile[]
  private readonly childrenByParentId: ReadonlyMap<string, readonly OrderedTile[]>
  private readonly stack: StarsListTraversalFrame[] = []
  private rootIndex = 0

  constructor(state: StarsListTileTraversalState) {
    this.roots = state.roots
    this.childrenByParentId = state.childrenByParentId
  }

  private pushRootIfAvailable() {
    if (this.rootIndex >= this.roots.length) {
      return false
    }
    const root = this.roots[this.rootIndex]
    this.rootIndex += 1
    this.stack.push({
      tile: root.tile,
      childIndex: 0,
      shouldVisitChildren: false,
    })
    return true
  }

  /**
   * Returns the next tile to process (`hips_iter_next` analog).
   * Each yielded tile starts with `shouldVisitChildren=false`.
   */
  nextTile(): SkyTilePayload | null {
    if (this.stack.length === 0) {
      if (!this.pushRootIfAvailable()) {
        return null
      }
    }

    while (this.stack.length > 0) {
      const top = this.stack[this.stack.length - 1]
      if (!top.shouldVisitChildren) {
        return top.tile
      }
      const children = this.childrenByParentId.get(top.tile.tileId) ?? []
      if (top.childIndex < children.length) {
        const child = children[top.childIndex]
        top.childIndex += 1
        this.stack.push({
          tile: child.tile,
          childIndex: 0,
          shouldVisitChildren: false,
        })
        continue
      }
      this.stack.pop()
      if (this.stack.length === 0 && this.rootIndex < this.roots.length) {
        this.pushRootIfAvailable()
      }
    }

    return null
  }

  /**
   * Equivalent to `hips_iter_push_children(&iter, order, pix)`:
   * children are only visited when this is called after processing the tile.
   */
  pushChildrenForCurrentTile() {
    const top = this.stack[this.stack.length - 1]
    if (!top) {
      return
    }
    top.shouldVisitChildren = true
  }

  /**
   * Equivalent to skipping `hips_iter_push_children` and advancing to sibling/root.
   */
  skipChildrenForCurrentTile() {
    const top = this.stack[this.stack.length - 1]
    if (!top) {
      return
    }
    top.shouldVisitChildren = true
    const children = this.childrenByParentId.get(top.tile.tileId) ?? []
    top.childIndex = children.length
  }
}

type VisitNoHintInput = {
  readonly tiles: readonly SkyTilePayload[]
  readonly maxMag: number
  readonly sourceCatalog: RuntimeStarCatalog | null
  readonly visit: (star: RuntimeStar) => boolean | void
}

/**
 * Loaded-runtime no-hint traversal mirroring `stars.c::stars_list` loop:
 * - tiles with `mag_min >= max_mag` are skipped and do not descend,
 * - stars with `vmag > max_mag` are skipped with `continue`,
 * - callback break stops traversal and does not push children.
 */
export function visitStarsListNoHintTraversal(input: VisitNoHintInput): void {
  const state = buildStarsListTileTraversalState(input.tiles)
  const cursor = new StarsListTraversalCursor(state)

  while (true) {
    const tile = cursor.nextTile()
    if (!tile) {
      break
    }
    if (tile.magMin >= input.maxMag) {
      cursor.skipChildrenForCurrentTile()
      continue
    }

    let interrupted = false
    for (const star of tile.stars) {
      if (input.sourceCatalog != null && star.catalog !== input.sourceCatalog) {
        continue
      }
      if (star.mag > input.maxMag) {
        continue
      }
      if (input.visit(star)) {
        interrupted = true
        break
      }
    }
    if (interrupted) {
      break
    }
    cursor.pushChildrenForCurrentTile()
  }
}
