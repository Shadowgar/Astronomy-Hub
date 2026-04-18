import { describe, expect, it } from 'vitest'

import {
  clampHipsRenderOrder,
  hipsGetRenderOrderUnclamped,
  resolveGaiaHealpixOrder,
} from '../src/features/sky-engine/engine/sky/adapters/hipsRenderOrder'

describe('hips_get_render_order reference (hips.c)', () => {
  it('matches Stellarium formula for representative inputs', () => {
    expect(
      hipsGetRenderOrderUnclamped({ tileWidthPx: 256, windowHeightPx: 600, projectionMat11: 1 }),
    ).toBe(Math.round(Math.log2((Math.PI * 1 * 600) / (4 * Math.sqrt(2) * 256))))

    expect(
      hipsGetRenderOrderUnclamped({ tileWidthPx: 256, windowHeightPx: 1080, projectionMat11: 2 }),
    ).toBe(Math.round(Math.log2((Math.PI * 2 * 1080) / (4 * Math.sqrt(2) * 256))))
  })

  it('defaults tile width to 256 when zero', () => {
    expect(
      hipsGetRenderOrderUnclamped({ tileWidthPx: 0, windowHeightPx: 800, projectionMat11: 1.2 }),
    ).toBe(Math.round(Math.log2((Math.PI * 1.2 * 800) / (4 * Math.sqrt(2) * 256))))
  })

  it('clamps like hips_render (min/max survey order, hard cap 9)', () => {
    expect(clampHipsRenderOrder(5, 3, 8)).toBe(5)
    expect(clampHipsRenderOrder(2, 3, 8)).toBe(3)
    expect(clampHipsRenderOrder(12, 3, 15)).toBe(9)
  })

  it('resolveGaiaHealpixOrder combines quadtree level with optional viewport order', () => {
    expect(resolveGaiaHealpixOrder({ tileLevel: 0, minOrder: 3, maxOrder: 5 })).toBe(3)
    expect(
      resolveGaiaHealpixOrder({
        tileLevel: 0,
        minOrder: 3,
        maxOrder: 5,
        viewport: { windowHeightPx: 4000, projectionMat11: 4 },
      }),
    ).toBe(5)
    expect(
      resolveGaiaHealpixOrder({
        tileLevel: 1,
        minOrder: 3,
        maxOrder: 9,
        viewport: { windowHeightPx: 600, projectionMat11: 1 },
      }),
    ).toBeGreaterThanOrEqual(4)
  })
})
