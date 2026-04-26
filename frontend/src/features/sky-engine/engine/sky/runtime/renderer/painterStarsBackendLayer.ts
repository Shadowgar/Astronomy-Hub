import type { SkyPainterStarsBatch } from './painterPort'
import type { SkyPainterRenderGlReferenceMarker, SkyPainterStarsBackendMappingResult } from './painterBackendPort'

export interface SkyPainterStarsBackendLayerSyncInput {
  readonly frameIndex: number
  readonly sourceCommandKind: 'paint_stars_draw_intent'
  readonly starCount: number
  readonly grouping: SkyPainterStarsBatch['grouping']
  readonly intendedBackendPath: 'babylon-thin-instance-stars'
  readonly renderGlReference: SkyPainterRenderGlReferenceMarker
}

export interface SkyPainterStarsBackendLayerSyncResult {
  readonly created: boolean
  readonly synced: boolean
  readonly syncedStarCount: number
}

export interface SkyPainterStarsBackendLayer {
  syncFromMappedBatch(
    input: SkyPainterStarsBackendLayerSyncInput,
  ): SkyPainterStarsBackendLayerSyncResult
  readonly wasCreated: boolean
  readonly wasSynced: boolean
  readonly lastSyncedStarCount: number
  dispose(): void
}

/**
 * Stage 4D adapter shell for the future painter-owned Babylon stars render object.
 * This explicitly separates painter backend ownership from the direct stars layer.
 */
export function createPainterStarsBackendLayer(): SkyPainterStarsBackendLayer {
  let created = false
  let synced = false
  let lastSyncedStarCount = 0

  return {
    syncFromMappedBatch(input) {
      if (!created) {
        created = true
      }
      synced = true
      lastSyncedStarCount = input.starCount
      return {
        created,
        synced,
        syncedStarCount: input.starCount,
      }
    },

    get wasCreated() {
      return created
    },

    get wasSynced() {
      return synced
    },

    get lastSyncedStarCount() {
      return lastSyncedStarCount
    },

    dispose() {
      created = false
      synced = false
      lastSyncedStarCount = 0
    },
  }
}

export function buildPainterOwnedLayerSyncInput(params: {
  readonly finalizedStarsBatch: SkyPainterStarsBatch
  readonly mappedBatch: SkyPainterStarsBackendMappingResult
}): SkyPainterStarsBackendLayerSyncInput {
  return {
    frameIndex: params.finalizedStarsBatch.frameIndex,
    sourceCommandKind: params.finalizedStarsBatch.sourceCommandKind,
    starCount: params.finalizedStarsBatch.starCount,
    grouping: params.finalizedStarsBatch.grouping,
    intendedBackendPath: params.mappedBatch.intendedBackendPath,
    renderGlReference: params.mappedBatch.renderGlReference,
  }
}
