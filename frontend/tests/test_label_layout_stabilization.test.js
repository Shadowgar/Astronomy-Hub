import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { shouldKeepStableLabelVisibility } from '../src/features/sky-engine/labelManager'

const DIRECT_OVERLAY_LAYER_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/directOverlayLayer.ts')

describe('sky engine label stabilization slice', () => {
  it('keeps previously visible labels through marginal overlap and motion only', () => {
    const previousState = {
      wasVisible: true,
      rectangle: { x: 100, y: 100, width: 176, height: 48 },
      inViewport: true,
      projectedX: 188,
      projectedY: 124,
      projectedDepth: 0.42,
      scale: 1,
      priority: 50,
      signature: 'Sirius:priority',
      markerRadiusPx: 10,
      occluded: false,
    }

    expect(shouldKeepStableLabelVisibility(
      previousState,
      {
        rectangle: { x: 108, y: 104, width: 176, height: 48 },
        inViewport: true,
        projectedDepth: 0.45,
        priority: 44,
      },
      { x: 0, y: 0, width: 1280, height: 720 },
      0.12,
    )).toBe(true)

    expect(shouldKeepStableLabelVisibility(
      previousState,
      {
        rectangle: { x: 156, y: 136, width: 176, height: 48 },
        inViewport: true,
        projectedDepth: 0.45,
        priority: 44,
      },
      { x: 0, y: 0, width: 1280, height: 720 },
      0.12,
    )).toBe(false)
  })

  it('uses cached textures and transform-only label reuse in the overlay layer', () => {
    const overlaySource = fs.readFileSync(DIRECT_OVERLAY_LAYER_PATH, 'utf8')

    expect(overlaySource).toContain('labelTextureCache')
    expect(overlaySource).toContain('reusePreviousLabelLayout')
    expect(overlaySource).toContain('shouldForceLabelRelayout')
    expect(overlaySource).not.toContain('meshEntry.texture.dispose()')
  })
})
