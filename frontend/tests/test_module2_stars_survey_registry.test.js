import { describe, expect, it } from 'vitest'

import {
  buildStarsSurveyLoadPlan,
  compareStarsSurveyByMaxVmag,
  computeGaiaActivationFloorFromSurveys,
  normalizeStarsSurveyOrdering,
  promoteGaiaSurveyMinVmag,
  resolveActiveStarsSurveys,
  resolveGaiaEntryMinVmag,
  shouldActivateGaiaSurvey,
} from '../src/features/sky-engine/engine/sky/adapters/starsSurveyRegistry'

function makeSurvey(overrides) {
  return {
    key: 'survey',
    catalog: 'hipparcos',
    minVmag: -2,
    maxVmag: 6.5,
    loadTile: async () => null,
    ...overrides,
  }
}

describe('module2 stars_add_data_source survey ordering parity', () => {
  it('sorts surveys by maxVmag with NaN treated as +infinity (survey_cmp parity)', () => {
    const surveys = [
      makeSurvey({ key: 'deep', maxVmag: Number.NaN, minVmag: 10 }),
      makeSurvey({ key: 'mid', maxVmag: 9.1, minVmag: 6.5 }),
      makeSurvey({ key: 'bright', maxVmag: 6.5, minVmag: -2 }),
    ]
    const ordered = surveys.slice().sort(compareStarsSurveyByMaxVmag)
    expect(ordered.map((survey) => survey.key)).toEqual(['bright', 'mid', 'deep'])
  })

  it('keeps insertion order when maxVmag ties (survey_cmp parity)', () => {
    const surveys = [
      makeSurvey({ key: 'b', maxVmag: 6.5, minVmag: -2 }),
      makeSurvey({ key: 'a', maxVmag: 6.5, minVmag: -2 }),
      makeSurvey({ key: 'c', maxVmag: 6.5, minVmag: -1.5 }),
    ]
    const ordered = surveys.slice().sort(compareStarsSurveyByMaxVmag)
    expect(ordered.map((survey) => survey.key)).toEqual(['b', 'a', 'c'])
  })

  it('promotes Gaia minVmag to brightest finite non-Gaia maxVmag', () => {
    const ordered = [
      makeSurvey({ key: 'hip-bright', catalog: 'hipparcos', maxVmag: 6.5, minVmag: -2 }),
      makeSurvey({ key: 'hip-deep', catalog: 'hipparcos', maxVmag: 9.2, minVmag: 6.5 }),
      makeSurvey({ key: 'gaia', catalog: 'gaia', maxVmag: 20, minVmag: 4 }),
    ]
    promoteGaiaSurveyMinVmag(ordered)
    const gaia = ordered.find((survey) => survey.catalog === 'gaia')
    expect(gaia?.minVmag).toBe(9.2)
  })

  it('ignores non-finite non-Gaia maxVmag when promoting Gaia minVmag', () => {
    const ordered = [
      makeSurvey({ key: 'hip-bright', catalog: 'hipparcos', maxVmag: 6.5, minVmag: -2 }),
      makeSurvey({ key: 'hip-open', catalog: 'hipparcos', maxVmag: Number.POSITIVE_INFINITY, minVmag: 6.5 }),
      makeSurvey({ key: 'gaia', catalog: 'gaia', maxVmag: 20, minVmag: 4 }),
    ]
    promoteGaiaSurveyMinVmag(ordered)
    const gaia = ordered.find((survey) => survey.catalog === 'gaia')
    expect(gaia?.minVmag).toBe(6.5)
  })

  it('keeps Gaia minVmag unchanged when skipGaiaVmagPromotion=true', () => {
    const ordered = normalizeStarsSurveyOrdering([
      makeSurvey({ key: 'gaia', catalog: 'gaia', maxVmag: 20, minVmag: 4 }),
      makeSurvey({ key: 'hip', catalog: 'hipparcos', maxVmag: 8.3, minVmag: -2 }),
    ], { skipGaiaVmagPromotion: true })
    const gaia = ordered.find((survey) => survey.catalog === 'gaia')
    expect(gaia?.minVmag).toBe(4)
  })
})

describe('module2 Gaia activation and entry minVmag policy', () => {
  it('computes Gaia activation floor from brightest finite non-Gaia maxVmag', () => {
    const floor = computeGaiaActivationFloorFromSurveys([
      makeSurvey({ key: 'hip-bright', catalog: 'hipparcos', maxVmag: 6.5 }),
      makeSurvey({ key: 'hip-mid', catalog: 'hipparcos', maxVmag: 8.1 }),
      makeSurvey({ key: 'gaia', catalog: 'gaia', maxVmag: 20 }),
    ], -2)
    expect(floor).toBe(8.1)
  })

  it('uses fallback floor when no finite non-Gaia maxVmag exists', () => {
    const floor = computeGaiaActivationFloorFromSurveys([
      makeSurvey({ key: 'hip-open', catalog: 'hipparcos', maxVmag: Number.NaN }),
      makeSurvey({ key: 'gaia', catalog: 'gaia', maxVmag: 20 }),
    ], -2)
    expect(floor).toBe(-2)
  })

  it('activates Gaia when limitingMagnitude reaches activation floor', () => {
    expect(shouldActivateGaiaSurvey({
      limitingMagnitude: 8.2,
      observerFovDeg: 60,
      activationFloorVmag: 8.1,
      activationFovDeg: 40,
    })).toBe(true)
  })

  it('activates Gaia on narrow FOV regardless of limitingMagnitude', () => {
    expect(shouldActivateGaiaSurvey({
      limitingMagnitude: 5,
      observerFovDeg: 20,
      activationFloorVmag: 8.1,
      activationFovDeg: 40,
    })).toBe(true)
  })

  it('does not activate Gaia on wide FOV when limitingMagnitude is below floor', () => {
    expect(shouldActivateGaiaSurvey({
      limitingMagnitude: 5,
      observerFovDeg: 80,
      activationFloorVmag: 8.1,
      activationFovDeg: 40,
    })).toBe(false)
  })

  it('uses fallback minVmag for Gaia entry on narrow FOV override', () => {
    const value = resolveGaiaEntryMinVmag({
      observerFovDeg: 20,
      activationFovDeg: 40,
      fallbackMinVmag: -2,
      activationFloorVmag: 8.1,
      gaiaPropertiesMinVmag: 6.5,
    })
    expect(value).toBe(-2)
  })

  it('clamps Gaia entry minVmag against activation floor on wide FOV', () => {
    const value = resolveGaiaEntryMinVmag({
      observerFovDeg: 70,
      activationFovDeg: 40,
      fallbackMinVmag: -2,
      activationFloorVmag: 8.1,
      gaiaPropertiesMinVmag: 6.5,
    })
    expect(value).toBe(8.1)
  })

  it('keeps Gaia properties minVmag when already above activation floor', () => {
    const value = resolveGaiaEntryMinVmag({
      observerFovDeg: 70,
      activationFovDeg: 40,
      fallbackMinVmag: -2,
      activationFloorVmag: 8.1,
      gaiaPropertiesMinVmag: 9.7,
    })
    expect(value).toBe(9.7)
  })
})

describe('module2 survey load-plan integration', () => {
  it('returns ordered + active surveys after Gaia promotion on wide FOV', () => {
    const plan = buildStarsSurveyLoadPlan({
      surveys: [
        makeSurvey({ key: 'gaia', catalog: 'gaia', maxVmag: 20, minVmag: 4 }),
        makeSurvey({ key: 'hip-main', catalog: 'hipparcos', maxVmag: 6.5, minVmag: -2 }),
        makeSurvey({ key: 'hip-deep', catalog: 'hipparcos', maxVmag: 9.2, minVmag: 6.5 }),
      ],
      limitingMagnitude: 9.5,
      observerFovDeg: 70,
      activationFovDeg: 40,
      fallbackMinVmag: -2,
    })

    expect(plan.activationFloorVmag).toBe(9.2)
    expect(plan.shouldActivateGaia).toBe(true)
    expect(plan.orderedSurveys.map((survey) => survey.key)).toEqual(['hip-main', 'hip-deep', 'gaia'])
    const gaia = plan.orderedSurveys.find((survey) => survey.key === 'gaia')
    expect(gaia?.minVmag).toBe(9.2)
    expect(plan.activeSurveys.map((survey) => survey.key)).toEqual(['hip-main', 'hip-deep', 'gaia'])
  })

  it('keeps Gaia minVmag unpromoted on narrow FOV while still activating', () => {
    const plan = buildStarsSurveyLoadPlan({
      surveys: [
        makeSurvey({ key: 'gaia', catalog: 'gaia', maxVmag: 20, minVmag: 4 }),
        makeSurvey({ key: 'hip-main', catalog: 'hipparcos', maxVmag: 6.5, minVmag: -2 }),
      ],
      limitingMagnitude: 5.2,
      observerFovDeg: 20,
      activationFovDeg: 40,
      fallbackMinVmag: -2,
    })
    const gaia = plan.orderedSurveys.find((survey) => survey.catalog === 'gaia')
    expect(plan.shouldActivateGaia).toBe(true)
    expect(gaia?.minVmag).toBe(4)
    expect(plan.activeSurveys.map((survey) => survey.key)).toEqual(['hip-main', 'gaia'])
  })

  it('returns only active surveys whose minVmag <= limitingMagnitude', () => {
    const surveys = [
      makeSurvey({ key: 'hip-main', catalog: 'hipparcos', maxVmag: 6.5, minVmag: -2 }),
      makeSurvey({ key: 'hip-deep', catalog: 'hipparcos', maxVmag: 10.2, minVmag: 8.5 }),
      makeSurvey({ key: 'gaia', catalog: 'gaia', maxVmag: 20, minVmag: 12 }),
    ]
    const active = resolveActiveStarsSurveys(surveys, 9.1)
    expect(active.map((survey) => survey.key)).toEqual(['hip-main', 'hip-deep'])
  })

  it('keeps insertion order for equal maxVmag in load-plan output', () => {
    const plan = buildStarsSurveyLoadPlan({
      surveys: [
        makeSurvey({ key: 'b', catalog: 'hipparcos', maxVmag: 6.5, minVmag: -2 }),
        makeSurvey({ key: 'a', catalog: 'hipparcos', maxVmag: 6.5, minVmag: -2 }),
        makeSurvey({ key: 'gaia', catalog: 'gaia', maxVmag: 20, minVmag: 12 }),
      ],
      limitingMagnitude: 6.6,
      observerFovDeg: 70,
      activationFovDeg: 40,
      fallbackMinVmag: -2,
    })
    expect(plan.orderedSurveys.map((survey) => survey.key)).toEqual(['b', 'a', 'gaia'])
  })
})
