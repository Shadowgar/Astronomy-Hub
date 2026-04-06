import React, { useEffect, useRef } from 'react'

import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import '@babylonjs/core/Culling/ray'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { Scene } from '@babylonjs/core/scene'

import { computeObjectTrajectorySamples } from './astronomy'
import { setupSkyAtmosphere, type SkyAtmosphereSetup } from './atmosphere'
import { createDsoRenderer } from './DsoRenderer'
import { resolveLabelLayout } from './labelManager'
import { createLandscapeLayer, type LandscapeLayer } from './landscapeLayer'
import { createMoonRenderer } from './MoonRenderer'
import {
  applyPointerAnchoredZoom,
  buildInitialViewTarget as buildObserverInitialViewTarget,
  getDesiredFovForObject,
  getSelectionTargetVector,
  getSkyEngineFovDegrees,
  stepSkyEngineFov,
  updateObserverNavigation,
} from './observerNavigation'
import { createPlanetRenderer } from './PlanetRenderer'
import {
  buildSkyEnginePickTargets,
  clearSkyEnginePickTargets,
  resolveSkyEnginePickSelection,
  writeSkyEnginePickTargets,
} from './pickTargets'
import { createPointerRenderer } from './PointerRenderer'
import type { SkyObjectRenderer } from './skyRendererContracts'
import { resolveSkyLodState } from './skyLod'
import { SKY_RADIUS, toSkyPosition } from './skyDomeMath'
import { createStarRenderer } from './starObjectRenderer'
import type {
  SkyEngineAidVisibility,
  SkyEngineAtmosphereStatus,
  SkyEngineObserver,
  SkyEngineSceneObject,
  SkyEngineSunState,
} from './types'

interface SkyEngineSceneProps {
  readonly observer: SkyEngineObserver
  readonly objects: readonly SkyEngineSceneObject[]
  readonly sunState: SkyEngineSunState
  readonly selectedObjectId: string | null
  readonly guidedObjectIds: readonly string[]
  readonly aidVisibility: SkyEngineAidVisibility
  readonly onSelectObject: (objectId: string | null) => void
  readonly onAtmosphereStatusChange: (status: SkyEngineAtmosphereStatus) => void
  readonly onViewStateChange?: (viewState: { fovDegrees: number }) => void
}

interface ScenePropsSnapshot extends SkyEngineSceneProps {}

interface SceneRuntimeRefs {
  scene: Scene
  engine: Engine
  camera: UniversalCamera
  canvas: HTMLCanvasElement
  atmosphere: SkyAtmosphereSetup
  landscapeLayer: LandscapeLayer
  starRenderer: SkyObjectRenderer
  planetRenderer: SkyObjectRenderer
  moonRenderer: SkyObjectRenderer
  dsoRenderer: SkyObjectRenderer
  pointerRenderer: ReturnType<typeof createPointerRenderer>
  trajectoryMesh: Mesh | null
  trajectoryMarkers: Mesh[]
  homeVector: Vector3
  targetVector: Vector3 | null
  desiredFov: number
  selectedObjectId: string | null
  lastFrameTime: number
  lastReportedFovTenths: number | null
}

interface SceneStateWriteInput {
  canvas: HTMLCanvasElement
  objects: readonly SkyEngineSceneObject[]
  selectedObjectId: string | null
  trajectoryObjectId: string | null
  visibleLabelIds: readonly string[]
  guidedObjectIds: readonly string[]
  aidVisibility: SkyEngineAidVisibility
  currentFovDegrees: number
  currentLodTier: 'wide' | 'medium' | 'close'
  labelCap: number
  groundTextureMode: 'oras-grass.jpg_tiled'
  groundTextureAssetPath: string
}

const SKY_ENGINE_SCENE_STATE_ATTRIBUTE = 'data-sky-engine-scene-state'
const TRAJECTORY_HOUR_OFFSETS = [-6, -3, 0, 3, 6] as const

function writeSceneState({
  canvas,
  objects,
  selectedObjectId,
  trajectoryObjectId,
  visibleLabelIds,
  guidedObjectIds,
  aidVisibility,
  currentFovDegrees,
  currentLodTier,
  labelCap,
  groundTextureMode,
  groundTextureAssetPath,
}: SceneStateWriteInput) {
  const moonObject = objects.find((object) => object.type === 'moon')

  canvas.setAttribute(
    SKY_ENGINE_SCENE_STATE_ATTRIBUTE,
    JSON.stringify({
      horizonVisible: true,
      selectedObjectId,
      trajectoryObjectId,
      visibleLabelIds,
      guidanceObjectIds: guidedObjectIds,
      moonObjectId: moonObject?.id ?? null,
      controlledLabelCount: visibleLabelIds.length,
      labelCap,
      aidVisibility,
      currentFovDegrees,
      currentLodTier,
      groundTextureMode,
      groundTextureAssetPath,
    }),
  )
}

function clearSceneState(canvas: HTMLCanvasElement) {
  canvas.removeAttribute(SKY_ENGINE_SCENE_STATE_ATTRIBUTE)
}

function getSelectedAnchor(runtime: SceneRuntimeRefs, selectedObjectId: string) {
  return runtime.starRenderer.getAnchor(selectedObjectId)
    ?? runtime.planetRenderer.getAnchor(selectedObjectId)
    ?? runtime.moonRenderer.getAnchor(selectedObjectId)
    ?? runtime.dsoRenderer.getAnchor(selectedObjectId)
}

function collectPickEntries(runtime: SceneRuntimeRefs) {
  return [
    ...runtime.starRenderer.getPickEntries(),
    ...runtime.planetRenderer.getPickEntries(),
    ...runtime.moonRenderer.getPickEntries(),
    ...runtime.dsoRenderer.getPickEntries(),
  ]
}

function collectLabelRefs(runtime: SceneRuntimeRefs) {
  return {
    ...runtime.starRenderer.getLabelRefs(),
    ...runtime.planetRenderer.getLabelRefs(),
    ...runtime.moonRenderer.getLabelRefs(),
    ...runtime.dsoRenderer.getLabelRefs(),
  }
}

function syncNavigationState(runtime: SceneRuntimeRefs, objects: readonly SkyEngineSceneObject[], selectedObjectId: string | null) {
  const selectedObject = objects.find((object) => object.id === selectedObjectId) ?? null
  const selectionChanged = runtime.selectedObjectId !== selectedObjectId

  runtime.selectedObjectId = selectedObjectId

  if (selectedObject?.isAboveHorizon) {
    runtime.targetVector = getSelectionTargetVector(selectedObject)
  } else if (!selectedObject && selectionChanged) {
    runtime.targetVector = runtime.homeVector.clone()
  }

  if (selectionChanged && !selectedObject) {
    runtime.desiredFov = getDesiredFovForObject(null)
  }
}

function syncTrajectory(
  runtime: SceneRuntimeRefs,
  observer: SkyEngineObserver,
  objects: readonly SkyEngineSceneObject[],
  selectedObjectId: string | null,
) {
  runtime.trajectoryMesh?.dispose()
  runtime.trajectoryMesh = null
  runtime.trajectoryMarkers.forEach((marker) => marker.dispose())
  runtime.trajectoryMarkers = []

  const selectedObject = objects.find((object) => object.id === selectedObjectId && object.trackingMode !== 'static') ?? null

  if (!selectedObject) {
    return null
  }

  const trajectoryPoints = computeObjectTrajectorySamples(
    observer,
    selectedObject.timestampIso ?? new Date().toISOString(),
    selectedObject,
    TRAJECTORY_HOUR_OFFSETS,
  )
    .filter((sample) => sample.altitudeDeg >= -2)
    .map((sample) => toSkyPosition(sample.altitudeDeg, sample.azimuthDeg, SKY_RADIUS * 0.992))

  if (trajectoryPoints.length < 2) {
    return selectedObject.id
  }

  const trajectory = MeshBuilder.CreateDashedLines(
    `sky-engine-trajectory-${selectedObject.id}`,
    {
      points: trajectoryPoints,
      dashSize: 2.2,
      gapSize: 1.1,
      dashNb: Math.max(24, trajectoryPoints.length * 2),
    },
    runtime.scene,
  )
  trajectory.color = Color3.FromHexString(selectedObject.colorHex).scale(0.88)
  trajectory.alpha = 0.48
  trajectory.isPickable = false
  runtime.trajectoryMesh = trajectory

  const anchorPoints = [trajectoryPoints[0], trajectoryPoints[trajectoryPoints.length - 1]].filter(
    (point): point is Vector3 => point instanceof Vector3,
  )

  anchorPoints.forEach((point, index) => {
    const marker = MeshBuilder.CreatePlane(
      `sky-engine-trajectory-anchor-${selectedObject.id}-${index}`,
      { width: selectedObject.type === 'moon' ? 1.75 : 1.25, height: selectedObject.type === 'moon' ? 1.75 : 1.25 },
      runtime.scene,
    )
    marker.billboardMode = Mesh.BILLBOARDMODE_ALL
    marker.isPickable = false
    marker.position.copyFrom(point)

    const material = new StandardMaterial(`sky-engine-trajectory-anchor-material-${selectedObject.id}-${index}`, runtime.scene)
    material.disableLighting = true
    material.backFaceCulling = false
    material.emissiveColor = Color3.FromHexString(selectedObject.colorHex).scale(index === 0 ? 0.52 : 0.84)
    material.alpha = index === 0 ? 0.3 : 0.58
    marker.material = material
    runtime.trajectoryMarkers.push(marker)
  })

  return selectedObject.id
}

export default function SkyEngineScene({
  observer,
  objects,
  sunState,
  selectedObjectId,
  guidedObjectIds,
  aidVisibility,
  onSelectObject,
  onAtmosphereStatusChange,
  onViewStateChange,
}: SkyEngineSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const runtimeRefs = useRef<SceneRuntimeRefs | null>(null)
  const propsRef = useRef<ScenePropsSnapshot>({
    observer,
    objects,
    sunState,
    selectedObjectId,
    guidedObjectIds,
    aidVisibility,
    onSelectObject,
    onAtmosphereStatusChange,
    onViewStateChange,
  })

  useEffect(() => {
    propsRef.current = {
      observer,
      objects,
      sunState,
      selectedObjectId,
      guidedObjectIds,
      aidVisibility,
      onSelectObject,
      onAtmosphereStatusChange,
      onViewStateChange,
    }
  }, [aidVisibility, guidedObjectIds, objects, observer, onAtmosphereStatusChange, onSelectObject, onViewStateChange, selectedObjectId, sunState])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return undefined
    }

    const engine = new Engine(canvas, true, {
      antialias: true,
      preserveDrawingBuffer: false,
      stencil: true,
    })
    const scene = new Scene(engine)
    scene.skipPointerMovePicking = true

    const camera = new UniversalCamera('sky-engine-camera', Vector3.Zero(), scene)
    const initialViewTarget = buildObserverInitialViewTarget(propsRef.current.objects, propsRef.current.guidedObjectIds)
    camera.setTarget(initialViewTarget)
    camera.attachControl(canvas, true)
    camera.inputs.attached.keyboard?.detachControl()
    camera.angularSensibility = 3200
    camera.inertia = 0.86
    camera.speed = 0
    camera.minZ = 0.1
    camera.maxZ = SKY_RADIUS * 2
    camera.fov = getDesiredFovForObject(null)

    scene.clearColor = Color4.FromColor3(Color3.FromHexString(propsRef.current.sunState.visualCalibration.backgroundColorHex), 1)
    scene.ambientColor = Color3.FromHexString(propsRef.current.sunState.visualCalibration.ambientLightColorHex)

    const atmosphere = setupSkyAtmosphere(scene, camera, propsRef.current.sunState)
    propsRef.current.onAtmosphereStatusChange(atmosphere.status)
    const landscapeLayer = createLandscapeLayer(
      scene,
      propsRef.current.sunState.visualCalibration,
      propsRef.current.sunState,
      propsRef.current.aidVisibility,
      propsRef.current.objects,
    )

    runtimeRefs.current = {
      scene,
      engine,
      camera,
      canvas,
      atmosphere,
      landscapeLayer,
      starRenderer: createStarRenderer(scene),
      planetRenderer: createPlanetRenderer(scene),
      moonRenderer: createMoonRenderer(scene),
      dsoRenderer: createDsoRenderer(scene),
      pointerRenderer: createPointerRenderer(scene),
      trajectoryMesh: null,
      trajectoryMarkers: [],
      homeVector: initialViewTarget.clone(),
      targetVector: null,
      desiredFov: camera.fov,
      selectedObjectId: propsRef.current.selectedObjectId,
      lastFrameTime: performance.now(),
      lastReportedFovTenths: null,
    }

    scene.onPointerDown = () => {
      const runtime = runtimeRefs.current

      if (!runtime) {
        return
      }

      const objectId = resolveSkyEnginePickSelection(
        runtime.scene,
        runtime.camera,
        runtime.engine,
        collectPickEntries(runtime),
        runtime.scene.pointerX,
        runtime.scene.pointerY,
      )

      propsRef.current.onSelectObject(objectId)
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const runtime = runtimeRefs.current

      if (!runtime) {
        return
      }

      const nextDesiredFov = stepSkyEngineFov(runtime.desiredFov, event.deltaY)

      if (nextDesiredFov === runtime.desiredFov) {
        return
      }

      if (propsRef.current.selectedObjectId) {
        runtime.camera.fov = nextDesiredFov
      } else {
        const bounds = canvas.getBoundingClientRect()
        applyPointerAnchoredZoom(
          runtime.scene,
          runtime.camera,
          event.clientX - bounds.left,
          event.clientY - bounds.top,
          nextDesiredFov,
        )
        runtime.targetVector = null
      }

      runtime.desiredFov = nextDesiredFov
    }

    const handleResize = () => engine.resize()
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    globalThis.addEventListener('resize', handleResize)

    engine.runRenderLoop(() => {
      const runtime = runtimeRefs.current

      if (!runtime) {
        return
      }

      const latest = propsRef.current
      const now = performance.now()
      const deltaSeconds = Math.min(0.05, (now - runtime.lastFrameTime) * 0.001)
      runtime.lastFrameTime = now
      const animationTime = now * 0.001
      const lod = resolveSkyLodState(runtime.camera.fov)
      const guidedObjectSet = new Set(latest.guidedObjectIds)

      syncNavigationState(runtime, latest.objects, latest.selectedObjectId)
      runtime.targetVector = updateObserverNavigation(runtime.camera, runtime.desiredFov, runtime.targetVector, deltaSeconds)

      runtime.starRenderer.sync({ ...latest, guidedObjectIds: guidedObjectSet, lod, animationTime })
      runtime.planetRenderer.sync({ ...latest, guidedObjectIds: guidedObjectSet, lod, animationTime })
      runtime.moonRenderer.sync({ ...latest, guidedObjectIds: guidedObjectSet, lod, animationTime })
      runtime.dsoRenderer.sync({ ...latest, guidedObjectIds: guidedObjectSet, lod, animationTime })

      const labelRefs = collectLabelRefs(runtime)
      const visibleLabelIds = resolveLabelLayout(
        runtime.scene,
        runtime.camera,
        runtime.engine,
        labelRefs,
        latest.selectedObjectId,
        guidedObjectSet,
        latest.sunState,
        lod.labelCap,
      )

      const selectedObject = latest.objects.find((object) => object.id === latest.selectedObjectId) ?? null
      const selectedAnchor = latest.selectedObjectId ? getSelectedAnchor(runtime, latest.selectedObjectId) : null
      const selectedLabelPosition = latest.selectedObjectId ? labelRefs[latest.selectedObjectId]?.label.getAbsolutePosition().clone() ?? null : null
      runtime.pointerRenderer.sync(selectedAnchor, selectedLabelPosition, selectedObject?.colorHex ?? '#ffffff', lod, animationTime)

      runtime.landscapeLayer.update(animationTime)
      const trajectoryObjectId = syncTrajectory(runtime, latest.observer, latest.objects, latest.selectedObjectId)
      const currentFovTenths = Math.round(getSkyEngineFovDegrees(runtime.camera.fov) * 10)

      if (currentFovTenths !== runtime.lastReportedFovTenths) {
        runtime.lastReportedFovTenths = currentFovTenths
        latest.onViewStateChange?.({ fovDegrees: currentFovTenths / 10 })
      }

      writeSceneState({
        canvas,
        objects: latest.objects,
        selectedObjectId: latest.selectedObjectId,
        trajectoryObjectId,
        visibleLabelIds,
        guidedObjectIds: latest.guidedObjectIds,
        aidVisibility: latest.aidVisibility,
        currentFovDegrees: currentFovTenths / 10,
        currentLodTier: lod.tier,
        labelCap: lod.labelCap,
        groundTextureMode: runtime.landscapeLayer.groundTextureMode,
        groundTextureAssetPath: runtime.landscapeLayer.groundTextureAssetPath,
      })

      scene.render()
      writeSkyEnginePickTargets(canvas, buildSkyEnginePickTargets(scene, camera, engine, collectPickEntries(runtime)))
    })

    return () => {
      canvas.removeEventListener('wheel', handleWheel)
      globalThis.removeEventListener('resize', handleResize)
      clearSkyEnginePickTargets(canvas)
      clearSceneState(canvas)
      runtimeRefs.current?.trajectoryMesh?.dispose()
      runtimeRefs.current?.trajectoryMarkers.forEach((marker) => marker.dispose())
      runtimeRefs.current?.pointerRenderer.dispose()
      runtimeRefs.current?.starRenderer.dispose()
      runtimeRefs.current?.planetRenderer.dispose()
      runtimeRefs.current?.moonRenderer.dispose()
      runtimeRefs.current?.dsoRenderer.dispose()
      runtimeRefs.current?.landscapeLayer.dispose()
      runtimeRefs.current?.atmosphere.dispose()
      runtimeRefs.current = null
      scene.dispose()
      engine.dispose()
    }
  }, [])

  useEffect(() => {
    const runtime = runtimeRefs.current

    if (!runtime) {
      return
    }

    runtime.atmosphere.dispose()
    runtime.atmosphere = setupSkyAtmosphere(runtime.scene, runtime.camera, sunState)
    onAtmosphereStatusChange(runtime.atmosphere.status)
  }, [onAtmosphereStatusChange, sunState])

  useEffect(() => {
    const runtime = runtimeRefs.current

    if (!runtime) {
      return
    }

    runtime.landscapeLayer.dispose()
    runtime.landscapeLayer = createLandscapeLayer(runtime.scene, sunState.visualCalibration, sunState, aidVisibility, objects)
  }, [aidVisibility, objects, sunState])

  return <canvas ref={canvasRef} className="sky-engine-scene__canvas" aria-label="Sky Engine scene" />
}