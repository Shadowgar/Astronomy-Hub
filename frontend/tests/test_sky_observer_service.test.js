import { describe, expect, it } from 'vitest'

import { SkyClockService } from '../src/features/sky-engine/engine/sky/runtime/SkyClockService.ts'
import { SkyObserverService } from '../src/features/sky-engine/engine/sky/runtime/SkyObserverService.ts'

const baseObserver = {
  label: 'test',
  latitude: 40.7,
  longitude: -74.0,
  elevationFt: 100,
}

describe('SkyObserverService (Stellarium observer_update seam)', () => {
  it('recomputes once then skips when hash matches', () => {
    const clock = new SkyClockService()
    clock.syncBaseTimestamp('2024-06-01T12:00:00.000Z')
    const service = new SkyObserverService(baseObserver, clock)

    expect(service.frameTick()).toBe(true)
    expect(service.frameTick()).toBe(false)
  })

  it('recomputes when scene time changes', () => {
    const clock = new SkyClockService()
    clock.syncBaseTimestamp('2024-06-01T12:00:00.000Z')
    const service = new SkyObserverService(baseObserver, clock)
    service.frameTick()
    clock.nudgeSceneOffset(60)
    expect(service.frameTick()).toBe(true)
    expect(service.getUpdateMode()).toBe('fast')
  })

  it('recomputes after syncObserver', () => {
    const clock = new SkyClockService()
    clock.syncBaseTimestamp('2024-06-01T12:00:00.000Z')
    const service = new SkyObserverService(baseObserver, clock)
    service.frameTick()
    expect(service.frameTick()).toBe(false)

    service.syncObserver({ ...baseObserver, latitude: 41 })
    expect(service.frameTick()).toBe(true)
    expect(service.getUpdateMode()).toBe('full')
  })

  it('does not dirty when syncObserver receives equivalent props', () => {
    const clock = new SkyClockService()
    clock.syncBaseTimestamp('2024-06-01T12:00:00.000Z')
    const service = new SkyObserverService(baseObserver, clock)
    expect(service.frameTick()).toBe(true)
    expect(service.frameTick()).toBe(false)
    service.syncObserver({ ...baseObserver })
    expect(service.frameTick()).toBe(false)
  })

  it('exposes derived radians and meters', () => {
    const clock = new SkyClockService()
    clock.syncBaseTimestamp('2024-06-01T12:00:00.000Z')
    const service = new SkyObserverService(baseObserver, clock)
    service.frameTick()
    const g = service.getDerivedGeometry()
    expect(g.latitudeRad).toBeCloseTo((40.7 * Math.PI) / 180, 5)
    expect(g.longitudeRad).toBeCloseTo((-74 * Math.PI) / 180, 5)
    expect(g.elevationMeters).toBeCloseTo(100 * 0.3048, 5)
    expect(g.refraction.refA).toBeGreaterThan(0)
    expect(g.refraction.refB).toBeGreaterThan(0)
    expect(g.matrices.ri2h[0]).toHaveLength(3)
    expect(g.matrices.rh2i[1]).toHaveLength(3)
    expect(g.matrices.icrsToHorizontal[0]).toHaveLength(3)
    expect(g.matrices.horizontalToIcrs[2]).toHaveLength(3)
    expect(g.polarMotion.xpRad).toBe(0)
    expect(g.polarMotion.yplRad).toBe(0)
    expect(g.observerSeam.phiRad).toBeCloseTo((40.7 * Math.PI) / 180, 5)
    expect(g.observerSeam.elongRad).toBeCloseTo((-74 * Math.PI) / 180, 5)
    expect(Number.isFinite(g.observerSeam.eralRad)).toBe(true)
  })

  it('forces full update when elapsed scene time exceeds fast threshold', () => {
    const clock = new SkyClockService()
    clock.syncBaseTimestamp('2024-06-01T12:00:00.000Z')
    const service = new SkyObserverService(baseObserver, clock)
    expect(service.frameTick()).toBe(true)
    clock.nudgeSceneOffset(60 * 60 * 24 + 120)
    expect(service.frameTick()).toBe(true)
    expect(service.getUpdateMode()).toBe('full')
  })

  it('does not throw when scene offset is NaN: frameTick uses safe scene ISO', () => {
    const clock = new SkyClockService()
    clock.syncBaseTimestamp('2024-06-01T12:00:00.000Z')
    clock.setSceneOffsetSeconds(Number.NaN)
    expect(clock.getSceneOffsetSeconds()).toBe(0)
    const service = new SkyObserverService(baseObserver, clock)
    expect(() => service.frameTick()).not.toThrow()
    expect(() => clock.getSceneTimestampIso()).not.toThrow()
  })

  it('uses leap-second aware TT conversion for historical timestamps', () => {
    const clock = new SkyClockService()
    clock.syncBaseTimestamp('2014-01-01T00:00:00.000Z')
    const service = new SkyObserverService(baseObserver, clock)
    service.frameTick()
    const before2015 = service.getDerivedGeometry()

    clock.syncBaseTimestamp('2017-01-02T00:00:00.000Z')
    service.frameTick()
    const after2017 = service.getDerivedGeometry()

    const beforeOffsetSeconds = (before2015.ttJulianDate - before2015.utcJulianDate) * 86400
    const afterOffsetSeconds = (after2017.ttJulianDate - after2017.utcJulianDate) * 86400

    expect(beforeOffsetSeconds).toBeCloseTo(67.184, 3)
    expect(afterOffsetSeconds).toBeCloseTo(69.184, 3)
  })
})
