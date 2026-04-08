import type { SkyModuleContext, SkyRenderContext, SkyUpdateContext, SkyCoreRenderRefs } from './types'

export interface SkyModule<TProps, TRuntime extends SkyCoreRenderRefs = SkyCoreRenderRefs> {
  readonly id: string
  readonly renderOrder: number
  start?(context: SkyModuleContext<TProps, TRuntime>): void
  update?(context: SkyUpdateContext<TProps, TRuntime>): void
  render?(context: SkyRenderContext<TProps, TRuntime>): void
  stop?(context: SkyModuleContext<TProps, TRuntime>): void
  dispose?(context: SkyModuleContext<TProps, TRuntime>): void
}
