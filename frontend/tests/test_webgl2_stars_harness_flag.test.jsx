import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import SkyEngineScene from '../src/features/sky-engine/SkyEngineScene'
import { resolveWebGL2StarsHarnessConfig } from '../src/features/sky-engine/webgl2StarsHarnessConfig'
import { resolveWebGL2StarsOwnerConfig } from '../src/features/sky-engine/webgl2StarsOwnerConfig'
import { resolveSkyDebugVisualConfig } from '../src/features/sky-engine/skyDebugVisualConfig'

function createSceneProps(harnessConfig, ownerConfig) {
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
    webgl2StarsOwnerConfig: ownerConfig,
  }
}

describe('webgl2 stars harness flag + mount behavior', () => {
  it('default query does not enable harness', () => {
    const config = resolveWebGL2StarsHarnessConfig({
      search: '',
      isDev: true,
      devOnly: true,
    })
    const ownerConfig = resolveWebGL2StarsOwnerConfig({
      search: '',
      isDev: true,
      devOnly: true,
    })

    expect(config.enabled).toBe(false)
    expect(ownerConfig.enabled).toBe(false)
    expect(config.denseVerificationGridEnabled).toBe(false)
    expect(config.realCatalogDensePresetEnabled).toBe(false)

    const html = renderToStaticMarkup(React.createElement(SkyEngineScene, createSceneProps(config, ownerConfig)))
    expect(html).not.toContain('sky-engine-scene__webgl2-harness-canvas')
    expect(html).not.toContain('sky-engine-scene__webgl2-owner-canvas')
    expect(html).toContain('WebGL2 star ownership trial: OFF')
    expect(html).toContain('Backend health: off')
    expect(html).toContain('Fallback active: no')
    expect(html).toContain('Diagnostics throttle: OFF')
  })

  it('query flag enables harness in dev mode', () => {
    const config = resolveWebGL2StarsHarnessConfig({
      search: '?webgl2StarsHarness=1&webgl2StarsHarnessMode=side-by-side',
      isDev: true,
      devOnly: true,
    })
    const ownerConfig = resolveWebGL2StarsOwnerConfig({
      search: '',
      isDev: true,
      devOnly: true,
    })

    expect(config.enabled).toBe(true)
    expect(config.mode).toBe('side-by-side')

    const html = renderToStaticMarkup(React.createElement(SkyEngineScene, createSceneProps(config, ownerConfig)))
    expect(html).toContain('sky-engine-scene__webgl2-harness-canvas')
    expect(html).toContain('WebGL2 stars comparison')
    expect(html).toContain('Diagnostic harness only. No parity claim. directStarLayer remains default.')
    expect(html).toContain('sky-engine-scene__canvas')
  })

  it('webgl2StarsOwner=1 enables explicit owner trial without changing default route behavior', () => {
    const harnessConfig = resolveWebGL2StarsHarnessConfig({
      search: '?webgl2StarsHarnessPointScale=1.8&webgl2StarsHarnessAlphaScale=1.6&webgl2StarsHarnessColorMode=white-hot',
      isDev: true,
      devOnly: true,
    })
    const ownerConfig = resolveWebGL2StarsOwnerConfig({
      search: '?webgl2StarsOwner=1',
      isDev: true,
      devOnly: true,
    })
    const debugConfig = resolveSkyDebugVisualConfig({
      search: '?skyDebugDark=1&skyDebugStarsVisible=1',
      isDev: true,
      devOnly: true,
    })

    expect(ownerConfig.enabled).toBe(true)

    const html = renderToStaticMarkup(React.createElement(SkyEngineScene, {
      ...createSceneProps(harnessConfig, ownerConfig),
      debugVisualConfig: debugConfig,
    }))

    expect(html).toContain('sky-engine-scene__webgl2-owner-canvas')
    expect(html).toContain('WebGL2 star ownership trial: ON')
    expect(html).toContain('Comparison harness: OFF')
    expect(html).toContain('Debug dark mode: ON')
    expect(html).toContain('Debug stars-visible override: ON')
    expect(html).toContain('Point style: white-hot @ size 1.80 alpha 1.60')
    expect(html).toContain('Non-default ownership trial only. Not parity complete. directStarLayer remains legacy fallback.')
  })

  it('owner mode does not remove harness diagnostics when both modes are enabled', () => {
    const harnessConfig = resolveWebGL2StarsHarnessConfig({
      search: '?webgl2StarsHarness=1&webgl2StarsHarnessMode=side-by-side',
      isDev: true,
      devOnly: true,
    })
    const ownerConfig = resolveWebGL2StarsOwnerConfig({
      search: '?webgl2StarsOwner=1',
      isDev: true,
      devOnly: true,
    })

    const html = renderToStaticMarkup(React.createElement(SkyEngineScene, createSceneProps(harnessConfig, ownerConfig)))

    expect(html).toContain('sky-engine-scene__webgl2-owner-canvas')
    expect(html).toContain('sky-engine-scene__webgl2-harness-canvas')
    expect(html).toContain('WebGL2 stars comparison')
    expect(html).toContain('Comparison harness: ON')
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

  it('owner fallback simulation stays dev-only', () => {
    const prodConfig = resolveWebGL2StarsOwnerConfig({
      search: '?webgl2StarsOwner=1&webgl2StarsOwnerForceFail=1',
      isDev: false,
      devOnly: true,
    })
    expect(prodConfig.enabled).toBe(false)
    expect(prodConfig.forceFailure).toBe(false)

    const devConfig = resolveWebGL2StarsOwnerConfig({
      search: '?webgl2StarsOwner=1&webgl2StarsOwnerForceFail=1',
      isDev: true,
      devOnly: true,
    })
    expect(devConfig.enabled).toBe(true)
    expect(devConfig.forceFailure).toBe(true)
  })
})
