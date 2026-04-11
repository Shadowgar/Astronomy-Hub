import { useSyncExternalStore } from 'react'

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
  readonly dataMode: 'mock' | 'hipparcos' | 'loading'
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

export interface SkyEngineSnapshotStore {
  getSnapshot: () => SkyEngineRuntimeSnapshot
  getLatestSnapshot: () => SkyEngineRuntimeSnapshot
  subscribe: (listener: () => void) => () => void
  publish: (snapshot: SkyEngineRuntimeSnapshot, options?: { force?: boolean }) => void
  reset: () => void
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
  let publishedSignature = createSnapshotSignature(initialSnapshot)
  let timeoutHandle: number | null = null
  let lastPublishAtMs = 0
  const listeners = new Set<() => void>()

  const flush = (force = false) => {
    if (!pendingSnapshot) {
      return
    }

    const nowMs = performance.now()
    const remainingCadenceMs = cadenceMs - (nowMs - lastPublishAtMs)

    if (!force && remainingCadenceMs > 0) {
      if (timeoutHandle === null) {
        timeoutHandle = window.setTimeout(() => {
          timeoutHandle = null
          flush(true)
        }, remainingCadenceMs)
      }

      return
    }

    const nextSnapshot = pendingSnapshot
    pendingSnapshot = null
    const nextSignature = createSnapshotSignature(nextSnapshot)

    latestSnapshot = nextSnapshot

    if (nextSignature === publishedSignature) {
      return
    }

    publishedSnapshot = nextSnapshot
    publishedSignature = nextSignature
    lastPublishAtMs = nowMs
    listeners.forEach((listener) => listener())
  }

  return {
    getSnapshot: () => publishedSnapshot,
    getLatestSnapshot: () => latestSnapshot,
    subscribe(listener) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
    publish(snapshot, options) {
      latestSnapshot = snapshot
      pendingSnapshot = snapshot

      if (options?.force) {
        if (timeoutHandle !== null) {
          window.clearTimeout(timeoutHandle)
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
      publishedSnapshot = initialSnapshot
      publishedSignature = createSnapshotSignature(initialSnapshot)
      lastPublishAtMs = 0

      if (timeoutHandle !== null) {
        window.clearTimeout(timeoutHandle)
        timeoutHandle = null
      }

      listeners.forEach((listener) => listener())
    },
  }
}

export function useSkyEngineSnapshot(snapshotStore: SkyEngineSnapshotStore) {
  return useSyncExternalStore(snapshotStore.subscribe, snapshotStore.getSnapshot, snapshotStore.getSnapshot)
}