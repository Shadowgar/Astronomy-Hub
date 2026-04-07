import { describe, expect, it } from 'vitest'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'

import {
  computeBackendStarSceneObjects,
  computeHorizontalCoordinates,
  filterStarSceneObjectsByFov,
  getStarMagnitudeLimitForFov,
} from '../src/features/sky-engine/astronomy.ts'
import {
  isProjectedPointVisible,
  projectHorizontalToViewport,
} from '../src/features/sky-engine/projectionMath.ts'
import { computeSunState, deriveSunPhaseLabel, deriveSunVisualCalibration } from '../src/features/sky-engine/solar.ts'

const TEST_OBSERVER = {
  label: 'ORAS Observatory',
  latitude: 41.321903,
  longitude: -79.585394,
  elevationFt: 1420,
}

const SCENE_TIMESTAMP = '2025-01-15T03:00:00Z'

const BACKEND_STARS = [
  {
    id: 'star-vega',
    type: 'star',
    name: 'Vega',
    engine: 'sky_engine',
    right_ascension: 18.6156,
    declination: 38.7837,
    magnitude: 0.03,
    color_index: 0,
  },
  {
    id: 'star-polaris',
    type: 'star',
    name: 'Polaris',
    engine: 'sky_engine',
    right_ascension: 2.5303,
    declination: 89.2641,
    magnitude: 1.98,
    color_index: 0.6,
  },
  {
    id: 'star-deneb',
    type: 'star',
    name: 'Deneb',
    engine: 'sky_engine',
    right_ascension: 20.6905,
    declination: 45.2803,
    magnitude: 7.2,
    color_index: 0.1,
  },
  {
    id: 'star-faint',
    type: 'star',
    name: 'Faint',
    engine: 'sky_engine',
    right_ascension: 21.2,
    declination: 30.1,
    magnitude: 11.4,
    color_index: 0.5,
  },
]

describe('Sky Engine astronomy helpers', () => {
  it('maps FOV bands into explicit star magnitude limits', () => {
    expect(getStarMagnitudeLimitForFov(140)).toBe(6)
    expect(getStarMagnitudeLimitForFov(80)).toBe(8)
    expect(getStarMagnitudeLimitForFov(30)).toBe(10)
    expect(getStarMagnitudeLimitForFov(10)).toBe(12)
  })

  it('positions backend stars from RA/Dec into horizontal coordinates', () => {
    const objects = computeBackendStarSceneObjects(TEST_OBSERVER, SCENE_TIMESTAMP, BACKEND_STARS)
    const polaris = objects.find((object) => object.id === 'star-polaris')

    expect(objects).toHaveLength(4)
    expect(objects.every((object) => object.source === 'backend_star_catalog')).toBe(true)
    expect(polaris).toBeTruthy()
    expect(polaris?.azimuthDeg === undefined).toBe(false)
    expect(polaris?.altitudeDeg).toBeGreaterThan(39)
    expect((polaris?.azimuthDeg ?? 180) < 20 || (polaris?.azimuthDeg ?? 180) > 340).toBe(true)
  })

  it('filters stars by magnitude as FOV changes without altering retained positions', () => {
    const positionedStars = computeBackendStarSceneObjects(TEST_OBSERVER, SCENE_TIMESTAMP, BACKEND_STARS)
    const wideVisibleStars = filterStarSceneObjectsByFov(positionedStars, 120)
    const mediumVisibleStars = filterStarSceneObjectsByFov(positionedStars, 60)
    const closeVisibleStars = filterStarSceneObjectsByFov(positionedStars, 10)
    const retainedPolaris = closeVisibleStars.find((object) => object.id === 'star-polaris')
    const originalPolaris = positionedStars.find((object) => object.id === 'star-polaris')

    expect(wideVisibleStars).toHaveLength(2)
    expect(mediumVisibleStars).toHaveLength(3)
    expect(closeVisibleStars).toHaveLength(4)
    expect(retainedPolaris?.altitudeDeg).toBe(originalPolaris?.altitudeDeg)
    expect(retainedPolaris?.azimuthDeg).toBe(originalPolaris?.azimuthDeg)
  })

  it('changes backend star positions when the timestamp changes', () => {
    const vega = BACKEND_STARS.find((object) => object.name === 'Vega')

    expect(vega).toBeTruthy()

    const early = computeHorizontalCoordinates(TEST_OBSERVER, '2025-01-15T01:00:00Z', vega.right_ascension, vega.declination)
    const later = computeHorizontalCoordinates(TEST_OBSERVER, '2025-01-15T05:00:00Z', vega.right_ascension, vega.declination)

    expect(Math.abs(early.altitudeDeg - later.altitudeDeg)).toBeGreaterThan(1)
    expect(Math.abs(early.azimuthDeg - later.azimuthDeg)).toBeGreaterThan(1)
  })

  it('changes backend star positions when the observer changes', () => {
    const vega = BACKEND_STARS.find((object) => object.name === 'Vega')
    const equatorialObserver = { ...TEST_OBSERVER, latitude: 0, longitude: 0 }
    const northernObserver = { ...TEST_OBSERVER, latitude: 50, longitude: 0 }

    expect(vega).toBeTruthy()

    const equatorial = computeHorizontalCoordinates(equatorialObserver, SCENE_TIMESTAMP, vega.right_ascension, vega.declination)
    const northern = computeHorizontalCoordinates(northernObserver, SCENE_TIMESTAMP, vega.right_ascension, vega.declination)

    expect(Math.abs(equatorial.altitudeDeg - northern.altitudeDeg)).toBeGreaterThan(5)
  })

  it('projects computed backend star positions through the viewport projection system', () => {
    const [vega] = computeBackendStarSceneObjects(TEST_OBSERVER, SCENE_TIMESTAMP, [BACKEND_STARS[0]])
    const projected = projectHorizontalToViewport(vega.altitudeDeg, vega.azimuthDeg, {
      centerDirection: new Vector3(0, 0, 1),
      fovRadians: (120 * Math.PI) / 180,
      viewportWidth: 1000,
      viewportHeight: 1000,
      projectionMode: 'stereographic',
    })

    expect(projected).toBeTruthy()
    expect(Number.isFinite(projected?.screenX)).toBe(true)
    expect(Number.isFinite(projected?.screenY)).toBe(true)
  })

  it('keeps wide-FOV edge points visible when they still land inside the viewport', () => {
    const view = {
      centerDirection: new Vector3(0, 0, 1),
      fovRadians: (175 * Math.PI) / 180,
      viewportWidth: 1600,
      viewportHeight: 900,
      projectionMode: 'stereographic',
    }
    const edgePoint = {
      screenX: 1592,
      screenY: 448,
      planeX: 2.8,
      planeY: 0.02,
      depth: 0.18,
      angularDistanceRad: view.fovRadians * 0.75,
    }

    expect(isProjectedPointVisible(edgePoint, view)).toBe(true)
  })

  it('changes computed sun state across scene-time steps', () => {
    const earlySun = computeSunState(TEST_OBSERVER, '2026-07-15T03:00:00.000Z')
    const laterSun = computeSunState(TEST_OBSERVER, '2026-07-15T04:00:00.000Z')

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
    const daylightSun = computeSunState(TEST_OBSERVER, '2026-07-15T15:00:00.000Z')
    const lowSun = computeSunState(TEST_OBSERVER, '2026-07-15T10:00:00.000Z')
    const nightSun = computeSunState(TEST_OBSERVER, '2026-07-15T03:00:00.000Z')

    expect(daylightSun.phaseLabel).toBe('Daylight')
    expect(lowSun.phaseLabel).toBe('Low Sun')
    expect(nightSun.phaseLabel).toBe('Night')
    expect(daylightSun.visualCalibration.starVisibility).toBeLessThan(lowSun.visualCalibration.starVisibility)
    expect(lowSun.visualCalibration.starVisibility).toBeLessThan(nightSun.visualCalibration.starVisibility)
    expect(daylightSun.visualCalibration.starLabelVisibility).toBeLessThan(lowSun.visualCalibration.starLabelVisibility)
    expect(lowSun.visualCalibration.starLabelVisibility).toBeLessThan(nightSun.visualCalibration.starLabelVisibility)
  })
})