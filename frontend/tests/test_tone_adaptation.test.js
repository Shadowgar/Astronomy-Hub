import { describe, expect, it } from 'vitest'

import { evaluateSkyBrightnessExposureState } from '../src/features/sky-engine/engine/sky/runtime/modules/SkyBrightnessExposureModule.ts'

function createVisualCalibration(phaseLabel, overrides = {}) {
  return {
    phaseLabel,
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
    ...overrides,
  }
}

function createProps(sunAltitudeDeg, visualCalibration) {
  return {
    backendStars: [],
    observer: {
      latitudeDeg: 40.44,
      longitudeDeg: -79.99,
      altitudeMeters: 250,
      timestampUtc: '2026-04-10T00:00:00Z',
    },
    objects: [],
    scenePacket: null,
    initialViewState: {
      fovDegrees: 120,
      centerAltDeg: 45,
      centerAzDeg: 180,
    },
    projectionMode: 'stereographic',
    sunState: {
      altitudeDeg: sunAltitudeDeg,
      azimuthDeg: 215,
      isAboveHorizon: sunAltitudeDeg > 0,
      phaseLabel: visualCalibration.phaseLabel,
      rightAscensionHours: 0,
      declinationDeg: 0,
      localSiderealTimeDeg: 0,
      skyDirection: { x: 0, y: 1, z: 0 },
      lightDirection: { x: 0, y: 1, z: 0 },
      visualCalibration,
    },
    selectedObjectId: null,
    guidedObjectIds: [],
    aidVisibility: {
      constellations: true,
      constellationLabels: true,
      compass: true,
      altitudeRings: true,
      trajectories: true,
    },
    onSelectObject: () => {},
    onAtmosphereStatusChange: () => {},
    onViewStateChange: () => {},
  }
}

const SERVICES = {
  projectionService: {
    getCurrentFovDegrees: () => 120,
  },
}

describe('sky brightness exposure adaptation', () => {
  it('reveals stars and the Milky Way more strongly at dark night than twilight', () => {
    const twilightState = evaluateSkyBrightnessExposureState(
      createProps(-6, createVisualCalibration('Low Sun', {
        starVisibility: 0.46,
        starFieldBrightness: 0.4,
        atmosphereExposure: 0.86,
      })),
      SERVICES,
    )
    const nightState = evaluateSkyBrightnessExposureState(
      createProps(-22, createVisualCalibration('Night', {
        starVisibility: 1,
        starFieldBrightness: 0.92,
        atmosphereExposure: 1,
      })),
      SERVICES,
    )

    expect(nightState.adaptationLevel).toBeGreaterThan(twilightState.adaptationLevel)
    expect(nightState.sceneContrast).toBeGreaterThan(twilightState.sceneContrast)
    expect(nightState.starVisibility).toBeGreaterThan(twilightState.starVisibility)
    expect(nightState.starFieldBrightness).toBeGreaterThan(twilightState.starFieldBrightness)
    expect(nightState.milkyWayVisibility).toBeGreaterThan(twilightState.milkyWayVisibility)
    expect(twilightState.atmosphereExposure).toBeLessThanOrEqual(1.08)
  })

  it('reveals darkness gradually but suppresses stars immediately when the scene brightens', () => {
    const dayState = evaluateSkyBrightnessExposureState(
      createProps(8, createVisualCalibration('Daylight', {
        starVisibility: 0.04,
        starFieldBrightness: 0.06,
        atmosphereExposure: 1,
      })),
      SERVICES,
    )
    const instantNightTarget = evaluateSkyBrightnessExposureState(
      createProps(-22, createVisualCalibration('Night', {
        starVisibility: 1,
        starFieldBrightness: 0.92,
        atmosphereExposure: 1,
      })),
      SERVICES,
    )
    const firstDarkFrame = evaluateSkyBrightnessExposureState(
      createProps(-22, createVisualCalibration('Night', {
        starVisibility: 1,
        starFieldBrightness: 0.92,
        atmosphereExposure: 1,
      })),
      SERVICES,
      dayState,
      1 / 60,
    )
    const brightRecovery = evaluateSkyBrightnessExposureState(
      createProps(8, createVisualCalibration('Daylight', {
        starVisibility: 0.04,
        starFieldBrightness: 0.06,
        atmosphereExposure: 1,
      })),
      SERVICES,
      instantNightTarget,
      1 / 60,
    )

    expect(firstDarkFrame.adaptedSceneLuminance).toBeGreaterThan(firstDarkFrame.sceneLuminance)
    expect(firstDarkFrame.limitingMagnitude).toBeLessThan(instantNightTarget.limitingMagnitude)
    expect(brightRecovery.tonemapperLwmax).toBeCloseTo(brightRecovery.targetTonemapperLwmax, 6)
    expect(brightRecovery.limitingMagnitude).toBeLessThan(instantNightTarget.limitingMagnitude)
  })
})
