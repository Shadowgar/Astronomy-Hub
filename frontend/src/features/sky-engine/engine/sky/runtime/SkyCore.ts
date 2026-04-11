import type { SkyModule } from './SkyModule'
import type {
  SkyCoreConfigWithServices,
  SkyCoreRenderRefs,
  SkyRuntimePerfTelemetrySnapshot,
  SkyModuleContext,
  SkyRenderContext,
  SkyUpdateContext,
} from './types'
import { commitRuntimePerfTelemetry } from './perfTelemetry'

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
  private requestedRender = true
  private frameDirty = false
  private currentModuleCostMs: Record<string, number> = {}
  private currentModuleUpdateCostMs: Record<string, number> = {}
  private currentModuleRenderCostMs: Record<string, number> = {}

  constructor(config: SkyCoreConfigWithServices<TProps, TRuntime, TServices>) {
    this.config = config
    this.latestProps = config.initialProps
    this.propsVersion = config.initialPropsVersion ?? 0
  }

  registerModule(module: SkyModule<TProps, TRuntime, TServices>) {
    this.modules = [...this.modules, module].sort((left, right) => left.renderOrder - right.renderOrder || left.id.localeCompare(right.id))

    if (this.runtime && module.start) {
      module.start(this.getModuleContext())
    }
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
    this.requestedRender = true
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
      const deltaSeconds = Math.min(0.05, (now - this.lastFrameTime) * 0.001)
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
      const servicesUpdateStartMs = performance.now()
      this.config.updateServices?.({
        ...this.getServicesLifecycleContext(),
        deltaSeconds,
      })
      const servicesUpdateMs = performance.now() - servicesUpdateStartMs
      const skyCoreUpdateStartMs = performance.now()
      const updateStartMs = performance.now()
      this.update(deltaSeconds)
      const updateMs = performance.now() - updateStartMs
      const skyCoreUpdateTotalMs = performance.now() - skyCoreUpdateStartMs

      const shouldRenderFrame = this.requestedRender || this.frameDirty || this.renderedPropsVersion !== this.propsVersion

      if (!shouldRenderFrame) {
        this.commitPerfSnapshot({
          frameIndex: this.runtime.runtimePerfTelemetry?.latest.frameIndex ?? 0,
          shouldRenderFrame: false,
          servicesUpdateMs,
          skyCoreUpdateTotalMs,
          skyCoreRenderTotalMs: 0,
          renderLoopMs: performance.now() - frameStartMs,
          updateMs,
          renderModulesMs: 0,
          sceneRenderMs: 0,
          frameTotalMs: performance.now() - frameStartMs,
          moduleMs: { ...this.currentModuleCostMs },
          moduleUpdateMs: { ...this.currentModuleUpdateCostMs },
          moduleRenderMs: { ...this.currentModuleRenderCostMs },
          stepMs: this.runtime.runtimePerfTelemetry?.latest.stepMs ?? {},
          starCount: this.runtime.runtimePerfTelemetry?.latest.starCount ?? 0,
          objectCount: this.runtime.runtimePerfTelemetry?.latest.objectCount ?? 0,
        })
        return
      }

      const skyCoreRenderStartMs = performance.now()
      const renderStartMs = performance.now()
      this.render()
      const renderModulesMs = performance.now() - renderStartMs
      const sceneRenderStartMs = performance.now()
      this.runtime.scene.render()
      const sceneRenderMs = performance.now() - sceneRenderStartMs
      const skyCoreRenderTotalMs = performance.now() - skyCoreRenderStartMs
      const frameTotalMs = performance.now() - frameStartMs
      this.requestedRender = false
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

  update(deltaSeconds: number) {
    if (!this.runtime) {
      return
    }

    const context: SkyUpdateContext<TProps, TRuntime, TServices> = {
      ...this.getModuleContext(),
      deltaSeconds,
    }
    this.modules.forEach((module) => {
      const startMs = performance.now()
      module.update?.(context)
      const elapsedMs = performance.now() - startMs
      this.currentModuleCostMs[module.id] = (this.currentModuleCostMs[module.id] ?? 0) + elapsedMs
      this.currentModuleUpdateCostMs[module.id] = (this.currentModuleUpdateCostMs[module.id] ?? 0) + elapsedMs
    })
  }

  render() {
    if (!this.runtime) {
      return
    }

    const context: SkyRenderContext<TProps, TRuntime, TServices> = this.getModuleContext()
    this.modules.forEach((module) => {
      const startMs = performance.now()
      module.render?.(context)
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
    this.requestRender()
  }

  requestRender() {
    this.requestedRender = true
  }

  dispatchInput(handler: (runtime: TRuntime, services: TServices, props: TProps) => void) {
    if (!this.runtime || !this.services) {
      return
    }

    handler(this.runtime, this.services, this.latestProps)
    this.requestRender()
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

  private getModuleContext(): SkyModuleContext<TProps, TRuntime, TServices> {
    if (!this.runtime || !this.services) {
      throw new Error('SkyCore runtime is not started')
    }

    return {
      runtime: this.runtime,
      services: this.services,
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
