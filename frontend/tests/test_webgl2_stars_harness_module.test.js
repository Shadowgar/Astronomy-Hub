import { describe, expect, it, vi } from 'vitest'

import { createPointRenderItem } from '../src/features/sky-engine/engine/sky/renderer/renderItems'
import { createWebGL2StarsHarnessModule } from '../src/features/sky-engine/engine/sky/runtime/modules/WebGL2StarsHarnessModule'

function createRendererMock() {
  return {
    init: vi.fn(),
    resize: vi.fn(),
    prepareFrame: vi.fn(),
    submitFrame: vi.fn(),
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
        submittedPointItemCount: 1,
        drawnPointItemCount: 1,
        submittedPointCount: 2,
        drawnPointCount: 2,
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
      renderer,
      onDiagnostics: diagnostics,
    })

    const context = createRenderContext({ item: pointItem })
    module.render(context)

    expect(renderer.init).toHaveBeenCalledTimes(1)
    expect(renderer.submitFrame).toHaveBeenCalledWith(expect.objectContaining({
      renderItems: [pointItem],
    }))
    expect(diagnostics).toHaveBeenCalledWith(expect.objectContaining({
      comparisonModeEnabled: true,
      comparisonMode: 'overlay',
      submittedPointCount: 2,
      drawnPointCount: 2,
      directStarLayerStarCount: 2,
      backendActive: true,
    }))
  })

  it('submits empty render item list when no boundary point item exists', () => {
    const renderer = createRendererMock()
    const module = createWebGL2StarsHarnessModule({
      enabled: true,
      comparisonMode: 'side-by-side',
      renderer,
    })

    const context = createRenderContext({ item: null })
    module.render(context)

    expect(renderer.submitFrame).toHaveBeenCalledWith(expect.objectContaining({
      renderItems: [],
    }))
  })
})
