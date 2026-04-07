import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { describe, expect, it } from 'vitest'

import {
  SKY_ENGINE_MAX_FOV,
  SKY_ENGINE_MIN_FOV,
  getSelectionTargetVector,
  rotateVectorTowardPointerAnchor,
  stepSkyEngineFov,
} from '../src/features/sky-engine/observerNavigation.ts'

describe('Sky Engine observer navigation helpers', () => {
  it('clamps FOV steps inside the supported Babylon view range', () => {
    expect(stepSkyEngineFov(SKY_ENGINE_MIN_FOV, -10)).toBe(SKY_ENGINE_MIN_FOV)
    expect(stepSkyEngineFov(SKY_ENGINE_MAX_FOV, 10)).toBe(SKY_ENGINE_MAX_FOV)
    expect(stepSkyEngineFov(0.9, -1)).toBeLessThan(0.9)
    expect(stepSkyEngineFov(0.9, 1)).toBeGreaterThan(0.9)
  })

  it('rotates the active target toward the pre-zoom pointer anchor', () => {
    const currentTarget = new Vector3(0, 0, 12)
    const nextPointerDirection = new Vector3(0.22, 0, 0.975).normalize()
    const previousPointerDirection = new Vector3(0, 0, 1)

    const rotatedTarget = rotateVectorTowardPointerAnchor(currentTarget, nextPointerDirection, previousPointerDirection)

    expect(rotatedTarget.length()).toBeCloseTo(currentTarget.length(), 6)
    expect(rotatedTarget.x).toBeLessThan(0)
    expect(Vector3.Dot(rotatedTarget.normalize(), previousPointerDirection)).toBeLessThan(1)
  })

  it('does not horizon-bias selected view targets', () => {
    const selectedTarget = getSelectionTargetVector({
      id: 'high-star',
      name: 'High Star',
      type: 'star',
      altitudeDeg: 89,
      azimuthDeg: 180,
      magnitude: 1,
      colorHex: '#ffffff',
      summary: '',
      description: '',
      truthNote: '',
      source: 'computed_real_sky',
      trackingMode: 'fixed_equatorial',
      isAboveHorizon: true,
    })

    expect(selectedTarget.y).toBeGreaterThan(0.99)
  })
})