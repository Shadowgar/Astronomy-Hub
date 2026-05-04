import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import SkyEngineScene from '../src/features/sky-engine/SkyEngineScene'
import { resolveWebGL2StarsHarnessConfig } from '../src/features/sky-engine/webgl2StarsHarnessConfig'
import { resolveWebGL2StarsOwnerConfig } from '../src/features/sky-engine/webgl2StarsOwnerConfig'
import {
  buildWebGL2StarsHarnessStatusUiImmediateKey,
  buildWebGL2StarsOwnerStatusUiImmediateKey,
  shouldCommitWebGL2StarsStatusUiSnapshot,
  WEBGL2_STARS_STATUS_UI_COMMIT_CADENCE_MS,
} from '../src/features/sky-engine/webgl2StarsStatusUiThrottle'
import { resolveSkyDebugVisualConfig } from '../src/features/sky-engine/skyDebugVisualConfig'
import { resolveWebGL2StarsPerfTraceConfig } from '../src/features/sky-engine/webgl2StarsPerfTraceConfig'

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

function createOwnerDiagnostics(overrides = {}) {
  return {
    ownerTrialEnabled: true,
    backendHealthy: true,
    fallbackActive: false,
    backendName: 'webgl2-stellarium-shell',
    submittedPointCount: 646,
    drawnPointCount: 646,
    submittedPointItemCount: 1,
    drawnPointItemCount: 1,
    skippedUnsupportedItemCount: 0,
    directStarLayerStarCount: 646,
    directStarLayerAvailable: true,
    directStarLayerVisible: false,
    directStarLayerStatus: 'suppressed',
    fallbackReason: null,
    frameRenderError: null,
    frameIndex: 26,
    note: null,
    prepareFrameMs: 0,
    submitFrameMs: 0,
    renderFrameMs: 0,
    totalFrameMs: 0,
    frameDeltaMs: 535.7,
    approximateFps: 1.9,
    diagnosticsThrottled: true,
    diagnosticsThrottleMs: 250,
    lastSuccessfulFrameCount: 26,
    lastSuccessfulFrameAtIso: '2026-05-04T13:18:37.752Z',
    repositoryMode: 'hipparcos',
    scenePacketDataMode: 'hipparcos',
    scenePacketSourceLabel: 'Hipparcos · 8,870 stars',
    scenePacketLimitingMagnitude: 5.78,
    scenePacketStarsListVisitCount: 0,
    scenePacketStarCount: 8870,
    rendererBoundaryPointCount: 646,
    comparisonHarnessEnabled: false,
    pointScale: 1.8,
    alphaScale: 1.6,
    colorMode: 'white-hot',
    debugDarkModeEnabled: true,
    debugStarsVisibleOverrideEnabled: true,
    ...overrides,
  }
}

function createHarnessDiagnostics(overrides = {}) {
  return {
    comparisonModeEnabled: true,
    comparisonMode: 'side-by-side',
    backendActive: true,
    backendName: 'webgl2-stellarium-shell',
    submittedPointCount: 575,
    drawnPointCount: 575,
    submittedPointItemCount: 1,
    drawnPointItemCount: 1,
    directStarLayerStarCount: 575,
    frameIndex: 42,
    note: null,
    syntheticDenseGridEnabled: false,
    syntheticDensePointCount: 0,
    repositoryMode: 'hipparcos',
    scenePacketDataMode: 'hipparcos',
    scenePacketSourceLabel: 'Hipparcos · 8,870 stars',
    scenePacketLimitingMagnitude: 5.78,
    scenePacketStarsListVisitCount: 0,
    scenePacketStarCount: 8870,
    rendererBoundaryPointCount: 575,
    pointScale: 1,
    alphaScale: 1,
    colorMode: 'payload',
    debugDarkModeEnabled: true,
    debugStarsVisibleOverrideEnabled: true,
    ...overrides,
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

  it('perf trace flags remain explicit opt-in and keep status UI enabled by default', () => {
    const defaultConfig = resolveWebGL2StarsPerfTraceConfig({
      search: '',
      isDev: true,
      devOnly: true,
    })

    expect(defaultConfig.perfTraceEnabled).toBe(false)
    expect(defaultConfig.statusUiEnabled).toBe(true)
    expect(defaultConfig.diagnosticsWritesEnabled).toBe(true)

    const devConfig = resolveWebGL2StarsPerfTraceConfig({
      search: '?webgl2StarsPerfTrace=1&webgl2StarsStatusUi=0&webgl2StarsDiagnosticsWrites=0',
      isDev: true,
      devOnly: true,
    })

    expect(devConfig.perfTraceEnabled).toBe(true)
    expect(devConfig.statusUiEnabled).toBe(false)
    expect(devConfig.diagnosticsWritesEnabled).toBe(false)
  })

  it('owner status UI immediate key ignores per-frame counters and timing churn', () => {
    const baseline = createOwnerDiagnostics()
    const timingOnlyChange = createOwnerDiagnostics({
      submittedPointCount: 712,
      drawnPointCount: 712,
      frameIndex: 39,
      frameDeltaMs: 16.7,
      approximateFps: 59.9,
      lastSuccessfulFrameCount: 39,
      lastSuccessfulFrameAtIso: '2026-05-04T13:18:41.000Z',
      totalFrameMs: 0.03,
      rendererBoundaryPointCount: 712,
    })

    expect(buildWebGL2StarsOwnerStatusUiImmediateKey(timingOnlyChange)).toBe(
      buildWebGL2StarsOwnerStatusUiImmediateKey(baseline),
    )

    const structuralChange = createOwnerDiagnostics({ backendHealthy: false, fallbackActive: true, fallbackReason: 'renderer failed' })
    expect(buildWebGL2StarsOwnerStatusUiImmediateKey(structuralChange)).not.toBe(
      buildWebGL2StarsOwnerStatusUiImmediateKey(baseline),
    )
  })

  it('harness status UI immediate key ignores render-count churn', () => {
    const baseline = createHarnessDiagnostics()
    const countOnlyChange = createHarnessDiagnostics({
      submittedPointCount: 910,
      drawnPointCount: 910,
      directStarLayerStarCount: 910,
      scenePacketStarCount: 9100,
      rendererBoundaryPointCount: 910,
    })

    expect(buildWebGL2StarsHarnessStatusUiImmediateKey(countOnlyChange)).toBe(
      buildWebGL2StarsHarnessStatusUiImmediateKey(baseline),
    )

    const structuralChange = createHarnessDiagnostics({ backendActive: false, backendName: null })
    expect(buildWebGL2StarsHarnessStatusUiImmediateKey(structuralChange)).not.toBe(
      buildWebGL2StarsHarnessStatusUiImmediateKey(baseline),
    )
  })

  it('status UI snapshots commit on structural changes or cadence expiry only', () => {
    expect(shouldCommitWebGL2StarsStatusUiSnapshot({
      nowMs: 10,
      lastCommitAtMs: Number.NEGATIVE_INFINITY,
      previousImmediateKey: '',
      nextImmediateKey: 'baseline',
      cadenceMs: WEBGL2_STARS_STATUS_UI_COMMIT_CADENCE_MS,
    })).toBe(true)

    expect(shouldCommitWebGL2StarsStatusUiSnapshot({
      nowMs: 200,
      lastCommitAtMs: 0,
      previousImmediateKey: 'baseline',
      nextImmediateKey: 'baseline',
      cadenceMs: WEBGL2_STARS_STATUS_UI_COMMIT_CADENCE_MS,
    })).toBe(false)

    expect(shouldCommitWebGL2StarsStatusUiSnapshot({
      nowMs: WEBGL2_STARS_STATUS_UI_COMMIT_CADENCE_MS + 1,
      lastCommitAtMs: 0,
      previousImmediateKey: 'baseline',
      nextImmediateKey: 'baseline',
      cadenceMs: WEBGL2_STARS_STATUS_UI_COMMIT_CADENCE_MS,
    })).toBe(true)

    expect(shouldCommitWebGL2StarsStatusUiSnapshot({
      nowMs: 200,
      lastCommitAtMs: 0,
      previousImmediateKey: 'baseline',
      nextImmediateKey: 'structural-change',
      cadenceMs: WEBGL2_STARS_STATUS_UI_COMMIT_CADENCE_MS,
    })).toBe(true)
  })
})
