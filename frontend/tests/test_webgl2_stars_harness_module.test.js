import { describe, expect, it, vi } from 'vitest'

import { createPointRenderItem } from '../src/features/sky-engine/engine/sky/renderer/renderItems'
import { createWebGL2StarsHarnessModule } from '../src/features/sky-engine/engine/sky/runtime/modules/WebGL2StarsHarnessModule'
import { createWebGL2StarsOwnerModule } from '../src/features/sky-engine/engine/sky/runtime/modules/WebGL2StarsOwnerModule'

function createRendererMock(overrides = {}) {
  let lastSubmittedPointCount = 0
  let lastSubmittedItemCount = 0

  return {
    init: vi.fn(),
    resize: vi.fn(),
    prepareFrame: vi.fn(),
    submitFrame: vi.fn((input) => {
      const pointItems = input.renderItems.filter((item) => item.itemType === 'ITEM_POINTS')
      lastSubmittedPointCount = pointItems.reduce((count, item) => count + item.pointCount, 0)
      lastSubmittedItemCount = pointItems.length
    }),
    renderFrame: vi.fn(() => ({
      pickResult: {
        objectId: null,
        hit: false,
        confidence: 0,
      },
      diagnostics: {
        acceptedItemCount: 1,
        acceptedPointItemCount: 1,
        acceptedMeshItemCount: 0,
        acceptedTextItemCount: 0,
        acceptedTextureItemCount: 0,
        submittedPointItemCount: lastSubmittedItemCount,
        drawnPointItemCount: lastSubmittedItemCount,
        submittedPointCount: lastSubmittedPointCount,
        drawnPointCount: lastSubmittedPointCount,
        skippedUnsupportedItemCount: 0,
        lastFrameSequence: 1,
        lastFrameProjectionMode: 'stereographic',
        notes: ['webgl2_harness'],
      },
      timing: {
        prepareFrameMs: 0,
        submitFrameMs: 0,
        renderFrameMs: 0,
        totalFrameMs: 0,
      },
      activeBackendName: 'webgl2-stellarium-shell',
    })),
    dispose: vi.fn(),
    ...overrides,
  }
}

function createRenderContext({ item } = {}) {
  const runtime = {
    engine: {
      getRenderWidth: () => 800,
      getRenderHeight: () => 400,
    },
    projectedStarsFrame: {
      projectedStars: [{ object: { id: 'star-1' } }, { object: { id: 'star-2' } }],
    },
    rendererBoundaryStarsPointItem: item ?? null,
    directStarLayer: {
      setVisible: vi.fn(),
    },
  }

  const services = {
    clockService: {
      getSceneTimestampIso: () => '2026-05-01T00:00:00Z',
      getAnimationTimeSeconds: () => 1,
    },
    navigationService: {
      getCenterDirection: () => ({ x: 0, y: 0, z: 1 }),
    },
  }

  const props = {
    observer: {
      latitude: 40,
      longitude: -74,
      elevationFt: 30,
    },
    initialSceneTimestampIso: '2026-05-01T00:00:00Z',
    projectionMode: 'stereographic',
    initialViewState: {
      fovDegrees: 60,
    },
  }

  return {
    runtime,
    services,
    frameState: {
      frameIndex: 12,
      deltaSeconds: 0.016,
      render: {
        painter: {},
        windowWidth: 800,
        windowHeight: 400,
        pixelScale: 1,
        framebufferWidth: 800,
        framebufferHeight: 400,
        starsLimitMag: 6,
        hintsLimitMag: 6,
        hardLimitMag: 8,
      },
    },
    getProps: () => props,
    getPropsVersion: () => 1,
    requestRender: () => undefined,
    markFrameDirty: () => undefined,
  }
}

describe('webgl2 stars harness module', () => {
  it('receives latest renderer-boundary stars point item', () => {
    const renderer = createRendererMock()
    const diagnostics = vi.fn()
    const pointItem = createPointRenderItem({
      order: 20,
      pointCount: 2,
      vertexPayload: [100, 100, 0.1, 2, 255, 255, 255, 255, 110, 120, 0.2, 2, 255, 220, 200, 255],
      sourceModule: 'stars',
      dimensions: '2d',
    })

    const module = createWebGL2StarsHarnessModule({
      enabled: true,
      comparisonMode: 'overlay',
      repositoryMode: 'multi-survey',
      renderer,
      onDiagnostics: diagnostics,
    })

    const context = createRenderContext({ item: pointItem })
    module.render(context)

    expect(renderer.init).toHaveBeenCalledTimes(1)
    expect(renderer.submitFrame).toHaveBeenCalledWith(expect.objectContaining({
      renderItems: [pointItem],
      pointStyleCalibration: {
        pointScale: 1,
        alphaScale: 1,
        colorMode: 'payload',
      },
    }))
    expect(diagnostics).toHaveBeenCalledWith(expect.objectContaining({
      comparisonModeEnabled: true,
      comparisonMode: 'overlay',
      submittedPointCount: 2,
      drawnPointCount: 2,
      rendererBoundaryPointCount: 2,
      directStarLayerStarCount: 2,
      repositoryMode: 'multi-survey',
      syntheticDenseGridEnabled: false,
      backendActive: true,
      debugDarkModeEnabled: false,
      debugStarsVisibleOverrideEnabled: false,
      pointScale: 1,
      alphaScale: 1,
      colorMode: 'payload',
    }))
  })

  it('submits empty render item list when no boundary point item exists', () => {
    const renderer = createRendererMock()
    const module = createWebGL2StarsHarnessModule({
      enabled: true,
      comparisonMode: 'side-by-side',
      repositoryMode: 'hipparcos',
      renderer,
    })

    const context = createRenderContext({ item: null })
    module.render(context)

    expect(renderer.submitFrame).toHaveBeenCalledWith(expect.objectContaining({
      renderItems: [],
    }))
  })

  it('submits deterministic synthetic dense grid points when dense verification mode is enabled', () => {
    const renderer = createRendererMock()
    const diagnostics = vi.fn()
    const module = createWebGL2StarsHarnessModule({
      enabled: true,
      comparisonMode: 'overlay',
      repositoryMode: 'multi-survey',
      renderer,
      denseVerificationGridEnabled: true,
      denseVerificationGridSize: 8,
      onDiagnostics: diagnostics,
    })

    const context = createRenderContext({ item: null })
    module.render(context)

    const submission = renderer.submitFrame.mock.calls[0][0]
    expect(submission.renderItems).toHaveLength(1)
    expect(submission.renderItems[0].pointCount).toBe(64)
    expect(diagnostics).toHaveBeenCalledWith(expect.objectContaining({
      syntheticDenseGridEnabled: true,
      syntheticDensePointCount: 64,
      submittedPointCount: 64,
      drawnPointCount: 64,
      rendererBoundaryPointCount: 0,
    }))
  })

  it('suppresses directStarLayer only while owner trial is healthy', () => {
    const renderer = createRendererMock()
    const diagnostics = vi.fn()
    const pointItem = createPointRenderItem({
      order: 20,
      pointCount: 2,
      vertexPayload: [100, 100, 0.1, 2, 255, 255, 255, 255, 110, 120, 0.2, 2, 255, 220, 200, 255],
      sourceModule: 'stars',
      dimensions: '2d',
    })

    const module = createWebGL2StarsOwnerModule({
      enabled: true,
      comparisonHarnessEnabled: false,
      repositoryMode: 'multi-survey',
      renderer,
      pointScale: 1.8,
      alphaScale: 1.6,
      colorMode: 'white-hot',
      debugDarkModeEnabled: true,
      debugStarsVisibleOverrideEnabled: true,
      onDiagnostics: diagnostics,
    })

    const context = createRenderContext({ item: pointItem })
    module.render(context)

    expect(context.runtime.directStarLayer.setVisible).toHaveBeenCalledWith(false)
    expect(diagnostics).toHaveBeenCalledWith(expect.objectContaining({
      ownerTrialEnabled: true,
      backendHealthy: true,
      directStarLayerStatus: 'suppressed',
      submittedPointCount: 2,
      drawnPointCount: 2,
      pointScale: 1.8,
      alphaScale: 1.6,
      colorMode: 'white-hot',
      debugDarkModeEnabled: true,
      debugStarsVisibleOverrideEnabled: true,
      fallbackReason: null,
    }))
  })

  it('falls back safely when owner renderer init or render fails', () => {
    const diagnostics = vi.fn()
    const pointItem = createPointRenderItem({
      order: 20,
      pointCount: 1,
      vertexPayload: [100, 100, 0.1, 2, 255, 255, 255, 255],
      sourceModule: 'stars',
      dimensions: '2d',
    })

    const initFailureRenderer = createRendererMock({
      init: vi.fn(() => {
        throw new Error('forced init failure')
      }),
    })
    const initFailureModule = createWebGL2StarsOwnerModule({
      enabled: true,
      comparisonHarnessEnabled: false,
      repositoryMode: 'multi-survey',
      renderer: initFailureRenderer,
      onDiagnostics: diagnostics,
    })
    const initFailureContext = createRenderContext({ item: pointItem })
    initFailureModule.render(initFailureContext)

    expect(initFailureContext.runtime.directStarLayer.setVisible).toHaveBeenCalledWith(true)
    expect(diagnostics).toHaveBeenLastCalledWith(expect.objectContaining({
      backendHealthy: false,
      directStarLayerStatus: 'fallback',
      fallbackReason: 'forced init failure',
    }))

    const renderFailureRenderer = createRendererMock({
      renderFrame: vi.fn(() => {
        throw new Error('forced render failure')
      }),
    })
    const renderFailureModule = createWebGL2StarsOwnerModule({
      enabled: true,
      comparisonHarnessEnabled: false,
      repositoryMode: 'multi-survey',
      renderer: renderFailureRenderer,
      onDiagnostics: diagnostics,
    })
    const renderFailureContext = createRenderContext({ item: pointItem })
    renderFailureModule.render(renderFailureContext)

    expect(renderFailureContext.runtime.directStarLayer.setVisible).toHaveBeenCalledWith(true)
    expect(diagnostics).toHaveBeenLastCalledWith(expect.objectContaining({
      backendHealthy: false,
      directStarLayerStatus: 'fallback',
      fallbackReason: 'forced render failure',
    }))
  })
})
