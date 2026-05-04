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
import { resolveWebGL2StarsHarnessConfig } from '../features/sky-engine/webgl2StarsHarnessConfig'
import { resolveWebGL2StarsOwnerConfig } from '../features/sky-engine/webgl2StarsOwnerConfig'
import { resolveWebGL2StarsPerfTraceConfig } from '../features/sky-engine/webgl2StarsPerfTraceConfig'
import { resolveSkyDebugVisualConfig } from '../features/sky-engine/skyDebugVisualConfig'
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
import { STELLARIUM_WEB_UI } from './stellariumWebUiAssets'

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

function formatToolbarFov(fovDegrees: number) {
  return `${fovDegrees.toPrecision(3)}°`
}

function resolveRuntimeModeLabel(mode: 'hipparcos' | 'gaia' | 'multi-survey' | 'loading' | 'mock') {
  if (mode === 'multi-survey') {
    return 'Multi-survey'
  }

  if (mode === 'gaia') {
    return 'Gaia'
  }

  if (mode === 'hipparcos') {
    return 'Hipparcos'
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

function toFiniteNumberOr(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function buildFallbackBackendScene(params: {
  at: string
  lat?: string
  lon?: string
  elevationFt?: string
}): BackendSkyScenePayload {
  return {
    scope: 'sky',
    engine: 'sky_engine',
    filter: 'visible_now',
    timestamp: params.at,
    observer: {
      label: 'Local observer (offline)',
      latitude: toFiniteNumberOr(params.lat, 0),
      longitude: toFiniteNumberOr(params.lon, 0),
      elevation_ft: toFiniteNumberOr(params.elevationFt, 0),
    },
    scene_state: {
      projection: 'stereographic',
      center_alt_deg: 30,
      center_az_deg: 180,
      fov_deg: 60,
      stars_ready: false,
    },
    objects: [],
  }
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

function SkyEngineOwnershipState({ title, detail }: Readonly<SkyEngineOwnershipStateProps>) {
  return (
    <div className="sky-engine-page sky-engine-page--immersive">
      <main className="sky-engine-page__viewport-shell sky-engine-page__viewport-shell--immersive">
        <div className="sky-engine-page__overlay sky-engine-page__overlay--top-bar">
          <div className="sky-engine-page__top-bar" aria-label="Sky Engine ownership state">
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
  webgl2StarsHarnessConfig: ReturnType<typeof resolveWebGL2StarsHarnessConfig>
  webgl2StarsOwnerConfig: ReturnType<typeof resolveWebGL2StarsOwnerConfig>
  webgl2StarsPerfTraceConfig: ReturnType<typeof resolveWebGL2StarsPerfTraceConfig>
  skyDebugVisualConfig: ReturnType<typeof resolveSkyDebugVisualConfig>
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
  webgl2StarsHarnessConfig,
  webgl2StarsOwnerConfig,
  webgl2StarsPerfTraceConfig,
  skyDebugVisualConfig,
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
      webgl2StarsHarnessConfig={webgl2StarsHarnessConfig}
      webgl2StarsOwnerConfig={webgl2StarsOwnerConfig}
      webgl2StarsPerfTraceConfig={webgl2StarsPerfTraceConfig}
      debugVisualConfig={skyDebugVisualConfig}
    />
  )
})

SkyEngineViewport.displayName = 'SkyEngineViewport'

function SkyEnginePageContent({
  backendScene,
  webgl2StarsHarnessConfig,
  webgl2StarsOwnerConfig,
  webgl2StarsPerfTraceConfig,
  skyDebugVisualConfig,
  offlineFallbackMode = false,
}: Readonly<{
  backendScene: BackendSkyScenePayload
  webgl2StarsHarnessConfig: ReturnType<typeof resolveWebGL2StarsHarnessConfig>
  webgl2StarsOwnerConfig: ReturnType<typeof resolveWebGL2StarsOwnerConfig>
  webgl2StarsPerfTraceConfig: ReturnType<typeof resolveWebGL2StarsPerfTraceConfig>
  skyDebugVisualConfig: ReturnType<typeof resolveSkyDebugVisualConfig>
  offlineFallbackMode?: boolean
}>) {
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
  const [constellationArtVisible, setConstellationArtVisible] = useState(false)
  const [equatorialJ2000Visible, setEquatorialJ2000Visible] = useState(false)
  const [fullscreenVisible, setFullscreenVisible] = useState(false)
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
  const localClockTimeLabel = useMemo(
    () => new Date(snapshot.timestampIso).toLocaleTimeString('en-GB', { hour12: false }),
    [snapshot.timestampIso],
  )
  const localClockDateLabel = useMemo(
    () => new Date(snapshot.timestampIso).toLocaleDateString('en-CA'),
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

    if (!debugTelemetryEnabled || !webgl2StarsPerfTraceConfig.diagnosticsWritesEnabled || !root) {
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
    if (!debugTelemetryEnabled || !webgl2StarsPerfTraceConfig.diagnosticsWritesEnabled) {
      return
    }

    const metrics = uiPerfRef.current
    metrics.reactCommitCount += 1
    metrics.reactActualDurationTotalMs += actualDuration
    metrics.reactLastCommitMs = actualDuration
    metrics.reactMaxCommitMs = Math.max(metrics.reactMaxCommitMs, actualDuration)
    metrics.pendingReactDurationMs += actualDuration
    metrics.sampleCount += 1
  }, [debugTelemetryEnabled, webgl2StarsPerfTraceConfig.diagnosticsWritesEnabled])

  useEffect(() => {
    if (!debugTelemetryEnabled || !webgl2StarsPerfTraceConfig.diagnosticsWritesEnabled) {
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
  }, [debugTelemetryEnabled, webgl2StarsPerfTraceConfig.diagnosticsWritesEnabled])

  useEffect(() => {
    if (!debugTelemetryEnabled || !webgl2StarsPerfTraceConfig.diagnosticsWritesEnabled) {
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
  }, [debugTelemetryEnabled, publishUiPerfMetrics, webgl2StarsPerfTraceConfig.diagnosticsWritesEnabled])

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

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen()
      setFullscreenVisible(true)
      return
    }
    void document.exitFullscreen()
    setFullscreenVisible(false)
  }, [])

  const pageBody = (
    <div ref={rootRef} className="sky-engine-page sky-engine-page--immersive">
      <main className="sky-engine-page__viewport-shell sky-engine-page__viewport-shell--immersive">
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
          webgl2StarsHarnessConfig={webgl2StarsHarnessConfig}
          webgl2StarsOwnerConfig={webgl2StarsOwnerConfig}
          webgl2StarsPerfTraceConfig={webgl2StarsPerfTraceConfig}
          skyDebugVisualConfig={skyDebugVisualConfig}
        />

        <div className="click-through sky-engine-page__gui-root">
          <div className="sky-engine-page__overlay sky-engine-page__overlay--top-bar get-click" id="toolbar-image">
            <div className="sky-engine-page__top-bar" aria-label="Sky toolbar">
              <Link className="sky-engine-page__toolbar-menu-btn" to="/" title="Main menu" aria-label="Main menu">☰</Link>
              <span className="sky-engine-page__brand-mark" aria-hidden="true">☽</span>
              <span className="tbtitle">Sky Engine<sup>Web</sup></span>
              <div className="sky-engine-page__toolbar-spacer" />
              <form
                className="tsearch"
                aria-label="Target search"
                onSubmit={(event) => {
                  event.preventDefault()
                  selectObjectFromSearch(searchQuery)
                }}
              >
                <span className="sky-engine-page__search-icon" aria-hidden="true">⌕</span>
                <input
                  id="sky-engine-target-search"
                  className="sky-engine-page__search-input"
                  type="search"
                  list="sky-engine-target-search-list"
                  placeholder="search..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                <datalist id="sky-engine-target-search-list">
                  {matchingSearchObjects.map((object) => (
                    <option key={object.id} value={object.name} />
                  ))}
                </datalist>
              </form>
              <div className="sky-engine-page__toolbar-spacer" />
              {offlineFallbackMode ? (
                <div className="sky-engine-page__status-pill">
                  <span className="sky-engine-page__top-bar-label">Mode</span>
                  <strong>Offline fallback</strong>
                  <small>Backend scene unavailable; local defaults active</small>
                </div>
              ) : null}
              <div className="sky-engine-page__toolbar-spacer" />
              <div className="subheader">FOV {formatToolbarFov(snapshot.camera.fovDegrees)}</div>
              {!inspectorOpen ? (
                <button
                  type="button"
                  className="sky-engine-page__observe-btn"
                  onClick={() => setInspectorOpen(true)}
                >
                  Observe ▾
                </button>
              ) : null}
            </div>
          </div>

          <div className="sky-engine-page__overlay sky-engine-page__overlay--bottom-hud get-click">
            <section className="sky-engine-page__bottom-hud" aria-label="Bottom toolbar">
              <div className="tbtcontainer tbtcontainer--left">
                <button type="button" className="tmenubt">{observer.label}</button>
              </div>
              <div className="sky-engine-page__bottom-toolbar-buttons">
                <button type="button" className={`bottom-button${aidVisibility.constellations ? ' on' : ''}`} onClick={() => toggleAid('constellations')} aria-label="Constellations"><img src={STELLARIUM_WEB_UI.constellationLines} alt="" /><span className="hint">Constellations</span></button>
                <button type="button" className={`bottom-button${constellationArtVisible ? ' on' : ''}`} onClick={() => setConstellationArtVisible((v) => !v)} aria-label="Constellations Art"><img src={STELLARIUM_WEB_UI.constellationArt} alt="" /><span className="hint">Constellations Art</span></button>
                <button type="button" className={`bottom-button${aidVisibility.atmosphere ? ' on' : ''}`} onClick={() => toggleAid('atmosphere')} aria-label="Atmosphere"><img src={STELLARIUM_WEB_UI.atmosphere} alt="" /><span className="hint">Atmosphere</span></button>
                <button type="button" className={`bottom-button${aidVisibility.landscape ? ' on' : ''}`} onClick={() => toggleAid('landscape')} aria-label="Landscape"><img src={STELLARIUM_WEB_UI.landscape} alt="" /><span className="hint">Landscape</span></button>
                <button type="button" className={`bottom-button${aidVisibility.azimuthRing ? ' on' : ''}`} onClick={() => toggleAid('azimuthRing')} aria-label="Azimuthal Grid"><img src={STELLARIUM_WEB_UI.azimuthalGrid} alt="" /><span className="hint">Azimuthal Grid</span></button>
                <button type="button" className={`bottom-button${aidVisibility.altitudeRings ? ' on' : ''}`} onClick={() => toggleAid('altitudeRings')} aria-label="Equatorial Grid"><img src={STELLARIUM_WEB_UI.equatorialGrid} alt="" /><span className="hint">Equatorial Grid</span></button>
                <button type="button" className={`bottom-button${equatorialJ2000Visible ? ' on' : ''}`} onClick={() => setEquatorialJ2000Visible((v) => !v)} aria-label="Equatorial J2000 Grid"><img src={STELLARIUM_WEB_UI.equatorialGrid} alt="" /><span className="hint">Equatorial J2000 Grid</span></button>
                <button type="button" className={`bottom-button${aidVisibility.deepSky ? ' on' : ''}`} onClick={() => toggleAid('deepSky')} aria-label="Deep Sky Objects"><img src={STELLARIUM_WEB_UI.nebulae} alt="" /><span className="hint">Deep Sky Objects</span></button>
                <button type="button" className={`bottom-button${aidVisibility.nightMode ? ' on' : ''}`} onClick={() => toggleAid('nightMode')} aria-label="Night Mode"><img src={STELLARIUM_WEB_UI.nightMode} alt="" /><span className="hint">Night Mode</span></button>
                <button type="button" className={`bottom-button${fullscreenVisible ? ' on' : ''}`} onClick={toggleFullscreen} aria-label="Fullscreen"><img src={fullscreenVisible ? STELLARIUM_WEB_UI.fullscreenExit : STELLARIUM_WEB_UI.fullscreen} alt="" /><span className="hint">Fullscreen</span></button>
              </div>
              <div className="tbtcontainer tbtcontainer--right">
                <button type="button" className="tmenubt" aria-label="Time controls">
                  <span className="text-subtitle-2">{localClockTimeLabel}</span>
                  <span className="text-caption">{localClockDateLabel}</span>
                </button>
              </div>
            </section>
          </div>

          <div className="sky-engine-page__overlay sky-engine-page__overlay--selected-object get-click">
            <div className="sky-engine-page__selected-object-card">
              <strong>{snapshot.selection.object?.name ?? 'No object selected'}</strong>
              <small>{snapshot.selection.object?.type ?? 'Point at an object to inspect details'}</small>
            </div>
          </div>

          <div className="sky-engine-page__overlay sky-engine-page__overlay--progress-bars">
            <div className="sky-engine-page__progress-chip">Stars {snapshot.summary.renderedStarCount}</div>
            <div
              className="sky-engine-page__progress-chip"
              title="Catalog stars that would be visited by the Stellarium-style stars_list pass over visible survey tiles at the current limiting magnitude (may differ from rendered count due to dedupe and projection gates)."
            >
              Listed {snapshot.summary.starsListVisitCount}
            </div>
            <div className="sky-engine-page__progress-chip">Data {resolveRuntimeModeLabel(snapshot.summary.dataMode)}</div>
            {skyDebugVisualConfig.darkSkyOverrideEnabled ? (
              <div
                className="sky-engine-page__progress-chip sky-engine-page__progress-chip--warning"
                title="Temporary development-only dark-sky background override is active."
              >
                Debug dark
              </div>
            ) : null}
            {skyDebugVisualConfig.starsVisibleOverrideEnabled ? (
              <div
                className="sky-engine-page__progress-chip sky-engine-page__progress-chip--warning"
                title="Temporary development-only stars visibility override is active."
              >
                Debug stars visible
              </div>
            ) : null}
            {snapshot.summary.fallbackActive ? (
              <div
                className="sky-engine-page__progress-chip sky-engine-page__progress-chip--warning"
                title="Survey tiles failed to load for the current view; star counts may be stale or empty until the fetch succeeds."
              >
                Tiles error
              </div>
            ) : null}
          </div>
        </div>

        <div id="nightmode" className={`sky-engine-page__nightmode${aidVisibility.nightMode ? ' sky-engine-page__nightmode--visible' : ''}`} />

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
  const host = globalThis.location?.hostname ?? ''
  const port = globalThis.location?.port ?? ''
  const isDevRuntime = host === 'localhost' || host === '127.0.0.1' || port === '4173' || port === '5173'
  const webgl2StarsHarnessConfig = resolveWebGL2StarsHarnessConfig({
    search: globalThis.location?.search ?? '',
    isDev: isDevRuntime,
    devOnly: false,
  })
  const webgl2StarsOwnerConfig = resolveWebGL2StarsOwnerConfig({
    search: globalThis.location?.search ?? '',
    isDev: isDevRuntime,
    devOnly: false,
  })
  const webgl2StarsPerfTraceConfig = resolveWebGL2StarsPerfTraceConfig({
    search: globalThis.location?.search ?? '',
    isDev: isDevRuntime,
    devOnly: false,
  })
  const skyDebugVisualConfig = resolveSkyDebugVisualConfig({
    search: globalThis.location?.search ?? '',
    isDev: isDevRuntime,
    devOnly: false,
  })
  const routeLat = routeQueryParams.get('lat')?.trim() || undefined
  const routeLon = routeQueryParams.get('lon')?.trim() || undefined
  const routeElevationFt = routeQueryParams.get('elevation_ft')?.trim() || undefined
  const routeAt = routeQueryParams.get('at')?.trim() || undefined
  const resolvedRouteAt = useMemo(() => {
    if (routeAt) {
      return routeAt
    }

    if (webgl2StarsHarnessConfig.realCatalogDensePresetEnabled) {
      return webgl2StarsHarnessConfig.realCatalogDensePresetAtIso
    }

    return new Date().toISOString()
  }, [routeAt, webgl2StarsHarnessConfig.realCatalogDensePresetAtIso, webgl2StarsHarnessConfig.realCatalogDensePresetEnabled])
  const sceneQuery = useSceneByScopeDataQuery({
    scope: 'sky',
    engine: 'sky_engine',
    lat: routeLat,
    lon: routeLon,
    elevation_ft: routeElevationFt,
    at: resolvedRouteAt,
  })
  const backendScene = useMemo(
    () => parseBackendSkyScenePayload(sceneQuery.data),
    [sceneQuery.data],
  )
  const fallbackBackendScene = useMemo(() => buildFallbackBackendScene({
    at: resolvedRouteAt,
    lat: routeLat,
    lon: routeLon,
    elevationFt: routeElevationFt,
  }), [resolvedRouteAt, routeLat, routeLon, routeElevationFt])

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
      <SkyEnginePageContent
        backendScene={fallbackBackendScene}
        webgl2StarsHarnessConfig={webgl2StarsHarnessConfig}
        webgl2StarsOwnerConfig={webgl2StarsOwnerConfig}
        webgl2StarsPerfTraceConfig={webgl2StarsPerfTraceConfig}
        skyDebugVisualConfig={skyDebugVisualConfig}
        offlineFallbackMode
      />
    )
  }

  if (!backendScene) {
    return (
      <SkyEnginePageContent
        backendScene={fallbackBackendScene}
        webgl2StarsHarnessConfig={webgl2StarsHarnessConfig}
        webgl2StarsOwnerConfig={webgl2StarsOwnerConfig}
        webgl2StarsPerfTraceConfig={webgl2StarsPerfTraceConfig}
        skyDebugVisualConfig={skyDebugVisualConfig}
        offlineFallbackMode
      />
    )
  }

  return (
    <SkyEnginePageContent
      backendScene={backendScene}
      webgl2StarsHarnessConfig={webgl2StarsHarnessConfig}
      webgl2StarsOwnerConfig={webgl2StarsOwnerConfig}
      webgl2StarsPerfTraceConfig={webgl2StarsPerfTraceConfig}
      skyDebugVisualConfig={skyDebugVisualConfig}
    />
  )
}
