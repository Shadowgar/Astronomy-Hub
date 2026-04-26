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
  ALIGN_LEFT = 1 << 0,
  ALIGN_CENTER = 1 << 1,
  ALIGN_RIGHT = 1 << 2,
  ALIGN_TOP = 1 << 3,
  ALIGN_MIDDLE = 1 << 4,
  ALIGN_BOTTOM = 1 << 5,
  ALIGN_BASELINE = 1 << 6,
}

export enum SkyPainterTextEffectFlags {
  TEXT_UPPERCASE = 1 << 0,
  TEXT_BOLD = 1 << 1,
  TEXT_SMALL_CAP = 1 << 2,
  TEXT_DEMI_BOLD = 1 << 3,
  TEXT_FLOAT = 1 << 5,
  TEXT_SPACED = 1 << 6,
  TEXT_SEMI_SPACED = 1 << 7,
  TEXT_MULTILINES = 1 << 8,
}

export enum SkyPainterMode {
  MODE_TRIANGLES = 0,
  MODE_LINES = 1,
  MODE_POINTS = 2,
}

export enum SkyPainterFlags {
  PAINTER_ADD = 1 << 0,
  PAINTER_HIDE_BELOW_HORIZON = 1 << 2,
  PAINTER_PLANET_SHADER = 1 << 4,
  PAINTER_RING_SHADER = 1 << 5,
  PAINTER_IS_MOON = 1 << 6,
  PAINTER_ATMOSPHERE_SHADER = 1 << 8,
  PAINTER_FOG_SHADER = 1 << 9,
  PAINTER_ENABLE_DEPTH = 1 << 10,
  PAINTER_SKIP_DISCONTINUOUS = 1 << 14,
  PAINTER_ALLOW_REORDER = 1 << 15,
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

export interface SkyPainterQueuedCall {
  readonly fn: string
}

/**
 * Source-faithful boundary class that mirrors `painter.h` callable naming.
 * All methods are currently no-op queue/state mutations only.
 */
export class SkyPainterPortState {
  frameIndex = 0
  prepared = false
  debug = false
  color: [number, number, number, number] = [1, 1, 1, 1]
  fbSize: [number, number] = [1, 1]
  pixelScale = 1
  flags = 0
  contrast = 1
  starsLimitMag: number | null = null
  hintsLimitMag: number | null = null
  hardLimitMag: number | null = null
  readonly drawQueue: SkyPainterQueuedCall[] = []

  reset_for_frame(input: SkyPainterFrameResetInput): void {
    this.frameIndex = input.frameIndex
    this.prepared = false
    this.fbSize = [input.framebufferWidth, input.framebufferHeight]
    this.pixelScale = input.pixelScale
    this.starsLimitMag = input.starsLimitMag
    this.hintsLimitMag = input.hintsLimitMag
    this.hardLimitMag = input.hardLimitMag
    this.drawQueue.length = 0
  }

  // painter.c::paint_prepare
  paint_prepare(_winW: number, _winH: number, _scale: number): number {
    this.prepared = true
    this.record('paint_prepare')
    return 0
  }

  // painter.c::paint_finish
  paint_finish(): number {
    this.record('paint_finish')
    return 0
  }

  painter_set_texture(): void { this.record('painter_set_texture') }
  paint_2d_points(_n: number, _points: readonly SkyPainterPoint[]): number { this.record('paint_2d_points'); return 0 }
  paint_3d_points(_n: number, _points: readonly SkyPainterPoint3D[]): number { this.record('paint_3d_points'); return 0 }
  paint_quad(): number { this.record('paint_quad'); return 0 }
  paint_quad_contour(): number { this.record('paint_quad_contour'); return 0 }
  paint_tile_contour(): number { this.record('paint_tile_contour'); return 0 }
  paint_line(): number { this.record('paint_line'); return 0 }
  paint_linestring(): number { this.record('paint_linestring'); return 0 }
  paint_mesh(): number { this.record('paint_mesh'); return 0 }
  paint_text_bounds(): number { this.record('paint_text_bounds'); return 0 }
  paint_text(): number { this.record('paint_text'); return 0 }
  paint_texture(): number { this.record('paint_texture'); return 0 }
  paint_debug(value: boolean): void { this.debug = value; this.record('paint_debug') }
  painter_is_quad_clipped(): boolean { this.record('painter_is_quad_clipped'); return false }
  painter_is_healpix_clipped(): boolean { this.record('painter_is_healpix_clipped'); return false }
  painter_is_planet_healpix_clipped(): boolean { this.record('painter_is_planet_healpix_clipped'); return false }
  painter_is_point_clipped_fast(): boolean { this.record('painter_is_point_clipped_fast'); return false }
  painter_is_2d_point_clipped(): boolean { this.record('painter_is_2d_point_clipped'); return false }
  painter_is_2d_circle_clipped(): boolean { this.record('painter_is_2d_circle_clipped'); return false }
  painter_is_cap_clipped(): boolean { this.record('painter_is_cap_clipped'); return false }
  painter_update_clip_info(): void { this.record('painter_update_clip_info') }
  paint_orbit(): number { this.record('paint_orbit'); return 0 }
  paint_2d_ellipse(): number { this.record('paint_2d_ellipse'); return 0 }
  paint_2d_rect(): number { this.record('paint_2d_rect'); return 0 }
  paint_2d_line(): number { this.record('paint_2d_line'); return 0 }
  paint_cap(): void { this.record('paint_cap') }
  painter_3d_model_exists(): boolean { this.record('painter_3d_model_exists'); return false }
  painter_get_3d_model_bounds(): number { this.record('painter_get_3d_model_bounds'); return 0 }
  paint_3d_model(): void { this.record('paint_3d_model') }
  painter_project_ellipse(): void { this.record('painter_project_ellipse') }
  painter_project(): boolean { this.record('painter_project'); return true }
  painter_unproject(): boolean { this.record('painter_unproject'); return true }

  private record(fn: string): void {
    this.drawQueue.push({ fn })
  }
}

export function createSkyPainterPortState(): SkyPainterPortState {
  return new SkyPainterPortState()
}
