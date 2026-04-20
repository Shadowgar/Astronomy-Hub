/**
 * Module 2 regression (G3/G5): proves that {@link assembleSkyScenePacket}
 * routes stars with `parallaxMas > 2` through the Stellarium
 * `painter_project(FRAME_ASTROM → FRAME_OBSERVED)` chain end-to-end
 * (i.e. `compute_pv` + `star_get_astrom` → `eraLdsun` → `eraAb` → `bpn^T`
 * → `ri2h`), and that stars with `parallaxMas ≤ 2` fall back to the
 * static `raDecToObserverUnitVector` path (Stellarium
 * `stars.c::on_file_tile_loaded` dirty-plx rule). Seals the §7 claim
 * that `painter_project(FRAME_ASTROM, …)` is ported as of EV-0070 and
 * consumed by the EV-0070 pv cache in `sceneAssembler.ts`.
 */

import { describe, expect, it } from 'vitest'

import { assembleSkyScenePacket } from '../src/features/sky-engine/engine/sky/services/sceneAssembler.ts'
import { deriveObserverGeometry } from '../src/features/sky-engine/engine/sky/runtime/observerDerivedGeometry.ts'
import { mergeObserverSnapshotWithDerivedGeometry } from '../src/features/sky-engine/engine/sky/runtime/observerAstrometryMerge.ts'
import { ERFA_DJM0 } from '../src/features/sky-engine/engine/sky/runtime/erfaConstants.ts'
import {
  computeCatalogStarPvFromCatalogueUnits,
  starAstrometricIcrfVector,
} from '../src/features/sky-engine/engine/sky/runtime/starsCatalogAstrom.ts'
import { stellariumAstrometricToApparentIcrsUnit } from '../src/features/sky-engine/engine/sky/runtime/erfaAbLdsun.ts'
import {
  convertObserverFrameVector,
  raDecToObserverUnitVector,
} from '../src/features/sky-engine/engine/sky/transforms/coordinates.ts'

const SCENE_TS = '2024-06-21T12:00:00.000Z'
const OBSERVER_INPUT = {
  label: 'nyc',
  latitude: 40.7128,
  longitude: -74.006,
  elevationFt: 33,
}

function buildAstrometry() {
  const derived = deriveObserverGeometry(OBSERVER_INPUT, SCENE_TS, 'full', null)
  const snapshot = {
    timestampUtc: SCENE_TS,
    latitudeDeg: OBSERVER_INPUT.latitude,
    longitudeDeg: OBSERVER_INPUT.longitude,
    elevationM: OBSERVER_INPUT.elevationFt * 0.3048,
    fovDeg: 60,
    centerAltDeg: 45,
    centerAzDeg: 180,
    projection: 'stereographic',
  }
  return { derived, snapshot, astrometry: mergeObserverSnapshotWithDerivedGeometry(snapshot, derived) }
}

function expectVectorsClose(actual, expected, tolerance = 1e-11) {
  expect(Math.abs(actual.x - expected.x)).toBeLessThanOrEqual(tolerance)
  expect(Math.abs(actual.y - expected.y)).toBeLessThanOrEqual(tolerance)
  expect(Math.abs(actual.z - expected.z)).toBeLessThanOrEqual(tolerance)
}

function multiplyMatrix3TransposeVector3(m, v) {
  return {
    x: m[0][0] * v.x + m[1][0] * v.y + m[2][0] * v.z,
    y: m[0][1] * v.x + m[1][1] * v.y + m[2][1] * v.z,
    z: m[0][2] * v.x + m[1][2] * v.y + m[2][2] * v.z,
  }
}

function multiplyMatrix3Vector3(m, v) {
  return {
    x: m[0][0] * v.x + m[0][1] * v.y + m[0][2] * v.z,
    y: m[1][0] * v.x + m[1][1] * v.y + m[1][2] * v.z,
    z: m[2][0] * v.x + m[2][1] * v.y + m[2][2] * v.z,
  }
}

function normalize(v) {
  const n = Math.hypot(v.x, v.y, v.z) || 1
  return { x: v.x / n, y: v.y / n, z: v.z / n }
}

function expectedPainterProjectFrameAstrom(star, astrometry) {
  const pv = computeCatalogStarPvFromCatalogueUnits({
    raDeg: star.raDeg,
    decDeg: star.decDeg,
    pmRaMasYr: star.pmRaMasYr,
    pmDecMasYr: star.pmDecMasYr,
    parallaxMas: star.parallaxMas,
  })
  const ttMjd = astrometry.ttJulianDate - ERFA_DJM0
  const icrf = starAstrometricIcrfVector(pv, ttMjd, astrometry.earthPv)
  const s = astrometry.stellariumAstrom
  const apparentGcrs = stellariumAstrometricToApparentIcrsUnit(s, icrf)
  const cirs = normalize(
    multiplyMatrix3TransposeVector3(s.bpn, {
      x: apparentGcrs[0], y: apparentGcrs[1], z: apparentGcrs[2],
    }),
  )
  return normalize(multiplyMatrix3Vector3(astrometry.matrices.ri2h, cirs))
}

describe('Module 2 · painter_project(FRAME_ASTROM → observed_geom) end-to-end (EV-0072)', () => {
  it('stars with parallaxMas > 2 go through compute_pv + star_get_astrom + aberration + bpn^T + ri2h', () => {
    const { snapshot, astrometry } = buildAstrometry()
    const star = {
      id: 'hip:TEST-A',
      sourceId: 'TEST-A',
      raDeg: 201.298247,
      decDeg: -11.161319,
      pmRaMasYr: -546.01,
      pmDecMasYr: -1223.08,
      parallaxMas: 38.02,
      mag: 0.98,
      colorIndex: 0.15,
      tier: 'bright',
      catalog: 'hipparcos',
    }
    const tile = {
      tileId: 'astrom-a',
      level: 0,
      parentTileId: null,
      childTileIds: [],
      bounds: { raMinDeg: 0, raMaxDeg: 360, decMinDeg: -90, decMaxDeg: 90 },
      magMin: 0, magMax: 1, starCount: 1, stars: [star],
    }
    const query = {
      observer: snapshot,
      limitingMagnitude: 6,
      activeTiers: ['bright', 'medium', 'faint'],
      visibleTileIds: [tile.tileId],
      observerFrameAstrometry: astrometry,
    }
    const packet = assembleSkyScenePacket(query, [tile])
    expect(packet.stars).toHaveLength(1)
    const expected = expectedPainterProjectFrameAstrom(star, astrometry)
    expectVectorsClose(packet.stars[0], expected)
  })

  it('stars with parallaxMas ≤ 2 fall back to raDecToObserverUnitVector (on_file_tile_loaded dirty-plx rule)', () => {
    const { snapshot, astrometry } = buildAstrometry()
    const star = {
      id: 'hip:TEST-B',
      sourceId: 'TEST-B',
      raDeg: 120.5,
      decDeg: 22.25,
      pmRaMasYr: 10,
      pmDecMasYr: -4,
      parallaxMas: 1.2,
      mag: 3.1,
      colorIndex: 0.6,
      tier: 'medium',
      catalog: 'hipparcos',
    }
    const tile = {
      tileId: 'astrom-b',
      level: 0,
      parentTileId: null,
      childTileIds: [],
      bounds: { raMinDeg: 0, raMaxDeg: 360, decMinDeg: -90, decMaxDeg: 90 },
      magMin: 3, magMax: 4, starCount: 1, stars: [star],
    }
    const query = {
      observer: snapshot,
      limitingMagnitude: 6,
      activeTiers: ['bright', 'medium', 'faint'],
      visibleTileIds: [tile.tileId],
      observerFrameAstrometry: astrometry,
    }
    const packet = assembleSkyScenePacket(query, [tile])
    expect(packet.stars).toHaveLength(1)
    const fallback = raDecToObserverUnitVector(star.raDeg, star.decDeg, snapshot, astrometry)
    expectVectorsClose(packet.stars[0], fallback.vector)
  })

  it('convertObserverFrameVector(icrf → observed_geom) matches manual Stellarium chain (bpn^T ∘ ri2h ∘ astrometric_to_apparent)', () => {
    const { astrometry } = buildAstrometry()
    const icrs = normalize({ x: 0.42, y: -0.13, z: 0.897 })
    const converted = convertObserverFrameVector(icrs, 'icrf', 'observed_geom', astrometry)
    const s = astrometry.stellariumAstrom
    const apparent = stellariumAstrometricToApparentIcrsUnit(s, [icrs.x, icrs.y, icrs.z])
    const cirs = normalize(
      multiplyMatrix3TransposeVector3(s.bpn, { x: apparent[0], y: apparent[1], z: apparent[2] }),
    )
    const expected = normalize(multiplyMatrix3Vector3(astrometry.matrices.ri2h, cirs))
    expectVectorsClose(converted, expected, 1e-13)
  })
})
