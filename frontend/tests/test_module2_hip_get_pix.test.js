import { describe, expect, it } from 'vitest'

import { HIP_PIX_ORDER_2_BYTE_LENGTH } from '../src/features/sky-engine/engine/sky/adapters/hipPixOrder2.generated.ts'
import {
  hipGetPix,
  parseHipIdFromRuntimeStar,
  runtimeStarMatchesHipHealpixLookup,
} from '../src/features/sky-engine/engine/sky/adapters/hipGetPix.ts'

describe('module2 hip_get_pix (hip.c + hip.inl)', () => {
  it('exposes the Stellarium table length', () => {
    expect(HIP_PIX_ORDER_2_BYTE_LENGTH).toBe(120416)
  })

  it('returns -1 for missing / invalid entries (255 sentinel)', () => {
    expect(hipGetPix(0, 2)).toBe(-1)
  })

  it('matches order scaling: ret >>> (2 * (2 - order)) in integer steps', () => {
    // PIX_ORDER_2[1] === 76 in pinned hip.inl
    expect(hipGetPix(1, 2)).toBe(76)
    expect(hipGetPix(1, 1)).toBe(19)
    expect(hipGetPix(1, 0)).toBe(4)
  })

  it('rejects out-of-range HIP index and order', () => {
    expect(hipGetPix(HIP_PIX_ORDER_2_BYTE_LENGTH, 2)).toBe(-1)
    expect(hipGetPix(100, 3)).toBe(-1)
    expect(hipGetPix(Number.NaN, 2)).toBe(-1)
  })

  it('parses HIP from sourceId, hip- id, or numeric id', () => {
    expect(parseHipIdFromRuntimeStar({ id: 'x', raDeg: 0, decDeg: 0, mag: 0, tier: 'T0', sourceId: 'HIP 91262' })).toBe(91262)
    expect(parseHipIdFromRuntimeStar({ id: 'hip-11767', raDeg: 0, decDeg: 0, mag: 0, tier: 'T0' })).toBe(11767)
    expect(parseHipIdFromRuntimeStar({ id: '999', raDeg: 0, decDeg: 0, mag: 0, tier: 'T0' })).toBe(999)
    expect(parseHipIdFromRuntimeStar({ id: 'star-x', raDeg: 0, decDeg: 0, mag: 0, tier: 'T0' })).toBe(null)
  })

  it('runtimeStarMatchesHipHealpixLookup matches catalog RA/Dec to hip.inl (Polaris)', () => {
    expect(runtimeStarMatchesHipHealpixLookup({
      id: 'hip-11767',
      sourceId: 'HIP 11767',
      raDeg: 37.954515,
      decDeg: 89.264109,
      mag: 1.98,
      tier: 'T0',
    })).toBe(true)
  })

  it('runtimeStarMatchesHipHealpixLookup rejects inconsistent positions', () => {
    expect(runtimeStarMatchesHipHealpixLookup({
      id: 'hip-11767',
      sourceId: 'HIP 11767',
      raDeg: 0,
      decDeg: 0,
      mag: 1.98,
      tier: 'T0',
    })).toBe(false)
  })
})
