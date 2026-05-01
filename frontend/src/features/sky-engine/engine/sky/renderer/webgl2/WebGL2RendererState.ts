import type { StellariumRenderItem } from '../renderItems'
import type {
  StellariumRendererDiagnostics,
  StellariumRendererFrameInput,
  StellariumRendererViewportInput,
} from '../stellariumRendererContract'

export interface WebGL2RendererSnapshot {
  readonly frameSequence: number
  readonly viewport: StellariumRendererViewportInput | null
  readonly submittedItemCount: number
  readonly lastProjectionMode: string | null
}

function emptyDiagnostics(): StellariumRendererDiagnostics {
  return {
    acceptedItemCount: 0,
    acceptedPointItemCount: 0,
    acceptedMeshItemCount: 0,
    acceptedTextItemCount: 0,
    acceptedTextureItemCount: 0,
    submittedPointItemCount: 0,
    drawnPointItemCount: 0,
    submittedPointCount: 0,
    drawnPointCount: 0,
    skippedUnsupportedItemCount: 0,
    lastFrameSequence: 0,
    lastFrameProjectionMode: null,
    notes: [],
  }
}

export class WebGL2RendererState {
  private frameSequence = 0
  private viewport: StellariumRendererViewportInput | null = null
  private pendingFrameInput: StellariumRendererFrameInput | null = null
  private submittedItems: ReadonlyArray<StellariumRenderItem> = []
  private diagnostics: StellariumRendererDiagnostics = emptyDiagnostics()

  setViewport(viewport: StellariumRendererViewportInput) {
    this.viewport = viewport
  }

  setPendingFrameInput(input: StellariumRendererFrameInput) {
    this.pendingFrameInput = input
  }

  setSubmittedItems(items: ReadonlyArray<StellariumRenderItem>) {
    this.submittedItems = items
    this.frameSequence += 1

    let acceptedPointItemCount = 0
    let acceptedMeshItemCount = 0
    let acceptedTextItemCount = 0
    let acceptedTextureItemCount = 0
    let submittedPointCount = 0

    for (const item of items) {
      if (item.itemType === 'ITEM_POINTS') {
        acceptedPointItemCount += 1
        submittedPointCount += item.pointCount
      } else if (item.itemType === 'ITEM_MESH') {
        acceptedMeshItemCount += 1
      } else if (item.itemType === 'ITEM_TEXT') {
        acceptedTextItemCount += 1
      } else if (item.itemType === 'ITEM_TEXTURE') {
        acceptedTextureItemCount += 1
      }
    }

    this.diagnostics = {
      acceptedItemCount: items.length,
      acceptedPointItemCount,
      acceptedMeshItemCount,
      acceptedTextItemCount,
      acceptedTextureItemCount,
      submittedPointItemCount: acceptedPointItemCount,
      drawnPointItemCount: 0,
      submittedPointCount,
      drawnPointCount: 0,
      skippedUnsupportedItemCount: acceptedMeshItemCount + acceptedTextItemCount + acceptedTextureItemCount,
      lastFrameSequence: this.frameSequence,
      lastFrameProjectionMode: this.pendingFrameInput?.projectionMode ?? null,
      notes: [
        `backend:webgl2-shell`,
        `viewport:${this.pendingFrameInput?.viewport.width ?? 0}x${this.pendingFrameInput?.viewport.height ?? 0}`,
      ],
    }
  }

  setPointDrawResults(input: {
    drawnPointItemCount: number
    drawnPointCount: number
    skippedUnsupportedItemCount: number
    note?: string
  }) {
    this.diagnostics = {
      ...this.diagnostics,
      drawnPointItemCount: input.drawnPointItemCount,
      drawnPointCount: input.drawnPointCount,
      skippedUnsupportedItemCount: input.skippedUnsupportedItemCount,
      notes: input.note
        ? [...this.diagnostics.notes, input.note]
        : this.diagnostics.notes,
    }
  }

  getDiagnostics() {
    return this.diagnostics
  }

  getSubmittedItems() {
    return this.submittedItems
  }

  getViewport() {
    return this.viewport
  }

  snapshot(): WebGL2RendererSnapshot {
    return {
      frameSequence: this.frameSequence,
      viewport: this.viewport,
      submittedItemCount: this.submittedItems.length,
      lastProjectionMode: this.diagnostics.lastFrameProjectionMode,
    }
  }

  reset() {
    this.frameSequence = 0
    this.viewport = null
    this.pendingFrameInput = null
    this.submittedItems = []
    this.diagnostics = emptyDiagnostics()
  }
}
