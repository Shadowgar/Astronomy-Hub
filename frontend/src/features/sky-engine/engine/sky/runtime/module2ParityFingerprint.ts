/**
 * Stable fingerprint for module 2 “stars port” algorithms (G4): BV, nuniq, limit magnitude, `hip_get_pix`,
 * plus StarsModule-adjacent Stellarium visual math and LOD tier policy.
 * No I/O — pure functions only. Drift in snapshot = intentional port change or regression.
 */

import { bvToRgb } from '../adapters/bvToRgb'
import { encodeEphTileNuniq } from '../adapters/ephCodec'
import { healpixOrderPixToNuniq, nuniqToHealpixOrderAndPix } from '../adapters/starsNuniq'
import { hipGetPix } from '../adapters/hipGetPix'
import { listRuntimeStarsFromTiles } from '../adapters/starsList'
import { buildStarsSurveyLoadPlan, compareStarsSurveyByMaxVmag } from '../adapters/starsSurveyRegistry'
import {
  addStarsPortSurvey,
  createLoadedTilesPortSurvey,
  createStarsPortState,
  findStarByHipFromPortSurveys,
  listStarsFromPortSurvey,
  resolveStarsPortSurveyBySource,
} from '../adapters/starsCRuntimePort'
import {
  addStarsCSurveyFromProperties,
  buildStarsCLifecycleFixture,
  buildStarsCTileFixture,
  createStarsCLifecycleState,
  findStarByHipFromLifecycleState,
  listStarsFromLifecycleState,
} from '../adapters/starsCSurveyLifecyclePort'
import {
  STARS_C_MODULE_AGAIN,
  addStarsCModuleDataSource,
  buildStarsCModuleFixtureRuntime,
  computeStarsCModuleRuntimeDigest,
  findByDesignationFromStarsCModule,
  listStarsFromStarsCModule,
} from '../adapters/starsCModuleRuntimePort'
import {
  STELLARIUM_TONEMAPPER_EXPOSURE,
  STELLARIUM_TONEMAPPER_LWMAX_MAX,
  STELLARIUM_TONEMAPPER_P,
  coreGetPointForMagnitude,
} from '../core/stellariumVisualMath'
import { resolveStarsRenderLimitMagnitude } from './stellariumPainterLimits'
import { collectProjectedStars, resolveProjectedStarCapForFov } from './modules/runtimeFrame'
import { RUNTIME_MODEL_SYNC_CADENCE_MS } from '../../../SkyEngineScene'
import { visitStarsRenderTiles } from './starsRenderVisitor'
import { findRuntimeStarByHipInTiles } from '../adapters/starsLookup'
import {
  computeCatalogStarPvFromCatalogueUnits,
  starAstrometricIcrfVector,
} from './starsCatalogAstrom'
import { buildScenePacketSignature, evaluateStarsProjectionReuse } from './modules/StarsModule'
import { buildRuntimeTileQuerySignature } from '../../../sceneQueryState'
import { evaluateOverlayCadenceDecision } from './overlayCadence'
import type { ScenePropsSnapshot, SkySceneRuntimeServices } from '../../../SkyEngineRuntimeBridge'
import { horizontalToDirection } from '../../../projectionMath'
import { deriveSunPhaseLabel, deriveSunVisualCalibration } from '../../../solar'
import type { SkyEngineAidVisibility, SkyEngineObserver, SkyEngineSceneObject, SkyEngineSunState } from '../../../types'
import type { ObserverSnapshot } from '../contracts/observer'
import { createObserverAstrometrySnapshot } from '../transforms/coordinates'
import { evaluateSceneLuminanceReport } from './luminanceReport'
import type { SkyScenePacket } from '../contracts/scene'
import type { SkyEngineQuery, SkyTilePayload } from '../contracts/tiles'
import type { SkyBrightnessExposureState } from './types'

const DECIMALS = 12

function q(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Number(value.toFixed(DECIMALS))
}

function triplet(rgb: readonly [number, number, number]): string {
  return `${q(rgb[0])},${q(rgb[1])},${q(rgb[2])}`
}

function visitorTraversalSlice(): string {
  const scenePacket: SkyScenePacket = {
    stars: [
      { id: 'root-bright', x: 1, y: 0.2, z: 0.1, mag: 2, tier: 'T0' },
      { id: 'root-faint', x: 0.2, y: 1, z: 0.1, mag: 8, tier: 'T2' },
      { id: 'child-one', x: 0.2, y: 0.1, z: 1, mag: 3, tier: 'T0' },
      { id: 'child-two', x: -1, y: 0.3, z: 0.2, mag: 4.8, tier: 'T1' },
      { id: 'sibling', x: 0.1, y: -1, z: 0.3, mag: 1.2, tier: 'T0' },
    ],
    starTiles: [
      {
        tileId: 'root-a',
        level: 0,
        parentTileId: null,
        childTileIds: ['root-a-nw', 'root-a-ne'],
        magMin: 1,
        magMax: 9,
        starIds: ['root-bright', 'root-faint'],
      },
      {
        tileId: 'root-a-nw',
        level: 1,
        parentTileId: 'root-a',
        childTileIds: [],
        magMin: 3,
        magMax: 4,
        starIds: ['child-one'],
      },
      {
        tileId: 'root-a-ne',
        level: 1,
        parentTileId: 'root-a',
        childTileIds: [],
        magMin: 4.5,
        magMax: 5,
        starIds: ['child-two'],
      },
      {
        tileId: 'root-b',
        level: 0,
        parentTileId: null,
        childTileIds: [],
        magMin: 1,
        magMax: 2,
        starIds: ['sibling'],
      },
    ],
    labels: [],
    diagnostics: {
      dataMode: 'hipparcos',
      sourceLabel: 'fingerprint',
      limitingMagnitude: 6.5,
      activeTiles: 4,
      visibleStars: 5,
      starsListVisitCount: 0,
      activeTiers: ['T0', 'T1', 'T2'],
      tileLevels: [0, 1],
      tilesPerLevel: { '0': 2, '1': 2 },
      maxTileDepthReached: 1,
      visibleTileIds: ['root-a', 'root-a-nw', 'root-a-ne', 'root-b'],
    },
  }

  const visitedOrder: string[] = []
  const entries = visitStarsRenderTiles({
    scenePacket,
    starsLimitMagnitude: 5.3,
    hardLimitMagnitude: 9,
    projectStar: (star) => ({
      planeX: star.x,
      planeY: star.y,
      screenX: star.x,
      screenY: star.id === 'child-two' ? -1 : star.y,
      depth: 0.5,
      angularDistanceRad: 0.1,
    }),
    isPointClipped: (projected) => projected.screenY < 0,
    isTileClipped: (tile) => {
      visitedOrder.push(tile.tileId)
      return false
    },
  })

  const entrySlice = entries.map((entry) => `${entry.tileId}:${entry.star.id}`).join(',')
  return `visitor-order:${visitedOrder.join(',')}|entries:${entrySlice}`
}

function hipLookupSlice(): string {
  const tiles: SkyTilePayload[] = [
    {
      tileId: 'root-ne',
      level: 0,
      parentTileId: null,
      childTileIds: [],
      bounds: { raMinDeg: 180, raMaxDeg: 360, decMinDeg: 0, decMaxDeg: 90 },
      magMin: 0,
      magMax: 7,
      starCount: 3,
      stars: [
        {
          id: 'gaia-11767',
          sourceId: 'HIP 11767',
          raDeg: 37.954515,
          decDeg: 89.264109,
          mag: 2.1,
          tier: 'T1',
          catalog: 'gaia',
        },
        {
          id: 'hip-11767-a',
          sourceId: 'HIP 11767',
          raDeg: 37.954515,
          decDeg: 89.264109,
          mag: 2,
          tier: 'T0',
          catalog: 'hipparcos',
        },
        {
          id: 'hip-91262',
          sourceId: 'HIP 91262',
          raDeg: 279.234735,
          decDeg: 38.783689,
          mag: 0.03,
          tier: 'T0',
          catalog: 'hipparcos',
        },
      ],
    },
  ]

  const hip11767 = findRuntimeStarByHipInTiles(tiles, 11767)?.id ?? 'null'
  const hip91262 = findRuntimeStarByHipInTiles(tiles, 91262)?.id ?? 'null'
  const hipMissing = findRuntimeStarByHipInTiles(tiles, 9999999)?.id ?? 'null'
  const hip11767Repeated = findRuntimeStarByHipInTiles(tiles, 11767)?.id ?? 'null'
  return `hip-lookup:${hip11767}|${hip91262}|${hipMissing}|repeat:${hip11767Repeated}`
}

function catalogAstrometrySlice(): string {
  const pv = computeCatalogStarPvFromCatalogueUnits({
    raDeg: 101.287155,
    decDeg: -16.716116,
    pmRaMasYr: -546.05,
    pmDecMasYr: -1223.14,
    parallaxMas: 379.21,
  })
  const propagated = starAstrometricIcrfVector(pv, 51544.5 + 800, [0.1, 0.9, 0.4])
  const zeroParallax = computeCatalogStarPvFromCatalogueUnits({
    raDeg: 120.5,
    decDeg: 22.25,
    pmRaMasYr: 10,
    pmDecMasYr: -4,
    parallaxMas: 0,
  })
  return [
    `catalog-astrom:iwarn:${pv.iwarn}`,
    `distance:${q(pv.distanceAu)}`,
    `p0:${q(pv.p[0])}`,
    `v1:${q(pv.v[1])}`,
    `vec:${q(propagated[0])},${q(propagated[1])},${q(propagated[2])}`,
    `zero-v:${q(zeroParallax.v[0])},${q(zeroParallax.v[1])},${q(zeroParallax.v[2])}`,
  ].join('|')
}

function projectionCacheSignatureSlice(): string {
  const scenePacket: SkyScenePacket = {
    stars: [
      { id: 'sig-a', x: 0.2, y: 0.1, z: 1, mag: 1.2, tier: 'T0' },
      { id: 'sig-b', x: -0.2, y: 0.4, z: 0.8, mag: 5.4, tier: 'T1' },
      { id: 'sig-c', x: 0.6, y: -0.2, z: 0.7, mag: 9.1, tier: 'T2' },
    ],
    starTiles: [],
    labels: [],
    diagnostics: {
      dataMode: 'multi-survey',
      sourceLabel: 'fingerprint-signature',
      limitingMagnitude: 7.125,
      activeTiles: 3,
      visibleStars: 3,
      starsListVisitCount: 0,
      activeTiers: ['T0', 'T1', 'T2'],
      tileLevels: [0, 1],
      tilesPerLevel: { '0': 1, '1': 2 },
      maxTileDepthReached: 1,
      visibleTileIds: ['root-a', 'root-a-ne', 'root-a-se'],
    },
  }
  return `packet-signature:${buildScenePacketSignature(scenePacket)}`
}

/**
 * Deterministic `stars.c::stars_list` loaded-tile seam (`starsList.ts`): default traversal,
 * explicit survey source selection, hinted visit with early break, and unresolved-hint `again`.
 */
function starsListSlice(): string {
  const tiles: SkyTilePayload[] = [
    {
      tileId: 'root-hip',
      level: 0,
      parentTileId: null,
      childTileIds: [],
      bounds: { raMinDeg: 0, raMaxDeg: 180, decMinDeg: 0, decMaxDeg: 90 },
      magMin: 0,
      magMax: 8,
      starCount: 3,
      stars: [
        { id: 'hip-bright', sourceId: 'HIP 1', raDeg: 10, decDeg: 10, mag: 1.1, tier: 'T0', catalog: 'hipparcos' },
        { id: 'hip-mid', sourceId: 'HIP 2', raDeg: 20, decDeg: 12, mag: 5.4, tier: 'T1', catalog: 'hipparcos' },
        { id: 'gaia-mixed', sourceId: 'Gaia DR3 1', raDeg: 22, decDeg: 13, mag: 6.2, tier: 'T2', catalog: 'gaia' },
      ],
      provenance: { catalog: 'multi-survey', sourcePath: 'fixtures', sourceKey: 'hip-main', sourceKeys: ['hip-main'], hipsOrder: 0, hipsPix: 3 },
    },
    {
      tileId: 'child-gaia',
      level: 1,
      parentTileId: 'root-hip',
      childTileIds: [],
      bounds: { raMinDeg: 0, raMaxDeg: 90, decMinDeg: 0, decMaxDeg: 45 },
      magMin: 5,
      magMax: 12,
      starCount: 2,
      stars: [
        { id: 'gaia-1', sourceId: 'Gaia DR3 2', raDeg: 30, decDeg: 11, mag: 8.1, tier: 'T2', catalog: 'gaia' },
        { id: 'gaia-2', sourceId: 'Gaia DR3 3', raDeg: 35, decDeg: 14, mag: 9.2, tier: 'T2', catalog: 'gaia' },
      ],
      provenance: {
        catalog: 'gaia',
        sourcePath: 'gaia/Norder1/Npix5.eph',
        sourceKey: 'gaia',
        sourceKeys: ['gaia'],
        hipsOrder: 1,
        hipsPix: 5,
        hipsTiles: [{ sourceKey: 'gaia', order: 1, pix: 5 }, { sourceKey: 'gaia', order: 1, pix: 6 }],
      },
    },
  ]

  const defaultOrder: string[] = []
  const defaultStatus = listRuntimeStarsFromTiles({
    tiles,
    maxMag: 6,
    visit: (star) => {
      defaultOrder.push(star.id)
    },
  })

  const hintMiss = listRuntimeStarsFromTiles({
    tiles,
    source: 'gaia',
    hintNuniq: healpixOrderPixToNuniq(2, 9),
    visit: () => false,
  })

  const hintHitOrder: string[] = []
  const hintHitStatus = listRuntimeStarsFromTiles({
    tiles,
    source: 'gaia',
    hintNuniq: healpixOrderPixToNuniq(1, 5),
    visit: (star) => {
      hintHitOrder.push(star.id)
      return true
    },
  })

  const gaiaOrder: string[] = []
  const gaiaStatus = listRuntimeStarsFromTiles({
    tiles,
    source: 'gaia',
    maxMag: 9,
    visit: (star) => {
      gaiaOrder.push(star.id)
    },
  })

  return [
    `stars-list:default:${defaultStatus}:${defaultOrder.join(',')}`,
    `stars-list:hint-miss:${hintMiss}`,
    `stars-list:hint-hit:${hintHitStatus}:${hintHitOrder.join(',')}`,
    `stars-list:source-gaia:${gaiaStatus}:${gaiaOrder.join(',')}`,
  ].join('|')
}

function runtimeTileQuerySignatureSlice(): string {
  const query: SkyEngineQuery = {
    observer: {
      timestampUtc: '2026-07-15T02:00:00.000Z',
      latitudeDeg: 44,
      longitudeDeg: -123,
      elevationM: 120,
      fovDeg: 28,
      centerAltDeg: 18,
      centerAzDeg: 120,
      projection: 'stereographic',
    },
    limitingMagnitude: 8.7,
    activeTiers: ['T2', 'T0', 'T1'],
    visibleTileIds: ['root-ne', 'root-ne-sw', 'root-ne-nw'],
    maxTileLevel: 3,
    hipsViewport: {
      windowHeightPx: 1080,
      projectionMat11: 2.345678901,
      tileWidthPx: 256,
    },
  }
  const signature = buildRuntimeTileQuerySignature(query, 'multi-survey')
  return `tile-query-signature:${signature}`
}

/**
 * Must stay aligned with `resolveViewTier` in `runtimeFrame.ts` (StarsModule uses it for label LOD).
 * Inlined here so the fingerprint module does not import Babylon-backed runtime paths.
 */
function resolveViewTierFingerprint(fovDegrees: number): string {
  const normalized = Math.min(1, Math.max(0, (fovDegrees - 12) / (120 - 12)))
  const dynamicLabelCap = Math.round(11 - normalized * 6)
  if (fovDegrees >= 90) {
    return `wide:${dynamicLabelCap}`
  }
  if (fovDegrees >= 35) {
    return `medium:${dynamicLabelCap}`
  }
  return `close:${dynamicLabelCap}`
}

const FINGERPRINT_LUMINANCE_SERVICES = {
  projectionService: {
    getCurrentFovDegrees: () => 120,
    createView: (centerDirection: { x: number; y: number; z: number }) => ({
      centerDirection,
      fovRadians: (120 * Math.PI) / 180,
      viewportWidth: 1280,
      viewportHeight: 720,
      projectionMode: 'stereographic' as const,
    }),
    unproject: () => horizontalToDirection(38, 155),
  },
  navigationService: {
    getCenterDirection: () => horizontalToDirection(38, 155),
  },
} as unknown as SkySceneRuntimeServices

const FINGERPRINT_LUMINANCE_OBSERVER_SNAPSHOT: ObserverSnapshot = {
  timestampUtc: '2026-04-10T00:00:00Z',
  latitudeDeg: 40.44,
  longitudeDeg: -79.99,
  elevationM: 250,
  fovDeg: 120,
  centerAltDeg: 45,
  centerAzDeg: 180,
  projection: 'stereographic',
}

function sceneLuminanceFingerprintSlice(): string {
  const observer: SkyEngineObserver = {
    label: 'g4-scene-lum',
    latitude: 40.44,
    longitude: -79.99,
    elevationFt: 250 / 0.3048,
  }
  const observerFrameAstrometry = createObserverAstrometrySnapshot(FINGERPRINT_LUMINANCE_OBSERVER_SNAPSHOT)

  const buildAid = (atmosphere: boolean): SkyEngineAidVisibility => ({
    constellations: false,
    azimuthRing: false,
    altitudeRings: false,
    atmosphere,
    landscape: true,
    deepSky: true,
    nightMode: false,
  })

  const buildProps = (sunAltitudeDeg: number, atmosphere: boolean): ScenePropsSnapshot => {
    const phaseLabel = deriveSunPhaseLabel(sunAltitudeDeg)
    const visualCalibration = deriveSunVisualCalibration(sunAltitudeDeg)
    const skyDirection = horizontalToDirection(sunAltitudeDeg, 215)
    const sunState: SkyEngineSunState = {
      altitudeDeg: sunAltitudeDeg,
      azimuthDeg: 215,
      isAboveHorizon: sunAltitudeDeg > 0,
      phaseLabel,
      rightAscensionHours: 0,
      declinationDeg: 0,
      localSiderealTimeDeg: 0,
      skyDirection,
      lightDirection: { x: -skyDirection.x, y: -skyDirection.y, z: -skyDirection.z },
      visualCalibration,
    }

    return {
      backendStars: [],
      initialSceneTimestampIso: '2026-04-10T00:00:00Z',
      observer,
      objects: [],
      scenePacket: null,
      initialViewState: { fovDegrees: 120, centerAltDeg: 45, centerAzDeg: 180 },
      projectionMode: 'stereographic',
      sunState,
      selectedObjectId: null,
      guidedObjectIds: [],
      aidVisibility: buildAid(atmosphere),
      skyCultureId: 'western',
      hiddenSelectionName: null,
      onSelectObject: () => {},
      observerFrameAstrometry,
    }
  }

  const formatCase = (sunAltitudeDeg: number, atmosphere: boolean) => {
    const report = evaluateSceneLuminanceReport(
      buildProps(sunAltitudeDeg, atmosphere),
      FINGERPRINT_LUMINANCE_SERVICES,
    )
    return [
      atmosphere ? 'atm1' : 'atm0',
      q(sunAltitudeDeg),
      q(report.sky),
      q(report.skyAverageLuminance),
      q(report.skyBrightness),
      q(report.target),
      report.targetFastAdaptation ? '1' : '0',
    ].join(':')
  }

  return [
    'scene-lum',
    formatCase(55, false),
    formatCase(72, true),
    formatCase(8, true),
    formatCase(-18, true),
  ].join('|')
}

function starsProjectionReplaySlice(): string {
  const toPacketStar = (id: string, altitudeDeg: number, azimuthDeg: number, mag: number, tier: 'T0' | 'T1' | 'T2') => {
    const direction = horizontalToDirection(altitudeDeg, azimuthDeg)
    return {
      id,
      x: direction.x,
      y: direction.y,
      z: direction.z,
      mag,
      tier,
    } as const
  }

  const scenePacket: SkyScenePacket = {
    stars: [
      toPacketStar('proj-a', 38, 130, 1.4, 'T0'),
      toPacketStar('proj-b', 34, 136, 4.8, 'T1'),
      toPacketStar('proj-c', 10, 145, 8.1, 'T2'),
    ],
    starTiles: [
      {
        tileId: 'proj-root',
        level: 0,
        parentTileId: null,
        childTileIds: ['proj-child'],
        magMin: 1.4,
        magMax: 8.1,
        starIds: ['proj-a'],
      },
      {
        tileId: 'proj-child',
        level: 1,
        parentTileId: 'proj-root',
        childTileIds: [],
        magMin: 4.8,
        magMax: 8.1,
        starIds: ['proj-b', 'proj-c'],
      },
    ],
    labels: [],
    diagnostics: {
      dataMode: 'multi-survey',
      sourceLabel: 'projection-fingerprint',
      limitingMagnitude: 7,
      activeTiles: 2,
      visibleStars: 3,
      starsListVisitCount: 0,
      activeTiers: ['T0', 'T1', 'T2'],
      tileLevels: [0, 1],
      tilesPerLevel: { '0': 1, '1': 1 },
      maxTileDepthReached: 1,
      visibleTileIds: ['proj-root', 'proj-child'],
    },
  }

  const objects: SkyEngineSceneObject[] = [
    {
      id: 'proj-a',
      name: 'Proj A',
      type: 'star',
      altitudeDeg: 38,
      azimuthDeg: 130,
      magnitude: 1.4,
      colorHex: '#ffffff',
      colorIndexBV: 0.15,
      summary: 'projection fingerprint star A',
      description: 'projection fingerprint star A',
      truthNote: 'projection fingerprint',
      source: 'engine_catalog_tile',
      trackingMode: 'fixed_equatorial',
      isAboveHorizon: true,
    },
    {
      id: 'proj-b',
      name: 'Proj B',
      type: 'star',
      altitudeDeg: 34,
      azimuthDeg: 136,
      magnitude: 4.8,
      colorHex: '#f6f8ff',
      colorIndexBV: 0.63,
      summary: 'projection fingerprint star B',
      description: 'projection fingerprint star B',
      truthNote: 'projection fingerprint',
      source: 'engine_catalog_tile',
      trackingMode: 'fixed_equatorial',
      isAboveHorizon: true,
    },
    {
      id: 'proj-c',
      name: 'Proj C',
      type: 'star',
      altitudeDeg: 10,
      azimuthDeg: 145,
      magnitude: 8.1,
      colorHex: '#dce7ff',
      colorIndexBV: 1.12,
      summary: 'projection fingerprint star C',
      description: 'projection fingerprint star C',
      truthNote: 'projection fingerprint',
      source: 'engine_catalog_tile',
      trackingMode: 'fixed_equatorial',
      isAboveHorizon: true,
    },
  ]

  const brightnessExposureState = {
    skyBrightness: 0.05,
    adaptationLevel: 0.95,
    sceneContrast: 1,
    limitingMagnitude: 6.3,
    starVisibility: 1,
    starFieldBrightness: 1,
    atmosphereExposure: 1,
    milkyWayVisibility: 1,
    milkyWayContrast: 1,
    backdropAlpha: 1,
    nightSkyZenithLuminance: 0.0001,
    nightSkyHorizonLuminance: 0.0002,
    sceneLuminanceSkyContributor: 0.0001,
    sceneLuminanceStarContributor: 0.0001,
    sceneLuminanceSolarSystemContributor: 0.0001,
    sceneLuminanceStarSampleCount: 1,
    sceneLuminanceSolarSystemSampleCount: 1,
    sceneLuminance: 0.0001,
    adaptedSceneLuminance: 0.0001,
    targetTonemapperLwmax: 1,
    adaptationSmoothing: 1,
    tonemapperP: STELLARIUM_TONEMAPPER_P,
    tonemapperExposure: STELLARIUM_TONEMAPPER_EXPOSURE,
    tonemapperLwmax: STELLARIUM_TONEMAPPER_LWMAX_MAX,
    visualCalibration: deriveSunVisualCalibration(-12),
  } as SkyBrightnessExposureState

  const view = {
    centerDirection: horizontalToDirection(35, 135),
    fovRadians: (30 * Math.PI) / 180,
    viewportWidth: 1280,
    viewportHeight: 720,
    projectionMode: 'stereographic' as const,
  }
  const projection = collectProjectedStars({
    view,
    objects,
    scenePacket,
    sunState: {
      altitudeDeg: -12,
      azimuthDeg: 220,
      isAboveHorizon: false,
      phaseLabel: deriveSunPhaseLabel(-12),
      rightAscensionHours: 0,
      declinationDeg: 0,
      localSiderealTimeDeg: 0,
      skyDirection: horizontalToDirection(-12, 220),
      lightDirection: horizontalToDirection(12, 40),
      visualCalibration: deriveSunVisualCalibration(-12),
    },
    brightnessExposureState,
    corePainterLimits: {
      starsLimitMag: 7.5,
      hardLimitMag: 6.6,
    },
  })

  const entrySlice = projection.projectedStars
    .map((entry) => {
      const visibilityAlpha = entry.visibilityAlpha ?? 0
      return `${entry.object.id}:${q(entry.screenX)}:${q(entry.screenY)}:${q(entry.depth)}:${q(entry.markerRadiusPx)}:${q(entry.renderAlpha)}:${q(entry.renderedMagnitude ?? 0)}:${q(visibilityAlpha)}`
    })
    .join(',')
  return `stars-projection:count:${projection.projectedStars.length}|lim:${q(projection.limitingMagnitude)}|entries:${entrySlice}`
}

function starsProjectionReuseSlice(): string {
  const reusable = evaluateStarsProjectionReuse({
    previousProjectionCache: {
      sceneTimestampMs: 1000,
      width: 1280,
      height: 720,
      objectSignature: 'obj:3:proj-a:proj-c::packet:3|s0:proj-a:1.400|s1:proj-c:8.100|lim:7.000|visible:3|tiles:2:1',
      centerDirection: horizontalToDirection(35, 135),
      fovDegrees: 30,
      limitingMagnitude: 6.3,
      projectedStars: [],
    },
    next: {
      objectSignature: 'obj:3:proj-a:proj-c::packet:3|s0:proj-a:1.400|s1:proj-c:8.100|lim:7.000|visible:3|tiles:2:1',
      width: 1280,
      height: 720,
      centerDirection: horizontalToDirection(35.04, 135.03),
      fovDegrees: 30.08,
      limitingMagnitude: 6.31,
      sceneTimestampMs: 1180,
    },
    starsProjectionReuseStreak: 1,
  })

  const blockedByStreak = evaluateStarsProjectionReuse({
    previousProjectionCache: {
      sceneTimestampMs: 1000,
      width: 1280,
      height: 720,
      objectSignature: 'obj:3:proj-a:proj-c::packet:3|s0:proj-a:1.400|s1:proj-c:8.100|lim:7.000|visible:3|tiles:2:1',
      centerDirection: horizontalToDirection(35, 135),
      fovDegrees: 30,
      limitingMagnitude: 6.3,
      projectedStars: [],
    },
    next: {
      objectSignature: 'obj:3:proj-a:proj-c::packet:3|s0:proj-a:1.400|s1:proj-c:8.100|lim:7.000|visible:3|tiles:2:1',
      width: 1280,
      height: 720,
      centerDirection: horizontalToDirection(35.04, 135.03),
      fovDegrees: 30.08,
      limitingMagnitude: 6.31,
      sceneTimestampMs: 1180,
    },
    starsProjectionReuseStreak: 2,
  })

  const cacheMiss = evaluateStarsProjectionReuse({
    previousProjectionCache: {
      sceneTimestampMs: 1000,
      width: 1280,
      height: 720,
      objectSignature: 'obj:3:proj-a:proj-c::packet:3|s0:proj-a:1.400|s1:proj-c:8.100|lim:7.000|visible:3|tiles:2:1',
      centerDirection: horizontalToDirection(35, 135),
      fovDegrees: 30,
      limitingMagnitude: 6.3,
      projectedStars: [],
    },
    next: {
      objectSignature: 'obj:3:proj-a:proj-c::packet:3|s0:proj-a:1.400|s1:proj-c:8.100|lim:7.000|visible:3|tiles:2:1',
      width: 1280,
      height: 720,
      centerDirection: horizontalToDirection(35.04, 135.03),
      fovDegrees: 30.08,
      limitingMagnitude: 6.31,
      sceneTimestampMs: 1400,
    },
    starsProjectionReuseStreak: 0,
  })

  const thresholdEdge = evaluateStarsProjectionReuse({
    previousProjectionCache: {
      sceneTimestampMs: 1000,
      width: 1280,
      height: 720,
      objectSignature: 'obj:3:proj-a:proj-c::packet:3|s0:proj-a:1.400|s1:proj-c:8.100|lim:7.000|visible:3|tiles:2:1',
      centerDirection: horizontalToDirection(35, 135),
      fovDegrees: 30,
      limitingMagnitude: 6.3,
      projectedStars: [],
    },
    next: {
      objectSignature: 'obj:3:proj-a:proj-c::packet:3|s0:proj-a:1.400|s1:proj-c:8.100|lim:7.000|visible:3|tiles:2:1',
      width: 1280,
      height: 720,
      centerDirection: horizontalToDirection(35.02, 135.1),
      fovDegrees: 30.2,
      limitingMagnitude: 6.32,
      sceneTimestampMs: 1250,
    },
    starsProjectionReuseStreak: 0,
  })

  const thresholdFail = evaluateStarsProjectionReuse({
    previousProjectionCache: {
      sceneTimestampMs: 1000,
      width: 1280,
      height: 720,
      objectSignature: 'obj:3:proj-a:proj-c::packet:3|s0:proj-a:1.400|s1:proj-c:8.100|lim:7.000|visible:3|tiles:2:1',
      centerDirection: horizontalToDirection(35, 135),
      fovDegrees: 30,
      limitingMagnitude: 6.3,
      projectedStars: [],
    },
    next: {
      objectSignature: 'obj:3:proj-a:proj-c::packet:3|s0:proj-a:1.400|s1:proj-c:8.100|lim:7.000|visible:3|tiles:2:1',
      width: 1280,
      height: 720,
      centerDirection: horizontalToDirection(35.02, 135.1),
      fovDegrees: 30.2001,
      limitingMagnitude: 6.3201,
      sceneTimestampMs: 1251,
    },
    starsProjectionReuseStreak: 0,
  })

  return [
    'stars-reuse',
    `reuse:${reusable.shouldReuseProjection ? '1' : '0'}`,
    `cache:${reusable.isProjectionCacheReusable ? '1' : '0'}`,
    `center:${q(reusable.centerDeltaRad)}`,
    `fov:${q(reusable.fovDeltaDeg)}`,
    `lim:${q(reusable.limitingMagnitudeDelta)}`,
    `dt:${q(reusable.sceneTimestampDeltaMs)}`,
    `streak-block:${blockedByStreak.shouldReuseProjection ? '0' : '1'}`,
    `miss:${cacheMiss.isProjectionCacheReusable ? '0' : '1'}`,
    `edge:${thresholdEdge.shouldReuseProjection ? '1' : '0'}`,
    `fail:${thresholdFail.isProjectionCacheReusable ? '0' : '1'}`,
  ].join('|')
}

function starsSurveyRegistrySlice(): string {
  const makeSurvey = (entry: {
    key: string
    catalog: 'hipparcos' | 'gaia'
    minVmag: number
    maxVmag: number
  }) => ({
    ...entry,
    loadTile: async () => null,
  })

  const tiedOrder = [
    makeSurvey({ key: 'b', catalog: 'hipparcos', minVmag: -2, maxVmag: 6.5 }),
    makeSurvey({ key: 'a', catalog: 'hipparcos', minVmag: -2, maxVmag: 6.5 }),
    makeSurvey({ key: 'deep', catalog: 'hipparcos', minVmag: 6.5, maxVmag: Number.NaN }),
  ].sort(compareStarsSurveyByMaxVmag)

  const loadPlan = buildStarsSurveyLoadPlan({
    surveys: [
      makeSurvey({ key: 'b', catalog: 'hipparcos', minVmag: -2, maxVmag: 6.5 }),
      makeSurvey({ key: 'a', catalog: 'hipparcos', minVmag: -2, maxVmag: 6.5 }),
      makeSurvey({ key: 'gaia', catalog: 'gaia', minVmag: 4, maxVmag: 20 }),
    ],
    limitingMagnitude: 6.6,
    observerFovDeg: 70,
    activationFovDeg: 40,
    fallbackMinVmag: -2,
  })

  const gaiaMin = loadPlan.orderedSurveys.find((survey) => survey.catalog === 'gaia')?.minVmag ?? Number.NaN
  return [
    'survey-registry',
    `cmp:${tiedOrder.map((survey) => survey.key).join(',')}`,
    `plan:${loadPlan.orderedSurveys.map((survey) => survey.key).join(',')}`,
    `gaia-min:${q(gaiaMin)}`,
  ].join('|')
}

function overlayCadenceSlice(): string {
  const state = {
    lastSyncAtMs: 1000,
    lastPropsVersion: 4,
    lastSelectedObjectId: 'sel-1',
    lastAidSignature: '1:0:1',
    lastGuidedSignature: 'a|b',
    lastSunPhaseLabel: 'night',
    lastCenterAltTenths: 150,
    lastCenterAzTenths: 3599,
    lastFovTenths: 300,
    lastViewportWidth: 1280,
    lastViewportHeight: 720,
    lastProjectedObjectsRef: { ref: 'same' },
    lastHintsLimitMag: 6.2,
  }

  const noChange = evaluateOverlayCadenceDecision(state, {
    propsVersion: 4,
    selectedObjectId: 'sel-1',
    aidSignature: '1:0:1',
    guidedSignature: 'a|b',
    sunPhaseLabel: 'night',
    centerAltTenths: 150,
    centerAzTenths: 3599,
    fovTenths: 300,
    viewportWidth: 1280,
    viewportHeight: 720,
    projectedObjectsRef: state.lastProjectedObjectsRef,
    hintsLimitMag: 6.2,
  })

  const wrapAzChange = evaluateOverlayCadenceDecision(state, {
    propsVersion: 4,
    selectedObjectId: 'sel-1',
    aidSignature: '1:0:1',
    guidedSignature: 'a|b',
    sunPhaseLabel: 'night',
    centerAltTenths: 150,
    centerAzTenths: 0,
    fovTenths: 300,
    viewportWidth: 1280,
    viewportHeight: 720,
    projectedObjectsRef: state.lastProjectedObjectsRef,
    hintsLimitMag: 6.2,
  })

  const guidedChange = evaluateOverlayCadenceDecision(state, {
    propsVersion: 4,
    selectedObjectId: 'sel-1',
    aidSignature: '1:0:1',
    guidedSignature: 'a|c',
    sunPhaseLabel: 'night',
    centerAltTenths: 150,
    centerAzTenths: 3599,
    fovTenths: 300,
    viewportWidth: 1280,
    viewportHeight: 720,
    projectedObjectsRef: state.lastProjectedObjectsRef,
    hintsLimitMag: 6.2,
  })

  const firstSync = evaluateOverlayCadenceDecision(
    {
      ...state,
      lastSyncAtMs: 0,
      lastCenterAltTenths: Number.NaN,
      lastCenterAzTenths: Number.NaN,
      lastFovTenths: Number.NaN,
    },
    {
      propsVersion: 4,
      selectedObjectId: 'sel-1',
      aidSignature: '1:0:1',
      guidedSignature: 'a|b',
      sunPhaseLabel: 'night',
      centerAltTenths: 150,
      centerAzTenths: 3599,
      fovTenths: 300,
      viewportWidth: 1280,
      viewportHeight: 720,
      projectedObjectsRef: state.lastProjectedObjectsRef,
      hintsLimitMag: 6.2,
    },
  )

  return [
    'overlay-cadence',
    `steady:${noChange.forceSync ? '1' : '0'}:${noChange.significantViewChange ? '1' : '0'}:${noChange.shouldSync ? '1' : '0'}`,
    `wrap-az:${wrapAzChange.forceSync ? '1' : '0'}:${wrapAzChange.significantViewChange ? '1' : '0'}:${wrapAzChange.shouldSync ? '1' : '0'}`,
    `guided:${guidedChange.forceSync ? '1' : '0'}:${guidedChange.significantViewChange ? '1' : '0'}:${guidedChange.shouldSync ? '1' : '0'}`,
    `initial:${firstSync.forceSync ? '1' : '0'}:${firstSync.significantViewChange ? '1' : '0'}:${firstSync.shouldSync ? '1' : '0'}`,
  ].join('|')
}

function starsCRuntimePortSlice(): string {
  const resolveTier = (mag: number): 'T0' | 'T1' | 'T2' => {
    if (mag <= 4) {
      return 'T0'
    }
    if (mag <= 7) {
      return 'T1'
    }
    return 'T2'
  }

  const makeTile = (entry: {
    tileId: string
    level: number
    order: number
    pix: number
    sourceKey: string
    stars: Array<{ id: string; sourceId: string; mag: number; catalog: 'hipparcos' | 'gaia' }>
    magMin?: number
  }): SkyTilePayload => ({
    tileId: entry.tileId,
    level: entry.level,
    parentTileId: null,
    childTileIds: [],
    bounds: { raMinDeg: 0, raMaxDeg: 1, decMinDeg: 0, decMaxDeg: 1 },
    magMin: entry.magMin ?? 0,
    magMax: 12,
    starCount: entry.stars.length,
    stars: entry.stars.map((star) => ({
      id: star.id,
      sourceId: star.sourceId,
      raDeg: 0,
      decDeg: 0,
      mag: star.mag,
      tier: resolveTier(star.mag),
      catalog: star.catalog,
    })),
    provenance: {
      catalog: 'multi-survey',
      sourcePath: 'fingerprint/stars-c-runtime-port',
      sourceKey: entry.sourceKey,
      sourceKeys: [entry.sourceKey],
      hipsTiles: [{ sourceKey: entry.sourceKey, order: entry.order, pix: entry.pix }],
    },
  })

  const hipOrder0Pix = hipGetPix(11767, 0)
  const hipOrder1Pix = hipGetPix(11767, 1)

  const hipSurvey = createLoadedTilesPortSurvey({
    key: 'hip-main',
    isGaia: false,
    minVmag: -2,
    maxVmag: 6.5,
    tiles: [
      makeTile({
        tileId: 'hip-root',
        level: 0,
        order: 0,
        pix: hipOrder0Pix,
        sourceKey: 'hip-main',
        stars: [
          { id: 'hip-11767', sourceId: 'HIP 11767', mag: 2.1, catalog: 'hipparcos' },
          { id: 'hip-faint', sourceId: 'HIP 3', mag: 8.2, catalog: 'hipparcos' },
        ],
      }),
      makeTile({
        tileId: 'hip-child',
        level: 1,
        order: 1,
        pix: hipOrder1Pix,
        sourceKey: 'hip-main',
        stars: [{ id: 'hip-11767-1', sourceId: 'HIP 11767', mag: 2.2, catalog: 'hipparcos' }],
      }),
    ],
    missingHintCode: 404,
  })

  const gaiaSurvey = createLoadedTilesPortSurvey({
    key: 'gaia',
    isGaia: true,
    minVmag: 4,
    maxVmag: 20,
    tiles: [
      makeTile({
        tileId: 'gaia-root',
        level: 0,
        order: 0,
        pix: hipOrder0Pix,
        sourceKey: 'gaia',
        stars: [{ id: 'gaia-11767', sourceId: 'HIP 11767', mag: 2.05, catalog: 'gaia' }],
      }),
    ],
    missingHintCode: 404,
  })

  let state = createStarsPortState([])
  state = addStarsPortSurvey(state, gaiaSurvey)
  state = addStarsPortSurvey(state, hipSurvey)

  const ordered = state.surveys.map((survey) => survey.key).join(',')
  const gaiaMin = q(state.surveys.find((survey) => survey.key === 'gaia')?.minVmag ?? Number.NaN)

  const resolvedHip = resolveStarsPortSurveyBySource(state, 'hip-main')
  const resolvedUnknown = resolveStarsPortSurveyBySource(state, 'unknown')

  const listedDefault: string[] = []
  const listDefaultStatus = listStarsFromPortSurvey({
    survey: resolvedHip ?? hipSurvey,
    maxMag: 6.5,
    visit: (star) => {
      listedDefault.push(star.id)
    },
  })

  const listedHinted: string[] = []
  const listHintStatus = listStarsFromPortSurvey({
    survey: resolvedHip ?? hipSurvey,
    hintNuniq: healpixOrderPixToNuniq(0, hipOrder0Pix),
    maxMag: 1,
    visit: (star) => {
      listedHinted.push(star.id)
      return star.id === 'hip-11767'
    },
  })

  const lookup = findStarByHipFromPortSurveys(state, 11767)
  const lookupStatus = lookup.status
  const lookupId = lookup.status === 'found' ? lookup.star.id : 'none'
  const lookupMissing = findStarByHipFromPortSurveys(state, 999999).status

  return [
    'stars-c-runtime',
    `order:${ordered}`,
    `gaia-min:${gaiaMin}`,
    `resolve:hip=${resolvedHip?.key ?? 'null'}:fallback=${resolvedUnknown?.key ?? 'null'}`,
    `list-default:${listDefaultStatus}:${listedDefault.join(',')}`,
    `list-hint:${listHintStatus}:${listedHinted.join(',')}`,
    `lookup:${lookupStatus}:${lookupId}`,
    `lookup-miss:${lookupMissing}`,
  ].join('|')
}

function starsCSurveyLifecycleSlice(): string {
  const hipOrder0Pix = hipGetPix(11767, 0)
  const hipOrder1Pix = hipGetPix(11767, 1)

  const hipRootTile = buildStarsCTileFixture({
    order: 0,
    pix: hipOrder0Pix,
    stars: [
      { hip: 11767, mag: 2.1, ids: 'HIP 11767' },
      { hip: 2, mag: 8.4, ids: 'HIP 2' },
    ],
  })
  const hipChildTile = buildStarsCTileFixture({
    order: 1,
    pix: hipOrder1Pix,
    stars: [
      { hip: 11767, mag: 2.2, ids: 'HIP 11767|NAME Sample' },
    ],
  })

  const gaiaRootTile = buildStarsCTileFixture({
    order: 0,
    pix: hipOrder0Pix,
    isGaia: true,
    minVmag: 4,
    stars: [
      { hip: 11767, gaia: BigInt('219547565555375488'), mag: 2.05, ids: 'GAIA 219547565555375488' },
    ],
  })

  const hipFixture = buildStarsCLifecycleFixture({
    key: 'hip-main',
    maxVmag: 6.5,
    tiles: [hipRootTile, hipChildTile],
  })
  const gaiaFixture = buildStarsCLifecycleFixture({
    key: 'gaia',
    isGaia: true,
    minVmag: 4,
    maxVmag: 20,
    tiles: [gaiaRootTile],
  })

  const base = createStarsCLifecycleState([gaiaFixture.survey, hipFixture.survey])
  const addResult = addStarsCSurveyFromProperties({
    state: base,
    key: 'hip-bright',
    url: '/catalog/hip-bright',
    propertiesText: [
      'type = stars',
      'hips_order_min = 0',
      'min_vmag = -2',
      'max_vmag = 6.5',
      'hips_release_date = 2025-01-02T00:00Z',
    ].join('\n'),
    tileStore: hipFixture.store,
  })

  const state = addResult.status === 'ok' ? addResult.state : base
  const ordered = state.surveys.map((survey) => survey.key).join(',')
  const gaiaMin = q(state.surveys.find((survey) => survey.key === 'gaia')?.minVmag ?? Number.NaN)
  const preloadCount = addResult.status === 'ok' ? addResult.preload.length : 0

  const listedDefault: string[] = []
  const listDefaultStatus = listStarsFromLifecycleState({
    state,
    sourceKey: 'hip-main',
    maxMag: 6.5,
    visit: (star) => {
      listedDefault.push(star.id)
    },
  })

  const listedHinted: string[] = []
  const listHintStatus = listStarsFromLifecycleState({
    state,
    sourceKey: 'hip-main',
    maxMag: 1,
    hintNuniq: healpixOrderPixToNuniq(0, hipOrder0Pix),
    visit: (star) => {
      listedHinted.push(star.id)
      return star.id === 'hip-11767'
    },
  })

  const lookup = findStarByHipFromLifecycleState(state, 11767)
  const lookupStatus = lookup.status
  const lookupId = lookup.status === 'found' ? lookup.star.id : 'none'
  const lookupMissing = findStarByHipFromLifecycleState(state, 999999).status

  return [
    'stars-c-survey-lifecycle',
    `order:${ordered}`,
    `gaia-min:${gaiaMin}`,
    `preload:${preloadCount}`,
    `list-default:${listDefaultStatus}:${listedDefault.join(',')}`,
    `list-hint:${listHintStatus}:${listedHinted.join(',')}`,
    `lookup:${lookupStatus}:${lookupId}`,
    `lookup-miss:${lookupMissing}`,
  ].join('|')
}

function starsCModuleRuntimeSlice(): string {
  const hip11767Order0 = hipGetPix(11767, 0)
  const hip11767Order1 = hipGetPix(11767, 1)

  const runtime = buildStarsCModuleFixtureRuntime({
    hintsMagOffset: 0.6,
    surveys: [
      {
        key: 'hip-main',
        minOrder: 0,
        minVmag: -2,
        maxVmag: 6.5,
        tiles: [
          {
            order: 0,
            pix: hip11767Order0,
            stars: [
              { hip: 11767, vmag: 2.1, raDeg: 0, decDeg: 0, names: ['HIP 11767'] },
              { hip: 2, vmag: 8.2, raDeg: 5, decDeg: 0, names: ['HIP 2'] },
            ],
          },
          {
            order: 1,
            pix: hip11767Order1,
            stars: [
              { hip: 11767, vmag: 2.2, raDeg: 2, decDeg: 1, names: ['HIP 11767', 'NAME Sample'] },
            ],
          },
        ],
      },
      {
        key: 'gaia',
        isGaia: true,
        minOrder: 0,
        minVmag: 3,
        maxVmag: 20,
        tiles: [
          {
            order: 0,
            pix: 3,
            stars: [
              {
                gaia: BigInt('219547565555375488'),
                vmag: 2.05,
                raDeg: 0,
                decDeg: 0,
                names: ['GAIA 219547565555375488'],
              },
            ],
          },
        ],
      },
    ],
  })

  const digest = computeStarsCModuleRuntimeDigest({
    runtime,
    starsLimitMagnitude: 6.5,
    hardLimitMagnitude: 6.2,
    selectedStarId: 'hip-11767',
  })

  const listHint = listStarsFromStarsCModule({
    runtime,
    maxMag: 0,
    hintNuniq: healpixOrderPixToNuniq(5, 777),
  }).status

  const designation = findByDesignationFromStarsCModule(runtime, 'gaia 219547565555375488')
  const designationStatus = designation.status === 'found' ? designation.star.id : designation.status

  const pendingProbe = addStarsCModuleDataSource(runtime, {
    key: 'deep-remote',
    url: '/catalog/deep-remote',
    propertiesText: null,
    tileStore: {
      listTraversalTiles: () => [],
      getTile: () => ({ tile: null, code: 0 }),
      preloadRootLevel: () => undefined,
    },
  }).status

  return [
    'stars-c-module-runtime',
    digest,
    `hint-miss:${listHint === STARS_C_MODULE_AGAIN ? 'again' : String(listHint)}`,
    `designation:${designationStatus}`,
    `pending-add:${pendingProbe === STARS_C_MODULE_AGAIN ? 'again' : String(pendingProbe)}`,
  ].join('|')
}

/**
 * Canonical string for the module 2 ported surface. Two runs on the same build MUST match bitwise.
 */
export function computeModule2PortFingerprint(): string {
  const bvSamples = [-0.2, 0, 0.58, 1.2, 2]
  const bvParts = bvSamples.map((bv) => `bv:${bv}:${triplet(bvToRgb(bv))}`)

  const order = 3
  const pix = 42
  const nuniq = encodeEphTileNuniq(order, pix)
  const decoded = nuniqToHealpixOrderAndPix(nuniq)
  const roundTrip = encodeEphTileNuniq(decoded.order, decoded.pix)
  const nuniqPart = `nuniq:${nuniq.toString()}:${decoded.order}:${decoded.pix}:${roundTrip === nuniq ? '1' : '0'}`

  const limParts = [
    `lim:${resolveStarsRenderLimitMagnitude(6.5, { starsLimitMag: 7.2, hardLimitMag: 99 })}`,
    `lim-null:${resolveStarsRenderLimitMagnitude(8, null)}`,
    `lim-cap:${resolveStarsRenderLimitMagnitude(12, { starsLimitMag: 6, hardLimitMag: 10 })}`,
  ]

  const hipSamples = [0, 1, 11767, 91262, 120415]
  const hipParts = hipSamples.map((hip) => `hip:${hip}:${hipGetPix(hip, 0)}:${hipGetPix(hip, 1)}:${hipGetPix(hip, 2)}`)

  const tonemapper = {
    p: STELLARIUM_TONEMAPPER_P,
    exposure: STELLARIUM_TONEMAPPER_EXPOSURE,
    lwmax: STELLARIUM_TONEMAPPER_LWMAX_MAX,
  }
  const fovSample = 60
  const pointParts: string[] = []
  for (const mag of [0.5, 4.2, 8]) {
    const pt = coreGetPointForMagnitude(mag, fovSample, tonemapper)
    pointParts.push(
      `pt:${mag}:${pt.visible ? '1' : '0'}:${q(pt.radiusPx)}:${q(pt.luminance)}:${q(pt.rawLuminance)}`,
    )
  }

  const tierParts: string[] = []
  for (const fov of [8, 40, 95]) {
    tierParts.push(`tier:${fov}:${resolveViewTierFingerprint(fov)}`)
  }

  const starCapParts: string[] = []
  for (const fov of [10, 30, 60, 100]) {
    starCapParts.push(`starCap:${fov}:${resolveProjectedStarCapForFov(fov)}`)
  }

  const parts = [
    ...bvParts,
    nuniqPart,
    ...limParts,
    ...hipParts,
    ...pointParts,
    ...tierParts,
    `syncCadenceMs:${RUNTIME_MODEL_SYNC_CADENCE_MS}`,
    ...starCapParts,
    visitorTraversalSlice(),
    hipLookupSlice(),
    catalogAstrometrySlice(),
    projectionCacheSignatureSlice(),
    runtimeTileQuerySignatureSlice(),
    starsListSlice(),
    sceneLuminanceFingerprintSlice(),
    starsProjectionReplaySlice(),
    starsProjectionReuseSlice(),
    starsSurveyRegistrySlice(),
    overlayCadenceSlice(),
    starsCRuntimePortSlice(),
    starsCSurveyLifecycleSlice(),
    starsCModuleRuntimeSlice(),
  ]

  return parts.join('::')
}
