import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { describe, expect, it } from 'vitest'

import { prepareDirectAtmosphereFrame } from '../src/features/sky-engine/directBackgroundLayer.ts'

function createView() {
  return {
    centerDirection: new Vector3(0, 0.2, 1).normalize(),
    fovRadians: (120 * Math.PI) / 180,
    viewportWidth: 1280,
    viewportHeight: 720,
    projectionMode: 'stereographic',
  }
}

function resolvePhaseLabel(altitudeDeg) {
  if (altitudeDeg > 6) {
    return 'Daylight'
  }

  if (altitudeDeg > -12) {
    return 'Low Sun'
  }

  return 'Night'
}

function createSunState(altitudeDeg) {
  const phaseLabel = resolvePhaseLabel(altitudeDeg)

  return {
    altitudeDeg,
    azimuthDeg: 215,
    isAboveHorizon: altitudeDeg > 0,
    phaseLabel,
    rightAscensionHours: 0,
    declinationDeg: 0,
    localSiderealTimeDeg: 0,
    skyDirection: { x: 0, y: 1, z: 0 },
    lightDirection: { x: 0, y: 1, z: 0 },
    visualCalibration: {
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
    },
  }
}

describe('atmosphere frame fidelity shaping', () => {
  it('strengthens twilight lower-band and horizon glow more than dark night', () => {
    const view = createView()
    const twilightFrame = prepareDirectAtmosphereFrame(
      view,
      createSunState(-6),
      120,
      {
        skyBrightness: 0.32,
        adaptationLevel: 0.58,
        sceneContrast: 0.72,
        limitingMagnitude: 3.4,
        starVisibility: 0.46,
        starFieldBrightness: 0.4,
        atmosphereExposure: 0.86,
        milkyWayVisibility: 0.18,
        milkyWayContrast: 0.2,
        backdropAlpha: 0.86,
        nightSkyZenithLuminance: 0.028,
        nightSkyHorizonLuminance: 0.046,
        visualCalibration: createSunState(-6).visualCalibration,
      },
    )
    const nightFrame = prepareDirectAtmosphereFrame(
      view,
      createSunState(-22),
      120,
      {
        skyBrightness: 0.02,
        adaptationLevel: 0.95,
        sceneContrast: 1.02,
        limitingMagnitude: 6.4,
        starVisibility: 1,
        starFieldBrightness: 0.92,
        atmosphereExposure: 1,
        milkyWayVisibility: 0.84,
        milkyWayContrast: 0.72,
        backdropAlpha: 0.72,
        nightSkyZenithLuminance: 0.012,
        nightSkyHorizonLuminance: 0.026,
        visualCalibration: createSunState(-22).visualCalibration,
      },
    )

    expect(twilightFrame.twilightLowerBandIntensity).toBeGreaterThan(nightFrame.twilightLowerBandIntensity)
    expect(twilightFrame.horizonGlowStrength).toBeGreaterThan(nightFrame.horizonGlowStrength)
    expect(nightFrame.twilightStrength).toBe(0)
    expect(nightFrame.zenithDarkening).toBeGreaterThan(twilightFrame.zenithDarkening)
    expect(nightFrame.nightFloorStrength).toBeGreaterThan(twilightFrame.nightFloorStrength)
  })
})
