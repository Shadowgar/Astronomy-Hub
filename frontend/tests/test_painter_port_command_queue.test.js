import { describe, expect, it } from 'vitest'

import {
  SkyPainterFrameId,
  SkyPainterMode,
  SkyPainterTextureSlot,
  createSkyPainterPortState,
} from '../src/features/sky-engine/engine/sky/runtime/renderer/painterPort'

describe('painterPort command queue (CPU-side)', () => {
  it('resets per-frame commands, records typed intents, and finalizes on finish', () => {
    const painter = createSkyPainterPortState()

    painter.reset_for_frame({
      frameIndex: 1,
      windowWidth: 1280,
      windowHeight: 720,
      pixelScale: 1,
      framebufferWidth: 1280,
      framebufferHeight: 720,
      starsLimitMag: 6,
      hintsLimitMag: 6,
      hardLimitMag: 8,
    })

    painter.paint_prepare(1280, 720, 1)
    expect(painter.drawQueue).toHaveLength(2)
    expect(painter.drawQueue[0]).toMatchObject({
      fn: 'painter_update_clip_info',
      kind: 'painter_update_clip_info',
      frameIndex: 1,
      sequence: 1,
      payload: {
        clipInfoValid: true,
        viewportWidth: 1280,
        viewportHeight: 720,
        activeFrameId: SkyPainterFrameId.FRAME_OBSERVED,
        boundingCapValid: true,
        skyCapValid: true,
      },
    })
    expect(painter.drawQueue[1]).toMatchObject({
      fn: 'paint_prepare',
      kind: 'paint_prepare',
      frameIndex: 1,
      sequence: 2,
      payload: {
        windowWidth: 1280,
        windowHeight: 720,
        pixelScale: 1,
      },
    })

    painter.painter_set_texture(SkyPainterTextureSlot.PAINTER_TEX_COLOR, 'stars-atlas')
    painter.paint_stars_draw_intent({
      fromDirectStarPath: true,
      starCount: 5,
      source: {
        dataMode: 'multi-survey',
        sourceLabel: 'survey',
        scenePacketStarCount: 5,
        scenePacketTileCount: 1,
        diagnosticsActiveTiles: 1,
        diagnosticsVisibleTileIdsCount: 1,
        diagnosticsStarsListVisitCount: 5,
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
        fovDegrees: 60,
        viewportWidth: 1280,
        viewportHeight: 720,
        centerDirection: { x: 0, y: 0, z: 1 },
        sceneTimestampIso: '2026-04-26T00:00:00Z',
      },
    })
    painter.paint_mesh(SkyPainterMode.MODE_TRIANGLES)
    painter.paint_texture('stars-atlas')

    const textureIntent = painter.drawQueue.find((command) => command.kind === 'paint_texture')
    expect(textureIntent).toBeTruthy()
    expect(textureIntent).toMatchObject({
      fn: 'paint_texture',
      kind: 'paint_texture',
      payload: { textureRef: 'stars-atlas' },
    })

    painter.paint_finish()

    expect(painter.isFrameFinalized).toBe(true)
    expect(painter.finalizedCommands.length).toBeGreaterThan(0)
    expect(painter.finalizedCommands.at(-1)).toMatchObject({
      fn: 'paint_finish',
      kind: 'paint_finish',
      payload: { finalized: true },
    })
    expect(painter.finalizedBatches).toHaveLength(1)
    expect(painter.finalizedBatches[0]).toMatchObject({
      kind: 'stars',
      sourceCommandKind: 'paint_stars_draw_intent',
      frameIndex: 1,
      starCount: 5,
      sourcePath: 'direct-star-mirror',
      executionStatus: 'not_executed',
    })

    const finalizedCount = painter.finalizedCommands.length
    painter.paint_line()
    painter.paint_texture('should-not-record-after-finish')
    expect(painter.finalizedCommands).toHaveLength(finalizedCount)
    expect(painter.drawQueue).toHaveLength(finalizedCount)
    expect(painter.finalizedBatches).toHaveLength(1)
    expect(painter.drawQueue.some((command) => command.kind === 'paint_line')).toBe(false)

    // Queue remains inert and CPU-side in this slice.
    expect(painter.finalizedCommands.every((command) => typeof command.frameIndex === 'number')).toBe(true)
    expect(painter.finalizedCommands.every((command) => typeof command.sequence === 'number')).toBe(true)

    painter.reset_for_frame({
      frameIndex: 2,
      windowWidth: 800,
      windowHeight: 600,
      pixelScale: 1,
      framebufferWidth: 800,
      framebufferHeight: 600,
      starsLimitMag: 5,
      hintsLimitMag: 5,
      hardLimitMag: 7,
    })

    expect(painter.isFrameFinalized).toBe(false)
    expect(painter.drawQueue).toHaveLength(0)
    expect(painter.finalizedCommands).toHaveLength(0)
    expect(painter.finalizedBatches).toHaveLength(0)
  })
})
