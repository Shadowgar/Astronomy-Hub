import type { RuntimeStar } from '../contracts/stars'
import type { SkyTilePayload } from '../contracts/tiles'
import { hipGetPix, parseHipIdFromRuntimeStar } from './hipGetPix'
import {
  createLoadedTilesPortSurvey,
  createStarsPortState,
  findStarByHipFromPortSurveys,
} from './starsCRuntimePort'

type HipLookupSurveyIndex = {
  readonly byOrder: {
    readonly 0: Map<number, readonly RuntimeStar[]>
    readonly 1: Map<number, readonly RuntimeStar[]>
  }
}

const hipLookupSurveyIndexCache = new WeakMap<readonly SkyTilePayload[], HipLookupSurveyIndex>()

export function buildHipDetailRoute(hip: number): string {
  return `hip/${hip}`
}

export function resolveHipDetailRouteForRuntimeStar(star: RuntimeStar): string | null {
  const hip = parseHipIdFromRuntimeStar(star)
  if (hip == null) {
    return null
  }
  return buildHipDetailRoute(hip)
}

function buildHipLookupSurveyIndex(tiles: readonly SkyTilePayload[]): HipLookupSurveyIndex {
  const byOrder0 = new Map<number, RuntimeStar[]>()
  const byOrder1 = new Map<number, RuntimeStar[]>()
  const stableTiles = [...tiles].sort((a, b) => a.level - b.level || a.tileId.localeCompare(b.tileId))
  const add = (map: Map<number, RuntimeStar[]>, pix: number, star: RuntimeStar) => {
    if (pix === -1) {
      return
    }
    const current = map.get(pix)
    if (current) {
      current.push(star)
      return
    }
    map.set(pix, [star])
  }

  const collect = (star: RuntimeStar) => {
    if (star.catalog === 'gaia') {
      return
    }
    const hip = parseHipIdFromRuntimeStar(star)
    if (hip == null) {
      return
    }
    add(byOrder0, hipGetPix(hip, 0), star)
    add(byOrder1, hipGetPix(hip, 1), star)
  }

  for (const tile of stableTiles) {
    for (const star of tile.stars) {
      collect(star)
    }
  }
  return {
    byOrder: {
      0: byOrder0,
      1: byOrder1,
    },
  }
}

function getHipLookupSurveyIndex(tiles: readonly SkyTilePayload[]): HipLookupSurveyIndex {
  const cached = hipLookupSurveyIndexCache.get(tiles)
  if (cached) {
    return cached
  }
  const built = buildHipLookupSurveyIndex(tiles)
  hipLookupSurveyIndexCache.set(tiles, built)
  return built
}

/**
 * Hub helper mirroring Stellarium `stars.c` `obj_get_by_hip` search intent:
 * - invalid / missing HIP tile mapping (`hip_get_pix` = -1) returns null,
 * - Gaia rows are ignored,
 * - search order follows `obj_get_by_hip`: evaluate `hip_get_pix(hip, 0)`
 *   before `hip_get_pix(hip, 1)`,
 * - first non-Gaia star matching HIP is returned (stable tile/row order).
 */
export function findRuntimeStarByHipInTiles(
  tiles: readonly SkyTilePayload[],
  hip: number,
): RuntimeStar | null {
  // stars.c::obj_get_by_hip (lines 931-936) + hip.c::hip_get_pix (lines 19-24)
  // reject missing mapping via hip_get_pix before tile lookup.
  if (hipGetPix(hip, 0) === -1 || hipGetPix(hip, 1) === -1) {
    return null
  }

  const index = getHipLookupSurveyIndex(tiles)

  const order0Tiles = Array.from(index.byOrder[0].entries()).map(([pix, stars]) => ({
    tileId: `lookup-o0-${pix}`,
    level: 0,
    parentTileId: null,
    childTileIds: [],
    bounds: { raMinDeg: 0, raMaxDeg: 1, decMinDeg: 0, decMaxDeg: 1 },
    magMin: 0,
    magMax: Number.POSITIVE_INFINITY,
    starCount: stars.length,
    stars: [...stars],
    provenance: {
      catalog: 'multi-survey' as const,
      sourcePath: 'starsLookup-index',
      sourceKey: 'hipparcos-index',
      sourceKeys: ['hipparcos-index'],
      hipsTiles: [{ sourceKey: 'hipparcos-index', order: 0, pix }],
    },
  }))

  const order1Tiles = Array.from(index.byOrder[1].entries()).map(([pix, stars]) => ({
    tileId: `lookup-o1-${pix}`,
    level: 1,
    parentTileId: null,
    childTileIds: [],
    bounds: { raMinDeg: 0, raMaxDeg: 1, decMinDeg: 0, decMaxDeg: 1 },
    magMin: 0,
    magMax: Number.POSITIVE_INFINITY,
    starCount: stars.length,
    stars: [...stars],
    provenance: {
      catalog: 'multi-survey' as const,
      sourcePath: 'starsLookup-index',
      sourceKey: 'hipparcos-index',
      sourceKeys: ['hipparcos-index'],
      hipsTiles: [{ sourceKey: 'hipparcos-index', order: 1, pix }],
    },
  }))

  const survey = createLoadedTilesPortSurvey({
    key: 'hipparcos-index',
    tiles: [...order0Tiles, ...order1Tiles],
    isGaia: false,
    missingHintCode: 404,
  })

  const result = findStarByHipFromPortSurveys(createStarsPortState([survey]), hip)
  if (result.status === 'found') {
    return result.star
  }

  return null
}
