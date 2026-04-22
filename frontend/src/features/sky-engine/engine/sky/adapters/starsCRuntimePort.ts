import type { RuntimeStar } from '../contracts/stars'
import type { SkyTilePayload } from '../contracts/tiles'
import { hipGetPix, parseHipIdFromRuntimeStar } from './hipGetPix'
import { nuniqToHealpixOrderAndPix } from './starsNuniq'

export const MODULE_AGAIN = 'again' as const

export type StarsPortListStatus = 'ok' | typeof MODULE_AGAIN

export type StarsPortTile = {
  order: number
  pix: number
  magMin: number
  stars: readonly RuntimeStar[]
}

export type StarsPortTileLoadResult = {
  tile: StarsPortTile | null
  code: number
}

export type StarsPortSurvey = {
  key: string
  minOrder: number
  minVmag: number
  maxVmag: number
  isGaia: boolean
  listTraversalTiles: () => readonly { order: number; pix: number }[]
  getTile: (order: number, pix: number, sync: boolean) => StarsPortTileLoadResult
}

export type StarsPortState = {
  surveys: StarsPortSurvey[]
}

export type StarsPortLookupResult =
  | { status: 'found'; star: RuntimeStar }
  | { status: 'pending' }
  | { status: 'not-found' }

type PortOrderLookupResult =
  | { status: 'found'; star: RuntimeStar }
  | { status: 'pending' }
  | { status: 'continue' }

const SURVEY_MAX_MAG_INFINITY = 1000

function compareNumber(left: number, right: number) {
  if (left < right) {
    return -1
  }
  if (left > right) {
    return 1
  }
  return 0
}

function comparableSurveyMaxVmag(value: number) {
  return Number.isFinite(value) ? value : SURVEY_MAX_MAG_INFINITY
}

/**
 * Source parity for `stars.c::survey_cmp`:
 * - compare only `max_vmag`
 * - non-finite max values sort last
 */
export function compareStarsPortSurveyByMaxVmag(left: StarsPortSurvey, right: StarsPortSurvey) {
  return compareNumber(comparableSurveyMaxVmag(left.maxVmag), comparableSurveyMaxVmag(right.maxVmag))
}

function copySurvey(survey: StarsPortSurvey): StarsPortSurvey {
  return {
    ...survey,
  }
}

function findGaiaSurvey(surveys: readonly StarsPortSurvey[]) {
  return surveys.find((survey) => survey.isGaia) ?? null
}

/**
 * Source parity for `stars.c::stars_add_data_source` ordering and Gaia min-vmag gate update:
 * - append survey
 * - sort via `survey_cmp`
 * - if Gaia exists, raise its `min_vmag` to max non-Gaia finite `max_vmag`
 */
export function addStarsPortSurvey(state: StarsPortState, survey: StarsPortSurvey): StarsPortState {
  const nextSurveys = [...state.surveys.map(copySurvey), copySurvey(survey)]
  nextSurveys.sort(compareStarsPortSurveyByMaxVmag)

  const gaia = findGaiaSurvey(nextSurveys)
  if (gaia) {
    for (const current of nextSurveys) {
      if (current.isGaia || !Number.isFinite(current.maxVmag)) {
        continue
      }
      gaia.minVmag = Math.max(gaia.minVmag, current.maxVmag)
    }
  }

  return {
    surveys: nextSurveys,
  }
}

/**
 * Source parity for survey resolution in `stars.c::stars_list`:
 * - if source key is present and found, use that survey
 * - otherwise fallback to first survey
 */
export function resolveStarsPortSurveyBySource(
  state: StarsPortState,
  sourceKey: string | null | undefined,
): StarsPortSurvey | null {
  if (state.surveys.length === 0) {
    return null
  }

  if (sourceKey) {
    const matched = state.surveys.find((survey) => survey.key === sourceKey)
    if (matched) {
      return matched
    }
  }

  return state.surveys[0] ?? null
}

function normalizeMaxMag(maxMag: number | undefined): number {
  if (maxMag == null || !Number.isFinite(maxMag)) {
    return Number.POSITIVE_INFINITY
  }
  return maxMag
}

function visitTileStarsWithMaxMag(
  tile: StarsPortTile,
  maxMag: number,
  visit: (star: RuntimeStar) => boolean | void,
): boolean {
  for (const star of tile.stars) {
    if (star.mag > maxMag) {
      continue
    }
    if (visit(star)) {
      return true
    }
  }
  return false
}

function visitTileStarsWithoutMaxMag(
  tile: StarsPortTile,
  visit: (star: RuntimeStar) => boolean | void,
): boolean {
  for (const star of tile.stars) {
    if (visit(star)) {
      return true
    }
  }
  return false
}

/**
 * Source-faithful subset of `stars.c::stars_list` with survey-local tile loaders:
 * - no hint: traverse survey tiles in caller-provided deterministic order,
 *   skip tiles with `mag_min >= max_mag`, and apply `max_mag` per-row filtering
 * - hint: decode nuniq and resolve exact tile; if tile missing with code=0,
 *   return `MODULE_AGAIN`; on successful tile load iterate all rows with no
 *   local max-mag gate (source behavior)
 */
export function listStarsFromPortSurvey(params: {
  survey: StarsPortSurvey
  maxMag?: number
  hintNuniq?: bigint | number
  visit: (star: RuntimeStar) => boolean | void
}): StarsPortListStatus {
  const { survey, visit } = params
  const maxMag = normalizeMaxMag(params.maxMag)

  if (params.hintNuniq != null) {
    const { order, pix } = nuniqToHealpixOrderAndPix(params.hintNuniq)
    const result = survey.getTile(order, pix, false)

    if (!result.tile) {
      if (result.code === 0) {
        return MODULE_AGAIN
      }
      return 'ok'
    }

    visitTileStarsWithoutMaxMag(result.tile, visit)
    return 'ok'
  }

  const traversal = survey.listTraversalTiles()
  for (const step of traversal) {
    const result = survey.getTile(step.order, step.pix, false)
    if (!result.tile) {
      continue
    }
    if (result.tile.magMin >= maxMag) {
      continue
    }
    const interrupted = visitTileStarsWithMaxMag(result.tile, maxMag, visit)
    if (interrupted) {
      break
    }
  }

  return 'ok'
}

/**
 * Source-faithful `stars.c::obj_get_by_hip` behavior with survey loader seams:
 * - probe `hip_get_pix(hip, 0)` then `(hip, 1)`
 * - skip Gaia surveys
 * - tile loader uses `sync=true`
 * - if any tile returns code=0 (loading), return pending
 * - first HIP match returns found
 */
function findStarInTileByHip(tile: StarsPortTile, hip: number): RuntimeStar | null {
  for (const star of tile.stars) {
    if (parseHipIdFromRuntimeStar(star) === hip) {
      return star
    }
  }
  return null
}

function resolveOrderLookupAcrossSurveys(
  surveys: readonly StarsPortSurvey[],
  order: 0 | 1,
  pix: number,
  hip: number,
): PortOrderLookupResult {
  for (const survey of surveys) {
    if (survey.isGaia) {
      continue
    }

    const result = survey.getTile(order, pix, true)
    if (!result.tile) {
      if (result.code === 0) {
        return { status: 'pending' }
      }
      continue
    }

    const matched = findStarInTileByHip(result.tile, hip)
    if (matched) {
      return { status: 'found', star: matched }
    }
  }

  return { status: 'continue' }
}

export function findStarByHipFromPortSurveys(state: StarsPortState, hip: number): StarsPortLookupResult {
  const pixOrder0 = hipGetPix(hip, 0)
  const pixOrder1 = hipGetPix(hip, 1)

  if (pixOrder0 === -1 || pixOrder1 === -1) {
    return { status: 'not-found' }
  }

  for (const [order, pix] of [[0, pixOrder0], [1, pixOrder1]] as const) {
    const result = resolveOrderLookupAcrossSurveys(state.surveys, order, pix, hip)
    if (result.status === 'found') {
      return result
    }
    if (result.status === 'pending') {
      return { status: 'pending' }
    }
  }

  return { status: 'not-found' }
}

function collectProvenanceHipsTiles(tile: SkyTilePayload): readonly { order: number; pix: number }[] {
  const fromMulti = (tile.provenance?.hipsTiles ?? []).map((entry) => ({ order: entry.order, pix: entry.pix }))
  if (fromMulti.length > 0) {
    return fromMulti
  }

  if (
    Number.isFinite(tile.provenance?.hipsOrder) &&
    Number.isFinite(tile.provenance?.hipsPix)
  ) {
    return [{ order: tile.provenance?.hipsOrder ?? 0, pix: tile.provenance?.hipsPix ?? 0 }]
  }

  return []
}

function buildTraversalTiles(tiles: readonly SkyTilePayload[]) {
  const dedupe = new Set<string>()
  const result: { order: number; pix: number }[] = []

  const stableTiles = [...tiles].sort((left, right) => (
    left.level - right.level || left.tileId.localeCompare(right.tileId)
  ))

  for (const tile of stableTiles) {
    for (const hipsTile of collectProvenanceHipsTiles(tile)) {
      const key = `${hipsTile.order}:${hipsTile.pix}`
      if (dedupe.has(key)) {
        continue
      }
      dedupe.add(key)
      result.push({ order: hipsTile.order, pix: hipsTile.pix })
    }
  }

  return result
}

function buildTileLookup(tiles: readonly SkyTilePayload[]) {
  const map = new Map<string, StarsPortTile>()
  for (const tile of tiles) {
    const hipsTiles = collectProvenanceHipsTiles(tile)
    for (const hipsTile of hipsTiles) {
      const key = `${hipsTile.order}:${hipsTile.pix}`
      if (map.has(key)) {
        continue
      }
      map.set(key, {
        order: hipsTile.order,
        pix: hipsTile.pix,
        magMin: tile.magMin,
        stars: tile.stars,
      })
    }
  }
  return map
}

export function createLoadedTilesPortSurvey(params: {
  key: string
  tiles: readonly SkyTilePayload[]
  isGaia: boolean
  minOrder?: number
  minVmag?: number
  maxVmag?: number
  missingHintCode?: number
}): StarsPortSurvey {
  const {
    key,
    tiles,
    isGaia,
    minOrder = 0,
    minVmag = -2,
    maxVmag = Number.NaN,
    missingHintCode = 0,
  } = params

  const traversalTiles = buildTraversalTiles(tiles)
  const lookup = buildTileLookup(tiles)

  return {
    key,
    minOrder,
    minVmag,
    maxVmag,
    isGaia,
    listTraversalTiles: () => traversalTiles,
    getTile: (order, pix) => {
      const tile = lookup.get(`${order}:${pix}`) ?? null
      if (!tile) {
        return {
          tile: null,
          code: missingHintCode,
        }
      }
      return {
        tile,
        code: 200,
      }
    },
  }
}

export function createStarsPortState(surveys?: readonly StarsPortSurvey[]): StarsPortState {
  return {
    surveys: surveys ? surveys.map(copySurvey) : [],
  }
}
