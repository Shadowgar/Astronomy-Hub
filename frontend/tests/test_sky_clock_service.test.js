import { describe, expect, it } from 'vitest'

import { SkyClockService } from '../src/features/sky-engine/engine/sky/runtime/SkyClockService'

describe('SkyClockService deterministic reset', () => {
  it('resets scene time to last synced backend timestamp', () => {
    const clock = new SkyClockService()
    clock.syncBaseTimestamp('2026-04-17T01:00:00.000Z')
    clock.setSceneOffsetSeconds(123.5)

    clock.resetSceneTime()

    expect(clock.getSceneTimestampIso()).toBe('2026-04-17T01:00:00.000Z')
    expect(clock.getSceneOffsetSeconds()).toBe(0)
    expect(clock.getPlaybackRate()).toBe(1)
  })

  it('tracks newest synced backend timestamp across resets', () => {
    const clock = new SkyClockService()
    clock.syncBaseTimestamp('2026-04-17T01:00:00.000Z')
    clock.syncBaseTimestamp('2026-04-17T02:30:00.000Z')
    clock.nudgeSceneOffset(42)

    clock.resetSceneTime()

    expect(clock.getSceneTimestampIso()).toBe('2026-04-17T02:30:00.000Z')
  })

  it('freezes animation and scene offset in deterministic mode', () => {
    const clock = new SkyClockService()
    clock.syncBaseTimestamp('2026-04-17T01:00:00.000Z')
    clock.setPlaybackRate(5)
    clock.setDeterministicMode(true)

    clock.advanceFrame(10)

    expect(clock.getAnimationTimeSeconds()).toBe(0)
    expect(clock.getSceneOffsetSeconds()).toBe(0)
    expect(clock.getSceneTimestampIso()).toBe('2026-04-17T01:00:00.000Z')
  })
})
