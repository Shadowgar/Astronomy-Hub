import { describe, expect, it } from 'vitest'

import { HIP_PIX_ORDER_2_BYTE_LENGTH } from '../src/features/sky-engine/engine/sky/adapters/hipPixOrder2.generated.ts'
import { hipGetPix } from '../src/features/sky-engine/engine/sky/adapters/hipGetPix.ts'

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
})
