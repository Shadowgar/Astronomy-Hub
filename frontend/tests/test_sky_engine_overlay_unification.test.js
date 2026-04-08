import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const SKY_ENGINE_SCENE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/SkyEngineScene.tsx')
const DIRECT_OVERLAY_LAYER_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/directOverlayLayer.ts')

describe('sky engine overlay unification slice', () => {
  it('removes overlay canvas ownership from the active render path', () => {
    const sceneSource = fs.readFileSync(SKY_ENGINE_SCENE_PATH, 'utf8')
    const overlaySource = fs.readFileSync(DIRECT_OVERLAY_LAYER_PATH, 'utf8')

    expect(sceneSource).toContain('createDirectOverlayLayer')
    expect(overlaySource).toContain('resolveLabelLayout')
    expect(sceneSource).not.toContain('overlayCanvasRef')
    expect(sceneSource).not.toContain('sky-engine-scene__overlay')
    expect(sceneSource).not.toContain('drawAidLayers(')
    expect(sceneSource).not.toContain('drawTrajectory(')
    expect(sceneSource).not.toContain('drawPacketLabels(')
    expect(sceneSource).not.toContain('drawLabels(')
  })
})
