import type { SkyModule } from '../SkyModule'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import {
  collectProjectedNonStarObjects,
  mergeProjectedSceneObjects,
  type RuntimeProjectedSceneFrame,
} from './runtimeFrame'

function syncDirectObjectLayer(
  runtime: SceneRuntimeRefs,
  services: SkySceneRuntimeServices,
  projectedFrame: RuntimeProjectedSceneFrame,
  latest: ScenePropsSnapshot,
) {
  runtime.directObjectLayer.sync(
    runtime.projectedGenericObjects,
    projectedFrame.width,
    projectedFrame.height,
    latest.sunState,
    latest.selectedObjectId,
    services.clockService.getAnimationTimeSeconds(),
  )
}

function partitionProjectedObjects(projectedObjects: RuntimeProjectedSceneFrame['projectedObjects']) {
  const projectedPlanetObjects: RuntimeProjectedSceneFrame['projectedObjects'][number][] = []
  const projectedDsoObjects: RuntimeProjectedSceneFrame['projectedObjects'][number][] = []
  const projectedGenericObjects: RuntimeProjectedSceneFrame['projectedObjects'][number][] = []

  for (let index = 0; index < projectedObjects.length; index += 1) {
    const entry = projectedObjects[index]

    if (entry.object.type === 'planet') {
      projectedPlanetObjects.push(entry)
      continue
    }

    if (entry.object.type === 'deep_sky') {
      projectedDsoObjects.push(entry)
      continue
    }

    projectedGenericObjects.push(entry)
  }

  return {
    projectedPlanetObjects,
    projectedDsoObjects,
    projectedGenericObjects,
  }
}

export function createObjectRuntimeModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-object-runtime-module',
    renderOrder: 30,
    update({ runtime, services, getProps }) {
      const latest = getProps()
      const projectedStarsFrame = runtime.projectedStarsFrame

      if (!projectedStarsFrame) {
        runtime.projectedSceneFrame = null
        runtime.projectedNonStarObjects = []
        runtime.projectedPlanetObjects = []
        runtime.projectedDsoObjects = []
        runtime.projectedGenericObjects = []
        runtime.projectedPickSourceRef = null
        return
      }

      const nonStarProjectionStartMs = performance.now()
      const nonStarProjection = collectProjectedNonStarObjects(
        projectedStarsFrame.view,
        latest.objects,
        latest.sunState,
        latest.selectedObjectId,
      )
      const nonStarProjectionElapsedMs = performance.now() - nonStarProjectionStartMs
      const projectedObjects = nonStarProjection.projectedObjects
      const { projectedPlanetObjects, projectedDsoObjects, projectedGenericObjects } = partitionProjectedObjects(projectedObjects)
      runtime.projectedNonStarObjects = projectedObjects
      runtime.projectedPlanetObjects = projectedPlanetObjects
      runtime.projectedDsoObjects = projectedDsoObjects
      runtime.projectedGenericObjects = projectedGenericObjects
      const mergeStartMs = performance.now()
      const mergedProjectedObjects = mergeProjectedSceneObjects(projectedStarsFrame.projectedStars, projectedObjects)
      const mergeElapsedMs = performance.now() - mergeStartMs

      runtime.projectedSceneFrame = {
        width: projectedStarsFrame.width,
        height: projectedStarsFrame.height,
        currentFovDegrees: projectedStarsFrame.currentFovDegrees,
        lod: projectedStarsFrame.lod,
        view: projectedStarsFrame.view,
        projectedObjects: mergedProjectedObjects,
        limitingMagnitude: projectedStarsFrame.limitingMagnitude,
        sceneTimestampIso: projectedStarsFrame.sceneTimestampIso,
      }
      runtime.runtimePerfTelemetry.latest = {
        ...runtime.runtimePerfTelemetry.latest,
        stepMs: {
          ...runtime.runtimePerfTelemetry.latest.stepMs,
          collectProjectedNonStarObjectsMs: nonStarProjectionElapsedMs,
          collectProjectedNonStarObjectsTransformMs: nonStarProjection.timing.transformMs,
          collectProjectedNonStarObjectsFilteringMs: nonStarProjection.timing.filteringMs,
          collectProjectedNonStarObjectsAllocationMs: nonStarProjection.timing.allocationMs,
          mergeProjectedSceneObjectsMs: mergeElapsedMs,
        },
        objectCount: mergedProjectedObjects.length,
      }
    },
    render({ runtime, services, getProps }) {
      const latest = getProps()
      const projectedFrame = runtime.projectedSceneFrame

      if (!projectedFrame) {
        return
      }

      const syncStartMs = performance.now()
      syncDirectObjectLayer(runtime, services, projectedFrame, latest)
      const syncElapsedMs = performance.now() - syncStartMs
      let pickBuildElapsedMs = 0
      if (runtime.projectedPickSourceRef !== projectedFrame.projectedObjects) {
        const pickBuildStartMs = performance.now()
        const picks = runtime.projectedPickEntries
        const projectedObjects = projectedFrame.projectedObjects
        if (picks.length > projectedObjects.length) {
          picks.length = projectedObjects.length
        }
        for (let index = 0; index < projectedObjects.length; index += 1) {
          const entry = projectedObjects[index]
          if (picks[index]) {
            picks[index].object = entry.object
            picks[index].screenX = entry.screenX
            picks[index].screenY = entry.screenY
            picks[index].radiusPx = entry.pickRadiusPx
            picks[index].depth = entry.depth
          } else {
            picks[index] = {
              object: entry.object,
              screenX: entry.screenX,
              screenY: entry.screenY,
              radiusPx: entry.pickRadiusPx,
              depth: entry.depth,
            }
          }
        }
        runtime.projectedPickSourceRef = projectedObjects
        pickBuildElapsedMs = performance.now() - pickBuildStartMs
      }
      const objectRuntimeTotalMs = (runtime.runtimePerfTelemetry.latest.stepMs.collectProjectedNonStarObjectsMs ?? 0) +
        (runtime.runtimePerfTelemetry.latest.stepMs.mergeProjectedSceneObjectsMs ?? 0) +
        syncElapsedMs +
        pickBuildElapsedMs
      runtime.runtimePerfTelemetry.latest = {
        ...runtime.runtimePerfTelemetry.latest,
        stepMs: {
          ...runtime.runtimePerfTelemetry.latest.stepMs,
          objectLayerSyncMs: syncElapsedMs,
          projectedPickEntriesBuildMs: pickBuildElapsedMs,
          objectRuntimeTotalMs,
        },
      }
    },
  }
}
