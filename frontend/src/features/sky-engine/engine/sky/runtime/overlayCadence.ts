import { evaluateOverlayCadenceDecision as evaluateFramePacingOverlayCadenceDecision } from '../adapters/framePacingDecisions'

export type OverlayCadenceState = {
  lastSyncAtMs: number
  lastPropsVersion: number
  lastSelectedObjectId: string | null
  lastAidSignature: string
  lastGuidedSignature: string
  lastSunPhaseLabel: string
  lastCenterAltTenths: number
  lastCenterAzTenths: number
  lastFovTenths: number
  lastViewportWidth: number
  lastViewportHeight: number
  lastProjectedObjectsRef: unknown
  lastHintsLimitMag: number
}

export type OverlayCadenceNext = {
  propsVersion: number
  selectedObjectId: string | null
  aidSignature: string
  guidedSignature: string
  sunPhaseLabel: string
  centerAltTenths: number
  centerAzTenths: number
  fovTenths: number
  viewportWidth: number
  viewportHeight: number
  projectedObjectsRef: unknown
  hintsLimitMag: number
}

export type OverlayCadenceDecision = {
  forceSync: boolean
  significantViewChange: boolean
  shouldSync: boolean
}

export function evaluateOverlayCadenceDecision(
  previous: OverlayCadenceState,
  next: OverlayCadenceNext,
): OverlayCadenceDecision {
  return evaluateFramePacingOverlayCadenceDecision(previous, next)
}
