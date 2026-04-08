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

export interface SkyModuleContext<TProps, TRuntime extends SkyCoreRenderRefs> {
  readonly runtime: TRuntime
  getProps: () => TProps
  getPropsVersion: () => number
  requestRender: () => void
  markFrameDirty: () => void
}

export interface SkyUpdateContext<TProps, TRuntime extends SkyCoreRenderRefs> extends SkyModuleContext<TProps, TRuntime> {
  readonly deltaSeconds: number
}

export interface SkyRenderContext<TProps, TRuntime extends SkyCoreRenderRefs> extends SkyModuleContext<TProps, TRuntime> {}
