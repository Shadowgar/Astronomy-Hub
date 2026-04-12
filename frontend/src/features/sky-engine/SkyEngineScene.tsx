import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

import {
  computeBackendStarSceneObjects,
  computeDeepSkySceneObjects,
  computeMoonSceneObject,
  computePlanetSceneObjects,
  rankGuidanceTargets,
} from './astronomy'
import {
  assembleSkyScenePacket,
  buildSkyEngineQuery,
  fileBackedSkyTileRepository,
  mockSkyTileRepository,
  unitVectorToHorizontalCoordinates,
  type SkyTileRepositoryLoadResult,
} from './engine/sky'
import { SkyCore } from './engine/sky/runtime/SkyCore'
import { createAtmosphereModule } from './engine/sky/runtime/modules/AtmosphereModule'
import { createBackgroundRuntimeModule } from './engine/sky/runtime/modules/BackgroundRuntimeModule'
import { createLandscapeModule } from './engine/sky/runtime/modules/LandscapeModule'
import { createMilkyWayModule } from './engine/sky/runtime/modules/MilkyWayModule'
import { createDsoRuntimeModule } from './engine/sky/runtime/modules/DsoRuntimeModule'
import { createObjectRuntimeModule } from './engine/sky/runtime/modules/ObjectRuntimeModule'
import { createOverlayRuntimeModule } from './engine/sky/runtime/modules/OverlayRuntimeModule'
import { createPlanetRuntimeModule } from './engine/sky/runtime/modules/PlanetRuntimeModule'
import { createSceneReportingModule } from './engine/sky/runtime/modules/SceneReportingModule'
import { createSceneLuminanceReportModule } from './engine/sky/runtime/modules/SceneLuminanceReportModule'
import { createSkyBrightnessExposureModule } from './engine/sky/runtime/modules/SkyBrightnessExposureModule'
import { createSnapshotBridgeModule } from './engine/sky/runtime/modules/SnapshotBridgeModule'
import { createStarsModule } from './engine/sky/runtime/modules/StarsModule'
import { DEFAULT_SKY_ENGINE_AID_VISIBILITY } from './aidVisibilityPersistence'
import {
  createSceneRuntimeState,
  createSkySceneBridgeModule,
  createSkySceneRuntimeServices,
  type ScenePropsSnapshot,
  type SceneRuntimeRefs,
  type SkySceneRuntimeServices,
  type SkyEngineSceneProps,
  syncSkySceneRuntimeServices,
} from './SkyEngineRuntimeBridge'
import { computeSunState } from './solar'
import {
  computeEffectiveLimitingMagnitude,
  evaluateStellariumSkyBrightnessBaseline,
  resolveTonemapperLwmaxFromLuminance,
} from './skyBrightness'
import { resolveStarColorHex } from './starRenderer'
import type { SkyEngineAidVisibility, SkyEngineSceneObject, SkyEngineSunState } from './types'

const UI_SNAPSHOT_CADENCE_MS = 150
const DEGREES_TO_RADIANS = Math.PI / 180
const STELLARIUM_QUERY_TONEMAPPER_EXPOSURE = 2

interface SelectionMemory {
  objectId: string
  objectName: string
}

interface SceneControllerModel {
  scenePacket: ScenePropsSnapshot['scenePacket']
  sunState: SkyEngineSunState
  sceneObjects: readonly SkyEngineSceneObject[]
  guidedObjectIds: readonly string[]
  queryLimitingMagnitude: number
  tileQuerySignature: string
}

function resolveSceneQueryLimitingMagnitude(config: {
  observer: SkyEngineSceneProps['observer']
  currentViewState: ScenePropsSnapshot['initialViewState']
  sceneTimestampIso: string
  sunState: SkyEngineSunState
  moonObject: SkyEngineSceneObject
}) {
  const baseline = evaluateStellariumSkyBrightnessBaseline({
    timestampIso: config.sceneTimestampIso,
    latitudeDeg: config.observer.latitude,
    observerElevationM: config.observer.elevationFt * 0.3048,
    sunAltitudeRad: config.sunState.altitudeDeg * DEGREES_TO_RADIANS,
    moonAltitudeRad: config.moonObject.altitudeDeg * DEGREES_TO_RADIANS,
    moonMagnitude: config.moonObject.magnitude,
  })

  return computeEffectiveLimitingMagnitude({
    fovDegrees: config.currentViewState.fovDegrees,
    skyBrightness: baseline.skyBrightness,
    tonemapperExposure: STELLARIUM_QUERY_TONEMAPPER_EXPOSURE,
    tonemapperLwmax: resolveTonemapperLwmaxFromLuminance(baseline.zenithSkyLuminance),
  })
}

function syncSelectionMemory(
  selectionMemoryRef: React.MutableRefObject<SelectionMemory | null>,
  currentSceneObjects: readonly SkyEngineSceneObject[],
  objectId: string | null,
) {
  if (objectId === null) {
    selectionMemoryRef.current = null
    return
  }

  const nextSelectedObject = currentSceneObjects.find((object) => object.id === objectId)

  if (!nextSelectedObject) {
    return
  }

  selectionMemoryRef.current = {
    objectId: nextSelectedObject.id,
    objectName: nextSelectedObject.name,
  }
}

export interface SkyEngineSceneHandle {
  clearSelection: () => void
  nudgeSceneOffset: (deltaSeconds: number) => void
  resetSceneTime: () => void
  selectObject: (objectId: string | null) => void
  setAidVisibility: (aidVisibility: SkyEngineAidVisibility) => void
  setSkyCultureId: (skyCultureId: string) => void
  setPlaybackRate: (playbackRate: number) => void
  setSceneOffsetSeconds: (sceneOffsetSeconds: number) => void
  togglePlayback: () => void
}

function createAidVisibilitySignature(aidVisibility: SkyEngineAidVisibility) {
  return [aidVisibility.constellations, aidVisibility.azimuthRing, aidVisibility.altitudeRings]
    .map((value) => (value ? '1' : '0'))
    .join(':')
}

function buildTileQuerySignature(query: ReturnType<typeof buildSkyEngineQuery>, repositoryMode: SkyEngineSceneProps['repositoryMode']) {
  return [
    repositoryMode,
    query.limitingMagnitude.toFixed(2),
    query.activeTiers.join(','),
    query.visibleTileIds.join(','),
  ].join(':')
}

function buildPropsSignature(
  timestampIso: string,
  selectedObjectId: string | null,
  guidedObjectIds: readonly string[],
  aidVisibility: SkyEngineAidVisibility,
  skyCultureId: string,
  sceneObjects: readonly SkyEngineSceneObject[],
  scenePacket: ScenePropsSnapshot['scenePacket'],
  currentViewState: ScenePropsSnapshot['initialViewState'],
) {
  return [
    timestampIso,
    selectedObjectId ?? 'none',
    guidedObjectIds.join('|'),
    createAidVisibilitySignature(aidVisibility),
    skyCultureId,
    sceneObjects.length,
    scenePacket?.stars.length ?? 0,
    currentViewState.centerAltDeg.toFixed(1),
    currentViewState.centerAzDeg.toFixed(1),
    currentViewState.fovDegrees.toFixed(1),
  ].join(':')
}

function resolveCurrentViewState(services: SkySceneRuntimeServices): ScenePropsSnapshot['initialViewState'] {
  const centerDirection = services.navigationService.getCenterDirection()

  return {
    fovDegrees: Number(services.projectionService.getCurrentFovDegrees().toFixed(1)),
    centerAltDeg: Number(((Math.asin(Math.max(-1, Math.min(1, centerDirection.y))) * 180) / Math.PI).toFixed(1)),
    centerAzDeg: Number(((((Math.atan2(centerDirection.x, centerDirection.z) * 180) / Math.PI) + 360) % 360).toFixed(1)),
  }
}

async function loadSkyRuntimeTiles(
  repositoryMode: SkyEngineSceneProps['repositoryMode'],
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

function buildEngineStarSceneObjects(
  scenePacket: ScenePropsSnapshot['scenePacket'],
  runtimeTiles: NonNullable<SkyTileRepositoryLoadResult['tiles']>,
  diagnosticsMode: SkyTileRepositoryLoadResult['mode'] | undefined,
  sceneTimestampIso: string,
): readonly SkyEngineSceneObject[] {
  const runtimeStarMetadata = new Map<string, { tileId: string; star: (typeof runtimeTiles)[number]['stars'][number] }>()

  runtimeTiles.forEach((tile) => {
    tile.stars.forEach((star) => {
      if (!runtimeStarMetadata.has(star.id)) {
        runtimeStarMetadata.set(star.id, { tileId: tile.tileId, star })
      }
    })
  })

  return (scenePacket?.stars ?? []).map((star) => {
    const metadata = runtimeStarMetadata.get(star.id)
    const runtimeStar = metadata?.star
    const horizontalCoordinates = unitVectorToHorizontalCoordinates({ x: star.x, y: star.y, z: star.z })
    const isHipparcosMode = diagnosticsMode === 'hipparcos'
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
      timestampIso: sceneTimestampIso,
      isAboveHorizon: horizontalCoordinates.isAboveHorizon,
    } satisfies SkyEngineSceneObject
  })
}

function buildSceneControllerModel(config: {
  backendStars: SkyEngineSceneProps['backendStars']
  observer: SkyEngineSceneProps['observer']
  projectionMode: NonNullable<SkyEngineSceneProps['projectionMode']>
  repositoryMode: SkyEngineSceneProps['repositoryMode']
  currentViewState: ScenePropsSnapshot['initialViewState']
  runtimeTiles: NonNullable<SkyTileRepositoryLoadResult['tiles']>
  tileLoadResult: SkyTileRepositoryLoadResult | null
  sceneTimestampIso: string
}) {
  const observerSnapshot = {
    timestampUtc: config.sceneTimestampIso,
    latitudeDeg: config.observer.latitude,
    longitudeDeg: config.observer.longitude,
    elevationM: config.observer.elevationFt * 0.3048,
    fovDeg: config.currentViewState.fovDegrees,
    centerAltDeg: config.currentViewState.centerAltDeg,
    centerAzDeg: config.currentViewState.centerAzDeg,
    projection: config.projectionMode,
  }
  const sunState = computeSunState(config.observer, config.sceneTimestampIso)
  const moonObject = computeMoonSceneObject(config.observer, config.sceneTimestampIso)
  const queryLimitingMagnitude = resolveSceneQueryLimitingMagnitude({
    observer: config.observer,
    currentViewState: config.currentViewState,
    sceneTimestampIso: config.sceneTimestampIso,
    sunState,
    moonObject,
  })
  const query = buildSkyEngineQuery(observerSnapshot, {
    limitingMagnitude: queryLimitingMagnitude,
  })
  const scenePacket = config.tileLoadResult
    ? assembleSkyScenePacket(query, config.runtimeTiles, config.tileLoadResult)
    : null
  const planetObjects = computePlanetSceneObjects(config.observer, config.sceneTimestampIso)
  const deepSkyObjects = computeDeepSkySceneObjects(config.observer, config.sceneTimestampIso)
  const backendTileStarSceneObjects = computeBackendStarSceneObjects(
    config.observer,
    config.sceneTimestampIso,
    config.backendStars,
  )
  const engineStarSceneObjects = buildEngineStarSceneObjects(
    scenePacket,
    config.runtimeTiles,
    config.tileLoadResult?.mode ?? config.repositoryMode,
    config.sceneTimestampIso,
  )
  const mergedStars = new Map<string, SkyEngineSceneObject>()

  backendTileStarSceneObjects.forEach((star) => {
    mergedStars.set(star.id, star)
  })
  engineStarSceneObjects.forEach((star) => {
    if (!mergedStars.has(star.id)) {
      mergedStars.set(star.id, star)
    }
  })

  const baseSceneObjects = [...Array.from(mergedStars.values()), ...planetObjects, ...deepSkyObjects, moonObject]
  const guidanceTargets = rankGuidanceTargets(baseSceneObjects, 5)
  const guidanceLookup = new Map(
    guidanceTargets.map((target, index) => [
      target.objectId,
      { score: target.score, tier: index < 2 ? 'featured' as const : 'guide' as const },
    ]),
  )
  const sceneObjects = baseSceneObjects.map((object) => {
    const guidance = guidanceLookup.get(object.id)

    if (!guidance) {
      return object
    }

    return {
      ...object,
      guidanceScore: guidance.score,
      guidanceTier: guidance.tier,
    }
  })

  return {
    scenePacket,
    sunState,
    sceneObjects,
    guidedObjectIds: guidanceTargets.map((target) => target.objectId),
    queryLimitingMagnitude,
    tileQuerySignature: buildTileQuerySignature(query, config.repositoryMode),
  } satisfies SceneControllerModel
}

const SkyEngineScene = forwardRef<SkyEngineSceneHandle, SkyEngineSceneProps>(function SkyEngineScene(
  {
    backendStars,
    initialSceneTimestampIso,
    observer,
    initialViewState,
    projectionMode = 'stereographic',
    repositoryMode,
    snapshotStore,
    initialAidVisibility = DEFAULT_SKY_ENGINE_AID_VISIBILITY,
    initialSkyCultureId = 'western',
    debugTelemetryEnabled = false,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const coreRef = useRef<SkyCore<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> | null>(null)
  const propsVersionRef = useRef(0)
  const currentSceneObjectsRef = useRef<readonly SkyEngineSceneObject[]>([])
  const selectedObjectIdRef = useRef<string | null>(null)
  const selectionMemoryRef = useRef<SelectionMemory | null>(null)
  const aidVisibilityRef = useRef<SkyEngineAidVisibility>(initialAidVisibility)
  const skyCultureIdRef = useRef<string>(initialSkyCultureId)
  const runtimeTilesRef = useRef<NonNullable<SkyTileRepositoryLoadResult['tiles']>>([])
  const tileLoadResultRef = useRef<SkyTileRepositoryLoadResult | null>(null)
  const tileLoadGenerationRef = useRef(0)
  const lastTileQuerySignatureRef = useRef('')
  const lastPropsSignatureRef = useRef('')
  const syncRuntimeModelRef = useRef<(force?: boolean) => void>(() => undefined)
  const defaultDynamicModelRef = useRef<SceneControllerModel>(
    buildSceneControllerModel({
      backendStars,
      observer,
      projectionMode,
      repositoryMode,
      currentViewState: initialViewState,
      runtimeTiles: runtimeTilesRef.current,
      tileLoadResult: tileLoadResultRef.current,
      sceneTimestampIso: initialSceneTimestampIso,
    }),
  )

  const initialSnapshot: ScenePropsSnapshot = {
    backendStars,
    initialSceneTimestampIso,
    observer,
    objects: defaultDynamicModelRef.current.sceneObjects,
    scenePacket: defaultDynamicModelRef.current.scenePacket,
    initialViewState,
    projectionMode,
    sunState: defaultDynamicModelRef.current.sunState,
    selectedObjectId: null,
    guidedObjectIds: defaultDynamicModelRef.current.guidedObjectIds,
    aidVisibility: aidVisibilityRef.current,
    skyCultureId: skyCultureIdRef.current,
    hiddenSelectionName: null,
    onSelectObject: (objectId) => {
      selectedObjectIdRef.current = objectId
    },
  }
  const initialSnapshotRef = useRef(initialSnapshot)

  useImperativeHandle(ref, () => ({
    clearSelection() {
      selectedObjectIdRef.current = null
      selectionMemoryRef.current = null
      syncRuntimeModelRef.current(true)
    },
    nudgeSceneOffset(deltaSeconds) {
      coreRef.current?.dispatchInput((_runtime, services) => {
        services.clockService.nudgeSceneOffset(deltaSeconds)
      })
      syncRuntimeModelRef.current(true)
    },
    resetSceneTime() {
      coreRef.current?.dispatchInput((_runtime, services) => {
        services.clockService.resetSceneTime()
      })
      syncRuntimeModelRef.current(true)
    },
    selectObject(objectId) {
      selectedObjectIdRef.current = objectId
      if (!objectId) {
        selectionMemoryRef.current = null
      }
      syncRuntimeModelRef.current(true)
    },
    setAidVisibility(aidVisibility) {
      aidVisibilityRef.current = aidVisibility
      syncRuntimeModelRef.current(true)
    },
    setSkyCultureId(skyCultureId) {
      skyCultureIdRef.current = skyCultureId
      syncRuntimeModelRef.current(true)
    },
    setPlaybackRate(playbackRate) {
      coreRef.current?.dispatchInput((_runtime, services) => {
        services.clockService.setPlaybackRate(playbackRate)
      })
      syncRuntimeModelRef.current(true)
    },
    setSceneOffsetSeconds(sceneOffsetSeconds) {
      coreRef.current?.dispatchInput((_runtime, services) => {
        services.clockService.setSceneOffsetSeconds(sceneOffsetSeconds)
      })
      syncRuntimeModelRef.current(true)
    },
    togglePlayback() {
      coreRef.current?.dispatchInput((_runtime, services) => {
        services.clockService.togglePlayback()
      })
      syncRuntimeModelRef.current(true)
    },
  }), [])

  useEffect(() => {
    const canvas = canvasRef.current
    const backgroundCanvas = backgroundCanvasRef.current

    if (!canvas || !backgroundCanvas) {
      return undefined
    }

    let disposed = false
    const core = new SkyCore<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices>({
      canvas,
      backgroundCanvas,
      initialProps: initialSnapshotRef.current,
      initialPropsVersion: propsVersionRef.current,
      createRuntime: ({ canvas: runtimeCanvas, backgroundCanvas: runtimeBackgroundCanvas }) => createSceneRuntimeState({
        canvas: runtimeCanvas,
        backgroundCanvas: runtimeBackgroundCanvas,
      }),
      createServices: ({ initialProps }) => createSkySceneRuntimeServices(initialProps),
      syncServices: (services, props) => syncSkySceneRuntimeServices(services, props),
      startServices: ({ runtime, services, getProps, requestRender }) => {
        services.inputService.attach({
          canvas: runtime.canvas,
          getProjectedPickEntries: () => runtime.projectedPickEntries,
          getProps,
          navigationService: services.navigationService,
          projectionService: services.projectionService,
          requestRender,
        })
      },
      updateServices: ({ services, deltaSeconds }) => {
        services.clockService.advanceFrame(deltaSeconds)
      },
      stopServices: ({ services }) => {
        services.inputService.detach()
      },
    })

    const syncRuntimeModel = (force = false) => {
      const runtimeContext = core.withContext((runtime, services) => ({ runtime, services }))

      if (!runtimeContext) {
        return
      }

      const currentViewState = resolveCurrentViewState(runtimeContext.services)
      const sceneTimestampIso = runtimeContext.services.clockService.getSceneTimestampIso() ?? initialSceneTimestampIso
      const nextModel = buildSceneControllerModel({
        backendStars,
        observer,
        projectionMode,
        repositoryMode,
        currentViewState,
        runtimeTiles: runtimeTilesRef.current,
        tileLoadResult: tileLoadResultRef.current,
        sceneTimestampIso,
      })
      currentSceneObjectsRef.current = nextModel.sceneObjects

      const selectedObject = nextModel.sceneObjects.find((object) => object.id === selectedObjectIdRef.current) ?? null
      if (selectedObject) {
        selectionMemoryRef.current = {
          objectId: selectedObject.id,
          objectName: selectedObject.name,
        }
      }

      if (nextModel.tileQuerySignature !== lastTileQuerySignatureRef.current) {
        lastTileQuerySignatureRef.current = nextModel.tileQuerySignature
        const loadGeneration = ++tileLoadGenerationRef.current
        const query = buildSkyEngineQuery({
          timestampUtc: sceneTimestampIso,
          latitudeDeg: observer.latitude,
          longitudeDeg: observer.longitude,
          elevationM: observer.elevationFt * 0.3048,
          fovDeg: currentViewState.fovDegrees,
          centerAltDeg: currentViewState.centerAltDeg,
          centerAzDeg: currentViewState.centerAzDeg,
          projection: projectionMode,
        }, {
          limitingMagnitude: nextModel.queryLimitingMagnitude,
        })

        void loadSkyRuntimeTiles(repositoryMode, query).then((result) => {
          if (disposed || loadGeneration !== tileLoadGenerationRef.current) {
            return
          }

          runtimeTilesRef.current = result.tiles
          tileLoadResultRef.current = result
          syncRuntimeModel(true)
        })
      }

      const nextProps: ScenePropsSnapshot = {
        backendStars,
        initialSceneTimestampIso,
        observer,
        objects: nextModel.sceneObjects,
        scenePacket: nextModel.scenePacket,
        initialViewState,
        projectionMode,
        sunState: nextModel.sunState,
        selectedObjectId: selectedObjectIdRef.current,
        guidedObjectIds: nextModel.guidedObjectIds,
        aidVisibility: aidVisibilityRef.current,
        skyCultureId: skyCultureIdRef.current,
        hiddenSelectionName: selectedObject ? null : selectionMemoryRef.current?.objectName ?? null,
        onSelectObject: (objectId) => {
          selectedObjectIdRef.current = objectId
          syncSelectionMemory(selectionMemoryRef, currentSceneObjectsRef.current, objectId)

          syncRuntimeModelRef.current(true)
        },
      }
      const nextSignature = buildPropsSignature(
        sceneTimestampIso,
        nextProps.selectedObjectId,
        nextProps.guidedObjectIds,
        nextProps.aidVisibility,
        nextProps.skyCultureId,
        nextProps.objects,
        nextProps.scenePacket,
        currentViewState,
      )

      if (!force && nextSignature === lastPropsSignatureRef.current) {
        return
      }

      lastPropsSignatureRef.current = nextSignature
      propsVersionRef.current += 1
      core.syncProps(nextProps, propsVersionRef.current)
    }

    syncRuntimeModelRef.current = syncRuntimeModel
    core.registerModule(createSceneLuminanceReportModule())
    core.registerModule(createSkyBrightnessExposureModule())
    core.registerModule(createAtmosphereModule())
    core.registerModule(createMilkyWayModule())
    core.registerModule(createLandscapeModule())
    core.registerModule(createBackgroundRuntimeModule())
    core.registerModule(createStarsModule())
    core.registerModule(createPlanetRuntimeModule())
    core.registerModule(createDsoRuntimeModule())
    core.registerModule(createObjectRuntimeModule())
    core.registerModule(createOverlayRuntimeModule())
    core.registerModule(createSnapshotBridgeModule(snapshotStore, UI_SNAPSHOT_CADENCE_MS))
    if (debugTelemetryEnabled) {
      core.registerModule(createSceneReportingModule())
    }
    core.registerModule(createSkySceneBridgeModule())
    coreRef.current = core
    core.start()
    syncRuntimeModel(true)

    let syncFrameHandle = 0
    let lastSyncAtMs = performance.now()

    const pumpSnapshotSync = (nowMs: number) => {
      if (disposed) {
        return
      }

      if (nowMs - lastSyncAtMs >= UI_SNAPSHOT_CADENCE_MS) {
        lastSyncAtMs = nowMs
        syncRuntimeModel(false)
      }

      syncFrameHandle = globalThis.requestAnimationFrame(pumpSnapshotSync)
    }

    syncFrameHandle = globalThis.requestAnimationFrame(pumpSnapshotSync)

    return () => {
      disposed = true
      globalThis.cancelAnimationFrame(syncFrameHandle)
      core.dispose()
      coreRef.current = null
      snapshotStore.reset()
    }
  }, [])

  return (
    <div className="sky-engine-scene">
      <canvas ref={backgroundCanvasRef} className="sky-engine-scene__background" />
      <canvas ref={canvasRef} className="sky-engine-scene__canvas" aria-label="Sky Engine scene" />
    </div>
  )
})

export default SkyEngineScene
