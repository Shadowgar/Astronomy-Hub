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

function getCircularDeltaTenths(currentValue: number, previousValue: number) {
  const directDelta = Math.abs(currentValue - previousValue)
  return Math.min(directDelta, 3600 - directDelta)
}

export function evaluateOverlayCadenceDecision(
  previous: OverlayCadenceState,
  next: OverlayCadenceNext,
): OverlayCadenceDecision {
  const forceSync =
    previous.lastSyncAtMs === 0 ||
    next.propsVersion !== previous.lastPropsVersion ||
    next.selectedObjectId !== previous.lastSelectedObjectId ||
    next.aidSignature !== previous.lastAidSignature ||
    next.guidedSignature !== previous.lastGuidedSignature ||
    next.sunPhaseLabel !== previous.lastSunPhaseLabel ||
    next.projectedObjectsRef !== previous.lastProjectedObjectsRef ||
    next.hintsLimitMag !== previous.lastHintsLimitMag ||
    next.viewportWidth !== previous.lastViewportWidth ||
    next.viewportHeight !== previous.lastViewportHeight

  const significantViewChange =
    Number.isNaN(previous.lastCenterAltTenths) ||
    next.centerAltTenths !== previous.lastCenterAltTenths ||
    getCircularDeltaTenths(next.centerAzTenths, previous.lastCenterAzTenths) > 0 ||
    next.fovTenths !== previous.lastFovTenths

  return {
    forceSync,
    significantViewChange,
    shouldSync: forceSync || significantViewChange,
  }
}
