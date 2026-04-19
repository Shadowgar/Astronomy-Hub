import { describe, expect, it } from 'vitest'

import { computeModule2PortFingerprint } from '../src/features/sky-engine/engine/sky/runtime/module2ParityFingerprint.ts'

describe('Module 2 deterministic port replay (G4)', () => {
  it('port fingerprint is bitwise-stable across two runs', () => {
    const a = computeModule2PortFingerprint()
    const b = computeModule2PortFingerprint()
    expect(b).toBe(a)
    expect(a.length).toBeGreaterThan(80)
  })

  it('matches golden snapshot (detect drift in BV / nuniq / HIP / limit policy)', () => {
    expect(computeModule2PortFingerprint()).toMatchSnapshot()
  })
})
