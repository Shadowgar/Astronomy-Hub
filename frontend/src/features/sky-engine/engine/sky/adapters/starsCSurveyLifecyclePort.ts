import type { RuntimeStar } from '../contracts/stars'
import { coreMagToIlluminance } from '../core/stellariumVisualMath'
import { hipGetPix, parseHipIdFromRuntimeStar } from './hipGetPix'
import { nuniqToHealpixOrderAndPix } from './starsNuniq'

export const STARS_C_MODULE_AGAIN = 'again' as const

const STARS_C_DEFAULT_STAR_TYPE = '*'
const STARS_C_DEFAULT_EPOCH = 2000
const STARS_C_PLX_MIN_ARCSEC = 2 / 1000
const STARS_C_INF_MAG = 1000

type SurveyLike = {
  key: string
  isGaia: boolean
  minVmag: number
  maxVmag: number
}

export type StarsCLifecycleListStatus = 'ok' | typeof STARS_C_MODULE_AGAIN

export type StarsCSurveyProperties = {
  type: string
  hipsOrderMin: number
  maxVmag: number
  minVmag: number
  hipsReleaseDate: string | null
}

export type StarsCSourceRow = {
  type: string
  gaia: bigint
  hip: number
  vmag: number
  gmag: number
  ra: number
  de: number
  plx: number
  pra: number
  pde: number
  epoc: number
  bv: number
  ids: string
  spec: string
}

export type StarsCTileStar = RuntimeStar & {
  readonly starType: string
  readonly gaia: bigint
  readonly hip: number
  readonly names: readonly string[]
  readonly spectrum: string | null
  readonly epoch: number
  readonly plxArcsec: number
  readonly pmRaArcsecPerYear: number
  readonly pmDecArcsecPerYear: number
  readonly illuminance: number
}

export type StarsCTile = {
  readonly order: number
  readonly pix: number
  readonly stars: readonly StarsCTileStar[]
  readonly magMin: number
  readonly magMax: number
  readonly illuminance: number
}

export type StarsCTileLoadResult = {
  tile: StarsCTile | null
  code: number
}

export type StarsCSurveyRuntime = {
  readonly key: string
  readonly url: string
  readonly isGaia: boolean
  readonly minOrder: number
  minVmag: number
  readonly maxVmag: number
  readonly releaseDate: number
  readonly preloadRootPix: readonly number[]
  readonly listTraversalTiles: () => readonly { order: number; pix: number }[]
  readonly getTile: (order: number, pix: number, sync: boolean) => StarsCTileLoadResult
}

export type StarsCLifecycleState = {
  readonly surveys: readonly StarsCSurveyRuntime[]
}

export type StarsCLifecycleLookupResult =
  | { status: 'found'; star: StarsCTileStar }
  | { status: 'pending' }
  | { status: 'not-found' }

export type StarsCLifecycleParseResult = {
  tile: StarsCTile
  transparency: number
}

export type StarsCPreloadRequest = {
  order: number
  pix: number
}

export type StarsCTileStore = {
  get: (order: number, pix: number, sync: boolean) => StarsCTileLoadResult
  setTile: (tile: StarsCTile) => void
  setPending: (order: number, pix: number) => void
  setError: (order: number, pix: number, code: number) => void
  listTraversalTiles: () => readonly { order: number; pix: number }[]
}

function compareNumber(a: number, b: number): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

function normalizeComparableMag(value: number) {
  return Number.isFinite(value) ? value : STARS_C_INF_MAG
}

function sortBySurveyMaxVmag(a: SurveyLike, b: SurveyLike): number {
  return compareNumber(normalizeComparableMag(a.maxVmag), normalizeComparableMag(b.maxVmag))
}

export function compareStarsCSurveyByMaxVmag(
  left: Pick<StarsCSurveyRuntime, 'maxVmag'>,
  right: Pick<StarsCSurveyRuntime, 'maxVmag'>,
) {
  return compareNumber(normalizeComparableMag(left.maxVmag), normalizeComparableMag(right.maxVmag))
}

function parseDateToEpochMs(value: string | null): number {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function parsePropertiesLine(line: string): { key: string; value: string } | null {
  const trimmed = line.trim()
  if (trimmed.length === 0 || trimmed.startsWith('#')) {
    return null
  }
  const separator = trimmed.indexOf('=')
  if (separator < 0) {
    return null
  }
  return {
    key: trimmed.slice(0, separator).trim(),
    value: trimmed.slice(separator + 1).trim(),
  }
}

function parsePropertiesEntries(propertiesText: string): Record<string, string> {
  const out: Record<string, string> = {}
  const lines = propertiesText.split(/\r?\n/g)
  for (const line of lines) {
    const parsed = parsePropertiesLine(line)
    if (!parsed) continue
    out[parsed.key] = parsed.value
  }
  return out
}

function parseFiniteOrDefault(value: string | undefined, fallback: number): number {
  if (value == null) return fallback
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * Port of stars.c `hips_load_properties` + `properties_get_f` usage in
 * `stars_add_data_source`: string key-value properties with untyped values.
 */
export function parseStarsCSurveyProperties(propertiesText: string): StarsCSurveyProperties {
  const entries = parsePropertiesEntries(propertiesText)
  return {
    type: entries.type ?? '',
    hipsOrderMin: Number.parseInt(entries.hips_order_min ?? '0', 10),
    maxVmag: parseFiniteOrDefault(entries.max_vmag, Number.NaN),
    minVmag: parseFiniteOrDefault(entries.min_vmag, -2),
    hipsReleaseDate: entries.hips_release_date ?? null,
  }
}

function splitPipeSeparatedIds(ids: string): readonly string[] {
  if (!ids) return []
  return ids
    .split('|')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

function normalizeStarType(rawType: string): string {
  const trimmed = (rawType ?? '').trim()
  return trimmed.length > 0 ? trimmed : STARS_C_DEFAULT_STAR_TYPE
}

function normalizeEpoch(rawEpoch: number): number {
  return Number.isFinite(rawEpoch) && rawEpoch !== 0 ? rawEpoch : STARS_C_DEFAULT_EPOCH
}

function sanitizeParallaxArcsec(rawPlx: number): number {
  if (!Number.isFinite(rawPlx)) return 0
  if (rawPlx < STARS_C_PLX_MIN_ARCSEC) return 0
  return rawPlx
}

function resolveMagnitude(vmag: number, gmag: number): number {
  if (Number.isFinite(vmag)) return vmag
  return gmag
}

function runtimeTierForMag(mag: number): 'T0' | 'T1' | 'T2' {
  if (mag <= 4) return 'T0'
  if (mag <= 7) return 'T1'
  return 'T2'
}

function ensureHipFallbackIds(ids: readonly string[], hip: number): readonly string[] {
  if (ids.length > 0 || hip <= 0) {
    return ids
  }
  return [`HIP ${hip}`]
}

function selectSourceIdFromIds(ids: readonly string[], hip: number, gaia: bigint): string {
  const first = ids[0]
  if (first) return first
  if (hip > 0) return `HIP ${hip}`
  if (gaia > BigInt(0)) return `GAIA ${gaia.toString()}`
  return 'unknown'
}

function buildStableStarId(sourceId: string, hip: number, gaia: bigint): string {
  if (hip > 0) return `hip-${hip}`
  if (gaia > BigInt(0)) return `gaia-${gaia.toString()}`
  return `star-${sourceId.replace(/\s+/g, '-').toLowerCase()}`
}

function shouldSkipGaiaOverlap(rowMag: number, survey: Pick<StarsCSurveyRuntime, 'isGaia' | 'minVmag'>): boolean {
  if (!survey.isGaia) return false
  return rowMag < survey.minVmag
}

function isFiniteRaDec(raDeg: number, deDeg: number): boolean {
  return Number.isFinite(raDeg) && Number.isFinite(deDeg)
}

function starDataVmagComparator(a: StarsCTileStar, b: StarsCTileStar): number {
  return compareNumber(a.mag, b.mag)
}

function normalizeSpectrum(spec: string): string | null {
  const trimmed = (spec ?? '').trim()
  return trimmed.length > 0 ? trimmed : null
}

function deriveProperName(ids: readonly string[]): string | undefined {
  for (const id of ids) {
    if (id.startsWith('NAME ')) {
      const name = id.slice(5).trim()
      if (name.length > 0) return name
    }
  }
  return undefined
}

function toStarsCTileStar(row: StarsCSourceRow, survey: Pick<StarsCSurveyRuntime, 'isGaia' | 'minVmag'>): StarsCTileStar | null {
  const resolvedMag = resolveMagnitude(row.vmag, row.gmag)
  if (!Number.isFinite(resolvedMag)) {
    return null
  }

  const raDeg = row.ra
  const decDeg = row.de
  if (!isFiniteRaDec(raDeg, decDeg)) {
    return null
  }

  if (shouldSkipGaiaOverlap(resolvedMag, survey)) {
    return null
  }

  const ids = ensureHipFallbackIds(splitPipeSeparatedIds(row.ids), row.hip)
  const sourceId = selectSourceIdFromIds(ids, row.hip, row.gaia)

  const star: StarsCTileStar = {
    id: buildStableStarId(sourceId, row.hip, row.gaia),
    sourceId,
    raDeg,
    decDeg,
    mag: resolvedMag,
    tier: runtimeTierForMag(resolvedMag),
    catalog: survey.isGaia ? 'gaia' : 'hipparcos',
    colorIndex: Number.isFinite(row.bv) ? row.bv : undefined,
    properName: deriveProperName(ids),
    starType: normalizeStarType(row.type),
    gaia: row.gaia,
    hip: row.hip,
    names: ids,
    spectrum: normalizeSpectrum(row.spec),
    epoch: normalizeEpoch(row.epoc),
    plxArcsec: sanitizeParallaxArcsec(row.plx),
    pmRaArcsecPerYear: Number.isFinite(row.pra) ? row.pra : 0,
    pmDecArcsecPerYear: Number.isFinite(row.pde) ? row.pde : 0,
    illuminance: coreMagToIlluminance(resolvedMag),
    parallaxMas: Number.isFinite(row.plx) ? sanitizeParallaxArcsec(row.plx) * 1000 : undefined,
    pmRaMasYr: Number.isFinite(row.pra) ? row.pra * 1000 : undefined,
    pmDecMasYr: Number.isFinite(row.pde) ? row.pde * 1000 : undefined,
  }

  return star
}

function parseChildrenMask(rawChildrenMask: number | undefined): number {
  if (!Number.isFinite(rawChildrenMask)) {
    return 0
  }
  const integerMask = Math.trunc(rawChildrenMask ?? 0)
  return (~integerMask) & 15
}

/**
 * Port seam for `stars.c::on_file_tile_loaded` after binary row extraction:
 * - Gaia overlap filter using survey min_vmag
 * - parallax sanitization (`plx < 2/1000 arcsec => 0`)
 * - default type and epoch
 * - fallback HIP designation when ids are absent
 * - sort by vmag for early-exit semantics
 * - tile illuminance/mag range accumulation
 * - optional `children_mask` transparency derivation
 */
export function parseStarsCTileRows(params: {
  order: number
  pix: number
  rows: readonly StarsCSourceRow[]
  survey: Pick<StarsCSurveyRuntime, 'isGaia' | 'minVmag'>
  childrenMask?: number
}): StarsCLifecycleParseResult {
  const stars: StarsCTileStar[] = []

  for (const row of params.rows) {
    const normalized = toStarsCTileStar(row, params.survey)
    if (!normalized) {
      continue
    }
    stars.push(normalized)
  }

  stars.sort(starDataVmagComparator)

  let tileIlluminance = 0
  let magMin = Number.POSITIVE_INFINITY
  let magMax = Number.NEGATIVE_INFINITY

  for (const star of stars) {
    tileIlluminance += star.illuminance
    if (star.mag < magMin) magMin = star.mag
    if (star.mag > magMax) magMax = star.mag
  }

  const resolvedMagMin = stars.length > 0 ? magMin : Number.POSITIVE_INFINITY
  const resolvedMagMax = stars.length > 0 ? magMax : Number.NEGATIVE_INFINITY

  return {
    tile: {
      order: params.order,
      pix: params.pix,
      stars,
      magMin: resolvedMagMin,
      magMax: resolvedMagMax,
      illuminance: tileIlluminance,
    },
    transparency: parseChildrenMask(params.childrenMask),
  }
}

function cloneSurveyRuntime(survey: StarsCSurveyRuntime): StarsCSurveyRuntime {
  return {
    ...survey,
    preloadRootPix: [...survey.preloadRootPix],
    listTraversalTiles: survey.listTraversalTiles,
    getTile: survey.getTile,
  }
}

function cloneSurveys(surveys: readonly StarsCSurveyRuntime[]): StarsCSurveyRuntime[] {
  return surveys.map(cloneSurveyRuntime)
}

function buildGaiaMinVmagFromSurveys(surveys: readonly StarsCSurveyRuntime[], baseMinVmag: number): number {
  let nextMin = baseMinVmag
  for (const survey of surveys) {
    if (survey.isGaia || !Number.isFinite(survey.maxVmag)) {
      continue
    }
    nextMin = Math.max(nextMin, survey.maxVmag)
  }
  return nextMin
}

function applyGaiaFloorMutation(surveys: StarsCSurveyRuntime[]): void {
  const gaia = surveys.find((survey) => survey.isGaia)
  if (!gaia) return
  gaia.minVmag = buildGaiaMinVmagFromSurveys(surveys, gaia.minVmag)
}

export function createStarsCLifecycleState(surveys?: readonly StarsCSurveyRuntime[]): StarsCLifecycleState {
  return {
    surveys: surveys ? cloneSurveys(surveys) : [],
  }
}

function createRootPreloadPix(): readonly number[] {
  return Object.freeze(Array.from({ length: 12 }, (_, index) => index))
}

function normalizeSurveyKey(key: string | null | undefined, url: string): string {
  const direct = (key ?? '').trim()
  if (direct.length > 0) return direct
  const tokens = url.split('/').filter(Boolean)
  const last = tokens[tokens.length - 1]
  if (last) return last.toLowerCase()
  return 'survey'
}

function isGaiaKey(key: string): boolean {
  return key.toLowerCase() === 'gaia'
}

export function buildStarsCSurveyPreloadRequests(survey: Pick<StarsCSurveyRuntime, 'minOrder' | 'minVmag'>): readonly StarsCPreloadRequest[] {
  if (!(survey.minOrder === 0 && survey.minVmag <= 0)) {
    return []
  }
  return Array.from({ length: 12 }, (_, pix) => ({ order: 0, pix }))
}

export function createStarsCSurveyRuntime(params: {
  key?: string | null
  url: string
  properties: StarsCSurveyProperties
  tileStore: StarsCTileStore
}): StarsCSurveyRuntime {
  const key = normalizeSurveyKey(params.key, params.url)
  const isGaia = isGaiaKey(key)
  const releaseDate = parseDateToEpochMs(params.properties.hipsReleaseDate)

  const baseSurvey: StarsCSurveyRuntime = {
    key,
    url: params.url,
    isGaia,
    minOrder: Number.isFinite(params.properties.hipsOrderMin) ? params.properties.hipsOrderMin : 0,
    minVmag: Number.isFinite(params.properties.minVmag) ? params.properties.minVmag : -2,
    maxVmag: Number.isFinite(params.properties.maxVmag) ? params.properties.maxVmag : Number.NaN,
    releaseDate,
    preloadRootPix: createRootPreloadPix(),
    listTraversalTiles: params.tileStore.listTraversalTiles,
    getTile: params.tileStore.get,
  }

  return baseSurvey
}

export function addStarsCSurvey(state: StarsCLifecycleState, survey: StarsCSurveyRuntime): StarsCLifecycleState {
  const nextSurveys = [...cloneSurveys(state.surveys), cloneSurveyRuntime(survey)]
  nextSurveys.sort((a, b) => sortBySurveyMaxVmag(a, b))
  applyGaiaFloorMutation(nextSurveys)
  return { surveys: nextSurveys }
}

export function addStarsCSurveyFromProperties(params: {
  state: StarsCLifecycleState
  key?: string | null
  url: string
  propertiesText: string
  tileStore: StarsCTileStore
}):
  | { status: 'ok'; state: StarsCLifecycleState; survey: StarsCSurveyRuntime; preload: readonly StarsCPreloadRequest[] }
  | { status: 'again' }
  | { status: 'error'; reason: string } {
  if (!params.propertiesText || params.propertiesText.trim().length === 0) {
    return { status: 'again' }
  }

  const properties = parseStarsCSurveyProperties(params.propertiesText)
  if (properties.type !== 'stars') {
    return { status: 'error', reason: 'Source is not a star survey' }
  }

  const survey = createStarsCSurveyRuntime({
    key: params.key,
    url: params.url,
    properties,
    tileStore: params.tileStore,
  })

  const nextState = addStarsCSurvey(params.state, survey)
  const preload = buildStarsCSurveyPreloadRequests(survey)

  return {
    status: 'ok',
    state: nextState,
    survey,
    preload,
  }
}

function normalizeListMaxMag(maxMag: number | undefined): number {
  if (maxMag == null || !Number.isFinite(maxMag)) return Number.POSITIVE_INFINITY
  return maxMag
}

function chooseLifecycleSurveyBySource(
  surveys: readonly StarsCSurveyRuntime[],
  sourceKey: string | null | undefined,
): StarsCSurveyRuntime | null {
  if (surveys.length === 0) return null

  if (sourceKey) {
    const matched = surveys.find((survey) => survey.key === sourceKey)
    if (matched) return matched
  }

  return surveys[0] ?? null
}

function traverseNoHint(
  survey: StarsCSurveyRuntime,
  maxMag: number,
  visit: (star: StarsCTileStar) => boolean | void,
): void {
  const traversal = survey.listTraversalTiles()

  for (const entry of traversal) {
    const loaded = survey.getTile(entry.order, entry.pix, false)
    if (!loaded.tile) {
      continue
    }

    if (loaded.tile.magMin >= maxMag) {
      continue
    }

    let interrupted = false
    for (const star of loaded.tile.stars) {
      if (star.mag > maxMag) {
        continue
      }
      if (visit(star)) {
        interrupted = true
        break
      }
    }

    if (interrupted) {
      break
    }
  }
}

function traverseHint(
  survey: StarsCSurveyRuntime,
  hintNuniq: bigint | number,
  visit: (star: StarsCTileStar) => boolean | void,
): StarsCLifecycleListStatus {
  const { order, pix } = nuniqToHealpixOrderAndPix(hintNuniq)
  const loaded = survey.getTile(order, pix, false)

  if (!loaded.tile) {
    if (loaded.code === 0) return STARS_C_MODULE_AGAIN
    return 'ok'
  }

  for (const star of loaded.tile.stars) {
    if (visit(star)) {
      break
    }
  }

  return 'ok'
}

/**
 * Source-faithful list surface for `stars.c::stars_list`:
 * - resolve survey by source key, else fallback to first survey
 * - no hint: tile traversal, tile-level `mag_min` skip and row-level `max_mag` filtering
 * - hint: exact nuniq lookup with MODULE_AGAIN when tile is still loading
 */
export function listStarsFromLifecycleState(params: {
  state: StarsCLifecycleState
  sourceKey?: string | null
  maxMag?: number
  hintNuniq?: bigint | number
  visit: (star: StarsCTileStar) => boolean | void
}): StarsCLifecycleListStatus {
  const survey = chooseLifecycleSurveyBySource(params.state.surveys, params.sourceKey)
  if (!survey) return 'ok'

  if (params.hintNuniq != null) {
    return traverseHint(survey, params.hintNuniq, params.visit)
  }

  const maxMag = normalizeListMaxMag(params.maxMag)
  traverseNoHint(survey, maxMag, params.visit)
  return 'ok'
}

function resolveHipMatchInTile(tile: StarsCTile, hip: number): StarsCTileStar | null {
  for (const star of tile.stars) {
    if (parseHipIdFromRuntimeStar(star) === hip) {
      return star
    }
    if (star.hip === hip) {
      return star
    }
  }
  return null
}

function lookupOrderAcrossSurveys(
  surveys: readonly StarsCSurveyRuntime[],
  order: 0 | 1,
  pix: number,
  hip: number,
): StarsCLifecycleLookupResult | { status: 'continue' } {
  for (const survey of surveys) {
    if (survey.isGaia) {
      continue
    }

    const loaded = survey.getTile(order, pix, true)
    if (!loaded.tile) {
      if (loaded.code === 0) {
        return { status: 'pending' }
      }
      continue
    }

    const matched = resolveHipMatchInTile(loaded.tile, hip)
    if (matched) {
      return { status: 'found', star: matched }
    }
  }

  return { status: 'continue' }
}

/**
 * Source-faithful lookup for `stars.c::obj_get_by_hip`:
 * - validate `hip_get_pix` mapping for order 0 and 1
 * - probe order 0 first, then order 1
 * - skip Gaia surveys
 * - if any tile is pending (`code == 0`), return pending
 */
export function findStarByHipFromLifecycleState(state: StarsCLifecycleState, hip: number): StarsCLifecycleLookupResult {
  const pix0 = hipGetPix(hip, 0)
  const pix1 = hipGetPix(hip, 1)

  if (pix0 === -1 || pix1 === -1) {
    return { status: 'not-found' }
  }

  const order0 = lookupOrderAcrossSurveys(state.surveys, 0, pix0, hip)
  if (order0.status === 'found' || order0.status === 'pending') {
    return order0
  }

  const order1 = lookupOrderAcrossSurveys(state.surveys, 1, pix1, hip)
  if (order1.status === 'found' || order1.status === 'pending') {
    return order1
  }

  return { status: 'not-found' }
}

function tileKey(order: number, pix: number): string {
  return `${order}:${pix}`
}

function sortTraversal(entries: readonly { order: number; pix: number }[]) {
  return [...entries].sort((a, b) => a.order - b.order || a.pix - b.pix)
}

/**
 * In-memory tile store to emulate `get_tile` behavior from `stars.c`:
 * - returns `{tile:null, code:0}` while loading
 * - returns `{tile:null, code:404}` when missing
 * - supports deterministic traversal ordering for no-hint list mode
 */
export function createStarsCTileStore(seed?: {
  traversal?: readonly { order: number; pix: number }[]
  tiles?: readonly StarsCTile[]
}): StarsCTileStore {
  const tiles = new Map<string, StarsCTile>()
  const pending = new Set<string>()
  const errors = new Map<string, number>()

  const traversalSeed = seed?.traversal ?? []
  const traversalOrder = sortTraversal(traversalSeed)

  const dynamicTraversal = new Set<string>(traversalOrder.map((entry) => tileKey(entry.order, entry.pix)))

  const putTraversalIfAbsent = (order: number, pix: number) => {
    const key = tileKey(order, pix)
    if (dynamicTraversal.has(key)) return
    dynamicTraversal.add(key)
  }

  for (const tile of seed?.tiles ?? []) {
    const key = tileKey(tile.order, tile.pix)
    tiles.set(key, tile)
    putTraversalIfAbsent(tile.order, tile.pix)
  }

  const listTraversalTiles = () => {
    return sortTraversal(
      Array.from(dynamicTraversal.values()).map((value) => {
        const [orderText, pixText] = value.split(':')
        return { order: Number(orderText), pix: Number(pixText) }
      }),
    )
  }

  const get = (order: number, pix: number): StarsCTileLoadResult => {
    const key = tileKey(order, pix)
    if (pending.has(key)) {
      return { tile: null, code: 0 }
    }

    const tile = tiles.get(key)
    if (tile) {
      return { tile, code: 200 }
    }

    const error = errors.get(key)
    if (error != null) {
      return { tile: null, code: error }
    }

    return { tile: null, code: 404 }
  }

  const setTile = (tile: StarsCTile) => {
    const key = tileKey(tile.order, tile.pix)
    pending.delete(key)
    errors.delete(key)
    tiles.set(key, tile)
    putTraversalIfAbsent(tile.order, tile.pix)
  }

  const setPending = (order: number, pix: number) => {
    const key = tileKey(order, pix)
    pending.add(key)
    errors.delete(key)
    putTraversalIfAbsent(order, pix)
  }

  const setError = (order: number, pix: number, code: number) => {
    const key = tileKey(order, pix)
    pending.delete(key)
    errors.set(key, code)
    putTraversalIfAbsent(order, pix)
  }

  return {
    get,
    setTile,
    setPending,
    setError,
    listTraversalTiles,
  }
}

function makeFixtureRow(params: Partial<StarsCSourceRow> & Pick<StarsCSourceRow, 'hip' | 'vmag' | 'gmag' | 'ra' | 'de'>): StarsCSourceRow {
  return {
    type: params.type ?? STARS_C_DEFAULT_STAR_TYPE,
    gaia: params.gaia ?? BigInt(0),
    hip: params.hip,
    vmag: params.vmag,
    gmag: params.gmag,
    ra: params.ra,
    de: params.de,
    plx: params.plx ?? 0,
    pra: params.pra ?? 0,
    pde: params.pde ?? 0,
    epoc: params.epoc ?? STARS_C_DEFAULT_EPOCH,
    bv: params.bv ?? Number.NaN,
    ids: params.ids ?? '',
    spec: params.spec ?? '',
  }
}

/**
 * Fixture helper: create a tile from terse star tuples while preserving the
 * same normalization and ordering path as `parseStarsCTileRows`.
 */
export function buildStarsCTileFixture(params: {
  order: number
  pix: number
  stars: ReadonlyArray<{
    hip: number
    gaia?: bigint
    mag: number
    gmag?: number
    raDeg?: number
    decDeg?: number
    ids?: string
    plxArcsec?: number
    bv?: number
    spec?: string
  }>
  isGaia?: boolean
  minVmag?: number
}): StarsCTile {
  const rows: StarsCSourceRow[] = params.stars.map((star, index) => makeFixtureRow({
    hip: star.hip,
    gaia: star.gaia ?? BigInt(0),
    vmag: star.mag,
    gmag: star.gmag ?? star.mag,
    ra: star.raDeg ?? (index * 5) % 360,
    de: star.decDeg ?? 0,
    ids: star.ids ?? (star.hip > 0 ? `HIP ${star.hip}` : ''),
    plx: star.plxArcsec ?? 0,
    bv: star.bv ?? Number.NaN,
    spec: star.spec ?? '',
  }))

  return parseStarsCTileRows({
    order: params.order,
    pix: params.pix,
    rows,
    survey: {
      isGaia: Boolean(params.isGaia),
      minVmag: params.minVmag ?? -2,
    },
  }).tile
}

/**
 * Fixture helper: build a ready-to-use lifecycle state from tile fixtures.
 */
export function buildStarsCLifecycleFixture(params: {
  key: string
  url?: string
  isGaia?: boolean
  minOrder?: number
  minVmag?: number
  maxVmag?: number
  tiles: readonly StarsCTile[]
}): { state: StarsCLifecycleState; survey: StarsCSurveyRuntime; store: StarsCTileStore } {
  const store = createStarsCTileStore({
    tiles: params.tiles,
  })

  const survey: StarsCSurveyRuntime = {
    key: params.key,
    url: params.url ?? `/fixture/${params.key}`,
    isGaia: Boolean(params.isGaia),
    minOrder: params.minOrder ?? 0,
    minVmag: params.minVmag ?? -2,
    maxVmag: params.maxVmag ?? Number.NaN,
    releaseDate: 0,
    preloadRootPix: createRootPreloadPix(),
    listTraversalTiles: store.listTraversalTiles,
    getTile: store.get,
  }

  const state = createStarsCLifecycleState([survey])
  return { state, survey, store }
}
