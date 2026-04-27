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
  const planetEntry = {
    object: { id: 'planet-1', type: 'planet', magnitude: -2.4, colorHex: '#f6d28b' },
    screenX: 220,
    screenY: 120,
    depth: 0.3,
    angularDistanceRad: 0.18,
    markerRadiusPx: 9,
    pickRadiusPx: 23,
    renderAlpha: 0.94,
    renderedMagnitude: -2.4,
  }
  const dsoEntry = {
    object: { id: 'dso-1', type: 'deep_sky', magnitude: 3.4, colorHex: '#8fb5ff' },
    screenX: 260,
    screenY: 150,
    depth: 0.45,
    angularDistanceRad: 0.22,
    markerRadiusPx: 10,
    pickRadiusPx: 20,
    renderAlpha: 0.72,
    renderedMagnitude: 3.4,
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
      projectedObjects: [moonEntry, planetEntry, dsoEntry],
      timing: {
        transformMs: 0,
        filteringMs: 0,
        allocationMs: 0,
        totalMs: 0,
      },
    })),
    mergeProjectedSceneObjects: vi.fn(() => [starEntry, moonEntry, planetEntry, dsoEntry]),
    ensureSceneSurfaces: vi.fn(() => ({ width: 800, height: 400 })),
    resolveViewTier: vi.fn(() => ({ tier: 'medium', labelCap: 8 })),
    serializeSceneState: vi.fn((state) => JSON.stringify(state)),
    clearSceneState: vi.fn(),
  }
})

import { createDsoRuntimeModule } from '../src/features/sky-engine/engine/sky/runtime/modules/DsoRuntimeModule'
import { createObjectRuntimeModule } from '../src/features/sky-engine/engine/sky/runtime/modules/ObjectRuntimeModule'
import { createPlanetRuntimeModule } from '../src/features/sky-engine/engine/sky/runtime/modules/PlanetRuntimeModule'
import { createSceneReportingModule } from '../src/features/sky-engine/engine/sky/runtime/modules/SceneReportingModule'
import { createStarsModule } from '../src/features/sky-engine/engine/sky/runtime/modules/StarsModule'
import { createSkyPainterPortState } from '../src/features/sky-engine/engine/sky/runtime/renderer/painterPort'
import { collectProjectedStars } from '../src/features/sky-engine/engine/sky/runtime/modules/runtimeFrame'

function createBaseRuntime() {
  return {
    directPlanetLayer: {
      sync: vi.fn(),
    },
    directDsoLayer: {
      sync: vi.fn(),
    },
    directObjectLayer: {
      sync: vi.fn(),
    },
    directStarLayer: {
      sync: vi.fn(),
    },
    painterOwnedStarBackendLayer: {
      syncFromMappedBatch: vi.fn((input) => ({
        created: true,
        synced: true,
        syncedStarCount: input.starCount,
      })),
      dispose: vi.fn(),
    },
    projectedStarsFrame: null,
    projectedSceneFrame: null,
    projectedNonStarObjects: [],
    projectedPlanetObjects: [],
    projectedDsoObjects: [],
    projectedGenericObjects: [],
    projectedPickEntries: [],
    projectedPickSourceRef: null,
    starsProjectionCache: null,
    starsProjectionReuseStreak: 0,
    painterBackendExecutionEnabled: false,
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
      { id: 'planet-1', type: 'planet', magnitude: -2.4, altitudeDeg: 32, azimuthDeg: 210, colorHex: '#f6d28b' },
      { id: 'dso-1', type: 'deep_sky', magnitude: 3.4, altitudeDeg: 41, azimuthDeg: 232, colorHex: '#8fb5ff' },
    ],
    scenePacket: null,
    sunState: { visualCalibration: { starVisibility: 1, starFieldBrightness: 1 } },
    selectedObjectId: null,
    guidedObjectIds: [],
    aidVisibility: {
      constellations: true,
      azimuthRing: true,
      altitudeRings: true,
      atmosphere: true,
      landscape: true,
      deepSky: true,
      nightMode: false,
    },
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

  it('keeps direct star layer active when backend execution flag is ON', () => {
    const module = createStarsModule()
    const runtime = {
      ...createBaseRuntime(),
      painterBackendExecutionEnabled: true,
    }
    const services = createBaseServices()
    const props = createBaseProps()
    const getProps = () => props
    const getPropsVersion = () => 1

    module.update({ runtime, services, getProps, getPropsVersion })
    module.render({ runtime, services, getProps })

    expect(runtime.projectedStarsFrame).not.toBeNull()
    expect(runtime.directStarLayer.sync).toHaveBeenCalledTimes(1)
  })

  it('caps star limiting magnitude with Stellarium painter limits when present', () => {
    const module = createStarsModule()
    const runtime = createBaseRuntime()
    runtime.corePainterLimits = {
      starsLimitMag: 5.1,
      hintsLimitMag: 4.8,
      hardLimitMag: 99,
    }
    const services = createBaseServices()
    const props = createBaseProps()
    const getProps = () => props
    const getPropsVersion = () => 1

    module.update({ runtime, services, getProps, getPropsVersion })

    expect(runtime.projectedStarsFrame?.limitingMagnitude).toBe(5.1)
  })

  it('reprojects stars when scene packet signature changes', () => {
    const module = createStarsModule()
    const runtime = createBaseRuntime()
    const services = createBaseServices()
    const props = createBaseProps()
    props.scenePacket = {
      stars: [
        { id: 'star-1', x: 0, y: 0, z: 1, mag: 1.2, tier: 'T0' },
        { id: 'star-2', x: 0.1, y: 0, z: 0.99, mag: 2.4, tier: 'T1' },
      ],
      labels: [],
      diagnostics: {
        dataMode: 'mock',
        sourceLabel: 'mock',
        limitingMagnitude: 6.4,
        activeTiles: 1,
        visibleStars: 2,
        starsListVisitCount: 0,
        activeTiers: ['T0', 'T1'],
        tileLevels: [0, 1],
        tilesPerLevel: { 0: 1, 1: 1 },
        maxTileDepthReached: 1,
        visibleTileIds: [],
      },
    }
    const getProps = () => props
    const getPropsVersion = () => 1

    module.update({ runtime, services, getProps, getPropsVersion })
    module.update({ runtime, services, getProps, getPropsVersion })
    expect(collectProjectedStars).toHaveBeenCalledTimes(1)

    props.scenePacket = {
      ...props.scenePacket,
      stars: [
        { ...props.scenePacket.stars[0], mag: 1.7 },
        props.scenePacket.stars[1],
      ],
    }

    module.update({ runtime, services, getProps, getPropsVersion })
    expect(collectProjectedStars).toHaveBeenCalledTimes(2)
  })

  it('mirrors stars draw intent into painter queue while keeping direct star path active', () => {
    const module = createStarsModule()
    const runtime = {
      ...createBaseRuntime(),
      renderGlExecute: vi.fn(),
    }
    const services = createBaseServices()
    const props = {
      ...createBaseProps(),
      projectionMode: 'stereographic',
      scenePacket: {
        stars: [
          { id: 'star-1', x: 0, y: 0, z: 1, mag: 1.2, tier: 'T0' },
        ],
        starTiles: [
          {
            tileId: 'tile-0',
            level: 0,
            parentTileId: null,
            childTileIds: [],
            magMin: 0,
            magMax: 6,
            starIds: ['star-1'],
          },
        ],
        labels: [],
        diagnostics: {
          dataMode: 'multi-survey',
          sourceLabel: 'survey',
          limitingMagnitude: 6.4,
          activeTiles: 1,
          visibleStars: 1,
          starsListVisitCount: 4,
          activeTiers: ['T0'],
          tileLevels: [0],
          tilesPerLevel: { 0: 1 },
          maxTileDepthReached: 0,
          visibleTileIds: ['tile-0'],
        },
      },
    }
    const getProps = () => props
    const getPropsVersion = () => 1
    const painter = createSkyPainterPortState()

    painter.reset_for_frame({
      frameIndex: 42,
      windowWidth: 800,
      windowHeight: 400,
      pixelScale: 1,
      framebufferWidth: 800,
      framebufferHeight: 400,
      starsLimitMag: 6.4,
      hintsLimitMag: 6.4,
      hardLimitMag: 8,
    })
    painter.paint_prepare(800, 400, 1)

    module.update({ runtime, services, getProps, getPropsVersion })
    module.render({
      runtime,
      services,
      getProps,
      frameState: {
        frameIndex: 42,
        deltaSeconds: 0.016,
        render: {
          painter,
          windowWidth: 800,
          windowHeight: 400,
          pixelScale: 1,
          framebufferWidth: 800,
          framebufferHeight: 400,
          starsLimitMag: 6.4,
          hintsLimitMag: 6.4,
          hardLimitMag: 8,
        },
      },
    })

    const preFinishCommand = painter.drawQueue.find((entry) => entry.fn === 'paint_stars_draw_intent')
    expect(preFinishCommand).toBeDefined()
    expect(preFinishCommand?.frameIndex).toBe(42)
    expect(preFinishCommand?.payload.starCount).toBe(1)
    expect(preFinishCommand?.payload.source.scenePacketTileCount).toBe(1)
    expect(preFinishCommand?.payload.source.diagnosticsActiveTiles).toBe(1)
    expect(preFinishCommand?.payload.view.fovDegrees).toBe(60)
    expect(preFinishCommand?.payload.fromDirectStarPath).toBe(true)
    expect(painter.isFrameFinalized).toBe(false)
    expect(painter.finalizedCommands).toHaveLength(0)

    painter.paint_finish()
    expect(painter.finalizedCommands.some((entry) => entry.fn === 'paint_stars_draw_intent')).toBe(true)
    expect(painter.finalizedPointItems.length).toBeGreaterThan(0)
    expect(painter.finalizedPointItems[0].type).toBe('ITEM_POINTS')
    expect(painter.finalizedPointItems[0].pointCount).toBe(1)
    expect(painter.finalizedBatches).toHaveLength(1)
    expect(painter.finalizedBatches[0]).toMatchObject({
      kind: 'stars',
      sourceCommandKind: 'paint_stars_draw_intent',
      frameIndex: 42,
      starCount: 1,
      sourcePath: 'direct-star-mirror',
      executionStatus: 'not_executed',
    })

    expect(runtime.directStarLayer.sync).toHaveBeenCalledTimes(1)
    expect(runtime.renderGlExecute).not.toHaveBeenCalled()
  })

  it('publishes painter star telemetry with finalized command counts after paint_finish', () => {
    const reportingModule = createSceneReportingModule()
    const painter = createSkyPainterPortState()
    const canvas = {
      dataset: {},
      closest: vi.fn(() => null),
      removeAttribute: vi.fn(),
    }

    painter.reset_for_frame({
      frameIndex: 17,
      windowWidth: 800,
      windowHeight: 400,
      pixelScale: 1,
      framebufferWidth: 800,
      framebufferHeight: 400,
      starsLimitMag: 6.4,
      hintsLimitMag: 6.4,
      hardLimitMag: 8,
    })
    painter.paint_prepare(800, 400, 1)
    painter.paint_stars_draw_intent({
      fromDirectStarPath: true,
      starCount: 1,
      source: {
        dataMode: 'multi-survey',
        sourceLabel: 'survey',
        scenePacketStarCount: 1,
        scenePacketTileCount: 1,
        diagnosticsActiveTiles: 1,
        diagnosticsVisibleTileIdsCount: 1,
        diagnosticsStarsListVisitCount: 4,
      },
      magnitude: {
        limitingMagnitude: 6.4,
        minRenderedMagnitude: 1.3,
        maxRenderedMagnitude: 1.3,
        minRenderAlpha: 0.8,
        maxRenderAlpha: 0.8,
      },
      view: {
        projectionMode: 'stereographic',
        fovDegrees: 60,
        viewportWidth: 800,
        viewportHeight: 400,
        centerDirection: { x: 0, y: 0, z: 1 },
        sceneTimestampIso: '2026-04-10T00:00:00Z',
      },
    })

    const runtime = {
      ...createBaseRuntime(),
      canvas,
      scene: {
        meshes: [],
        materials: [],
        textures: [],
      },
      projectedStarsFrame: {
        width: 800,
        height: 400,
        currentFovDegrees: 60,
        lod: { tier: 'medium', labelCap: 8 },
        view: { centerDirection: { x: 0, y: 0, z: 1 } },
        projectedStars: [{ object: { id: 'star-1', type: 'star', magnitude: 1.2 } }],
        limitingMagnitude: 6.4,
        sceneTimestampIso: '2026-04-10T00:00:00Z',
      },
      projectedSceneFrame: {
        currentFovDegrees: 60,
        lod: { tier: 'medium', labelCap: 8 },
      },
      runtimePerfTelemetry: {
        latest: {
          frameIndex: 17,
          shouldRenderFrame: true,
          updateMs: 0,
          renderModulesMs: 0,
          sceneRenderMs: 0,
          frameTotalMs: 1,
          moduleMs: {},
          moduleUpdateMs: {},
          moduleRenderMs: {},
          stepMs: {
            collectProjectedStarsMs: 0.1,
            collectProjectedNonStarObjectsMs: 0.1,
            starLayerSyncCount: 1,
            starLayerSyncCallCount: 1,
          },
          starCount: 1,
          objectCount: 1,
        },
        ema: {
          frameIndex: 17,
          shouldRenderFrame: true,
          updateMs: 0,
          renderModulesMs: 0,
          sceneRenderMs: 0,
          frameTotalMs: 1,
          moduleMs: {},
          moduleUpdateMs: {},
          moduleRenderMs: {},
          stepMs: {
            collectProjectedStarsMs: 0.1,
            collectProjectedNonStarObjectsMs: 0.1,
            starLayerSyncCount: 1,
            starLayerSyncCallCount: 1,
          },
          starCount: 1,
          objectCount: 1,
        },
      },
      projectedPickEntries: [],
      brightnessExposureState: null,
      trajectoryObjectId: null,
      visibleLabelIds: [],
    }
    const services = createBaseServices()
    const props = {
      ...createBaseProps(),
      projectionMode: 'stereographic',
      backendStars: [],
    }
    const getProps = () => props

    reportingModule.render({ runtime, services, getProps })
    painter.paint_finish()
    reportingModule.postRender({
      runtime,
      services,
      getProps,
      frameState: {
        frameIndex: 17,
        deltaSeconds: 0.016,
        render: {
          painter,
          windowWidth: 800,
          windowHeight: 400,
          pixelScale: 1,
          framebufferWidth: 800,
          framebufferHeight: 400,
          starsLimitMag: 6.4,
          hintsLimitMag: 6.4,
          hardLimitMag: 8,
        },
      },
    })

    const runtimePerf = JSON.parse(canvas.dataset.skyEngineRuntimePerf)
    expect(runtimePerf.painterStarTelemetry).toBeDefined()
    expect(runtimePerf.painterStarTelemetry.frameIndex).toBe(17)
    expect(runtimePerf.painterStarTelemetry.hasPaintStarsDrawIntent).toBe(true)
    expect(runtimePerf.painterStarTelemetry.painterStarCommandCount).toBe(1)
    expect(runtimePerf.painterStarTelemetry.painterStarPayloadStarCount).toBe(1)
    expect(runtimePerf.painterStarTelemetry.finalizedCommandCountAfterPaintFinish).toBeGreaterThan(0)
    expect(runtimePerf.painterStarTelemetry.finalizedPainterStarCommandCountAfterPaintFinish).toBe(1)
    expect(runtimePerf.painterStarTelemetry.finalizedPainterBatchCount).toBe(1)
    expect(runtimePerf.painterStarTelemetry.finalizedPainterStarsBatchCount).toBe(1)
    expect(runtimePerf.painterStarTelemetry.starsBatchStarCount).toBe(1)
    expect(runtimePerf.painterStarTelemetry.starsBatchExecutionStatus).toBe('not_executed')
    expect(runtimePerf.painterStarTelemetry.backendMappedBatchCount).toBe(1)
    expect(runtimePerf.painterStarTelemetry.backendMappedStarsBatchCount).toBe(1)
    expect(runtimePerf.painterStarTelemetry.backendMappedStarsCount).toBe(1)
    expect(runtimePerf.painterStarTelemetry.backendUnsupportedBatchCount).toBe(0)
    expect(runtimePerf.painterStarTelemetry.backendExecutionEnabled).toBe(false)
    expect(runtimePerf.painterStarTelemetry.backendExecutionStatus).toBe('execution_disabled')
    expect(runtimePerf.painterStarTelemetry.backendExecutionStatus).not.toMatch(/stage/i)
    expect(runtimePerf.painterStarTelemetry.backendSideBySideExecutionCount).toBe(0)
    expect(runtimePerf.painterStarTelemetry.backendExecutionDisabledCount).toBe(1)
    expect(runtimePerf.painterStarTelemetry.painterOwnedStarLayerCreated).toBe(false)
    expect(runtimePerf.painterStarTelemetry.painterOwnedStarLayerSynced).toBe(false)
    expect(runtimePerf.painterStarTelemetry.painterOwnedStarLayerStarCount).toBe(0)
    expect(runtimePerf.painterStarTelemetry.directStarLayerStillActive).toBe(true)
    expect(runtimePerf.painterStarTelemetry.comparison.painterVsDirectDelta).toBe(0)
    expect(runtimePerf.painterStarTelemetry.comparison.batchVsDirectDelta).toBe(0)
    expect(runtimePerf.painterStarTelemetry.comparison.batchVsProjectedDelta).toBe(0)
    expect(runtimePerf.painterStarTelemetry.comparison.batchVsRenderedDelta).toBe(0)
    expect(runtimePerf.painterStarTelemetry.comparison.backendMappedVsDirectDelta).toBe(0)
    expect(runtimePerf.painterStarTelemetry.comparison.backendMappedVsBatchDelta).toBe(0)
    expect(runtimePerf.painterStarTelemetry.comparison.painterOwnedVsDirectDelta).toBeNull()
    expect(runtime.painterOwnedStarBackendLayer.syncFromMappedBatch).not.toHaveBeenCalled()

    reportingModule.dispose({ runtime })
  })

  it('publishes side-by-side backend execution telemetry when flag is ON', () => {
    const reportingModule = createSceneReportingModule()
    const painter = createSkyPainterPortState()
    const canvas = {
      dataset: {},
      closest: vi.fn(() => null),
      removeAttribute: vi.fn(),
    }

    painter.reset_for_frame({
      frameIndex: 18,
      windowWidth: 800,
      windowHeight: 400,
      pixelScale: 1,
      framebufferWidth: 800,
      framebufferHeight: 400,
      starsLimitMag: 6.4,
      hintsLimitMag: 6.4,
      hardLimitMag: 8,
    })
    painter.paint_prepare(800, 400, 1)
    painter.paint_stars_draw_intent({
      fromDirectStarPath: true,
      starCount: 1,
      source: {
        dataMode: 'multi-survey',
        sourceLabel: 'survey',
        scenePacketStarCount: 1,
        scenePacketTileCount: 1,
        diagnosticsActiveTiles: 1,
        diagnosticsVisibleTileIdsCount: 1,
        diagnosticsStarsListVisitCount: 4,
      },
      magnitude: {
        limitingMagnitude: 6.4,
        minRenderedMagnitude: 1.3,
        maxRenderedMagnitude: 1.3,
        minRenderAlpha: 0.8,
        maxRenderAlpha: 0.8,
      },
      view: {
        projectionMode: 'stereographic',
        fovDegrees: 60,
        viewportWidth: 800,
        viewportHeight: 400,
        centerDirection: { x: 0, y: 0, z: 1 },
        sceneTimestampIso: '2026-04-10T00:00:00Z',
      },
    })

    const runtime = {
      ...createBaseRuntime(),
      painterBackendExecutionEnabled: true,
      canvas,
      scene: {
        meshes: [],
        materials: [],
        textures: [],
      },
      projectedStarsFrame: {
        width: 800,
        height: 400,
        currentFovDegrees: 60,
        lod: { tier: 'medium', labelCap: 8 },
        view: { centerDirection: { x: 0, y: 0, z: 1 } },
        projectedStars: [{ object: { id: 'star-1', type: 'star', magnitude: 1.2 } }],
        limitingMagnitude: 6.4,
        sceneTimestampIso: '2026-04-10T00:00:00Z',
      },
      projectedSceneFrame: {
        currentFovDegrees: 60,
        lod: { tier: 'medium', labelCap: 8 },
      },
      runtimePerfTelemetry: {
        latest: {
          frameIndex: 18,
          shouldRenderFrame: true,
          updateMs: 0,
          renderModulesMs: 0,
          sceneRenderMs: 0,
          frameTotalMs: 1,
          moduleMs: {},
          moduleUpdateMs: {},
          moduleRenderMs: {},
          stepMs: {
            collectProjectedStarsMs: 0.1,
            collectProjectedNonStarObjectsMs: 0.1,
            starLayerSyncCount: 1,
            starLayerSyncCallCount: 1,
          },
          starCount: 1,
          objectCount: 1,
        },
        ema: {
          frameIndex: 18,
          shouldRenderFrame: true,
          updateMs: 0,
          renderModulesMs: 0,
          sceneRenderMs: 0,
          frameTotalMs: 1,
          moduleMs: {},
          moduleUpdateMs: {},
          moduleRenderMs: {},
          stepMs: {
            collectProjectedStarsMs: 0.1,
            collectProjectedNonStarObjectsMs: 0.1,
            starLayerSyncCount: 1,
            starLayerSyncCallCount: 1,
          },
          starCount: 1,
          objectCount: 1,
        },
      },
      projectedPickEntries: [],
      brightnessExposureState: null,
      trajectoryObjectId: null,
      visibleLabelIds: [],
    }
    const services = createBaseServices()
    const props = {
      ...createBaseProps(),
      projectionMode: 'stereographic',
      backendStars: [],
    }
    const getProps = () => props

    reportingModule.render({ runtime, services, getProps })
    painter.paint_finish()
    reportingModule.postRender({
      runtime,
      services,
      getProps,
      frameState: {
        frameIndex: 18,
        deltaSeconds: 0.016,
        render: {
          painter,
          windowWidth: 800,
          windowHeight: 400,
          pixelScale: 1,
          framebufferWidth: 800,
          framebufferHeight: 400,
          starsLimitMag: 6.4,
          hintsLimitMag: 6.4,
          hardLimitMag: 8,
        },
      },
    })

    const runtimePerf = JSON.parse(canvas.dataset.skyEngineRuntimePerf)
    expect(runtimePerf.painterStarTelemetry.backendExecutionEnabled).toBe(true)
    expect(runtimePerf.painterStarTelemetry.backendExecutionStatus).toBe('executed_side_by_side_painter_layer')
    expect(runtimePerf.painterStarTelemetry.backendExecutionStatus).not.toMatch(/stage/i)
    expect(runtimePerf.painterStarTelemetry.backendSideBySideExecutionCount).toBe(1)
    expect(runtimePerf.painterStarTelemetry.backendExecutionDisabledCount).toBe(0)
    expect(runtimePerf.painterStarTelemetry.painterOwnedStarLayerCreated).toBe(true)
    expect(runtimePerf.painterStarTelemetry.painterOwnedStarLayerSynced).toBe(true)
    expect(runtimePerf.painterStarTelemetry.painterOwnedStarLayerStarCount).toBe(1)
    expect(runtimePerf.painterStarTelemetry.directStarLayerStillActive).toBe(true)
    expect(runtimePerf.painterStarTelemetry.comparison.painterOwnedVsDirectDelta).toBe(0)
    expect(runtime.directStarLayer.sync).toHaveBeenCalledTimes(1)
    expect(runtime.painterOwnedStarBackendLayer.syncFromMappedBatch).toHaveBeenCalledTimes(1)

    reportingModule.dispose({ runtime })
  })

  it('ObjectRuntimeModule keeps stars, planets, and deep sky out of generic direct object sync', () => {
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
    expect(genericObjects).toHaveLength(0)
    expect(runtime.projectedPlanetObjects).toHaveLength(2)
    expect(runtime.projectedPlanetObjects.some((entry) => entry.object.type === 'planet')).toBe(true)
    expect(runtime.projectedPlanetObjects.some((entry) => entry.object.type === 'moon')).toBe(true)
    expect(runtime.projectedDsoObjects).toHaveLength(1)
    expect(runtime.projectedDsoObjects[0].object.type).toBe('deep_sky')
    expect(runtime.projectedGenericObjects).toHaveLength(0)
    expect(runtime.projectedPickEntries.some((entry) => entry.object.type === 'star')).toBe(true)
    expect(runtime.projectedPickEntries.some((entry) => entry.object.type === 'planet')).toBe(true)
    expect(runtime.projectedPickEntries.some((entry) => entry.object.type === 'deep_sky')).toBe(true)
  })

  it('PlanetRuntimeModule owns dedicated planet layer sync', () => {
    const objectModule = createObjectRuntimeModule()
    const planetModule = createPlanetRuntimeModule()
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

    objectModule.update({ runtime, services, getProps, getPropsVersion })
    planetModule.render({ runtime, services, getProps })

    expect(runtime.directPlanetLayer.sync).toHaveBeenCalledTimes(1)
    const [projectedPlanets] = runtime.directPlanetLayer.sync.mock.calls[0]
    expect(projectedPlanets).toHaveLength(2)
    expect(projectedPlanets.some((entry) => entry.object.type === 'planet')).toBe(true)
    expect(projectedPlanets.some((entry) => entry.object.type === 'moon')).toBe(true)
    expect(runtime.directObjectLayer.sync).not.toHaveBeenCalled()
  })

  it('DsoRuntimeModule owns dedicated deep sky layer sync', () => {
    const objectModule = createObjectRuntimeModule()
    const dsoModule = createDsoRuntimeModule()
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

    objectModule.update({ runtime, services, getProps, getPropsVersion })
    dsoModule.render({ runtime, services, getProps })

    expect(runtime.directDsoLayer.sync).toHaveBeenCalledTimes(1)
    const [projectedDsos, viewportWidth, viewportHeight, selectedObjectId] = runtime.directDsoLayer.sync.mock.calls[0]
    expect(projectedDsos).toHaveLength(1)
    expect(projectedDsos[0].object.type).toBe('deep_sky')
    expect(viewportWidth).toBe(800)
    expect(viewportHeight).toBe(400)
    expect(selectedObjectId).toBeNull()
    expect(runtime.directObjectLayer.sync).not.toHaveBeenCalled()
  })
})
