import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  computeBackendStarSceneObjects,
  computeMoonSceneObject,
  computePlanetSceneObjects,
  rankGuidanceTargets,
} from '../features/sky-engine/astronomy'
import {
  assembleSkyScenePacket,
  buildSkyEngineQuery,
  fileBackedSkyTileRepository,
  formatSkyDiagnosticsSummary,
  mockSkyTileRepository,
  resolveSkyTileRepositoryMode,
  unitVectorToHorizontalCoordinates,
} from '../features/sky-engine/engine/sky'
import {
  SKY_ENGINE_LOCAL_TIME_ZONE,
  SKY_ENGINE_PLAYBACK_RATE_OPTIONS,
  SKY_ENGINE_TIME_SCALE_OPTIONS,
  useSkyEngineSceneTime,
} from '../features/sky-engine/sceneTime'
import {
  createSkyBackendTileManifestState,
  flattenResolvedSkyBackendTileRegistry,
  resolveSkyBackendTileRegistry,
  type SkyBackendTileManifestState,
} from '../features/sky-engine/backendTileRegistry'
import { computeSunState } from '../features/sky-engine/solar'
import { useSceneByScopeDataQuery, useSkyStarTileManifestDataQuery } from '../features/scene/queries'
import {
  isFiniteNumber,
  parseBackendSkyScenePayload,
  parseBackendSkyStarTileManifestPayload,
  type BackendSkyScenePayload,
} from '../features/scene/contracts'
import SkyEngineDetailShell from '../features/sky-engine/SkyEngineDetailShell'
import SkyEngineScene from '../features/sky-engine/SkyEngineScene'
import { resolveStarColorHex } from '../features/sky-engine/starRenderer'
import type { SkyEngineSceneObject } from '../features/sky-engine/types'
import { useSkyEngineSelection } from '../features/sky-engine/useSkyEngineSelection'
import type { SkyTileRepositoryLoadResult } from '../features/sky-engine/engine/sky'

function phaseModifier(phaseLabel: string) {
  return phaseLabel.toLowerCase().split(' ').join('-')
}

function getPlaybackButtonLabel(playbackValue: number, isPlaying: boolean, label: string) {
  if (playbackValue === 0) {
    return isPlaying ? 'Pause' : 'Play'
  }

  return label
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

async function loadSkyRuntimeTiles(
  repositoryMode: 'mock' | 'hipparcos',
  query: Parameters<typeof mockSkyTileRepository.loadTiles>[0],
): Promise<SkyTileRepositoryLoadResult> {
  const preferredRepository = repositoryMode === 'hipparcos' ? fileBackedSkyTileRepository : mockSkyTileRepository

  try {
    return await preferredRepository.loadTiles(query)
  } catch (error) {
    const fallbackResult = await mockSkyTileRepository.loadTiles(query)
    return {
      ...fallbackResult,
      sourceLabel: repositoryMode === 'hipparcos' ? 'Mock fallback' : fallbackResult.sourceLabel,
      sourceError: error instanceof Error ? error.message : String(error),
    }
  }
}

function resolveRuntimeModeLabel(
  diagnosticsMode: SkyTileRepositoryLoadResult['mode'] | undefined,
  repositoryMode: 'mock' | 'hipparcos',
) {
  if (diagnosticsMode === 'hipparcos') {
    return 'Hipparcos'
  }

  if (diagnosticsMode === 'mock' || repositoryMode === 'mock') {
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

type SkyEngineOwnershipStateProps = {
  title: string
  detail: string
}

function SkyEngineHubShell() {
  return (
    <div className="sky-engine-page__overlay sky-engine-page__overlay--hub-shell">
      <div className="sky-engine-page__hub-shell" aria-label="Astronomy Hub engine shell">
        <div className="sky-engine-page__hub-shell-brand">
          <span className="sky-engine-page__hub-shell-label">Astronomy Hub</span>
          <strong>Sky Engine</strong>
          <small>Hub shell persists while the active engine owns this viewport.</small>
        </div>
        <div className="sky-engine-page__hub-shell-actions">
          <Link className="sky-engine-page__back-link sky-engine-page__back-link--hub" to="/">
            Hub
          </Link>
          <span className="sky-engine-page__status-pill">
            <span className="sky-engine-page__top-bar-label">Active engine</span>
            <strong>Sky Engine</strong>
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

function SkyEnginePageContent({ backendScene }: Readonly<{ backendScene: BackendSkyScenePayload }>) {
  const sceneTime = useSkyEngineSceneTime()
  const skyStarTileManifestQuery = useSkyStarTileManifestDataQuery({ at: backendScene.timestamp })
  const [repositoryMode] = useState(() => resolveSkyTileRepositoryMode())
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const observer = useMemo(() => convertBackendObserver(backendScene), [backendScene])
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
  const tier1ResolvedStarCount = useMemo(
    () => resolvedTileRegistry.tiles.find((tile) => tile.lookup_key === 'sky:tier1:tier1-bright-stars')?.resolvedObjectCount ?? 0,
    [resolvedTileRegistry],
  )
  const tier2ResolvedStarCount = useMemo(
    () => resolvedTileRegistry.tiles.find((tile) => tile.lookup_key === 'sky:tier2:mid-stars')?.resolvedObjectCount ?? 0,
    [resolvedTileRegistry],
  )
  const resolvedBackendTileStars = useMemo(
    () => flattenResolvedSkyBackendTileRegistry(resolvedTileRegistry),
    [resolvedTileRegistry],
  )
  const backendTileStarSceneObjects = useMemo(
    () => computeBackendStarSceneObjects(observer, sceneTime.sceneTimestampIso, resolvedBackendTileStars),
    [observer, resolvedBackendTileStars, sceneTime.sceneTimestampIso],
  )
  const [viewState, setViewState] = useState(() => buildBackendViewState(backendScene))
  const [aidVisibility, setAidVisibility] = useState({
    constellations: true,
    azimuthRing: true,
    altitudeRings: true,
  })
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [tileLoadResult, setTileLoadResult] = useState<SkyTileRepositoryLoadResult | null>(null)
  const sunState = useMemo(
    () => computeSunState(observer, sceneTime.sceneTimestampIso),
    [observer, sceneTime.sceneTimestampIso],
  )
  const moonObject = useMemo(
    () => computeMoonSceneObject(observer, sceneTime.sceneTimestampIso),
    [observer, sceneTime.sceneTimestampIso],
  )
  const computedPlanetObjects = useMemo(
    () => computePlanetSceneObjects(observer, sceneTime.sceneTimestampIso),
    [observer, sceneTime.sceneTimestampIso],
  )

  const observerSnapshot = useMemo(
    () => ({
      timestampUtc: sceneTime.sceneTimestampIso,
      latitudeDeg: observer.latitude,
      longitudeDeg: observer.longitude,
      elevationM: observer.elevationFt * 0.3048,
      fovDeg: viewState.fovDegrees,
      centerAltDeg: viewState.centerAltDeg,
      centerAzDeg: viewState.centerAzDeg,
      projection: backendScene.scene_state.projection,
    }),
    [backendScene.scene_state.projection, observer.elevationFt, observer.latitude, observer.longitude, sceneTime.sceneTimestampIso, viewState.centerAltDeg, viewState.centerAzDeg, viewState.fovDegrees],
  )
  const skyEngineQuery = useMemo(
    () => buildSkyEngineQuery(observerSnapshot),
    [observerSnapshot],
  )
  useEffect(() => {
    let cancelled = false

    async function loadTiles() {
      const result = await loadSkyRuntimeTiles(repositoryMode, skyEngineQuery)

      if (!cancelled) {
        setTileLoadResult(result)
      }
    }

    void loadTiles()

    return () => {
      cancelled = true
    }
  }, [repositoryMode, skyEngineQuery])

  const runtimeTiles = tileLoadResult?.tiles ?? []
  const skyScenePacket = useMemo(
    () => (tileLoadResult ? assembleSkyScenePacket(skyEngineQuery, runtimeTiles, tileLoadResult) : null),
    [runtimeTiles, skyEngineQuery, tileLoadResult],
  )
  const runtimeStarMetadata = useMemo(() => {
    const metadata = new Map<string, { tileId: string; star: (typeof runtimeTiles)[number]['stars'][number] }>()

    runtimeTiles.forEach((tile) => {
      tile.stars.forEach((star) => {
        if (!metadata.has(star.id)) {
          metadata.set(star.id, { tileId: tile.tileId, star })
        }
      })
    })

    return metadata
  }, [runtimeTiles])
  const engineStarSceneObjects = useMemo<readonly SkyEngineSceneObject[]>(
    () => (skyScenePacket?.stars ?? []).map((star) => {
      const metadata = runtimeStarMetadata.get(star.id)
      const runtimeStar = metadata?.star
      const horizontalCoordinates = unitVectorToHorizontalCoordinates({ x: star.x, y: star.y, z: star.z })
      const isHipparcosMode = tileLoadResult?.mode === 'hipparcos'
      const displayName = runtimeStar?.properName ?? runtimeStar?.bayer ?? runtimeStar?.flamsteed ?? runtimeStar?.sourceId ?? star.label ?? star.id
      const tileSourceLabel = metadata?.star.sourceId ?? metadata?.tileId ?? 'unknown-tile'

      return {
        id: star.id,
        name: displayName,
        type: 'star',
        altitudeDeg: horizontalCoordinates.altitudeDeg,
        azimuthDeg: horizontalCoordinates.azimuthDeg,
        magnitude: star.mag,
        colorHex: resolveStarColorHex(runtimeStar?.colorIndex ?? star.colorIndex),
        summary: isHipparcosMode
          ? `Hipparcos ${star.tier} star streamed from the generated runtime tile assets.`
          : `Mock ${star.tier} star resolved from the in-memory sky tile repository.`,
        description: isHipparcosMode
          ? `Loaded from ${metadata?.tileId ?? 'unknown-tile'} and emitted through the Sky Engine scene packet from offline-generated Hipparcos runtime assets.`
          : `Loaded from ${metadata?.tileId ?? 'unknown-tile'} and emitted through the Sky Engine scene packet for the active observer snapshot.`,
        truthNote: isHipparcosMode
          ? `Engine-owned Hipparcos tile data drives this star. Source: ${tileSourceLabel}.`
          : 'Engine-owned mock tile data drives this star. No raw catalog ingestion or backend data source is involved in this slice.',
        source: isHipparcosMode ? 'engine_hipparcos_tile' : 'engine_mock_tile',
        trackingMode: 'fixed_equatorial',
        rightAscensionHours: runtimeStar ? runtimeStar.raDeg / 15 : undefined,
        declinationDeg: runtimeStar?.decDeg,
        colorIndexBV: runtimeStar?.colorIndex ?? star.colorIndex,
        timestampIso: sceneTime.sceneTimestampIso,
        isAboveHorizon: horizontalCoordinates.isAboveHorizon,
      }
    }),
    [runtimeStarMetadata, sceneTime.sceneTimestampIso, skyScenePacket, tileLoadResult?.mode],
  )
  const computedVisibleObjects = useMemo(
    () => [...computedPlanetObjects, moonObject],
    [computedPlanetObjects, moonObject],
  )
  const nonStarVisibleObjects = useMemo(
    () => computedVisibleObjects.filter((object) => object.type !== 'star'),
    [computedVisibleObjects],
  )
  const activeStarSceneObjects = useMemo(() => {
    const mergedStars = new Map<string, SkyEngineSceneObject>()

    if (backendSceneStars.length > 0) {
      backendTileStarSceneObjects.forEach((star) => {
        mergedStars.set(star.id, star)
      })
    }

    engineStarSceneObjects.forEach((star) => {
      if (!mergedStars.has(star.id)) {
        mergedStars.set(star.id, star)
      }
    })

    return Array.from(mergedStars.values())
  }, [backendSceneStars.length, backendTileStarSceneObjects, engineStarSceneObjects])
  const baseSceneObjects = useMemo(
    () => [...activeStarSceneObjects, ...nonStarVisibleObjects],
    [activeStarSceneObjects, nonStarVisibleObjects],
  )
  const guidanceTargets = useMemo(
    () => rankGuidanceTargets(baseSceneObjects, 5),
    [baseSceneObjects],
  )
  const guidanceLookup = useMemo(
    () => new Map(guidanceTargets.map((target, index) => [target.objectId, { ...target, tier: index < 2 ? 'featured' as const : 'guide' as const }])),
    [guidanceTargets],
  )
  const sceneObjects = useMemo(
    () => baseSceneObjects.map((object) => {
      const guidance = guidanceLookup.get(object.id)

      if (!guidance) {
        return object
      }

      return {
        ...object,
        guidanceScore: guidance.score,
        guidanceTier: guidance.tier,
      }
    }),
    [baseSceneObjects, guidanceLookup],
  )
  const selection = useSkyEngineSelection(sceneObjects)
  const guidedObjectIds = useMemo(
    () => guidanceTargets.map((target) => target.objectId),
    [guidanceTargets],
  )
  const diagnostics = skyScenePacket?.diagnostics ?? null
  const selectedTargetName = selection.selectedObject?.name ?? 'Ready to inspect'
  const fallbackActive = Boolean(diagnostics?.sourceError)
  const runtimeSourceLabel = diagnostics?.sourceLabel
    ?? (repositoryMode === 'hipparcos' ? 'Hipparcos loading…' : 'Mock tile repository')

  useEffect(() => {
    if (!backendTileManifest) {
      return
    }

    console.info('[SkyEngine][tiles] manifest received', {
      generatedAt: tileManifestState.metadata.generatedAt,
      manifestVersion: tileManifestState.metadata.manifestVersion,
      tier: tileManifestState.tier,
      tiles: tileManifestState.tiles.map((tile) => ({
        tileId: tile.tile_id,
        lookupKey: tile.lookup_key,
        objectCount: tile.object_count,
        source: tile.source,
      })),
    })
  }, [backendTileManifest, tileManifestState])

  useEffect(() => {
    if (resolvedTileRegistry.tiles.length === 0) {
      return
    }

    console.info('[SkyEngine][tiles] tiles resolved', {
      tier: resolvedTileRegistry.tier,
      tier1ResolvedStarCount,
      tier2ResolvedStarCount,
      totalResolvedStars: resolvedTileRegistry.totalResolvedStars,
      tiles: resolvedTileRegistry.tiles.map((tile) => ({
        tileId: tile.tile_id,
        lookupKey: tile.lookup_key,
        resolvedObjectCount: tile.resolvedObjectCount,
      })),
    })
  }, [resolvedTileRegistry, tier1ResolvedStarCount, tier2ResolvedStarCount])

  useEffect(() => {
    if (backendSceneStars.length === 0) {
      return
    }

    console.info('[SkyEngine][tiles] stars loaded via tile pipeline', {
      tier1Count: tier1ResolvedStarCount,
      tier2Count: tier2ResolvedStarCount,
      resolvedStarCount: resolvedBackendTileStars.length,
      renderedStarCount: activeStarSceneObjects.length,
      manifestTileCount: tileManifestState.tiles.length,
    })
  }, [activeStarSceneObjects.length, backendSceneStars.length, resolvedBackendTileStars.length, tier1ResolvedStarCount, tier2ResolvedStarCount, tileManifestState.tiles.length])

  useEffect(() => {
    setViewState((currentViewState) => {
      const nextViewState = buildBackendViewState(backendScene)

      if (
        currentViewState.fovDegrees === nextViewState.fovDegrees &&
        currentViewState.centerAltDeg === nextViewState.centerAltDeg &&
        currentViewState.centerAzDeg === nextViewState.centerAzDeg
      ) {
        return currentViewState
      }

      return nextViewState
    })
  }, [backendScene])

  useEffect(() => {
    if (selection.selectionStatus === 'active' || selection.selectionStatus === 'hidden') {
      setInspectorOpen(true)
    }
  }, [selection.selectionStatus])

  const handleAtmosphereStatusChange = useCallback(() => undefined, [])
  const handleViewStateChange = useCallback((nextViewState: { fovDegrees: number; centerAltDeg: number; centerAzDeg: number }) => {
    setViewState((currentViewState) => {
      if (
        currentViewState.fovDegrees === nextViewState.fovDegrees &&
        currentViewState.centerAltDeg === nextViewState.centerAltDeg &&
        currentViewState.centerAzDeg === nextViewState.centerAzDeg
      ) {
        return currentViewState
      }

      return nextViewState
    })
  }, [])
  const phaseBandState = sunState.phaseLabel === 'Low Sun' ? 'Twilight' : sunState.phaseLabel
  const searchableSceneObjects = useMemo(
    () => [...sceneObjects].sort((left, right) => left.name.localeCompare(right.name)),
    [sceneObjects],
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

  const toggleAid = useCallback((key: 'constellations' | 'azimuthRing' | 'altitudeRings') => {
    setAidVisibility((currentVisibility) => ({
      ...currentVisibility,
      [key]: !currentVisibility[key],
    }))
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

    selection.selectObject(nextObject.id)
    setSearchQuery(nextObject.name)
  }, [searchableSceneObjects, selection])

  return (
    <div className="sky-engine-page sky-engine-page--immersive">
      <main className="sky-engine-page__viewport-shell sky-engine-page__viewport-shell--immersive">
        <SkyEngineHubShell />
        <SkyEngineScene
          key={[
            backendScene.timestamp,
            backendScene.observer.latitude,
            backendScene.observer.longitude,
            backendScene.scene_state.center_alt_deg,
            backendScene.scene_state.center_az_deg,
            backendScene.scene_state.fov_deg,
          ].join(':')}
          backendStars={resolvedBackendTileStars}
          observer={observer}
          objects={sceneObjects}
          scenePacket={skyScenePacket}
          initialViewState={buildBackendViewState(backendScene)}
          projectionMode={observerSnapshot.projection}
          sunState={sunState}
          selectedObjectId={selection.selectedObjectId}
          guidedObjectIds={guidedObjectIds}
          aidVisibility={aidVisibility}
          onSelectObject={selection.selectObject}
          onAtmosphereStatusChange={handleAtmosphereStatusChange}
          onViewStateChange={handleViewStateChange}
        />

        <div className="sky-engine-page__overlay sky-engine-page__overlay--top-bar">
          <div className="sky-engine-page__top-bar" aria-label="Sky Engine top bar">
            <div className="sky-engine-page__top-bar-section sky-engine-page__top-bar-section--actions">
              <Link className="sky-engine-page__back-link" to="/">
                Back
              </Link>
              <button
                type="button"
                className={`sky-engine-page__control-chip${inspectorOpen ? ' sky-engine-page__control-chip--active' : ''}`}
                onClick={() => setInspectorOpen((currentValue) => !currentValue)}
              >
                {inspectorOpen ? 'Hide inspector' : 'Show inspector'}
              </button>
              <button
                type="button"
                className="sky-engine-page__time-reset sky-engine-page__time-reset--top"
                onClick={sceneTime.resetSceneTime}
              >
                Reset
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
                placeholder="Search visible sky objects"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <datalist id="sky-engine-target-search-list">
                {matchingSearchObjects.map((object) => (
                  <option key={object.id} value={object.name} />
                ))}
              </datalist>
              <button type="submit" className="sky-engine-page__control-chip sky-engine-page__search-submit">
                Find
              </button>
            </form>
            <div className="sky-engine-page__top-bar-meta">
              <div className="sky-engine-page__status-pill">
                <span className="sky-engine-page__top-bar-label">Data</span>
                <strong>{resolveRuntimeModeLabel(diagnostics?.dataMode, repositoryMode)}</strong>
              </div>
              <div className="sky-engine-page__status-pill sky-engine-page__status-pill--wide">
                <span className="sky-engine-page__top-bar-label">FOV</span>
                <strong>{formatDisplayedFov(viewState.fovDegrees)}</strong>
              </div>
              {selection.selectedObject ? (
                <div className="sky-engine-page__status-pill sky-engine-page__status-pill--wide">
                  <span className="sky-engine-page__top-bar-label">Target</span>
                  <strong>{selectedTargetName}</strong>
                  <small>{observer.label}</small>
                </div>
              ) : null}
              <div className="sky-engine-page__status-pill sky-engine-page__status-pill--wide">
                <span className="sky-engine-page__top-bar-label">Local time</span>
                <strong>{sceneTime.formattedSceneLocalTimestamp}</strong>
                <small>{sceneTime.formattedSceneOffset} · {SKY_ENGINE_LOCAL_TIME_ZONE} · {sceneTime.playbackRateLabel}</small>
              </div>
              <span
                className={`sky-engine-page__phase-pill sky-engine-page__phase-pill--${phaseModifier(sunState.phaseLabel)}`}
                data-phase={sunState.phaseLabel}
              >
                {sunState.phaseLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="sky-engine-page__overlay sky-engine-page__overlay--bottom-hud">
          <section className="sky-engine-page__bottom-hud" aria-label="Sky Engine controls">
            <div className="sky-engine-page__bottom-hud-main">
              <div>
                <span className="sky-engine-page__scene-link-label">Time scrub</span>
                <strong className="sky-engine-page__bottom-hud-offset">{sceneTime.formattedScaleOffset}</strong>
              </div>
              <div className="sky-engine-page__bottom-hud-stats">
                <span>{diagnostics ? formatSkyDiagnosticsSummary({ ...diagnostics, visibleTileIds: skyEngineQuery.visibleTileIds }) : 'Loading tiles…'}</span>
                <span>{fallbackActive ? `${runtimeSourceLabel} fallback` : runtimeSourceLabel}</span>
                <span>{moonObject.isAboveHorizon ? `${moonObject.phaseLabel} moon` : 'Moon below horizon'}</span>
                <span>{guidanceTargets.length} guided now</span>
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
              min={sceneTime.sliderMin}
              max={sceneTime.sliderMax}
              step={sceneTime.sliderStep}
              value={sceneTime.sceneOffsetSeconds}
              aria-label="Scene time offset"
              onChange={(event) => sceneTime.setSceneOffsetSeconds(Number(event.target.value))}
            />

            <div className="sky-engine-page__bottom-hud-foot">
              <div className="sky-engine-page__control-group" aria-label="Time scale controls">
                <button type="button" className="sky-engine-page__time-reset" onClick={() => sceneTime.nudgeSceneOffset(-sceneTime.selectedTimeScale.stepSeconds)}>
                  - Step
                </button>
                <div className="sky-engine-page__time-slider-scale">
                  {SKY_ENGINE_TIME_SCALE_OPTIONS.map((scaleOption) => (
                    <button
                      key={scaleOption.id}
                      type="button"
                      className={`sky-engine-page__control-chip${sceneTime.timeScaleId === scaleOption.id ? ' sky-engine-page__control-chip--active' : ''}`}
                      onClick={() => sceneTime.setTimeScaleId(scaleOption.id)}
                    >
                      {scaleOption.shortLabel}
                    </button>
                  ))}
                </div>
                <button type="button" className="sky-engine-page__time-reset" onClick={() => sceneTime.nudgeSceneOffset(sceneTime.selectedTimeScale.stepSeconds)}>
                  + Step
                </button>
              </div>

              <div className="sky-engine-page__control-group" aria-label="Playback controls">
                {SKY_ENGINE_PLAYBACK_RATE_OPTIONS.map((playbackOption) => (
                  <button
                    key={playbackOption.value}
                    type="button"
                    className={`sky-engine-page__control-chip${sceneTime.playbackRate === playbackOption.value ? ' sky-engine-page__control-chip--active' : ''}`}
                    onClick={() => {
                      if (playbackOption.value === 0) {
                        sceneTime.togglePlayback()
                        return
                      }

                      sceneTime.setPlaybackRate(playbackOption.value)
                    }}
                  >
                    {getPlaybackButtonLabel(playbackOption.value, sceneTime.isPlaying, playbackOption.label)}
                  </button>
                ))}
                <button type="button" className="sky-engine-page__time-reset" onClick={sceneTime.resetSceneTime}>
                  Reset
                </button>
              </div>
            </div>

            <div className="sky-engine-page__bottom-hud-foot">
              <div className="sky-engine-page__target-chips" aria-label="Guided sky targets">
                {guidanceTargets.map((target) => (
                  <button
                    key={target.objectId}
                    type="button"
                    className={`sky-engine-page__target-chip${selection.selectedObjectId === target.objectId ? ' sky-engine-page__target-chip--active' : ''}`}
                    onClick={() => selection.selectObject(target.objectId)}
                  >
                    {target.name}
                  </button>
                ))}
              </div>
              <div className="sky-engine-page__target-chips" aria-label="Sky aid toggles">
                <button type="button" className={`sky-engine-page__control-chip${aidVisibility.constellations ? ' sky-engine-page__control-chip--active' : ''}`} onClick={() => toggleAid('constellations')}>
                  Constellations
                </button>
                <button type="button" className={`sky-engine-page__control-chip${aidVisibility.azimuthRing ? ' sky-engine-page__control-chip--active' : ''}`} onClick={() => toggleAid('azimuthRing')}>
                  Compass
                </button>
                <button type="button" className={`sky-engine-page__control-chip${aidVisibility.altitudeRings ? ' sky-engine-page__control-chip--active' : ''}`} onClick={() => toggleAid('altitudeRings')}>
                  Altitude
                </button>
              </div>
            </div>
          </section>
        </div>

        {inspectorOpen ? (
          <div className="sky-engine-page__overlay sky-engine-page__overlay--right">
            <SkyEngineDetailShell
              selectedObject={selection.selectedObject}
              selectionStatus={selection.selectionStatus}
              hiddenSelectionName={selection.hiddenSelectionName}
              onClearSelection={selection.clearSelection}
            />
          </div>
        ) : null}
      </main>
    </div>
  )
}

export default function SkyEnginePage() {
  const sceneQuery = useSceneByScopeDataQuery({
    scope: 'sky',
    engine: 'sky_engine',
  })
  const backendScene = useMemo(
    () => parseBackendSkyScenePayload(sceneQuery.data),
    [sceneQuery.data],
  )

  if (sceneQuery.isPending) {
    return (
      <SkyEngineOwnershipState
        title="Loading backend scene"
        detail="Waiting for /scene?scope=sky&engine=sky_engine to provide observer and timestamp."
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
