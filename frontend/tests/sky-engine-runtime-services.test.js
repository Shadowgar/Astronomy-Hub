import { Vector3 } from '@babylonjs/core/Maths/math.vector'

import {
  applyWheelInput,
  beginPointerInteraction,
  completePointerInteraction,
  createSkySceneRuntimeServices,
  releasePointerInteraction,
  syncSkySceneRuntimeServices,
  updatePointerInteraction,
} from '../src/features/sky-engine/SkyEngineRuntimeBridge'

function createObserver(label) {
  return {
    label,
    latitude: 40.7128,
    longitude: -74.006,
    elevationFt: 33,
  }
}

function createSceneObject(id, overrides = {}) {
  return {
    id,
    name: id,
    type: 'star',
    altitudeDeg: 35,
    azimuthDeg: 120,
    magnitude: 1.5,
    colorHex: '#ffffff',
    summary: 'Test object',
    description: 'Test object',
    truthNote: 'real',
    source: 'computed_real_sky',
    trackingMode: 'fixed_equatorial',
    isAboveHorizon: true,
    ...overrides,
  }
}

function createProps(overrides = {}) {
  return {
    backendStars: [],
    observer: createObserver('Initial observer'),
    objects: [],
    scenePacket: null,
    initialViewState: {
      fovDegrees: 60,
      centerAltDeg: 25,
      centerAzDeg: 135,
    },
    projectionMode: 'stereographic',
    sunState: {
      altitudeDeg: -20,
      azimuthDeg: 180,
      isAboveHorizon: false,
      phaseLabel: 'Night',
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
        atmosphereExposure: 1,
        atmosphereAerialPerspectiveIntensity: 0,
        atmosphereMultiScatteringIntensity: 0,
        atmosphereMieScatteringScale: 0,
      },
    },
    selectedObjectId: null,
    guidedObjectIds: [],
    aidVisibility: {
      constellations: true,
      azimuthRing: true,
      altitudeRings: true,
    },
    onSelectObject: () => {},
    onAtmosphereStatusChange: () => {},
    onViewStateChange: () => {},
    ...overrides,
  }
}

function createRuntime(projectedPickEntries = []) {
  const capturedPointers = new Set()

  return {
    canvas: {
      getBoundingClientRect() {
        return { left: 10, top: 20 }
      },
      setPointerCapture(pointerId) {
        capturedPointers.add(pointerId)
      },
      hasPointerCapture(pointerId) {
        return capturedPointers.has(pointerId)
      },
      releasePointerCapture(pointerId) {
        capturedPointers.delete(pointerId)
      },
    },
    projectedPickEntries,
  }
}

test('runtime services own observer sync and temporary host input forwarding', () => {
  const initialProps = createProps()
  const services = createSkySceneRuntimeServices(initialProps)
  const runtime = createRuntime([
    {
      object: createSceneObject('vega'),
      screenX: 40,
      screenY: 50,
      radiusPx: 12,
      depth: 0.2,
    },
  ])

  expect(services.observerService.getObserver().label).toBe('Initial observer')
  expect(services.navigationService.getCenterDirection()).toBeInstanceOf(Vector3)
  expect(services.projectionService.getProjectionMode()).toBe('stereographic')

  const syncedProps = createProps({
    observer: createObserver('Synced observer'),
    projectionMode: 'orthographic',
  })
  syncSkySceneRuntimeServices(services, syncedProps)

  expect(services.observerService.getObserver().label).toBe('Synced observer')
  expect(services.projectionService.getProjectionMode()).toBe('orthographic')

  const startingFov = services.projectionService.getCurrentFov()
  applyWheelInput(runtime, services, {
    clientX: 50,
    clientY: 70,
    deltaY: 120,
  })
  expect(services.projectionService.getCurrentFov()).not.toBe(startingFov)

  beginPointerInteraction(runtime, services, {
    pointerId: 1,
    clientX: 50,
    clientY: 70,
  })
  updatePointerInteraction(runtime, services, {
    pointerId: 1,
    clientX: 50,
    clientY: 70,
  })
  const selectedObjectId = completePointerInteraction(runtime, services, {
    pointerId: 1,
    clientX: 50,
    clientY: 70,
  })

  expect(selectedObjectId).toBe('vega')

  releasePointerInteraction(runtime, services, 2)
  expect(runtime.canvas.hasPointerCapture(1)).toBe(false)
})
