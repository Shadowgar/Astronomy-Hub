/**
 * Stable fingerprint for module 2 “stars port” algorithms (G4): BV, nuniq, limit magnitude, `hip_get_pix`,
 * plus StarsModule-adjacent Stellarium visual math and LOD tier policy.
 * No I/O — pure functions only. Drift in snapshot = intentional port change or regression.
 */

import { bvToRgb } from '../adapters/bvToRgb'
import { encodeEphTileNuniq } from '../adapters/ephCodec'
import { nuniqToHealpixOrderAndPix } from '../adapters/starsNuniq'
import { hipGetPix } from '../adapters/hipGetPix'
import {
  STELLARIUM_TONEMAPPER_EXPOSURE,
  STELLARIUM_TONEMAPPER_LWMAX_MAX,
  STELLARIUM_TONEMAPPER_P,
  coreGetPointForMagnitude,
} from '../core/stellariumVisualMath'
import { resolveStarsRenderLimitMagnitude } from './stellariumPainterLimits'
import { resolveProjectedStarCapForFov } from './modules/runtimeFrame'
import { RUNTIME_MODEL_SYNC_CADENCE_MS } from '../../../SkyEngineScene'
import { visitStarsRenderTiles } from './starsRenderVisitor'
import { findRuntimeStarByHipInTiles } from '../adapters/starsLookup'
import {
  computeCatalogStarPvFromCatalogueUnits,
  starAstrometricIcrfVector,
} from './starsCatalogAstrom'
import { buildScenePacketSignature } from './modules/StarsModule'
import { buildRuntimeTileQuerySignature } from '../../../sceneQueryState'
import type { SkyScenePacket } from '../contracts/scene'
import type { SkyTilePayload } from '../contracts/tiles'
import type { SkyEngineQuery } from '../contracts/tiles'

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
          mag: 2.0,
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
      activeTiers: ['T0', 'T1', 'T2'],
      tileLevels: [0, 1],
      tilesPerLevel: { '0': 1, '1': 2 },
      maxTileDepthReached: 1,
      visibleTileIds: ['root-a', 'root-a-ne', 'root-a-se'],
    },
  }
  return `packet-signature:${buildScenePacketSignature(scenePacket)}`
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

/**
 * Canonical string for the module 2 ported surface. Two runs on the same build MUST match bitwise.
 */
export function computeModule2PortFingerprint(): string {
  const parts: string[] = []

  const bvSamples = [-0.2, 0, 0.58, 1.2, 2.0]
  for (const bv of bvSamples) {
    parts.push(`bv:${bv}:${triplet(bvToRgb(bv))}`)
  }

  const order = 3
  const pix = 42
  const nuniq = encodeEphTileNuniq(order, pix)
  const decoded = nuniqToHealpixOrderAndPix(nuniq)
  const roundTrip = encodeEphTileNuniq(decoded.order, decoded.pix)
  parts.push(`nuniq:${nuniq.toString()}:${decoded.order}:${decoded.pix}:${roundTrip === nuniq ? '1' : '0'}`)

  parts.push(
    `lim:${resolveStarsRenderLimitMagnitude(6.5, { starsLimitMag: 7.2, hardLimitMag: 99 })}`,
  )
  parts.push(`lim-null:${resolveStarsRenderLimitMagnitude(8, null)}`)
  parts.push(
    `lim-cap:${resolveStarsRenderLimitMagnitude(12, { starsLimitMag: 6, hardLimitMag: 10 })}`,
  )

  const hipSamples = [0, 1, 11767, 91262, 120415]
  for (const hip of hipSamples) {
    parts.push(`hip:${hip}:${hipGetPix(hip, 0)}:${hipGetPix(hip, 1)}:${hipGetPix(hip, 2)}`)
  }

  const tonemapper = {
    p: STELLARIUM_TONEMAPPER_P,
    exposure: STELLARIUM_TONEMAPPER_EXPOSURE,
    lwmax: STELLARIUM_TONEMAPPER_LWMAX_MAX,
  }
  const fovSample = 60
  for (const mag of [0.5, 4.2, 8.0]) {
    const pt = coreGetPointForMagnitude(mag, fovSample, tonemapper)
    parts.push(
      `pt:${mag}:${pt.visible ? '1' : '0'}:${q(pt.radiusPx)}:${q(pt.luminance)}:${q(pt.rawLuminance)}`,
    )
  }

  for (const fov of [8, 40, 95]) {
    parts.push(`tier:${fov}:${resolveViewTierFingerprint(fov)}`)
  }

  parts.push(`syncCadenceMs:${RUNTIME_MODEL_SYNC_CADENCE_MS}`)
  for (const fov of [10, 30, 60, 100]) {
    parts.push(`starCap:${fov}:${resolveProjectedStarCapForFov(fov)}`)
  }
  parts.push(visitorTraversalSlice())
  parts.push(hipLookupSlice())
  parts.push(catalogAstrometrySlice())
  parts.push(projectionCacheSignatureSlice())
  parts.push(runtimeTileQuerySignatureSlice())

  return parts.join('::')
}
