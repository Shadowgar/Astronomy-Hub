import { describe, expect, it } from 'vitest'

import { computeObserverFrameAstrometrySignatureForPropSync } from '../src/features/sky-engine/engine/sky/runtime/observerAstrometryMerge.ts'
import { createObserverAstrometrySnapshot } from '../src/features/sky-engine/engine/sky/transforms/coordinates.ts'

const ID = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
]

describe('observer frame astrometry prop-sync signature', () => {
  it('returns na without seam or matrices', () => {
    const snap = createObserverAstrometrySnapshot({
      timestampUtc: '2026-01-01T12:00:00Z',
      latitudeDeg: 0,
      longitudeDeg: 0,
      fovDeg: 60,
      centerAltDeg: 45,
      centerAzDeg: 180,
      projection: 'stereographic',
    })
    expect(computeObserverFrameAstrometrySignatureForPropSync(snap)).toBe('na')
  })

  it('differs when ri2h changes at fixed seam', () => {
    const seam = {
      elongRad: -1.2,
      phiRad: 0.7,
      hmMeters: 10,
      eralRad: 2.345678901234,
    }
    const base = createObserverAstrometrySnapshot({
      timestampUtc: '2026-01-01T12:00:00Z',
      latitudeDeg: 40,
      longitudeDeg: -75,
      fovDeg: 60,
      centerAltDeg: 45,
      centerAzDeg: 180,
      projection: 'stereographic',
    })
    const a = {
      ...base,
      observerSeam: seam,
      matrices: { ri2h: ID, rh2i: ID },
    }
    const b = {
      ...base,
      observerSeam: seam,
      matrices: {
        ri2h: [
          [1.01, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
        rh2i: ID,
      },
    }
    expect(computeObserverFrameAstrometrySignatureForPropSync(a)).not.toBe(
      computeObserverFrameAstrometrySignatureForPropSync(b),
    )
  })
})
