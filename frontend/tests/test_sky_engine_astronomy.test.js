import { describe, expect, it } from 'vitest'

import { computeHorizontalCoordinates, computeRealSkySceneObjects } from '../src/features/sky-engine/astronomy.ts'
import { SKY_ENGINE_REAL_SKY_STARTERS, SKY_ENGINE_SCENE_TIMESTAMP } from '../src/features/sky-engine/realSkyCatalog.ts'
import { applySceneTimeAction } from '../src/features/sky-engine/sceneTime.ts'
import { ORAS_OBSERVER } from '../src/features/sky-engine/sceneSeed.ts'
import { computeSunState } from '../src/features/sky-engine/solar.ts'

describe('Sky Engine astronomy helpers', () => {
  it('renders at least three computed starter objects above the horizon for the scene timestamp', () => {
    const objects = computeRealSkySceneObjects(ORAS_OBSERVER, SKY_ENGINE_SCENE_TIMESTAMP, SKY_ENGINE_REAL_SKY_STARTERS)
    const visibleObjects = objects.filter((object) => object.isAboveHorizon)

    expect(visibleObjects.length).toBeGreaterThanOrEqual(3)
    expect(visibleObjects.map((object) => object.name)).toContain('Vega')
    expect(visibleObjects.map((object) => object.name)).toContain('Deneb')
    expect(visibleObjects.every((object) => object.source === 'computed_real_sky')).toBe(true)
  })

  it('changes computed coordinates when the timestamp changes', () => {
    const vega = SKY_ENGINE_REAL_SKY_STARTERS.find((object) => object.name === 'Vega')

    expect(vega).toBeTruthy()

    const early = computeHorizontalCoordinates(ORAS_OBSERVER, '2026-07-15T01:00:00.000Z', vega.rightAscensionHours, vega.declinationDeg)
    const later = computeHorizontalCoordinates(ORAS_OBSERVER, '2026-07-15T05:00:00.000Z', vega.rightAscensionHours, vega.declinationDeg)

    expect(Math.abs(early.altitudeDeg - later.altitudeDeg)).toBeGreaterThan(1)
    expect(Math.abs(early.azimuthDeg - later.azimuthDeg)).toBeGreaterThan(1)
  })

  it('applies deterministic bounded scene-time actions', () => {
    const baseTimestamp = '2026-07-15T03:00:00.000Z'

    expect(applySceneTimeAction(baseTimestamp, 'minus_hour')).toBe('2026-07-15T02:00:00.000Z')
    expect(applySceneTimeAction(baseTimestamp, 'plus_hour')).toBe('2026-07-15T04:00:00.000Z')
    expect(applySceneTimeAction(baseTimestamp, 'minus_day')).toBe('2026-07-14T03:00:00.000Z')
    expect(applySceneTimeAction(baseTimestamp, 'plus_day')).toBe('2026-07-16T03:00:00.000Z')
    expect(
      applySceneTimeAction(baseTimestamp, 'now', () => new Date('2026-04-05T12:34:56.000Z')),
    ).toBe('2026-04-05T12:34:56.000Z')
  })

  it('changes computed sun state across scene-time steps', () => {
    const earlySun = computeSunState(ORAS_OBSERVER, '2026-07-15T03:00:00.000Z')
    const laterSun = computeSunState(ORAS_OBSERVER, '2026-07-15T04:00:00.000Z')

    expect(Math.abs(earlySun.altitudeDeg - laterSun.altitudeDeg)).toBeGreaterThan(0.5)
    expect(Math.abs(earlySun.azimuthDeg - laterSun.azimuthDeg)).toBeGreaterThan(0.5)
    expect(earlySun.lightDirection.x).not.toBe(laterSun.lightDirection.x)
  })
})