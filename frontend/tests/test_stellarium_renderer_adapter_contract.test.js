import { describe, expect, it } from 'vitest'

import { NoopStellariumRenderer } from '../src/features/sky-engine/engine/sky/renderer/NoopStellariumRenderer'
import {
  createPointRenderItem,
  STELLARIUM_RENDER_ITEM_TYPES,
} from '../src/features/sky-engine/engine/sky/renderer/renderItems'

describe('stellarium renderer adapter boundary contract', () => {
  it('accepts point render items via neutral contract submission', () => {
    const renderer = new NoopStellariumRenderer()

    renderer.init({
      viewport: {
        width: 1280,
        height: 720,
        pixelRatio: 1,
      },
      canvasId: 'sky-engine-canvas',
    })

    const pointItem = createPointRenderItem({
      order: 10,
      pointCount: 2,
      vertexPayload: [0, 0, 1, 1, 1, 0],
      sourceModule: 'StarsModule',
      sourceObjectId: 'star-1',
      dimensions: '3d',
    })

    renderer.prepareFrame({
      observer: {
        latitudeDeg: 40.7,
        longitudeDeg: -74,
        elevationM: 12,
      },
      time: {
        timestampIso: '2026-05-01T00:00:00Z',
        animationTimeSeconds: 1.5,
      },
      projectionMode: 'stereographic',
      fovDegrees: 75,
      viewport: {
        width: 1280,
        height: 720,
        pixelRatio: 1,
      },
      camera: {
        centerDirection: { x: 0, y: 0, z: 1 },
      },
      clipCullState: {
        clipInfoValid: true,
        horizonClipActive: false,
        discontinuityClipActive: false,
        notes: 'test',
      },
    })

    renderer.submitFrame({
      frameInput: {
        observer: {
          latitudeDeg: 40.7,
          longitudeDeg: -74,
          elevationM: 12,
        },
        time: {
          timestampIso: '2026-05-01T00:00:00Z',
          animationTimeSeconds: 1.5,
        },
        projectionMode: 'stereographic',
        fovDegrees: 75,
        viewport: {
          width: 1280,
          height: 720,
          pixelRatio: 1,
        },
        camera: {
          centerDirection: { x: 0, y: 0, z: 1 },
        },
      },
      renderItems: [
        {
          ...pointItem,
          itemType: STELLARIUM_RENDER_ITEM_TYPES.POINTS,
        },
      ],
    })

    const frameOutput = renderer.renderFrame()

    expect(frameOutput.activeBackendName).toBe('noop-stellarium-renderer')
    expect(frameOutput.pickResult).toEqual({
      objectId: null,
      hit: false,
      confidence: 0,
    })
    expect(frameOutput.diagnostics).toMatchObject({
      acceptedItemCount: 1,
      acceptedPointItemCount: 1,
      acceptedMeshItemCount: 0,
      acceptedTextItemCount: 0,
      acceptedTextureItemCount: 0,
      lastFrameSequence: 1,
      lastFrameProjectionMode: 'stereographic',
    })
    expect(frameOutput.timing.totalFrameMs).toBeGreaterThanOrEqual(0)
  })

  it('supports full no-op lifecycle without drawing side effects', () => {
    const renderer = new NoopStellariumRenderer()

    renderer.init({
      viewport: {
        width: 640,
        height: 480,
        pixelRatio: 1,
      },
    })

    renderer.resize({
      width: 800,
      height: 600,
      pixelRatio: 2,
    })

    renderer.prepareFrame({
      observer: {
        latitudeDeg: 0,
        longitudeDeg: 0,
        elevationM: 0,
      },
      time: {
        timestampIso: '2026-05-01T00:00:00Z',
        animationTimeSeconds: 0,
      },
      projectionMode: 'stereographic',
      fovDegrees: 90,
      viewport: {
        width: 800,
        height: 600,
        pixelRatio: 2,
      },
      camera: {
        centerDirection: { x: 0, y: 1, z: 0 },
      },
    })

    renderer.submitFrame({
      frameInput: {
        observer: {
          latitudeDeg: 0,
          longitudeDeg: 0,
          elevationM: 0,
        },
        time: {
          timestampIso: '2026-05-01T00:00:00Z',
          animationTimeSeconds: 0,
        },
        projectionMode: 'stereographic',
        fovDegrees: 90,
        viewport: {
          width: 800,
          height: 600,
          pixelRatio: 2,
        },
        camera: {
          centerDirection: { x: 0, y: 1, z: 0 },
        },
      },
      renderItems: [],
    })

    const output = renderer.renderFrame()
    expect(output.diagnostics.acceptedItemCount).toBe(0)

    renderer.dispose()

    expect(() => renderer.renderFrame()).toThrow(/not initialized/)
  })
})
