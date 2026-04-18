import { describe, expect, it } from 'vitest'

import { computeModule0ObserverGeometryFingerprint } from '../src/features/sky-engine/engine/sky/runtime/module0ParityFingerprint.ts'

import { MODULE0_REPLAY_CASES } from './module0ReplayCases.ts'

describe('Module 0 deterministic replay (G4 / BLK-000 Hub contract)', () => {
  it.each(MODULE0_REPLAY_CASES)('fingerprint is bitwise-stable across two runs: $id', ({ observer, sceneTimestampIso }) => {
    const a = computeModule0ObserverGeometryFingerprint(observer, sceneTimestampIso)
    const b = computeModule0ObserverGeometryFingerprint(observer, sceneTimestampIso)
    expect(b).toBe(a)
    expect(a.length).toBeGreaterThan(200)
  })

  it('five-case set matches golden snapshot (detect drift)', () => {
    const fingerprints = MODULE0_REPLAY_CASES.map((c) =>
      computeModule0ObserverGeometryFingerprint(c.observer, c.sceneTimestampIso),
    )
    expect(fingerprints).toMatchSnapshot()
  })
})
