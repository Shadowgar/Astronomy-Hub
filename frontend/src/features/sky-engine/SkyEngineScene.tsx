import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react'

import {
  computeBackendStarSceneObjects,
  computeCometSceneObjects,
  computeDeepSkySceneObjects,
  computeMeteorShowerSceneObjects,
  computeMinorPlanetSceneObjects,
  computeMoonSceneObject,
  computePlanetSceneObjects,
  computeSatelliteSceneObjects,
  rankGuidanceTargets,
} from './astronomy'
import {
  buildSkyEngineQuery,
  fileBackedSkyTileRepository,
  buildHipDetailRoute,
  findRuntimeStarByHipInTiles,
  getSkyTileMaxLevel,
  normalizeProjectionMat11ForHips,
  parseHipIdFromRuntimeStar,
  selectVisibleTileIds,
  type SkyEngineHipsViewport,
  type SkyEngineQuery,
  unitVectorToHorizontalCoordinates,
  type SkyTileRepositoryLoadResult,
} from './engine/sky'
import {
  computeObserverFrameAstrometrySignatureForPropSync,
  mergeObserverSnapshotWithDerivedGeometry,
} from './engine/sky/runtime/observerAstrometryMerge'
import { deriveObserverGeometry } from './engine/sky/runtime/observerDerivedGeometry'
import type { ObserverAstrometrySnapshot } from './engine/sky/transforms/coordinates'
import { loadDsoCatalog } from './engine/sky/adapters/dsoRepository'
import { SkyCore } from './engine/sky/runtime/SkyCore'
import { runStellariumCoreRenderSpine } from './engine/sky/runtime/stellariumCoreRenderSpine'
import { runStellariumCoreUpdateObserverPreamble } from './engine/sky/runtime/stellariumCoreUpdateObserver'
import { createAtmosphereModule } from './engine/sky/runtime/modules/AtmosphereModule'
import { createBackgroundRuntimeModule } from './engine/sky/runtime/modules/BackgroundRuntimeModule'
import { createLandscapeModule } from './engine/sky/runtime/modules/LandscapeModule'
import { createMilkyWayModule } from './engine/sky/runtime/modules/MilkyWayModule'
import { createMovementsRuntimeModule } from './engine/sky/runtime/modules/MovementsRuntimeModule'
import { createDsoRuntimeModule } from './engine/sky/runtime/modules/DsoRuntimeModule'
import { createObjectRuntimeModule } from './engine/sky/runtime/modules/ObjectRuntimeModule'
import { createOverlayRuntimeModule } from './engine/sky/runtime/modules/OverlayRuntimeModule'
import { createPlanetRuntimeModule } from './engine/sky/runtime/modules/PlanetRuntimeModule'
import { createPointerRuntimeModule } from './engine/sky/runtime/modules/PointerRuntimeModule'
import { createSatelliteRuntimeModule } from './engine/sky/runtime/modules/SatelliteRuntimeModule'
import { createSceneReportingModule } from './engine/sky/runtime/modules/SceneReportingModule'
import { createSceneLuminanceReportModule } from './engine/sky/runtime/modules/SceneLuminanceReportModule'
import { createSkyBrightnessExposureModule } from './engine/sky/runtime/modules/SkyBrightnessExposureModule'
import { createSnapshotBridgeModule } from './engine/sky/runtime/modules/SnapshotBridgeModule'
import { createStarsModule } from './engine/sky/runtime/modules/StarsModule'
import {
  createWebGL2StarsHarnessModule,
  type WebGL2StarsHarnessDiagnostics,
} from './engine/sky/runtime/modules/WebGL2StarsHarnessModule'
import { WebGL2StellariumRenderer } from './engine/sky/renderer/webgl2/WebGL2StellariumRenderer'
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
import {
  resolveRepositoryQueryLimitingMagnitude,
  resolveScenePacketForQuery,
} from './sceneQueryState'
import { resolveStarColorHex } from './starRenderer'
import type { SkyEngineAidVisibility, SkyEngineSceneObject, SkyEngineSunState } from './types'
import type { WebGL2StarsHarnessConfig } from './webgl2StarsHarnessConfig'

const UI_SNAPSHOT_CADENCE_MS = 150
export const RUNTIME_MODEL_SYNC_CADENCE_MS = 1000
const DEGREES_TO_RADIANS = Math.PI / 180
const STELLARIUM_QUERY_TONEMAPPER_EXPOSURE = 2
const STARTUP_LOADING_STAR_SEED_OFFSETS = [
  { id: 'a', name: 'Seed A', dAlt: 0, dAz: 0, mag: 0.2 },
  { id: 'b', name: 'Seed B', dAlt: 6, dAz: -8, mag: 0.8 },
  { id: 'c', name: 'Seed C', dAlt: -5, dAz: 7, mag: 1.1 },
  { id: 'd', name: 'Seed D', dAlt: 10, dAz: 12, mag: 1.4 },
  { id: 'e', name: 'Seed E', dAlt: -11, dAz: -14, mag: 1.8 },
  { id: 'f', name: 'Seed F', dAlt: 14, dAz: -18, mag: 2.1 },
] as const

const DEFAULT_WEBGL2_STARS_HARNESS_CONFIG: WebGL2StarsHarnessConfig = {
  enabled: false,
  mode: 'overlay',
  devOnly: true,
}

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
  observerFrameAstrometry: ObserverAstrometrySnapshot
  hipsViewport?: SkyEngineHipsViewport
}

interface PropsSignatureConfig {
  timestampIso: string
  selectedObjectId: string | null
  guidedObjectIds: readonly string[]
  aidVisibility: SkyEngineAidVisibility
  skyCultureId: string
  sceneObjects: readonly SkyEngineSceneObject[]
  scenePacket: ScenePropsSnapshot['scenePacket']
  currentViewState: ScenePropsSnapshot['initialViewState']
  observerFrameAstrometry: ObserverAstrometrySnapshot
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

  const computedLimitingMagnitude = computeEffectiveLimitingMagnitude({
    fovDegrees: config.currentViewState.fovDegrees,
    skyBrightness: baseline.skyBrightness,
    tonemapperExposure: STELLARIUM_QUERY_TONEMAPPER_EXPOSURE,
    tonemapperLwmax: resolveTonemapperLwmaxFromLuminance(baseline.zenithSkyLuminance),
  })
  return computedLimitingMagnitude
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
  return [
    aidVisibility.constellations,
    aidVisibility.azimuthRing,
    aidVisibility.altitudeRings,
    aidVisibility.atmosphere,
    aidVisibility.landscape,
    aidVisibility.deepSky,
    aidVisibility.nightMode,
  ]
    .map((value) => (value ? '1' : '0'))
    .join(':')
}

function buildPropsSignature(config: PropsSignatureConfig) {
  return [
    config.timestampIso,
    config.selectedObjectId ?? 'none',
    config.guidedObjectIds.join('|'),
    createAidVisibilitySignature(config.aidVisibility),
    config.skyCultureId,
    config.sceneObjects.length,
    config.scenePacket?.stars.length ?? 0,
    config.currentViewState.centerAltDeg.toFixed(1),
    config.currentViewState.centerAzDeg.toFixed(1),
    config.currentViewState.fovDegrees.toFixed(1),
    computeObserverFrameAstrometrySignatureForPropSync(config.observerFrameAstrometry),
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

/** Stellarium `hips_get_render_order` inputs: viewport height + vertical projection scale (normalized to match `hips.c` ratio). */
function resolveHipsViewportForTileQuery(services: SkySceneRuntimeServices): SkyEngineHipsViewport {
  const centerDirection = services.navigationService.getCenterDirection()
  const windowHeightPx = services.projectionService.getViewportHeight()
  const projectionScalePx = services.projectionService.getProjectionScale(centerDirection)

  return {
    windowHeightPx,
    projectionMat11: normalizeProjectionMat11ForHips(projectionScalePx, windowHeightPx),
  }
}

async function loadSkyRuntimeTiles(
  query: SkyEngineQuery,
): Promise<SkyTileRepositoryLoadResult> {
  const initialResult = await fileBackedSkyTileRepository.loadTiles(query)
  const manifestMaxTileLevel = initialResult.manifest?.maxLevel

  if (manifestMaxTileLevel == null || manifestMaxTileLevel === (query.maxTileLevel ?? getSkyTileMaxLevel())) {
    return initialResult
  }

  return fileBackedSkyTileRepository.loadTiles({
    ...query,
    maxTileLevel: manifestMaxTileLevel,
    visibleTileIds: selectVisibleTileIds(query.observer, query.limitingMagnitude, manifestMaxTileLevel, query.hipsViewport),
  })
}

function buildEngineStarSceneObjects(
  scenePacket: ScenePropsSnapshot['scenePacket'],
  runtimeTiles: NonNullable<SkyTileRepositoryLoadResult['tiles']>,
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
  const hipLookupByStarId = new Map<string, boolean>()
  runtimeStarMetadata.forEach(({ star }) => {
    const hip = parseHipIdFromRuntimeStar(star)
    if (hip == null) {
      return
    }
    const lookedUp = findRuntimeStarByHipInTiles(runtimeTiles, hip)
    hipLookupByStarId.set(star.id, lookedUp?.id === star.id)
  })

  return (scenePacket?.stars ?? []).map((star) => {
    const metadata = runtimeStarMetadata.get(star.id)
    const runtimeStar = metadata?.star
    const horizontalCoordinates = unitVectorToHorizontalCoordinates({ x: star.x, y: star.y, z: star.z })
    const displayName = runtimeStar?.properName ?? runtimeStar?.bayer ?? runtimeStar?.flamsteed ?? runtimeStar?.sourceId ?? star.label ?? star.id
    const tileSourceLabel = metadata?.star.sourceId ?? metadata?.tileId ?? 'unknown-tile'
    const catalogLabel = runtimeStar?.catalog === 'gaia' ? 'Gaia HiPS' : 'Hipparcos'
    const hipLookupStatus = hipLookupByStarId.get(star.id)
    const hipLookupNote = hipLookupStatus == null
      ? ''
      : hipLookupStatus
        ? ' HIP lookup confirms this tile star.'
        : ' HIP lookup did not resolve this star on the non-Gaia path.'
    const hip = runtimeStar ? parseHipIdFromRuntimeStar(runtimeStar) : null
    const detailRoute = hip == null ? undefined : buildHipDetailRoute(hip)

    return {
      id: star.id,
      name: displayName,
      type: 'star',
      altitudeDeg: horizontalCoordinates.altitudeDeg,
      azimuthDeg: horizontalCoordinates.azimuthDeg,
      magnitude: star.mag,
      colorHex: resolveStarColorHex(runtimeStar?.colorIndex ?? star.colorIndex),
      summary: `${catalogLabel} ${star.tier} star streamed from the active runtime survey tiles.`,
      description: `Loaded from ${metadata?.tileId ?? 'unknown-tile'} and emitted through the Sky Engine scene packet from the active file-backed survey repository.`,
      truthNote: `Engine-owned ${catalogLabel} tile data drives this star. Source: ${tileSourceLabel}.${hipLookupNote}`,
      source: 'engine_catalog_tile',
      trackingMode: 'fixed_equatorial',
      detailRoute,
      rightAscensionHours: runtimeStar ? runtimeStar.raDeg / 15 : undefined,
      declinationDeg: runtimeStar?.decDeg,
      colorIndexBV: runtimeStar?.colorIndex ?? star.colorIndex,
      timestampIso: sceneTimestampIso,
      isAboveHorizon: horizontalCoordinates.isAboveHorizon,
    } satisfies SkyEngineSceneObject
  })
}

function buildStartupLoadingStarSceneObjects(config: {
  scenePacket: ScenePropsSnapshot['scenePacket']
  backendStars: SkyEngineSceneProps['backendStars']
  observer: SkyEngineSceneProps['observer']
  currentViewState: ScenePropsSnapshot['initialViewState']
  sceneTimestampIso: string
}): readonly SkyEngineSceneObject[] {
  if (config.scenePacket) {
    return []
  }

  if (config.backendStars.length > 0) {
    return computeBackendStarSceneObjects(config.observer, config.sceneTimestampIso, config.backendStars)
  }

  const baseAlt = config.currentViewState.centerAltDeg
  const baseAz = config.currentViewState.centerAzDeg
  return STARTUP_LOADING_STAR_SEED_OFFSETS.map((seed, index) => {
    const guidanceTier: SkyEngineSceneObject['guidanceTier'] = index === 0 ? 'guide' : 'none'
    return {
      id: `startup-seed-${seed.id}`,
      name: seed.name,
      type: 'star' as const,
    altitudeDeg: Math.max(-85, Math.min(85, baseAlt + seed.dAlt)),
    azimuthDeg: (((baseAz + seed.dAz) % 360) + 360) % 360,
    magnitude: seed.mag,
    colorHex: '#f4f7ff',
    summary: 'Temporary startup star seed while tile-backed catalog is loading.',
    description: 'This seed star is view-centered and temporary. It is removed automatically when runtime catalog stars become available.',
    truthNote: 'Temporary startup seed used to avoid empty-star view during tile-load intervals. Not a full catalog or parity surface.',
      source: 'temporary_scene_seed',
      trackingMode: 'static' as const,
      timestampIso: config.sceneTimestampIso,
      isAboveHorizon: true,
      guidanceTier,
    } satisfies SkyEngineSceneObject
  })
}

function buildSceneControllerModel(config: {
  backendStars: SkyEngineSceneProps['backendStars']
  backendSatellites: SkyEngineSceneProps['backendSatellites']
  observer: SkyEngineSceneProps['observer']
  projectionMode: NonNullable<SkyEngineSceneProps['projectionMode']>
  repositoryMode: SkyEngineSceneProps['repositoryMode']
  currentViewState: ScenePropsSnapshot['initialViewState']
  runtimeTiles: NonNullable<SkyTileRepositoryLoadResult['tiles']>
  dsoCatalog: Parameters<typeof computeDeepSkySceneObjects>[2]
  tileLoadResult: SkyTileRepositoryLoadResult | null
  resolvedTileQuerySignature: string
  previousScenePacket: ScenePropsSnapshot['scenePacket']
  sceneTimestampIso: string
  hipsViewport?: SkyEngineHipsViewport
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
  const queryLimitingMagnitude = resolveRepositoryQueryLimitingMagnitude(
    config.repositoryMode,
    resolveSceneQueryLimitingMagnitude({
      observer: config.observer,
      currentViewState: config.currentViewState,
      sceneTimestampIso: config.sceneTimestampIso,
      sunState,
      moonObject,
    }),
    {
      // Bootstrap startup on a bounded Hipparcos packet first so scenePacket promotion
      // does not block on deeper multi-survey payload completion.
      bootstrapCatalogOnly: config.previousScenePacket == null,
    },
  )
  const derivedGeometry = deriveObserverGeometry(
    {
      label: 'hub',
      latitude: config.observer.latitude,
      longitude: config.observer.longitude,
      elevationFt: config.observer.elevationFt,
    },
    config.sceneTimestampIso,
    'full',
    null,
  )
  const observerFrameAstrometry = mergeObserverSnapshotWithDerivedGeometry(observerSnapshot, derivedGeometry)
  const query = buildSkyEngineQuery(observerSnapshot, {
    limitingMagnitude: queryLimitingMagnitude,
    observerFrameAstrometry,
    hipsViewport: config.hipsViewport,
  })
  const scenePacketState = resolveScenePacketForQuery({
    query,
    repositoryMode: config.repositoryMode,
    runtimeTiles: config.runtimeTiles,
    tileLoadResult: config.tileLoadResult,
    resolvedTileQuerySignature: config.resolvedTileQuerySignature,
    previousScenePacket: config.previousScenePacket,
  })
  const scenePacket = scenePacketState.scenePacket
  const planetObjects = computePlanetSceneObjects(config.observer, config.sceneTimestampIso)
  const deepSkyObjects = computeDeepSkySceneObjects(config.observer, config.sceneTimestampIso, config.dsoCatalog)
  const satelliteObjects = computeSatelliteSceneObjects(config.observer, config.sceneTimestampIso, config.backendSatellites)
  const minorPlanetObjects = computeMinorPlanetSceneObjects(config.observer, config.sceneTimestampIso)
  const cometObjects = computeCometSceneObjects(config.observer, config.sceneTimestampIso)
  const meteorShowerObjects = computeMeteorShowerSceneObjects(config.observer, config.sceneTimestampIso)
  const engineStarSceneObjects = buildEngineStarSceneObjects(
    scenePacket,
    config.runtimeTiles,
    config.sceneTimestampIso,
  )
  const startupLoadingStarSceneObjects = buildStartupLoadingStarSceneObjects({
    scenePacket,
    backendStars: config.backendStars,
    currentViewState: config.currentViewState,
    observer: config.observer,
    sceneTimestampIso: config.sceneTimestampIso,
  })
  const baseSceneObjects = [
    ...engineStarSceneObjects,
    ...startupLoadingStarSceneObjects,
    ...planetObjects,
    ...deepSkyObjects,
    ...satelliteObjects,
    ...minorPlanetObjects,
    ...cometObjects,
    ...meteorShowerObjects,
    moonObject,
  ]
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
    tileQuerySignature: scenePacketState.tileQuerySignature,
    observerFrameAstrometry,
    hipsViewport: config.hipsViewport,
  } satisfies SceneControllerModel
}

const SkyEngineScene = memo(forwardRef<SkyEngineSceneHandle, SkyEngineSceneProps>(function SkyEngineScene(
  {
    backendStars,
    backendSatellites,
    initialSceneTimestampIso,
    observer,
    initialViewState,
    projectionMode = 'stereographic',
    repositoryMode,
    snapshotStore,
    initialAidVisibility = DEFAULT_SKY_ENGINE_AID_VISIBILITY,
    initialSkyCultureId = 'western',
    debugTelemetryEnabled = false,
    deterministicParityMode = false,
    webgl2StarsHarnessConfig = DEFAULT_WEBGL2_STARS_HARNESS_CONFIG,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const webgl2HarnessCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const harnessDiagnosticsKeyRef = useRef('')
  const coreRef = useRef<SkyCore<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> | null>(null)
  const propsVersionRef = useRef(0)
  const currentSceneObjectsRef = useRef<readonly SkyEngineSceneObject[]>([])
  const selectedObjectIdRef = useRef<string | null>(null)
  const selectionMemoryRef = useRef<SelectionMemory | null>(null)
  const aidVisibilityRef = useRef<SkyEngineAidVisibility>(initialAidVisibility)
  const skyCultureIdRef = useRef<string>(initialSkyCultureId)
  const runtimeTilesRef = useRef<NonNullable<SkyTileRepositoryLoadResult['tiles']>>([])
  const tileLoadResultRef = useRef<SkyTileRepositoryLoadResult | null>(null)
  const dsoCatalogRef = useRef<Parameters<typeof computeDeepSkySceneObjects>[2]>(undefined)
  const tileLoadGenerationRef = useRef(0)
  const resolvedTileQuerySignatureRef = useRef('')
  const lastTileQuerySignatureRef = useRef('')
  const lastPropsSignatureRef = useRef('')
  const stableScenePacketRef = useRef<ScenePropsSnapshot['scenePacket']>(null)
  const syncRuntimeModelRef = useRef<(force?: boolean) => void>(() => undefined)
  const [webgl2HarnessDiagnostics, setWebgl2HarnessDiagnostics] = useState<WebGL2StarsHarnessDiagnostics | null>(null)
  const defaultDynamicModelRef = useRef<SceneControllerModel>(
    buildSceneControllerModel({
      backendStars,
      backendSatellites,
      observer,
      projectionMode,
      repositoryMode,
      currentViewState: initialViewState,
      runtimeTiles: runtimeTilesRef.current,
      dsoCatalog: dsoCatalogRef.current,
      tileLoadResult: tileLoadResultRef.current,
      resolvedTileQuerySignature: resolvedTileQuerySignatureRef.current,
      previousScenePacket: stableScenePacketRef.current,
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
    observerFrameAstrometry: defaultDynamicModelRef.current.observerFrameAstrometry,
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
    const webgl2HarnessCanvas = webgl2HarnessCanvasRef.current

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
      coreUpdatePreamble: (ctx) => {
        runStellariumCoreUpdateObserverPreamble(ctx)
      },
      coreRenderPreamble: (ctx) => {
        runStellariumCoreRenderSpine(ctx.services, ctx.runtime, ctx.getProps)
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
      const hipsViewport = resolveHipsViewportForTileQuery(runtimeContext.services)
      const nextModel = buildSceneControllerModel({
        backendStars,
        backendSatellites,
        observer,
        projectionMode,
        repositoryMode,
        currentViewState,
        runtimeTiles: runtimeTilesRef.current,
        dsoCatalog: dsoCatalogRef.current,
        tileLoadResult: tileLoadResultRef.current,
        resolvedTileQuerySignature: resolvedTileQuerySignatureRef.current,
        previousScenePacket: stableScenePacketRef.current,
        sceneTimestampIso,
        hipsViewport,
      })
      if (nextModel.scenePacket != null && nextModel.tileQuerySignature === resolvedTileQuerySignatureRef.current) {
        stableScenePacketRef.current = nextModel.scenePacket
      }
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
        const nextTileQuerySignature = nextModel.tileQuerySignature
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
          observerFrameAstrometry: nextModel.observerFrameAstrometry,
          hipsViewport: nextModel.hipsViewport,
        })

        void loadSkyRuntimeTiles(query)
          .then((result) => {
            if (disposed || loadGeneration !== tileLoadGenerationRef.current) {
              return
            }

            runtimeTilesRef.current = result.tiles
            tileLoadResultRef.current = result
            resolvedTileQuerySignatureRef.current = nextTileQuerySignature
            syncRuntimeModel(true)
          })
          .catch((error) => {
            if (disposed || loadGeneration !== tileLoadGenerationRef.current) {
              return
            }

            runtimeTilesRef.current = []
            tileLoadResultRef.current = {
              mode: 'hipparcos',
              sourceLabel: 'Sky survey load failed',
              sourceError: error instanceof Error ? error.message : String(error),
              tiles: [],
            }
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
        observerFrameAstrometry: nextModel.observerFrameAstrometry,
      }
      const nextSignature = buildPropsSignature({
        timestampIso: sceneTimestampIso,
        selectedObjectId: nextProps.selectedObjectId,
        guidedObjectIds: nextProps.guidedObjectIds,
        aidVisibility: nextProps.aidVisibility,
        skyCultureId: nextProps.skyCultureId,
        sceneObjects: nextProps.objects,
        scenePacket: nextProps.scenePacket,
        currentViewState,
        observerFrameAstrometry: nextProps.observerFrameAstrometry,
      })

      if (!force && nextSignature === lastPropsSignatureRef.current) {
        return
      }

      lastPropsSignatureRef.current = nextSignature
      propsVersionRef.current += 1
      core.syncProps(nextProps, propsVersionRef.current)
    }

    syncRuntimeModelRef.current = syncRuntimeModel
    core.registerModule(createMovementsRuntimeModule())
    core.registerModule(createSceneLuminanceReportModule())
    core.registerModule(createSkyBrightnessExposureModule())
    core.registerModule(createMilkyWayModule())
    core.registerModule(createBackgroundRuntimeModule())
    core.registerModule(createStarsModule())
    core.registerModule(createDsoRuntimeModule())
    core.registerModule(createPlanetRuntimeModule())
    core.registerModule(createSatelliteRuntimeModule())
    core.registerModule(createObjectRuntimeModule())
    core.registerModule(createAtmosphereModule())
    core.registerModule(createLandscapeModule())
    core.registerModule(createOverlayRuntimeModule())
    core.registerModule(createPointerRuntimeModule())
    core.registerModule(createSnapshotBridgeModule(snapshotStore, UI_SNAPSHOT_CADENCE_MS))
    if (webgl2StarsHarnessConfig.enabled && webgl2HarnessCanvas) {
      const webgl2HarnessRenderer = new WebGL2StellariumRenderer({ canvas: webgl2HarnessCanvas })
      core.registerModule(createWebGL2StarsHarnessModule({
        enabled: true,
        comparisonMode: webgl2StarsHarnessConfig.mode,
        renderer: webgl2HarnessRenderer,
        onDiagnostics: (diagnostics) => {
          const nextDiagnosticsKey = [
            diagnostics.backendActive ? '1' : '0',
            diagnostics.backendName ?? 'none',
            diagnostics.submittedPointCount,
            diagnostics.drawnPointCount,
            diagnostics.directStarLayerStarCount,
            diagnostics.comparisonMode,
          ].join(':')

          if (nextDiagnosticsKey === harnessDiagnosticsKeyRef.current) {
            return
          }

          harnessDiagnosticsKeyRef.current = nextDiagnosticsKey
          setWebgl2HarnessDiagnostics(diagnostics)
        },
      }))
    }
    if (debugTelemetryEnabled) {
      core.registerModule(createSceneReportingModule())
    }
    core.registerModule(createSkySceneBridgeModule())
    coreRef.current = core
    core.start()
    if (deterministicParityMode) {
      core.dispatchInput((_runtime, services) => {
        services.clockService.setDeterministicMode(true)
        services.clockService.setSceneOffsetSeconds(0)
        services.clockService.setPlaybackRate(0)
      })
    }
    syncRuntimeModel(true)
    void loadDsoCatalog()
      .then((catalog) => {
        if (disposed) {
          return
        }
        dsoCatalogRef.current = catalog
        syncRuntimeModel(true)
      })
      .catch(() => {
        // keep bounded built-in fallback when no external DSO catalog is available
      })

    const syncIntervalHandle = globalThis.setInterval(() => {
      if (disposed) {
        return
      }

      syncRuntimeModel(false)
    }, RUNTIME_MODEL_SYNC_CADENCE_MS)

    return () => {
      disposed = true
      globalThis.clearInterval(syncIntervalHandle)
      core.dispose()
      coreRef.current = null
      snapshotStore.reset()
    }
  }, [])

  return (
    <div className="sky-engine-scene">
      <canvas ref={backgroundCanvasRef} className="sky-engine-scene__background" />
      <canvas ref={canvasRef} className="sky-engine-scene__canvas" aria-label="Sky Engine scene" />
      {webgl2StarsHarnessConfig.enabled ? (
        <>
          <canvas
            ref={webgl2HarnessCanvasRef}
            className={`sky-engine-scene__webgl2-harness-canvas sky-engine-scene__webgl2-harness-canvas--${webgl2StarsHarnessConfig.mode}`}
            aria-label="WebGL2 stars comparison harness"
          />
          <div className="sky-engine-scene__webgl2-harness-status" data-testid="webgl2-stars-harness-status">
            <strong>WebGL2 stars comparison</strong>
            <span>Mode: {webgl2StarsHarnessConfig.mode}</span>
            <span>Direct stars: {webgl2HarnessDiagnostics?.directStarLayerStarCount ?? 0}</span>
            <span>Submitted points: {webgl2HarnessDiagnostics?.submittedPointCount ?? 0}</span>
            <span>Drawn points: {webgl2HarnessDiagnostics?.drawnPointCount ?? 0}</span>
            <span>Backend: {webgl2HarnessDiagnostics?.backendName ?? 'initializing'}</span>
            <small>Diagnostic harness only. No parity claim. directStarLayer remains default.</small>
          </div>
        </>
      ) : null}
    </div>
  )
}))

SkyEngineScene.displayName = 'SkyEngineScene'

export default SkyEngineScene
