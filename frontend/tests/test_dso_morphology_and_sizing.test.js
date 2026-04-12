import { describe, expect, it } from 'vitest'

import { getDeepSkyMarkerDimensionsPx, getDeepSkyVisualStyle } from '../src/features/sky-engine/dsoVisuals'
import { collectProjectedNonStarObjects } from '../src/features/sky-engine/engine/sky/runtime/modules/runtimeFrame'
import { horizontalToDirection } from '../src/features/sky-engine/projectionMath'

const TEST_VIEW = {
  centerDirection: horizontalToDirection(55, 180),
  fovRadians: (60 * Math.PI) / 180,
  viewportWidth: 1000,
  viewportHeight: 1000,
  projectionMode: 'stereographic',
}

const TEST_SUN_STATE = {
  visualCalibration: {
    starFieldBrightness: 1,
  },
}

function createDeepSkyObject(overrides = {}) {
  return {
    id: 'dso-test',
    name: 'DSO Test',
    type: 'deep_sky',
    altitudeDeg: 55,
    azimuthDeg: 180,
    magnitude: 4,
    apparentSizeDeg: 1.2,
    colorHex: '#9ec7ff',
    summary: 'test object',
    description: 'test object',
    truthNote: 'test object',
    source: 'computed_real_sky',
    trackingMode: 'fixed_equatorial',
    isAboveHorizon: true,
    ...overrides,
  }
}

describe('DSO morphology and sizing', () => {
  it('derives distinct marker dimensions for galaxy, nebula, cluster, and generic classes', () => {
    const galaxy = getDeepSkyMarkerDimensionsPx({ deepSkyClass: 'galaxy' }, 10)
    const nebula = getDeepSkyMarkerDimensionsPx({ deepSkyClass: 'nebula' }, 10)
    const cluster = getDeepSkyMarkerDimensionsPx({ deepSkyClass: 'cluster' }, 10)
    const generic = getDeepSkyMarkerDimensionsPx({}, 10)

    expect(galaxy.visualClass).toBe('galaxy')
    expect(nebula.visualClass).toBe('nebula')
    expect(cluster.visualClass).toBe('cluster')
    expect(generic.visualClass).toBe('generic')
    expect(galaxy.widthPx).toBeGreaterThan(galaxy.heightPx)
    expect(nebula.widthPx).toBeGreaterThan(cluster.widthPx)
    expect(cluster.widthPx).toBe(cluster.heightPx)
    expect(generic.widthPx).not.toBe(galaxy.widthPx)
  })

  it('applies class-aware projected DSO sizing in the runtime frame', () => {
    const galaxy = createDeepSkyObject({ id: 'galaxy', deepSkyClass: 'galaxy' })
    const generic = createDeepSkyObject({ id: 'generic' })
    const cluster = createDeepSkyObject({ id: 'cluster', deepSkyClass: 'cluster' })
    const temporaryNebula = createDeepSkyObject({
      id: 'temporary-nebula',
      deepSkyClass: 'nebula',
      source: 'temporary_scene_seed',
    })

    const { projectedObjects } = collectProjectedNonStarObjects(
      TEST_VIEW,
      [galaxy, generic, cluster, temporaryNebula],
      TEST_SUN_STATE,
      null,
    )
    const radiusById = new Map(projectedObjects.map((entry) => [entry.object.id, entry.markerRadiusPx]))

    expect(projectedObjects).toHaveLength(4)
    expect(radiusById.get('galaxy')).toBeGreaterThan(radiusById.get('generic') ?? 0)
    expect(radiusById.get('generic')).toBeGreaterThan(radiusById.get('cluster') ?? 0)
    expect(radiusById.get('temporary-nebula')).toBeLessThan(radiusById.get('generic') ?? 0)
  })

  it('keeps DSO projection style metadata aligned with the dedicated renderer classes', () => {
    expect(getDeepSkyVisualStyle({ deepSkyClass: 'galaxy' }).projectionMaximumRadiusPx).toBeGreaterThan(
      getDeepSkyVisualStyle({ deepSkyClass: 'cluster' }).projectionMaximumRadiusPx,
    )
    expect(getDeepSkyVisualStyle({ deepSkyClass: 'nebula' }).projectionMagnitudeBoostPx).toBeGreaterThan(
      getDeepSkyVisualStyle({}).projectionMagnitudeBoostPx,
    )
  })
})