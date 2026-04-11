import type { SkyModule } from '../SkyModule'
import { prepareDirectOverlayFrame } from '../../../../directOverlayLayer'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'

const OVERLAY_SYNC_CADENCE_MS = 150
const OVERLAY_VIEW_DELTA_TENTHS = 5

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
  }

  return {
    id: 'sky-overlay-runtime-module',
    renderOrder: 40,
    render({ runtime, services, getProps, getPropsVersion }) {
      const latest = getProps()
      const projectedFrame = runtime.projectedSceneFrame

      if (!projectedFrame) {
        return
      }

      const propsVersion = getPropsVersion()
      const centerDirection = services.navigationService.getCenterDirection()
      const centerAltTenths = toTenths((Math.asin(Math.max(-1, Math.min(1, centerDirection.y))) * 180) / Math.PI)
      const centerAzTenths = toTenths((((Math.atan2(centerDirection.x, centerDirection.z) * 180) / Math.PI) + 360) % 360)
      const fovTenths = toTenths(projectedFrame.currentFovDegrees)
      const aidSignature = buildAidSignature(latest.aidVisibility)
      const guidedSignature = buildGuidedSignature(latest.guidedObjectIds)
      const nowMs = performance.now()
      const forceSync =
        cadenceState.lastSyncAtMs === 0 ||
        propsVersion !== cadenceState.lastPropsVersion ||
        latest.selectedObjectId !== cadenceState.lastSelectedObjectId ||
        aidSignature !== cadenceState.lastAidSignature ||
        guidedSignature !== cadenceState.lastGuidedSignature ||
        latest.sunState.phaseLabel !== cadenceState.lastSunPhaseLabel ||
        projectedFrame.width !== cadenceState.lastViewportWidth ||
        projectedFrame.height !== cadenceState.lastViewportHeight
      const significantViewChange =
        Number.isNaN(cadenceState.lastCenterAltTenths) ||
        Math.abs(centerAltTenths - cadenceState.lastCenterAltTenths) >= OVERLAY_VIEW_DELTA_TENTHS ||
        getCircularDeltaTenths(centerAzTenths, cadenceState.lastCenterAzTenths) >= OVERLAY_VIEW_DELTA_TENTHS ||
        Math.abs(fovTenths - cadenceState.lastFovTenths) >= OVERLAY_VIEW_DELTA_TENTHS

      if (!forceSync && !significantViewChange) {
        return
      }

      if (!forceSync && nowMs - cadenceState.lastSyncAtMs < OVERLAY_SYNC_CADENCE_MS) {
        return
      }

      const overlayFrame = prepareDirectOverlayFrame(
        projectedFrame.view,
        services.observerService.getObserver(),
        projectedFrame.projectedObjects,
        latest.scenePacket,
        latest.selectedObjectId,
        latest.aidVisibility,
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

      runtime.visibleLabelIds = overlayState.visibleLabelIds
      runtime.trajectoryObjectId = overlayState.trajectoryObjectId
      cadenceState.lastSyncAtMs = nowMs
      cadenceState.lastPropsVersion = propsVersion
      cadenceState.lastSelectedObjectId = latest.selectedObjectId
      cadenceState.lastAidSignature = aidSignature
      cadenceState.lastGuidedSignature = guidedSignature
      cadenceState.lastSunPhaseLabel = latest.sunState.phaseLabel
      cadenceState.lastCenterAltTenths = centerAltTenths
      cadenceState.lastCenterAzTenths = centerAzTenths
      cadenceState.lastFovTenths = fovTenths
      cadenceState.lastViewportWidth = projectedFrame.width
      cadenceState.lastViewportHeight = projectedFrame.height
    },
  }
}
