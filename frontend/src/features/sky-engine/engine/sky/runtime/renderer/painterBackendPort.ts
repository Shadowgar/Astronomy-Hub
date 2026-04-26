import type { SkyPainterFinalizedBatch, SkyPainterStarsBatch } from './painterPort'

export type SkyPainterBackendExecutionStatus = 'mapped_not_executed'
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
