import { describe, expect, it } from 'vitest'

import {
  convertObserverFrameVector,
  createObserverAstrometrySnapshot,
  horizontalToRaDec,
  raDecToHorizontalCoordinates,
} from '../src/features/sky-engine/engine/sky/transforms/coordinates.ts'
import { deriveObserverGeometry } from '../src/features/sky-engine/engine/sky/runtime/observerDerivedGeometry.ts'
import { stellariumFrameAstrometryFromEraAstrom } from '../src/features/sky-engine/engine/sky/runtime/erfaAbLdsun.ts'

describe('observer frame coordinate conversions', () => {
  const observer = {
    timestampUtc: '2026-04-08T12:00:00.000Z',
    latitudeDeg: 40.7128,
    longitudeDeg: -74.006,
    elevationM: 10,
    fovDeg: 60,
    centerAltDeg: 0,
    centerAzDeg: 0,
    projection: 'stereographic',
  }

  it('builds astrometry snapshot with sidereal and refraction constants', () => {
    const astrometry = createObserverAstrometrySnapshot(observer)
    expect(astrometry.localSiderealTimeDeg).toBeGreaterThanOrEqual(0)
    expect(astrometry.localSiderealTimeDeg).toBeLessThan(360)
    expect(astrometry.refraction?.refA ?? 0).toBeGreaterThan(0)
    expect(astrometry.refraction?.refB ?? 0).toBeGreaterThan(0)
  })

  it('uses Stellarium refraction_prepare semantics (pressure mbar, temperature °C)', () => {
    const sea = createObserverAstrometrySnapshot({ ...observer, elevationM: 0 })
    expect(sea.refraction?.refB).toBe(15)
    expect(sea.refraction?.refA).toBeCloseTo(1013.25, 2)
  })

  it('applies refraction correction to horizontal altitude', () => {
    const astrometry = createObserverAstrometrySnapshot(observer)
    const result = raDecToHorizontalCoordinates(180, 0, observer, astrometry)
    expect(result.altitudeDeg).toBeGreaterThanOrEqual(result.geometricAltitudeDeg)
  })

  it('convertObserverFrameVector icrf ↔ observed_geom with Stellarium CIO+aberration path', () => {
    const g = deriveObserverGeometry(
      { label: 't', latitude: 40.7128, longitude: -74.006, elevationFt: 100 },
      '2026-04-08T12:00:00.000Z',
      'full',
      null,
    )
    const astrometry = {
      localSiderealTimeDeg: g.localSiderealTimeDeg,
      refraction: g.refraction,
      polarMotion: g.polarMotion,
      observerSeam: g.observerSeam,
      stellariumAstrom: stellariumFrameAstrometryFromEraAstrom(g.astrom),
      matrices: {
        ri2h: g.matrices.ri2h,
        rh2i: g.matrices.rh2i,
        icrsToHorizontal: g.matrices.icrsToHorizontal,
        horizontalToIcrs: g.matrices.horizontalToIcrs,
      },
    }
    const u0 = { x: 0.42, y: -0.65, z: 0.63 }
    const n = Math.hypot(u0.x, u0.y, u0.z)
    const u = { x: u0.x / n, y: u0.y / n, z: u0.z / n }
    const h = convertObserverFrameVector(u, 'icrf', 'observed_geom', astrometry)
    const back = convertObserverFrameVector(h, 'observed_geom', 'icrf', astrometry)
    expect(back.x).toBeCloseTo(u.x, 8)
    expect(back.y).toBeCloseTo(u.y, 8)
    expect(back.z).toBeCloseTo(u.z, 8)
  })

  it('keeps horizontal/equatorial conversions numerically stable', () => {
    const astrometry = createObserverAstrometrySnapshot(observer)
    const equatorial = horizontalToRaDec({
      ...observer,
      centerAltDeg: 22,
      centerAzDeg: 130,
    })
    const roundTrip = raDecToHorizontalCoordinates(equatorial.raDeg, equatorial.decDeg, observer, astrometry)
    expect(Number.isFinite(roundTrip.altitudeDeg)).toBe(true)
    expect(Number.isFinite(roundTrip.azimuthDeg)).toBe(true)
    expect(roundTrip.altitudeDeg).toBeGreaterThanOrEqual(roundTrip.geometricAltitudeDeg)
    expect(roundTrip.isAboveHorizon).toBe(roundTrip.altitudeDeg > 0)
  })
})
