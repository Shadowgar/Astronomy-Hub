import { describe, expect, it, vi } from 'vitest'

import {
  executePainterBackendPlan,
  mapPainterBatchesToBackendPlan,
  resolvePainterBackendExecutionEnabled,
} from '../src/features/sky-engine/engine/sky/runtime/renderer/painterBackendPort'
import {
  createSkyPainterPortState,
} from '../src/features/sky-engine/engine/sky/runtime/renderer/painterPort'

function buildFinalizedStarsBatch() {
  const painter = createSkyPainterPortState()
  painter.reset_for_frame({
    frameIndex: 7,
    windowWidth: 800,
    windowHeight: 400,
    pixelScale: 1,
    framebufferWidth: 800,
    framebufferHeight: 400,
    starsLimitMag: 6,
    hintsLimitMag: 6,
    hardLimitMag: 8,
  })
  painter.paint_prepare(800, 400, 1)
  painter.paint_stars_draw_intent({
    fromDirectStarPath: true,
    starCount: 3,
    source: {
      dataMode: 'multi-survey',
      sourceLabel: 'survey',
      scenePacketStarCount: 3,
      scenePacketTileCount: 1,
      diagnosticsActiveTiles: 1,
      diagnosticsVisibleTileIdsCount: 1,
      diagnosticsStarsListVisitCount: 3,
    },
    magnitude: {
      limitingMagnitude: 6,
      minRenderedMagnitude: 1,
      maxRenderedMagnitude: 2,
      minRenderAlpha: 0.6,
      maxRenderAlpha: 1,
    },
    view: {
      projectionMode: 'stereographic',
      fovDegrees: 40,
      viewportWidth: 800,
      viewportHeight: 400,
      centerDirection: { x: 0, y: 0, z: 1 },
      sceneTimestampIso: '2026-04-26T00:00:00Z',
    },
  })
  painter.paint_finish()
  return painter.finalizedBatches[0]
}

function buildPoint2d(x, y, size = 2) {
  return {
    pos: [x, y],
    size,
    color: [255, 255, 255, 255],
  }
}

describe('painterBackendPort mapping shell (inert)', () => {
  it('defaults backend execution flag to OFF', () => {
    expect(resolvePainterBackendExecutionEnabled()).toBe(false)
    expect(resolvePainterBackendExecutionEnabled({ envValue: undefined, queryString: null })).toBe(false)
  })

  it('maps finalized stars batches into backend plan records without execution', () => {
    const starsBatch = buildFinalizedStarsBatch()

    const mappingPlan = mapPainterBatchesToBackendPlan({
      finalizedBatches: [starsBatch],
    })

    expect(mappingPlan.mappedBatches).toHaveLength(1)
    expect(mappingPlan.unsupportedBatches).toHaveLength(0)
    expect(mappingPlan.summary).toMatchObject({
      mappedBatchCount: 1,
      mappedStarsBatchCount: 1,
      mappedStarsCount: 3,
      unsupportedBatchCount: 0,
      executionStatus: 'mapped_not_executed',
    })
    expect(mappingPlan.mappedBatches[0]).toMatchObject({
      kind: 'stars',
      frameIndex: 7,
      sourceCommandKind: 'paint_stars_draw_intent',
      starCount: 3,
      grouping: starsBatch.grouping,
      intendedBackendPath: 'babylon-thin-instance-stars',
      executionStatus: 'mapped_not_executed',
      renderGlReference: {
        renderHeaderApi: 'render_points_3d',
        renderGlItemType: 'ITEM_POINTS_3D',
        renderGlBatchingConcept: 'get_item(type, flags, halo, texture)',
        renderGlFlushPhase: 'render_finish',
      },
    })
  })

  it('reports unsupported batch kinds without executing them', () => {
    const starsBatch = buildFinalizedStarsBatch()
    const unsupportedBatch = {
      kind: 'mesh',
      frameIndex: 8,
      sourceCommandKind: 'paint_mesh',
      batch: { reason: 'future-stage' },
    }

    const mappingPlan = mapPainterBatchesToBackendPlan({
      finalizedBatches: [starsBatch, unsupportedBatch],
    })

    expect(mappingPlan.mappedBatches).toHaveLength(1)
    expect(mappingPlan.unsupportedBatches).toHaveLength(1)
    expect(mappingPlan.unsupportedBatches[0]).toMatchObject({
      kind: 'unsupported',
      frameIndex: 8,
      sourceBatchKind: 'mesh',
      sourceCommandKind: 'paint_mesh',
      status: 'unsupported_not_executed',
      reason: 'unsupported_batch_kind',
    })
    expect(mappingPlan.summary.executionStatus).toBe('unsupported_not_executed')
  })

  it('OFF mode does not call side-by-side renderer through executor', () => {
    const starsBatch = buildFinalizedStarsBatch()
    const mappingPlan = mapPainterBatchesToBackendPlan({
      finalizedBatches: [starsBatch],
    })
    const sideBySideRenderer = { sync: vi.fn() }
    const painterOwnedLayer = { syncFromMappedBatch: vi.fn() }

    const executionPlan = executePainterBackendPlan({
      finalizedBatches: [starsBatch],
      mappingPlan,
      executionEnabled: false,
      sideBySideRenderer,
      painterOwnedStarLayer: painterOwnedLayer,
      projectedStarsFrame: {
        projectedStars: [{ object: { id: 'star-1' } }],
        width: 800,
        height: 400,
      },
      selectedObjectId: null,
      animationTimeSeconds: 1,
    })

    expect(sideBySideRenderer.sync).not.toHaveBeenCalled()
    expect(painterOwnedLayer.syncFromMappedBatch).not.toHaveBeenCalled()
    expect(executionPlan.summary.executionEnabled).toBe(false)
    expect(executionPlan.summary.executionStatus).toBe('execution_disabled')
    expect(executionPlan.summary.executionDisabledCount).toBe(1)
    expect(executionPlan.summary.sideBySideExecutionCount).toBe(0)
    expect(executionPlan.mappedBatches[0].executionStatus).toBe('execution_disabled')
  })

  it('ON mode executes side-by-side and marks executed_side_by_side', () => {
    const starsBatch = buildFinalizedStarsBatch()
    const mappingPlan = mapPainterBatchesToBackendPlan({
      finalizedBatches: [starsBatch],
    })
    const sideBySideRenderer = { sync: vi.fn() }
    const painterOwnedLayer = {
      syncFromMappedBatch: vi.fn(() => ({ created: true, synced: true, syncedStarCount: 3 })),
    }

    const executionPlan = executePainterBackendPlan({
      finalizedBatches: [starsBatch],
      mappingPlan,
      executionEnabled: true,
      sideBySideRenderer,
      painterOwnedStarLayer: painterOwnedLayer,
      projectedStarsFrame: {
        projectedStars: [{ object: { id: 'star-1' } }],
        width: 800,
        height: 400,
      },
      selectedObjectId: 'star-1',
      animationTimeSeconds: 1.2,
    })

    expect(sideBySideRenderer.sync).toHaveBeenCalledTimes(1)
    expect(painterOwnedLayer.syncFromMappedBatch).toHaveBeenCalledTimes(1)
    expect(executionPlan.summary.executionEnabled).toBe(true)
    expect(executionPlan.summary.executionStatus).toBe('executed_side_by_side_painter_layer')
    expect(executionPlan.summary.sideBySideExecutionCount).toBe(1)
    expect(executionPlan.summary.executionDisabledCount).toBe(0)
    expect(executionPlan.summary.painterOwnedStarLayerCreated).toBe(true)
    expect(executionPlan.summary.painterOwnedStarLayerSynced).toBe(true)
    expect(executionPlan.summary.painterOwnedStarLayerStarCount).toBe(3)
    expect(executionPlan.mappedBatches[0].executionStatus).toBe('executed_side_by_side_painter_layer')
  })

  it('ON mode can still execute side-by-side without painter-owned layer', () => {
    const starsBatch = buildFinalizedStarsBatch()
    const mappingPlan = mapPainterBatchesToBackendPlan({
      finalizedBatches: [starsBatch],
    })
    const sideBySideRenderer = { sync: vi.fn() }

    const executionPlan = executePainterBackendPlan({
      finalizedBatches: [starsBatch],
      mappingPlan,
      executionEnabled: true,
      sideBySideRenderer,
      projectedStarsFrame: {
        projectedStars: [{ object: { id: 'star-1' } }],
        width: 800,
        height: 400,
      },
      selectedObjectId: 'star-1',
      animationTimeSeconds: 1.2,
    })

    expect(sideBySideRenderer.sync).toHaveBeenCalledTimes(1)
    expect(executionPlan.summary.executionStatus).toBe('executed_side_by_side')
    expect(executionPlan.summary.painterOwnedStarLayerCreated).toBe(false)
    expect(executionPlan.summary.painterOwnedStarLayerSynced).toBe(false)
    expect(executionPlan.summary.painterOwnedStarLayerStarCount).toBe(0)
  })

  it('unsupported batches remain not executed in execution phase', () => {
    const starsBatch = buildFinalizedStarsBatch()
    const unsupportedBatch = {
      kind: 'mesh',
      frameIndex: 8,
      sourceCommandKind: 'paint_mesh',
      batch: { reason: 'future-stage' },
    }
    const mappingPlan = mapPainterBatchesToBackendPlan({
      finalizedBatches: [starsBatch, unsupportedBatch],
    })
    const sideBySideRenderer = { sync: vi.fn() }
    const painterOwnedLayer = { syncFromMappedBatch: vi.fn() }

    const executionPlan = executePainterBackendPlan({
      finalizedBatches: [starsBatch],
      mappingPlan,
      executionEnabled: true,
      sideBySideRenderer,
      painterOwnedStarLayer: painterOwnedLayer,
      projectedStarsFrame: {
        projectedStars: [{ object: { id: 'star-1' } }],
        width: 800,
        height: 400,
      },
      selectedObjectId: null,
      animationTimeSeconds: 1,
    })

    expect(executionPlan.unsupportedBatches).toHaveLength(1)
    expect(executionPlan.unsupportedBatches[0].status).toBe('unsupported_not_executed')
    expect(sideBySideRenderer.sync).toHaveBeenCalledTimes(1)
    expect(painterOwnedLayer.syncFromMappedBatch).toHaveBeenCalledTimes(1)
  })

  it('unsupported-only batches do not create or sync painter-owned layer', () => {
    const unsupportedBatch = {
      kind: 'mesh',
      frameIndex: 8,
      sourceCommandKind: 'paint_mesh',
      batch: { reason: 'future-stage' },
    }
    const mappingPlan = mapPainterBatchesToBackendPlan({
      finalizedBatches: [unsupportedBatch],
    })
    const sideBySideRenderer = { sync: vi.fn() }
    const painterOwnedLayer = { syncFromMappedBatch: vi.fn() }

    const executionPlan = executePainterBackendPlan({
      finalizedBatches: [],
      mappingPlan,
      executionEnabled: true,
      sideBySideRenderer,
      painterOwnedStarLayer: painterOwnedLayer,
      projectedStarsFrame: {
        projectedStars: [{ object: { id: 'star-1' } }],
        width: 800,
        height: 400,
      },
      selectedObjectId: null,
      animationTimeSeconds: 1,
    })

    expect(executionPlan.mappedBatches).toHaveLength(0)
    expect(executionPlan.unsupportedBatches).toHaveLength(1)
    expect(executionPlan.summary.executionStatus).toBe('unsupported_not_executed')
    expect(executionPlan.summary.painterOwnedStarLayerCreated).toBe(false)
    expect(executionPlan.summary.painterOwnedStarLayerSynced).toBe(false)
    expect(executionPlan.summary.painterOwnedStarLayerStarCount).toBe(0)
    expect(sideBySideRenderer.sync).not.toHaveBeenCalled()
    expect(painterOwnedLayer.syncFromMappedBatch).not.toHaveBeenCalled()
  })
})

describe('painterPort real point item pipeline (S1)', () => {
  it('render_prepare-equivalent setup clears previous point items each frame', () => {
    const painter = createSkyPainterPortState()

    painter.reset_for_frame({
      frameIndex: 1,
      windowWidth: 800,
      windowHeight: 400,
      pixelScale: 1,
      framebufferWidth: 800,
      framebufferHeight: 400,
      starsLimitMag: 6,
      hintsLimitMag: 6,
      hardLimitMag: 8,
    })
    painter.paint_prepare(800, 400, 1)
    painter.paint_2d_points(1, [buildPoint2d(100, 80)])
    expect(painter.pointItems).toHaveLength(1)

    painter.paint_finish()
    expect(painter.finalizedPointItems).toHaveLength(1)

    painter.reset_for_frame({
      frameIndex: 2,
      windowWidth: 800,
      windowHeight: 400,
      pixelScale: 1,
      framebufferWidth: 800,
      framebufferHeight: 400,
      starsLimitMag: 6,
      hintsLimitMag: 6,
      hardLimitMag: 8,
    })
    painter.paint_prepare(800, 400, 1)

    expect(painter.pointItems).toHaveLength(0)
    expect(painter.renderBackend.depthMin).toBe(Number.POSITIVE_INFINITY)
    expect(painter.renderBackend.depthMax).toBe(Number.NEGATIVE_INFINITY)
  })

  it('paint_2d_points creates a real ITEM_POINTS backend item', () => {
    const painter = createSkyPainterPortState()

    painter.reset_for_frame({
      frameIndex: 3,
      windowWidth: 800,
      windowHeight: 400,
      pixelScale: 1,
      framebufferWidth: 800,
      framebufferHeight: 400,
      starsLimitMag: 6,
      hintsLimitMag: 6,
      hardLimitMag: 8,
    })
    painter.paint_prepare(800, 400, 1)
    painter.paint_2d_points(2, [buildPoint2d(100, 80), buildPoint2d(120, 90)])
    painter.paint_finish()

    expect(painter.finalizedPointItems).toHaveLength(1)
    expect(painter.finalizedPointItems[0].type).toBe('ITEM_POINTS')
    expect(painter.finalizedPointItems[0].pointCount).toBe(2)
    expect(painter.renderBackend.flushReady).toBe(true)
  })

  it('get_item-equivalent batching reuses compatible point item allocations', () => {
    const painter = createSkyPainterPortState()

    painter.reset_for_frame({
      frameIndex: 4,
      windowWidth: 800,
      windowHeight: 400,
      pixelScale: 1,
      framebufferWidth: 800,
      framebufferHeight: 400,
      starsLimitMag: 6,
      hintsLimitMag: 6,
      hardLimitMag: 8,
    })
    painter.paint_prepare(800, 400, 1)
    painter.paint_2d_points(2, [buildPoint2d(100, 80), buildPoint2d(120, 90)])
    painter.paint_2d_points(1, [buildPoint2d(140, 100)])

    expect(painter.pointItems).toHaveLength(1)
    expect(painter.pointItems[0].pointCount).toBe(3)
    painter.paint_finish()
    expect(painter.finalizedPointItems[0].pointCount).toBe(3)
  })

  it('finalized point item count and batch star count match star draw input', () => {
    const painter = createSkyPainterPortState()

    painter.reset_for_frame({
      frameIndex: 5,
      windowWidth: 800,
      windowHeight: 400,
      pixelScale: 1,
      framebufferWidth: 800,
      framebufferHeight: 400,
      starsLimitMag: 6,
      hintsLimitMag: 6,
      hardLimitMag: 8,
    })
    painter.paint_prepare(800, 400, 1)
    painter.paint_stars_draw_intent({
      fromDirectStarPath: true,
      starCount: 3,
      source: {
        dataMode: 'multi-survey',
        sourceLabel: 'survey',
        scenePacketStarCount: 3,
        scenePacketTileCount: 1,
        diagnosticsActiveTiles: 1,
        diagnosticsVisibleTileIdsCount: 1,
        diagnosticsStarsListVisitCount: 3,
      },
      magnitude: {
        limitingMagnitude: 6,
        minRenderedMagnitude: 1,
        maxRenderedMagnitude: 2,
        minRenderAlpha: 0.7,
        maxRenderAlpha: 1,
      },
      view: {
        projectionMode: 'stereographic',
        fovDegrees: 40,
        viewportWidth: 800,
        viewportHeight: 400,
        centerDirection: { x: 0, y: 0, z: 1 },
        sceneTimestampIso: '2026-04-26T00:00:00Z',
      },
    })
    painter.paint_2d_points(3, [buildPoint2d(100, 80), buildPoint2d(120, 90), buildPoint2d(140, 110)])
    painter.paint_finish()

    expect(painter.finalizedPointItems).toHaveLength(1)
    expect(painter.finalizedPointItems[0].pointCount).toBe(3)
    expect(painter.finalizedBatches).toHaveLength(1)
    expect(painter.finalizedBatches[0].starCount).toBe(3)
  })
})
