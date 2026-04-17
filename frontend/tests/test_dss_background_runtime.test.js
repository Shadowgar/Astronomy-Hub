import { describe, expect, it } from 'vitest'

import { computeDssLayerAlpha } from '../src/features/sky-engine/engine/sky/runtime/modules/BackgroundRuntimeModule'

const TEST_BRIGHTNESS = {
  milkyWayVisibility: 0.8,
  milkyWayContrast: 0.7,
}

describe('DSS background runtime gating', () => {
  it('suppresses DSS at wide field-of-view', () => {
    const alpha = computeDssLayerAlpha(40, 16, TEST_BRIGHTNESS)
    expect(alpha).toBe(0)
  })

  it('suppresses DSS when limiting magnitude is too bright', () => {
    const alpha = computeDssLayerAlpha(12, 4, TEST_BRIGHTNESS)
    expect(alpha).toBe(0)
  })

  it('enables DSS at narrow FOV and deep limiting magnitude', () => {
    const alpha = computeDssLayerAlpha(12, 15, TEST_BRIGHTNESS)
    expect(alpha).toBeGreaterThan(0.2)
    expect(alpha).toBeLessThanOrEqual(1.2)
  })
})
