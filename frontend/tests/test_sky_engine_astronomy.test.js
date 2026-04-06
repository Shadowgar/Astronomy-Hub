import { describe, expect, it } from 'vitest'

import {
  computeHorizontalCoordinates,
  computeObjectTrajectorySamples,
  computeRealSkySceneObjects,
} from '../src/features/sky-engine/astronomy.ts'
import { SKY_ENGINE_REAL_SKY_STARTERS, SKY_ENGINE_SCENE_TIMESTAMP } from '../src/features/sky-engine/realSkyCatalog.ts'
import {
  buildSceneTimestampFromHourOffset,
  formatSceneHourOffset,
} from '../src/features/sky-engine/sceneTime.ts'
import { ORAS_OBSERVER } from '../src/features/sky-engine/sceneSeed.ts'
import { computeSunState, deriveSunPhaseLabel, deriveSunVisualCalibration } from '../src/features/sky-engine/solar.ts'

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

  it('builds deterministic scene timestamps from bounded hour offsets', () => {
    const baseTimestamp = '2026-07-15T03:00:00.000Z'

    expect(buildSceneTimestampFromHourOffset(baseTimestamp, -1)).toBe('2026-07-15T02:00:00.000Z')
    expect(buildSceneTimestampFromHourOffset(baseTimestamp, 1)).toBe('2026-07-15T04:00:00.000Z')
    expect(buildSceneTimestampFromHourOffset(baseTimestamp, -24)).toBe('2026-07-14T03:00:00.000Z')
    expect(buildSceneTimestampFromHourOffset(baseTimestamp, 24)).toBe('2026-07-16T03:00:00.000Z')
    expect(formatSceneHourOffset(0)).toBe('Base time')
    expect(formatSceneHourOffset(7)).toBe('+7h')
    expect(formatSceneHourOffset(-5)).toBe('-5h')
  })

  it('builds trajectory samples for computed stars across a 12-hour window', () => {
    const vega = computeRealSkySceneObjects(
      ORAS_OBSERVER,
      SKY_ENGINE_SCENE_TIMESTAMP,
      SKY_ENGINE_REAL_SKY_STARTERS,
    ).find((object) => object.name === 'Vega')

    expect(vega).toBeTruthy()

    const trajectory = computeObjectTrajectorySamples(
      ORAS_OBSERVER,
      SKY_ENGINE_SCENE_TIMESTAMP,
      vega,
      [-6, 0, 6],
    )

    expect(trajectory).toHaveLength(3)
    expect(Math.abs(trajectory[0].altitudeDeg - trajectory[2].altitudeDeg)).toBeGreaterThan(1)
    expect(trajectory[1].timestampIso).toBe(SKY_ENGINE_SCENE_TIMESTAMP)
  })

  it('changes computed sun state across scene-time steps', () => {
    const earlySun = computeSunState(ORAS_OBSERVER, '2026-07-15T03:00:00.000Z')
    const laterSun = computeSunState(ORAS_OBSERVER, '2026-07-15T04:00:00.000Z')

    expect(Math.abs(earlySun.altitudeDeg - laterSun.altitudeDeg)).toBeGreaterThan(0.5)
    expect(Math.abs(earlySun.azimuthDeg - laterSun.azimuthDeg)).toBeGreaterThan(0.5)
    expect(earlySun.lightDirection.x).not.toBe(laterSun.lightDirection.x)
  })

  it('maps sun altitude into distinct visual calibration bands', () => {
    const daylight = deriveSunVisualCalibration(28)
    const lowSun = deriveSunVisualCalibration(1.5)
    const night = deriveSunVisualCalibration(-18)

    expect(deriveSunPhaseLabel(28)).toBe('Daylight')
    expect(deriveSunPhaseLabel(1.5)).toBe('Low Sun')
    expect(deriveSunPhaseLabel(-18)).toBe('Night')
    expect(daylight.phaseLabel).toBe('Daylight')
    expect(lowSun.phaseLabel).toBe('Low Sun')
    expect(night.phaseLabel).toBe('Night')
    expect(daylight.directionalLightIntensity).toBeGreaterThan(lowSun.directionalLightIntensity)
    expect(lowSun.directionalLightIntensity).toBeGreaterThan(night.directionalLightIntensity)
    expect(daylight.directionalLightColorHex).not.toBe(lowSun.directionalLightColorHex)
  })

  it('changes star visibility calibration between day, low sun, and night', () => {
    const daylightSun = computeSunState(ORAS_OBSERVER, '2026-07-15T15:00:00.000Z')
    const lowSun = computeSunState(ORAS_OBSERVER, '2026-07-15T10:00:00.000Z')
    const nightSun = computeSunState(ORAS_OBSERVER, '2026-07-15T03:00:00.000Z')

    expect(daylightSun.phaseLabel).toBe('Daylight')
    expect(lowSun.phaseLabel).toBe('Low Sun')
    expect(nightSun.phaseLabel).toBe('Night')
    expect(daylightSun.visualCalibration.starVisibility).toBeLessThan(lowSun.visualCalibration.starVisibility)
    expect(lowSun.visualCalibration.starVisibility).toBeLessThan(nightSun.visualCalibration.starVisibility)
    expect(daylightSun.visualCalibration.starLabelVisibility).toBeLessThan(lowSun.visualCalibration.starLabelVisibility)
    expect(lowSun.visualCalibration.starLabelVisibility).toBeLessThan(nightSun.visualCalibration.starLabelVisibility)
  })
})