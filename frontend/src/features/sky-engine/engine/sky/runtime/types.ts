import type { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import type { Engine } from '@babylonjs/core/Engines/engine'
import type { Scene } from '@babylonjs/core/scene'

export interface SkyCoreRenderRefs {
  readonly scene: Scene
  readonly engine: Engine
  readonly camera: UniversalCamera
  readonly canvas: HTMLCanvasElement
  readonly backgroundCanvas: HTMLCanvasElement
}

export interface SkyCoreConfig<TProps, TRuntime extends SkyCoreRenderRefs> {
  readonly canvas: HTMLCanvasElement
  readonly backgroundCanvas: HTMLCanvasElement
  readonly initialProps: TProps
  readonly initialPropsVersion?: number
  readonly createRuntime: (config: {
    canvas: HTMLCanvasElement
    backgroundCanvas: HTMLCanvasElement
    initialProps: TProps
  }) => TRuntime
}

export interface SkyCoreServicesFactoryConfig<TProps, TRuntime extends SkyCoreRenderRefs> {
  readonly runtime: TRuntime
  readonly initialProps: TProps
}

export interface SkyCoreConfigWithServices<TProps, TRuntime extends SkyCoreRenderRefs, TServices> extends SkyCoreConfig<TProps, TRuntime> {
  readonly createServices: (config: SkyCoreServicesFactoryConfig<TProps, TRuntime>) => TServices
  readonly syncServices?: (services: TServices, props: TProps) => void
}

export interface SkyModuleContext<TProps, TRuntime extends SkyCoreRenderRefs, TServices> {
  readonly runtime: TRuntime
  readonly services: TServices
  getProps: () => TProps
  getPropsVersion: () => number
  requestRender: () => void
  markFrameDirty: () => void
}

export interface SkyUpdateContext<TProps, TRuntime extends SkyCoreRenderRefs, TServices> extends SkyModuleContext<TProps, TRuntime, TServices> {
  readonly deltaSeconds: number
}

export interface SkyRenderContext<TProps, TRuntime extends SkyCoreRenderRefs, TServices> extends SkyModuleContext<TProps, TRuntime, TServices> {}
