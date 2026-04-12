/* eslint-disable react/prop-types */

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
}))

vi.mock('../src/features/scene/queries', () => ({
  useSceneByScopeDataQuery: vi.fn(),
  useSkyStarTileManifestDataQuery: vi.fn(),
}))

vi.mock('../src/features/sky-engine/sceneTime', () => ({
  SKY_ENGINE_LOCAL_TIME_ZONE: 'America/New_York',
  SKY_ENGINE_MAX_SCENE_OFFSET_SECONDS: 43200,
  SKY_ENGINE_PLAYBACK_RATE_OPTIONS: [{ value: 0, label: 'Pause' }],
  SKY_ENGINE_TIME_SCALE_OPTIONS: [{ id: 'minutes', shortLabel: 'min', stepSeconds: 60 }],
  formatSceneLocalTimestamp: vi.fn(() => 'Jan 14, 10:00 PM EST'),
  formatSceneOffset: vi.fn(() => 'Now'),
  formatSceneScaleOffset: vi.fn(() => '+0m'),
  getPlaybackRateLabel: vi.fn(() => 'Pause'),
  useSkyEngineSceneTime: vi.fn(() => ({
    sceneTimestampIso: '2025-01-15T03:00:00Z',
    sceneOffsetSeconds: 0,
    formattedSceneLocalTimestamp: 'Jan 14, 10:00 PM EST',
    formattedSceneUtcTimestamp: '03:00 UTC',
    formattedSceneOffset: 'Now',
    formattedScaleOffset: '+0m',
    sliderMin: -10,
    sliderMax: 10,
    sliderStep: 60,
    timeScaleId: 'minutes',
    selectedTimeScale: { id: 'minutes', shortLabel: 'min', stepSeconds: 60 },
    playbackRate: 0,
    playbackRateLabel: 'Pause',
    isPlaying: false,
    setTimeScaleId: vi.fn(),
    setPlaybackRate: vi.fn(),
    setSceneOffsetSeconds: vi.fn(),
    nudgeSceneOffset: vi.fn(),
    togglePlayback: vi.fn(),
    resetSceneTime: vi.fn(),
  })),
}))

vi.mock('../src/features/sky-engine/SkyEngineScene', () => ({
  default: ({ observer, initialViewState, backendStars, backendSatellites = [] }) => React.createElement(
    'div',
    {
      'data-testid': 'sky-engine-scene',
      'data-observer-label': observer.label,
      'data-backend-star-count': String(backendStars.length),
      'data-visible-star-count': String(backendStars.length),
      'data-visible-object-count': String(backendStars.length + backendSatellites.length),
      'data-first-backend-star-id': backendStars[0]?.id ?? 'none',
      'data-fov': String(initialViewState.fovDegrees),
      'data-alt': String(initialViewState.centerAltDeg),
      'data-az': String(initialViewState.centerAzDeg),
    },
    'Sky scene mounted',
  ),
}))

vi.mock('../src/features/sky-engine/SkyEngineDetailShell', () => ({
  default: () => React.createElement('div', null, 'Detail shell'),
}))

vi.mock('../src/features/sky-engine/useSkyEngineSelection', () => ({
  useSkyEngineSelection: vi.fn(() => ({
    selectedObject: null,
    selectedObjectId: null,
    selectionStatus: 'idle',
    hiddenSelectionName: null,
    selectObject: vi.fn(),
    clearSelection: vi.fn(),
  })),
}))

vi.mock('../src/features/sky-engine/astronomy', () => ({
  computeBackendStarSceneObjects: vi.fn((observer, timestampIso, stars) => stars.map((star, index) => ({
    id: star.id,
    name: star.name,
    type: 'star',
    altitudeDeg: 20 + index,
    azimuthDeg: 90 + index,
    magnitude: star.magnitude,
    colorHex: '#ffffff',
    summary: 'Backend star',
    description: 'Backend star',
    truthNote: 'backend',
    source: 'backend_star_catalog',
    trackingMode: 'fixed_equatorial',
    rightAscensionHours: star.right_ascension,
    declinationDeg: star.declination,
    colorIndexBV: star.color_index,
    timestampIso,
    isAboveHorizon: true,
  }))),
  computeMoonSceneObject: vi.fn(() => ({
    id: 'moon',
    name: 'Moon',
    type: 'moon',
    altitudeDeg: 15,
    azimuthDeg: 180,
    magnitude: -12,
    colorHex: '#ffffff',
    summary: 'Moon',
    description: 'Moon',
    truthNote: 'ephemeris',
    source: 'computed_ephemeris',
    trackingMode: 'lunar_ephemeris',
    timestampIso: '2025-01-15T03:00:00Z',
    phaseLabel: 'Waxing',
    isAboveHorizon: true,
  })),
  computePlanetSceneObjects: vi.fn(() => []),
  computeSatelliteSceneObjects: vi.fn(() => []),
  rankGuidanceTargets: vi.fn(() => []),
}))

vi.mock('../src/features/sky-engine/solar', () => ({
  computeSunState: vi.fn(() => ({
    phaseLabel: 'Night',
    isAboveHorizon: false,
    altitudeDeg: -10,
    azimuthDeg: 250,
    rightAscensionHours: 0,
    declinationDeg: 0,
    localSiderealTimeDeg: 0,
    skyDirection: { x: 0, y: 0, z: 1 },
    lightDirection: { x: 0, y: 0, z: 1 },
    visualCalibration: {
      phaseLabel: 'Night',
      directionalLightIntensity: 0,
      ambientLightIntensity: 0,
      directionalLightColorHex: '#000000',
      ambientLightColorHex: '#000000',
      backgroundColorHex: '#000000',
      skyZenithColorHex: '#000000',
      skyHorizonColorHex: '#000000',
      twilightBandColorHex: '#000000',
      horizonColorHex: '#000000',
      horizonGlowColorHex: '#000000',
      horizonGlowAlpha: 0,
      landscapeFogColorHex: '#000000',
      groundTintHex: '#000000',
      landscapeShadowAlpha: 0,
      starVisibility: 1,
      starFieldBrightness: 1,
      starLabelVisibility: 1,
      starHaloVisibility: 1,
      starTwinkleAmplitude: 0,
      atmosphereExposure: 0,
      atmosphereAerialPerspectiveIntensity: 0,
      atmosphereMultiScatteringIntensity: 0,
      atmosphereMieScatteringScale: 0,
    },
  })),
}))

vi.mock('../src/features/sky-engine/starRenderer', () => ({
  resolveStarColorHex: vi.fn(() => '#ffffff'),
}))

vi.mock('../src/features/sky-engine/engine/sky', () => ({
  assembleSkyScenePacket: vi.fn(() => ({
    stars: [],
    labels: [],
    diagnostics: {
      dataMode: 'mock',
      sourceLabel: 'Mock tile repository',
      visibleTileIds: [],
      activeTiles: 0,
      activeTiers: ['T0'],
      tileLevels: [1],
      maxTileDepthReached: 1,
      tilesPerLevel: { '1': 0 },
      sourceError: null,
    },
  })),
  buildSkyEngineQuery: vi.fn(() => ({
    observer: {
      timestampUtc: '2025-01-15T03:00:00Z',
      latitudeDeg: 40,
      longitudeDeg: -75,
      elevationM: 152.4,
      fovDeg: 120,
      centerAltDeg: 28,
      centerAzDeg: 96,
      projection: 'stereographic',
    },
    limitingMagnitude: 5.5,
    activeTiers: ['T0'],
    visibleTileIds: ['root'],
  })),
  fileBackedSkyTileRepository: { loadTiles: vi.fn(async () => ({ tiles: [], mode: 'hipparcos', sourceLabel: 'Hipparcos', sourceError: null })) },
  formatSkyDiagnosticsSummary: vi.fn(() => '0 tiles'),
  mockSkyTileRepository: { loadTiles: vi.fn(async () => ({ tiles: [], mode: 'mock', sourceLabel: 'Mock tile repository', sourceError: null })) },
  resolveSkyTileRepositoryMode: vi.fn(() => 'mock'),
  unitVectorToHorizontalCoordinates: vi.fn(() => ({ altitudeDeg: 0, azimuthDeg: 0, isAboveHorizon: true })),
}))

import SkyEnginePage from '../src/pages/SkyEnginePage'
import { useSceneByScopeDataQuery, useSkyStarTileManifestDataQuery } from '../src/features/scene/queries'

describe('SkyEnginePage scene ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
  })

  it('hard-fails into loading or error states instead of using local fallback ownership', () => {
    vi.mocked(useSceneByScopeDataQuery).mockReturnValue({
      isPending: false,
      isError: true,
      data: null,
    })
    vi.mocked(useSkyStarTileManifestDataQuery).mockReturnValue({
      isPending: false,
      isError: false,
      data: null,
    })

    const html = renderToStaticMarkup(React.createElement(SkyEnginePage))

    expect(html).toContain('Sky scene unavailable')
    expect(html).toContain('local observer and time are intentionally not used as fallback')
    expect(html).not.toContain('Sky scene mounted')
    expect(html).not.toContain('ORAS Observatory')
  })

  it('renders from backend-owned scene payload when the query succeeds', () => {
    vi.mocked(useSceneByScopeDataQuery).mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        scope: 'sky',
        engine: 'sky_engine',
        filter: 'visible_now',
        timestamp: '2025-01-15T03:00:00Z',
        observer: {
          label: 'Custom Location',
          latitude: 40,
          longitude: -75,
          elevation_ft: 500,
          elevation_m: 152.4,
        },
        scene_state: {
          projection: 'stereographic',
          center_alt_deg: 28,
          center_az_deg: 96,
          fov_deg: 120,
          stars_ready: true,
        },
        objects: [
          {
            id: 'star-sirius',
            type: 'star',
            name: 'Sirius',
            engine: 'sky_engine',
            right_ascension: 6.7525,
            declination: -16.7161,
            magnitude: -1.46,
            color_index: 0,
          },
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
        ],
      },
    })
    vi.mocked(useSkyStarTileManifestDataQuery).mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        scope: 'sky',
        engine: 'sky_engine',
        manifest_version: 'tier2',
        generated_at: '2025-01-15T03:00:00Z',
        tiles: [
          {
            tier: 1,
            tile_id: 'tier1-bright-stars',
            lookup_key: 'sky:tier1:tier1-bright-stars',
            source: 'bright_star_catalog',
            object_count: 4,
            magnitude_min: -1.46,
            magnitude_max: 11.4,
          },
          {
            tier: 2,
            tile_id: 'tier2-mid-stars',
            lookup_key: 'sky:tier2:mid-stars',
            source: 'hipparcos_subset',
            object_count: 0,
            magnitude_min: 1.63,
            magnitude_max: 8.5,
          },
        ],
        degraded: false,
        missing_sources: [],
      },
    })

    const html = renderToStaticMarkup(React.createElement(SkyEnginePage))

    expect(useSceneByScopeDataQuery).toHaveBeenCalledWith({ scope: 'sky', engine: 'sky_engine' })
    expect(useSkyStarTileManifestDataQuery).toHaveBeenCalledWith({ at: '2025-01-15T03:00:00Z' })
    expect(html).toContain('Sky scene mounted')
    expect(html).toContain('Astronomy Hub')
    expect(html).toContain('Hub shell persists while the active engine owns this viewport')
    expect(html).toContain('Custom Location')
    expect(html).toContain('120°')
    expect(html).toContain('Jan 14, 10:00 PM EST')
    expect(html).toContain('data-backend-star-count="4"')
    expect(html).toContain('data-visible-star-count="4"')
    expect(html).toContain('data-first-backend-star-id="star-sirius"')
  })

  it('increases visible star count when the view zooms in', () => {
    vi.mocked(useSceneByScopeDataQuery).mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        scope: 'sky',
        engine: 'sky_engine',
        filter: 'visible_now',
        timestamp: '2025-01-15T03:00:00Z',
        observer: {
          label: 'Custom Location',
          latitude: 40,
          longitude: -75,
          elevation_ft: 500,
          elevation_m: 152.4,
        },
        scene_state: {
          projection: 'stereographic',
          center_alt_deg: 28,
          center_az_deg: 96,
          fov_deg: 10,
          stars_ready: true,
        },
        objects: [
          {
            id: 'star-sirius',
            type: 'star',
            name: 'Sirius',
            engine: 'sky_engine',
            right_ascension: 6.7525,
            declination: -16.7161,
            magnitude: -1.46,
            color_index: 0,
          },
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
        ],
      },
    })
    vi.mocked(useSkyStarTileManifestDataQuery).mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        scope: 'sky',
        engine: 'sky_engine',
        manifest_version: 'tier2',
        generated_at: '2025-01-15T03:00:00Z',
        tiles: [
          {
            tier: 1,
            tile_id: 'tier1-bright-stars',
            lookup_key: 'sky:tier1:tier1-bright-stars',
            source: 'bright_star_catalog',
            object_count: 4,
            magnitude_min: -1.46,
            magnitude_max: 11.4,
          },
          {
            tier: 2,
            tile_id: 'tier2-mid-stars',
            lookup_key: 'sky:tier2:mid-stars',
            source: 'hipparcos_subset',
            object_count: 0,
            magnitude_min: 1.63,
            magnitude_max: 8.5,
          },
        ],
        degraded: false,
        missing_sources: [],
      },
    })

    const html = renderToStaticMarkup(React.createElement(SkyEnginePage))

    expect(html).toContain('data-visible-star-count="4"')
    expect(html).toContain('data-fov="10"')
  })
})
