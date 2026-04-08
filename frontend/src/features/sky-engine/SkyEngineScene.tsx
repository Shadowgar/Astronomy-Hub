import React, { useEffect, useRef } from 'react'

import { SkyCore } from './engine/sky/runtime/SkyCore'
import { createBackgroundRuntimeModule } from './engine/sky/runtime/modules/BackgroundRuntimeModule'
import { createObjectRuntimeModule } from './engine/sky/runtime/modules/ObjectRuntimeModule'
import { createOverlayRuntimeModule } from './engine/sky/runtime/modules/OverlayRuntimeModule'
import {
  createSceneRuntimeState,
  createSkySceneBridgeModule,
  createSkySceneRuntimeServices,
  DENSITY_STARS_CANVAS_FALLBACK,
  type ScenePropsSnapshot,
  type SceneRuntimeRefs,
  type SkySceneRuntimeServices,
  type SkyEngineSceneProps,
  syncSkySceneRuntimeServices,
} from './SkyEngineRuntimeBridge'

export default function SkyEngineScene({
  backendStars,
  observer,
  objects,
  scenePacket,
  initialViewState,
  projectionMode = 'stereographic',
  sunState,
  selectedObjectId,
  guidedObjectIds,
  aidVisibility,
  onSelectObject,
  onAtmosphereStatusChange,
  onViewStateChange,
}: SkyEngineSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const coreRef = useRef<SkyCore<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> | null>(null)
  const propsVersionRef = useRef(0)

  const snapshot: ScenePropsSnapshot = {
    backendStars,
    observer,
    objects,
    scenePacket,
    initialViewState,
    projectionMode,
    sunState,
    selectedObjectId,
    guidedObjectIds,
    aidVisibility,
    onSelectObject,
    onAtmosphereStatusChange,
    onViewStateChange,
  }

  useEffect(() => {
    propsVersionRef.current += 1
    coreRef.current?.syncProps(snapshot, propsVersionRef.current)
  }, [aidVisibility, backendStars, guidedObjectIds, initialViewState, objects, observer, onAtmosphereStatusChange, onSelectObject, onViewStateChange, projectionMode, scenePacket, selectedObjectId, sunState])

  useEffect(() => {
    const canvas = canvasRef.current
    const backgroundCanvas = backgroundCanvasRef.current

    if (!canvas || !backgroundCanvas) {
      return undefined
    }

    const core = new SkyCore<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices>({
      canvas,
      backgroundCanvas,
      initialProps: snapshot,
      initialPropsVersion: propsVersionRef.current,
      createRuntime: ({ canvas: runtimeCanvas, backgroundCanvas: runtimeBackgroundCanvas }) => createSceneRuntimeState({
        canvas: runtimeCanvas,
        backgroundCanvas: runtimeBackgroundCanvas,
      }),
      createServices: ({ initialProps }) => createSkySceneRuntimeServices(initialProps),
      syncServices: (services, props) => syncSkySceneRuntimeServices(services, props),
      startServices: ({ runtime, services, getProps, requestRender }) => {
        services.inputService.attach({
          canvas: runtime.canvas,
          getProjectedPickEntries: () => runtime.projectedPickEntries,
          getProps,
          navigationService: services.navigationService,
          projectionService: services.projectionService,
          requestRender,
        })
      },
      updateServices: ({ services, deltaSeconds }) => {
        services.clockService.advanceFrame(deltaSeconds)
      },
      stopServices: ({ services }) => {
        services.inputService.detach()
      },
    })
    core.registerModule(createBackgroundRuntimeModule())
    core.registerModule(createObjectRuntimeModule())
    core.registerModule(createOverlayRuntimeModule())
    core.registerModule(createSkySceneBridgeModule())
    coreRef.current = core
    core.start()

    return () => {
      core.dispose()
      coreRef.current = null
    }
  }, [])

  useEffect(() => {
    onAtmosphereStatusChange({
      mode: 'fallback',
      message: `Direct Babylon backdrop, glare, horizon blocking, objects, labels, aids, and trajectories are active for ${sunState.phaseLabel.toLowerCase()} conditions with ${DENSITY_STARS_CANVAS_FALLBACK}.`,
    })
  }, [onAtmosphereStatusChange, sunState])

  return (
    <div className="sky-engine-scene">
      <canvas ref={backgroundCanvasRef} className="sky-engine-scene__background" />
      <canvas ref={canvasRef} className="sky-engine-scene__canvas" aria-label="Sky Engine scene" />
    </div>
  )
}
