import { describe, expect, it } from 'vitest'

import {
  buildProceduralMilkyWaySamples,
  evaluateMilkyWayRenderState,
} from '../src/features/sky-engine/engine/sky/runtime/modules/MilkyWayModule.ts'

describe('milky way module response', () => {
  it('reveals the galactic layer more strongly at dark night than daylight', () => {
    const dayState = evaluateMilkyWayRenderState({
      skyBrightness: 0.98,
      adaptationLevel: 0.04,
      sceneContrast: 0.48,
      limitingMagnitude: -0.4,
      starVisibility: 0.08,
      starFieldBrightness: 0.1,
      atmosphereExposure: 0.72,
      milkyWayVisibility: 0.01,
      milkyWayContrast: 0.05,
      backdropAlpha: 0.92,
      nightSkyZenithLuminance: 0.01,
      nightSkyHorizonLuminance: 0.03,
      visualCalibration: {},
    }, -0.4, 70)
    const nightState = evaluateMilkyWayRenderState({
      skyBrightness: 0.04,
      adaptationLevel: 0.96,
      sceneContrast: 1.02,
      limitingMagnitude: 6.4,
      starVisibility: 1,
      starFieldBrightness: 0.92,
      atmosphereExposure: 1,
      milkyWayVisibility: 0.84,
      milkyWayContrast: 0.72,
      backdropAlpha: 0.74,
      nightSkyZenithLuminance: 0.012,
      nightSkyHorizonLuminance: 0.024,
      visualCalibration: {},
    }, 6.4, 70)

    expect(nightState.visibility).toBeGreaterThan(dayState.visibility)
    expect(nightState.contrast).toBeGreaterThan(dayState.contrast)
  })

  it('suppresses milky-way visibility under bright limiting-magnitude gate', () => {
    const gated = evaluateMilkyWayRenderState({
      skyBrightness: 0.2,
      adaptationLevel: 0.8,
      sceneContrast: 0.9,
      limitingMagnitude: 6.2,
      starVisibility: 1,
      starFieldBrightness: 1,
      atmosphereExposure: 1,
      milkyWayVisibility: 0.9,
      milkyWayContrast: 0.8,
      backdropAlpha: 0.8,
      nightSkyZenithLuminance: 0.012,
      nightSkyHorizonLuminance: 0.024,
      visualCalibration: {},
    }, -0.5, 70)
    const ungated = evaluateMilkyWayRenderState({
      skyBrightness: 0.2,
      adaptationLevel: 0.8,
      sceneContrast: 0.9,
      limitingMagnitude: 6.2,
      starVisibility: 1,
      starFieldBrightness: 1,
      atmosphereExposure: 1,
      milkyWayVisibility: 0.9,
      milkyWayContrast: 0.8,
      backdropAlpha: 0.8,
      nightSkyZenithLuminance: 0.012,
      nightSkyHorizonLuminance: 0.024,
      visualCalibration: {},
    }, 6.2, 70)

    expect(gated.visibility).toBe(0)
    expect(ungated.visibility).toBeGreaterThan(0)
  })

  it('suppresses milky-way visibility at narrow FOV where DSS is favored', () => {
    const brightState = {
      skyBrightness: 0.04,
      adaptationLevel: 0.96,
      sceneContrast: 1.02,
      limitingMagnitude: 6.4,
      starVisibility: 1,
      starFieldBrightness: 0.92,
      atmosphereExposure: 1,
      milkyWayVisibility: 0.84,
      milkyWayContrast: 0.72,
      backdropAlpha: 0.74,
      nightSkyZenithLuminance: 0.0008,
      nightSkyHorizonLuminance: 0.0012,
      visualCalibration: {},
    }
    const narrow = evaluateMilkyWayRenderState(brightState, 6.4, 8)
    const wide = evaluateMilkyWayRenderState(brightState, 6.4, 40)

    expect(narrow.visibility).toBe(0)
    expect(wide.visibility).toBeGreaterThan(0)
  })

  it('builds a bounded procedural galactic patch set', () => {
    const samples = buildProceduralMilkyWaySamples()

    expect(samples.length).toBeGreaterThan(500)
    expect(samples.some((sample) => sample.coreWeight > 1)).toBe(true)
    expect(samples.every((sample) => sample.radiusDeg > 0)).toBe(true)
    expect(samples.every((sample) => sample.alpha > 0)).toBe(true)
  })
})
