import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/features/sky-engine/engine/sky/runtime/modules/runtimeFrame', () => {
  const starEntry = {
    object: { id: 'star-1', type: 'star', magnitude: 1.2 },
    screenX: 100,
    screenY: 100,
    depth: 0.2,
    angularDistanceRad: 0.3,
    markerRadiusPx: 3,
    pickRadiusPx: 12,
    renderAlpha: 0.8,
    renderedMagnitude: 1.3,
    visibilityAlpha: 0.8,
    starProfile: { colorHex: '#ffffff' },
  }
  const moonEntry = {
    object: { id: 'moon-1', type: 'moon', magnitude: -11.8 },
    screenX: 180,
    screenY: 140,
    depth: 0.4,
    angularDistanceRad: 0.1,
    markerRadiusPx: 18,
    pickRadiusPx: 46,
    renderAlpha: 1,
    renderedMagnitude: -11.8,
  }

  return {
    collectProjectedStars: vi.fn(() => ({
      projectedStars: [starEntry],
      limitingMagnitude: 6.4,
      timing: {
        transformMs: 0,
        magnitudeFilterMs: 0,
        visibilityFilterMs: 0,
        sortingMs: 0,
        allocationMs: 0,
        totalMs: 0,
      },
    })),
    collectProjectedNonStarObjects: vi.fn(() => ({
      projectedObjects: [moonEntry],
      timing: {
        transformMs: 0,
        filteringMs: 0,
        allocationMs: 0,
        totalMs: 0,
      },
    })),
    mergeProjectedSceneObjects: vi.fn(() => [starEntry, moonEntry]),
    ensureSceneSurfaces: vi.fn(() => ({ width: 800, height: 400 })),
    resolveViewTier: vi.fn(() => ({ tier: 'medium', labelCap: 8 })),
  }
})

import { createObjectRuntimeModule } from '../src/features/sky-engine/engine/sky/runtime/modules/ObjectRuntimeModule'
import { createStarsModule } from '../src/features/sky-engine/engine/sky/runtime/modules/StarsModule'

function createBaseRuntime() {
  return {
    directObjectLayer: {
      sync: vi.fn(),
    },
    directStarLayer: {
      sync: vi.fn(),
    },
    projectedStarsFrame: null,
    projectedSceneFrame: null,
    projectedNonStarObjects: [],
    projectedPickEntries: [],
    projectedPickSourceRef: null,
    runtimePerfTelemetry: {
      latest: {
        frameIndex: 0,
        shouldRenderFrame: false,
        updateMs: 0,
        renderModulesMs: 0,
        sceneRenderMs: 0,
        frameTotalMs: 0,
        moduleMs: {},
        stepMs: {},
        starCount: 0,
        objectCount: 0,
      },
      ema: {
        frameIndex: 0,
        shouldRenderFrame: false,
        updateMs: 0,
        renderModulesMs: 0,
        sceneRenderMs: 0,
        frameTotalMs: 0,
        moduleMs: {},
        stepMs: {},
        starCount: 0,
        objectCount: 0,
      },
    },
    brightnessExposureState: {
      limitingMagnitude: 6.4,
      visualCalibration: {
        starVisibility: 1,
        starFieldBrightness: 1,
      },
    },
    engine: {
      getRenderWidth: () => 800,
      getRenderHeight: () => 400,
    },
    camera: {
      orthoLeft: null,
      orthoRight: null,
      orthoTop: null,
      orthoBottom: null,
    },
    backgroundCanvas: { width: 0, height: 0 },
  }
}

function createBaseServices() {
  return {
    projectionService: {
      syncViewport: vi.fn(),
      createView: vi.fn(() => ({ fovRadians: 1, viewportWidth: 800, viewportHeight: 400, centerDirection: { x: 0, y: 0, z: 1 } })),
      getCurrentFovDegrees: vi.fn(() => 60),
    },
    navigationService: {
      getCenterDirection: vi.fn(() => ({ x: 0, y: 0, z: 1 })),
    },
    observerService: {
      getObserver: vi.fn(() => ({ latitudeDeg: 40, longitudeDeg: -74 })),
    },
    clockService: {
      getSceneTimestampIso: vi.fn(() => '2026-04-10T00:00:00Z'),
      getAnimationTimeSeconds: vi.fn(() => 1.2),
    },
  }
}

function createBaseProps() {
  return {
    objects: [
      { id: 'star-1', type: 'star', magnitude: 1.2, altitudeDeg: 40, azimuthDeg: 120 },
      { id: 'moon-1', type: 'moon', magnitude: -11.8, altitudeDeg: 20, azimuthDeg: 180 },
    ],
    scenePacket: null,
    sunState: { visualCalibration: { starVisibility: 1, starFieldBrightness: 1 } },
    selectedObjectId: null,
  }
}

describe('Sky star runtime ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('StarsModule owns and syncs the dedicated star layer', () => {
    const module = createStarsModule()
    const runtime = createBaseRuntime()
    const services = createBaseServices()
    const props = createBaseProps()
    const getProps = () => props
    const getPropsVersion = () => 1

    module.update({ runtime, services, getProps, getPropsVersion })
    module.render({ runtime, services, getProps })

    expect(runtime.projectedStarsFrame).not.toBeNull()
    expect(runtime.directStarLayer.sync).toHaveBeenCalledTimes(1)
    const [projectedStars] = runtime.directStarLayer.sync.mock.calls[0]
    expect(projectedStars).toHaveLength(1)
    expect(projectedStars[0].object.type).toBe('star')
  })

  it('ObjectRuntimeModule keeps stars out of generic direct object sync', () => {
    const module = createObjectRuntimeModule()
    const runtime = createBaseRuntime()
    const services = createBaseServices()
    const props = createBaseProps()
    const getProps = () => props
    const getPropsVersion = () => 1
    runtime.projectedStarsFrame = {
      width: 800,
      height: 400,
      currentFovDegrees: 60,
      lod: { tier: 'medium', labelCap: 8 },
      view: { fovRadians: 1, viewportWidth: 800, viewportHeight: 400 },
      projectedStars: [{
        object: { id: 'star-1', type: 'star', magnitude: 1.2 },
        screenX: 100,
        screenY: 100,
        depth: 0.2,
        angularDistanceRad: 0.3,
        markerRadiusPx: 3,
        pickRadiusPx: 12,
        renderAlpha: 0.8,
      }],
      limitingMagnitude: 6.4,
      sceneTimestampIso: '2026-04-10T00:00:00Z',
    }

    module.update({ runtime, services, getProps, getPropsVersion })
    module.render({ runtime, services, getProps })

    expect(runtime.directObjectLayer.sync).toHaveBeenCalledTimes(1)
    const [genericObjects] = runtime.directObjectLayer.sync.mock.calls[0]
    expect(genericObjects).toHaveLength(1)
    expect(genericObjects[0].object.type).toBe('moon')
    expect(runtime.projectedPickEntries.some((entry) => entry.object.type === 'star')).toBe(true)
  })
})
