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
  })

  it('recomputes after syncObserver', () => {
    const clock = new SkyClockService()
    clock.syncBaseTimestamp('2024-06-01T12:00:00.000Z')
    const service = new SkyObserverService(baseObserver, clock)
    service.frameTick()
    expect(service.frameTick()).toBe(false)

    service.syncObserver({ ...baseObserver, latitude: 41 })
    expect(service.frameTick()).toBe(true)
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
  })
})
