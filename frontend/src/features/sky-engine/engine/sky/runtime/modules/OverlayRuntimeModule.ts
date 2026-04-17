import type { SkyModule } from '../SkyModule'
import { prepareDirectOverlayFrame } from '../../../../directOverlayLayer'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import type { RuntimeProjectedSceneFrame } from './runtimeFrame'

function toTenths(value: number) {
  return Math.round(value * 10)
}

function getCircularDeltaTenths(currentValue: number, previousValue: number) {
  const directDelta = Math.abs(currentValue - previousValue)
  return Math.min(directDelta, 3600 - directDelta)
}

function buildAidSignature(aidVisibility: ScenePropsSnapshot['aidVisibility']) {
  return [aidVisibility.constellations, aidVisibility.azimuthRing, aidVisibility.altitudeRings]
    .map((value) => (value ? '1' : '0'))
    .join(':')
}

function buildGuidedSignature(guidedObjectIds: ScenePropsSnapshot['guidedObjectIds']) {
  return guidedObjectIds.join('|')
}

export function createOverlayRuntimeModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  const cadenceState = {
    lastSyncAtMs: 0,
    lastPropsVersion: -1,
    lastSelectedObjectId: null as string | null,
    lastAidSignature: '',
    lastGuidedSignature: '',
    lastSunPhaseLabel: '',
    lastCenterAltTenths: Number.NaN,
    lastCenterAzTenths: Number.NaN,
    lastFovTenths: Number.NaN,
    lastViewportWidth: 0,
    lastViewportHeight: 0,
    lastProjectedObjectsRef: null as RuntimeProjectedSceneFrame['projectedObjects'] | null,
    lastHintsLimitMag: Number.NaN,
    /** Preserved when sync is skipped so `labels_reset` in the render preamble does not clear labels for a whole frame. */
    lastVisibleLabelIds: [] as readonly string[],
    lastTrajectoryObjectId: null as string | null,
  }

  return {
    id: 'sky-overlay-runtime-module',
    renderOrder: 100,
    render({ runtime, services, getProps, getPropsVersion }) {
      const latest = getProps()
      const projectedFrame = runtime.projectedSceneFrame

      if (!projectedFrame) {
        runtime.visibleLabelIds = cadenceState.lastVisibleLabelIds
        runtime.trajectoryObjectId = cadenceState.lastTrajectoryObjectId
        return
      }

      const propsVersion = getPropsVersion()
      const centerDirection = services.navigationService.getCenterDirection()
      const centerAltTenths = toTenths((Math.asin(Math.max(-1, Math.min(1, centerDirection.y))) * 180) / Math.PI)
      const centerAzTenths = toTenths((((Math.atan2(centerDirection.x, centerDirection.z) * 180) / Math.PI) + 360) % 360)
      const fovTenths = toTenths(projectedFrame.currentFovDegrees)
      const aidSignature = buildAidSignature(latest.aidVisibility)
      const guidedSignature = buildGuidedSignature(latest.guidedObjectIds)
      const hintsLimitMag = runtime.corePainterLimits?.hintsLimitMag ?? Number.NaN
      const forceSync =
        cadenceState.lastSyncAtMs === 0 ||
        propsVersion !== cadenceState.lastPropsVersion ||
        latest.selectedObjectId !== cadenceState.lastSelectedObjectId ||
        aidSignature !== cadenceState.lastAidSignature ||
        guidedSignature !== cadenceState.lastGuidedSignature ||
        latest.sunState.phaseLabel !== cadenceState.lastSunPhaseLabel ||
        projectedFrame.projectedObjects !== cadenceState.lastProjectedObjectsRef ||
        hintsLimitMag !== cadenceState.lastHintsLimitMag ||
        projectedFrame.width !== cadenceState.lastViewportWidth ||
        projectedFrame.height !== cadenceState.lastViewportHeight
      const significantViewChange =
        Number.isNaN(cadenceState.lastCenterAltTenths) ||
        centerAltTenths !== cadenceState.lastCenterAltTenths ||
        getCircularDeltaTenths(centerAzTenths, cadenceState.lastCenterAzTenths) > 0 ||
        fovTenths !== cadenceState.lastFovTenths

      if (!forceSync && !significantViewChange) {
        runtime.visibleLabelIds = cadenceState.lastVisibleLabelIds
        runtime.trajectoryObjectId = cadenceState.lastTrajectoryObjectId
        return
      }

      const overlayFrame = prepareDirectOverlayFrame(
        projectedFrame.view,
        services.observerService.getObserver(),
        services.clockService.getSceneTimestampIso(),
        projectedFrame.projectedObjects,
        latest.scenePacket,
        latest.selectedObjectId,
        latest.aidVisibility,
        latest.skyCultureId,
        runtime.corePainterLimits?.hintsLimitMag,
      )
      const overlayState = runtime.directOverlayLayer.sync(
        overlayFrame,
        projectedFrame.projectedObjects,
        projectedFrame.width,
        projectedFrame.height,
        runtime.camera,
        runtime.engine,
        latest.selectedObjectId,
        new Set(latest.guidedObjectIds),
        latest.sunState,
        projectedFrame.lod.labelCap,
        projectedFrame.currentFovDegrees,
      )

      cadenceState.lastVisibleLabelIds = overlayState.visibleLabelIds
      cadenceState.lastTrajectoryObjectId = overlayState.trajectoryObjectId
      runtime.visibleLabelIds = overlayState.visibleLabelIds
      runtime.trajectoryObjectId = overlayState.trajectoryObjectId
      cadenceState.lastSyncAtMs = performance.now()
      cadenceState.lastPropsVersion = propsVersion
      cadenceState.lastSelectedObjectId = latest.selectedObjectId
      cadenceState.lastAidSignature = aidSignature
      cadenceState.lastGuidedSignature = guidedSignature
      cadenceState.lastSunPhaseLabel = latest.sunState.phaseLabel
      cadenceState.lastProjectedObjectsRef = projectedFrame.projectedObjects
      cadenceState.lastHintsLimitMag = hintsLimitMag
      cadenceState.lastCenterAltTenths = centerAltTenths
      cadenceState.lastCenterAzTenths = centerAzTenths
      cadenceState.lastFovTenths = fovTenths
      cadenceState.lastViewportWidth = projectedFrame.width
      cadenceState.lastViewportHeight = projectedFrame.height
    },
  }
}
