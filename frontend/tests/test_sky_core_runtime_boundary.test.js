import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const SKY_ENGINE_SCENE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/SkyEngineScene.tsx')
const SKY_CORE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/engine/sky/runtime/SkyCore.ts')
const SKY_MODULE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/engine/sky/runtime/SkyModule.ts')
const SKY_RUNTIME_BRIDGE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/SkyEngineRuntimeBridge.ts')
const BACKGROUND_RUNTIME_MODULE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/engine/sky/runtime/modules/BackgroundRuntimeModule.ts')
const STARS_RUNTIME_MODULE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts')
const OBJECT_RUNTIME_MODULE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/engine/sky/runtime/modules/ObjectRuntimeModule.ts')
const OVERLAY_RUNTIME_MODULE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/engine/sky/runtime/modules/OverlayRuntimeModule.ts')

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

  it('registers explicit runtime modules for background, stars, objects, and overlays', () => {
    const sceneSource = fs.readFileSync(SKY_ENGINE_SCENE_PATH, 'utf8')
    const bridgeSource = fs.readFileSync(SKY_RUNTIME_BRIDGE_PATH, 'utf8')
    const backgroundModuleSource = fs.readFileSync(BACKGROUND_RUNTIME_MODULE_PATH, 'utf8')
    const starsModuleSource = fs.readFileSync(STARS_RUNTIME_MODULE_PATH, 'utf8')
    const objectModuleSource = fs.readFileSync(OBJECT_RUNTIME_MODULE_PATH, 'utf8')
    const overlayModuleSource = fs.readFileSync(OVERLAY_RUNTIME_MODULE_PATH, 'utf8')

    expect(sceneSource).toContain('createBackgroundRuntimeModule')
    expect(sceneSource).toContain('createStarsModule')
    expect(sceneSource).toContain('createObjectRuntimeModule')
    expect(sceneSource).toContain('createOverlayRuntimeModule')

    expect(backgroundModuleSource).toContain("id: 'sky-background-runtime-module'")
    expect(starsModuleSource).toContain("id: 'sky-stars-runtime-module'")
    expect(objectModuleSource).toContain("id: 'sky-object-runtime-module'")
    expect(overlayModuleSource).toContain("id: 'sky-overlay-runtime-module'")
    expect(starsModuleSource).toContain('collectProjectedStars(')
    expect(objectModuleSource).toContain('collectProjectedNonStarObjects(')
    expect(objectModuleSource).not.toContain('collectProjectedStars(')

    expect(bridgeSource).not.toContain('function renderSceneFrame')
    expect(bridgeSource).not.toContain('function collectProjectedObjects')
    expect(bridgeSource).not.toContain('function drawSyntheticDensityStars')
  })

  it('registers runtime modules in explicit render order and keeps the bridge last', () => {
    const sceneSource = fs.readFileSync(SKY_ENGINE_SCENE_PATH, 'utf8')
    const backgroundModuleSource = fs.readFileSync(BACKGROUND_RUNTIME_MODULE_PATH, 'utf8')
    const starsModuleSource = fs.readFileSync(STARS_RUNTIME_MODULE_PATH, 'utf8')
    const objectModuleSource = fs.readFileSync(OBJECT_RUNTIME_MODULE_PATH, 'utf8')
    const overlayModuleSource = fs.readFileSync(OVERLAY_RUNTIME_MODULE_PATH, 'utf8')
    const bridgeSource = fs.readFileSync(SKY_RUNTIME_BRIDGE_PATH, 'utf8')

    const backgroundRegistrationIndex = sceneSource.indexOf('core.registerModule(createBackgroundRuntimeModule())')
    const starsRegistrationIndex = sceneSource.indexOf('core.registerModule(createStarsModule())')
    const objectRegistrationIndex = sceneSource.indexOf('core.registerModule(createObjectRuntimeModule())')
    const overlayRegistrationIndex = sceneSource.indexOf('core.registerModule(createOverlayRuntimeModule())')
    const bridgeRegistrationIndex = sceneSource.indexOf('core.registerModule(createSkySceneBridgeModule())')

    expect(backgroundRegistrationIndex).toBeGreaterThan(-1)
    expect(starsRegistrationIndex).toBeGreaterThan(backgroundRegistrationIndex)
    expect(objectRegistrationIndex).toBeGreaterThan(starsRegistrationIndex)
    expect(overlayRegistrationIndex).toBeGreaterThan(objectRegistrationIndex)
    expect(bridgeRegistrationIndex).toBeGreaterThan(overlayRegistrationIndex)

    expect(backgroundModuleSource).toContain('renderOrder: 10')
    expect(starsModuleSource).toContain('renderOrder: 20')
    expect(objectModuleSource).toContain('renderOrder: 30')
    expect(overlayModuleSource).toContain('renderOrder: 40')
    expect(bridgeSource).toContain('renderOrder: 100')
  })

  it('keeps the bridge as compatibility reporting instead of render-orchestration ownership', () => {
    const bridgeSource = fs.readFileSync(SKY_RUNTIME_BRIDGE_PATH, 'utf8')

    expect(bridgeSource).toContain('writeSceneState({')
    expect(bridgeSource).toContain('writeSkyEnginePickTargets')
    expect(bridgeSource).not.toContain('prepareDirectBackgroundFrame')
    expect(bridgeSource).not.toContain('prepareDirectOverlayFrame')
    expect(bridgeSource).not.toContain('collectProjectedObjects(')
    expect(bridgeSource).not.toContain('runtime.directObjectLayer.sync(')
    expect(bridgeSource).not.toContain('runtime.directOverlayLayer.sync(')
    expect(bridgeSource).not.toContain('runtime.directBackgroundLayer.sync(')
  })
})
