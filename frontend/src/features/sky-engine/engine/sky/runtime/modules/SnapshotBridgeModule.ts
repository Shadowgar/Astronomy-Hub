import type { SkyModule } from '../SkyModule'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import type { SkyEngineSnapshotStore, SkyEngineRuntimeSnapshot } from '../../../../SkyEngineSnapshotStore'

function resolveVisibilityState() {
  if (typeof document === 'undefined') {
    return 'unknown' as const
  }

  return document.visibilityState
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function resolveCameraSnapshot(services: SkySceneRuntimeServices) {
  const centerDirection = services.navigationService.getCenterDirection()

  return {
    centerAltDeg: Number(((Math.asin(clamp(centerDirection.y, -1, 1)) * 180) / Math.PI).toFixed(1)),
    centerAzDeg: Number(((((Math.atan2(centerDirection.x, centerDirection.z) * 180) / Math.PI) + 360) % 360).toFixed(1)),
    fovDegrees: Number(services.projectionService.getCurrentFovDegrees().toFixed(1)),
  }
}

export function createSnapshotBridgeModule(
  snapshotStore: SkyEngineSnapshotStore,
  cadenceMs = 150,
): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  let lastPublishAtMs = 0

  return {
    id: 'sky-snapshot-bridge-runtime-module',
    renderOrder: 95,
    update({ runtime, services, getProps }) {
      const nowMs = performance.now()

      if (lastPublishAtMs !== 0 && nowMs - lastPublishAtMs < cadenceMs) {
        return
      }

      lastPublishAtMs = nowMs
      const latest = getProps()
      const projectedFrame = runtime.projectedSceneFrame
      const selectedObject = latest.objects.find((object) => object.id === latest.selectedObjectId) ?? null
      const moonObject = latest.objects.find((object) => object.type === 'moon') ?? null
      const snapshot: SkyEngineRuntimeSnapshot = {
        timestampIso: services.clockService.getSceneTimestampIso() ?? latest.initialSceneTimestampIso,
        camera: resolveCameraSnapshot(services),
        selection: {
          object: selectedObject,
          status: selectedObject ? 'active' : latest.selectedObjectId ? 'hidden' : 'idle',
          hiddenName: selectedObject ? null : latest.hiddenSelectionName,
        },
        summary: {
          phaseLabel: latest.sunState.phaseLabel,
          visibleObjectCount: latest.objects.length,
          guidedObjectCount: latest.guidedObjectIds.length,
          visibleLabelCount: runtime.visibleLabelIds.length,
          backendStarCount: latest.backendStars.length,
          renderedStarCount: runtime.projectedStarsFrame?.projectedStars.length ?? 0,
          lodTier: projectedFrame?.lod.tier ?? 'wide',
          labelCap: projectedFrame?.lod.labelCap ?? 0,
          dataMode: latest.scenePacket?.diagnostics?.dataMode ?? 'loading',
          sourceLabel: latest.scenePacket?.diagnostics?.sourceLabel ?? 'Loading tiles…',
          fallbackActive: Boolean(latest.scenePacket?.diagnostics?.sourceError),
          sceneOffsetSeconds: services.clockService.getSceneOffsetSeconds(),
          playbackRate: services.clockService.getPlaybackRate(),
          moonPhaseLabel: moonObject?.phaseLabel ?? null,
          moonAboveHorizon: moonObject?.isAboveHorizon ?? false,
        },
      }

      snapshotStore.publish(snapshot, {
        force: true,
        sourceAtMs: nowMs,
        visibilityState: resolveVisibilityState(),
      })
    },
    dispose() {
      lastPublishAtMs = 0
      snapshotStore.reset()
    },
  }
}