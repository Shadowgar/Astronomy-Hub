import { describe, expect, it } from 'vitest'

import { getDeepSkyMarkerDimensionsPx, getDeepSkySymbolStyle, getDeepSkyVisualStyle, resolveDeepSkyAxes } from '../src/features/sky-engine/dsoVisuals'
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
    orientationDeg: 0,
    majorAxis: 1.2,
    minorAxis: 1.2,
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
    const galaxy = getDeepSkyMarkerDimensionsPx({ deepSkyClass: 'galaxy', majorAxis: 3.1, minorAxis: 1, orientationDeg: 35 }, 10)
    const nebula = getDeepSkyMarkerDimensionsPx({ deepSkyClass: 'nebula', majorAxis: 1.1, minorAxis: 0.72, orientationDeg: 52 }, 10)
    const cluster = getDeepSkyMarkerDimensionsPx({ deepSkyClass: 'cluster', majorAxis: 0.28, minorAxis: 0.28 }, 10)
    const generic = getDeepSkyMarkerDimensionsPx({}, 10)

    expect(galaxy.visualClass).toBe('galaxy')
    expect(nebula.visualClass).toBe('nebula')
    expect(cluster.visualClass).toBe('cluster')
    expect(generic.visualClass).toBe('generic')
    expect(galaxy.widthPx).toBeGreaterThan(galaxy.heightPx)
    expect(galaxy.rotationDeg).toBe(35)
    expect(nebula.rotationDeg).toBe(52)
    expect(nebula.widthPx).toBeGreaterThan(nebula.heightPx)
    expect(cluster.widthPx).toBe(cluster.heightPx)
    expect(generic.rotationDeg).toBe(0)
  })

  it('applies class-aware projected DSO sizing and orientation in the runtime frame', () => {
    const galaxy = createDeepSkyObject({ id: 'galaxy', deepSkyClass: 'galaxy', majorAxis: 3.1, minorAxis: 1, orientationDeg: 35, apparentSizeDeg: 3.1 })
    const generic = createDeepSkyObject({ id: 'generic' })
    const cluster = createDeepSkyObject({ id: 'cluster', deepSkyClass: 'cluster', majorAxis: 0.28, minorAxis: 0.28, apparentSizeDeg: 0.28 })
    const temporaryNebula = createDeepSkyObject({
      id: 'temporary-nebula',
      deepSkyClass: 'nebula',
      majorAxis: 1.1,
      minorAxis: 0.72,
      orientationDeg: 52,
      apparentSizeDeg: 1.1,
      source: 'temporary_scene_seed',
    })

    const { projectedObjects } = collectProjectedNonStarObjects(
      TEST_VIEW,
      [galaxy, generic, cluster, temporaryNebula],
      TEST_SUN_STATE,
      {
        limitingMagnitude: 8,
        visualCalibration: { starFieldBrightness: 1 },
      },
      8,
      null,
    )
    const entryById = new Map(projectedObjects.map((entry) => [entry.object.id, entry]))

    expect(projectedObjects).toHaveLength(4)
    expect(entryById.get('galaxy')?.shapeWidthPx).toBeGreaterThan(entryById.get('galaxy')?.shapeHeightPx ?? 0)
    expect(Math.abs(entryById.get('galaxy')?.shapeRotationRad ?? 0)).toBeGreaterThan(0.1)
    expect(entryById.get('generic')?.markerRadiusPx).toBeGreaterThan(entryById.get('cluster')?.markerRadiusPx ?? 0)
    expect(entryById.get('cluster')?.shapeWidthPx).toBeCloseTo(entryById.get('cluster')?.shapeHeightPx ?? 0, 5)
    expect(entryById.get('cluster')?.shapeRotationRad ?? 0).toBe(0)
    expect(entryById.get('temporary-nebula')?.markerRadiusPx).toBeLessThan(entryById.get('galaxy')?.markerRadiusPx ?? 0)
    expect(Math.abs(entryById.get('temporary-nebula')?.shapeRotationRad ?? 0)).toBeGreaterThan(0.1)
  })

  it('keeps DSO projection style metadata aligned with axis defaults and class budgets', () => {
    expect(getDeepSkyVisualStyle({ deepSkyClass: 'galaxy' }).maximumMajorDiameterPx).toBeGreaterThan(
      getDeepSkyVisualStyle({ deepSkyClass: 'cluster' }).maximumMajorDiameterPx,
    )
    expect(resolveDeepSkyAxes({ deepSkyClass: 'galaxy', majorAxis: 3.1, minorAxis: 1 }).axisRatio).toBeGreaterThan(
      resolveDeepSkyAxes({ deepSkyClass: 'cluster', majorAxis: 0.28, minorAxis: 0.28 }).axisRatio,
    )
    expect(getDeepSkyVisualStyle({ deepSkyClass: 'nebula' }).projectionMagnitudeBoostPx).toBeGreaterThan(
      getDeepSkyVisualStyle({}).projectionMagnitudeBoostPx,
    )
  })

  it('assigns class-specific DSO symbol styles with distinct contour and accent behavior', () => {
    const galaxy = getDeepSkySymbolStyle({ deepSkyClass: 'galaxy' })
    const nebula = getDeepSkySymbolStyle({ deepSkyClass: 'nebula' })
    const cluster = getDeepSkySymbolStyle({ deepSkyClass: 'cluster' })
    const generic = getDeepSkySymbolStyle({})

    expect(galaxy.contourKind).toBe('ellipse')
    expect(galaxy.accentKind).toBe('nucleus')
    expect(nebula.contourKind).toBe('bracketed-nebula')
    expect(nebula.accentKind).toBe('wisps')
    expect(cluster.contourKind).toBe('cluster-ring')
    expect(cluster.accentKind).toBe('stars')
    expect(cluster.dashPattern.length).toBeGreaterThan(0)
    expect(generic.contourKind).toBe('diamond')
    expect(generic.accentKind).toBe('core-ring')
  })
})
