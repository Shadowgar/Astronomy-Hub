import { Camera } from '@babylonjs/core/Cameras/camera'
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Scene } from '@babylonjs/core/scene'

import {
  stabilizeSkyEngineCenterDirection,
} from './observerNavigation'
import {
  type ProjectedPickTargetEntry,
} from './pickTargets'
import type { SkyProjectionMode } from './projectionMath'
import { horizontalToDirection } from './projectionMath'
import { createDirectBackgroundLayer } from './directBackgroundLayer'
import { createDirectObjectLayer } from './directObjectLayer'
import { createDirectOverlayLayer } from './directOverlayLayer'
import { createDirectStarLayer } from './directStarLayer'
import type { SkyScenePacket } from './engine/sky'
import type { BackendSkySceneStarObject } from '../scene/contracts'
import type {
  SkyEngineAidVisibility,
  SkyEngineAtmosphereStatus,
  SkyEngineObserver,
  SkyEngineSceneObject,
  SkyEngineSunState,
} from './types'
import type { SkyModule } from './engine/sky/runtime/SkyModule'
import { SkyClockService } from './engine/sky/runtime/SkyClockService'
import { SkyInputService } from './engine/sky/runtime/SkyInputService'
import { SkyNavigationService } from './engine/sky/runtime/SkyNavigationService'
import { SkyObserverService } from './engine/sky/runtime/SkyObserverService'
import { SkyProjectionService } from './engine/sky/runtime/SkyProjectionService'
import { createRuntimePerfTelemetry } from './engine/sky/runtime/perfTelemetry'
import type { SkyBrightnessExposureState } from './engine/sky/runtime/types'
import {
  type ProjectedSceneObjectEntry,
  type RuntimeProjectedSceneFrame,
  type RuntimeProjectedStarsFrame,
} from './engine/sky/runtime/modules/runtimeFrame'

export interface SkyEngineSceneProps {
  readonly backendStars: readonly BackendSkySceneStarObject[]
  readonly observer: SkyEngineObserver
  readonly objects: readonly SkyEngineSceneObject[]
  readonly scenePacket: SkyScenePacket | null
  readonly initialViewState: {
    fovDegrees: number
    centerAltDeg: number
    centerAzDeg: number
  }
  readonly projectionMode?: SkyProjectionMode
  readonly sunState: SkyEngineSunState
  readonly selectedObjectId: string | null
  readonly guidedObjectIds: readonly string[]
  readonly aidVisibility: SkyEngineAidVisibility
  readonly onSelectObject: (objectId: string | null) => void
  readonly onAtmosphereStatusChange: (status: SkyEngineAtmosphereStatus) => void
  readonly onViewStateChange?: (viewState: { fovDegrees: number; centerAltDeg: number; centerAzDeg: number }) => void
}

export interface ScenePropsSnapshot extends SkyEngineSceneProps {}

export interface SceneRuntimeRefs {
  scene: Scene
  engine: Engine
  camera: UniversalCamera
  canvas: HTMLCanvasElement
  backgroundCanvas: HTMLCanvasElement
  directBackgroundLayer: ReturnType<typeof createDirectBackgroundLayer>
  directStarLayer: ReturnType<typeof createDirectStarLayer>
  directObjectLayer: ReturnType<typeof createDirectObjectLayer>
  directOverlayLayer: ReturnType<typeof createDirectOverlayLayer>
  projectedPickEntries: ProjectedPickTargetEntry[]
  projectedPickSourceRef: readonly ProjectedSceneObjectEntry[] | null
  lastReportedFovTenths: number | null
  lastReportedCenterAltTenths: number | null
  lastReportedCenterAzTenths: number | null
  projectedStarsFrame: RuntimeProjectedStarsFrame | null
  projectedSceneFrame: RuntimeProjectedSceneFrame | null
  projectedNonStarObjects: RuntimeProjectedSceneFrame['projectedObjects']
  brightnessExposureState: SkyBrightnessExposureState | null
  trajectoryObjectId: string | null
  visibleLabelIds: readonly string[]
  runtimePerfTelemetry: ReturnType<typeof createRuntimePerfTelemetry>
  starsProjectionCache: {
    sceneTimestampMs: number
    width: number
    height: number
    objectSignature: string
    centerDirection: { x: number; y: number; z: number }
    fovDegrees: number
    limitingMagnitude: number
    projectedStars: readonly ProjectedSceneObjectEntry[]
  } | null
  starsProjectionReuseStreak: number
}

export interface SkySceneRuntimeServices {
  readonly observerService: SkyObserverService
  readonly navigationService: SkyNavigationService
  readonly projectionService: SkyProjectionService
  readonly inputService: SkyInputService<ScenePropsSnapshot>
  readonly clockService: SkyClockService
}

export const DENSITY_STARS_CANVAS_FALLBACK = 'density-stars-canvas-fallback'

export function createSceneRuntimeState({
  canvas,
  backgroundCanvas,
}: {
  canvas: HTMLCanvasElement
  backgroundCanvas: HTMLCanvasElement
}) {
  const engine = new Engine(canvas, true, {
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: false,
    stencil: true,
  })
  const scene = new Scene(engine)
  const camera = new UniversalCamera('sky-engine-camera', new Vector3(0, 0, -10), scene)
  camera.mode = Camera.ORTHOGRAPHIC_CAMERA
  camera.minZ = 0.1
  camera.maxZ = 50
  camera.setTarget(Vector3.Zero())
  scene.clearColor.set(0, 0, 0, 0)

  return {
    scene,
    engine,
    camera,
    canvas,
    backgroundCanvas,
    directBackgroundLayer: createDirectBackgroundLayer(scene),
    directStarLayer: createDirectStarLayer(scene),
    directObjectLayer: createDirectObjectLayer(scene),
    directOverlayLayer: createDirectOverlayLayer(scene),
    projectedPickEntries: [],
    projectedPickSourceRef: null,
    lastReportedFovTenths: null,
    lastReportedCenterAltTenths: null,
    lastReportedCenterAzTenths: null,
    projectedStarsFrame: null,
    projectedSceneFrame: null,
    projectedNonStarObjects: [],
    brightnessExposureState: null,
    trajectoryObjectId: null,
    visibleLabelIds: [],
    runtimePerfTelemetry: createRuntimePerfTelemetry(),
    starsProjectionCache: null,
    starsProjectionReuseStreak: 0,
  } satisfies SceneRuntimeRefs
}

export function createSkySceneRuntimeServices(initialProps: ScenePropsSnapshot): SkySceneRuntimeServices {
  return {
    observerService: new SkyObserverService(initialProps.observer),
    navigationService: new SkyNavigationService({
      initialCenterDirection: stabilizeSkyEngineCenterDirection(
        horizontalToDirection(
          initialProps.initialViewState.centerAltDeg,
          initialProps.initialViewState.centerAzDeg,
        ),
      ),
      initialSelectedObjectId: initialProps.selectedObjectId,
    }),
    projectionService: new SkyProjectionService({
      initialProjectionMode: initialProps.projectionMode,
      initialFovDegrees: initialProps.initialViewState.fovDegrees,
    }),
    inputService: new SkyInputService(),
    clockService: new SkyClockService(),
  }
}

export function syncSkySceneRuntimeServices(services: SkySceneRuntimeServices, props: ScenePropsSnapshot) {
  services.observerService.syncObserver(props.observer)
  services.projectionService.syncProjectionMode(props.projectionMode)
  services.clockService.syncSceneTimestampFromObjects(props.objects)
}

export function createSkySceneBridgeModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-scene-runtime-bridge',
    renderOrder: 100,
    start({ getProps }) {
      getProps().onAtmosphereStatusChange({
        mode: 'fallback',
        message: 'Direct Babylon atmosphere, Milky Way, landscape, object, aid, trajectory, and label rendering is active with a bounded density-star canvas fallback.',
      })
    },
    update({ services, getProps, deltaSeconds, markFrameDirty }) {
      const latest = getProps()
      services.navigationService.syncSelection(
        latest.objects,
        latest.selectedObjectId,
        services.projectionService,
      )
      const navigationChanged = services.navigationService.update(
        deltaSeconds,
        services.projectionService,
      )

      if (navigationChanged) {
        markFrameDirty()
      }
    },
    dispose({ runtime }) {
      runtime.directBackgroundLayer.dispose()
      runtime.directStarLayer.dispose()
      runtime.directObjectLayer.dispose()
      runtime.directOverlayLayer.dispose()
    },
  }
}
