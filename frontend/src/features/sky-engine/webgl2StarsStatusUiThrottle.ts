import type { WebGL2StarsHarnessDiagnostics } from './engine/sky/runtime/modules/WebGL2StarsHarnessModule'
import type { WebGL2StarsOwnerDiagnostics } from './engine/sky/runtime/modules/WebGL2StarsOwnerModule'

export const WEBGL2_STARS_STATUS_UI_COMMIT_CADENCE_MS = 1000

export function buildWebGL2StarsOwnerStatusUiImmediateKey(diagnostics: WebGL2StarsOwnerDiagnostics) {
  return [
    diagnostics.ownerTrialEnabled ? 'trial-on' : 'trial-off',
    diagnostics.backendHealthy ? 'backend-healthy' : 'backend-fallback',
    diagnostics.fallbackActive ? 'fallback-on' : 'fallback-off',
    diagnostics.backendName ?? 'backend-none',
    diagnostics.directStarLayerAvailable ? 'direct-available' : 'direct-missing',
    diagnostics.directStarLayerVisible ? 'direct-visible' : 'direct-hidden',
    diagnostics.directStarLayerStatus,
    diagnostics.fallbackReason ?? 'fallback-none',
    diagnostics.frameRenderError ?? 'render-error-none',
    diagnostics.diagnosticsThrottled ? `throttle-${diagnostics.diagnosticsThrottleMs}` : 'throttle-off',
    diagnostics.comparisonHarnessEnabled ? 'harness-on' : 'harness-off',
    diagnostics.pointScale.toFixed(2),
    diagnostics.alphaScale.toFixed(2),
    diagnostics.colorMode,
    diagnostics.debugDarkModeEnabled ? 'debug-dark-on' : 'debug-dark-off',
    diagnostics.debugStarsVisibleOverrideEnabled ? 'debug-stars-on' : 'debug-stars-off',
    diagnostics.repositoryMode,
    diagnostics.scenePacketDataMode ?? 'scene-data-none',
  ].join(':')
}

export function buildWebGL2StarsHarnessStatusUiImmediateKey(diagnostics: WebGL2StarsHarnessDiagnostics) {
  return [
    diagnostics.comparisonModeEnabled ? 'comparison-on' : 'comparison-off',
    diagnostics.comparisonMode,
    diagnostics.backendActive ? 'backend-active' : 'backend-inactive',
    diagnostics.backendName ?? 'backend-none',
    diagnostics.syntheticDenseGridEnabled ? 'dense-grid-on' : 'dense-grid-off',
    diagnostics.repositoryMode,
    diagnostics.scenePacketDataMode ?? 'scene-data-none',
    diagnostics.pointScale.toFixed(2),
    diagnostics.alphaScale.toFixed(2),
    diagnostics.colorMode,
    diagnostics.debugDarkModeEnabled ? 'debug-dark-on' : 'debug-dark-off',
    diagnostics.debugStarsVisibleOverrideEnabled ? 'debug-stars-on' : 'debug-stars-off',
  ].join(':')
}

export function shouldCommitWebGL2StarsStatusUiSnapshot(input: {
  nowMs: number
  lastCommitAtMs: number
  previousImmediateKey: string
  nextImmediateKey: string
  cadenceMs?: number
}) {
  if (input.nextImmediateKey !== input.previousImmediateKey) {
    return true
  }

  return input.nowMs - input.lastCommitAtMs >= (input.cadenceMs ?? WEBGL2_STARS_STATUS_UI_COMMIT_CADENCE_MS)
}