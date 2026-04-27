/**
 * Stellarium painter API surface boundary (slice 1).
 *
 * Source mapping:
 * - `src/painter.h`: public enums, `struct point`, `struct point_3d`, `struct painter`,
 *   and callable API (`paint_*`, `painter_*`).
 * - `src/painter.c`: frame lifecycle entry points `paint_prepare` / `paint_finish`.
 *
 * This file intentionally defines API shape + frame-state lifecycle only.
 * It does not implement batching or `render_gl.c` behavior.
 */

export const SKY_PAINTER_FONT_SIZE_BASE = 15

export enum SkyPainterAlignFlags {
  ALIGN_LEFT = 1,
  ALIGN_CENTER = 2,
  ALIGN_RIGHT = 4,
  ALIGN_TOP = 8,
  ALIGN_MIDDLE = 16,
  ALIGN_BOTTOM = 32,
  ALIGN_BASELINE = 64,
}

export enum SkyPainterTextEffectFlags {
  TEXT_UPPERCASE = 1,
  TEXT_BOLD = 2,
  TEXT_SMALL_CAP = 4,
  TEXT_DEMI_BOLD = 8,
  TEXT_FLOAT = 32,
  TEXT_SPACED = 64,
  TEXT_SEMI_SPACED = 128,
  TEXT_MULTILINES = 256,
}

export enum SkyPainterMode {
  MODE_TRIANGLES = 0,
  MODE_LINES = 1,
  MODE_POINTS = 2,
}

export enum SkyPainterFlags {
  PAINTER_ADD = 1,
  PAINTER_HIDE_BELOW_HORIZON = 4,
  PAINTER_PLANET_SHADER = 16,
  PAINTER_RING_SHADER = 32,
  PAINTER_IS_MOON = 64,
  PAINTER_ATMOSPHERE_SHADER = 256,
  PAINTER_FOG_SHADER = 512,
  PAINTER_ENABLE_DEPTH = 1024,
  PAINTER_SKIP_DISCONTINUOUS = 16384,
  PAINTER_ALLOW_REORDER = 32768,
}

export enum SkyPainterTextureSlot {
  PAINTER_TEX_COLOR = 0,
  PAINTER_TEX_NORMAL = 1,
}

export const SKY_PROJ_FLIP_VERTICAL = 1 << 5
export const SKY_PROJ_FLIP_HORIZONTAL = 1 << 6
export const SKY_PROJ_HAS_DISCONTINUITY = 1 << 7

export interface SkyPainterPoint {
  readonly pos: [number, number]
  readonly size: number
  readonly color: [number, number, number, number]
}

export interface SkyPainterPoint3D {
  readonly pos: [number, number, number]
  readonly size: number
  readonly color: [number, number, number, number]
}

export type SkyPainterRenderItemType = 'ITEM_POINTS' | 'ITEM_POINTS_3D'

export interface SkyPainterPointItem2D {
  readonly screenPos: [number, number]
  readonly ndcPos: [number, number]
  readonly size: number
  readonly color: [number, number, number, number]
}

export interface SkyPainterPointItem3D {
  readonly viewPos: [number, number, number]
  readonly size: number
  readonly color: [number, number, number, number]
}

export interface SkyPainterRenderPointItem {
  readonly type: SkyPainterRenderItemType
  readonly mode: SkyPainterMode.MODE_POINTS
  readonly flags: number
  readonly textureRef: string | null
  readonly compatibilityKey: string
  readonly orderIndex: number
  readonly halo: number
  readonly pointCount: number
  readonly capacity: number
  readonly flushed: boolean
  readonly dispatched: boolean
  readonly released: boolean
  readonly terminalState: 'queued' | 'dispatched' | 'released'
  readonly points2d: ReadonlyArray<SkyPainterPointItem2D>
  readonly points3d: ReadonlyArray<SkyPainterPointItem3D>
}

export interface SkyPainterFlushResultItem {
  readonly orderIndex: number
  readonly compatibilityKey: string
  readonly type: SkyPainterRenderItemType
  readonly flags: number
  readonly textureRef: string | null
  readonly pointCount: number
  readonly flushed: true
  readonly released: true
}

export interface SkyPainterFlushDispatchItem {
  readonly orderIndex: number
  readonly compatibilityKey: string
  readonly type: SkyPainterRenderItemType
  readonly flags: number
  readonly textureRef: string | null
  readonly pointCount: number
  readonly dispatched: true
}

export interface SkyPainterFlushLifecycleEvent {
  readonly sequence: number
  readonly phase: 'dispatch' | 'release' | 'flush_complete' | 'post_flush_state_reset'
  readonly orderIndex: number | null
  readonly type: SkyPainterRenderItemType | null
}

export interface SkyPainterFlushCompleteRecord {
  readonly frameIndex: number
  readonly flushedItemCount: number
  readonly dispatchCount: number
  readonly releaseCount: number
}

export interface SkyPainterPostFlushStateResetRecord {
  readonly frameIndex: number
  readonly glStateResetMode: 'cpu_modeled'
}

export interface SkyPainterRenderBackendFrame {
  readonly framebufferWidth: number
  readonly framebufferHeight: number
  readonly scale: number
  readonly cullFlipped: boolean
  readonly projectionMode: string | null
  readonly projectionFlags: number
  readonly flipHorizontal: boolean
  readonly flipVertical: boolean
  readonly clipInfoValid: boolean
  readonly depthMin: number
  readonly depthMax: number
  readonly pointItems: ReadonlyArray<SkyPainterRenderPointItem>
  readonly flushReady: boolean
  readonly flushDispatches: ReadonlyArray<SkyPainterFlushDispatchItem>
  readonly flushResults: ReadonlyArray<SkyPainterFlushResultItem>
  readonly flushLifecycleEvents: ReadonlyArray<SkyPainterFlushLifecycleEvent>
  readonly flushCompleteRecord: SkyPainterFlushCompleteRecord | null
  readonly postFlushStateResetRecord: SkyPainterPostFlushStateResetRecord | null
}

export interface SkyPainterFrameResetInput {
  readonly frameIndex: number
  readonly windowWidth: number
  readonly windowHeight: number
  readonly pixelScale: number
  readonly framebufferWidth: number
  readonly framebufferHeight: number
  readonly starsLimitMag: number | null
  readonly hintsLimitMag: number | null
  readonly hardLimitMag: number | null
  readonly projectionMode?: string | null
  readonly projectionFlags?: number
}

export interface SkyPainterProjectionState {
  readonly windowWidth: number
  readonly windowHeight: number
  readonly pixelScale: number
  readonly projectionMode: string | null
  readonly projectionFlags: number
  readonly flipHorizontal: boolean
  readonly flipVertical: boolean
}

export interface SkyPainterClipInfoSubset {
  readonly viewportWidth: number
  readonly viewportHeight: number
  readonly boundingCapComputed: boolean
  readonly skyCapComputed: boolean
}

export interface SkyPainterClippingState {
  readonly clipInfoValid: boolean
  readonly clipInfo: SkyPainterClipInfoSubset | null
}

export interface SkyPainterBatchStateSnapshot {
  readonly mode: SkyPainterMode
  readonly color: readonly [number, number, number, number]
  readonly flags: number
  readonly textureBindings: Readonly<Record<SkyPainterTextureSlot, string | null>>
  readonly projection: SkyPainterProjectionState | null
  readonly clipping: SkyPainterClippingState
}

export interface SkyPainterCommandPayloadMap {
  readonly paint_prepare: {
    readonly windowWidth: number
    readonly windowHeight: number
    readonly pixelScale: number
    readonly projectionMode: string | null
    readonly projectionFlags: number
    readonly flipHorizontal: boolean
    readonly flipVertical: boolean
    readonly cullFlipped: boolean
  }
  readonly paint_finish: {
    readonly finalized: true
  }
  readonly painter_set_texture: {
    readonly slot: SkyPainterTextureSlot
    readonly textureRef: string | null
  }
  readonly paint_2d_points: {
    readonly count: number
    readonly points: readonly SkyPainterPoint[]
  }
  readonly paint_3d_points: {
    readonly count: number
    readonly points: readonly SkyPainterPoint3D[]
  }
  readonly paint_quad: Record<string, never>
  readonly paint_quad_contour: Record<string, never>
  readonly paint_tile_contour: Record<string, never>
  readonly paint_line: Record<string, never>
  readonly paint_linestring: Record<string, never>
  readonly paint_mesh: {
    readonly mode: SkyPainterMode
  }
  readonly paint_text_bounds: Record<string, never>
  readonly paint_text: Record<string, never>
  readonly paint_texture: {
    readonly textureRef: string | null
  }
  readonly paint_stars_draw_intent: {
    readonly fromDirectStarPath: true
    readonly starCount: number
    readonly source: {
      readonly dataMode: string | null
      readonly sourceLabel: string | null
      readonly scenePacketStarCount: number
      readonly scenePacketTileCount: number
      readonly diagnosticsActiveTiles: number | null
      readonly diagnosticsVisibleTileIdsCount: number | null
      readonly diagnosticsStarsListVisitCount: number | null
    }
    readonly magnitude: {
      readonly limitingMagnitude: number
      readonly minRenderedMagnitude: number | null
      readonly maxRenderedMagnitude: number | null
      readonly minRenderAlpha: number | null
      readonly maxRenderAlpha: number | null
    }
    readonly view: {
      readonly projectionMode: string | null
      readonly fovDegrees: number
      readonly viewportWidth: number
      readonly viewportHeight: number
      readonly centerDirection: {
        readonly x: number
        readonly y: number
        readonly z: number
      }
      readonly sceneTimestampIso: string | null
    }
  }
  readonly paint_debug: {
    readonly value: boolean
  }
  readonly painter_is_quad_clipped: Record<string, never>
  readonly painter_is_healpix_clipped: Record<string, never>
  readonly painter_is_planet_healpix_clipped: Record<string, never>
  readonly painter_is_point_clipped_fast: Record<string, never>
  readonly painter_is_2d_point_clipped: Record<string, never>
  readonly painter_is_2d_circle_clipped: Record<string, never>
  readonly painter_is_cap_clipped: Record<string, never>
  readonly painter_update_clip_info: {
    readonly clipInfoValid: true
    readonly viewportWidth: number
    readonly viewportHeight: number
    readonly boundingCapComputed: true
    readonly skyCapComputed: true
  }
  readonly paint_orbit: Record<string, never>
  readonly paint_2d_ellipse: Record<string, never>
  readonly paint_2d_rect: Record<string, never>
  readonly paint_2d_line: Record<string, never>
  readonly paint_cap: Record<string, never>
  readonly painter_3d_model_exists: Record<string, never>
  readonly painter_get_3d_model_bounds: Record<string, never>
  readonly paint_3d_model: Record<string, never>
  readonly painter_project_ellipse: Record<string, never>
  readonly painter_project: Record<string, never>
  readonly painter_unproject: Record<string, never>
}

export type SkyPainterCommandKind = keyof SkyPainterCommandPayloadMap

export type SkyPainterQueuedCall<K extends SkyPainterCommandKind = SkyPainterCommandKind> = {
  readonly fn: K
  readonly kind: K
  readonly frameIndex: number
  readonly sequence: number
  readonly payload: Readonly<SkyPainterCommandPayloadMap[K]>
  readonly batchState: SkyPainterBatchStateSnapshot
}

export type SkyPainterBatchKind = 'stars'
export type SkyPainterBatchExecutionStatus = 'inert' | 'not_executed'

export interface SkyPainterStarsBatch {
  readonly kind: 'stars'
  readonly sourceCommandKind: 'paint_stars_draw_intent'
  readonly frameIndex: number
  readonly starCount: number
  readonly grouping: {
    readonly projectionMode: string | null
    readonly fovDegrees: number
    readonly fovBucket: string
    readonly magnitude: {
      readonly limitingMagnitude: number
      readonly minRenderedMagnitude: number | null
      readonly maxRenderedMagnitude: number | null
    }
    readonly renderAlpha: {
      readonly minRenderAlpha: number | null
      readonly maxRenderAlpha: number | null
    }
    readonly textureRef: string | null
    readonly materialRef: string | null
  }
  readonly sourcePath: 'direct-star-mirror'
  readonly executionStatus: SkyPainterBatchExecutionStatus
}

export type SkyPainterFinalizedBatch = SkyPainterStarsBatch

function isStarsDrawIntentQueuedCall(
  command: SkyPainterQueuedCall,
): command is SkyPainterQueuedCall<'paint_stars_draw_intent'> {
  return command.kind === 'paint_stars_draw_intent'
}

function resolveStarsFovBucket(fovDegrees: number): string {
  if (fovDegrees >= 90) {
    return 'wide'
  }
  if (fovDegrees >= 45) {
    return 'medium'
  }
  if (fovDegrees >= 20) {
    return 'close'
  }
  return 'deep'
}

function getLastEntry<T>(entries: readonly T[]): T | undefined {
  const entriesWithAt = entries as unknown as { at: (index: number) => T | undefined }
  return entriesWithAt.at(-1)
}

function buildItemCompatibilityKey(params: {
  readonly type: SkyPainterRenderItemType
  readonly flags: number
  readonly halo: number
  readonly textureRef: string | null
}): string {
  return `${params.type}|${params.flags}|${params.halo}|${params.textureRef ?? '__null__'}`
}

/**
 * Source-faithful boundary class that mirrors `painter.h` callable naming.
 * All methods are currently no-op queue/state mutations only.
 */
export class SkyPainterPortState {
  frameIndex = 0
  prepared = false
  mode: SkyPainterMode = SkyPainterMode.MODE_TRIANGLES
  debug = false
  color: [number, number, number, number] = [1, 1, 1, 1]
  fbSize: [number, number] = [1, 1]
  pixelScale = 1
  flags = 0
  contrast = 1
  pointsHalo = 7
  starsLimitMag: number | null = null
  hintsLimitMag: number | null = null
  hardLimitMag: number | null = null
  projectionState: SkyPainterProjectionState | null = null
  clippingState: SkyPainterClippingState = { clipInfoValid: false, clipInfo: null }

  private commandSequence = 0
  private frameFinalized = false
  private readonly frameCommands: SkyPainterQueuedCall[] = []
  private finalizedFrameCommands: ReadonlyArray<SkyPainterQueuedCall> = Object.freeze([])
  private finalizedFrameBatches: ReadonlyArray<SkyPainterFinalizedBatch> = Object.freeze([])
  private renderBackendFrame: SkyPainterRenderBackendFrame = this.createEmptyRenderBackendFrame()
  private finalizedRenderBackendFrame: SkyPainterRenderBackendFrame = this.createEmptyRenderBackendFrame()
  private itemCreateSequence = 0
  private readonly mutableRenderItems: Array<{
    type: SkyPainterRenderItemType
    mode: SkyPainterMode.MODE_POINTS
    flags: number
    textureRef: string | null
    compatibilityKey: string
    orderIndex: number
    halo: number
    pointCount: number
    capacity: number
    flushed: boolean
    dispatched: boolean
    released: boolean
    terminalState: 'queued' | 'dispatched' | 'released'
    points2d: SkyPainterPointItem2D[]
    points3d: SkyPainterPointItem3D[]
  }> = []
  private readonly textureBindings: Record<SkyPainterTextureSlot, string | null> = {
    [SkyPainterTextureSlot.PAINTER_TEX_COLOR]: null,
    [SkyPainterTextureSlot.PAINTER_TEX_NORMAL]: null,
  }

  get drawQueue(): ReadonlyArray<SkyPainterQueuedCall> {
    return this.frameFinalized ? this.finalizedFrameCommands : this.frameCommands
  }

  get finalizedCommands(): ReadonlyArray<SkyPainterQueuedCall> {
    return this.finalizedFrameCommands
  }

  get finalizedBatches(): ReadonlyArray<SkyPainterFinalizedBatch> {
    return this.finalizedFrameBatches
  }

  get pointItems(): ReadonlyArray<SkyPainterRenderPointItem> {
    return this.frameFinalized ? this.finalizedRenderBackendFrame.pointItems : this.snapshotMutableRenderItems()
  }

  get finalizedPointItems(): ReadonlyArray<SkyPainterRenderPointItem> {
    return this.finalizedRenderBackendFrame.pointItems
  }

  get flushResults(): ReadonlyArray<SkyPainterFlushResultItem> {
    return this.frameFinalized ? this.finalizedRenderBackendFrame.flushResults : this.renderBackendFrame.flushResults
  }

  get flushDispatches(): ReadonlyArray<SkyPainterFlushDispatchItem> {
    return this.frameFinalized ? this.finalizedRenderBackendFrame.flushDispatches : this.renderBackendFrame.flushDispatches
  }

  get flushLifecycleEvents(): ReadonlyArray<SkyPainterFlushLifecycleEvent> {
    return this.frameFinalized
      ? this.finalizedRenderBackendFrame.flushLifecycleEvents
      : this.renderBackendFrame.flushLifecycleEvents
  }

  get renderBackend(): SkyPainterRenderBackendFrame {
    if (this.frameFinalized) {
      return this.finalizedRenderBackendFrame
    }

    return Object.freeze({
      ...this.renderBackendFrame,
      pointItems: this.snapshotMutableRenderItems(),
    })
  }

  get isFrameFinalized(): boolean {
    return this.frameFinalized
  }

  reset_for_frame(input: SkyPainterFrameResetInput): void {
    const projectionFlags = input.projectionFlags ?? 0
    this.frameIndex = input.frameIndex
    this.prepared = false
    this.fbSize = [input.framebufferWidth, input.framebufferHeight]
    this.pixelScale = input.pixelScale
    this.starsLimitMag = input.starsLimitMag
    this.hintsLimitMag = input.hintsLimitMag
    this.hardLimitMag = input.hardLimitMag
    this.projectionState = {
      windowWidth: input.windowWidth,
      windowHeight: input.windowHeight,
      pixelScale: input.pixelScale,
      projectionMode: input.projectionMode ?? this.projectionState?.projectionMode ?? 'stereographic',
      projectionFlags,
      flipHorizontal: (projectionFlags & SKY_PROJ_FLIP_HORIZONTAL) !== 0,
      flipVertical: (projectionFlags & SKY_PROJ_FLIP_VERTICAL) !== 0,
    }
    this.clippingState = { clipInfoValid: false, clipInfo: null }
    this.commandSequence = 0
    this.frameFinalized = false
    this.itemCreateSequence = 0
    this.frameCommands.length = 0
    this.finalizedFrameCommands = Object.freeze([])
    this.finalizedFrameBatches = Object.freeze([])
    this.mutableRenderItems.length = 0
    this.renderBackendFrame = this.createEmptyRenderBackendFrame()
    this.finalizedRenderBackendFrame = this.createEmptyRenderBackendFrame()
    this.textureBindings[SkyPainterTextureSlot.PAINTER_TEX_COLOR] = null
    this.textureBindings[SkyPainterTextureSlot.PAINTER_TEX_NORMAL] = null
  }

  // painter.c::paint_prepare
  paint_prepare(winW: number, winH: number, scale: number): number {
    const previousProjectionFlags = this.projectionState?.projectionFlags ?? 0
    this.prepared = true
    this.projectionState = {
      windowWidth: winW,
      windowHeight: winH,
      pixelScale: scale,
      projectionMode: this.projectionState?.projectionMode ?? 'stereographic',
      projectionFlags: previousProjectionFlags,
      flipHorizontal: (previousProjectionFlags & SKY_PROJ_FLIP_HORIZONTAL) !== 0,
      flipVertical: (previousProjectionFlags & SKY_PROJ_FLIP_VERTICAL) !== 0,
    }
    this.painter_update_clip_info()
    const cullFlipped = this.deriveCullFlippedFromProjectionFlags(this.projectionState.projectionFlags)
    this.record('paint_prepare', {
      windowWidth: winW,
      windowHeight: winH,
      pixelScale: scale,
      projectionMode: this.projectionState.projectionMode,
      projectionFlags: this.projectionState.projectionFlags,
      flipHorizontal: this.projectionState.flipHorizontal,
      flipVertical: this.projectionState.flipVertical,
      cullFlipped,
    })
    this.render_prepare(winW, winH, scale, cullFlipped)
    return 0
  }

  // painter.c::paint_finish
  paint_finish(): number {
    if (this.frameFinalized) {
      return 0
    }
    this.record('paint_finish', { finalized: true })
    this.render_finish()
    this.finalizeFrameCommands()
    return 0
  }

  painter_set_texture(slot: SkyPainterTextureSlot = SkyPainterTextureSlot.PAINTER_TEX_COLOR, textureRef: string | null = null): void {
    if (this.frameFinalized) {
      return
    }
    this.textureBindings[slot] = textureRef
    this.record('painter_set_texture', { slot, textureRef })
  }

  /**
   * Narrow runtime adapter for projection metadata used by Stellarium
   * cull-flip derivation in `paint_prepare`.
   */
  sync_projection_state(params: {
    readonly projectionMode?: string | null
    readonly projectionFlags?: number
  }): void {
    const projectionFlags = params.projectionFlags ?? this.projectionState?.projectionFlags ?? 0
    this.projectionState = {
      windowWidth: this.projectionState?.windowWidth ?? 1,
      windowHeight: this.projectionState?.windowHeight ?? 1,
      pixelScale: this.projectionState?.pixelScale ?? 1,
      projectionMode: params.projectionMode ?? this.projectionState?.projectionMode ?? null,
      projectionFlags,
      flipHorizontal: (projectionFlags & SKY_PROJ_FLIP_HORIZONTAL) !== 0,
      flipVertical: (projectionFlags & SKY_PROJ_FLIP_VERTICAL) !== 0,
    }
  }
  paint_2d_points(n: number, points: readonly SkyPainterPoint[]): number {
    if (this.frameFinalized) {
      return 0
    }
    this.mode = SkyPainterMode.MODE_POINTS
    this.record('paint_2d_points', { count: n, points })
    this.render_points_2d(n, points)
    return 0
  }
  paint_3d_points(n: number, points: readonly SkyPainterPoint3D[]): number {
    if (this.frameFinalized) {
      return 0
    }
    this.mode = SkyPainterMode.MODE_POINTS
    this.record('paint_3d_points', { count: n, points })
    this.render_points_3d(n, points)
    return 0
  }
  paint_quad(): number { this.mode = SkyPainterMode.MODE_TRIANGLES; this.record('paint_quad', {}); return 0 }
  paint_quad_contour(): number { this.mode = SkyPainterMode.MODE_LINES; this.record('paint_quad_contour', {}); return 0 }
  paint_tile_contour(): number { this.mode = SkyPainterMode.MODE_LINES; this.record('paint_tile_contour', {}); return 0 }
  paint_line(): number { this.mode = SkyPainterMode.MODE_LINES; this.record('paint_line', {}); return 0 }
  paint_linestring(): number { this.mode = SkyPainterMode.MODE_LINES; this.record('paint_linestring', {}); return 0 }
  paint_mesh(mode: SkyPainterMode = SkyPainterMode.MODE_TRIANGLES): number {
    this.mode = mode
    this.record('paint_mesh', { mode })
    return 0
  }
  paint_text_bounds(): number { this.record('paint_text_bounds', {}); return 0 }
  paint_text(): number { this.record('paint_text', {}); return 0 }
  paint_texture(textureRef: string | null = null): number { this.record('paint_texture', { textureRef }); return 0 }
  paint_stars_draw_intent(
    payload: SkyPainterCommandPayloadMap['paint_stars_draw_intent'],
  ): number {
    this.mode = SkyPainterMode.MODE_POINTS
    this.record('paint_stars_draw_intent', payload)
    return 0
  }
  paint_debug(value: boolean): void { this.debug = value; this.record('paint_debug', { value }) }
  painter_is_quad_clipped(): boolean { this.record('painter_is_quad_clipped', {}); return false }
  painter_is_healpix_clipped(): boolean { this.record('painter_is_healpix_clipped', {}); return false }
  painter_is_planet_healpix_clipped(): boolean { this.record('painter_is_planet_healpix_clipped', {}); return false }
  painter_is_point_clipped_fast(): boolean { this.record('painter_is_point_clipped_fast', {}); return false }
  painter_is_2d_point_clipped(): boolean { this.record('painter_is_2d_point_clipped', {}); return false }
  painter_is_2d_circle_clipped(): boolean { this.record('painter_is_2d_circle_clipped', {}); return false }
  painter_is_cap_clipped(): boolean { this.record('painter_is_cap_clipped', {}); return false }
  painter_update_clip_info(): void {
    const projection = this.projectionState
    const clipInfo: SkyPainterClipInfoSubset = {
      viewportWidth: projection?.windowWidth ?? this.renderBackendFrame.framebufferWidth,
      viewportHeight: projection?.windowHeight ?? this.renderBackendFrame.framebufferHeight,
      boundingCapComputed: true,
      skyCapComputed: true,
    }
    this.clippingState = { clipInfoValid: true, clipInfo }
    this.record('painter_update_clip_info', {
      clipInfoValid: true,
      viewportWidth: clipInfo.viewportWidth,
      viewportHeight: clipInfo.viewportHeight,
      boundingCapComputed: true,
      skyCapComputed: true,
    })
  }
  paint_orbit(): number { this.mode = SkyPainterMode.MODE_LINES; this.record('paint_orbit', {}); return 0 }
  paint_2d_ellipse(): number { this.mode = SkyPainterMode.MODE_LINES; this.record('paint_2d_ellipse', {}); return 0 }
  paint_2d_rect(): number { this.mode = SkyPainterMode.MODE_LINES; this.record('paint_2d_rect', {}); return 0 }
  paint_2d_line(): number { this.mode = SkyPainterMode.MODE_LINES; this.record('paint_2d_line', {}); return 0 }
  paint_cap(): void { this.mode = SkyPainterMode.MODE_LINES; this.record('paint_cap', {}) }
  painter_3d_model_exists(): boolean { this.record('painter_3d_model_exists', {}); return false }
  painter_get_3d_model_bounds(): number { this.record('painter_get_3d_model_bounds', {}); return 0 }
  paint_3d_model(): void { this.mode = SkyPainterMode.MODE_TRIANGLES; this.record('paint_3d_model', {}) }
  painter_project_ellipse(): void { this.record('painter_project_ellipse', {}) }
  painter_project(): boolean { this.record('painter_project', {}); return true }
  painter_unproject(): boolean { this.record('painter_unproject', {}); return true }

  private record<K extends SkyPainterCommandKind>(kind: K, payload: SkyPainterCommandPayloadMap[K]): void {
    if (this.frameFinalized) {
      return
    }

    this.commandSequence += 1
    this.frameCommands.push({
      fn: kind,
      kind,
      frameIndex: this.frameIndex,
      sequence: this.commandSequence,
      payload,
      batchState: this.snapshotBatchState(),
    })
  }

  private finalizeFrameCommands(): void {
    if (this.frameFinalized) {
      return
    }

    this.finalizedFrameCommands = Object.freeze([...this.frameCommands])
    this.finalizedFrameBatches = Object.freeze(this.buildFinalizedBatches(this.finalizedFrameCommands))
    this.finalizedRenderBackendFrame = Object.freeze({
      framebufferWidth: this.renderBackendFrame.framebufferWidth,
      framebufferHeight: this.renderBackendFrame.framebufferHeight,
      scale: this.renderBackendFrame.scale,
      cullFlipped: this.renderBackendFrame.cullFlipped,
      projectionMode: this.renderBackendFrame.projectionMode,
      projectionFlags: this.renderBackendFrame.projectionFlags,
      flipHorizontal: this.renderBackendFrame.flipHorizontal,
      flipVertical: this.renderBackendFrame.flipVertical,
      clipInfoValid: this.renderBackendFrame.clipInfoValid,
      depthMin: this.renderBackendFrame.depthMin,
      depthMax: this.renderBackendFrame.depthMax,
      flushReady: true,
      flushDispatches: this.renderBackendFrame.flushDispatches,
      flushResults: this.renderBackendFrame.flushResults,
      flushLifecycleEvents: this.renderBackendFrame.flushLifecycleEvents,
      flushCompleteRecord: this.renderBackendFrame.flushCompleteRecord,
      postFlushStateResetRecord: this.renderBackendFrame.postFlushStateResetRecord,
      pointItems: Object.freeze(this.renderBackendFrame.pointItems.map((item) => Object.freeze({
        type: item.type,
        mode: item.mode,
        flags: item.flags,
        textureRef: item.textureRef,
        compatibilityKey: item.compatibilityKey,
        orderIndex: item.orderIndex,
        halo: item.halo,
        pointCount: item.pointCount,
        capacity: item.capacity,
        flushed: true,
        dispatched: item.dispatched,
        released: item.released,
        terminalState: item.terminalState,
        points2d: Object.freeze([...item.points2d]),
        points3d: Object.freeze([...item.points3d]),
      }))),
    })
    this.frameFinalized = true
  }

  private buildFinalizedBatches(commands: ReadonlyArray<SkyPainterQueuedCall>): SkyPainterFinalizedBatch[] {
    const starIntentCommands = commands.filter(isStarsDrawIntentQueuedCall)
    const pointItems = this.finalizedRenderBackendFrame.pointItems
    const totalPointCount = pointItems.reduce((sum, item) => sum + item.pointCount, 0)

    if (totalPointCount > 0) {
      const referenceIntent = getLastEntry(starIntentCommands)
      const projectionMode = referenceIntent?.payload.view.projectionMode ?? null
      const fovDegrees = referenceIntent?.payload.view.fovDegrees ?? 60
      return [{
        kind: 'stars',
        sourceCommandKind: 'paint_stars_draw_intent',
        frameIndex: this.frameIndex,
        starCount: totalPointCount,
        grouping: {
          projectionMode,
          fovDegrees,
          fovBucket: resolveStarsFovBucket(fovDegrees),
          magnitude: {
            limitingMagnitude: referenceIntent?.payload.magnitude.limitingMagnitude ?? this.starsLimitMag ?? 0,
            minRenderedMagnitude: referenceIntent?.payload.magnitude.minRenderedMagnitude ?? null,
            maxRenderedMagnitude: referenceIntent?.payload.magnitude.maxRenderedMagnitude ?? null,
          },
          renderAlpha: {
            minRenderAlpha: referenceIntent?.payload.magnitude.minRenderAlpha ?? null,
            maxRenderAlpha: referenceIntent?.payload.magnitude.maxRenderAlpha ?? null,
          },
          textureRef: this.textureBindings[SkyPainterTextureSlot.PAINTER_TEX_COLOR],
          materialRef: null,
        },
        sourcePath: 'direct-star-mirror',
        executionStatus: 'not_executed',
      }]
    }

    const batches: SkyPainterFinalizedBatch[] = []
    for (const command of starIntentCommands) {
      batches.push({
        kind: 'stars',
        sourceCommandKind: 'paint_stars_draw_intent',
        frameIndex: command.frameIndex,
        starCount: command.payload.starCount,
        grouping: {
          projectionMode: command.payload.view.projectionMode,
          fovDegrees: command.payload.view.fovDegrees,
          fovBucket: resolveStarsFovBucket(command.payload.view.fovDegrees),
          magnitude: {
            limitingMagnitude: command.payload.magnitude.limitingMagnitude,
            minRenderedMagnitude: command.payload.magnitude.minRenderedMagnitude,
            maxRenderedMagnitude: command.payload.magnitude.maxRenderedMagnitude,
          },
          renderAlpha: {
            minRenderAlpha: command.payload.magnitude.minRenderAlpha,
            maxRenderAlpha: command.payload.magnitude.maxRenderAlpha,
          },
          textureRef: command.batchState.textureBindings[SkyPainterTextureSlot.PAINTER_TEX_COLOR],
          materialRef: null,
        },
        sourcePath: 'direct-star-mirror',
        executionStatus: 'not_executed',
      })
    }
    return batches
  }

  private createEmptyRenderBackendFrame(): SkyPainterRenderBackendFrame {
    return Object.freeze({
      framebufferWidth: 0,
      framebufferHeight: 0,
      scale: 1,
      cullFlipped: false,
      projectionMode: null,
      projectionFlags: 0,
      flipHorizontal: false,
      flipVertical: false,
      clipInfoValid: false,
      depthMin: Number.POSITIVE_INFINITY,
      depthMax: Number.NEGATIVE_INFINITY,
      pointItems: Object.freeze([]),
      flushReady: false,
      flushDispatches: Object.freeze([]),
      flushResults: Object.freeze([]),
      flushLifecycleEvents: Object.freeze([]),
      flushCompleteRecord: null,
      postFlushStateResetRecord: null,
    })
  }

  private snapshotMutableRenderItems(): ReadonlyArray<SkyPainterRenderPointItem> {
    return Object.freeze(this.mutableRenderItems.map((item) => Object.freeze({
      type: item.type,
      mode: item.mode,
      flags: item.flags,
      textureRef: item.textureRef,
      compatibilityKey: item.compatibilityKey,
      orderIndex: item.orderIndex,
      halo: item.halo,
      pointCount: item.pointCount,
      capacity: item.capacity,
      flushed: item.flushed,
      dispatched: item.dispatched,
      released: item.released,
      terminalState: item.terminalState,
      points2d: Object.freeze([...item.points2d]),
      points3d: Object.freeze([...item.points3d]),
    })))
  }

  private render_prepare(winW: number, winH: number, scale: number, cullFlipped: boolean): void {
    this.mutableRenderItems.length = 0
    this.renderBackendFrame = Object.freeze({
      framebufferWidth: winW * scale,
      framebufferHeight: winH * scale,
      scale,
      cullFlipped,
      projectionMode: this.projectionState?.projectionMode ?? null,
      projectionFlags: this.projectionState?.projectionFlags ?? 0,
      flipHorizontal: this.projectionState?.flipHorizontal ?? false,
      flipVertical: this.projectionState?.flipVertical ?? false,
      clipInfoValid: this.clippingState.clipInfoValid,
      depthMin: Number.POSITIVE_INFINITY,
      depthMax: Number.NEGATIVE_INFINITY,
      pointItems: Object.freeze([]),
      flushReady: false,
      flushDispatches: Object.freeze([]),
      flushResults: Object.freeze([]),
      flushLifecycleEvents: Object.freeze([]),
      flushCompleteRecord: null,
      postFlushStateResetRecord: null,
    })
  }

  private render_finish(): void {
    const lifecycleEvents: SkyPainterFlushLifecycleEvent[] = []
    const flushDispatches: SkyPainterFlushDispatchItem[] = []
    const flushResults: SkyPainterFlushResultItem[] = []
    let lifecycleSequence = 0
    for (const item of this.mutableRenderItems) {
      item.dispatched = true
      item.terminalState = 'dispatched'
      lifecycleSequence += 1
      lifecycleEvents.push(Object.freeze({
        sequence: lifecycleSequence,
        phase: 'dispatch',
        orderIndex: item.orderIndex,
        type: item.type,
      }))
      flushDispatches.push(Object.freeze({
        orderIndex: item.orderIndex,
        compatibilityKey: item.compatibilityKey,
        type: item.type,
        flags: item.flags,
        textureRef: item.textureRef,
        pointCount: item.pointCount,
        dispatched: true as const,
      }))

      item.flushed = true
      item.released = true
      item.terminalState = 'released'
      lifecycleSequence += 1
      lifecycleEvents.push(Object.freeze({
        sequence: lifecycleSequence,
        phase: 'release',
        orderIndex: item.orderIndex,
        type: item.type,
      }))
      flushResults.push(Object.freeze({
        orderIndex: item.orderIndex,
        compatibilityKey: item.compatibilityKey,
        type: item.type,
        flags: item.flags,
        textureRef: item.textureRef,
        pointCount: item.pointCount,
        flushed: true as const,
        released: true as const,
      }))
    }
    const flushCompleteRecord: SkyPainterFlushCompleteRecord = Object.freeze({
      frameIndex: this.frameIndex,
      flushedItemCount: this.mutableRenderItems.length,
      dispatchCount: flushDispatches.length,
      releaseCount: flushResults.length,
    })
    lifecycleSequence += 1
    lifecycleEvents.push(Object.freeze({
      sequence: lifecycleSequence,
      phase: 'flush_complete',
      orderIndex: null,
      type: null,
    }))
    const postFlushStateResetRecord: SkyPainterPostFlushStateResetRecord = Object.freeze({
      frameIndex: this.frameIndex,
      glStateResetMode: 'cpu_modeled',
    })
    lifecycleSequence += 1
    lifecycleEvents.push(Object.freeze({
      sequence: lifecycleSequence,
      phase: 'post_flush_state_reset',
      orderIndex: null,
      type: null,
    }))
    const flushedPointItems = Object.freeze(this.mutableRenderItems.map((item) => Object.freeze({
      type: item.type,
      mode: item.mode,
      flags: item.flags,
      textureRef: item.textureRef,
      compatibilityKey: item.compatibilityKey,
      orderIndex: item.orderIndex,
      halo: item.halo,
      pointCount: item.pointCount,
      capacity: item.capacity,
      flushed: item.flushed,
      dispatched: item.dispatched,
      released: item.released,
      terminalState: item.terminalState,
      points2d: Object.freeze([...item.points2d]),
      points3d: Object.freeze([...item.points3d]),
    })))
    this.renderBackendFrame = Object.freeze({
      ...this.renderBackendFrame,
      pointItems: flushedPointItems,
      flushDispatches: Object.freeze(flushDispatches),
      flushResults: Object.freeze(flushResults),
      flushLifecycleEvents: Object.freeze(lifecycleEvents),
      flushCompleteRecord,
      postFlushStateResetRecord,
      flushReady: true,
    })
    this.mutableRenderItems.length = 0
  }

  private get_item(type: SkyPainterRenderItemType, pointCount: number, textureRef: string | null): {
    type: SkyPainterRenderItemType
    mode: SkyPainterMode.MODE_POINTS
    flags: number
    textureRef: string | null
    compatibilityKey: string
    orderIndex: number
    halo: number
    pointCount: number
    capacity: number
    flushed: boolean
    dispatched: boolean
    released: boolean
    terminalState: 'queued' | 'dispatched' | 'released'
    points2d: SkyPainterPointItem2D[]
    points3d: SkyPainterPointItem3D[]
  } {
    const desiredCompatibilityKey = buildItemCompatibilityKey({
      type,
      flags: this.flags,
      halo: this.pointsHalo,
      textureRef,
    })

    let index = this.mutableRenderItems.length - 1
    while (index >= 0) {
      const item = this.mutableRenderItems[index]
      if (
        item.compatibilityKey === desiredCompatibilityKey &&
        item.capacity > item.pointCount + pointCount &&
        !item.flushed
      ) {
        return item
      }
      if ((item.flags & SkyPainterFlags.PAINTER_ALLOW_REORDER) === 0) {
        break
      }
      index -= 1
    }

    this.itemCreateSequence += 1
    const newItem = {
      type,
      mode: SkyPainterMode.MODE_POINTS as SkyPainterMode.MODE_POINTS,
      flags: this.flags,
      textureRef,
      compatibilityKey: desiredCompatibilityKey,
      orderIndex: this.itemCreateSequence,
      halo: this.pointsHalo,
      pointCount: 0,
      capacity: 4096,
      flushed: false,
      dispatched: false,
      released: false,
      terminalState: 'queued' as const,
      points2d: [] as SkyPainterPointItem2D[],
      points3d: [] as SkyPainterPointItem3D[],
    }
    this.mutableRenderItems.push(newItem)
    return newItem
  }

  private window_to_ndc(win: [number, number]): [number, number] {
    const fbWidth = this.renderBackendFrame.framebufferWidth > 0 ? this.renderBackendFrame.framebufferWidth : 1
    const fbHeight = this.renderBackendFrame.framebufferHeight > 0 ? this.renderBackendFrame.framebufferHeight : 1
    const x = (win[0] * this.renderBackendFrame.scale / fbWidth) * 2 - 1
    const y = 1 - (win[1] * this.renderBackendFrame.scale / fbHeight) * 2
    return [x, y]
  }

  private render_points_2d(n: number, points: readonly SkyPainterPoint[]): void {
    const maxPoints = 4096
    const count = Math.min(n, maxPoints, points.length)
    if (count <= 0) {
      return
    }

    const item = this.get_item(
      'ITEM_POINTS',
      count,
      this.textureBindings[SkyPainterTextureSlot.PAINTER_TEX_COLOR],
    )

    for (let index = 0; index < count; index += 1) {
      const point = points[index]
      item.points2d.push({
        screenPos: [point.pos[0], point.pos[1]],
        ndcPos: this.window_to_ndc(point.pos),
        size: point.size * this.renderBackendFrame.scale,
        color: [point.color[0], point.color[1], point.color[2], point.color[3]],
      })
      item.pointCount += 1
    }
  }

  private render_points_3d(n: number, points: readonly SkyPainterPoint3D[]): void {
    const maxPoints = 4096
    const count = Math.min(n, maxPoints, points.length)
    if (count <= 0) {
      return
    }

    const item = this.get_item(
      'ITEM_POINTS_3D',
      count,
      this.textureBindings[SkyPainterTextureSlot.PAINTER_TEX_COLOR],
    )

    let nextDepthMin = this.renderBackendFrame.depthMin
    let nextDepthMax = this.renderBackendFrame.depthMax

    for (let index = 0; index < count; index += 1) {
      const point = points[index]
      item.points3d.push({
        viewPos: [point.pos[0], point.pos[1], point.pos[2]],
        size: point.size * this.renderBackendFrame.scale,
        color: [point.color[0], point.color[1], point.color[2], point.color[3]],
      })
      item.pointCount += 1
      nextDepthMin = Math.min(nextDepthMin, point.pos[2])
      nextDepthMax = Math.max(nextDepthMax, point.pos[2])
    }

    this.renderBackendFrame = Object.freeze({
      ...this.renderBackendFrame,
      depthMin: nextDepthMin,
      depthMax: nextDepthMax,
    })
  }

  private deriveCullFlippedFromProjectionFlags(projectionFlags: number): boolean {
    const flipHorizontal = (projectionFlags & SKY_PROJ_FLIP_HORIZONTAL) !== 0
    const flipVertical = (projectionFlags & SKY_PROJ_FLIP_VERTICAL) !== 0
    return flipHorizontal !== flipVertical
  }

  private snapshotBatchState(): SkyPainterBatchStateSnapshot {
    return {
      mode: this.mode,
      color: [...this.color] as [number, number, number, number],
      flags: this.flags,
      textureBindings: {
        [SkyPainterTextureSlot.PAINTER_TEX_COLOR]: this.textureBindings[SkyPainterTextureSlot.PAINTER_TEX_COLOR],
        [SkyPainterTextureSlot.PAINTER_TEX_NORMAL]: this.textureBindings[SkyPainterTextureSlot.PAINTER_TEX_NORMAL],
      },
      projection: this.projectionState,
      clipping: this.clippingState,
    }
  }
}

export function createSkyPainterPortState(): SkyPainterPortState {
  return new SkyPainterPortState()
}
