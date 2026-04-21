import { describe, expect, it } from 'vitest'

import { evaluateSceneLuminanceReport } from '../src/features/sky-engine/engine/sky/runtime/luminanceReport.ts'
import { horizontalToDirection } from '../src/features/sky-engine/projectionMath.ts'

function createVisualCalibration() {
  return {
    phaseLabel: 'Night',
    directionalLightIntensity: 0,
    ambientLightIntensity: 0,
    directionalLightColorHex: '#ffffff',
    ambientLightColorHex: '#ffffff',
    backgroundColorHex: '#0a1324',
    skyZenithColorHex: '#0f2f6b',
    skyHorizonColorHex: '#6e91c8',
    twilightBandColorHex: '#ffb46e',
    horizonColorHex: '#9eb8e5',
    horizonGlowColorHex: '#ffd49f',
    horizonGlowAlpha: 0.4,
    landscapeFogColorHex: '#40536e',
    groundTintHex: '#141d2d',
    landscapeShadowAlpha: 0.5,
    starVisibility: 1,
    starFieldBrightness: 0.9,
    starLabelVisibility: 1,
    starHaloVisibility: 1,
    starTwinkleAmplitude: 0.08,
    atmosphereExposure: 1,
    atmosphereAerialPerspectiveIntensity: 1,
    atmosphereMultiScatteringIntensity: 1,
    atmosphereMieScatteringScale: 1,
  }
}

function createProps(objects) {
  return {
    backendStars: [],
    observer: {
      latitudeDeg: 40.44,
      longitudeDeg: -79.99,
      altitudeMeters: 250,
      timestampUtc: '2026-04-10T00:00:00Z',
    },
    objects,
    scenePacket: null,
    initialViewState: {
      fovDegrees: 120,
      centerAltDeg: 45,
      centerAzDeg: 180,
    },
    projectionMode: 'stereographic',
    sunState: {
      altitudeDeg: -18,
      azimuthDeg: 215,
      isAboveHorizon: false,
      phaseLabel: 'Night',
      rightAscensionHours: 0,
      declinationDeg: 0,
      localSiderealTimeDeg: 0,
      skyDirection: { x: 0, y: 1, z: 0 },
      lightDirection: { x: 0, y: 1, z: 0 },
      visualCalibration: createVisualCalibration(),
    },
    selectedObjectId: null,
    guidedObjectIds: [],
    aidVisibility: {
      constellations: true,
      constellationLabels: true,
      compass: true,
      altitudeRings: true,
      trajectories: true,
      atmosphere: true,
      landscape: true,
      deepSky: true,
      nightMode: false,
      azimuthRing: false,
    },
    onSelectObject: () => {},
    onAtmosphereStatusChange: () => {},
    onViewStateChange: () => {},
  }
}

const SERVICES = {
  projectionService: {
    getCurrentFovDegrees: () => 120,
    createView: (centerDirection) => ({
      centerDirection,
      fovRadians: (120 * Math.PI) / 180,
      viewportWidth: 1280,
      viewportHeight: 720,
      projectionMode: 'stereographic',
    }),
    unproject: () => horizontalToDirection(38, 155),
  },
  navigationService: {
    getCenterDirection: () => horizontalToDirection(38, 155),
  },
}

describe('scene luminance report', () => {
  it('aggregates explicit buckets and keeps bounded contributor sampling', () => {
    const manyBrightStars = Array.from({ length: 2_000 }, (_, index) => ({
      id: `star-${index}`,
      type: 'star',
      altitudeDeg: 35 + (index % 20),
      azimuthDeg: 120 + (index % 120),
      magnitude: 3.5,
      colorHex: '#ffffff',
    }))
    const brightPlanets = Array.from({ length: 80 }, (_, index) => ({
      id: `planet-${index}`,
      type: 'planet',
      altitudeDeg: 20 + (index % 40),
      azimuthDeg: 90 + (index % 180),
      magnitude: 1.5,
      apparentSizeDeg: 0.08,
      colorHex: '#ffffff',
    }))

    const report = evaluateSceneLuminanceReport(
      createProps([...manyBrightStars, ...brightPlanets]),
      SERVICES,
    )

    expect(report.target).toBe(Math.max(report.sky, report.stars, report.solarSystem))
    expect(report.skyAverageLuminance).toBeGreaterThan(0)
    expect(report.sky + 1e-12).toBeGreaterThanOrEqual(report.skyAverageLuminance)
    expect(report.skySampleCount).toBeGreaterThan(0)
    expect(report.starSampleCount).toBeLessThanOrEqual(640)
    expect(report.solarSystemSampleCount).toBeLessThanOrEqual(32)
  })

  it('uses dark-sky luminance for adaptation when the atmosphere aid is hidden (Stellarium atmosphere off)', () => {
    const props = createProps([])
    props.sunState = {
      ...props.sunState,
      altitudeDeg: 55,
      isAboveHorizon: true,
      phaseLabel: 'Daylight',
      visualCalibration: { ...createVisualCalibration(), phaseLabel: 'Daylight' },
    }
    props.aidVisibility = { ...props.aidVisibility, atmosphere: false }

    const report = evaluateSceneLuminanceReport(props, SERVICES)

    expect(report.skyAverageLuminance).toBeLessThan(1)
    expect(report.sky).toBeLessThan(1)
    expect(report.skyBrightness).toBeLessThan(0.35)
  })

  it('caps daylight sky adaptation luminance while the atmosphere aid stays visible', () => {
    const props = createProps([])
    props.sunState = {
      ...props.sunState,
      altitudeDeg: 72,
      isAboveHorizon: true,
      phaseLabel: 'Daylight',
      visualCalibration: { ...createVisualCalibration(), phaseLabel: 'Daylight' },
    }
    props.aidVisibility = { ...props.aidVisibility, atmosphere: true }

    const report = evaluateSceneLuminanceReport(props, SERVICES)

    expect(report.sky).toBeGreaterThan(0)
    expect(report.sky).toBeLessThan(500)
    expect(report.skyAverageLuminance).toBeLessThanOrEqual(report.sky)
  })

  it('at 8° sun with atmosphere uses the daylight cap and fast-adaptation sky target (tone-test geometry)', () => {
    const props = createProps([])
    props.sunState = {
      ...props.sunState,
      altitudeDeg: 8,
      isAboveHorizon: true,
      phaseLabel: 'Daylight',
      visualCalibration: { ...createVisualCalibration(), phaseLabel: 'Daylight' },
    }
    props.aidVisibility = { ...props.aidVisibility, atmosphere: true }

    const report = evaluateSceneLuminanceReport(props, SERVICES)

    expect(report.targetFastAdaptation).toBe(true)
    expect(report.sky).toBeGreaterThan(100)
    expect(report.sky).toBeLessThan(200)
    expect(report.target).toBe(report.sky)
  })
})
