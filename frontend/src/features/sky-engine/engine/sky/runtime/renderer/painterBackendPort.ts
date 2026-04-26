import type { SkyPainterFinalizedBatch, SkyPainterStarsBatch } from './painterPort'

export const SKY_ENGINE_ENABLE_PAINTER_BACKEND_EXECUTION = 'SKY_ENGINE_ENABLE_PAINTER_BACKEND_EXECUTION'
export const SKY_ENGINE_ENABLE_PAINTER_BACKEND_EXECUTION_QUERY_PARAM = 'painterBackendExecution'

export type SkyPainterBackendExecutionStatus =
  | 'mapped_not_executed'
  | 'execution_disabled'
  | 'executed_side_by_side'
export type SkyPainterUnsupportedBatchStatus = 'unsupported_not_executed'
export type SkyPainterBackendPath = 'babylon-thin-instance-stars'

export interface SkyPainterUnsupportedBatchInput {
  readonly kind: string
  readonly frameIndex: number
  readonly sourceCommandKind: string
  readonly batch: unknown
}

export type SkyPainterBackendBatchInput = SkyPainterFinalizedBatch | SkyPainterUnsupportedBatchInput

export interface SkyPainterRenderGlReferenceMarker {
  readonly renderHeaderApi: 'render_points_2d' | 'render_points_3d' | 'render_finish'
  readonly renderGlItemType: 'ITEM_POINTS' | 'ITEM_POINTS_3D'
  readonly renderGlBatchingConcept: 'get_item(type, flags, halo, texture)'
  readonly renderGlFlushPhase: 'render_finish'
}

export interface SkyPainterStarsBackendMappingResult {
  readonly kind: 'stars'
  readonly frameIndex: number
  readonly sourceCommandKind: 'paint_stars_draw_intent'
  readonly starCount: number
  readonly grouping: SkyPainterStarsBatch['grouping']
  readonly intendedBackendPath: SkyPainterBackendPath
  readonly executionStatus: SkyPainterBackendExecutionStatus
  readonly renderGlReference: SkyPainterRenderGlReferenceMarker
}

export interface SkyPainterUnsupportedBatchMappingResult {
  readonly kind: 'unsupported'
  readonly frameIndex: number
  readonly sourceBatchKind: string
  readonly sourceCommandKind: string
  readonly status: SkyPainterUnsupportedBatchStatus
  readonly reason: 'unsupported_batch_kind'
}

export interface SkyPainterBackendMappingPlan {
  readonly mappedBatches: ReadonlyArray<SkyPainterStarsBackendMappingResult>
  readonly unsupportedBatches: ReadonlyArray<SkyPainterUnsupportedBatchMappingResult>
  readonly summary: {
    readonly mappedBatchCount: number
    readonly mappedStarsBatchCount: number
    readonly mappedStarsCount: number
    readonly unsupportedBatchCount: number
    readonly executionStatus: SkyPainterBackendExecutionStatus | SkyPainterUnsupportedBatchStatus
  }
}

export interface SkyPainterBackendSideBySideAdapter {
  sync(
    projectedStars: readonly unknown[],
    viewportWidth: number,
    viewportHeight: number,
    selectedObjectId: string | null,
    animationTimeSeconds: number,
  ): unknown
}

export interface SkyPainterBackendProjectedStarsFrameLike {
  readonly projectedStars: readonly unknown[]
  readonly width: number
  readonly height: number
}

export interface SkyPainterStarsBackendExecutionResult {
  readonly kind: 'stars'
  readonly frameIndex: number
  readonly sourceCommandKind: 'paint_stars_draw_intent'
  readonly starCount: number
  readonly grouping: SkyPainterStarsBatch['grouping']
  readonly intendedBackendPath: SkyPainterBackendPath
  readonly executionStatus: SkyPainterBackendExecutionStatus
  readonly renderGlReference: SkyPainterRenderGlReferenceMarker
}

export interface SkyPainterBackendExecutionPlan {
  readonly mappedBatches: ReadonlyArray<SkyPainterStarsBackendExecutionResult>
  readonly unsupportedBatches: ReadonlyArray<SkyPainterUnsupportedBatchMappingResult>
  readonly summary: {
    readonly executionEnabled: boolean
    readonly mappedBatchCount: number
    readonly mappedStarsBatchCount: number
    readonly mappedStarsCount: number
    readonly unsupportedBatchCount: number
    readonly sideBySideExecutionCount: number
    readonly executionDisabledCount: number
    readonly executionStatus: SkyPainterBackendExecutionStatus | SkyPainterUnsupportedBatchStatus
  }
}

function parseBooleanFlag(value: unknown): boolean {
  if (value === true || value === false) {
    return value
  }
  if (typeof value !== 'string') {
    return false
  }
  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'yes'
}

export function resolvePainterBackendExecutionEnabled(params?: {
  readonly envValue?: unknown
  readonly queryString?: string | null
}): boolean {
  const explicitEnvValue = params?.envValue
  if (explicitEnvValue !== undefined) {
    return parseBooleanFlag(explicitEnvValue)
  }

  const explicitQuery = params?.queryString
  if (typeof explicitQuery === 'string') {
    const queryParams = new URLSearchParams(explicitQuery)
    return queryParams.get(SKY_ENGINE_ENABLE_PAINTER_BACKEND_EXECUTION_QUERY_PARAM) === '1' ||
      queryParams.get(SKY_ENGINE_ENABLE_PAINTER_BACKEND_EXECUTION) === '1'
  }

  if (globalThis.window === undefined) {
    return false
  }

  const queryParams = new URLSearchParams(globalThis.window.location.search)
  return queryParams.get(SKY_ENGINE_ENABLE_PAINTER_BACKEND_EXECUTION_QUERY_PARAM) === '1' ||
    queryParams.get(SKY_ENGINE_ENABLE_PAINTER_BACKEND_EXECUTION) === '1'
}

function isStarsBatch(batch: SkyPainterBackendBatchInput): batch is SkyPainterStarsBatch {
  return batch.kind === 'stars'
}

function buildRenderGlReferenceMarker(batch: SkyPainterStarsBatch): SkyPainterRenderGlReferenceMarker {
  if (batch.grouping.projectionMode === 'orthographic') {
    return {
      renderHeaderApi: 'render_points_2d',
      renderGlItemType: 'ITEM_POINTS',
      renderGlBatchingConcept: 'get_item(type, flags, halo, texture)',
      renderGlFlushPhase: 'render_finish',
    }
  }

  return {
    renderHeaderApi: 'render_points_3d',
    renderGlItemType: 'ITEM_POINTS_3D',
    renderGlBatchingConcept: 'get_item(type, flags, halo, texture)',
    renderGlFlushPhase: 'render_finish',
  }
}

export function mapPainterBatchesToBackendPlan(params: {
  readonly finalizedBatches: ReadonlyArray<SkyPainterBackendBatchInput>
}): SkyPainterBackendMappingPlan {
  const mappedBatches: SkyPainterStarsBackendMappingResult[] = []
  const unsupportedBatches: SkyPainterUnsupportedBatchMappingResult[] = []

  for (const batch of params.finalizedBatches) {
    if (isStarsBatch(batch)) {
      mappedBatches.push({
        kind: 'stars',
        frameIndex: batch.frameIndex,
        sourceCommandKind: batch.sourceCommandKind,
        starCount: batch.starCount,
        grouping: batch.grouping,
        intendedBackendPath: 'babylon-thin-instance-stars',
        executionStatus: 'mapped_not_executed',
        renderGlReference: buildRenderGlReferenceMarker(batch),
      })
      continue
    }

    unsupportedBatches.push({
      kind: 'unsupported',
      frameIndex: batch.frameIndex,
      sourceBatchKind: batch.kind,
      sourceCommandKind: batch.sourceCommandKind,
      status: 'unsupported_not_executed',
      reason: 'unsupported_batch_kind',
    })
  }

  let mappedStarsCount = 0
  for (const batch of mappedBatches) {
    mappedStarsCount += batch.starCount
  }

  return {
    mappedBatches,
    unsupportedBatches,
    summary: {
      mappedBatchCount: mappedBatches.length,
      mappedStarsBatchCount: mappedBatches.length,
      mappedStarsCount,
      unsupportedBatchCount: unsupportedBatches.length,
      executionStatus: unsupportedBatches.length > 0 ? 'unsupported_not_executed' : 'mapped_not_executed',
    },
  }
}

function buildExecutionSummaryStatus(params: {
  executionEnabled: boolean
  sideBySideExecutionCount: number
  executionDisabledCount: number
  mappedBatchCount: number
  unsupportedBatchCount: number
}): SkyPainterBackendExecutionStatus | SkyPainterUnsupportedBatchStatus {
  if (params.sideBySideExecutionCount > 0) {
    return 'executed_side_by_side'
  }
  if (!params.executionEnabled && params.executionDisabledCount > 0) {
    return 'execution_disabled'
  }
  if (params.mappedBatchCount > 0) {
    return 'mapped_not_executed'
  }
  if (params.unsupportedBatchCount > 0) {
    return 'unsupported_not_executed'
  }
  return 'mapped_not_executed'
}

export function executePainterBackendPlan(params: {
  readonly finalizedBatches: ReadonlyArray<SkyPainterFinalizedBatch>
  readonly mappingPlan: SkyPainterBackendMappingPlan
  readonly executionEnabled: boolean
  readonly sideBySideRenderer?: SkyPainterBackendSideBySideAdapter | null
  readonly projectedStarsFrame?: SkyPainterBackendProjectedStarsFrameLike | null
  readonly selectedObjectId?: string | null
  readonly animationTimeSeconds?: number
}): SkyPainterBackendExecutionPlan {
  const byFrameAndKind = new Map<string, SkyPainterStarsBatch>()
  for (const batch of params.finalizedBatches) {
    byFrameAndKind.set(`${batch.frameIndex}:${batch.kind}:${batch.sourceCommandKind}`, batch)
  }

  let sideBySideExecutionCount = 0
  let executionDisabledCount = 0

  const mappedBatches = params.mappingPlan.mappedBatches.map<SkyPainterStarsBackendExecutionResult>((mappedBatch) => {
    const finalizedStarsBatch = byFrameAndKind.get(
      `${mappedBatch.frameIndex}:${mappedBatch.kind}:${mappedBatch.sourceCommandKind}`,
    )
    if (!finalizedStarsBatch || !params.executionEnabled) {
      executionDisabledCount += 1
      return {
        ...mappedBatch,
        executionStatus: params.executionEnabled ? 'mapped_not_executed' : 'execution_disabled',
      }
    }

    if (!params.sideBySideRenderer || !params.projectedStarsFrame) {
      return {
        ...mappedBatch,
        executionStatus: 'mapped_not_executed',
      }
    }

    params.sideBySideRenderer.sync(
      params.projectedStarsFrame.projectedStars,
      params.projectedStarsFrame.width,
      params.projectedStarsFrame.height,
      params.selectedObjectId ?? null,
      params.animationTimeSeconds ?? 0,
    )
    sideBySideExecutionCount += 1
    return {
      ...mappedBatch,
      executionStatus: 'executed_side_by_side',
    }
  })

  const mappedStarsCount = mappedBatches.reduce((sum, batch) => sum + batch.starCount, 0)

  return {
    mappedBatches,
    unsupportedBatches: params.mappingPlan.unsupportedBatches,
    summary: {
      executionEnabled: params.executionEnabled,
      mappedBatchCount: mappedBatches.length,
      mappedStarsBatchCount: mappedBatches.length,
      mappedStarsCount,
      unsupportedBatchCount: params.mappingPlan.unsupportedBatches.length,
      sideBySideExecutionCount,
      executionDisabledCount,
      executionStatus: buildExecutionSummaryStatus({
        executionEnabled: params.executionEnabled,
        sideBySideExecutionCount,
        executionDisabledCount,
        mappedBatchCount: mappedBatches.length,
        unsupportedBatchCount: params.mappingPlan.unsupportedBatches.length,
      }),
    },
  }
}
