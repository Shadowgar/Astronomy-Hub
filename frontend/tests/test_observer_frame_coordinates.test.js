import { describe, expect, it } from 'vitest'

import {
  createObserverAstrometrySnapshot,
  horizontalToRaDec,
  raDecToHorizontalCoordinates,
} from '../src/features/sky-engine/engine/sky/transforms/coordinates.ts'

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
