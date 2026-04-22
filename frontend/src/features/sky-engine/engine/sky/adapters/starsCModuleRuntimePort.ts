import type { RuntimeStar } from '../contracts/stars'
import { coreMagToIlluminance } from '../core/stellariumVisualMath'
import { hipGetPix, parseHipIdFromRuntimeStar } from './hipGetPix'
import { nuniqToHealpixOrderAndPix } from './starsNuniq'

export const STARS_C_MODULE_AGAIN = 'again' as const

const STARS_C_INF_MAG = 1000
const STARS_C_LABEL_SPACING = 4

export type StarsCModuleListStatus = 0 | -1 | typeof STARS_C_MODULE_AGAIN

export type StarsCModuleStar = RuntimeStar & {
  readonly gaia: bigint
  readonly hip: number
  readonly vmag: number
  readonly plxArcsec: number
  readonly bv: number
  readonly illuminance: number
  readonly names: readonly string[]
  readonly spectralType: string | null
}

export type StarsCModuleTile = {
  readonly order: number
  readonly pix: number
  readonly magMin: number
  readonly magMax: number
  readonly illuminance: number
  readonly stars: readonly StarsCModuleStar[]
  readonly childrenMask?: number
}

export type StarsCModuleTileLoadResult = {
  readonly tile: StarsCModuleTile | null
  readonly code: number
}

export type StarsCModuleSurvey = {
  readonly key: string
  readonly url: string
  readonly minOrder: number
  readonly maxVmag: number
  minVmag: number
  readonly isGaia: boolean
  readonly releaseDateEpochMs: number
  readonly listTraversalTiles: () => readonly { order: number; pix: number }[]
  readonly getTile: (order: number, pix: number, sync: boolean) => StarsCModuleTileLoadResult
  readonly preloadRootLevel: (order: number, pix: number) => void
}

export type StarsCModuleRuntime = {
  readonly visible: boolean
  readonly hintsVisible: boolean
  readonly hintsMagOffset: number
  readonly surveys: readonly StarsCModuleSurvey[]
}

export type StarsCModuleProperties = {
  readonly type: string
  readonly minOrder: number
  readonly minVmag: number
  readonly maxVmag: number
  readonly releaseDate: string | null
}

export type StarsCModuleDataSource = {
  readonly key: string | null
  readonly url: string
  readonly propertiesText: string | null
  readonly tileStore: {
    readonly listTraversalTiles: () => readonly { order: number; pix: number }[]
    readonly getTile: (order: number, pix: number, sync: boolean) => StarsCModuleTileLoadResult
    readonly preloadRootLevel: (order: number, pix: number) => void
  }
}

export type StarsCRenderVisitorProjectedPoint = {
  readonly screenX: number
  readonly screenY: number
  readonly depth: number
  readonly angularDistanceRad: number
}

export type StarsCRenderVisitorEntry = {
  readonly surveyKey: string
  readonly order: number
  readonly pix: number
  readonly star: StarsCModuleStar
  readonly point: StarsCRenderVisitorProjectedPoint
  readonly radius: number
  readonly luminance: number
  readonly rgb: readonly [number, number, number]
}

export type StarsCRenderVisitResult = {
  readonly entries: readonly StarsCRenderVisitorEntry[]
  readonly shouldDescend: boolean
  readonly loadedTile: boolean
  readonly tileIlluminance: number
}

export type StarsCRenderState = {
  readonly entries: readonly StarsCRenderVisitorEntry[]
  readonly totalTileRequests: number
  readonly loadedTileCount: number
  readonly totalIlluminance: number
}

export type StarsCListResult = {
  readonly status: StarsCModuleListStatus
  readonly visited: readonly StarsCModuleStar[]
}

export type StarsCLookupResult =
  | { readonly status: 'found'; readonly star: StarsCModuleStar; readonly surveyKey: string }
  | { readonly status: 'pending' }
  | { readonly status: 'not-found' }

function compareNumber(left: number, right: number): number {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

function normalizeComparableMag(value: number): number {
  return Number.isFinite(value) ? value : STARS_C_INF_MAG
}

function compareSurveyByMaxVmag(left: Pick<StarsCModuleSurvey, 'maxVmag'>, right: Pick<StarsCModuleSurvey, 'maxVmag'>): number {
  return compareNumber(normalizeComparableMag(left.maxVmag), normalizeComparableMag(right.maxVmag))
}

export function parseStarsCModuleProperties(text: string): StarsCModuleProperties {
  const values: Record<string, string> = {}
  const lines = text.split(/\r?\n/g)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator < 0) continue
    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim()
    values[key] = value
  }

  const minOrder = Number.parseInt(values.hips_order_min ?? '0', 10)
  const minVmag = Number.parseFloat(values.min_vmag ?? '-2')
  const maxVmag = Number.parseFloat(values.max_vmag ?? 'nan')

  return {
    type: values.type ?? '',
    minOrder: Number.isFinite(minOrder) ? minOrder : 0,
    minVmag: Number.isFinite(minVmag) ? minVmag : -2,
    maxVmag: Number.isFinite(maxVmag) ? maxVmag : Number.NaN,
    releaseDate: values.hips_release_date ?? null,
  }
}

function parseReleaseDateEpochMs(value: string | null): number {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function resolveSurveyKey(inputKey: string | null, url: string): string {
  const trimmedKey = inputKey?.trim()
  if (trimmedKey) return trimmedKey
  const tokens = url.split('/').filter(Boolean)
  const tail = tokens[tokens.length - 1]
  if (!tail) return 'survey'
  return tail.toLowerCase()
}

function isGaiaSurveyKey(key: string): boolean {
  return key.toLowerCase() === 'gaia'
}

function copySurvey(survey: StarsCModuleSurvey): StarsCModuleSurvey {
  return {
    ...survey,
  }
}

function applyGaiaMinVmagPromotion(surveys: StarsCModuleSurvey[]): void {
  const gaia = surveys.find((survey) => survey.isGaia)
  if (!gaia) return
  for (const survey of surveys) {
    if (survey.isGaia || !Number.isFinite(survey.maxVmag)) continue
    gaia.minVmag = Math.max(gaia.minVmag, survey.maxVmag)
  }
}

export function createStarsCModuleRuntime(initial?: Partial<Pick<StarsCModuleRuntime, 'visible' | 'hintsVisible' | 'hintsMagOffset'>>): StarsCModuleRuntime {
  return {
    visible: initial?.visible ?? true,
    hintsVisible: initial?.hintsVisible ?? true,
    hintsMagOffset: initial?.hintsMagOffset ?? 0,
    surveys: [],
  }
}

export function createStarsCModuleSurvey(dataSource: StarsCModuleDataSource, properties: StarsCModuleProperties): StarsCModuleSurvey {
  const surveyKey = resolveSurveyKey(dataSource.key, dataSource.url)
  const isGaia = isGaiaSurveyKey(surveyKey)

  return {
    key: surveyKey,
    url: dataSource.url,
    minOrder: properties.minOrder,
    minVmag: properties.minVmag,
    maxVmag: properties.maxVmag,
    isGaia,
    releaseDateEpochMs: parseReleaseDateEpochMs(properties.releaseDate),
    listTraversalTiles: dataSource.tileStore.listTraversalTiles,
    getTile: dataSource.tileStore.getTile,
    preloadRootLevel: dataSource.tileStore.preloadRootLevel,
  }
}

/**
 * Source-faithful `stars_add_data_source` seam:
 * - parse hips properties
 * - validate source type
 * - append survey and sort by `survey_cmp` (max_vmag, finite first)
 * - preload root level for bright order-0 surveys
 * - Gaia min_vmag promotion from non-Gaia finite maxima
 */
export function addStarsCModuleDataSource(
  runtime: StarsCModuleRuntime,
  dataSource: StarsCModuleDataSource,
): { readonly status: 0 | -1 | typeof STARS_C_MODULE_AGAIN; readonly runtime: StarsCModuleRuntime; readonly surveyKey?: string } {
  if (!dataSource.propertiesText) {
    return { status: STARS_C_MODULE_AGAIN, runtime }
  }

  const properties = parseStarsCModuleProperties(dataSource.propertiesText)
  if (properties.type !== 'stars') {
    return { status: -1, runtime }
  }

  const survey = createStarsCModuleSurvey(dataSource, properties)

  if (survey.minOrder === 0 && survey.minVmag <= 0) {
    for (let pix = 0; pix < 12; pix += 1) {
      survey.preloadRootLevel(0, pix)
    }
  }

  const surveys = [...runtime.surveys.map(copySurvey), survey]
  surveys.sort(compareSurveyByMaxVmag)
  applyGaiaMinVmagPromotion(surveys)

  return {
    status: 0,
    runtime: {
      ...runtime,
      surveys,
    },
    surveyKey: survey.key,
  }
}

function resolveSelectedSurvey(
  surveys: readonly StarsCModuleSurvey[],
  sourceKey: string | null | undefined,
): StarsCModuleSurvey | null {
  if (surveys.length === 0) return null
  if (sourceKey) {
    const matched = surveys.find((survey) => survey.key === sourceKey)
    if (matched) return matched
  }
  return surveys[0] ?? null
}

function normalizeMaxMag(maxMag: number): number {
  if (!Number.isFinite(maxMag)) return Number.POSITIVE_INFINITY
  return maxMag
}

function sortedTileStars(tile: StarsCModuleTile): readonly StarsCModuleStar[] {
  return [...tile.stars].sort((left, right) => left.vmag - right.vmag || left.id.localeCompare(right.id))
}

/**
 * Source-faithful `stars_list` semantics on module runtime surveys.
 */
export function listStarsFromStarsCModule(params: {
  runtime: StarsCModuleRuntime
  maxMag: number
  hintNuniq?: bigint | number
  sourceKey?: string | null
  visit?: (star: StarsCModuleStar) => boolean | void
}): StarsCListResult {
  const visited: StarsCModuleStar[] = []
  const callback = params.visit ?? (() => false)
  const survey = resolveSelectedSurvey(params.runtime.surveys, params.sourceKey)
  if (!survey) {
    return { status: 0, visited }
  }

  if (params.hintNuniq != null) {
    const { order, pix } = nuniqToHealpixOrderAndPix(params.hintNuniq)
    const loaded = survey.getTile(order, pix, false)
    if (!loaded.tile) {
      if (loaded.code === 0) {
        return { status: STARS_C_MODULE_AGAIN, visited }
      }
      return { status: -1, visited }
    }

    for (const star of sortedTileStars(loaded.tile)) {
      visited.push(star)
      if (callback(star)) {
        break
      }
    }

    return { status: 0, visited }
  }

  const normalizedMaxMag = normalizeMaxMag(params.maxMag)
  const traversal = survey.listTraversalTiles()
  for (const step of traversal) {
    const loaded = survey.getTile(step.order, step.pix, false)
    if (!loaded.tile || loaded.tile.magMin >= normalizedMaxMag) {
      continue
    }

    let interrupted = false
    for (const star of sortedTileStars(loaded.tile)) {
      if (star.vmag > normalizedMaxMag) {
        continue
      }
      visited.push(star)
      if (callback(star)) {
        interrupted = true
        break
      }
    }

    if (interrupted) {
      break
    }
  }

  return { status: 0, visited }
}

function findHipInTile(tile: StarsCModuleTile, hip: number): StarsCModuleStar | null {
  for (const star of tile.stars) {
    if (parseHipIdFromRuntimeStar(star) === hip || star.hip === hip) {
      return star
    }
  }
  return null
}

/**
 * Source-faithful `obj_get_by_hip` traversal:
 * - probe order 0 then order 1
 * - skip Gaia surveys
 * - sync tile lookup
 * - pending response if any tile is still loading
 */
export function findStarByHipFromStarsCModule(
  runtime: StarsCModuleRuntime,
  hip: number,
): StarsCLookupResult {
  for (const order of [0, 1] as const) {
    const pix = hipGetPix(hip, order)
    if (pix === -1) {
      return { status: 'not-found' }
    }

    for (const survey of runtime.surveys) {
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

      const star = findHipInTile(loaded.tile, hip)
      if (star) {
        return { status: 'found', star, surveyKey: survey.key }
      }
    }
  }

  return { status: 'not-found' }
}

function pointRadiusForMagnitude(vmag: number): { radius: number; luminance: number } {
  const illuminance = coreMagToIlluminance(vmag)
  if (!Number.isFinite(illuminance) || illuminance <= 0) {
    return { radius: 0, luminance: 0 }
  }

  const radius = Math.min(6, Math.max(0.5, 5.5 - (vmag * 0.35)))
  const luminance = Math.min(1, Math.max(0, illuminance / 0.25))
  return { radius, luminance }
}

function rgbForColorIndex(bv: number): readonly [number, number, number] {
  if (!Number.isFinite(bv)) {
    return [1, 1, 1]
  }
  const clamped = Math.max(-0.4, Math.min(2, bv))
  const t = (clamped + 0.4) / 2.4
  const red = Math.max(0, Math.min(1, 1))
  const green = Math.max(0, Math.min(1, 0.7 + (0.3 * (1 - t))))
  const blue = Math.max(0, Math.min(1, 0.45 + (0.55 * (1 - t))))
  return [red, green, blue]
}

function defaultHintsLimitMagnitude(baseLimit: number, hintsMagOffset: number): number {
  return baseLimit - 5 + hintsMagOffset
}

function shouldRenderLabel(params: {
  star: StarsCModuleStar
  selectedStarId: string | null | undefined
  hintsVisible: boolean
  isGaia: boolean
  hintsLimitMagnitude: number
}): boolean {
  if (params.star.id === params.selectedStarId) {
    return true
  }
  if (!params.hintsVisible || params.isGaia) {
    return false
  }
  return params.star.vmag <= params.hintsLimitMagnitude
}

function shouldDescendIntoChildren(tile: StarsCModuleTile, limitMagnitude: number): boolean {
  return tile.magMax > limitMagnitude
}

/**
 * Port seam for `render_visitor` behavior over abstract survey tile stores.
 */
export function runStarsCRenderVisitor(params: {
  runtime: StarsCModuleRuntime
  survey: StarsCModuleSurvey
  order: number
  pix: number
  starsLimitMagnitude: number
  hardLimitMagnitude: number
  selectedStarId?: string | null
  isTileClipped?: (order: number, pix: number) => boolean
  projectStar: (star: StarsCModuleStar) => StarsCRenderVisitorProjectedPoint | null
  isPointClipped: (point: StarsCRenderVisitorProjectedPoint) => boolean
}): StarsCRenderVisitResult {
  const limitMagnitude = Math.min(params.starsLimitMagnitude, params.hardLimitMagnitude)

  if (params.isTileClipped?.(params.order, params.pix) === true) {
    return {
      entries: [],
      shouldDescend: false,
      loadedTile: false,
      tileIlluminance: 0,
    }
  }

  if (params.order < params.survey.minOrder) {
    return {
      entries: [],
      shouldDescend: true,
      loadedTile: false,
      tileIlluminance: 0,
    }
  }

  const loaded = params.survey.getTile(params.order, params.pix, false)
  if (!loaded.tile) {
    return {
      entries: [],
      shouldDescend: false,
      loadedTile: false,
      tileIlluminance: 0,
    }
  }

  const tile = loaded.tile
  if (tile.magMin > limitMagnitude) {
    return {
      entries: [],
      shouldDescend: false,
      loadedTile: true,
      tileIlluminance: 0,
    }
  }

  const entries: StarsCRenderVisitorEntry[] = []
  let lastMag = Number.NaN
  let lastPointSize = { radius: 0, luminance: 0 }

  const hintsLimitMagnitude = defaultHintsLimitMagnitude(limitMagnitude, params.runtime.hintsMagOffset)

  for (const star of sortedTileStars(tile)) {
    if (star.vmag > limitMagnitude) {
      break
    }

    const point = params.projectStar(star)
    if (!point) {
      continue
    }

    if (params.isPointClipped(point)) {
      continue
    }

    if (star.vmag !== lastMag) {
      lastMag = star.vmag
      lastPointSize = pointRadiusForMagnitude(star.vmag)
    }

    if (lastPointSize.radius === 0 || lastPointSize.luminance === 0) {
      continue
    }

    const _renderLabel = shouldRenderLabel({
      star,
      selectedStarId: params.selectedStarId,
      hintsVisible: params.runtime.hintsVisible,
      isGaia: params.survey.isGaia,
      hintsLimitMagnitude,
    })

    entries.push({
      surveyKey: params.survey.key,
      order: params.order,
      pix: params.pix,
      star,
      point,
      radius: lastPointSize.radius,
      luminance: lastPointSize.luminance,
      rgb: rgbForColorIndex(star.bv),
    })
  }

  return {
    entries,
    shouldDescend: shouldDescendIntoChildren(tile, limitMagnitude),
    loadedTile: true,
    tileIlluminance: tile.illuminance,
  }
}

function traversalRoots(survey: StarsCModuleSurvey): readonly { order: number; pix: number }[] {
  const all = survey.listTraversalTiles()
  if (all.length === 0) return []
  const roots = all.filter((step) => step.order === 0)
  if (roots.length > 0) return roots
  return [all[0]]
}

function childrenOf(order: number, pix: number): readonly { order: number; pix: number }[] {
  const nextOrder = order + 1
  const base = pix * 4
  return [
    { order: nextOrder, pix: base },
    { order: nextOrder, pix: base + 1 },
    { order: nextOrder, pix: base + 2 },
    { order: nextOrder, pix: base + 3 },
  ]
}

/**
 * Source-faithful `stars_render` traversal surface over survey stores.
 */
export function renderStarsCModule(params: {
  runtime: StarsCModuleRuntime
  starsLimitMagnitude: number
  hardLimitMagnitude: number
  selectedStarId?: string | null
  isTileClipped?: (order: number, pix: number) => boolean
  projectStar: (star: StarsCModuleStar) => StarsCRenderVisitorProjectedPoint | null
  isPointClipped: (point: StarsCRenderVisitorProjectedPoint) => boolean
  maxOrder?: number
}): StarsCRenderState {
  if (!params.runtime.visible) {
    return {
      entries: [],
      totalTileRequests: 0,
      loadedTileCount: 0,
      totalIlluminance: 0,
    }
  }

  const maxOrder = Number.isFinite(params.maxOrder) ? Number(params.maxOrder) : 9
  const limitMagnitude = Math.min(params.starsLimitMagnitude, params.hardLimitMagnitude)

  const entries: StarsCRenderVisitorEntry[] = []
  let totalTileRequests = 0
  let loadedTileCount = 0
  let totalIlluminance = 0

  for (const survey of params.runtime.surveys) {
    if (survey.minVmag > params.starsLimitMagnitude) {
      continue
    }

    const queue = traversalRoots(survey).map((root) => ({ ...root }))
    const visited = new Set<string>()

    while (queue.length > 0) {
      const step = queue.shift()!
      if (step.order > maxOrder) {
        continue
      }

      const key = `${step.order}:${step.pix}`
      if (visited.has(key)) {
        continue
      }
      visited.add(key)

      totalTileRequests += 1

      const result = runStarsCRenderVisitor({
        runtime: params.runtime,
        survey,
        order: step.order,
        pix: step.pix,
        starsLimitMagnitude: params.starsLimitMagnitude,
        hardLimitMagnitude: params.hardLimitMagnitude,
        selectedStarId: params.selectedStarId,
        isTileClipped: params.isTileClipped,
        projectStar: params.projectStar,
        isPointClipped: params.isPointClipped,
      })

      if (result.loadedTile) {
        loadedTileCount += 1
      }

      if (result.entries.length > 0) {
        entries.push(...result.entries)
      }

      totalIlluminance += result.tileIlluminance

      if (result.shouldDescend && step.order < maxOrder) {
        const children = childrenOf(step.order, step.pix)
        for (const child of children) {
          queue.push(child)
        }
      }
    }
  }

  const sortedEntries = [...entries].sort((left, right) => (
    left.star.vmag - right.star.vmag || left.star.id.localeCompare(right.star.id)
  ))

  const cappedEntries = sortedEntries.filter((entry) => entry.star.vmag <= limitMagnitude)

  return {
    entries: cappedEntries,
    totalTileRequests,
    loadedTileCount,
    totalIlluminance,
  }
}

export function buildStarsCModuleLabelState(params: {
  runtime: StarsCModuleRuntime
  entry: StarsCRenderVisitorEntry
  selectedStarId?: string | null
  hintsLimitMagnitude?: number
}): {
  readonly shouldRenderLabel: boolean
  readonly radiusWithSpacing: number
} {
  const hintsLimitMagnitude = Number.isFinite(params.hintsLimitMagnitude)
    ? Number(params.hintsLimitMagnitude)
    : defaultHintsLimitMagnitude(params.entry.star.vmag + 5, params.runtime.hintsMagOffset)

  return {
    shouldRenderLabel: shouldRenderLabel({
      star: params.entry.star,
      selectedStarId: params.selectedStarId,
      hintsVisible: params.runtime.hintsVisible,
      isGaia: params.entry.star.catalog === 'gaia',
      hintsLimitMagnitude,
    }),
    radiusWithSpacing: params.entry.radius + STARS_C_LABEL_SPACING,
  }
}

export function estimateStarsCModuleLuminanceFromIlluminance(illuminance: number): number {
  if (!Number.isFinite(illuminance) || illuminance <= 0) {
    return 0
  }

  const lum = Math.pow(illuminance, 1 / 3) / 300
  if (!Number.isFinite(lum)) {
    return 0
  }
  return Math.max(0, lum)
}

export function findSurveyByKey(runtime: StarsCModuleRuntime, key: string): StarsCModuleSurvey | null {
  for (const survey of runtime.surveys) {
    if (survey.key === key) {
      return survey
    }
  }
  return null
}

export function parseSearchQueryAsDesignation(query: string): { readonly catalog: 'hip' | 'gaia'; readonly value: number | bigint } | null {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return null
  }

  const pattern = /^(hip|gaia)\s*(\d+)$/i
  const match = pattern.exec(normalized)
  if (!match) {
    return null
  }

  const catalog = match[1]?.toLowerCase() as 'hip' | 'gaia'
  const valueText = match[2] ?? ''

  if (catalog === 'hip') {
    const hip = Number.parseInt(valueText, 10)
    if (!Number.isFinite(hip)) {
      return null
    }
    return { catalog, value: hip }
  }

  return { catalog, value: BigInt(valueText) }
}

export function findByDesignationFromStarsCModule(runtime: StarsCModuleRuntime, query: string): StarsCLookupResult {
  const parsed = parseSearchQueryAsDesignation(query)
  if (!parsed) {
    return { status: 'not-found' }
  }

  if (parsed.catalog === 'hip') {
    return findStarByHipFromStarsCModule(runtime, Number(parsed.value))
  }

  for (const survey of runtime.surveys) {
    const traversal = survey.listTraversalTiles()
    for (const step of traversal) {
      const loaded = survey.getTile(step.order, step.pix, true)
      if (!loaded.tile) {
        if (loaded.code === 0) {
          return { status: 'pending' }
        }
        continue
      }

      for (const star of loaded.tile.stars) {
        if (star.gaia === parsed.value) {
          return { status: 'found', star, surveyKey: survey.key }
        }
      }
    }
  }

  return { status: 'not-found' }
}

export type StarsCFixtureStar = {
  readonly id?: string
  readonly hip?: number
  readonly gaia?: bigint
  readonly vmag: number
  readonly raDeg: number
  readonly decDeg: number
  readonly names?: readonly string[]
  readonly bv?: number
  readonly plxArcsec?: number
  readonly spectralType?: string | null
}

export type StarsCFixtureTile = {
  readonly order: number
  readonly pix: number
  readonly magMin?: number
  readonly magMax?: number
  readonly stars: readonly StarsCFixtureStar[]
}

export type StarsCFixtureSurvey = {
  readonly key: string
  readonly url?: string
  readonly minOrder?: number
  readonly minVmag?: number
  readonly maxVmag?: number
  readonly isGaia?: boolean
  readonly tiles: readonly StarsCFixtureTile[]
}

function toRuntimeStar(input: StarsCFixtureStar, surveyKey: string): StarsCModuleStar {
  const hip = Number.isFinite(input.hip) ? Number(input.hip) : 0
  const gaia = input.gaia ?? BigInt(0)
  let names: string[]
  if (input.names) {
    names = [...input.names]
  } else if (hip > 0) {
    names = [`HIP ${hip}`]
  } else {
    names = []
  }

  let id = input.id
  if (!id) {
    if (hip > 0) {
      id = `hip-${hip}`
    } else if (gaia > BigInt(0)) {
      id = `gaia-${gaia.toString()}`
    } else {
      id = `star-${surveyKey}-${Math.abs(input.raDeg).toFixed(3)}-${Math.abs(input.decDeg).toFixed(3)}`
    }
  }

  let tier: 'T0' | 'T1' | 'T2'
  if (input.vmag <= 4) {
    tier = 'T0'
  } else if (input.vmag <= 7) {
    tier = 'T1'
  } else {
    tier = 'T2'
  }

  return {
    id,
    sourceId: names[0] ?? id,
    raDeg: input.raDeg,
    decDeg: input.decDeg,
    mag: input.vmag,
    tier,
    catalog: surveyKey === 'gaia' ? 'gaia' : 'hipparcos',
    colorIndex: Number.isFinite(input.bv) ? Number(input.bv) : undefined,
    gaia,
    hip,
    vmag: input.vmag,
    plxArcsec: Number.isFinite(input.plxArcsec) ? Number(input.plxArcsec) : 0,
    bv: Number.isFinite(input.bv) ? Number(input.bv) : Number.NaN,
    illuminance: coreMagToIlluminance(input.vmag),
    names,
    spectralType: input.spectralType ?? null,
  }
}

function toTile(tile: StarsCFixtureTile, surveyKey: string): StarsCModuleTile {
  const stars = tile.stars.map((star) => toRuntimeStar(star, surveyKey))
  const ordered = [...stars].sort((left, right) => left.vmag - right.vmag || left.id.localeCompare(right.id))

  let magMin: number
  if (Number.isFinite(tile.magMin)) {
    magMin = Number(tile.magMin)
  } else {
    const first = ordered[0]
    magMin = first ? first.vmag : Number.POSITIVE_INFINITY
  }

  let magMax: number
  if (Number.isFinite(tile.magMax)) {
    magMax = Number(tile.magMax)
  } else {
    const lastIndex = ordered.length - 1
    const last = lastIndex >= 0 ? ordered[lastIndex] : undefined
    magMax = last ? last.vmag : Number.NEGATIVE_INFINITY
  }

  return {
    order: tile.order,
    pix: tile.pix,
    magMin,
    magMax,
    stars: ordered,
    illuminance: ordered.reduce((sum, star) => sum + star.illuminance, 0),
  }
}

export function createStarsCFixtureStore(tiles: readonly StarsCModuleTile[]) {
  const map = new Map<string, StarsCModuleTile>()
  const pending = new Set<string>()
  const errors = new Map<string, number>()

  for (const tile of tiles) {
    map.set(`${tile.order}:${tile.pix}`, tile)
  }

  function getTile(order: number, pix: number): StarsCModuleTileLoadResult {
    const key = `${order}:${pix}`
    if (pending.has(key)) {
      return { tile: null, code: 0 }
    }

    const tile = map.get(key)
    if (tile) {
      return { tile, code: 200 }
    }

    const error = errors.get(key)
    if (error != null) {
      return { tile: null, code: error }
    }

    return { tile: null, code: 404 }
  }

  function listTraversalTiles() {
    return Array.from(map.values())
      .map((tile) => ({ order: tile.order, pix: tile.pix }))
      .sort((left, right) => left.order - right.order || left.pix - right.pix)
  }

  function preloadRootLevel(order: number, pix: number) {
    const key = `${order}:${pix}`
    pending.delete(key)
  }

  function setPending(order: number, pix: number) {
    pending.add(`${order}:${pix}`)
  }

  function setError(order: number, pix: number, code: number) {
    const key = `${order}:${pix}`
    pending.delete(key)
    errors.set(key, code)
  }

  function setTile(tile: StarsCModuleTile) {
    const key = `${tile.order}:${tile.pix}`
    pending.delete(key)
    errors.delete(key)
    map.set(key, tile)
  }

  return {
    getTile,
    listTraversalTiles,
    preloadRootLevel,
    setPending,
    setError,
    setTile,
  }
}

export function buildStarsCModuleFixtureRuntime(input: {
  readonly visible?: boolean
  readonly hintsVisible?: boolean
  readonly hintsMagOffset?: number
  readonly surveys: readonly StarsCFixtureSurvey[]
}): StarsCModuleRuntime {
  let runtime = createStarsCModuleRuntime({
    visible: input.visible,
    hintsVisible: input.hintsVisible,
    hintsMagOffset: input.hintsMagOffset,
  })

  for (const fixtureSurvey of input.surveys) {
    const store = createStarsCFixtureStore(fixtureSurvey.tiles.map((tile) => toTile(tile, fixtureSurvey.key)))

    const propertiesText = [
      'type = stars',
      `hips_order_min = ${fixtureSurvey.minOrder ?? 0}`,
      `min_vmag = ${fixtureSurvey.minVmag ?? -2}`,
      `max_vmag = ${Number.isFinite(fixtureSurvey.maxVmag) ? fixtureSurvey.maxVmag : 'nan'}`,
      'hips_release_date = 2025-01-01T00:00:00Z',
    ].join('\n')

    const result = addStarsCModuleDataSource(runtime, {
      key: fixtureSurvey.key,
      url: fixtureSurvey.url ?? `/fixture/${fixtureSurvey.key}`,
      propertiesText,
      tileStore: store,
    })

    runtime = result.runtime
  }

  return runtime
}

export function computeStarsCModuleRuntimeDigest(params: {
  readonly runtime: StarsCModuleRuntime
  readonly starsLimitMagnitude: number
  readonly hardLimitMagnitude: number
  readonly selectedStarId?: string | null
}): string {
  const renderState = renderStarsCModule({
    runtime: params.runtime,
    starsLimitMagnitude: params.starsLimitMagnitude,
    hardLimitMagnitude: params.hardLimitMagnitude,
    selectedStarId: params.selectedStarId,
    projectStar: (star) => ({
      screenX: star.raDeg,
      screenY: star.decDeg,
      depth: 1,
      angularDistanceRad: 0,
    }),
    isPointClipped: () => false,
    isTileClipped: () => false,
  })

  const first = renderState.entries[0]?.star.id ?? 'none'
  const lastIndex = renderState.entries.length - 1
  const last = (lastIndex >= 0 ? renderState.entries[lastIndex] : undefined)?.star.id ?? 'none'
  const lookup = findStarByHipFromStarsCModule(params.runtime, 11767)
  const lookupStatus = lookup.status === 'found' ? `found:${lookup.star.id}` : lookup.status
  const list = listStarsFromStarsCModule({
    runtime: params.runtime,
    maxMag: params.starsLimitMagnitude,
  })

  const surveyDigest = params.runtime.surveys
    .map((survey) => {
      const maxVmagText = Number.isFinite(survey.maxVmag) ? survey.maxVmag.toFixed(2) : 'nan'
      return `${survey.key}:${survey.minVmag.toFixed(2)}:${maxVmagText}`
    })
    .join(',')

  return [
    `surveys:${surveyDigest}`,
    `render:${renderState.entries.length}:${first}:${last}`,
    `tiles:${renderState.loadedTileCount}/${renderState.totalTileRequests}`,
    `illum:${renderState.totalIlluminance.toFixed(6)}`,
    `lum:${estimateStarsCModuleLuminanceFromIlluminance(renderState.totalIlluminance).toFixed(9)}`,
    `list:${list.status}:${list.visited.length}`,
    `lookup:${lookupStatus}`,
  ].join('|')
}
