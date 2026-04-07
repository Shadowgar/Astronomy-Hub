import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { describe, expect, it } from 'vitest'

import {
  SKY_ENGINE_MAX_FOV,
  SKY_ENGINE_MIN_FOV,
  getSelectionTargetVector,
  rotateVectorTowardPointerAnchor,
  stabilizeSkyEngineCenterDirection,
  stepSkyEngineFov,
} from '../src/features/sky-engine/observerNavigation.ts'
import { directionToHorizontal, horizontalToDirection } from '../src/features/sky-engine/projectionMath.ts'

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

  it('keeps pole-facing center directions just inside the zenith and nadir clamps', () => {
    const zenithCenter = stabilizeSkyEngineCenterDirection(horizontalToDirection(90, 135))
    const nadirCenter = stabilizeSkyEngineCenterDirection(horizontalToDirection(-90, 315))
    const zenithHorizontal = directionToHorizontal(zenithCenter)
    const nadirHorizontal = directionToHorizontal(nadirCenter)

    expect(zenithHorizontal.altitudeDeg).toBeLessThan(90)
    expect(zenithHorizontal.altitudeDeg).toBeGreaterThan(89.9)
    expect(nadirHorizontal.altitudeDeg).toBeGreaterThan(-90)
    expect(nadirHorizontal.altitudeDeg).toBeLessThan(-89.9)
  })

  it('keeps drag rotation finite near the zenith without flipping across the pole', () => {
    const dragBaseCenter = horizontalToDirection(89.92, 20)
    const pointerAnchor = horizontalToDirection(84, 20)
    const nextPointerDirection = horizontalToDirection(84, 110)

    const rotatedTarget = rotateVectorTowardPointerAnchor(dragBaseCenter, nextPointerDirection, pointerAnchor)
    const rotatedHorizontal = directionToHorizontal(rotatedTarget)

    expect(Number.isFinite(rotatedHorizontal.altitudeDeg)).toBe(true)
    expect(Number.isFinite(rotatedHorizontal.azimuthDeg)).toBe(true)
    expect(rotatedHorizontal.altitudeDeg).toBeLessThan(90)
    expect(rotatedHorizontal.altitudeDeg).toBeGreaterThan(80)
  })
})