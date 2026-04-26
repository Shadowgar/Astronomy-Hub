import { describe, expect, it, vi } from 'vitest'

import {
  mapPainterBatchesToBackendPlan,
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

describe('painterBackendPort mapping shell (inert)', () => {
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

  it('does not touch Babylon scene or direct star layer paths', () => {
    const starsBatch = buildFinalizedStarsBatch()
    const runtime = {
      directStarLayer: { sync: vi.fn() },
      scene: { render: vi.fn() },
    }

    mapPainterBatchesToBackendPlan({
      finalizedBatches: [starsBatch],
    })

    expect(runtime.directStarLayer.sync).not.toHaveBeenCalled()
    expect(runtime.scene.render).not.toHaveBeenCalled()
  })
})
