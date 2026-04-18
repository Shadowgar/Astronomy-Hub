import { describe, expect, it } from 'vitest'

import { computeModule1TileLoadFingerprint } from '../src/features/sky-engine/engine/sky/runtime/module1ParityFingerprint.ts'
import { MODULE1_REPLAY_FIXTURES } from './module1ReplayFixtures.ts'

describe('Module 1 deterministic tile load replay (G4)', () => {
  it.each(MODULE1_REPLAY_FIXTURES)('fingerprint is bitwise-stable across two runs: $id', ({ result }) => {
    const a = computeModule1TileLoadFingerprint(result)
    const b = computeModule1TileLoadFingerprint(result)
    expect(b).toBe(a)
    expect(a.length).toBeGreaterThan(40)
  })

  it('fixture set matches golden snapshot (detect drift)', () => {
    const fingerprints = MODULE1_REPLAY_FIXTURES.map((c) =>
      computeModule1TileLoadFingerprint(c.result),
    )
    expect(fingerprints).toMatchSnapshot()
  })
})
