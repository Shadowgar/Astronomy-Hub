import { describe, expect, it, vi } from 'vitest'

const { projectDirectionToViewportMock, getSkyEngineFovDegreesMock } = vi.hoisted(() => ({
  projectDirectionToViewportMock: vi.fn(),
  getSkyEngineFovDegreesMock: vi.fn(() => 60),
}))

vi.mock('../src/features/sky-engine/atmosphericExtinction', () => ({
  buildAtmosphericExtinctionContext: vi.fn(() => ({ token: 'extinction' })),
  computeObservedMagnitude: vi.fn((magnitude) => magnitude),
}))

vi.mock('../src/features/sky-engine/observerNavigation', () => ({
  getSkyEngineFovDegrees: getSkyEngineFovDegreesMock,
}))

vi.mock('../src/features/sky-engine/projectionMath', () => ({
  directionToHorizontal: vi.fn(() => ({ altitudeDeg: 25 })),
  getProjectionScale: vi.fn(() => 1),
  horizontalToDirection: vi.fn(() => ({
    x: 0,
    y: 0,
    z: 1,
    add(other) {
      const makeVec = (x, y, z) => ({
        x,
        y,
        z,
        add(next) {
          return makeVec(this.x + next.x, this.y + next.y, this.z + next.z)
        },
        scale(factor) {
          return makeVec(this.x * factor, this.y * factor, this.z * factor)
        },
        normalizeToNew() {
          const length = Math.hypot(this.x, this.y, this.z) || 1
          return makeVec(this.x / length, this.y / length, this.z / length)
        },
      })

      return makeVec(this.x + other.x, this.y + other.y, this.z + other.z)
    },
    scale(factor) {
      return {
        x: this.x * factor,
        y: this.y * factor,
        z: this.z * factor,
      }
    },
    normalizeToNew() {
      return this
    },
  })),
  isProjectedPointVisible: vi.fn(() => true),
  projectDirectionToViewport: projectDirectionToViewportMock,
}))

vi.mock('../src/features/sky-engine/starRenderer', () => ({
  computeStellariumPointVisual: vi.fn(() => ({ visible: true, radiusPx: 1.2, luminance: 0.7 })),
  getStarRenderProfile: vi.fn(() => ({ coreRadiusPx: 1, haloRadiusPx: 2, diameter: 0.4 })),
  getStarRenderProfileForMagnitude: vi.fn(() => ({
    psfDiameterPx: 2.4,
    coreRadiusPx: 1.2,
    haloRadiusPx: 2.2,
    diameter: 0.4,
    alpha: 0.8,
  })),
}))

vi.mock('../src/features/sky-engine/starVisibility', () => ({
  computeVisibilityAlpha: vi.fn((renderedMagnitude, limitingMagnitude) => (renderedMagnitude <= limitingMagnitude ? 1 : 0)),
  computeVisibilitySizeScale: vi.fn(() => 1),
}))

import { collectProjectedNonStarObjects, collectProjectedStars } from '../src/features/sky-engine/engine/sky/runtime/modules/runtimeFrame'

function createView() {
  return {
    fovRadians: 1.0,
    centerDirection: { x: 0, y: 0, z: 1 },
    viewportWidth: 1280,
    viewportHeight: 720,
  }
}

describe('collectProjectedStars early exit', () => {
  it('does not apply extra FOV gain heuristics inside star traversal', () => {
    projectDirectionToViewportMock.mockReset()
    getSkyEngineFovDegreesMock.mockReset()
    projectDirectionToViewportMock.mockReturnValue({
      screenX: 200,
      screenY: 150,
      depth: 0.2,
      angularDistanceRad: 0.1,
    })
    getSkyEngineFovDegreesMock.mockReturnValue(120)

    const stars = Array.from({ length: 10 }, (_, index) => ({
      id: `star-${index + 1}`,
      type: 'star',
      source: 'catalog',
      magnitude: 2.6 + index * 0.6,
      altitudeDeg: 42 + index * 0.2,
      azimuthDeg: 112 + index * 0.2,
      colorHex: '#ffffff',
      colorIndexBV: 0.2,
    }))

    const wide = collectProjectedStars(
      createView(),
      { latitudeDeg: 0, longitudeDeg: 0, elevationM: 0 },
      stars,
      null,
      { visualCalibration: { starFieldBrightness: 1 } },
      { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
      null,
      '2026-04-11T05:00:00Z',
    )

    getSkyEngineFovDegreesMock.mockReturnValue(6)

    const close = collectProjectedStars(
      createView(),
      { latitudeDeg: 0, longitudeDeg: 0, elevationM: 0 },
      stars,
      null,
      { visualCalibration: { starFieldBrightness: 1 } },
      { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
      null,
      '2026-04-11T05:00:00Z',
    )

    expect(wide.projectedStars.length).toBe(close.projectedStars.length)
    expect(close.limitingMagnitude).toBe(wide.limitingMagnitude)
  })

  it('breaks before transform when raw magnitude exceeds limiting magnitude', () => {
    projectDirectionToViewportMock.mockReset()
    getSkyEngineFovDegreesMock.mockReset()
    projectDirectionToViewportMock.mockReturnValue({
      screenX: 200,
      screenY: 150,
      depth: 0.2,
      angularDistanceRad: 0.1,
    })
    getSkyEngineFovDegreesMock.mockReturnValue(60)

    const stars = [
      { id: 'star-bright', type: 'star', source: 'catalog', magnitude: 1.4, altitudeDeg: 40, azimuthDeg: 110, colorHex: '#ffffff', colorIndexBV: 0.2 },
      { id: 'star-dim-1', type: 'star', source: 'catalog', magnitude: 7.1, altitudeDeg: 42, azimuthDeg: 112, colorHex: '#ffffff', colorIndexBV: 0.2 },
      { id: 'star-dim-2', type: 'star', source: 'catalog', magnitude: 8.2, altitudeDeg: 44, azimuthDeg: 114, colorHex: '#ffffff', colorIndexBV: 0.2 },
    ]

    const result = collectProjectedStars(
      createView(),
      { latitudeDeg: 0, longitudeDeg: 0, elevationM: 0 },
      stars,
      null,
      { visualCalibration: { starFieldBrightness: 1 } },
      { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
      null,
      '2026-04-11T05:00:00Z',
    )

    expect(result.projectedStars).toHaveLength(1)
    expect(result.projectedStars[0].object.id).toBe('star-bright')
    expect(projectDirectionToViewportMock).toHaveBeenCalledTimes(1)
    expect(result.timing.sortingMs).toBe(0)
  })

  it('keeps selected stars visible even when they are beyond limiting magnitude', () => {
    projectDirectionToViewportMock.mockReset()
    getSkyEngineFovDegreesMock.mockReset()
    projectDirectionToViewportMock.mockReturnValue({
      screenX: 300,
      screenY: 210,
      depth: 0.2,
      angularDistanceRad: 0.1,
    })
    getSkyEngineFovDegreesMock.mockReturnValue(60)

    const stars = [
      { id: 'star-bright', type: 'star', source: 'catalog', magnitude: 1.4, altitudeDeg: 40, azimuthDeg: 110, colorHex: '#ffffff', colorIndexBV: 0.2 },
      { id: 'star-limit', type: 'star', source: 'catalog', magnitude: 6.2, altitudeDeg: 42, azimuthDeg: 112, colorHex: '#ffffff', colorIndexBV: 0.2 },
      { id: 'star-selected-dim', type: 'star', source: 'catalog', magnitude: 9.8, altitudeDeg: 44, azimuthDeg: 114, colorHex: '#ffffff', colorIndexBV: 0.2 },
    ]

    const result = collectProjectedStars(
      createView(),
      { latitudeDeg: 0, longitudeDeg: 0, elevationM: 0 },
      stars,
      null,
      { visualCalibration: { starFieldBrightness: 1 } },
      { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
      'star-selected-dim',
      '2026-04-11T05:00:00Z',
    )

    const ids = result.projectedStars.map((entry) => entry.object.id)
    expect(ids).toContain('star-selected-dim')
  })
})

describe('collectProjectedNonStarObjects LOD sizing', () => {
  it('expands planet radius from point-like to disk-like as FOV narrows', () => {
    projectDirectionToViewportMock.mockReset()
    getSkyEngineFovDegreesMock.mockReset()
    projectDirectionToViewportMock.mockReturnValue({
      screenX: 320,
      screenY: 240,
      depth: 0.3,
      angularDistanceRad: 0.12,
    })

    const planet = {
      id: 'planet-jupiter',
      name: 'Jupiter',
      type: 'planet',
      source: 'computed_ephemeris',
      magnitude: -2.1,
      altitudeDeg: 44,
      azimuthDeg: 195,
      apparentSizeDeg: 0.012,
      colorHex: '#f6d28b',
      summary: 'test',
      description: 'test',
      truthNote: 'test',
      trackingMode: 'fixed_equatorial',
      isAboveHorizon: true,
    }

    getSkyEngineFovDegreesMock.mockReturnValue(120)
    const wide = collectProjectedNonStarObjects(
      createView(),
      [planet],
      { visualCalibration: { starFieldBrightness: 1 } },
      null,
    )

    getSkyEngineFovDegreesMock.mockReturnValue(4)
    const close = collectProjectedNonStarObjects(
      createView(),
      [planet],
      { visualCalibration: { starFieldBrightness: 1 } },
      null,
    )

    expect(close.projectedObjects[0].markerRadiusPx).toBeGreaterThan(wide.projectedObjects[0].markerRadiusPx)
  })

  it('keeps DSO marker dimensions visibly responsive to zoom', () => {
    projectDirectionToViewportMock.mockReset()
    getSkyEngineFovDegreesMock.mockReset()
    projectDirectionToViewportMock.mockReturnValue({
      screenX: 320,
      screenY: 240,
      depth: 0.3,
      angularDistanceRad: 0.12,
    })

    const dso = {
      id: 'dso-m31',
      name: 'Andromeda',
      type: 'deep_sky',
      source: 'computed_real_sky',
      magnitude: 3.4,
      altitudeDeg: 44,
      azimuthDeg: 195,
      apparentSizeDeg: 3.1,
      majorAxis: 3.1,
      minorAxis: 1.0,
      orientationDeg: 35,
      deepSkyClass: 'galaxy',
      colorHex: '#8fb5ff',
      summary: 'test',
      description: 'test',
      truthNote: 'test',
      trackingMode: 'fixed_equatorial',
      isAboveHorizon: true,
    }

    getSkyEngineFovDegreesMock.mockReturnValue(120)
    const wide = collectProjectedNonStarObjects(
      createView(),
      [dso],
      { visualCalibration: { starFieldBrightness: 1 } },
      null,
    )

    getSkyEngineFovDegreesMock.mockReturnValue(4)
    const close = collectProjectedNonStarObjects(
      createView(),
      [dso],
      { visualCalibration: { starFieldBrightness: 1 } },
      null,
    )

    expect(close.projectedObjects[0].shapeWidthPx).toBeGreaterThan(wide.projectedObjects[0].shapeWidthPx)
    expect(close.projectedObjects[0].shapeHeightPx).toBeGreaterThan(wide.projectedObjects[0].shapeHeightPx)
  })
})
