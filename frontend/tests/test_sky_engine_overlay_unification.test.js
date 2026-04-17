import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const SKY_ENGINE_SCENE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/SkyEngineScene.tsx')
const SKY_ENGINE_RUNTIME_BRIDGE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/SkyEngineRuntimeBridge.ts')
const DIRECT_OVERLAY_LAYER_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/directOverlayLayer.ts')
const DIRECT_BACKGROUND_LAYER_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/directBackgroundLayer.ts')

describe('sky engine overlay unification slice', () => {
  it('removes overlay canvas ownership from the active render path', () => {
    const sceneSource = fs.readFileSync(SKY_ENGINE_SCENE_PATH, 'utf8')
    const bridgeSource = fs.readFileSync(SKY_ENGINE_RUNTIME_BRIDGE_PATH, 'utf8')
    const overlaySource = fs.readFileSync(DIRECT_OVERLAY_LAYER_PATH, 'utf8')
    const backgroundSource = fs.readFileSync(DIRECT_BACKGROUND_LAYER_PATH, 'utf8')

    expect(sceneSource).toContain('new SkyCore')
    expect(bridgeSource).toContain('createDirectOverlayLayer')
    expect(overlaySource).toContain('resolveLabelLayout')
    expect(overlaySource).toContain('prepareDirectOverlayFrame')
    expect(bridgeSource).toContain('createDirectBackgroundLayer')
    expect(backgroundSource).toContain('sync')
    expect(bridgeSource).toContain('DENSITY_STARS_CANVAS_FALLBACK')
    expect(sceneSource).toContain('backgroundCanvasRef')
    expect(sceneSource).not.toContain('overlayCanvasRef')
    expect(sceneSource).not.toContain('sky-engine-scene__overlay')
    expect(bridgeSource).not.toContain('drawAidLayers(')
    expect(bridgeSource).not.toContain('drawTrajectory(')
    expect(bridgeSource).not.toContain('drawPacketLabels(')
    expect(bridgeSource).not.toContain('drawLabels(')
    expect(bridgeSource).not.toContain('drawBackground(')
    expect(bridgeSource).not.toContain('drawProceduralSkyBackdrop(')
    expect(bridgeSource).not.toContain('drawSolarGlare(')
    expect(bridgeSource).not.toContain('drawLandscapeMask(')
    expect(overlaySource).not.toContain('OVERLAY_SYNC_CADENCE_MS')
  })
})
