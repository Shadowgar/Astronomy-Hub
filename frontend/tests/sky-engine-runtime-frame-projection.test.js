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
  computeStellariumPointVisual: vi.fn((_magnitude, _brightnessExposureState, _screenSizePx, fovDegrees = 60) => ({
    visible: true,
    radiusPx: fovDegrees <= 0 ? 1.2 : 1.2 * (60 / fovDegrees),
    luminance: 0.7,
  })),
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

/** Minimal packet so `visitStarsRenderTiles` can traverse (requires `starTiles` + `diagnostics.visibleTileIds`). */
function buildStarScenePacket(starSceneObjects) {
  const stars = starSceneObjects.map((star, index) => ({
    id: star.id,
    x: 0,
    y: 0,
    z: 1,
    mag: star.magnitude,
    colorIndex: star.colorIndexBV,
    label: star.id,
    tier: `T${Math.min(index, 2)}`,
  }))
  const mags = stars.map((s) => s.mag)
  const magMin = Math.min(...mags)
  const magMax = Math.max(...mags)
  return {
    stars,
    starTiles: [
      {
        tileId: 'test-root',
        level: 0,
        parentTileId: null,
        childTileIds: [],
        magMin,
        magMax: Math.max(magMax, magMin + 0.01),
        starIds: stars.map((s) => s.id),
      },
    ],
    labels: [],
    diagnostics: {
      dataMode: 'test',
      sourceLabel: 'test',
      limitingMagnitude: 8,
      activeTiles: 1,
      visibleStars: stars.length,
      starsListVisitCount: 0,
      activeTiers: ['bright'],
      tileLevels: [0],
      tilesPerLevel: { '0': 1 },
      maxTileDepthReached: 0,
      visibleTileIds: ['test-root'],
    },
  }
}

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
      {
        view: createView(),
        objects: stars,
        scenePacket: buildStarScenePacket(stars),
        sunState: { visualCalibration: { starFieldBrightness: 1 } },
        brightnessExposureState: { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
      },
    )

    getSkyEngineFovDegreesMock.mockReturnValue(6)

    const close = collectProjectedStars(
      {
        view: createView(),
        objects: stars,
        scenePacket: buildStarScenePacket(stars),
        sunState: { visualCalibration: { starFieldBrightness: 1 } },
        brightnessExposureState: { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
      },
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
      {
        view: createView(),
        objects: stars,
        scenePacket: buildStarScenePacket(stars),
        sunState: { visualCalibration: { starFieldBrightness: 1 } },
        brightnessExposureState: { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
      },
    )

    expect(result.projectedStars).toHaveLength(1)
    expect(result.projectedStars[0].object.id).toBe('star-bright')
    expect(projectDirectionToViewportMock).toHaveBeenCalledTimes(1)
    expect(result.timing.sortingMs).toBe(0)
  })

  it('preserves tile-star traversal order and early break semantics', () => {
    projectDirectionToViewportMock.mockReset()
    getSkyEngineFovDegreesMock.mockReset()
    projectDirectionToViewportMock.mockReturnValue({
      screenX: 240,
      screenY: 180,
      depth: 0.2,
      angularDistanceRad: 0.1,
      planeX: 0,
      planeY: 0,
    })
    getSkyEngineFovDegreesMock.mockReturnValue(60)

    const stars = [
      { id: 'tile-star-c', type: 'star', source: 'catalog', magnitude: 3.3, altitudeDeg: 40, azimuthDeg: 110, colorHex: '#ffffff', colorIndexBV: 0.2 },
      { id: 'tile-star-a', type: 'star', source: 'catalog', magnitude: 1.1, altitudeDeg: 42, azimuthDeg: 112, colorHex: '#ffffff', colorIndexBV: 0.2 },
      { id: 'tile-star-b', type: 'star', source: 'catalog', magnitude: 2.2, altitudeDeg: 44, azimuthDeg: 114, colorHex: '#ffffff', colorIndexBV: 0.2 },
      { id: 'tile-star-dim', type: 'star', source: 'catalog', magnitude: 8.4, altitudeDeg: 46, azimuthDeg: 116, colorHex: '#ffffff', colorIndexBV: 0.2 },
    ]

    const result = collectProjectedStars({
      view: createView(),
      objects: stars,
      scenePacket: {
        stars: stars.map((star) => ({
          id: star.id,
          x: 0,
          y: 0,
          z: 1,
          mag: star.magnitude,
          colorIndex: star.colorIndexBV,
          label: star.id,
          tier: 'T0',
        })),
        starTiles: [{
          tileId: 'order-root',
          level: 0,
          parentTileId: null,
          childTileIds: [],
          magMin: 1.1,
          magMax: 8.4,
          starIds: ['tile-star-c', 'tile-star-a', 'tile-star-b', 'tile-star-dim'],
        }],
        labels: [],
        diagnostics: {
          dataMode: 'test',
          sourceLabel: 'test-order',
          limitingMagnitude: 6.0,
          activeTiles: 1,
          visibleStars: 4,
          starsListVisitCount: 0,
          activeTiers: ['T0'],
          tileLevels: [0],
          tilesPerLevel: { '0': 1 },
          maxTileDepthReached: 0,
          visibleTileIds: ['order-root'],
        },
      },
      sunState: { visualCalibration: { starFieldBrightness: 1 } },
      brightnessExposureState: { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
    })

    expect(result.projectedStars.map((entry) => entry.object.id)).toEqual([
      'tile-star-a',
      'tile-star-b',
      'tile-star-c',
    ])
    expect(projectDirectionToViewportMock).toHaveBeenCalledTimes(3)
  })

  it('recovers root traversal from starTiles when diagnostics visible roots are absent', () => {
    projectDirectionToViewportMock.mockReset()
    getSkyEngineFovDegreesMock.mockReset()
    projectDirectionToViewportMock.mockReturnValue({
      screenX: 300,
      screenY: 200,
      depth: 0.2,
      angularDistanceRad: 0.1,
      planeX: 0,
      planeY: 0,
    })
    getSkyEngineFovDegreesMock.mockReturnValue(60)

    const stars = [
      { id: 'fallback-root-star', type: 'star', source: 'catalog', magnitude: 2.4, altitudeDeg: 42, azimuthDeg: 112, colorHex: '#ffffff', colorIndexBV: 0.2 },
    ]

    const result = collectProjectedStars({
      view: createView(),
      objects: stars,
      scenePacket: {
        stars: stars.map((star) => ({
          id: star.id,
          x: 0,
          y: 0,
          z: 1,
          mag: star.magnitude,
          colorIndex: star.colorIndexBV,
          label: star.id,
          tier: 'T0',
        })),
        starTiles: [{
          tileId: 'fallback-root',
          level: 0,
          parentTileId: null,
          childTileIds: [],
          magMin: 2.4,
          magMax: 2.5,
          starIds: ['fallback-root-star'],
        }],
        labels: [],
        diagnostics: {
          dataMode: 'test',
          sourceLabel: 'test-fallback-roots',
          limitingMagnitude: 6.0,
          activeTiles: 1,
          visibleStars: 1,
          starsListVisitCount: 0,
          activeTiers: ['T0'],
          tileLevels: [0],
          tilesPerLevel: { '0': 1 },
          maxTileDepthReached: 0,
          visibleTileIds: [],
        },
      },
      sunState: { visualCalibration: { starFieldBrightness: 1 } },
      brightnessExposureState: { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
    })

    expect(result.projectedStars).toHaveLength(1)
    expect(result.projectedStars[0].object.id).toBe('fallback-root-star')
  })

  it('does not admit selected stars once they fail the Stellarium point gate', () => {
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
      {
        view: createView(),
        objects: stars,
        scenePacket: buildStarScenePacket(stars),
        sunState: { visualCalibration: { starFieldBrightness: 1 } },
        brightnessExposureState: { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
      },
    )

    const ids = result.projectedStars.map((entry) => entry.object.id)
    expect(ids).not.toContain('star-selected-dim')
  })

  it('projects non-engine star objects during startup when scene packet is unavailable', () => {
    projectDirectionToViewportMock.mockReset()
    getSkyEngineFovDegreesMock.mockReset()
    projectDirectionToViewportMock.mockReturnValue({
      screenX: 260,
      screenY: 180,
      depth: 0.2,
      angularDistanceRad: 0.1,
      planeX: 0,
      planeY: 0,
    })
    getSkyEngineFovDegreesMock.mockReturnValue(60)

    const stars = [
      {
        id: 'startup-star-1',
        type: 'star',
        source: 'computed_real_sky',
        magnitude: 1.1,
        altitudeDeg: 40,
        azimuthDeg: 110,
        colorHex: '#ffffff',
        colorIndexBV: 0.2,
      },
      {
        id: 'startup-star-2',
        type: 'star',
        source: 'backend_star_catalog',
        magnitude: 2.2,
        altitudeDeg: 42,
        azimuthDeg: 112,
        colorHex: '#ffffff',
        colorIndexBV: 0.3,
      },
    ]

    const result = collectProjectedStars({
      view: createView(),
      objects: stars,
      scenePacket: null,
      sunState: { visualCalibration: { starFieldBrightness: 1 } },
      brightnessExposureState: { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
    })

    expect(result.projectedStars).toHaveLength(2)
    expect(result.projectedStars[0].object.id).toBe('startup-star-1')
    expect(result.projectedStars[1].object.id).toBe('startup-star-2')
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
      { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
      6.0,
      null,
    )

    getSkyEngineFovDegreesMock.mockReturnValue(4)
    const close = collectProjectedNonStarObjects(
      createView(),
      [planet],
      { visualCalibration: { starFieldBrightness: 1 } },
      { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
      6.0,
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
      { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
      6.0,
      null,
    )

    getSkyEngineFovDegreesMock.mockReturnValue(4)
    const close = collectProjectedNonStarObjects(
      createView(),
      [dso],
      { visualCalibration: { starFieldBrightness: 1 } },
      { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
      6.0,
      null,
    )

    expect(close.projectedObjects[0].shapeWidthPx).toBeGreaterThan(wide.projectedObjects[0].shapeWidthPx)
    expect(close.projectedObjects[0].shapeHeightPx).toBeGreaterThan(wide.projectedObjects[0].shapeHeightPx)
  })

  it('still projects faint planets: limiting magnitude is not applied in this collector (module-specific visibility)', () => {
    projectDirectionToViewportMock.mockReset()
    getSkyEngineFovDegreesMock.mockReset()
    projectDirectionToViewportMock.mockReturnValue({
      screenX: 320,
      screenY: 240,
      depth: 0.3,
      angularDistanceRad: 0.12,
    })
    getSkyEngineFovDegreesMock.mockReturnValue(60)

    const dimPlanet = {
      id: 'planet-neptune',
      name: 'Neptune',
      type: 'planet',
      source: 'computed_ephemeris',
      magnitude: 8.1,
      altitudeDeg: 44,
      azimuthDeg: 195,
      apparentSizeDeg: 0.002,
      colorHex: '#88a4d8',
      summary: 'test',
      description: 'test',
      truthNote: 'test',
      trackingMode: 'fixed_equatorial',
      isAboveHorizon: true,
    }

    const projected = collectProjectedNonStarObjects(
      createView(),
      [dimPlanet],
      { visualCalibration: { starFieldBrightness: 1 } },
      { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
      6.0,
      null,
    )

    expect(projected.projectedObjects).toHaveLength(1)
    expect(projected.projectedObjects[0].object.id).toBe('planet-neptune')
  })

  it('still projects faint DSOs: limiting magnitude is not applied in this collector (module-specific visibility)', () => {
    projectDirectionToViewportMock.mockReset()
    getSkyEngineFovDegreesMock.mockReset()
    projectDirectionToViewportMock.mockReturnValue({
      screenX: 320,
      screenY: 240,
      depth: 0.3,
      angularDistanceRad: 0.12,
    })
    getSkyEngineFovDegreesMock.mockReturnValue(60)

    const dimDso = {
      id: 'dso-dim',
      name: 'Dim DSO',
      type: 'deep_sky',
      source: 'computed_real_sky',
      magnitude: 8.3,
      altitudeDeg: 44,
      azimuthDeg: 195,
      apparentSizeDeg: 0.3,
      majorAxis: 0.3,
      minorAxis: 0.2,
      orientationDeg: 15,
      deepSkyClass: 'nebula',
      colorHex: '#8fb5ff',
      summary: 'test',
      description: 'test',
      truthNote: 'test',
      trackingMode: 'fixed_equatorial',
      isAboveHorizon: true,
    }

    const projected = collectProjectedNonStarObjects(
      createView(),
      [dimDso],
      { visualCalibration: { starFieldBrightness: 1 } },
      { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
      6.0,
      null,
    )

    expect(projected.projectedObjects).toHaveLength(1)
    expect(projected.projectedObjects[0].object.id).toBe('dso-dim')
  })

  it('does not apply limiting-magnitude gate to satellites in this collector (module-specific visibility)', () => {
    projectDirectionToViewportMock.mockReset()
    getSkyEngineFovDegreesMock.mockReset()
    projectDirectionToViewportMock.mockReturnValue({
      screenX: 320,
      screenY: 240,
      depth: 0.3,
      angularDistanceRad: 0.12,
    })
    getSkyEngineFovDegreesMock.mockReturnValue(60)

    const modeledDimSatellite = {
      id: 'sat-dim-modeled',
      name: 'DimSat',
      type: 'satellite',
      source: 'backend_satellite_scene',
      magnitude: 8.5,
      altitudeDeg: 44,
      azimuthDeg: 195,
      colorHex: '#8ee7ff',
      summary: 'test',
      description: 'test',
      truthNote: 'test',
      trackingMode: 'static',
      isAboveHorizon: true,
    }
    const placeholderMagnitudeSatellite = {
      ...modeledDimSatellite,
      id: 'sat-placeholder',
      magnitude: 99,
    }

    const projected = collectProjectedNonStarObjects(
      createView(),
      [modeledDimSatellite, placeholderMagnitudeSatellite],
      { visualCalibration: { starFieldBrightness: 1 } },
      { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
      6.0,
      null,
    )

    expect(projected.projectedObjects.map((entry) => entry.object.id)).toEqual(['sat-dim-modeled', 'sat-placeholder'])
  })

  it('keeps moon visible and applies Stellarium moon wide-field scale-up', () => {
    projectDirectionToViewportMock.mockReset()
    getSkyEngineFovDegreesMock.mockReset()
    projectDirectionToViewportMock.mockReturnValue({
      screenX: 320,
      screenY: 240,
      depth: 0.3,
      angularDistanceRad: 0.12,
    })

    const moon = {
      id: 'sky-real-moon',
      name: 'Moon',
      type: 'moon',
      source: 'computed_ephemeris',
      magnitude: -12.4,
      altitudeDeg: 44,
      azimuthDeg: 195,
      apparentSizeDeg: 0.52,
      colorHex: '#f8f1d7',
      summary: 'test',
      description: 'test',
      truthNote: 'test',
      trackingMode: 'lunar_ephemeris',
      isAboveHorizon: true,
      illuminationFraction: 0.65,
      brightLimbAngleDeg: 32,
      waxing: true,
    }

    getSkyEngineFovDegreesMock.mockReturnValue(120)
    const wide = collectProjectedNonStarObjects(
      createView(),
      [moon],
      { visualCalibration: { starFieldBrightness: 1 } },
      { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
      6.0,
      null,
    )

    getSkyEngineFovDegreesMock.mockReturnValue(8)
    const close = collectProjectedNonStarObjects(
      createView(),
      [moon],
      { visualCalibration: { starFieldBrightness: 1 } },
      { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
      6.0,
      null,
    )

    expect(wide.projectedObjects).toHaveLength(1)
    expect(close.projectedObjects).toHaveLength(1)
    expect(wide.projectedObjects[0].markerRadiusPx).toBeGreaterThan(close.projectedObjects[0].markerRadiusPx)
  })
})
