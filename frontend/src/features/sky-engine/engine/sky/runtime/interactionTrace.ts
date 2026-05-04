export interface SkyInteractionTraceTelemetry {
  counts: Record<string, number>
  durationsMs: Record<string, number>
}

export interface SkyInteractionTraceSnapshotSeed {
  atMs: number
  counts: Record<string, number>
  durationsMs: Record<string, number>
}

export function createSkyInteractionTraceTelemetry(): SkyInteractionTraceTelemetry {
  return {
    counts: {},
    durationsMs: {},
  }
}

export function incrementSkyInteractionTraceCount(
  telemetry: SkyInteractionTraceTelemetry,
  key: string,
  delta = 1,
) {
  telemetry.counts[key] = (telemetry.counts[key] ?? 0) + delta
}

export function addSkyInteractionTraceDuration(
  telemetry: SkyInteractionTraceTelemetry,
  key: string,
  durationMs: number,
) {
  if (!Number.isFinite(durationMs)) {
    return
  }

  telemetry.durationsMs[key] = (telemetry.durationsMs[key] ?? 0) + durationMs
}

export function cloneSkyInteractionTraceSeed(
  telemetry: SkyInteractionTraceTelemetry,
  atMs: number,
): SkyInteractionTraceSnapshotSeed {
  return {
    atMs,
    counts: { ...telemetry.counts },
    durationsMs: { ...telemetry.durationsMs },
  }
}
