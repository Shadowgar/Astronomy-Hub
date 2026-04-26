import type { SkyModule } from '../SkyModule'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import { stellariumFrameAstrometryFromEraAstrom } from '../erfaAbLdsun'
import { resolveStarsRenderLimitMagnitude } from '../stellariumPainterLimits'
import {
  collectProjectedStars,
  ensureSceneSurfaces,
  resolveViewTier,
} from './runtimeFrame'
import { evaluateStarsProjectionReuseDecision } from '../../adapters/framePacingDecisions'

export interface StarsProjectionCacheEntry {
  readonly sceneTimestampMs: number
  readonly width: number
  readonly height: number
  readonly objectSignature: string
  readonly centerDirection: { x: number; y: number; z: number }
  readonly fovDegrees: number
  readonly limitingMagnitude: number
  readonly projectedStars: ReturnType<typeof collectProjectedStars>['projectedStars']
}

export interface StarsProjectionReuseDecision {
  readonly centerDeltaRad: number
  readonly fovDeltaDeg: number
  readonly limitingMagnitudeDelta: number
  readonly sceneTimestampDeltaMs: number
  readonly isSceneTimestampReusable: boolean
  readonly isProjectionCacheReusable: boolean
  readonly shouldReuseProjection: boolean
}

function q(value: number) {
  if (!Number.isFinite(value)) {
    return 'nan'
  }
  return value.toFixed(3)
}

export function buildScenePacketSignature(scenePacket: ScenePropsSnapshot['scenePacket']) {
  if (!scenePacket) {
    return 'packet:none'
  }

  const stars = scenePacket.stars
  const firstStar = stars[0]
  const lastStar = stars[stars.length - 1]
  const diagnostics = scenePacket.diagnostics
  return [
    `packet:${stars.length}`,
    `s0:${firstStar?.id ?? 'none'}:${q(firstStar?.mag ?? Number.NaN)}`,
    `s1:${lastStar?.id ?? 'none'}:${q(lastStar?.mag ?? Number.NaN)}`,
    `lim:${q(diagnostics.limitingMagnitude)}`,
    `visible:${diagnostics.visibleStars}`,
    `tiles:${diagnostics.activeTiles}:${diagnostics.maxTileDepthReached}`,
  ].join('|')
}

function buildProjectionSignature(props: ScenePropsSnapshot) {
  const firstObject = props.objects[0]?.id ?? 'none'
  const lastObject = props.objects[props.objects.length - 1]?.id ?? 'none'
  return [
    `obj:${props.objects.length}:${firstObject}:${lastObject}`,
    buildScenePacketSignature(props.scenePacket),
  ].join('::')
}

export function evaluateStarsProjectionReuse(params: {
  previousProjectionCache: StarsProjectionCacheEntry | null
  next: {
    objectSignature: string
    width: number
    height: number
    centerDirection: { x: number; y: number; z: number }
    fovDegrees: number
    limitingMagnitude: number
    sceneTimestampMs: number
  }
  starsProjectionReuseStreak: number
}): StarsProjectionReuseDecision {
  const decision = evaluateStarsProjectionReuseDecision({
    previousProjectionCache: params.previousProjectionCache,
    next: params.next,
    starsProjectionReuseStreak: params.starsProjectionReuseStreak,
  })

  return {
    centerDeltaRad: decision.centerDeltaRad,
    fovDeltaDeg: decision.fovDeltaDeg,
    limitingMagnitudeDelta: decision.limitingMagnitudeDelta,
    sceneTimestampDeltaMs: decision.sceneTimestampDeltaMs,
    isSceneTimestampReusable: decision.isSceneTimestampReusable,
    isProjectionCacheReusable: decision.isProjectionCacheReusable,
    shouldReuseProjection: decision.shouldReuseProjection,
  }
}

function emitStarsDrawIntent(params: {
  painter: NonNullable<Parameters<NonNullable<ReturnType<typeof createStarsModule>['render']>>[0]['frameState']>['render']['painter']
  props: ScenePropsSnapshot
  projectedStarsFrame: NonNullable<SceneRuntimeRefs['projectedStarsFrame']>
}) {
  let minRenderedMagnitude = Number.POSITIVE_INFINITY
  let maxRenderedMagnitude = Number.NEGATIVE_INFINITY
  let minRenderAlpha = Number.POSITIVE_INFINITY
  let maxRenderAlpha = Number.NEGATIVE_INFINITY
  for (const entry of params.projectedStarsFrame.projectedStars) {
    const magnitude = entry.renderedMagnitude ?? entry.object.magnitude
    if (Number.isFinite(magnitude)) {
      minRenderedMagnitude = Math.min(minRenderedMagnitude, magnitude)
      maxRenderedMagnitude = Math.max(maxRenderedMagnitude, magnitude)
    }
    if (Number.isFinite(entry.renderAlpha)) {
      minRenderAlpha = Math.min(minRenderAlpha, entry.renderAlpha)
      maxRenderAlpha = Math.max(maxRenderAlpha, entry.renderAlpha)
    }
  }

  params.painter.paint_stars_draw_intent({
    fromDirectStarPath: true,
    starCount: params.projectedStarsFrame.projectedStars.length,
    source: {
      dataMode: params.props.scenePacket?.diagnostics.dataMode ?? null,
      sourceLabel: params.props.scenePacket?.diagnostics.sourceLabel ?? null,
      scenePacketStarCount: params.props.scenePacket?.stars.length ?? 0,
      scenePacketTileCount: params.props.scenePacket?.starTiles.length ?? 0,
      diagnosticsActiveTiles: params.props.scenePacket?.diagnostics.activeTiles ?? null,
      diagnosticsVisibleTileIdsCount: params.props.scenePacket?.diagnostics.visibleTileIds.length ?? null,
      diagnosticsStarsListVisitCount: params.props.scenePacket?.diagnostics.starsListVisitCount ?? null,
    },
    magnitude: {
      limitingMagnitude: params.projectedStarsFrame.limitingMagnitude,
      minRenderedMagnitude: Number.isFinite(minRenderedMagnitude) ? minRenderedMagnitude : null,
      maxRenderedMagnitude: Number.isFinite(maxRenderedMagnitude) ? maxRenderedMagnitude : null,
      minRenderAlpha: Number.isFinite(minRenderAlpha) ? minRenderAlpha : null,
      maxRenderAlpha: Number.isFinite(maxRenderAlpha) ? maxRenderAlpha : null,
    },
    view: {
      projectionMode: params.props.projectionMode ?? null,
      fovDegrees: params.projectedStarsFrame.currentFovDegrees,
      viewportWidth: params.projectedStarsFrame.width,
      viewportHeight: params.projectedStarsFrame.height,
      centerDirection: {
        x: params.projectedStarsFrame.view.centerDirection.x,
        y: params.projectedStarsFrame.view.centerDirection.y,
        z: params.projectedStarsFrame.view.centerDirection.z,
      },
      sceneTimestampIso: params.projectedStarsFrame.sceneTimestampIso ?? null,
    },
  })
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
      const limitingMagnitude = resolveStarsRenderLimitMagnitude(
        brightnessExposureState.limitingMagnitude,
        runtime.corePainterLimits,
      )
      const starsExposureState = limitingMagnitude === brightnessExposureState.limitingMagnitude
        ? brightnessExposureState
        : {
          ...brightnessExposureState,
          limitingMagnitude,
        }
      const centerDirection = view.centerDirection
      const objectSignature = buildProjectionSignature(latest)
      const sceneTimestampMs = sceneTimestampIso ? Date.parse(sceneTimestampIso) : Number.NaN
      const previousProjectionCache = runtime.starsProjectionCache
      const reuseDecision = evaluateStarsProjectionReuse({
        previousProjectionCache,
        next: {
          objectSignature,
          width,
          height,
          centerDirection: {
            x: centerDirection.x,
            y: centerDirection.y,
            z: centerDirection.z,
          },
          fovDegrees: currentFovDegrees,
          limitingMagnitude,
          sceneTimestampMs,
        },
        starsProjectionReuseStreak: runtime.starsProjectionReuseStreak,
      })
      const shouldReuseProjection = reuseDecision.shouldReuseProjection
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
          corePainterLimits: runtime.corePainterLimits,
          observerAstrometry: runtime.observerAstrometry
            ? {
                localSiderealTimeDeg: runtime.observerAstrometry.localSiderealTimeDeg,
                refraction: runtime.observerAstrometry.refraction,
                polarMotion: runtime.observerAstrometry.polarMotion,
                observerSeam: runtime.observerAstrometry.observerSeam,
                stellariumAstrom: stellariumFrameAstrometryFromEraAstrom(runtime.observerAstrometry.astrom),
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
          starsProjectionCenterDeltaRad: reuseDecision.centerDeltaRad,
          starsProjectionFovDeltaDeg: reuseDecision.fovDeltaDeg,
          starsProjectionLimitingMagDelta: reuseDecision.limitingMagnitudeDelta,
          starsProjectionTimestampDeltaMs: reuseDecision.sceneTimestampDeltaMs,
          collectProjectedStarsTransformMs: projectionTransformMs,
          collectProjectedStarsMagnitudeFilterMs: projectionMagnitudeFilterMs,
          collectProjectedStarsVisibilityFilterMs: projectionVisibilityFilterMs,
          collectProjectedStarsSortingMs: projectionSortingMs,
          collectProjectedStarsAllocationMs: projectionAllocationMs,
        },
        starCount: projectedStars.length,
      }
    },
    render({ runtime, services, getProps, frameState }) {
      const projectedStarsFrame = runtime.projectedStarsFrame
      const props = getProps()
      const painter = frameState?.render.painter

      if (!projectedStarsFrame) {
        runtime.directStarLayer.sync([], 0, 0, null, services.clockService.getAnimationTimeSeconds())
        runtime.runtimePerfTelemetry.latest = {
          ...runtime.runtimePerfTelemetry.latest,
          stepMs: {
            ...runtime.runtimePerfTelemetry.latest.stepMs,
            starLayerSyncCallCount: 1,
            starLayerSyncCount: 0,
          },
        }
        return
      }

      if (painter) {
        emitStarsDrawIntent({
          painter,
          props,
          projectedStarsFrame,
        })
      }

      const syncMetrics = runtime.directStarLayer.sync(
        projectedStarsFrame.projectedStars,
        projectedStarsFrame.width,
        projectedStarsFrame.height,
        props.selectedObjectId,
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
          starLayerSyncCallCount: 1,
          starLayerSyncCount: projectedStarsFrame.projectedStars.length,
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
