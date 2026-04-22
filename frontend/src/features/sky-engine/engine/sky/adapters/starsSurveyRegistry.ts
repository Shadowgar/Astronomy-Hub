import type { SkyTileCatalog } from '../contracts/tiles'

export type StarsRuntimeSurveyDefinition<TLoadTile> = {
  key: string
  catalog: Extract<SkyTileCatalog, 'hipparcos' | 'gaia'>
  minVmag: number
  maxVmag: number
  sourceRecordCount?: number
  loadTile: TLoadTile
}

export type StarsSurveyNormalizationOptions = {
  skipGaiaVmagPromotion?: boolean
}

function resolveComparableSurveyMaxVmag(maxVmag: number) {
  return Number.isFinite(maxVmag) ? maxVmag : Number.POSITIVE_INFINITY
}

/**
 * Stellarium `stars.c::survey_cmp` parity helper:
 * non-finite `max_vmag` values sort after finite surveys.
 */
export function compareStarsSurveyByMaxVmag<TLoadTile>(
  left: StarsRuntimeSurveyDefinition<TLoadTile>,
  right: StarsRuntimeSurveyDefinition<TLoadTile>,
) {
  const leftMax = resolveComparableSurveyMaxVmag(left.maxVmag)
  const rightMax = resolveComparableSurveyMaxVmag(right.maxVmag)
  return leftMax - rightMax
}

export function sortStarsSurveysByMaxVmag<TLoadTile>(
  surveys: readonly StarsRuntimeSurveyDefinition<TLoadTile>[],
) {
  return surveys.slice().sort(compareStarsSurveyByMaxVmag)
}

/**
 * Mirrors `stars_add_data_source` post-sort Gaia gate update:
 * `gaia.min_vmag = max(gaia.min_vmag, non_gaia.max_vmag)` over finite maxima.
 */
export function promoteGaiaSurveyMinVmag<TLoadTile>(
  orderedSurveys: readonly StarsRuntimeSurveyDefinition<TLoadTile>[],
) {
  const gaiaSurvey = orderedSurveys.find((survey) => survey.catalog === 'gaia')
  if (!gaiaSurvey) {
    return orderedSurveys
  }
  for (const survey of orderedSurveys) {
    if (survey.catalog === 'gaia') {
      continue
    }
    if (!Number.isFinite(survey.maxVmag)) {
      continue
    }
    gaiaSurvey.minVmag = Math.max(gaiaSurvey.minVmag, survey.maxVmag)
  }
  return orderedSurveys
}

/**
 * Combined `stars_add_data_source` ordering + optional Gaia promotion.
 * Promotion can be skipped for the Hub narrow-FOV Gaia override path.
 */
export function normalizeStarsSurveyOrdering<TLoadTile>(
  surveys: readonly StarsRuntimeSurveyDefinition<TLoadTile>[],
  options?: StarsSurveyNormalizationOptions,
) {
  const ordered = sortStarsSurveysByMaxVmag(surveys)
  if (options?.skipGaiaVmagPromotion === true) {
    return ordered
  }
  return promoteGaiaSurveyMinVmag(ordered)
}

/**
 * Activation floor used by the Hub Gaia activation policy:
 * brightest finite non-Gaia `maxVmag` (fallback to provided baseline).
 */
export function computeGaiaActivationFloorFromSurveys<TLoadTile>(
  surveys: readonly StarsRuntimeSurveyDefinition<TLoadTile>[],
  fallbackMinVmag: number,
) {
  return surveys.reduce((minimumMagnitude, survey) => (
    survey.catalog === 'gaia' || !Number.isFinite(survey.maxVmag)
      ? minimumMagnitude
      : Math.max(minimumMagnitude, survey.maxVmag)
  ), fallbackMinVmag)
}

export type ShouldActivateGaiaSurveyInput = {
  limitingMagnitude: number
  observerFovDeg: number
  activationFloorVmag: number
  activationFovDeg: number
}

/**
 * Hub runtime Gaia activation policy:
 * enable Gaia when limiting magnitude reaches activation floor or when FOV is narrow.
 */
export function shouldActivateGaiaSurvey(input: ShouldActivateGaiaSurveyInput) {
  return (
    input.limitingMagnitude >= input.activationFloorVmag ||
    input.observerFovDeg <= input.activationFovDeg
  )
}

export type ResolveGaiaEntryMinVmagInput = {
  observerFovDeg: number
  activationFovDeg: number
  fallbackMinVmag: number
  activationFloorVmag: number
  gaiaPropertiesMinVmag: number
}

/**
 * Entry-time Gaia `min_vmag` selection used by repository registration:
 * - narrow FOV override starts Gaia from fallback bright floor,
 * - otherwise clamp Gaia properties min against activation floor.
 */
export function resolveGaiaEntryMinVmag(input: ResolveGaiaEntryMinVmagInput) {
  if (input.observerFovDeg <= input.activationFovDeg) {
    return input.fallbackMinVmag
  }
  return Math.max(input.gaiaPropertiesMinVmag, input.activationFloorVmag)
}

export function resolveActiveStarsSurveys<TLoadTile>(
  surveys: readonly StarsRuntimeSurveyDefinition<TLoadTile>[],
  limitingMagnitude: number,
) {
  return surveys.filter((survey) => survey.minVmag <= limitingMagnitude)
}

export type StarsSurveyLoadPlanInput<TLoadTile> = {
  surveys: readonly StarsRuntimeSurveyDefinition<TLoadTile>[]
  limitingMagnitude: number
  observerFovDeg: number
  activationFovDeg: number
  fallbackMinVmag: number
}

export type StarsSurveyLoadPlan<TLoadTile> = {
  orderedSurveys: readonly StarsRuntimeSurveyDefinition<TLoadTile>[]
  activeSurveys: readonly StarsRuntimeSurveyDefinition<TLoadTile>[]
  activationFloorVmag: number
  shouldActivateGaia: boolean
}

/**
 * Produces a deterministic survey load plan for the current frame/query.
 */
export function buildStarsSurveyLoadPlan<TLoadTile>(
  input: StarsSurveyLoadPlanInput<TLoadTile>,
) {
  const activationFloorVmag = computeGaiaActivationFloorFromSurveys(
    input.surveys,
    input.fallbackMinVmag,
  )
  const shouldActivateGaia = shouldActivateGaiaSurvey({
    limitingMagnitude: input.limitingMagnitude,
    observerFovDeg: input.observerFovDeg,
    activationFloorVmag,
    activationFovDeg: input.activationFovDeg,
  })
  const orderedSurveys = normalizeStarsSurveyOrdering(input.surveys, {
    skipGaiaVmagPromotion: input.observerFovDeg <= input.activationFovDeg,
  })
  const activeSurveys = resolveActiveStarsSurveys(orderedSurveys, input.limitingMagnitude)

  return {
    orderedSurveys,
    activeSurveys,
    activationFloorVmag,
    shouldActivateGaia,
  }
}
