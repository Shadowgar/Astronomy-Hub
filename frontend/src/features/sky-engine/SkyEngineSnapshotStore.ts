import { useEffect, useRef, useState } from 'react'

import type { SkyEngineSceneObject, SkyEngineSunPhase } from './types'

export interface SkyEngineCameraSnapshot {
  readonly centerAltDeg: number
  readonly centerAzDeg: number
  readonly fovDegrees: number
}

export interface SkyEngineSelectionSnapshot {
  readonly object: SkyEngineSceneObject | null
  readonly status: 'idle' | 'active' | 'hidden'
  readonly hiddenName: string | null
}

export interface SkyEngineRuntimeSummarySnapshot {
  readonly phaseLabel: SkyEngineSunPhase
  readonly visibleObjectCount: number
  readonly guidedObjectCount: number
  readonly visibleLabelCount: number
  readonly backendStarCount: number
  readonly renderedStarCount: number
  readonly lodTier: 'wide' | 'medium' | 'close'
  readonly labelCap: number
  readonly dataMode: 'mock' | 'hipparcos' | 'gaia' | 'multi-survey' | 'loading'
  readonly sourceLabel: string
  readonly fallbackActive: boolean
  readonly sceneOffsetSeconds: number
  readonly playbackRate: number
  readonly moonPhaseLabel: string | null
  readonly moonAboveHorizon: boolean
}

export interface SkyEngineRuntimeSnapshot {
  readonly timestampIso: string
  readonly camera: SkyEngineCameraSnapshot
  readonly selection: SkyEngineSelectionSnapshot
  readonly summary: SkyEngineRuntimeSummarySnapshot
}

type SnapshotVisibilityState = DocumentVisibilityState | 'unknown'

export interface SkyEngineSnapshotCadenceChannelMetrics {
  readonly totalCount: number
  readonly perSecond: number
  readonly lastIntervalMs: number | null
  readonly meanIntervalMs: number | null
  readonly lastTimestampMs: number | null
  readonly lastVisibilityState: SnapshotVisibilityState
}

export interface SkyEngineSnapshotCadenceMetrics {
  readonly intendedCadenceMs: number
  readonly intendedCadenceHz: number
  readonly actualCadenceMs: number | null
  readonly actualCadenceHz: number | null
  readonly engine: SkyEngineSnapshotCadenceChannelMetrics & {
    readonly backgroundThrottleDetected: boolean
  }
  readonly ui: SkyEngineSnapshotCadenceChannelMetrics & {
    readonly activeSubscriberCount: number
  }
}

export interface SkyEngineSnapshotStore {
  getSnapshot: () => SkyEngineRuntimeSnapshot
  getLatestSnapshot: () => SkyEngineRuntimeSnapshot
  getCadenceMetrics: () => SkyEngineSnapshotCadenceMetrics
  subscribe: (listener: () => void) => () => void
  publish: (
    snapshot: SkyEngineRuntimeSnapshot,
    options?: { force?: boolean; sourceAtMs?: number; visibilityState?: SnapshotVisibilityState },
  ) => void
  recordUiReceive: (atMs?: number, visibilityState?: SnapshotVisibilityState) => void
  reset: () => void
}

export const SKY_ENGINE_SNAPSHOT_POLL_CADENCE_MS = 200

type SnapshotCadenceSeries = {
  totalCount: number
  timestampsMs: number[]
  intervalsMs: number[]
  lastIntervalMs: number | null
  lastTimestampMs: number | null
  lastVisibilityState: SnapshotVisibilityState
  backgroundThrottleDetected: boolean
}

const EMPTY_CAMERA_SNAPSHOT: SkyEngineCameraSnapshot = {
  centerAltDeg: 0,
  centerAzDeg: 0,
  fovDegrees: 120,
}

const EMPTY_SELECTION_SNAPSHOT: SkyEngineSelectionSnapshot = {
  object: null,
  status: 'idle',
  hiddenName: null,
}

const EMPTY_SUMMARY_SNAPSHOT: SkyEngineRuntimeSummarySnapshot = {
  phaseLabel: 'Night',
  visibleObjectCount: 0,
  guidedObjectCount: 0,
  visibleLabelCount: 0,
  backendStarCount: 0,
  renderedStarCount: 0,
  lodTier: 'wide',
  labelCap: 0,
  dataMode: 'loading',
  sourceLabel: 'Loading tiles…',
  fallbackActive: false,
  sceneOffsetSeconds: 0,
  playbackRate: 1,
  moonPhaseLabel: null,
  moonAboveHorizon: false,
}

export const EMPTY_SKY_ENGINE_RUNTIME_SNAPSHOT: SkyEngineRuntimeSnapshot = {
  timestampIso: new Date(0).toISOString(),
  camera: EMPTY_CAMERA_SNAPSHOT,
  selection: EMPTY_SELECTION_SNAPSHOT,
  summary: EMPTY_SUMMARY_SNAPSHOT,
}

const METRIC_WINDOW_MS = 1000
const MAX_STORED_TIMESTAMPS = 120

function resolveVisibilityState(): SnapshotVisibilityState {
  if (typeof document === 'undefined') {
    return 'unknown'
  }

  return document.visibilityState
}

function createCadenceSeries(): SnapshotCadenceSeries {
  return {
    totalCount: 0,
    timestampsMs: [],
    intervalsMs: [],
    lastIntervalMs: null,
    lastTimestampMs: null,
    lastVisibilityState: 'unknown',
    backgroundThrottleDetected: false,
  }
}

function pruneCadenceSeries(series: SnapshotCadenceSeries, nowMs: number) {
  series.timestampsMs = series.timestampsMs.filter((timestampMs) => nowMs - timestampMs <= METRIC_WINDOW_MS)

  if (series.timestampsMs.length > MAX_STORED_TIMESTAMPS) {
    series.timestampsMs = series.timestampsMs.slice(-MAX_STORED_TIMESTAMPS)
  }

  if (series.intervalsMs.length > MAX_STORED_TIMESTAMPS) {
    series.intervalsMs = series.intervalsMs.slice(-MAX_STORED_TIMESTAMPS)
  }
}

function recordCadenceEvent(
  series: SnapshotCadenceSeries,
  atMs: number,
  visibilityState: SnapshotVisibilityState,
  cadenceMs: number,
) {
  series.totalCount += 1

  if (series.lastTimestampMs !== null) {
    const intervalMs = atMs - series.lastTimestampMs
    series.lastIntervalMs = intervalMs
    series.intervalsMs.push(intervalMs)

    if (visibilityState !== 'visible' || intervalMs >= cadenceMs * 3) {
      series.backgroundThrottleDetected = true
    }
  }

  series.lastTimestampMs = atMs
  series.lastVisibilityState = visibilityState
  series.timestampsMs.push(atMs)
  pruneCadenceSeries(series, atMs)
}

function getMeanIntervalMs(series: SnapshotCadenceSeries) {
  if (series.intervalsMs.length === 0) {
    return null
  }

  return series.intervalsMs.reduce((total, intervalMs) => total + intervalMs, 0) / series.intervalsMs.length
}

function getEventsPerSecond(series: SnapshotCadenceSeries, nowMs: number) {
  pruneCadenceSeries(series, nowMs)
  return series.timestampsMs.filter((timestampMs) => nowMs - timestampMs <= METRIC_WINDOW_MS).length
}

function createSnapshotSignature(snapshot: SkyEngineRuntimeSnapshot) {
  return JSON.stringify(snapshot)
}

export function createSkyEngineSnapshotStore(
  initialSnapshot: SkyEngineRuntimeSnapshot = EMPTY_SKY_ENGINE_RUNTIME_SNAPSHOT,
  cadenceMs = 150,
): SkyEngineSnapshotStore {
  let publishedSnapshot = initialSnapshot
  let latestSnapshot = initialSnapshot
  let pendingSnapshot: SkyEngineRuntimeSnapshot | null = null
  let pendingSourceAtMs: number | null = null
  let pendingVisibilityState: SnapshotVisibilityState = 'unknown'
  let publishedSignature = createSnapshotSignature(initialSnapshot)
  let timeoutHandle: ReturnType<typeof globalThis.setTimeout> | null = null
  let lastPublishAtMs = 0
  const listeners = new Set<() => void>()
  const engineCadenceSeries = createCadenceSeries()
  const uiCadenceSeries = createCadenceSeries()

  const buildCadenceMetrics = (): SkyEngineSnapshotCadenceMetrics => {
    const nowMs = performance.now()
    const engineMeanIntervalMs = getMeanIntervalMs(engineCadenceSeries)
    const uiMeanIntervalMs = getMeanIntervalMs(uiCadenceSeries)

    return {
      intendedCadenceMs: cadenceMs,
      intendedCadenceHz: cadenceMs > 0 ? 1000 / cadenceMs : 0,
      actualCadenceMs: engineMeanIntervalMs,
      actualCadenceHz: engineMeanIntervalMs && engineMeanIntervalMs > 0 ? 1000 / engineMeanIntervalMs : null,
      engine: {
        totalCount: engineCadenceSeries.totalCount,
        perSecond: getEventsPerSecond(engineCadenceSeries, nowMs),
        lastIntervalMs: engineCadenceSeries.lastIntervalMs,
        meanIntervalMs: engineMeanIntervalMs,
        lastTimestampMs: engineCadenceSeries.lastTimestampMs,
        lastVisibilityState: engineCadenceSeries.lastVisibilityState,
        backgroundThrottleDetected: engineCadenceSeries.backgroundThrottleDetected,
      },
      ui: {
        totalCount: uiCadenceSeries.totalCount,
        perSecond: getEventsPerSecond(uiCadenceSeries, nowMs),
        lastIntervalMs: uiCadenceSeries.lastIntervalMs,
        meanIntervalMs: uiMeanIntervalMs,
        lastTimestampMs: uiCadenceSeries.lastTimestampMs,
        lastVisibilityState: uiCadenceSeries.lastVisibilityState,
        activeSubscriberCount: listeners.size,
      },
    }
  }

  const flush = (force = false) => {
    if (!pendingSnapshot) {
      return
    }

    const nowMs = performance.now()
    const remainingCadenceMs = cadenceMs - (nowMs - lastPublishAtMs)

    if (!force && remainingCadenceMs > 0) {
      timeoutHandle ??= globalThis.setTimeout(() => {
        timeoutHandle = null
        flush(true)
      }, remainingCadenceMs)

      return
    }

    const nextSnapshot = pendingSnapshot
    const sourceAtMs = pendingSourceAtMs ?? nowMs
    const visibilityState = pendingVisibilityState
    pendingSnapshot = null
    pendingSourceAtMs = null
    pendingVisibilityState = 'unknown'
    const nextSignature = createSnapshotSignature(nextSnapshot)

    latestSnapshot = nextSnapshot

    if (nextSignature === publishedSignature) {
      return
    }

    publishedSnapshot = nextSnapshot
    publishedSignature = nextSignature
    lastPublishAtMs = nowMs
    recordCadenceEvent(engineCadenceSeries, sourceAtMs, visibilityState, cadenceMs)
    listeners.forEach((listener) => listener())
  }

  return {
    getSnapshot: () => publishedSnapshot,
    getLatestSnapshot: () => latestSnapshot,
    getCadenceMetrics: () => buildCadenceMetrics(),
    subscribe(listener) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
    recordUiReceive(atMs = performance.now(), visibilityState = resolveVisibilityState()) {
      recordCadenceEvent(uiCadenceSeries, atMs, visibilityState, cadenceMs)
    },
    publish(snapshot, options) {
      latestSnapshot = snapshot
      pendingSnapshot = snapshot
      pendingSourceAtMs = options?.sourceAtMs ?? performance.now()
      pendingVisibilityState = options?.visibilityState ?? resolveVisibilityState()

      if (options?.force) {
        if (timeoutHandle !== null) {
          globalThis.clearTimeout(timeoutHandle)
          timeoutHandle = null
        }

        flush(true)
        return
      }

      flush(false)
    },
    reset() {
      latestSnapshot = initialSnapshot
      pendingSnapshot = null
      pendingSourceAtMs = null
      pendingVisibilityState = 'unknown'
      publishedSnapshot = initialSnapshot
      publishedSignature = createSnapshotSignature(initialSnapshot)
      lastPublishAtMs = 0
      engineCadenceSeries.totalCount = 0
      engineCadenceSeries.timestampsMs = []
      engineCadenceSeries.intervalsMs = []
      engineCadenceSeries.lastIntervalMs = null
      engineCadenceSeries.lastTimestampMs = null
      engineCadenceSeries.lastVisibilityState = 'unknown'
      engineCadenceSeries.backgroundThrottleDetected = false
      uiCadenceSeries.totalCount = 0
      uiCadenceSeries.timestampsMs = []
      uiCadenceSeries.intervalsMs = []
      uiCadenceSeries.lastIntervalMs = null
      uiCadenceSeries.lastTimestampMs = null
      uiCadenceSeries.lastVisibilityState = 'unknown'
      uiCadenceSeries.backgroundThrottleDetected = false

      if (timeoutHandle !== null) {
        globalThis.clearTimeout(timeoutHandle)
        timeoutHandle = null
      }

      listeners.forEach((listener) => listener())
    },
  }
}

export function useSkyEngineSnapshotPoll(
  snapshotStore: SkyEngineSnapshotStore,
  cadenceMs = SKY_ENGINE_SNAPSHOT_POLL_CADENCE_MS,
) {
  const [snapshot, setSnapshot] = useState(() => snapshotStore.getLatestSnapshot())
  const snapshotRef = useRef(snapshot)

  useEffect(() => {
    snapshotRef.current = snapshot
  }, [snapshot])

  useEffect(() => {
    const pollSnapshot = () => {
      const latestSnapshot = snapshotStore.getLatestSnapshot()

      if (latestSnapshot === snapshotRef.current) {
        return
      }

      snapshotRef.current = latestSnapshot
      snapshotStore.recordUiReceive()
      setSnapshot(latestSnapshot)
    }

    pollSnapshot()
    const intervalHandle = globalThis.setInterval(pollSnapshot, cadenceMs)

    return () => {
      globalThis.clearInterval(intervalHandle)
    }
  }, [cadenceMs, snapshotStore])

  return snapshot
}