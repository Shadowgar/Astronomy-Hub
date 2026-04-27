import type { SkyModule } from './SkyModule'
import type {
  SkyCoreConfigWithServices,
  SkyCoreFrameState,
  SkyCoreRenderRefs,
  SkyRuntimePerfTelemetrySnapshot,
  SkyCoreServicesUpdateContext,
  SkyModuleContext,
  SkyRenderContext,
  SkyUpdateContext,
} from './types'
import { commitRuntimePerfTelemetry } from './perfTelemetry'
import { createSkyPainterPortState } from './renderer/painterPort'

export class SkyCore<TProps, TRuntime extends SkyCoreRenderRefs, TServices> {
  private readonly config: SkyCoreConfigWithServices<TProps, TRuntime, TServices>
  private readonly handleWindowResize = () => {
    this.resize()
  }

  private runtime: TRuntime | null = null
  private services: TServices | null = null
  private modules: Array<SkyModule<TProps, TRuntime, TServices>> = []
  private latestProps: TProps
  private propsVersion: number
  private renderedPropsVersion = -1
  private lastFrameTime = 0
  private started = false
  private frameDirty = false
  private currentModuleCostMs: Record<string, number> = {}
  private currentModuleUpdateCostMs: Record<string, number> = {}
  private currentModuleRenderCostMs: Record<string, number> = {}
  private frameCounter = 0
  private readonly painterState = createSkyPainterPortState()

  constructor(config: SkyCoreConfigWithServices<TProps, TRuntime, TServices>) {
    this.config = config
    this.latestProps = config.initialProps
    this.propsVersion = config.initialPropsVersion ?? 0
  }

  registerModule(module: SkyModule<TProps, TRuntime, TServices>) {
    this.modules = [...this.modules, module]
    this.sortModulesByRenderOrder()

    if (this.runtime && module.start) {
      module.start(this.getModuleContext())
    }
  }

  /** Stellarium `modules_sort_cmp` / `DL_SORT` before `module_update` / `obj_render` (`core.c`). */
  private sortModulesByRenderOrder() {
    this.modules = [...this.modules].sort(
      (left, right) => left.renderOrder - right.renderOrder || left.id.localeCompare(right.id),
    )
  }

  start() {
    if (this.started) {
      return
    }

    this.runtime = this.config.createRuntime({
      canvas: this.config.canvas,
      backgroundCanvas: this.config.backgroundCanvas,
      initialProps: this.latestProps,
    })
    this.services = this.config.createServices({
      runtime: this.runtime,
      initialProps: this.latestProps,
    })
    this.config.syncServices?.(this.services, this.latestProps)
    this.started = true
    this.renderedPropsVersion = -1
    this.lastFrameTime = performance.now()

    const context = this.getModuleContext()
    this.config.startServices?.(this.getServicesLifecycleContext())
    this.modules.forEach((module) => module.start?.(context))
    globalThis.addEventListener('resize', this.handleWindowResize)
    this.runtime.engine.runRenderLoop(() => {
      if (!this.runtime) {
        return
      }

      const frameStartMs = performance.now()
      const now = performance.now()
      const deltaSeconds = Math.max((now - this.lastFrameTime) * 0.001, 0.001)
      this.lastFrameTime = now
      this.frameDirty = false
      this.currentModuleCostMs = {}
      this.currentModuleUpdateCostMs = {}
      this.currentModuleRenderCostMs = {}
      this.modules.forEach((module) => {
        this.currentModuleCostMs[module.id] = 0
        this.currentModuleUpdateCostMs[module.id] = 0
        this.currentModuleRenderCostMs[module.id] = 0
      })
      if (this.runtime.runtimePerfTelemetry) {
        this.runtime.runtimePerfTelemetry.latest = {
          ...this.runtime.runtimePerfTelemetry.latest,
          stepMs: {},
        }
      }

      this.runFrameLifecycle(deltaSeconds, frameStartMs)
    })
  }

  /**
   * Stellarium `core_update` + `core_render` frame ownership.
   *
   * - `core_update`: service tick + update preamble + ordered `module_update`.
   * - `core_render`: render preamble + ordered `obj_render` + `scene.render` + ordered `post_render`.
   *
   * We intentionally execute this every engine frame (no React/dirty-frame skip gate)
   * to mirror native frame lifecycle ownership in `core.c`.
   */
  private runFrameLifecycle(deltaSeconds: number, frameStartMs: number) {
    if (!this.runtime) {
      return
    }

    const frameState = this.createFrameState(deltaSeconds)

    const servicesUpdateStartMs = performance.now()
    const markFrameDirty = () => {
      this.frameDirty = true
    }
    this.config.updateServices?.({
      ...this.getServicesLifecycleContext(),
      deltaSeconds,
      markFrameDirty,
    })
    const servicesUpdateMs = performance.now() - servicesUpdateStartMs

    const skyCoreUpdateStartMs = performance.now()
    const updateStartMs = performance.now()
    this.update(deltaSeconds, frameState)
    const updateMs = performance.now() - updateStartMs
    const skyCoreUpdateTotalMs = performance.now() - skyCoreUpdateStartMs

    const skyCoreRenderStartMs = performance.now()
    const renderStartMs = performance.now()
    this.render(frameState)
    const renderModulesMs = performance.now() - renderStartMs
    const sceneRenderStartMs = performance.now()
    this.runtime.scene.render()
    const sceneRenderMs = performance.now() - sceneRenderStartMs
    this.runModulePostRenders(frameState)
    const skyCoreRenderTotalMs = performance.now() - skyCoreRenderStartMs
    const frameTotalMs = performance.now() - frameStartMs

    this.renderedPropsVersion = this.propsVersion
    this.commitPerfSnapshot({
      frameIndex: (this.runtime.runtimePerfTelemetry?.latest.frameIndex ?? 0) + 1,
      shouldRenderFrame: true,
      servicesUpdateMs,
      skyCoreUpdateTotalMs,
      skyCoreRenderTotalMs,
      renderLoopMs: frameTotalMs,
      updateMs,
      renderModulesMs,
      sceneRenderMs,
      frameTotalMs,
      moduleMs: { ...this.currentModuleCostMs },
      moduleUpdateMs: { ...this.currentModuleUpdateCostMs },
      moduleRenderMs: { ...this.currentModuleRenderCostMs },
      stepMs: this.runtime.runtimePerfTelemetry?.latest.stepMs ?? {},
      starCount: this.runtime.runtimePerfTelemetry?.latest.starCount ?? 0,
      objectCount: this.runtime.runtimePerfTelemetry?.latest.objectCount ?? 0,
    })
  }

  stop() {
    if (!this.runtime || !this.started) {
      return
    }

    this.runtime.engine.stopRenderLoop()
    globalThis.removeEventListener('resize', this.handleWindowResize)
    this.config.stopServices?.(this.getServicesLifecycleContext())
    const context = this.getModuleContext()
    this.modules.forEach((module) => module.stop?.(context))
    this.started = false
  }

  update(deltaSeconds: number, frameState: SkyCoreFrameState) {
    if (!this.runtime) {
      return
    }

    this.sortModulesByRenderOrder()

    const preambleContext: SkyCoreServicesUpdateContext<TProps, TRuntime, TServices> = {
      ...this.getServicesLifecycleContext(),
      deltaSeconds,
      markFrameDirty: () => {
        this.frameDirty = true
      },
    }
    this.config.coreUpdatePreamble?.(preambleContext)

    const context: SkyUpdateContext<TProps, TRuntime, TServices> = {
      ...this.getModuleContext(frameState),
      deltaSeconds,
      frameState,
    }
    this.modules.forEach((module) => {
      const startMs = performance.now()
      module.update?.(context)
      const elapsedMs = performance.now() - startMs
      this.currentModuleCostMs[module.id] = (this.currentModuleCostMs[module.id] ?? 0) + elapsedMs
      this.currentModuleUpdateCostMs[module.id] = (this.currentModuleUpdateCostMs[module.id] ?? 0) + elapsedMs
    })
  }

  render(frameState: SkyCoreFrameState) {
    if (!this.runtime) {
      return
    }

    const context: SkyRenderContext<TProps, TRuntime, TServices> = {
      ...this.getModuleContext(frameState),
      frameState,
    }
    context.frameState.render.painter.reset_for_frame({
      frameIndex: context.frameState.frameIndex,
      windowWidth: context.frameState.render.windowWidth,
      windowHeight: context.frameState.render.windowHeight,
      pixelScale: context.frameState.render.pixelScale,
      framebufferWidth: context.frameState.render.framebufferWidth,
      framebufferHeight: context.frameState.render.framebufferHeight,
      starsLimitMag: context.frameState.render.starsLimitMag,
      hintsLimitMag: context.frameState.render.hintsLimitMag,
      hardLimitMag: context.frameState.render.hardLimitMag,
      projectionMode: this.resolveProjectionModeForPainter(context.services),
      projectionFlags: this.resolveProjectionFlagsForPainter(context.services),
    })
    context.frameState.render.painter.paint_prepare(
      context.frameState.render.windowWidth,
      context.frameState.render.windowHeight,
      context.frameState.render.pixelScale,
    )
    this.config.coreRenderPreamble?.(context)
    this.modules.forEach((module) => {
      const startMs = performance.now()
      module.render?.(context)
      const elapsedMs = performance.now() - startMs
      this.currentModuleCostMs[module.id] = (this.currentModuleCostMs[module.id] ?? 0) + elapsedMs
      this.currentModuleRenderCostMs[module.id] = (this.currentModuleRenderCostMs[module.id] ?? 0) + elapsedMs
    })
    context.frameState.render.painter.paint_finish()
  }

  private runModulePostRenders(frameState: SkyCoreFrameState) {
    if (!this.runtime) {
      return
    }

    const context: SkyRenderContext<TProps, TRuntime, TServices> = {
      ...this.getModuleContext(frameState),
      frameState,
    }
    this.modules.forEach((module) => {
      const startMs = performance.now()
      module.postRender?.(context)
      const elapsedMs = performance.now() - startMs
      this.currentModuleCostMs[module.id] = (this.currentModuleCostMs[module.id] ?? 0) + elapsedMs
      this.currentModuleRenderCostMs[module.id] = (this.currentModuleRenderCostMs[module.id] ?? 0) + elapsedMs
    })
  }

  syncProps(nextProps: TProps, propsVersion: number) {
    this.latestProps = nextProps
    this.propsVersion = propsVersion
    if (this.services) {
      this.config.syncServices?.(this.services, nextProps)
    }
  }

  requestRender() {
    this.frameDirty = true
  }

  dispatchInput(handler: (runtime: TRuntime, services: TServices, props: TProps) => void) {
    if (!this.runtime || !this.services) {
      return
    }

    handler(this.runtime, this.services, this.latestProps)
    this.requestRender()
  }

  withContext<TResult>(handler: (runtime: TRuntime, services: TServices, props: TProps) => TResult): TResult | undefined {
    if (!this.runtime || !this.services) {
      return undefined
    }

    return handler(this.runtime, this.services, this.latestProps)
  }

  resize() {
    if (!this.runtime) {
      return
    }

    this.runtime.engine.resize()
    this.requestRender()
  }

  dispose() {
    if (!this.runtime) {
      return
    }

    this.stop()
    const context = this.getModuleContext()
    this.modules.forEach((module) => module.dispose?.(context))
    this.config.disposeServices?.(this.getServicesLifecycleContext())
    this.runtime.scene.dispose()
    this.runtime.engine.dispose()
    this.runtime = null
    this.services = null
  }

  private getModuleContext(frameState: SkyCoreFrameState | null = null): SkyModuleContext<TProps, TRuntime, TServices> {
    if (!this.runtime || !this.services) {
      throw new Error('SkyCore runtime is not started')
    }

    return {
      runtime: this.runtime,
      services: this.services,
      frameState,
      getProps: () => this.latestProps,
      getPropsVersion: () => this.propsVersion,
      requestRender: () => {
        this.requestRender()
      },
      markFrameDirty: () => {
        this.frameDirty = true
      },
    }
  }

  private resolveProjectionModeForPainter(services: TServices): string | null {
    const projectionService = (services as {
      projectionService?: { getProjectionMode?: () => unknown }
    }).projectionService
    if (!projectionService || typeof projectionService.getProjectionMode !== 'function') {
      return null
    }
    const projectionMode = projectionService.getProjectionMode()
    return typeof projectionMode === 'string' ? projectionMode : null
  }

  private resolveProjectionFlagsForPainter(services: TServices): number {
    const projectionService = (services as {
      projectionService?: { getProjectionFlags?: () => unknown }
    }).projectionService
    if (!projectionService || typeof projectionService.getProjectionFlags !== 'function') {
      return 0
    }
    const projectionFlags = projectionService.getProjectionFlags()
    if (typeof projectionFlags !== 'number' || !Number.isFinite(projectionFlags)) {
      return 0
    }
    return projectionFlags | 0
  }

  private createFrameState(deltaSeconds: number): SkyCoreFrameState {
    if (!this.runtime) {
      throw new Error('SkyCore runtime is not started')
    }

    const engine = this.runtime.engine as unknown as {
      getRenderWidth?: () => number
      getRenderHeight?: () => number
      getHardwareScalingLevel?: () => number
    }
    const windowWidth = this.resolveFinitePositiveValue(this.runtime.canvas.clientWidth, engine.getRenderWidth?.(), 1)
    const windowHeight = this.resolveFinitePositiveValue(this.runtime.canvas.clientHeight, engine.getRenderHeight?.(), 1)
    const hardwareScalingLevel = this.resolveFinitePositiveValue(engine.getHardwareScalingLevel?.(), 1, 1)
    const pixelScale = hardwareScalingLevel > 0 ? 1 / hardwareScalingLevel : 1
    const corePainterLimits = this.runtime.corePainterLimits ?? null

    this.frameCounter += 1

    return {
      frameIndex: this.frameCounter,
      deltaSeconds,
      render: {
        painter: this.painterState,
        windowWidth,
        windowHeight,
        pixelScale,
        framebufferWidth: windowWidth * pixelScale,
        framebufferHeight: windowHeight * pixelScale,
        starsLimitMag: corePainterLimits?.starsLimitMag ?? null,
        hintsLimitMag: corePainterLimits?.hintsLimitMag ?? null,
        hardLimitMag: corePainterLimits?.hardLimitMag ?? null,
      },
    }
  }

  private resolveFinitePositiveValue(primary: number | undefined, fallback: number | undefined, defaultValue: number): number {
    if (primary !== undefined && Number.isFinite(primary) && primary > 0) {
      return primary
    }
    if (fallback !== undefined && Number.isFinite(fallback) && fallback > 0) {
      return fallback
    }
    return defaultValue
  }

  private getServicesLifecycleContext() {
    if (!this.runtime || !this.services) {
      throw new Error('SkyCore runtime is not started')
    }

    return {
      runtime: this.runtime,
      services: this.services,
      getProps: () => this.latestProps,
      requestRender: () => {
        this.requestRender()
      },
    }
  }

  private commitPerfSnapshot(snapshot: SkyRuntimePerfTelemetrySnapshot) {
    if (!this.runtime?.runtimePerfTelemetry) {
      return
    }

    commitRuntimePerfTelemetry(this.runtime.runtimePerfTelemetry, snapshot)
  }
}
