import { describe, expect, it } from 'vitest'
import { evaluateOverlayCadenceDecision } from '../src/features/sky-engine/engine/sky/runtime/overlayCadence'

describe('module2 overlay cadence parity', () => {
  const baseState = {
    lastSyncAtMs: 1000,
    lastPropsVersion: 4,
    lastSelectedObjectId: 'sel-1',
    lastAidSignature: '1:0:1',
    lastGuidedSignature: 'a|b',
    lastSunPhaseLabel: 'night',
    lastCenterAltTenths: 150,
    lastCenterAzTenths: 3599,
    lastFovTenths: 300,
    lastViewportWidth: 1280,
    lastViewportHeight: 720,
    lastProjectedObjectsRef: { ref: 'same' },
    lastHintsLimitMag: 6.2,
  }

  const buildStableNext = () => ({
    propsVersion: 4,
    selectedObjectId: 'sel-1',
    aidSignature: '1:0:1',
    guidedSignature: 'a|b',
    sunPhaseLabel: 'night',
    centerAltTenths: 150,
    centerAzTenths: 3599,
    fovTenths: 300,
    viewportWidth: 1280,
    viewportHeight: 720,
    projectedObjectsRef: baseState.lastProjectedObjectsRef,
    hintsLimitMag: 6.2,
  })

  it('skips sync when state and view are unchanged', () => {
    const decision = evaluateOverlayCadenceDecision(baseState, buildStableNext())
    expect(decision).toEqual({ forceSync: false, significantViewChange: false, shouldSync: false })
  })

  it('forces sync on runtime prop-signature changes', () => {
    const decision = evaluateOverlayCadenceDecision(baseState, {
      ...buildStableNext(),
      guidedSignature: 'a|c',
    })
    expect(decision).toEqual({ forceSync: true, significantViewChange: false, shouldSync: true })
  })

  it('detects wrap-around azimuth changes as significant view motion', () => {
    const decision = evaluateOverlayCadenceDecision(baseState, {
      ...buildStableNext(),
      centerAzTenths: 0,
    })
    expect(decision).toEqual({ forceSync: false, significantViewChange: true, shouldSync: true })
  })

  it('forces initial sync when cadence state is uninitialized', () => {
    const decision = evaluateOverlayCadenceDecision(
      {
        ...baseState,
        lastSyncAtMs: 0,
        lastCenterAltTenths: Number.NaN,
        lastCenterAzTenths: Number.NaN,
        lastFovTenths: Number.NaN,
      },
      buildStableNext(),
    )
    expect(decision).toEqual({ forceSync: true, significantViewChange: true, shouldSync: true })
  })
})
