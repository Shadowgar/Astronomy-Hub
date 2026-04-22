import { describe, expect, it } from 'vitest'

import { computeModule2PortFingerprint } from '../src/features/sky-engine/engine/sky/runtime/module2ParityFingerprint.ts'

describe('Module 2 deterministic port replay (G4)', () => {
  it('port fingerprint is bitwise-stable across two runs', () => {
    const a = computeModule2PortFingerprint()
    const b = computeModule2PortFingerprint()
    expect(b).toBe(a)
    expect(a.length).toBeGreaterThan(80)
  })

  it('matches golden snapshot (detect drift across module2 parity seams)', () => {
    expect(computeModule2PortFingerprint()).toMatchSnapshot()
  })

  it('includes deterministic slices for traversal, HIP lookup, and catalog astrometry seams', () => {
    const fingerprint = computeModule2PortFingerprint()
    expect(fingerprint).toContain('visitor-order:')
    expect(fingerprint).toContain('hip-lookup:')
    expect(fingerprint).toContain('catalog-astrom:')
    expect(fingerprint).toContain('packet-signature:')
    expect(fingerprint).toContain('tile-query-signature:')
    expect(fingerprint).toContain('stars-list:')
    expect(fingerprint).toContain('scene-lum|')
    expect(fingerprint).toContain('stars-projection:')
    expect(fingerprint).toContain('stars-reuse|')
    expect(fingerprint).toContain('stars-c-runtime|')
    expect(fingerprint).toContain('stars-c-survey-lifecycle|')
  })
})
