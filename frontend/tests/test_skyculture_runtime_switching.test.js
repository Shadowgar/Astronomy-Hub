import fs from 'node:fs'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
  normalizeSkyCultureId,
  persistSkyCultureId,
  readPersistedSkyCultureId,
} from '../src/features/sky-engine/skyCultureSelection'

const SKY_ENGINE_PAGE_SOURCE_PATH = path.resolve(process.cwd(), 'src/pages/SkyEnginePage.tsx')
const SKY_ENGINE_SCENE_SOURCE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/SkyEngineScene.tsx')
const SKY_ENGINE_RUNTIME_BRIDGE_SOURCE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/SkyEngineRuntimeBridge.ts')
const OVERLAY_RUNTIME_MODULE_SOURCE_PATH = path.resolve(
  process.cwd(),
  'src/features/sky-engine/engine/sky/runtime/modules/OverlayRuntimeModule.ts',
)

class LocalStorageMock {
  constructor() {
    this.store = new Map()
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null
  }

  setItem(key, value) {
    this.store.set(key, String(value))
  }

  removeItem(key) {
    this.store.delete(key)
  }

  clear() {
    this.store.clear()
  }
}

describe('skyculture runtime switching and persistence', () => {
  afterEach(() => {
    if (globalThis.localStorage) {
      globalThis.localStorage.clear()
    }
  })

  it('normalizes and persists selected skyculture ids', () => {
    globalThis.localStorage = new LocalStorageMock()
    expect(readPersistedSkyCultureId()).toBe('western')

    persistSkyCultureId('belarusian')
    expect(readPersistedSkyCultureId()).toBe('belarusian')

    persistSkyCultureId('invalid-culture-id')
    expect(readPersistedSkyCultureId()).toBe('western')
    expect(normalizeSkyCultureId('invalid-culture-id')).toBe('western')
  })

  it('wires skyculture selection from page state into runtime scene props', () => {
    const pageSource = fs.readFileSync(SKY_ENGINE_PAGE_SOURCE_PATH, 'utf8')
    const sceneSource = fs.readFileSync(SKY_ENGINE_SCENE_SOURCE_PATH, 'utf8')
    const runtimeBridgeSource = fs.readFileSync(SKY_ENGINE_RUNTIME_BRIDGE_SOURCE_PATH, 'utf8')
    const overlayModuleSource = fs.readFileSync(OVERLAY_RUNTIME_MODULE_SOURCE_PATH, 'utf8')

    expect(pageSource).toContain('readPersistedSkyCultureId')
    expect(pageSource).toContain('persistSkyCultureId')
    expect(pageSource).toContain('initialSkyCultureId={skyCultureId}')
    expect(pageSource).toContain('sceneRef.current?.setSkyCultureId(skyCultureId)')
    expect(sceneSource).toContain('setSkyCultureId(skyCultureId)')
    expect(sceneSource).toContain('skyCultureId: skyCultureIdRef.current')
    expect(runtimeBridgeSource).toContain('readonly skyCultureId: string')
    expect(overlayModuleSource).toContain('latest.skyCultureId')
  })
})
