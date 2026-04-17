import type { SkyModuleContext, SkyRenderContext, SkyUpdateContext, SkyCoreRenderRefs } from './types'

export interface SkyModule<TProps, TRuntime extends SkyCoreRenderRefs = SkyCoreRenderRefs, TServices = unknown> {
  readonly id: string
  readonly renderOrder: number
  start?(context: SkyModuleContext<TProps, TRuntime, TServices>): void
  update?(context: SkyUpdateContext<TProps, TRuntime, TServices>): void
  render?(context: SkyRenderContext<TProps, TRuntime, TServices>): void
  /** Stellarium `post_render` after `paint_finish` / `scene.render()` (see `core_render` in `core.c`). */
  postRender?(context: SkyRenderContext<TProps, TRuntime, TServices>): void
  stop?(context: SkyModuleContext<TProps, TRuntime, TServices>): void
  dispose?(context: SkyModuleContext<TProps, TRuntime, TServices>): void
}
