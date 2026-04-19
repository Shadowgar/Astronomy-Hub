import React, { Profiler, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ProfilerOnRenderCallback } from 'react'
import { Link } from 'react-router-dom'

import {
  computeBackendStarSceneObjects,
  computeMoonSceneObject,
  computePlanetSceneObjects,
  computeSatelliteSceneObjects,
  rankGuidanceTargets,
} from '../features/sky-engine/astronomy'
import {
  resolveSkyTileRepositoryMode,
} from '../features/sky-engine/engine/sky'
import {
  SKY_ENGINE_LOCAL_TIME_ZONE,
  SKY_ENGINE_MAX_SCENE_OFFSET_SECONDS,
  SKY_ENGINE_PLAYBACK_RATE_OPTIONS,
  SKY_ENGINE_TIME_SCALE_OPTIONS,
  formatSceneLocalTimestamp,
  formatSceneOffset,
  formatSceneScaleOffset,
  getPlaybackRateLabel,
  type SkyEngineTimeScaleId,
} from '../features/sky-engine/sceneTime'
import {
  createSkyBackendTileManifestState,
  flattenResolvedSkyBackendTileRegistry,
  resolveSkyBackendTileRegistry,
  type SkyBackendTileManifestState,
} from '../features/sky-engine/backendTileRegistry'
import {
  createSkyEngineSnapshotStore,
  useSkyEngineSnapshotPoll,
  type SkyEngineSnapshotCadenceMetrics,
} from '../features/sky-engine/SkyEngineSnapshotStore'
import SkyEngineDetailShell from '../features/sky-engine/SkyEngineDetailShell'
import SkyEngineScene, { type SkyEngineSceneHandle } from '../features/sky-engine/SkyEngineScene'
import {
  persistAidVisibility,
  readPersistedAidVisibility,
} from '../features/sky-engine/aidVisibilityPersistence'
import { persistSkyCultureId, readPersistedSkyCultureId } from '../features/sky-engine/skyCultureSelection'
import { SKY_ENGINE_SKYCULTURES } from '../features/sky-engine/skycultures'
import { useSceneByScopeDataQuery, useSkyStarTileManifestDataQuery } from '../features/scene/queries'
import {
  isFiniteNumber,
  parseBackendSatelliteScenePayload,
  parseBackendSkyScenePayload,
  parseBackendSkyStarTileManifestPayload,
  type BackendSatelliteSceneObject,
  type BackendSkyScenePayload,
} from '../features/scene/contracts'
import type { SkyEngineAidVisibility, SkyEngineGuidanceTarget } from '../features/sky-engine/types'

const DEBUG_TELEMETRY_QUERY_PARAM = 'debugTelemetry'
const UI_PERF_REPORTING_CADENCE_MS = 250

const snapshotMetricsHost = globalThis as typeof globalThis & {
  __skyEngineSnapshotMetrics__?: () => SkyEngineSnapshotCadenceMetrics
}

function phaseModifier(phaseLabel: string) {
  return phaseLabel.toLowerCase().split(' ').join('-')
}

function formatDisplayedFov(fovDegrees: number) {
  if (fovDegrees >= 100) {
    return `${fovDegrees.toFixed(0)}°`
  }

  if (fovDegrees >= 10) {
    return `${fovDegrees.toFixed(1)}°`
  }

  if (fovDegrees >= 1) {
    return `${fovDegrees.toFixed(2)}°`
  }

  return `${fovDegrees.toFixed(4)}°`
}

function resolveRuntimeModeLabel(mode: 'mock' | 'hipparcos' | 'gaia' | 'multi-survey' | 'loading') {
  if (mode === 'multi-survey') {
    return 'Multi-survey'
  }

  if (mode === 'gaia') {
    return 'Gaia'
  }

  if (mode === 'hipparcos') {
    return 'Hipparcos'
  }

  if (mode === 'mock') {
    return 'Mock'
  }

  return 'Loading'
}

function convertBackendObserver(scene: BackendSkyScenePayload) {
  let elevationFeet = 0

  if (isFiniteNumber(scene.observer.elevation_ft)) {
    elevationFeet = scene.observer.elevation_ft
  } else if (isFiniteNumber(scene.observer.elevation_m)) {
    elevationFeet = scene.observer.elevation_m / 0.3048
  }

  return {
    label: scene.observer.label,
    latitude: scene.observer.latitude,
    longitude: scene.observer.longitude,
    elevationFt: Number(elevationFeet.toFixed(2)),
  }
}

function buildBackendViewState(scene: BackendSkyScenePayload) {
  return {
    fovDegrees: Number(scene.scene_state.fov_deg.toFixed(1)),
    centerAltDeg: Number(scene.scene_state.center_alt_deg.toFixed(1)),
    centerAzDeg: Number(scene.scene_state.center_az_deg.toFixed(1)),
  }
}

function resolveDebugTelemetryEnabled() {
  if (globalThis.window === undefined) {
    return false
  }

  return new URLSearchParams(globalThis.location.search).get(DEBUG_TELEMETRY_QUERY_PARAM) === '1'
}

function resolveDeterministicParityModeEnabled() {
  if (globalThis.window === undefined) {
    return false
  }

  return new URLSearchParams(globalThis.location.search).get('parityMode') === '1'
}

function computeSceneOffsetSeconds(baseTimestampIso: string, snapshotTimestampIso: string) {
  const baseTimestampMs = Date.parse(baseTimestampIso)
  const snapshotTimestampMs = Date.parse(snapshotTimestampIso)

  if (Number.isNaN(baseTimestampMs) || Number.isNaN(snapshotTimestampMs)) {
    return 0
  }

  return Math.round((snapshotTimestampMs - baseTimestampMs) / 1000)
}

type SkyEngineOwnershipStateProps = {
  title: string
  detail: string
}

type SkyEngineUiPerfState = {
  reactCommitCount: number
  reactActualDurationTotalMs: number
  reactLastCommitMs: number
  reactMaxCommitMs: number
  pendingReactDurationMs: number
  reactFrameDurationMs: number
  reactFrameMaxMs: number
  uiFrameMs: number
  uiFrameMaxMs: number
  overlayMutationCount: number
  sampleCount: number
}

function createSkyEngineUiPerfState(): SkyEngineUiPerfState {
  return {
    reactCommitCount: 0,
    reactActualDurationTotalMs: 0,
    reactLastCommitMs: 0,
    reactMaxCommitMs: 0,
    pendingReactDurationMs: 0,
    reactFrameDurationMs: 0,
    reactFrameMaxMs: 0,
    uiFrameMs: 0,
    uiFrameMaxMs: 0,
    overlayMutationCount: 0,
    sampleCount: 0,
  }
}

function SkyEngineHubShell() {
  return (
    <div className="sky-engine-page__overlay sky-engine-page__overlay--hub-shell">
      <div className="sky-engine-page__hub-shell" aria-label="Stellarium style shell">
        <div className="sky-engine-page__hub-shell-brand">
          <span className="sky-engine-page__hub-shell-label">Stellarium Web</span>
          <strong>Sky View</strong>
          <small>Observer sky viewport</small>
        </div>
        <div className="sky-engine-page__hub-shell-actions">
          <Link className="sky-engine-page__back-link sky-engine-page__back-link--hub" to="/">
            Menu
          </Link>
          <span className="sky-engine-page__status-pill">
            <span className="sky-engine-page__top-bar-label">Mode</span>
            <strong>Observe</strong>
          </span>
        </div>
      </div>
    </div>
  )
}

function SkyEngineOwnershipState({ title, detail }: Readonly<SkyEngineOwnershipStateProps>) {
  return (
    <div className="sky-engine-page sky-engine-page--immersive">
      <main className="sky-engine-page__viewport-shell sky-engine-page__viewport-shell--immersive">
        <SkyEngineHubShell />
        <div className="sky-engine-page__overlay sky-engine-page__overlay--top-bar">
          <div className="sky-engine-page__top-bar" aria-label="Sky Engine ownership state">
            <div className="sky-engine-page__top-bar-section sky-engine-page__top-bar-section--actions">
              <Link className="sky-engine-page__back-link" to="/">
                Back
              </Link>
            </div>
            <div className="sky-engine-page__top-bar-meta">
              <div className="sky-engine-page__status-pill sky-engine-page__status-pill--wide">
                <span className="sky-engine-page__top-bar-label">Sky scene</span>
                <strong>{title}</strong>
                <small>{detail}</small>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

type SkyEngineViewportProps = {
  sceneRef: React.Ref<SkyEngineSceneHandle>
  sceneKey: string
  backendStars: ReturnType<typeof flattenResolvedSkyBackendTileRegistry>
  backendSatellites: readonly BackendSatelliteSceneObject[]
  initialSceneTimestampIso: string
  observer: ReturnType<typeof convertBackendObserver>
  initialViewState: ReturnType<typeof buildBackendViewState>
  projectionMode: BackendSkyScenePayload['scene_state']['projection']
  repositoryMode: ReturnType<typeof resolveSkyTileRepositoryMode>
  snapshotStore: ReturnType<typeof createSkyEngineSnapshotStore>
  initialAidVisibility: SkyEngineAidVisibility
  initialSkyCultureId: string
  debugTelemetryEnabled: boolean
  deterministicParityModeEnabled: boolean
}

const SkyEngineViewport = React.memo(function SkyEngineViewport({
  sceneRef,
  sceneKey,
  backendStars,
  backendSatellites,
  initialSceneTimestampIso,
  observer,
  initialViewState,
  projectionMode,
  repositoryMode,
  snapshotStore,
  initialAidVisibility,
  initialSkyCultureId,
  debugTelemetryEnabled,
  deterministicParityModeEnabled,
}: Readonly<SkyEngineViewportProps>) {
  return (
    <SkyEngineScene
      key={sceneKey}
      ref={sceneRef}
      backendStars={backendStars}
      backendSatellites={backendSatellites}
      initialSceneTimestampIso={initialSceneTimestampIso}
      observer={observer}
      initialViewState={initialViewState}
      projectionMode={projectionMode}
      repositoryMode={repositoryMode}
      snapshotStore={snapshotStore}
      initialAidVisibility={initialAidVisibility}
      initialSkyCultureId={initialSkyCultureId}
      debugTelemetryEnabled={debugTelemetryEnabled}
      deterministicParityMode={deterministicParityModeEnabled}
    />
  )
})

SkyEngineViewport.displayName = 'SkyEngineViewport'

function SkyEnginePageContent({ backendScene }: Readonly<{ backendScene: BackendSkyScenePayload }>) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<SkyEngineSceneHandle | null>(null)
  const uiPerfRef = useRef<SkyEngineUiPerfState>(createSkyEngineUiPerfState())
  const lastPublishedUiPerfRef = useRef<string | null>(null)
  const snapshotStore = useMemo(() => createSkyEngineSnapshotStore(), [])
  const debugTelemetryEnabled = useMemo(() => resolveDebugTelemetryEnabled(), [])
  const deterministicParityModeEnabled = useMemo(() => resolveDeterministicParityModeEnabled(), [])
  const snapshot = useSkyEngineSnapshotPoll(snapshotStore)
  const skyStarTileManifestQuery = useSkyStarTileManifestDataQuery({ at: backendScene.timestamp })
  const [repositoryMode] = useState(() => resolveSkyTileRepositoryMode())
  const [searchQuery, setSearchQuery] = useState('')
  const [timeScaleId, setTimeScaleId] = useState<SkyEngineTimeScaleId>('minutes')
  const initialAidVisibility = useMemo(() => readPersistedAidVisibility(), [])
  const initialSkyCultureId = useMemo(() => readPersistedSkyCultureId(), [])
  const [aidVisibility, setAidVisibility] = useState<SkyEngineAidVisibility>(initialAidVisibility)
  const [skyCultureId, setSkyCultureId] = useState(initialSkyCultureId)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const observer = useMemo(() => convertBackendObserver(backendScene), [backendScene])
  const initialViewState = useMemo(() => buildBackendViewState(backendScene), [backendScene])
  const satelliteSceneQuery = useSceneByScopeDataQuery({
    scope: 'earth',
    engine: 'satellites',
    filter: 'visible_now',
    lat: backendScene.observer.latitude,
    lon: backendScene.observer.longitude,
    elevation_ft: observer.elevationFt,
    at: backendScene.timestamp,
  })
  const highAltitudeSatelliteSceneQuery = useSceneByScopeDataQuery({
    scope: 'earth',
    engine: 'satellites',
    filter: 'high_altitude',
    lat: backendScene.observer.latitude,
    lon: backendScene.observer.longitude,
    elevation_ft: observer.elevationFt,
    at: backendScene.timestamp,
  })
  const backendSatelliteScene = useMemo(
    () => parseBackendSatelliteScenePayload(satelliteSceneQuery.data),
    [satelliteSceneQuery.data],
  )
  const highAltitudeBackendSatelliteScene = useMemo(
    () => parseBackendSatelliteScenePayload(highAltitudeSatelliteSceneQuery.data),
    [highAltitudeSatelliteSceneQuery.data],
  )
  const backendSatellites = useMemo<readonly BackendSatelliteSceneObject[]>(
    () => {
      const visibleNow = backendSatelliteScene?.objects ?? []
      if (visibleNow.length > 0) {
        return visibleNow
      }
      return highAltitudeBackendSatelliteScene?.objects ?? []
    },
    [backendSatelliteScene, highAltitudeBackendSatelliteScene],
  )
  const backendSceneStars = useMemo(
    () => backendScene.objects.filter((object) => object.type === 'star'),
    [backendScene.objects],
  )
  const backendTileManifest = useMemo(
    () => parseBackendSkyStarTileManifestPayload(skyStarTileManifestQuery.data),
    [skyStarTileManifestQuery.data],
  )
  const [tileManifestState, setTileManifestState] = useState<SkyBackendTileManifestState>(() =>
    createSkyBackendTileManifestState(backendTileManifest),
  )

  useEffect(() => {
    setTileManifestState(createSkyBackendTileManifestState(backendTileManifest))
  }, [backendTileManifest])

  const resolvedTileRegistry = useMemo(
    () => resolveSkyBackendTileRegistry(tileManifestState, backendSceneStars),
    [backendSceneStars, tileManifestState],
  )
  const resolvedBackendTileStars = useMemo(
    () => flattenResolvedSkyBackendTileRegistry(resolvedTileRegistry),
    [resolvedTileRegistry],
  )
  const initialStaticObjects = useMemo(() => {
    const sceneTimestampIso = backendScene.timestamp
    return [
      ...computeBackendStarSceneObjects(observer, sceneTimestampIso, resolvedBackendTileStars),
      ...computePlanetSceneObjects(observer, sceneTimestampIso),
      ...computeSatelliteSceneObjects(observer, sceneTimestampIso, backendSatellites),
      computeMoonSceneObject(observer, sceneTimestampIso),
    ]
  }, [backendSatellites, backendScene.timestamp, observer, resolvedBackendTileStars])
  const searchableSceneObjects = useMemo(
    () => [...initialStaticObjects].sort((left, right) => left.name.localeCompare(right.name)),
    [initialStaticObjects],
  )
  const guidanceTargets = useMemo<readonly SkyEngineGuidanceTarget[]>(
    () => rankGuidanceTargets(initialStaticObjects, 5),
    [initialStaticObjects],
  )
  const matchingSearchObjects = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return searchableSceneObjects.slice(0, 10)
    }

    return searchableSceneObjects
      .filter((object) => object.name.toLowerCase().includes(normalizedQuery))
      .slice(0, 10)
  }, [deferredSearchQuery, searchableSceneObjects])
  const sceneOffsetSeconds = useMemo(
    () => computeSceneOffsetSeconds(backendScene.timestamp, snapshot.timestampIso),
    [backendScene.timestamp, snapshot.timestampIso],
  )
  const formattedSceneLocalTimestamp = useMemo(
    () => formatSceneLocalTimestamp(snapshot.timestampIso),
    [snapshot.timestampIso],
  )
  const formattedSceneOffset = useMemo(
    () => formatSceneOffset(sceneOffsetSeconds),
    [sceneOffsetSeconds],
  )
  const formattedScaleOffset = useMemo(
    () => formatSceneScaleOffset(sceneOffsetSeconds, timeScaleId),
    [sceneOffsetSeconds, timeScaleId],
  )
  const playbackRateLabel = useMemo(
    () => getPlaybackRateLabel(snapshot.summary.playbackRate),
    [snapshot.summary.playbackRate],
  )
  const skyCultureOptions = useMemo(
    () => Object.values(SKY_ENGINE_SKYCULTURES)
      .map((culture) => ({
        id: culture.id,
        label: culture.id[0].toUpperCase() + culture.id.slice(1),
      }))
      .sort((left, right) => left.label.localeCompare(right.label)),
    [],
  )
  const phaseBandState = snapshot.summary.phaseLabel === 'Low Sun' ? 'Twilight' : snapshot.summary.phaseLabel
  const sceneKey = useMemo(() => [
    backendScene.timestamp,
    backendScene.observer.latitude,
    backendScene.observer.longitude,
    backendScene.scene_state.center_alt_deg,
    backendScene.scene_state.center_az_deg,
    backendScene.scene_state.fov_deg,
    backendSatellites.map((satellite) => satellite.id).join(','),
  ].join(':'), [
    backendSatellites,
    backendScene.observer.latitude,
    backendScene.observer.longitude,
    backendScene.scene_state.center_alt_deg,
    backendScene.scene_state.center_az_deg,
    backendScene.scene_state.fov_deg,
    backendScene.timestamp,
  ])

  useEffect(() => {
    persistAidVisibility(aidVisibility)
    sceneRef.current?.setAidVisibility(aidVisibility)
  }, [aidVisibility])

  useEffect(() => {
    persistSkyCultureId(skyCultureId)
    sceneRef.current?.setSkyCultureId(skyCultureId)
  }, [skyCultureId])

  useEffect(() => {
    if (snapshot.selection.status === 'active' || snapshot.selection.status === 'hidden') {
      setInspectorOpen(true)
    }
  }, [snapshot.selection.status])

  useEffect(() => {
    snapshotMetricsHost.__skyEngineSnapshotMetrics__ = () => snapshotStore.getCadenceMetrics()

    return () => {
      delete snapshotMetricsHost.__skyEngineSnapshotMetrics__
    }
  }, [snapshotStore])

  const publishUiPerfMetrics = useCallback(() => {
    const root = rootRef.current

    if (!debugTelemetryEnabled || !root) {
      return
    }

    const metrics = uiPerfRef.current
    const meanReactCommitMs = metrics.reactCommitCount > 0
      ? metrics.reactActualDurationTotalMs / metrics.reactCommitCount
      : 0

    const payload = JSON.stringify({
      reactCommitCount: metrics.reactCommitCount,
      reactLastCommitMs: metrics.reactLastCommitMs,
      reactMeanCommitMs: meanReactCommitMs,
      reactMaxCommitMs: metrics.reactMaxCommitMs,
      reactFrameMs: metrics.reactFrameDurationMs,
      reactFrameMaxMs: metrics.reactFrameMaxMs,
      uiFrameMs: metrics.uiFrameMs,
      uiFrameMaxMs: metrics.uiFrameMaxMs,
      overlayMutationCount: metrics.overlayMutationCount,
      sampleCount: metrics.sampleCount,
    })

    if (payload === lastPublishedUiPerfRef.current) {
      return
    }

    root.dataset.skyEngineUiPerf = payload
    lastPublishedUiPerfRef.current = payload
  }, [debugTelemetryEnabled])

  const handleUiProfilerRender = useCallback<ProfilerOnRenderCallback>((_id, _phase, actualDuration) => {
    if (!debugTelemetryEnabled) {
      return
    }

    const metrics = uiPerfRef.current
    metrics.reactCommitCount += 1
    metrics.reactActualDurationTotalMs += actualDuration
    metrics.reactLastCommitMs = actualDuration
    metrics.reactMaxCommitMs = Math.max(metrics.reactMaxCommitMs, actualDuration)
    metrics.pendingReactDurationMs += actualDuration
    metrics.sampleCount += 1
  }, [debugTelemetryEnabled])

  useEffect(() => {
    if (!debugTelemetryEnabled) {
      return undefined
    }

    const root = rootRef.current
    if (!root) {
      return undefined
    }

    const observerInstance = new MutationObserver((mutations) => {
      uiPerfRef.current.overlayMutationCount += mutations.length
    })

    observerInstance.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    })

    return () => {
      observerInstance.disconnect()
    }
  }, [debugTelemetryEnabled])

  useEffect(() => {
    if (!debugTelemetryEnabled) {
      return undefined
    }

    let lastSampleAtMs = performance.now()

    const sampleMetrics = () => {
      const nowMs = performance.now()
      const metrics = uiPerfRef.current
      const uiFrameMs = nowMs - lastSampleAtMs
      lastSampleAtMs = nowMs
      metrics.uiFrameMs = uiFrameMs
      metrics.uiFrameMaxMs = Math.max(metrics.uiFrameMaxMs, uiFrameMs)
      metrics.reactFrameDurationMs = metrics.pendingReactDurationMs
      metrics.reactFrameMaxMs = Math.max(metrics.reactFrameMaxMs, metrics.reactFrameDurationMs)
      metrics.pendingReactDurationMs = 0
      publishUiPerfMetrics()
    }

    sampleMetrics()
    const intervalHandle = globalThis.setInterval(sampleMetrics, UI_PERF_REPORTING_CADENCE_MS)

    return () => {
      globalThis.clearInterval(intervalHandle)
    }
  }, [debugTelemetryEnabled, publishUiPerfMetrics])

  useEffect(() => () => {
    if (rootRef.current) {
      delete rootRef.current.dataset.skyEngineUiPerf
    }

    lastPublishedUiPerfRef.current = null
  }, [])

  const selectObjectFromSearch = useCallback((query: string) => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return
    }

    const nextObject = searchableSceneObjects.find((object) => object.name.toLowerCase() === normalizedQuery)
      ?? searchableSceneObjects.find((object) => object.name.toLowerCase().includes(normalizedQuery))

    if (!nextObject) {
      return
    }

    sceneRef.current?.selectObject(nextObject.id)
    setSearchQuery(nextObject.name)
  }, [searchableSceneObjects])

  const toggleAid = useCallback((key: keyof SkyEngineAidVisibility) => {
    setAidVisibility((currentVisibility) => ({
      ...currentVisibility,
      [key]: !currentVisibility[key],
    }))
  }, [])

  const pageBody = (
    <div ref={rootRef} className="sky-engine-page sky-engine-page--immersive">
      <main className="sky-engine-page__viewport-shell sky-engine-page__viewport-shell--immersive">
        <SkyEngineHubShell />
        <SkyEngineViewport
          sceneRef={sceneRef}
          sceneKey={sceneKey}
          backendStars={resolvedBackendTileStars}
          backendSatellites={backendSatellites}
          initialSceneTimestampIso={backendScene.timestamp}
          observer={observer}
          initialViewState={initialViewState}
          projectionMode={backendScene.scene_state.projection}
          repositoryMode={repositoryMode}
          snapshotStore={snapshotStore}
          initialAidVisibility={initialAidVisibility}
          initialSkyCultureId={initialSkyCultureId}
          debugTelemetryEnabled={debugTelemetryEnabled}
          deterministicParityModeEnabled={deterministicParityModeEnabled}
        />

        <div className="sky-engine-page__overlay sky-engine-page__overlay--top-bar">
          <div className="sky-engine-page__top-bar" aria-label="Sky Engine top bar">
            <div className="sky-engine-page__top-bar-section sky-engine-page__top-bar-section--actions">
              <Link className="sky-engine-page__back-link sky-engine-page__icon-chip" to="/" title="Main menu" aria-label="Main menu">
                ≡
              </Link>
              <button
                type="button"
                className={`sky-engine-page__control-chip sky-engine-page__icon-chip${inspectorOpen ? ' sky-engine-page__control-chip--active' : ''}`}
                onClick={() => setInspectorOpen((currentValue) => !currentValue)}
                title={inspectorOpen ? 'Hide interface' : 'Show interface'}
                aria-label={inspectorOpen ? 'Hide interface' : 'Show interface'}
              >
                {inspectorOpen ? '◫' : '☰'}
              </button>
              <button
                type="button"
                className="sky-engine-page__time-reset sky-engine-page__time-reset--top sky-engine-page__icon-chip"
                onClick={() => sceneRef.current?.resetSceneTime()}
                title="Now"
                aria-label="Reset time to now"
              >
                ⟳
              </button>
            </div>
            <form
              className="sky-engine-page__search"
              aria-label="Sky Engine target search"
              onSubmit={(event) => {
                event.preventDefault()
                selectObjectFromSearch(searchQuery)
              }}
            >
              <input
                id="sky-engine-target-search"
                className="sky-engine-page__search-input"
                type="search"
                list="sky-engine-target-search-list"
                placeholder="Search..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <datalist id="sky-engine-target-search-list">
                {matchingSearchObjects.map((object) => (
                  <option key={object.id} value={object.name} />
                ))}
              </datalist>
              <button type="submit" className="sky-engine-page__control-chip sky-engine-page__search-submit">
                ⌕
              </button>
            </form>
            <div className="sky-engine-page__top-bar-meta">
              <div className="sky-engine-page__status-pill sky-engine-page__status-pill--wide">
                <span className="sky-engine-page__top-bar-label">{resolveRuntimeModeLabel(snapshot.summary.dataMode)} · {formatDisplayedFov(snapshot.camera.fovDegrees)}</span>
                <strong>{formattedSceneLocalTimestamp}</strong>
                <small>{formattedSceneOffset} · {SKY_ENGINE_LOCAL_TIME_ZONE} · {playbackRateLabel}</small>
              </div>
              <span
                className={`sky-engine-page__phase-pill sky-engine-page__phase-pill--${phaseModifier(snapshot.summary.phaseLabel)}`}
                data-phase={snapshot.summary.phaseLabel}
              >
                {snapshot.summary.phaseLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="sky-engine-page__overlay sky-engine-page__overlay--bottom-hud">
          <section className="sky-engine-page__bottom-hud" aria-label="Sky Engine controls">
            <div className="sky-engine-page__bottom-hud-main sky-engine-page__bottom-hud-main--stellarium">
              <div className="sky-engine-page__stellarium-status">
                <span className="sky-engine-page__scene-link-label">Timeline</span>
                <strong className="sky-engine-page__bottom-hud-offset">{formattedScaleOffset}</strong>
              </div>
              <div className="sky-engine-page__bottom-hud-stats sky-engine-page__bottom-hud-stats--stellarium">
                <span>{snapshot.summary.renderedStarCount} stars</span>
                <span>{snapshot.summary.fallbackActive ? `${snapshot.summary.sourceLabel} fallback` : snapshot.summary.sourceLabel}</span>
                <span>{snapshot.selection.object?.name ?? observer.label}</span>
              </div>
            </div>

            <div className="sky-engine-page__phase-band" aria-label="Scene light band">
              {['Daylight', 'Twilight', 'Night'].map((band) => (
                <span
                  key={band}
                  className={`sky-engine-page__phase-band-segment${phaseBandState === band ? ' sky-engine-page__phase-band-segment--active' : ''}`}
                >
                  {band}
                </span>
              ))}
            </div>

            <input
              id="sky-engine-time-slider"
              className="sky-engine-page__time-slider"
              type="range"
              min={-SKY_ENGINE_MAX_SCENE_OFFSET_SECONDS}
              max={SKY_ENGINE_MAX_SCENE_OFFSET_SECONDS}
              step={SKY_ENGINE_TIME_SCALE_OPTIONS.find((option) => option.id === timeScaleId)?.stepSeconds ?? 60}
              value={sceneOffsetSeconds}
              aria-label="Scene time offset"
              onChange={(event) => sceneRef.current?.setSceneOffsetSeconds(Number(event.target.value))}
            />

            <div className="sky-engine-page__bottom-hud-foot sky-engine-page__bottom-hud-foot--stellarium">
              <div className="sky-engine-page__stellarium-center-strip" aria-label="Stellarium style center actions">
                <div className="sky-engine-page__target-chips" aria-label="Guided sky targets">
                  {guidanceTargets.slice(0, 3).map((target) => (
                    <button
                      key={target.objectId}
                      type="button"
                      className={`sky-engine-page__target-chip${snapshot.selection.object?.id === target.objectId ? ' sky-engine-page__target-chip--active' : ''}`}
                      onClick={() => sceneRef.current?.selectObject(target.objectId)}
                    >
                      {target.name}
                    </button>
                  ))}
                </div>
                <div className="sky-engine-page__target-chips" aria-label="Sky aid toggles">
                  <button type="button" className={`sky-engine-page__control-chip sky-engine-page__icon-chip${aidVisibility.constellations ? ' sky-engine-page__control-chip--active' : ''}`} onClick={() => toggleAid('constellations')} title="Constellation lines" aria-label="Constellation lines">
                    ✶
                  </button>
                  <button type="button" className={`sky-engine-page__control-chip sky-engine-page__icon-chip${aidVisibility.azimuthRing ? ' sky-engine-page__control-chip--active' : ''}`} onClick={() => toggleAid('azimuthRing')} title="Azimuth grid" aria-label="Azimuth grid">
                    ⊙
                  </button>
                  <button type="button" className={`sky-engine-page__control-chip sky-engine-page__icon-chip${aidVisibility.altitudeRings ? ' sky-engine-page__control-chip--active' : ''}`} onClick={() => toggleAid('altitudeRings')} title="Equatorial grid" aria-label="Equatorial grid">
                    ⌖
                  </button>
                </div>
                <div className="sky-engine-page__target-chips" aria-label="Sky culture selection">
                  {skyCultureOptions.slice(0, 4).map((culture) => (
                    <button
                      key={culture.id}
                      type="button"
                      className={`sky-engine-page__control-chip${skyCultureId === culture.id ? ' sky-engine-page__control-chip--active' : ''}`}
                      onClick={() => setSkyCultureId(culture.id)}
                    >
                      {culture.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sky-engine-page__stellarium-time-strip">
                <div className="sky-engine-page__control-group" aria-label="Time scale controls">
                  <button
                    type="button"
                    className="sky-engine-page__time-reset"
                    onClick={() => sceneRef.current?.nudgeSceneOffset(-(SKY_ENGINE_TIME_SCALE_OPTIONS.find((option) => option.id === timeScaleId)?.stepSeconds ?? 60))}
                  >
                    - Step
                  </button>
                  <div className="sky-engine-page__time-slider-scale">
                    {SKY_ENGINE_TIME_SCALE_OPTIONS.map((scaleOption) => (
                      <button
                        key={scaleOption.id}
                        type="button"
                        className={`sky-engine-page__control-chip${timeScaleId === scaleOption.id ? ' sky-engine-page__control-chip--active' : ''}`}
                        onClick={() => setTimeScaleId(scaleOption.id)}
                      >
                        {scaleOption.shortLabel}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="sky-engine-page__time-reset"
                    onClick={() => sceneRef.current?.nudgeSceneOffset(SKY_ENGINE_TIME_SCALE_OPTIONS.find((option) => option.id === timeScaleId)?.stepSeconds ?? 60)}
                  >
                    + Step
                  </button>
                </div>
                <div className="sky-engine-page__control-group" aria-label="Playback controls">
                  {SKY_ENGINE_PLAYBACK_RATE_OPTIONS.map((playbackOption) => (
                    <button
                      key={playbackOption.value}
                      type="button"
                      className={`sky-engine-page__control-chip${snapshot.summary.playbackRate === playbackOption.value ? ' sky-engine-page__control-chip--active' : ''}`}
                      onClick={() => {
                        if (playbackOption.value === 0) {
                          sceneRef.current?.togglePlayback()
                          return
                        }

                        sceneRef.current?.setPlaybackRate(playbackOption.value)
                      }}
                    >
                      {playbackOption.value === 0 && snapshot.summary.playbackRate !== 0 ? 'Pause' : playbackOption.label}
                    </button>
                  ))}
                  <button type="button" className="sky-engine-page__time-reset" onClick={() => sceneRef.current?.resetSceneTime()}>
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {inspectorOpen ? (
          <div className="sky-engine-page__overlay sky-engine-page__overlay--right">
            <SkyEngineDetailShell
              selectedObject={snapshot.selection.object}
              selectionStatus={snapshot.selection.status}
              hiddenSelectionName={snapshot.selection.hiddenName}
              onClearSelection={() => sceneRef.current?.clearSelection()}
            />
          </div>
        ) : null}
      </main>
    </div>
  )

  return debugTelemetryEnabled
    ? <Profiler id="sky-engine-page-content" onRender={handleUiProfilerRender}>{pageBody}</Profiler>
    : pageBody
}

export default function SkyEnginePage() {
  const routeQueryParams = new URLSearchParams(globalThis.location?.search ?? '')
  const routeLat = routeQueryParams.get('lat')?.trim() || undefined
  const routeLon = routeQueryParams.get('lon')?.trim() || undefined
  const routeElevationFt = routeQueryParams.get('elevation_ft')?.trim() || undefined
  const routeAt = routeQueryParams.get('at')?.trim() || undefined
  const sceneQuery = useSceneByScopeDataQuery({
    scope: 'sky',
    engine: 'sky_engine',
    lat: routeLat,
    lon: routeLon,
    elevation_ft: routeElevationFt,
    at: routeAt,
  })
  const backendScene = useMemo(
    () => parseBackendSkyScenePayload(sceneQuery.data),
    [sceneQuery.data],
  )

  if (sceneQuery.isPending) {
    return (
      <SkyEngineOwnershipState
        title="Loading backend scene"
        detail="Waiting for /api/v1/scene?scope=sky&engine=sky_engine to provide observer and timestamp."
      />
    )
  }

  if (sceneQuery.isError) {
    return (
      <SkyEngineOwnershipState
        title="Sky scene unavailable"
        detail="Backend scene ownership failed to load; local observer and time are intentionally not used as fallback."
      />
    )
  }

  if (!backendScene) {
    return (
      <SkyEngineOwnershipState
        title="Sky scene invalid"
        detail="Backend responded without the required sky scene ownership contract."
      />
    )
  }

  return <SkyEnginePageContent backendScene={backendScene} />
}
