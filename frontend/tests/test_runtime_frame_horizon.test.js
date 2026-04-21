import { describe, expect, it } from 'vitest'

import { collectProjectedNonStarObjects } from '../src/features/sky-engine/engine/sky/runtime/modules/runtimeFrame.ts'
import { horizontalToDirection } from '../src/features/sky-engine/projectionMath.ts'
import { deriveSunVisualCalibration } from '../src/features/sky-engine/solar.ts'

function makeView(centerAltDeg, centerAzDeg, fovDeg = 70) {
  return {
    centerDirection: horizontalToDirection(centerAltDeg, centerAzDeg),
    fovRadians: (fovDeg * Math.PI) / 180,
    viewportWidth: 1280,
    viewportHeight: 720,
    projectionMode: 'stereographic',
  }
}

function makePlanet(id, altitudeDeg, azimuthDeg) {
  return {
    id,
    name: id,
    type: 'planet',
    source: 'computed_ephemeris',
    magnitude: -1.2,
    altitudeDeg,
    azimuthDeg,
    apparentSizeDeg: 0.04,
    colorHex: '#f0e6c8',
    summary: 'fixture',
    description: 'fixture',
    truthNote: 'fixture',
    trackingMode: 'fixed_equatorial',
    isAboveHorizon: altitudeDeg > 0,
  }
}

function makeSunState() {
  const visualCalibration = deriveSunVisualCalibration(22)
  const skyDirection = horizontalToDirection(22, 140)
  return {
    altitudeDeg: 22,
    azimuthDeg: 140,
    isAboveHorizon: true,
    phaseLabel: visualCalibration.phaseLabel,
    rightAscensionHours: 0,
    declinationDeg: 0,
    localSiderealTimeDeg: 0,
    skyDirection: { x: skyDirection.x, y: skyDirection.y, z: skyDirection.z },
    lightDirection: { x: -skyDirection.x, y: -skyDirection.y, z: -skyDirection.z },
    visualCalibration,
  }
}

function makeBrightnessExposureState() {
  const visualCalibration = deriveSunVisualCalibration(-12)
  return {
    skyBrightness: 0.25,
    adaptationLevel: 0.75,
    sceneContrast: 0.95,
    limitingMagnitude: 8.5,
    starVisibility: 1,
    starFieldBrightness: 1,
    atmosphereExposure: 1,
    milkyWayVisibility: 0.4,
    milkyWayContrast: 0.5,
    backdropAlpha: 0.88,
    nightSkyZenithLuminance: 0.001,
    nightSkyHorizonLuminance: 0.0008,
    sceneLuminanceSkyContributor: 0.05,
    sceneLuminanceStarContributor: 0,
    sceneLuminanceSolarSystemContributor: 0,
    sceneLuminanceStarSampleCount: 0,
    sceneLuminanceSolarSystemSampleCount: 0,
    sceneLuminance: 0.05,
    adaptedSceneLuminance: 0.08,
    targetTonemapperLwmax: 2,
    adaptationSmoothing: 0.3,
    tonemapperP: 2.2,
    tonemapperExposure: 2,
    tonemapperLwmax: 8,
    visualCalibration,
  }
}

describe('runtimeFrame horizon gate (geometric altitude)', () => {
  it('keeps a planet clearly above the geometric horizon in the projected set', () => {
    const view = makeView(42, 200, 65)
    const planet = makePlanet('sky-planet-fixture-high', 48, 205)
    const result = collectProjectedNonStarObjects(
      view,
      [planet],
      makeSunState(),
      makeBrightnessExposureState(),
      8,
      null,
    )
    expect(result.projectedObjects.length).toBe(1)
    expect(result.projectedObjects[0].object.id).toBe('sky-planet-fixture-high')
  })

  it('drops a planet below the geometric horizon even when the view center is slightly below the horizon', () => {
    const view = makeView(-4, 200, 65)
    const planet = makePlanet('sky-planet-fixture-below', -22, 205)
    const result = collectProjectedNonStarObjects(
      view,
      [planet],
      makeSunState(),
      makeBrightnessExposureState(),
      8,
      null,
    )
    expect(result.projectedObjects.length).toBe(0)
  })
})
