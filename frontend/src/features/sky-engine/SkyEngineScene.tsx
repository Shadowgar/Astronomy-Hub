import React, { useEffect, useRef } from 'react'

import { SkyCore } from './engine/sky/runtime/SkyCore'
import {
  applyWheelInput,
  beginPointerInteraction,
  completePointerInteraction,
  createSceneRuntimeState,
  createSkySceneBridgeModule,
  DENSITY_STARS_CANVAS_FALLBACK,
  releasePointerInteraction,
  type ScenePropsSnapshot,
  type SceneRuntimeRefs,
  type SkyEngineSceneProps,
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
  const coreRef = useRef<SkyCore<ScenePropsSnapshot, SceneRuntimeRefs> | null>(null)
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

    const core = new SkyCore<ScenePropsSnapshot, SceneRuntimeRefs>({
      canvas,
      backgroundCanvas,
      initialProps: snapshot,
      initialPropsVersion: propsVersionRef.current,
      createRuntime: ({ canvas: runtimeCanvas, backgroundCanvas: runtimeBackgroundCanvas, initialProps }) => createSceneRuntimeState({
        canvas: runtimeCanvas,
        backgroundCanvas: runtimeBackgroundCanvas,
        initialProps,
      }),
    })
    core.registerModule(createSkySceneBridgeModule())
    coreRef.current = core
    core.start()

    // Phase 0A bridge: React still hosts pointer wiring, but forwards all input into SkyCore.
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      core.dispatchInput((runtime, props) => {
        applyWheelInput(runtime, props.projectionMode, {
          clientX: event.clientX,
          clientY: event.clientY,
          deltaY: event.deltaY,
        })
      })
    }

    const handlePointerDown = (event: PointerEvent) => {
      core.dispatchInput((runtime, props) => {
        beginPointerInteraction(runtime, props.projectionMode, {
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
        })
      })
    }

    const handlePointerMove = (event: PointerEvent) => {
      core.dispatchInput((runtime, props) => {
        updatePointerInteraction(runtime, props.projectionMode, {
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
        })
      })
    }

    const handlePointerUp = (event: PointerEvent) => {
      core.dispatchInput((runtime, props) => {
        const objectId = completePointerInteraction(runtime, {
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
      core.dispatchInput((runtime) => {
        releasePointerInteraction(runtime, event.pointerId)
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
