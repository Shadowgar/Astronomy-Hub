import { describe, expect, it } from 'vitest'

import { NoopStellariumRenderer } from '../src/features/sky-engine/engine/sky/renderer/NoopStellariumRenderer'
import {
  createPointRenderItem,
  STELLARIUM_RENDER_ITEM_TYPES,
} from '../src/features/sky-engine/engine/sky/renderer/renderItems'
import {
  createStarsPointRenderItemFromPainterCommand,
  createStarsPointRenderItemFromProjectedStars,
} from '../src/features/sky-engine/engine/sky/renderer/adapters/starsPointItemsAdapter'

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

  it('converts projected stars into deterministic renderer-neutral point items', () => {
    const projectedStars = [
      {
        object: { id: 'star-b', type: 'star', magnitude: 2 },
        screenX: 120,
        screenY: 210,
        depth: 0.4,
        angularDistanceRad: 0.2,
        markerRadiusPx: 2.5,
        pickRadiusPx: 9,
        renderAlpha: 0.6,
        starProfile: { colorHex: '#123456' },
      },
      {
        object: { id: 'star-a', type: 'star', magnitude: 1 },
        screenX: 100,
        screenY: 200,
        depth: 0.3,
        angularDistanceRad: 0.1,
        markerRadiusPx: 3,
        pickRadiusPx: 10,
        renderAlpha: 0.8,
        starProfile: { colorHex: '#abcdef' },
      },
    ]

    const pointItem = createStarsPointRenderItemFromProjectedStars({
      projectedStars,
      order: 42,
    })

    expect(pointItem.itemType).toBe('ITEM_POINTS')
    expect(pointItem.sourceModule).toBe('stars')
    expect(pointItem.pointCount).toBe(2)
    expect(pointItem.order).toBe(42)
    expect(pointItem.vertexPayload).toEqual([
      100, 200, 0.3, 3, 171, 205, 239, 204,
      120, 210, 0.4, 2.5, 18, 52, 86, 153,
    ])
  })

  it('noop renderer accepts converted stars point items', () => {
    const renderer = new NoopStellariumRenderer()
    renderer.init({
      viewport: {
        width: 800,
        height: 400,
        pixelRatio: 1,
      },
    })

    const pointItem = createStarsPointRenderItemFromProjectedStars({
      projectedStars: [
        {
          object: { id: 'star-1', type: 'star', magnitude: 1.2 },
          screenX: 100,
          screenY: 140,
          depth: 0.2,
          angularDistanceRad: 0.1,
          markerRadiusPx: 3,
          pickRadiusPx: 10,
          renderAlpha: 0.7,
          starProfile: { colorHex: '#ffffff' },
        },
      ],
    })

    renderer.prepareFrame({
      observer: {
        latitudeDeg: 40,
        longitudeDeg: -74,
        elevationM: 10,
      },
      time: {
        timestampIso: '2026-05-01T00:00:00Z',
        animationTimeSeconds: 0,
      },
      projectionMode: 'stereographic',
      fovDegrees: 70,
      viewport: {
        width: 800,
        height: 400,
        pixelRatio: 1,
      },
      camera: {
        centerDirection: { x: 0, y: 0, z: 1 },
      },
    })

    renderer.submitFrame({
      frameInput: {
        observer: {
          latitudeDeg: 40,
          longitudeDeg: -74,
          elevationM: 10,
        },
        time: {
          timestampIso: '2026-05-01T00:00:00Z',
          animationTimeSeconds: 0,
        },
        projectionMode: 'stereographic',
        fovDegrees: 70,
        viewport: {
          width: 800,
          height: 400,
          pixelRatio: 1,
        },
        camera: {
          centerDirection: { x: 0, y: 0, z: 1 },
        },
      },
      renderItems: [pointItem],
    })

    const output = renderer.renderFrame()
    expect(output.diagnostics.acceptedPointItemCount).toBe(1)
    expect(output.diagnostics.acceptedItemCount).toBe(1)
  })

  it('can convert painter 2d point commands to renderer-neutral items', () => {
    const pointItem = createStarsPointRenderItemFromPainterCommand({
      fn: 'paint_2d_points',
      kind: 'paint_2d_points',
      frameIndex: 7,
      sequence: 11,
      payload: {
        count: 1,
        points: [
          {
            pos: [120, 240],
            size: 3,
            color: [255, 128, 64, 255],
          },
        ],
      },
      batchState: {
        mode: 2,
        color: [1, 1, 1, 1],
        flags: 0,
        textureBindings: {
          0: null,
          1: null,
        },
        projection: null,
        clipping: {
          clipInfoValid: false,
          clipInfo: null,
        },
      },
    })

    expect(pointItem).not.toBeNull()
    expect(pointItem).toMatchObject({
      sourceModule: 'stars',
      pointCount: 1,
      order: 11,
      vertexPayload: [120, 240, 3, 255, 128, 64, 255],
    })
  })
})
