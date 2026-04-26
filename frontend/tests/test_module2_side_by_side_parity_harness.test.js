import { describe, expect, it } from 'vitest'

import {
  computeModule2SideBySideParityDigest,
  runModule2SideBySideParityHarness,
  summarizeModule2SideBySideParity,
} from '../src/features/sky-engine/engine/sky/runtime/module2SideBySideParityHarness'

describe('module2 side-by-side parity harness (G5 scaffold)', () => {
  it('runs Hub checkpoint against pinned-source reference vectors', () => {
    const result = runModule2SideBySideParityHarness()

    expect(result.hub.sourceRevision).toBe('63fb3279e85782158a6df63649f1c8a1837b7846')
    expect(result.reference.sourceRevision).toBe(result.hub.sourceRevision)

    expect(result.hub.bv.items.length).toBeGreaterThanOrEqual(10)
    expect(result.hub.nuniq.items.length).toBeGreaterThanOrEqual(8)
    expect(result.hub.hip.items.length).toBeGreaterThanOrEqual(6)
    expect(result.hub.starsList.items.length).toBeGreaterThanOrEqual(6)
    expect(result.hub.surveyPlan.items.length).toBeGreaterThanOrEqual(3)
    expect(result.hub.lookup.items.length).toBeGreaterThanOrEqual(3)
    expect(result.hub.liveStarsList.items.length).toBeGreaterThanOrEqual(3)
    expect(result.hub.liveAddDataSource.items.length).toBeGreaterThanOrEqual(3)

    expect(result.mismatches).toEqual([])
  })

  it('produces stable digest for drift detection', () => {
    const digestA = computeModule2SideBySideParityDigest()
    const digestB = computeModule2SideBySideParityDigest()

    expect(digestA).toBe(digestB)
    expect(digestA).toContain('source:63fb3279e85782158a6df63649f1c8a1837b7846')
    expect(digestA).toContain('live-source:63fb3279e85782158a6df63649f1c8a1837b7846')
    expect(digestA).toContain('match:1')
    expect(digestA).toContain('mismatches:0')
    expect(digestA).toContain('list:default-hip-max6:ok:hip-bright,hip-mid,hip-ok-2,hip-ok-1')
    expect(digestA).toContain('lookup:lookup-hip-11767:11767:hip-11767-a')
    expect(digestA).toContain('live-add:add-stars-minimal:again,ok')
  })

  it('returns concise side-by-side summary with zero mismatches', () => {
    const summary = summarizeModule2SideBySideParity()

    expect(summary).toContain('source:63fb3279e85782158a6df63649f1c8a1837b7846')
    expect(summary).toContain('live-source:63fb3279e85782158a6df63649f1c8a1837b7846')
    expect(summary).toContain('sections:8')
    expect(summary).toContain('mismatches:0')
    expect(summary).toContain('detail:none')
  })
})
