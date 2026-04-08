import React, { useEffect, useRef } from 'react'

import { SkyCore } from './engine/sky/runtime/SkyCore'
import {
  applyWheelInput,
  beginPointerInteraction,
  completePointerInteraction,
  createSceneRuntimeState,
  createSkySceneBridgeModule,
  createSkySceneRuntimeServices,
  DENSITY_STARS_CANVAS_FALLBACK,
  releasePointerInteraction,
  type ScenePropsSnapshot,
  type SceneRuntimeRefs,
  type SkySceneRuntimeServices,
  type SkyEngineSceneProps,
  syncSkySceneRuntimeServices,
  updatePointerInteraction,
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
    })
    core.registerModule(createSkySceneBridgeModule())
    coreRef.current = core
    core.start()

    // Phase 0A bridge: React still hosts pointer wiring, but forwards all input into SkyCore.
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      core.dispatchInput((runtime, services) => {
        applyWheelInput(runtime, services, {
          clientX: event.clientX,
          clientY: event.clientY,
          deltaY: event.deltaY,
        })
      })
    }

    const handlePointerDown = (event: PointerEvent) => {
      core.dispatchInput((runtime, services) => {
        beginPointerInteraction(runtime, services, {
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
        })
      })
    }

    const handlePointerMove = (event: PointerEvent) => {
      core.dispatchInput((runtime, services) => {
        updatePointerInteraction(runtime, services, {
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
        })
      })
    }

    const handlePointerUp = (event: PointerEvent) => {
      core.dispatchInput((runtime, services, props) => {
        const objectId = completePointerInteraction(runtime, services, {
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
        })

        if (objectId !== undefined) {
          props.onSelectObject(objectId)
        }
      })
    }

    const handlePointerCancel = (event: PointerEvent) => {
      core.dispatchInput((runtime, services) => {
        releasePointerInteraction(runtime, services, event.pointerId)
      })
    }

    const handleResize = () => {
      core.resize()
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointercancel', handlePointerCancel)
    globalThis.addEventListener('resize', handleResize)

    return () => {
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointercancel', handlePointerCancel)
      globalThis.removeEventListener('resize', handleResize)
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
