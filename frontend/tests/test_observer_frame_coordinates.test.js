import { describe, expect, it } from 'vitest'

import {
  convertObserverFrameVector,
  createObserverAstrometrySnapshot,
  horizontalToRaDec,
  raDecToHorizontalCoordinates,
  raDecToObserverUnitVector,
} from '../src/features/sky-engine/engine/sky/transforms/coordinates.ts'
import { deriveObserverGeometry } from '../src/features/sky-engine/engine/sky/runtime/observerDerivedGeometry.ts'
import { mergeObserverSnapshotWithDerivedGeometry } from '../src/features/sky-engine/engine/sky/runtime/observerAstrometryMerge.ts'

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

  it('raDecToObserverUnitVector shifts slightly under Module0 vs classical', () => {
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
    const g = deriveObserverGeometry(
      { label: 't', latitude: observer.latitudeDeg, longitude: observer.longitudeDeg, elevationFt: (observer.elevationM ?? 0) / 0.3048 },
      observer.timestampUtc,
      'full',
      null,
    )
    const snap = mergeObserverSnapshotWithDerivedGeometry(observer, g)
    const classical = raDecToObserverUnitVector(180, 45, observer)
    const mod0 = raDecToObserverUnitVector(180, 45, observer, snap)
    expect(Math.hypot(mod0.vector.x, mod0.vector.y, mod0.vector.z)).toBeCloseTo(1, 10)
    const sep = Math.hypot(
      mod0.vector.x - classical.vector.x,
      mod0.vector.y - classical.vector.y,
      mod0.vector.z - classical.vector.z,
    )
    expect(sep).toBeGreaterThan(0.05)
  })

  it('convertObserverFrameVector icrf ↔ observed_geom with Stellarium CIO+aberration path', () => {
    const observerSnap = {
      timestampUtc: '2026-04-08T12:00:00.000Z',
      latitudeDeg: 40.7128,
      longitudeDeg: -74.006,
      elevationM: 100 * 0.3048,
      fovDeg: 60,
      centerAltDeg: 0,
      centerAzDeg: 0,
      projection: 'stereographic',
    }
    const g = deriveObserverGeometry(
      { label: 't', latitude: 40.7128, longitude: -74.006, elevationFt: 100 },
      observerSnap.timestampUtc,
      'full',
      null,
    )
    const astrometry = mergeObserverSnapshotWithDerivedGeometry(observerSnap, g)
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
