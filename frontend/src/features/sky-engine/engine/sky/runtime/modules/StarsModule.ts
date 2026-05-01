import type { SkyModule } from '../SkyModule'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import { stellariumFrameAstrometryFromEraAstrom } from '../erfaAbLdsun'
import { resolveStarsRenderLimitMagnitude } from '../stellariumPainterLimits'
import {
  collectProjectedStars,
  ensureSceneSurfaces,
  resolveViewTier,
} from './runtimeFrame'
import { createStarsPointRenderItemFromProjectedStars } from '../../renderer/adapters/starsPointItemsAdapter'
import { evaluateStarsProjectionReuseDecision } from '../../adapters/framePacingDecisions'
/**
 * Temporary usability-only tuning: not a Stellarium parity claim.
 * Keep bounded by `hardLimitMag` and scoped to Hipparcos mode only.
 */
const HIPPARCOS_USABILITY_LIMITING_MAG_DELTA = 0.3
const DEBUG_STARS_VISIBLE_LIMITING_MAG_FLOOR = 5.8

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

function getLastEntry<T>(entries: readonly T[]): T | undefined {
  const entriesWithAt = entries as unknown as { at: (index: number) => T | undefined }
  return entriesWithAt.at(-1)
}

export function buildScenePacketSignature(scenePacket: ScenePropsSnapshot['scenePacket']) {
  if (!scenePacket) {
    return 'packet:none'
  }

  const stars = scenePacket.stars
  const firstStar = stars[0]
  const lastStar = getLastEntry(stars)
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
  const lastObject = getLastEntry(props.objects)?.id ?? 'none'
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

function parseHexChannel(hex: string): number {
  const parsed = Number.parseInt(hex, 16)
  if (!Number.isFinite(parsed)) {
    return 255
  }
  return Math.max(0, Math.min(255, parsed))
}

function resolveHexRgb(hexColor: string | undefined): [number, number, number] {
  if (!hexColor) {
    return [255, 255, 255]
  }

  const normalized = hexColor.trim().replace(/^#/, '')
  if (normalized.length === 6) {
    return [
      parseHexChannel(normalized.slice(0, 2)),
      parseHexChannel(normalized.slice(2, 4)),
      parseHexChannel(normalized.slice(4, 6)),
    ]
  }

  if (normalized.length === 3) {
    return [
      parseHexChannel(`${normalized[0]}${normalized[0]}`),
      parseHexChannel(`${normalized[1]}${normalized[1]}`),
      parseHexChannel(`${normalized[2]}${normalized[2]}`),
    ]
  }

  return [255, 255, 255]
}

function emitStarsPointItems(params: {
  painter: NonNullable<Parameters<NonNullable<ReturnType<typeof createStarsModule>['render']>>[0]['frameState']>['render']['painter']
  projectedStarsFrame: NonNullable<SceneRuntimeRefs['projectedStarsFrame']>
}) {
  const stars = params.projectedStarsFrame.projectedStars
  const points = new Array(stars.length)
  for (let index = 0; index < stars.length; index += 1) {
    const entry = stars[index]
    const [red, green, blue] = resolveHexRgb(entry.starProfile?.colorHex)
    const alpha = Math.max(0, Math.min(255, Math.round((entry.renderAlpha ?? 1) * 255)))
    points[index] = {
      pos: [entry.screenX, entry.screenY] as [number, number],
      size: entry.markerRadiusPx,
      color: [red, green, blue, alpha] as [number, number, number, number],
    }
  }

  params.painter.paint_2d_points(points.length, points)
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
      const starsExposureLimitMagnitude = brightnessExposureState.limitingMagnitude
      const sourceShapedStarsLimitMagnitude = resolveStarsRenderLimitMagnitude(
        brightnessExposureState.limitingMagnitude,
        runtime.corePainterLimits,
      )
      const sceneDataMode = latest.scenePacket?.diagnostics?.dataMode ?? 'loading'
      const usabilityAdjustedStarsLimitMagnitude = sceneDataMode === 'hipparcos'
        ? Math.min(
            sourceShapedStarsLimitMagnitude + HIPPARCOS_USABILITY_LIMITING_MAG_DELTA,
            runtime.corePainterLimits?.hardLimitMag ?? Number.POSITIVE_INFINITY,
          )
        : sourceShapedStarsLimitMagnitude
      const debugStarsVisibleOverrideEnabled = latest.debugVisualConfig?.starsVisibleOverrideEnabled ?? false
      const debugAdjustedStarsLimitMagnitude = debugStarsVisibleOverrideEnabled
        ? Math.min(
            Math.max(usabilityAdjustedStarsLimitMagnitude, DEBUG_STARS_VISIBLE_LIMITING_MAG_FLOOR),
            runtime.corePainterLimits?.hardLimitMag ?? Number.POSITIVE_INFINITY,
          )
        : usabilityAdjustedStarsLimitMagnitude
      const starsExposureState = debugAdjustedStarsLimitMagnitude === starsExposureLimitMagnitude
        ? brightnessExposureState
        : {
          ...brightnessExposureState,
          limitingMagnitude: debugAdjustedStarsLimitMagnitude,
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
          limitingMagnitude: debugAdjustedStarsLimitMagnitude,
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
          resolvedStarsLimitMagnitude: debugAdjustedStarsLimitMagnitude,
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
          limitingMagnitude: debugAdjustedStarsLimitMagnitude,
          projectedStars,
        }
        runtime.starsProjectionReuseStreak = 0
      }

      if (
        projectedStars.length === 0 &&
        (sceneDataMode === 'loading' || latest.scenePacket == null) &&
        previousProjectionCache?.projectedStars?.length
      ) {
        projectedStars = previousProjectionCache.projectedStars
      }

      runtime.projectedStarsFrame = {
        width,
        height,
        currentFovDegrees,
        lod: resolveViewTier(currentFovDegrees),
        view,
        projectedStars,
        limitingMagnitude: debugAdjustedStarsLimitMagnitude,
        sceneTimestampIso,
      }
      runtime.runtimePerfTelemetry.latest = {
        ...runtime.runtimePerfTelemetry.latest,
        stepMs: {
          ...runtime.runtimePerfTelemetry.latest.stepMs,
          starsExposureLimitMag: starsExposureLimitMagnitude,
          starsSourceShapedLimitMag: sourceShapedStarsLimitMagnitude,
          starsUsabilityAdjustedLimitMag: usabilityAdjustedStarsLimitMagnitude,
          starsDebugVisibleOverrideEnabled: debugStarsVisibleOverrideEnabled ? 1 : 0,
          starsDebugAdjustedLimitMag: debugAdjustedStarsLimitMagnitude,
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
        runtime.rendererBoundaryStarsPointItem = null
        runtime.directStarLayer.sync([], 0, 0, null, services.clockService.getAnimationTimeSeconds())
        runtime.runtimePerfTelemetry.latest = {
          ...runtime.runtimePerfTelemetry.latest,
          stepMs: {
            ...runtime.runtimePerfTelemetry.latest.stepMs,
            starLayerSyncCallCount: 1,
            starLayerSyncCount: 0,
            rendererBoundaryStarsPointItemCount: 0,
          },
        }
        return
      }

      runtime.rendererBoundaryStarsPointItem = createStarsPointRenderItemFromProjectedStars({
        projectedStars: projectedStarsFrame.projectedStars,
      })

      if (painter) {
        emitStarsDrawIntent({
          painter,
          props,
          projectedStarsFrame,
        })
        emitStarsPointItems({
          painter,
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
          rendererBoundaryStarsPointItemCount: runtime.rendererBoundaryStarsPointItem.pointCount,
        },
      }
    },
  }
}
