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
}

export interface SkyPainterProjectionState {
  readonly windowWidth: number
  readonly windowHeight: number
  readonly pixelScale: number
}

export interface SkyPainterClippingState {
  readonly clipInfoValid: boolean
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
  starsLimitMag: number | null = null
  hintsLimitMag: number | null = null
  hardLimitMag: number | null = null
  projectionState: SkyPainterProjectionState | null = null
  clippingState: SkyPainterClippingState = { clipInfoValid: false }

  private commandSequence = 0
  private frameFinalized = false
  private readonly frameCommands: SkyPainterQueuedCall[] = []
  private finalizedFrameCommands: ReadonlyArray<SkyPainterQueuedCall> = Object.freeze([])
  private finalizedFrameBatches: ReadonlyArray<SkyPainterFinalizedBatch> = Object.freeze([])
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

  get isFrameFinalized(): boolean {
    return this.frameFinalized
  }

  reset_for_frame(input: SkyPainterFrameResetInput): void {
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
    }
    this.clippingState = { clipInfoValid: false }
    this.commandSequence = 0
    this.frameFinalized = false
    this.frameCommands.length = 0
    this.finalizedFrameCommands = Object.freeze([])
    this.finalizedFrameBatches = Object.freeze([])
    this.textureBindings[SkyPainterTextureSlot.PAINTER_TEX_COLOR] = null
    this.textureBindings[SkyPainterTextureSlot.PAINTER_TEX_NORMAL] = null
  }

  // painter.c::paint_prepare
  paint_prepare(winW: number, winH: number, scale: number): number {
    this.prepared = true
    this.projectionState = {
      windowWidth: winW,
      windowHeight: winH,
      pixelScale: scale,
    }
    this.record('paint_prepare', {
      windowWidth: winW,
      windowHeight: winH,
      pixelScale: scale,
    })
    return 0
  }

  // painter.c::paint_finish
  paint_finish(): number {
    this.record('paint_finish', { finalized: true })
    this.finalizeFrameCommands()
    return 0
  }

  painter_set_texture(slot: SkyPainterTextureSlot = SkyPainterTextureSlot.PAINTER_TEX_COLOR, textureRef: string | null = null): void {
    this.textureBindings[slot] = textureRef
    this.record('painter_set_texture', { slot, textureRef })
  }
  paint_2d_points(n: number, points: readonly SkyPainterPoint[]): number {
    this.mode = SkyPainterMode.MODE_POINTS
    this.record('paint_2d_points', { count: n, points })
    return 0
  }
  paint_3d_points(n: number, points: readonly SkyPainterPoint3D[]): number {
    this.mode = SkyPainterMode.MODE_POINTS
    this.record('paint_3d_points', { count: n, points })
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
    this.clippingState = { clipInfoValid: true }
    this.record('painter_update_clip_info', { clipInfoValid: true })
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
    this.frameFinalized = true
  }

  private buildFinalizedBatches(commands: ReadonlyArray<SkyPainterQueuedCall>): SkyPainterFinalizedBatch[] {
    const batches: SkyPainterFinalizedBatch[] = []
    for (const command of commands) {
      if (!isStarsDrawIntentQueuedCall(command)) {
        continue
      }

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
