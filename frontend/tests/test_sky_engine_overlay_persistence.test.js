import fs from 'node:fs'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_SKY_ENGINE_AID_VISIBILITY,
  normalizePersistedAidVisibility,
  persistAidVisibility,
  readPersistedAidVisibility,
} from '../src/features/sky-engine/aidVisibilityPersistence'

const SKY_ENGINE_PAGE_SOURCE_PATH = path.resolve(process.cwd(), 'src/pages/SkyEnginePage.tsx')
const SKY_ENGINE_SCENE_SOURCE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/SkyEngineScene.tsx')
const DIRECT_OVERLAY_LAYER_SOURCE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/directOverlayLayer.ts')

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

describe('sky engine overlay persistence defaults', () => {
  afterEach(() => {
    if (globalThis.localStorage) {
      globalThis.localStorage.clear()
    }
  })

  it('defaults all partially ported overlays to off and persists literal user choices', () => {
    globalThis.localStorage = new LocalStorageMock()

    expect(DEFAULT_SKY_ENGINE_AID_VISIBILITY).toEqual({
      constellations: false,
      azimuthRing: false,
      altitudeRings: false,
    })
    expect(readPersistedAidVisibility()).toEqual(DEFAULT_SKY_ENGINE_AID_VISIBILITY)

    persistAidVisibility({
      constellations: false,
      azimuthRing: true,
      altitudeRings: false,
    })
    expect(readPersistedAidVisibility()).toEqual({
      constellations: false,
      azimuthRing: true,
      altitudeRings: false,
    })

    persistAidVisibility({
      constellations: true,
      azimuthRing: false,
      altitudeRings: true,
    })
    expect(readPersistedAidVisibility()).toEqual({
      constellations: true,
      azimuthRing: false,
      altitudeRings: true,
    })
  })

  it('resets only malformed overlay payloads back to explicit default-off state', () => {
    globalThis.localStorage = new LocalStorageMock()
    globalThis.localStorage.setItem('astronomyHub.skyEngine.aidVisibility', '{bad json')
    expect(readPersistedAidVisibility()).toEqual(DEFAULT_SKY_ENGINE_AID_VISIBILITY)

    expect(normalizePersistedAidVisibility({ constellations: true })).toEqual({
      constellations: true,
      azimuthRing: false,
      altitudeRings: false,
    })
  })

  it('keeps skyculture selection independent from overlay activation in page and overlay sources', () => {
    const pageSource = fs.readFileSync(SKY_ENGINE_PAGE_SOURCE_PATH, 'utf8')
    const sceneSource = fs.readFileSync(SKY_ENGINE_SCENE_SOURCE_PATH, 'utf8')
    const overlaySource = fs.readFileSync(DIRECT_OVERLAY_LAYER_SOURCE_PATH, 'utf8')

    expect(pageSource).toContain('readPersistedAidVisibility')
    expect(pageSource).toContain('persistAidVisibility(aidVisibility)')
    expect(pageSource).toContain('const [aidVisibility, setAidVisibility] = useState<SkyEngineAidVisibility>(() => readPersistedAidVisibility())')
    expect(pageSource).toContain('onClick={() => setSkyCultureId(culture.id)}')
    expect(sceneSource).toContain('initialAidVisibility = DEFAULT_SKY_ENGINE_AID_VISIBILITY')
    expect(overlaySource).toContain('if (aidVisibility.constellations) {')
    expect(overlaySource).toContain('const constellationSegments = getSkyEngineSkyCulture(skyCultureId).constellations')
  })
})