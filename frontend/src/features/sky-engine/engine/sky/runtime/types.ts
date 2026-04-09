import type { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import type { Engine } from '@babylonjs/core/Engines/engine'
import type { Scene } from '@babylonjs/core/scene'
import type { SkyEngineVisualCalibration } from '../../../types'

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

export interface SkyCoreServicesLifecycleContext<TProps, TRuntime extends SkyCoreRenderRefs, TServices> {
  readonly runtime: TRuntime
  readonly services: TServices
  getProps: () => TProps
  requestRender: () => void
}

export interface SkyCoreServicesUpdateContext<TProps, TRuntime extends SkyCoreRenderRefs, TServices>
  extends SkyCoreServicesLifecycleContext<TProps, TRuntime, TServices> {
  readonly deltaSeconds: number
}

export interface SkyCoreConfigWithServices<TProps, TRuntime extends SkyCoreRenderRefs, TServices> extends SkyCoreConfig<TProps, TRuntime> {
  readonly createServices: (config: SkyCoreServicesFactoryConfig<TProps, TRuntime>) => TServices
  readonly syncServices?: (services: TServices, props: TProps) => void
  readonly startServices?: (context: SkyCoreServicesLifecycleContext<TProps, TRuntime, TServices>) => void
  readonly updateServices?: (context: SkyCoreServicesUpdateContext<TProps, TRuntime, TServices>) => void
  readonly stopServices?: (context: SkyCoreServicesLifecycleContext<TProps, TRuntime, TServices>) => void
  readonly disposeServices?: (context: SkyCoreServicesLifecycleContext<TProps, TRuntime, TServices>) => void
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

export interface SkyBrightnessExposureState {
  readonly skyBrightness: number
  readonly limitingMagnitude: number
  readonly starVisibility: number
  readonly starFieldBrightness: number
  readonly atmosphereExposure: number
  readonly backdropAlpha: number
  readonly nightSkyZenithLuminance: number
  readonly nightSkyHorizonLuminance: number
  readonly visualCalibration: SkyEngineVisualCalibration
}
