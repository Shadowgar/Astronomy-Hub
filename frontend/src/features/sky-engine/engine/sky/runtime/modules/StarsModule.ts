import type { SkyModule } from '../SkyModule'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import {
  collectProjectedStars,
  ensureSceneSurfaces,
  resolveViewTier,
} from './runtimeFrame'

const CENTER_REPROJECT_THRESHOLD_RAD = 0.002
const FOV_REPROJECT_THRESHOLD_DEG = 0.2
const LIMIT_MAG_REPROJECT_THRESHOLD = 0.02
const MAX_PROJECTION_REUSE_STREAK = 2
const SCENE_TIMESTAMP_REPROJECT_THRESHOLD_MS = 250

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function getAngularDeltaRadians(
  left: { x: number; y: number; z: number },
  right: { x: number; y: number; z: number },
) {
  const dot = left.x * right.x + left.y * right.y + left.z * right.z
  return Math.acos(clamp(dot, -1, 1))
}

function buildObjectSignature(props: ScenePropsSnapshot) {
  const firstObject = props.objects[0]?.id ?? 'none'
  const lastObject = props.objects[props.objects.length - 1]?.id ?? 'none'
  const packetStarsCount = props.scenePacket?.stars?.length ?? 0
  return `${props.objects.length}:${firstObject}:${lastObject}:${packetStarsCount}`
}

function resolveStellariumStarLimitMagnitude(runtime: SceneRuntimeRefs, exposureLimitMagnitude: number) {
  const painterLimits = runtime.corePainterLimits
  if (!painterLimits) {
    return exposureLimitMagnitude
  }

  return Math.min(
    exposureLimitMagnitude,
    painterLimits.starsLimitMag,
    painterLimits.hardLimitMag,
  )
}

export function createStarsModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-stars-runtime-module',
    renderOrder: 20,
    update({ runtime, services, getProps }) {
      const latest = getProps()
      const brightnessExposureState = runtime.brightnessExposureState
      const { width, height } = ensureSceneSurfaces(runtime)

      services.projectionService.syncViewport(width, height)
      const view = services.projectionService.createView(
        services.navigationService.getCenterDirection(),
      )
      const currentFovDegrees = services.projectionService.getCurrentFovDegrees()
      const sceneTimestampIso = services.clockService.getSceneTimestampIso()
      if (!brightnessExposureState) {
        return
      }
      const limitingMagnitude = resolveStellariumStarLimitMagnitude(
        runtime,
        brightnessExposureState.limitingMagnitude,
      )
      const starsExposureState = limitingMagnitude === brightnessExposureState.limitingMagnitude
        ? brightnessExposureState
        : {
          ...brightnessExposureState,
          limitingMagnitude,
        }
      const centerDirection = view.centerDirection
      const objectSignature = buildObjectSignature(latest)
      const sceneTimestampMs = sceneTimestampIso ? Date.parse(sceneTimestampIso) : Number.NaN
      const previousProjectionCache = runtime.starsProjectionCache
      const centerDeltaRad = previousProjectionCache
        ? getAngularDeltaRadians(previousProjectionCache.centerDirection, centerDirection)
        : Number.POSITIVE_INFINITY
      const fovDeltaDeg = previousProjectionCache
        ? Math.abs(previousProjectionCache.fovDegrees - currentFovDegrees)
        : Number.POSITIVE_INFINITY
      const limitingMagnitudeDelta = previousProjectionCache
        ? Math.abs(previousProjectionCache.limitingMagnitude - limitingMagnitude)
        : Number.POSITIVE_INFINITY
      const sceneTimestampDeltaMs = previousProjectionCache
        ? Math.abs(previousProjectionCache.sceneTimestampMs - sceneTimestampMs)
        : Number.POSITIVE_INFINITY
      const isSceneTimestampReusable = !Number.isFinite(sceneTimestampDeltaMs) || sceneTimestampDeltaMs <= SCENE_TIMESTAMP_REPROJECT_THRESHOLD_MS
      const isProjectionCacheReusable = Boolean(
        previousProjectionCache &&
        previousProjectionCache.objectSignature === objectSignature &&
        isSceneTimestampReusable &&
        previousProjectionCache.width === width &&
        previousProjectionCache.height === height &&
        fovDeltaDeg <= FOV_REPROJECT_THRESHOLD_DEG &&
        limitingMagnitudeDelta <= LIMIT_MAG_REPROJECT_THRESHOLD &&
        centerDeltaRad <= CENTER_REPROJECT_THRESHOLD_RAD,
      )
      const shouldReuseProjection = isProjectionCacheReusable && runtime.starsProjectionReuseStreak < MAX_PROJECTION_REUSE_STREAK
      let projectedStars = previousProjectionCache?.projectedStars ?? []
      let projectionElapsedMs = 0
      let projectionTransformMs = 0
      let projectionMagnitudeFilterMs = 0
      let projectionVisibilityFilterMs = 0
      let projectionSortingMs = 0
      let projectionAllocationMs = 0

      if (shouldReuseProjection) {
        runtime.starsProjectionReuseStreak += 1
      } else {
        const projectionStartMs = performance.now()
        const projectionResult = collectProjectedStars({
          view,
          objects: latest.objects,
          scenePacket: latest.scenePacket,
          sunState: latest.sunState,
          brightnessExposureState: starsExposureState,
          observerAstrometry: runtime.observerAstrometry
            ? {
                localSiderealTimeDeg: runtime.observerAstrometry.localSiderealTimeDeg,
                refraction: runtime.observerAstrometry.refraction,
                matrices: {
                  ri2h: runtime.observerAstrometry.matrices.ri2h,
                  rh2i: runtime.observerAstrometry.matrices.rh2i,
                  icrsToHorizontal: runtime.observerAstrometry.matrices.icrsToHorizontal,
                  horizontalToIcrs: runtime.observerAstrometry.matrices.horizontalToIcrs,
                },
              }
            : undefined,
        })
        projectionElapsedMs = performance.now() - projectionStartMs
        projectedStars = projectionResult.projectedStars
        projectionTransformMs = projectionResult.timing.transformMs
        projectionMagnitudeFilterMs = projectionResult.timing.magnitudeFilterMs
        projectionVisibilityFilterMs = projectionResult.timing.visibilityFilterMs
        projectionSortingMs = projectionResult.timing.sortingMs
        projectionAllocationMs = projectionResult.timing.allocationMs
        runtime.starsProjectionCache = {
          sceneTimestampMs,
          width,
          height,
          objectSignature,
          centerDirection: {
            x: centerDirection.x,
            y: centerDirection.y,
            z: centerDirection.z,
          },
          fovDegrees: currentFovDegrees,
          limitingMagnitude,
          projectedStars,
        }
        runtime.starsProjectionReuseStreak = 0
      }

      runtime.projectedStarsFrame = {
        width,
        height,
        currentFovDegrees,
        lod: resolveViewTier(currentFovDegrees),
        view,
        projectedStars,
        limitingMagnitude,
        sceneTimestampIso,
      }
      runtime.runtimePerfTelemetry.latest = {
        ...runtime.runtimePerfTelemetry.latest,
        stepMs: {
          ...runtime.runtimePerfTelemetry.latest.stepMs,
          starsExposureLimitMag: brightnessExposureState.limitingMagnitude,
          starsPainterLimitMag: runtime.corePainterLimits?.starsLimitMag ?? Number.NaN,
          collectProjectedStarsMs: projectionElapsedMs,
          starsProjectionReused: shouldReuseProjection ? 1 : 0,
          starsProjectionCenterDeltaRad: centerDeltaRad,
          starsProjectionFovDeltaDeg: fovDeltaDeg,
          starsProjectionLimitingMagDelta: limitingMagnitudeDelta,
          starsProjectionTimestampDeltaMs: sceneTimestampDeltaMs,
          collectProjectedStarsTransformMs: projectionTransformMs,
          collectProjectedStarsMagnitudeFilterMs: projectionMagnitudeFilterMs,
          collectProjectedStarsVisibilityFilterMs: projectionVisibilityFilterMs,
          collectProjectedStarsSortingMs: projectionSortingMs,
          collectProjectedStarsAllocationMs: projectionAllocationMs,
        },
        starCount: projectedStars.length,
      }
    },
    render({ runtime, services, getProps }) {
      const projectedStarsFrame = runtime.projectedStarsFrame

      if (!projectedStarsFrame) {
        runtime.directStarLayer.sync([], 0, 0, null, services.clockService.getAnimationTimeSeconds())
        return
      }

      const syncMetrics = runtime.directStarLayer.sync(
        projectedStarsFrame.projectedStars,
        projectedStarsFrame.width,
        projectedStarsFrame.height,
        getProps().selectedObjectId,
        services.clockService.getAnimationTimeSeconds(),
      )
      const resolvedSyncMetrics = syncMetrics ?? {
        totalMs: 0,
        instanceTransformMs: 0,
        bufferUpdateMs: 0,
        gpuUploadMs: 0,
        selectionHighlightMs: 0,
      }
      runtime.runtimePerfTelemetry.latest = {
        ...runtime.runtimePerfTelemetry.latest,
        stepMs: {
          ...runtime.runtimePerfTelemetry.latest.stepMs,
          starLayerSyncMs: resolvedSyncMetrics.totalMs,
          starLayerSyncInstanceTransformMs: resolvedSyncMetrics.instanceTransformMs,
          starLayerSyncBufferUpdateMs: resolvedSyncMetrics.bufferUpdateMs,
          starLayerSyncGpuUploadMs: resolvedSyncMetrics.gpuUploadMs,
          starLayerSyncSelectionHighlightMs: resolvedSyncMetrics.selectionHighlightMs,
        },
      }
    },
  }
}
