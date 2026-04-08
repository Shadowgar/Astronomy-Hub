import type { SkyModule } from './SkyModule'
import type { SkyCoreConfig, SkyCoreRenderRefs, SkyModuleContext, SkyRenderContext, SkyUpdateContext } from './types'

export class SkyCore<TProps, TRuntime extends SkyCoreRenderRefs> {
  private readonly config: SkyCoreConfig<TProps, TRuntime>

  private runtime: TRuntime | null = null
  private modules: Array<SkyModule<TProps, TRuntime>> = []
  private latestProps: TProps
  private propsVersion: number
  private renderedPropsVersion = -1
  private lastFrameTime = 0
  private started = false
  private requestedRender = true
  private frameDirty = false

  constructor(config: SkyCoreConfig<TProps, TRuntime>) {
    this.config = config
    this.latestProps = config.initialProps
    this.propsVersion = config.initialPropsVersion ?? 0
  }

  registerModule(module: SkyModule<TProps, TRuntime>) {
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
    this.started = true
    this.requestedRender = true
    this.renderedPropsVersion = -1
    this.lastFrameTime = performance.now()

    const context = this.getModuleContext()
    this.modules.forEach((module) => module.start?.(context))
    this.runtime.engine.runRenderLoop(() => {
      if (!this.runtime) {
        return
      }

      const now = performance.now()
      const deltaSeconds = Math.min(0.05, (now - this.lastFrameTime) * 0.001)
      this.lastFrameTime = now
      this.frameDirty = false
      this.update(deltaSeconds)

      const shouldRenderFrame = this.requestedRender || this.frameDirty || this.renderedPropsVersion !== this.propsVersion

      if (!shouldRenderFrame) {
        return
      }

      this.render()
      this.runtime.scene.render()
      this.requestedRender = false
      this.renderedPropsVersion = this.propsVersion
    })
  }

  stop() {
    if (!this.runtime || !this.started) {
      return
    }

    this.runtime.engine.stopRenderLoop()
    const context = this.getModuleContext()
    this.modules.forEach((module) => module.stop?.(context))
    this.started = false
  }

  update(deltaSeconds: number) {
    if (!this.runtime) {
      return
    }

    const context: SkyUpdateContext<TProps, TRuntime> = {
      ...this.getModuleContext(),
      deltaSeconds,
    }
    this.modules.forEach((module) => module.update?.(context))
  }

  render() {
    if (!this.runtime) {
      return
    }

    const context: SkyRenderContext<TProps, TRuntime> = this.getModuleContext()
    this.modules.forEach((module) => module.render?.(context))
  }

  syncProps(nextProps: TProps, propsVersion: number) {
    this.latestProps = nextProps
    this.propsVersion = propsVersion
    this.requestRender()
  }

  requestRender() {
    this.requestedRender = true
  }

  dispatchInput(handler: (runtime: TRuntime, props: TProps) => void) {
    if (!this.runtime) {
      return
    }

    handler(this.runtime, this.latestProps)
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
    this.runtime.scene.dispose()
    this.runtime.engine.dispose()
    this.runtime = null
  }

  private getModuleContext(): SkyModuleContext<TProps, TRuntime> {
    if (!this.runtime) {
      throw new Error('SkyCore runtime is not started')
    }

    return {
      runtime: this.runtime,
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
}
