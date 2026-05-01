import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import SkyEngineScene from '../src/features/sky-engine/SkyEngineScene'
import { resolveWebGL2StarsHarnessConfig } from '../src/features/sky-engine/webgl2StarsHarnessConfig'
import { resolveSkyDebugVisualConfig } from '../src/features/sky-engine/skyDebugVisualConfig'

function createSceneProps(harnessConfig) {
  return {
    backendStars: [],
    backendSatellites: [],
    initialSceneTimestampIso: '2026-05-01T00:00:00Z',
    observer: {
      label: 'Test Observer',
      latitude: 40,
      longitude: -74,
      elevationFt: 0,
    },
    initialViewState: {
      fovDegrees: 60,
      centerAltDeg: 30,
      centerAzDeg: 180,
    },
    projectionMode: 'stereographic',
    repositoryMode: 'hipparcos',
    snapshotStore: {
      reset: () => undefined,
    },
    webgl2StarsHarnessConfig: harnessConfig,
  }
}

describe('webgl2 stars harness flag + mount behavior', () => {
  it('default query does not enable harness', () => {
    const config = resolveWebGL2StarsHarnessConfig({
      search: '',
      isDev: true,
      devOnly: true,
    })

    expect(config.enabled).toBe(false)
    expect(config.denseVerificationGridEnabled).toBe(false)
    expect(config.realCatalogDensePresetEnabled).toBe(false)

    const html = renderToStaticMarkup(React.createElement(SkyEngineScene, createSceneProps(config)))
    expect(html).not.toContain('sky-engine-scene__webgl2-harness-canvas')
  })

  it('query flag enables harness in dev mode', () => {
    const config = resolveWebGL2StarsHarnessConfig({
      search: '?webgl2StarsHarness=1&webgl2StarsHarnessMode=side-by-side',
      isDev: true,
      devOnly: true,
    })

    expect(config.enabled).toBe(true)
    expect(config.mode).toBe('side-by-side')

    const html = renderToStaticMarkup(React.createElement(SkyEngineScene, createSceneProps(config)))
    expect(html).toContain('sky-engine-scene__webgl2-harness-canvas')
    expect(html).toContain('WebGL2 stars comparison')
    expect(html).toContain('Diagnostic harness only. No parity claim. directStarLayer remains default.')
    expect(html).toContain('sky-engine-scene__canvas')
  })

  it('real catalog dense preset is dev-only and opt-in', () => {
    const prodConfig = resolveWebGL2StarsHarnessConfig({
      search: '?webgl2StarsHarnessRealCatalogDensePreset=1',
      isDev: false,
      devOnly: true,
    })
    expect(prodConfig.realCatalogDensePresetEnabled).toBe(false)

    const devConfig = resolveWebGL2StarsHarnessConfig({
      search: '?webgl2StarsHarnessRealCatalogDensePreset=1',
      isDev: true,
      devOnly: true,
    })
    expect(devConfig.realCatalogDensePresetEnabled).toBe(true)
    expect(devConfig.realCatalogDensePresetAtIso).toBe('2026-05-01T02:00:00Z')
  })

  it('step 9 point style controls parse and clamp safely', () => {
    const config = resolveWebGL2StarsHarnessConfig({
      search: '?webgl2StarsHarnessPointScale=99&webgl2StarsHarnessAlphaScale=-4&webgl2StarsHarnessColorMode=gray',
      isDev: true,
      devOnly: true,
    })

    expect(config.pointScale).toBe(6)
    expect(config.alphaScale).toBe(0.1)
    expect(config.colorMode).toBe('grayscale')
  })

  it('debug dark and stars-visible flags remain off by default and are explicit opt-in', () => {
    const defaultConfig = resolveSkyDebugVisualConfig({
      search: '',
      isDev: true,
      devOnly: true,
    })
    expect(defaultConfig.darkSkyOverrideEnabled).toBe(false)
    expect(defaultConfig.starsVisibleOverrideEnabled).toBe(false)

    const devConfig = resolveSkyDebugVisualConfig({
      search: '?skyDebugDark=1&skyDebugStarsVisible=1',
      isDev: true,
      devOnly: true,
    })
    expect(devConfig.darkSkyOverrideEnabled).toBe(true)
    expect(devConfig.starsVisibleOverrideEnabled).toBe(true)

    const prodConfig = resolveSkyDebugVisualConfig({
      search: '?skyDebugDark=1&skyDebugStarsVisible=1',
      isDev: false,
      devOnly: true,
    })
    expect(prodConfig.darkSkyOverrideEnabled).toBe(false)
    expect(prodConfig.starsVisibleOverrideEnabled).toBe(false)
  })
})
