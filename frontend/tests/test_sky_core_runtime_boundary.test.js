import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const SKY_ENGINE_SCENE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/SkyEngineScene.tsx')
const SKY_CORE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/engine/sky/runtime/SkyCore.ts')
const SKY_MODULE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/engine/sky/runtime/SkyModule.ts')
const SKY_RUNTIME_BRIDGE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/SkyEngineRuntimeBridge.ts')

describe('sky core runtime boundary', () => {
  it('moves babylon lifecycle ownership behind SkyCore', () => {
    const sceneSource = fs.readFileSync(SKY_ENGINE_SCENE_PATH, 'utf8')
    const coreSource = fs.readFileSync(SKY_CORE_PATH, 'utf8')
    const moduleSource = fs.readFileSync(SKY_MODULE_PATH, 'utf8')
    const bridgeSource = fs.readFileSync(SKY_RUNTIME_BRIDGE_PATH, 'utf8')

    expect(sceneSource).toContain('new SkyCore')
    expect(sceneSource).not.toContain('new Engine(')
    expect(sceneSource).not.toContain('new Scene(')
    expect(sceneSource).not.toContain('runRenderLoop(')
    expect(sceneSource).not.toContain("addEventListener('wheel'")
    expect(sceneSource).not.toContain("addEventListener('pointerdown'")
    expect(sceneSource).not.toContain('dispatchInput(')
    expect(coreSource).toContain('start()')
    expect(coreSource).toContain('stop()')
    expect(coreSource).toContain('update(deltaSeconds')
    expect(coreSource).toContain('render()')
    expect(coreSource).toContain('registerModule(')
    expect(coreSource).toContain('runRenderLoop')
    expect(coreSource).toContain('startServices')
    expect(coreSource).toContain('updateServices')
    expect(coreSource).toContain('stopServices')
    expect(moduleSource).toContain('renderOrder')
    expect(bridgeSource).toContain('createSkySceneBridgeModule')
    expect(bridgeSource).toContain('createSceneRuntimeState')
  })
})
