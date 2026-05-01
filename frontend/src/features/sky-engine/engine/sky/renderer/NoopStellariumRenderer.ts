import {
  STELLARIUM_RENDER_ITEM_TYPES,
  type StellariumRenderItem,
} from './renderItems'
import type {
  StellariumRendererContract,
  StellariumRendererDiagnostics,
  StellariumRendererFrameInput,
  StellariumRendererFrameOutput,
  StellariumRendererFrameSubmission,
  StellariumRendererFrameTiming,
  StellariumRendererInitInput,
  StellariumRendererViewportInput,
} from './stellariumRendererContract'

const DEFAULT_BACKEND_NAME = 'noop-stellarium-renderer'

function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now()
  }
  return Date.now()
}

function emptyDiagnostics(): StellariumRendererDiagnostics {
  return {
    acceptedItemCount: 0,
    acceptedPointItemCount: 0,
    acceptedMeshItemCount: 0,
    acceptedTextItemCount: 0,
    acceptedTextureItemCount: 0,
    lastFrameSequence: 0,
    lastFrameProjectionMode: null,
    notes: [],
  }
}

function categorizeItems(items: ReadonlyArray<StellariumRenderItem>) {
  let acceptedPointItemCount = 0
  let acceptedMeshItemCount = 0
  let acceptedTextItemCount = 0
  let acceptedTextureItemCount = 0

  for (const item of items) {
    switch (item.itemType) {
      case STELLARIUM_RENDER_ITEM_TYPES.POINTS:
        acceptedPointItemCount += 1
        break
      case STELLARIUM_RENDER_ITEM_TYPES.MESH:
        acceptedMeshItemCount += 1
        break
      case STELLARIUM_RENDER_ITEM_TYPES.TEXT:
        acceptedTextItemCount += 1
        break
      case STELLARIUM_RENDER_ITEM_TYPES.TEXTURE:
        acceptedTextureItemCount += 1
        break
      default:
        break
    }
  }

  return {
    acceptedPointItemCount,
    acceptedMeshItemCount,
    acceptedTextItemCount,
    acceptedTextureItemCount,
  }
}

export class NoopStellariumRenderer implements StellariumRendererContract {
  private initialized = false
  private disposed = false
  private frameSequence = 0
  private viewport: StellariumRendererViewportInput | null = null
  private pendingFrameInput: StellariumRendererFrameInput | null = null
  private submittedItems: ReadonlyArray<StellariumRenderItem> = []
  private diagnostics: StellariumRendererDiagnostics = emptyDiagnostics()
  private prepareFrameMs = 0
  private submitFrameMs = 0
  private renderFrameMs = 0

  init(input: StellariumRendererInitInput): void {
    this.viewport = input.viewport
    this.initialized = true
    this.disposed = false
    this.frameSequence = 0
    this.pendingFrameInput = null
    this.submittedItems = []
    this.diagnostics = {
      ...emptyDiagnostics(),
      notes: ['initialized'],
    }
  }

  resize(viewport: StellariumRendererViewportInput): void {
    this.viewport = viewport
  }

  prepareFrame(input: StellariumRendererFrameInput): void {
    const start = nowMs()
    this.assertUsable()
    this.pendingFrameInput = input
    this.prepareFrameMs = nowMs() - start
  }

  submitFrame(submission: StellariumRendererFrameSubmission): void {
    const start = nowMs()
    this.assertUsable()
    this.pendingFrameInput = submission.frameInput
    this.submittedItems = submission.renderItems
    const categorized = categorizeItems(this.submittedItems)

    this.frameSequence += 1
    this.diagnostics = {
      acceptedItemCount: this.submittedItems.length,
      acceptedPointItemCount: categorized.acceptedPointItemCount,
      acceptedMeshItemCount: categorized.acceptedMeshItemCount,
      acceptedTextItemCount: categorized.acceptedTextItemCount,
      acceptedTextureItemCount: categorized.acceptedTextureItemCount,
      lastFrameSequence: this.frameSequence,
      lastFrameProjectionMode: submission.frameInput.projectionMode,
      notes: [
        'submitted_to_noop_renderer',
        `viewport:${submission.frameInput.viewport.width}x${submission.frameInput.viewport.height}`,
      ],
    }
    this.submitFrameMs = nowMs() - start
  }

  renderFrame(): StellariumRendererFrameOutput {
    const start = nowMs()
    this.assertUsable()
    this.renderFrameMs = nowMs() - start

    return {
      pickResult: {
        objectId: null,
        hit: false,
        confidence: 0,
      },
      diagnostics: this.diagnostics,
      timing: this.buildTiming(),
      activeBackendName: DEFAULT_BACKEND_NAME,
    }
  }

  dispose(): void {
    this.disposed = true
    this.initialized = false
    this.pendingFrameInput = null
    this.submittedItems = []
    this.viewport = null
  }

  private buildTiming(): StellariumRendererFrameTiming {
    return {
      prepareFrameMs: this.prepareFrameMs,
      submitFrameMs: this.submitFrameMs,
      renderFrameMs: this.renderFrameMs,
      totalFrameMs: this.prepareFrameMs + this.submitFrameMs + this.renderFrameMs,
    }
  }

  private assertUsable() {
    if (!this.initialized || this.disposed) {
      throw new Error('NoopStellariumRenderer is not initialized')
    }
  }
}
