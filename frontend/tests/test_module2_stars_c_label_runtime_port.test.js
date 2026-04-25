import { describe, expect, it } from 'vitest'

import {
  BAYER_CONST_LONG,
  BAYER_LATIN_LONG,
  DSGN_TRANSLATE,
  TEXT_BOLD,
  TEXT_FLOAT,
  TEXT_MULTILINES,
  buildStarsCLabelRuntimeFixtureCases,
  computeStarsCLabelRuntimeFixtureDigest,
  defaultStarsCDesignationCleanup,
  isStarsCBayerDesignation,
  selectStarsCLabelRuntimeDecision,
  splitStarsCLabelLine,
  starsCNamesFromDelimitedIds,
} from '../src/features/sky-engine/engine/sky/adapters/starsCLabelRuntimePort'

describe('module2 stars.c label runtime port', () => {
  it('detects Bayer and variable-star designations using stars.c prefix rules', () => {
    expect(isStarsCBayerDesignation('* alf CMa')).toBe(true)
    expect(isStarsCBayerDesignation('V* V337 Car')).toBe(true)
    expect(isStarsCBayerDesignation('Sirius')).toBe(false)
    expect(isStarsCBayerDesignation('HIP 32349')).toBe(false)
  })

  it('turns pipe-delimited ids into stars.c style name entries', () => {
    expect(starsCNamesFromDelimitedIds('Sirius|* alf CMa|V* V337 Car')).toEqual([
      'Sirius',
      '* alf CMa',
      'V* V337 Car',
    ])
    expect(starsCNamesFromDelimitedIds('')).toEqual([])
    expect(starsCNamesFromDelimitedIds('A||B|')).toEqual(['A', 'B'])
  })

  it('uses skyculture labels before international fallback names', () => {
    const decision = selectStarsCLabelRuntimeDecision({
      star: {
        hip: 32349,
        vmag: -1.46,
        names: ['Sirius', '* alf CMa'],
      },
      selected: false,
      painterHintsLimitMag: 6,
      starsHintsMagOffset: 0,
      coreHintsMagOffset: 0,
      skycultureLabelForHip: (hip) => (hip === 32349 ? 'Dog Star' : null),
      fallbackToInternationalNames: true,
    })

    expect(decision.visible).toBe(true)
    expect(decision.text).toBe('Dog Star')
    expect(decision.source).toBe('skyculture')
    expect(decision.effects & TEXT_FLOAT).toBe(TEXT_FLOAT)
    expect(decision.effects & TEXT_MULTILINES).toBe(TEXT_MULTILINES)
    expect(decision.sortKey).toBe(1.46)
  })

  it('fails closed when skyculture fallback is disabled and no skyculture label exists', () => {
    const decision = selectStarsCLabelRuntimeDecision({
      star: {
        hip: 123,
        vmag: 0.8,
        names: ['Local Name', '* bet Ori'],
      },
      selected: false,
      painterHintsLimitMag: 6,
      starsHintsMagOffset: 0,
      coreHintsMagOffset: 0,
      skycultureLabelForHip: () => null,
      fallbackToInternationalNames: false,
    })

    expect(decision.visible).toBe(false)
    expect(decision.reason).toBe('missing-skyculture-label')
  })

  it('applies stars.c selected-star override for faint labels', () => {
    const hidden = selectStarsCLabelRuntimeDecision({
      star: {
        hip: 1,
        vmag: 8.2,
        names: ['Selected Faint Star'],
      },
      selected: false,
      painterHintsLimitMag: 6,
      starsHintsMagOffset: 0,
      coreHintsMagOffset: 0,
      skycultureLabelForHip: () => null,
      fallbackToInternationalNames: true,
    })
    expect(hidden.visible).toBe(false)
    expect(hidden.reason).toBe('below-label-limit')

    const selected = selectStarsCLabelRuntimeDecision({
      star: {
        hip: 1,
        vmag: 8.2,
        names: ['Selected Faint Star'],
      },
      selected: true,
      painterHintsLimitMag: 6,
      starsHintsMagOffset: 0,
      coreHintsMagOffset: 0,
      skycultureLabelForHip: () => null,
      fallbackToInternationalNames: true,
    })

    expect(selected.visible).toBe(true)
    expect(selected.text).toBe('Selected Faint\nStar')
    expect(selected.effects).toBe(TEXT_BOLD | TEXT_MULTILINES)
    expect(selected.colorAlpha).toBe(1)
  })

  it('uses long Bayer cleanup flags for very bright fallback names', () => {
    const cleanupCalls = []
    const decision = selectStarsCLabelRuntimeDecision({
      star: {
        hip: 222,
        vmag: 0.5,
        names: ['* alf CMa'],
      },
      selected: false,
      painterHintsLimitMag: 7,
      starsHintsMagOffset: 0,
      coreHintsMagOffset: 0,
      skycultureLabelForHip: () => null,
      fallbackToInternationalNames: true,
      designationCleanup: (name, flags) => {
        cleanupCalls.push({ name, flags })
        return defaultStarsCDesignationCleanup(name, flags)
      },
    })

    expect(decision.visible).toBe(true)
    expect(decision.source).toBe('international')
    expect(cleanupCalls).toHaveLength(1)
    expect(cleanupCalls[0].flags & DSGN_TRANSLATE).toBe(DSGN_TRANSLATE)
    expect(cleanupCalls[0].flags & BAYER_LATIN_LONG).toBe(BAYER_LATIN_LONG)
    expect(cleanupCalls[0].flags & BAYER_CONST_LONG).toBe(BAYER_CONST_LONG)
  })

  it('falls back to compact Bayer designation for mid-bright stars', () => {
    const decision = selectStarsCLabelRuntimeDecision({
      star: {
        hip: 333,
        vmag: 4.2,
        names: ['Decorative Common Name', '* gam Cyg'],
      },
      selected: false,
      painterHintsLimitMag: 11,
      starsHintsMagOffset: 0,
      coreHintsMagOffset: 0,
      skycultureLabelForHip: () => null,
      fallbackToInternationalNames: true,
      designationCleanup: defaultStarsCDesignationCleanup,
    })

    expect(decision.visible).toBe(true)
    expect(decision.text).toBe('gam Cyg')
    expect(decision.source).toBe('bayer')
  })

  it('splits long labels into deterministic 16-character lines', () => {
    expect(splitStarsCLabelLine('Alpha Beta Gamma Delta', 16)).toBe('Alpha Beta Gamma\nDelta')
    expect(splitStarsCLabelLine('Supercalifragilistic', 16)).toBe('Supercalifragili\nstic')
  })

  it('produces deterministic fixture digest coverage', () => {
    const cases = buildStarsCLabelRuntimeFixtureCases()
    expect(cases.length).toBeGreaterThanOrEqual(5)

    const digestA = computeStarsCLabelRuntimeFixtureDigest()
    const digestB = computeStarsCLabelRuntimeFixtureDigest()
    expect(digestA).toBe(digestB)
    expect(digestA).toContain('skyculture')
    expect(digestA).toContain('hidden')
    expect(digestA.length).toBeGreaterThan(100)
  })
})
