import { Vector3 } from '@babylonjs/core/Maths/math.vector'

import { resolveSkyLodState } from '../../../../skyLod'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import type { SkyModule } from '../SkyModule'

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function toViewportPlanePosition(
  screenX: number,
  screenY: number,
  depth: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  return new Vector3(
    screenX - viewportWidth * 0.5,
    viewportHeight * 0.5 - screenY,
    clamp(depth * 0.01, 0, 0.01),
  )
}

export function createPointerRuntimeModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-pointer-runtime-module',
    renderOrder: 102,
    render({ runtime, services, getProps }) {
      const projectedFrame = runtime.projectedSceneFrame
      const selectedObjectId = getProps().selectedObjectId
      if (!projectedFrame || !selectedObjectId) {
        runtime.directPointerLayer.sync(null, null, '#ffffff', resolveSkyLodState((60 * Math.PI) / 180), 0)
        return
      }

      const selectedEntry = projectedFrame.projectedObjects.find((entry) => entry.object.id === selectedObjectId) ?? null
      if (!selectedEntry) {
        runtime.directPointerLayer.sync(null, null, '#ffffff', resolveSkyLodState((60 * Math.PI) / 180), 0)
        return
      }

      runtime.directPointerLayer.sync(
        toViewportPlanePosition(
          selectedEntry.screenX,
          selectedEntry.screenY,
          selectedEntry.depth,
          projectedFrame.width,
          projectedFrame.height,
        ),
        null,
        selectedEntry.object.colorHex,
        resolveSkyLodState((projectedFrame.currentFovDegrees * Math.PI) / 180),
        services.clockService.getAnimationTimeSeconds(),
      )
    },
    dispose({ runtime }) {
      runtime.directPointerLayer.dispose()
    },
  }
}
