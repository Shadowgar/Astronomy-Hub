import { afterEach, describe, expect, it, vi } from 'vitest'
import { currentObservingNight, nextObservingNoon, subscribeObservingNight, subscribeFixedNight } from '../src/features/tonight/nightClock'

afterEach(() => vi.useRealTimers())

describe('ORAS observing-night clock', () => {
 it.each([
  ['2026-10-02T15:59:00Z','2026-10-01'],
  ['2026-10-02T16:00:00Z','2026-10-02'],
  ['2026-03-08T15:59:00Z','2026-03-07'],
  ['2026-03-08T16:00:00Z','2026-03-08'],
  ['2026-11-01T16:59:00Z','2026-10-31'],
  ['2026-11-01T17:00:00Z','2026-11-01'],
 ])('resolves %s in America/New_York to %s', (instant,date) => {
  expect(currentObservingNight(new Date(instant))).toBe(date)
 })
 it.each([
  ['2026-03-07T17:00:00Z','2026-03-08T16:00:00Z',23],
  ['2026-10-31T16:00:00Z','2026-11-01T17:00:00Z',25],
 ])('schedules the next noon across DST from %s', (instant,next,hours) => {
  const deadline = nextObservingNoon(new Date(instant))
  expect(new Date(deadline).toISOString()).toBe(next.replace('Z','.000Z'))
  expect(deadline-Date.parse(instant)).toBe(hours*3600_000)
 })
 it('notifies once at noon, then schedules the following noon and cleans up', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-02T15:59:00Z'))
  const dates:string[]=[]
  const stop=subscribeObservingNight(() => dates.push(currentObservingNight()))
  expect(vi.getTimerCount()).toBe(1)
  vi.advanceTimersByTime(59_999); expect(dates).toEqual([])
  vi.advanceTimersByTime(1); expect(dates).toEqual(['2026-10-02'])
  expect(vi.getTimerCount()).toBe(1)
  stop(); expect(vi.getTimerCount()).toBe(0)
 })
 it('does not schedule a rollover for an explicit date', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-02T15:59:00Z'))
  const stop=subscribeFixedNight()
  vi.advanceTimersByTime(60_000)
  expect(vi.getTimerCount()).toBe(0)
  stop()
 })
})
