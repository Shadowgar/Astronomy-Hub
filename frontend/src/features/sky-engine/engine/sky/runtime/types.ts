import type { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import type { Engine } from '@babylonjs/core/Engines/engine'
import type { Scene } from '@babylonjs/core/scene'
import type { SkyEngineVisualCalibration } from '../../../types'
import type { SkyPainterPortState } from './renderer/painterPort'

export interface SkyCoreRenderRefs {
  readonly scene: Scene
  readonly engine: Engine
  readonly camera: UniversalCamera
  readonly canvas: HTMLCanvasElement
  readonly backgroundCanvas: HTMLCanvasElement
  readonly corePainterLimits?: {
    readonly starsLimitMag: number
    readonly hintsLimitMag: number
    readonly hardLimitMag: number
  } | null
  readonly runtimePerfTelemetry?: SkyRuntimePerfTelemetry
}

export interface SkyCoreRenderState {
  readonly painter: SkyPainterPortState
  readonly windowWidth: number
  readonly windowHeight: number
  readonly pixelScale: number
  readonly framebufferWidth: number
  readonly framebufferHeight: number
  readonly starsLimitMag: number | null
  readonly hintsLimitMag: number | null
  readonly hardLimitMag: number | null
}

export interface SkyCoreFrameState {
  readonly frameIndex: number
  readonly deltaSeconds: number
  readonly render: SkyCoreRenderState
}

export interface SkyRuntimePerfTelemetrySnapshot {
  readonly frameIndex: number
  readonly shouldRenderFrame: boolean
  readonly servicesUpdateMs: number
  readonly skyCoreUpdateTotalMs: number
  readonly skyCoreRenderTotalMs: number
  readonly renderLoopMs: number
  readonly updateMs: number
  readonly renderModulesMs: number
  readonly sceneRenderMs: number
  readonly frameTotalMs: number
  readonly moduleMs: Readonly<Record<string, number>>
  readonly moduleUpdateMs: Readonly<Record<string, number>>
  readonly moduleRenderMs: Readonly<Record<string, number>>
  readonly stepMs: Readonly<Record<string, number>>
  readonly starCount: number
  readonly objectCount: number
}

export interface SkyRuntimePerfTelemetry {
  latest: SkyRuntimePerfTelemetrySnapshot
  ema: SkyRuntimePerfTelemetrySnapshot
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
  markFrameDirty: () => void
}

export interface SkyCoreConfigWithServices<TProps, TRuntime extends SkyCoreRenderRefs, TServices> extends SkyCoreConfig<TProps, TRuntime> {
  readonly createServices: (config: SkyCoreServicesFactoryConfig<TProps, TRuntime>) => TServices
  readonly syncServices?: (services: TServices, props: TProps) => void
  readonly startServices?: (context: SkyCoreServicesLifecycleContext<TProps, TRuntime, TServices>) => void
  readonly updateServices?: (context: SkyCoreServicesUpdateContext<TProps, TRuntime, TServices>) => void
  /**
   * Stellarium `core_update` preamble: after clock/dt, before `module_update` (see `core_update` in `core.c`).
   */
  readonly coreUpdatePreamble?: (context: SkyCoreServicesUpdateContext<TProps, TRuntime, TServices>) => void
  readonly stopServices?: (context: SkyCoreServicesLifecycleContext<TProps, TRuntime, TServices>) => void
  readonly disposeServices?: (context: SkyCoreServicesLifecycleContext<TProps, TRuntime, TServices>) => void
  /**
   * Stellarium `core_render` preamble: after window/proj sync, before `obj_render` (see `core_render` in `core.c`).
   */
  readonly coreRenderPreamble?: (context: SkyRenderContext<TProps, TRuntime, TServices>) => void
}

export interface SkyModuleContext<TProps, TRuntime extends SkyCoreRenderRefs, TServices> {
  readonly runtime: TRuntime
  readonly services: TServices
  readonly frameState: SkyCoreFrameState | null
  getProps: () => TProps
  getPropsVersion: () => number
  requestRender: () => void
  markFrameDirty: () => void
}

export interface SkyUpdateContext<TProps, TRuntime extends SkyCoreRenderRefs, TServices> extends SkyModuleContext<TProps, TRuntime, TServices> {
  readonly deltaSeconds: number
  readonly frameState: SkyCoreFrameState
}

export interface SkyRenderContext<TProps, TRuntime extends SkyCoreRenderRefs, TServices>
  extends SkyModuleContext<TProps, TRuntime, TServices> {
  readonly frameState: SkyCoreFrameState
}

export interface SceneLuminanceReport {
  readonly skyBrightness: number
  readonly skyAverageLuminance: number
  readonly skySampleCount: number
  readonly nightSkyZenithLuminance: number
  readonly nightSkyHorizonLuminance: number
  readonly sky: number
  readonly stars: number
  readonly solarSystem: number
  readonly target: number
  readonly targetFastAdaptation: boolean
  readonly starSampleCount: number
  readonly solarSystemSampleCount: number
}

export interface SkyBrightnessExposureState {
  readonly skyBrightness: number
  readonly adaptationLevel: number
  readonly sceneContrast: number
  readonly limitingMagnitude: number
  readonly starVisibility: number
  readonly starFieldBrightness: number
  readonly atmosphereExposure: number
  readonly milkyWayVisibility: number
  readonly milkyWayContrast: number
  readonly backdropAlpha: number
  readonly nightSkyZenithLuminance: number
  readonly nightSkyHorizonLuminance: number
  readonly sceneLuminanceSkyContributor: number
  readonly sceneLuminanceStarContributor: number
  readonly sceneLuminanceSolarSystemContributor: number
  readonly sceneLuminanceStarSampleCount: number
  readonly sceneLuminanceSolarSystemSampleCount: number
  readonly sceneLuminance: number
  readonly adaptedSceneLuminance: number
  readonly targetTonemapperLwmax: number
  readonly adaptationSmoothing: number
  readonly tonemapperP: number
  readonly tonemapperExposure: number
  readonly tonemapperLwmax: number
  readonly visualCalibration: SkyEngineVisualCalibration
}
