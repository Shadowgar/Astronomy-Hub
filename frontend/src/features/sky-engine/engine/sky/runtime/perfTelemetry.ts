import type { SkyRuntimePerfTelemetry, SkyRuntimePerfTelemetrySnapshot } from './types'

const PERF_EMA_ALPHA = 0.2

function createEmptySnapshot(): SkyRuntimePerfTelemetrySnapshot {
  return {
    frameIndex: 0,
    shouldRenderFrame: false,
    servicesUpdateMs: 0,
    skyCoreUpdateTotalMs: 0,
    skyCoreRenderTotalMs: 0,
    renderLoopMs: 0,
    updateMs: 0,
    renderModulesMs: 0,
    sceneRenderMs: 0,
    frameTotalMs: 0,
    moduleMs: {},
    moduleUpdateMs: {},
    moduleRenderMs: {},
    stepMs: {},
    starCount: 0,
    objectCount: 0,
  }
}

function blend(left: number, right: number, alpha: number) {
  return left + (right - left) * alpha
}

function updateEmaMap(
  current: Readonly<Record<string, number>>,
  next: Readonly<Record<string, number>>,
  alpha: number,
) {
  const keys = new Set([...Object.keys(current), ...Object.keys(next)])
  const output: Record<string, number> = {}

  keys.forEach((key) => {
    output[key] = blend(current[key] ?? 0, next[key] ?? 0, alpha)
  })

  return output
}

export function createRuntimePerfTelemetry(): SkyRuntimePerfTelemetry {
  const initialSnapshot = createEmptySnapshot()
  return {
    latest: initialSnapshot,
    ema: initialSnapshot,
  }
}

export function commitRuntimePerfTelemetry(
  telemetry: SkyRuntimePerfTelemetry,
  snapshot: SkyRuntimePerfTelemetrySnapshot,
) {
  telemetry.latest = snapshot
  telemetry.ema = {
    frameIndex: snapshot.frameIndex,
    shouldRenderFrame: snapshot.shouldRenderFrame,
    servicesUpdateMs: blend(telemetry.ema.servicesUpdateMs, snapshot.servicesUpdateMs, PERF_EMA_ALPHA),
    skyCoreUpdateTotalMs: blend(telemetry.ema.skyCoreUpdateTotalMs, snapshot.skyCoreUpdateTotalMs, PERF_EMA_ALPHA),
    skyCoreRenderTotalMs: blend(telemetry.ema.skyCoreRenderTotalMs, snapshot.skyCoreRenderTotalMs, PERF_EMA_ALPHA),
    renderLoopMs: blend(telemetry.ema.renderLoopMs, snapshot.renderLoopMs, PERF_EMA_ALPHA),
    updateMs: blend(telemetry.ema.updateMs, snapshot.updateMs, PERF_EMA_ALPHA),
    renderModulesMs: blend(telemetry.ema.renderModulesMs, snapshot.renderModulesMs, PERF_EMA_ALPHA),
    sceneRenderMs: blend(telemetry.ema.sceneRenderMs, snapshot.sceneRenderMs, PERF_EMA_ALPHA),
    frameTotalMs: blend(telemetry.ema.frameTotalMs, snapshot.frameTotalMs, PERF_EMA_ALPHA),
    moduleMs: updateEmaMap(telemetry.ema.moduleMs, snapshot.moduleMs, PERF_EMA_ALPHA),
    moduleUpdateMs: updateEmaMap(telemetry.ema.moduleUpdateMs, snapshot.moduleUpdateMs, PERF_EMA_ALPHA),
    moduleRenderMs: updateEmaMap(telemetry.ema.moduleRenderMs, snapshot.moduleRenderMs, PERF_EMA_ALPHA),
    stepMs: updateEmaMap(telemetry.ema.stepMs, snapshot.stepMs, PERF_EMA_ALPHA),
    starCount: blend(telemetry.ema.starCount, snapshot.starCount, PERF_EMA_ALPHA),
    objectCount: blend(telemetry.ema.objectCount, snapshot.objectCount, PERF_EMA_ALPHA),
  }
}
