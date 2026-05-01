import {
  computeStellariumCorePainterLimits,
  STELLARIUM_CORE_DEFAULT_PAINTER_PARAMS,
} from './stellariumPainterLimits'

export const STELLARIUM_CORE_SOURCE_FUNCTIONS = [
  'core_init',
  'core_release',
  'core_update',
  'core_render',
  'core_add_task',
  'core_get_proj',
  'core_get_point_for_mag',
  'core_report_luminance_in_fov',
] as const

export type StellariumCoreSourceFunction = typeof STELLARIUM_CORE_SOURCE_FUNCTIONS[number]

export interface StellariumCoreTask<TUser = unknown> {
  readonly id: number
  readonly user: TUser
}

export type StellariumCoreTaskCallback<TUser = unknown> = (
  task: StellariumCoreTask<TUser>,
  deltaSeconds: number,
) => number

export interface StellariumCoreInitInput {
  readonly windowWidth: number
  readonly windowHeight: number
  readonly pixelScale: number
  readonly clockSeconds: number
}

export interface StellariumCoreUpdateInput {
  readonly nowSeconds?: number
  readonly deltaSeconds?: number
  readonly updateModules?: (deltaSeconds: number) => void
}

export interface StellariumCoreRenderInput {
  readonly windowWidth: number
  readonly windowHeight: number
  readonly pixelScale: number
  readonly fovDegrees?: number | null
  readonly tonemapper?: {
    readonly p?: number | null
    readonly exposure?: number | null
    readonly lwmax?: number | null
  } | null
  readonly updateObserver?: () => void
}

export interface StellariumCoreProjectionState {
  readonly windowWidth: number
  readonly windowHeight: number
  readonly pixelScale: number
  readonly framebufferWidth: number
  readonly framebufferHeight: number
  readonly fovDegrees: number
}

export interface StellariumCoreRenderState {
  readonly frameIndex: number
  readonly projection: StellariumCoreProjectionState
  readonly painterLimits: {
    readonly starsLimitMag: number
    readonly hintsLimitMag: number
    readonly hardLimitMag: number
  }
}

interface QueuedTask<TUser = unknown> {
  readonly task: StellariumCoreTask<TUser>
  readonly callback: StellariumCoreTaskCallback<TUser>
}

function finiteOr(value: number | null | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function finitePositiveOr(value: number | null | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
}

/**
 * Source-shaped owner for the first `core.c` / `core.h` runtime slice.
 *
 * Ported source anchors:
 * - `core_init`: window/pixel scale/global defaults initialization.
 * - `core_update`: monotonic dt clamp, task queue execution, ordered module-update boundary.
 * - `core_render` / `core_get_proj`: render frame index, projection inputs, painter limit derivation.
 * - `core_add_task`: queued task callback lifecycle; non-zero callback result removes the task.
 * - `core_report_luminance_in_fov`: only raises `lwmax` and records the fast-adaptation flag at the max.
 *
 * This is intentionally not a renderer replacement. It centralizes source-owned
 * state so existing `SkyCore` wiring can be retired incrementally as adjacent
 * `module.c`, `obj.c`, `projection.c`, and `painter.c` ports land.
 */
export class StellariumCoreRuntime {
  private initialized = false
  private windowWidth = 1
  private windowHeight = 1
  private pixelScale = 1
  private clockSeconds = 0
  private nextTaskId = 1
  private tasks: QueuedTask[] = []
  private frameIndex = 0
  private starScaleScreenFactor = 1
  private lwmax = STELLARIUM_CORE_DEFAULT_PAINTER_PARAMS.tonemapperLwmax
  private readonly lwmaxMin = 0.052
  private fastAdaptation = false
  private lastRenderState: StellariumCoreRenderState | null = null

  core_init(input: StellariumCoreInitInput) {
    this.windowWidth = finitePositiveOr(input.windowWidth, 1)
    this.windowHeight = finitePositiveOr(input.windowHeight, 1)
    this.pixelScale = finitePositiveOr(input.pixelScale, 1)
    this.clockSeconds = finiteOr(input.clockSeconds, 0)
    this.initialized = true
    this.applyCoreDefaults()
  }

  core_release() {
    this.tasks = []
    this.lastRenderState = null
    this.initialized = false
  }

  core_add_task<TUser = unknown>(callback: StellariumCoreTaskCallback<TUser>, user: TUser): StellariumCoreTask<TUser> {
    const task: StellariumCoreTask<TUser> = {
      id: this.nextTaskId,
      user,
    }
    this.nextTaskId += 1
    this.tasks.push({
      task,
      callback: callback as StellariumCoreTaskCallback,
    })
    return task
  }

  core_update(input: StellariumCoreUpdateInput = {}) {
    this.ensureInitialized()
    const deltaSeconds = this.resolveDeltaSeconds(input)
    this.updateStarScaleScreenFactor()
    this.lwmax = this.lwmaxMin

    const remainingTasks: QueuedTask[] = []
    for (const queuedTask of this.tasks) {
      const result = queuedTask.callback(queuedTask.task, deltaSeconds)
      if (result === 0) {
        remainingTasks.push(queuedTask)
      }
    }
    this.tasks = remainingTasks

    input.updateModules?.(deltaSeconds)

    return {
      deltaSeconds,
      taskCount: this.tasks.length,
      starScaleScreenFactor: this.starScaleScreenFactor,
    }
  }

  core_render(input: StellariumCoreRenderInput): StellariumCoreRenderState {
    this.ensureInitialized()
    this.windowWidth = finitePositiveOr(input.windowWidth, this.windowWidth)
    this.windowHeight = finitePositiveOr(input.windowHeight, this.windowHeight)
    this.pixelScale = finitePositiveOr(input.pixelScale, this.pixelScale)
    input.updateObserver?.()

    this.frameIndex += 1
    const fovDegrees = finitePositiveOr(input.fovDegrees, 60)
    const tonemapper = input.tonemapper ?? null
    const painterLimits = computeStellariumCorePainterLimits({
      ...STELLARIUM_CORE_DEFAULT_PAINTER_PARAMS,
      tonemapperP: finitePositiveOr(tonemapper?.p, STELLARIUM_CORE_DEFAULT_PAINTER_PARAMS.tonemapperP),
      tonemapperExposure: finitePositiveOr(
        tonemapper?.exposure,
        STELLARIUM_CORE_DEFAULT_PAINTER_PARAMS.tonemapperExposure,
      ),
      tonemapperLwmax: finitePositiveOr(tonemapper?.lwmax, STELLARIUM_CORE_DEFAULT_PAINTER_PARAMS.tonemapperLwmax),
      fovDeg: fovDegrees,
      viewportMinSizePx: Math.max(1, Math.min(this.windowWidth, this.windowHeight)),
    })

    this.lastRenderState = {
      frameIndex: this.frameIndex,
      projection: {
        windowWidth: this.windowWidth,
        windowHeight: this.windowHeight,
        pixelScale: this.pixelScale,
        framebufferWidth: this.windowWidth * this.pixelScale,
        framebufferHeight: this.windowHeight * this.pixelScale,
        fovDegrees,
      },
      painterLimits,
    }
    return this.lastRenderState
  }

  core_get_proj() {
    return this.lastRenderState?.projection ?? {
      windowWidth: this.windowWidth,
      windowHeight: this.windowHeight,
      pixelScale: this.pixelScale,
      framebufferWidth: this.windowWidth * this.pixelScale,
      framebufferHeight: this.windowHeight * this.pixelScale,
      fovDegrees: 60,
    }
  }

  core_report_luminance_in_fov(luminance: number, fastAdaptation: boolean) {
    if (!Number.isFinite(luminance) || luminance <= this.lwmax) {
      return
    }
    this.fastAdaptation = fastAdaptation
    this.lwmax = luminance
  }

  snapshot() {
    return {
      initialized: this.initialized,
      frameIndex: this.frameIndex,
      taskCount: this.tasks.length,
      window: {
        width: this.windowWidth,
        height: this.windowHeight,
        pixelScale: this.pixelScale,
      },
      starScaleScreenFactor: this.starScaleScreenFactor,
      projection: this.core_get_proj(),
      painterLimits: this.lastRenderState?.painterLimits ?? null,
      luminance: {
        lwmax: this.lwmax,
        fastAdaptation: this.fastAdaptation,
      },
    }
  }

  private ensureInitialized() {
    if (!this.initialized) {
      this.core_init({
        windowWidth: this.windowWidth,
        windowHeight: this.windowHeight,
        pixelScale: this.pixelScale,
        clockSeconds: this.clockSeconds,
      })
    }
  }

  private applyCoreDefaults() {
    this.starScaleScreenFactor = 1
    this.lwmax = STELLARIUM_CORE_DEFAULT_PAINTER_PARAMS.tonemapperLwmax
    this.fastAdaptation = false
  }

  private resolveDeltaSeconds(input: StellariumCoreUpdateInput) {
    if (typeof input.deltaSeconds === 'number' && Number.isFinite(input.deltaSeconds)) {
      return Math.max(input.deltaSeconds, 0.001)
    }

    const nowSeconds = finiteOr(input.nowSeconds, this.clockSeconds)
    const deltaSeconds = Math.max(nowSeconds - this.clockSeconds, 0.001)
    this.clockSeconds = nowSeconds
    return deltaSeconds
  }

  private updateStarScaleScreenFactor() {
    const screenSize = Math.min(this.windowWidth, this.windowHeight)
    const factor = screenSize / 600
    this.starScaleScreenFactor = Math.min(Math.max(0.7, factor), 1.5)
  }
}
