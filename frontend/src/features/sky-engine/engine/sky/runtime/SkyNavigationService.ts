import type { Vector3 } from '@babylonjs/core/Maths/math.vector'

import {
  getSelectionTargetVector,
  rotateVectorTowardPointerAnchor,
  stabilizeSkyEngineCenterDirection,
  updateObserverNavigation,
} from '../../../observerNavigation'
import type { ProjectedPickTargetEntry } from '../../../pickTargets'
import { resolveSkyEnginePickSelection } from '../../../pickTargets'
import type { SkyEngineSceneObject } from '../../../types'
import type { SkyProjectionService } from './SkyProjectionService'

export const SKY_NAVIGATION_POINTER_DRAG_THRESHOLD_PX = 6

export class SkyNavigationService {
  private centerDirection: Vector3
  private targetVector: Vector3 | null = null
  private selectedObjectId: string | null
  private activePointerId: number | null = null
  private dragAnchorDirection: Vector3 | null = null
  private dragBaseCenterDirection: Vector3 | null = null
  private dragStartX = 0
  private dragStartY = 0
  private dragMoved = false

  constructor(config: {
    initialCenterDirection: Vector3
    initialSelectedObjectId: string | null
  }) {
    this.centerDirection = stabilizeSkyEngineCenterDirection(config.initialCenterDirection)
    this.selectedObjectId = config.initialSelectedObjectId
  }

  getCenterDirection() {
    return this.centerDirection
  }

  getSelectedObjectId() {
    return this.selectedObjectId
  }

  syncSelection(objects: readonly SkyEngineSceneObject[], selectedObjectId: string | null, projectionService: SkyProjectionService) {
    const selectedObject = objects.find((object) => object.id === selectedObjectId) ?? null
    const selectionChanged = this.selectedObjectId !== selectedObjectId

    this.selectedObjectId = selectedObjectId

    if (selectedObject?.isAboveHorizon) {
      this.targetVector = getSelectionTargetVector(selectedObject)
    } else if (!selectedObject && selectionChanged) {
      this.targetVector = null
    }

    if (selectionChanged && !selectedObject) {
      projectionService.setDesiredFov(projectionService.getCurrentFov())
    }
  }

  update(deltaSeconds: number, projectionService: SkyProjectionService) {
    const previousCenterDirection = this.centerDirection
    const previousFov = projectionService.getCurrentFov()
    const navigation = updateObserverNavigation(
      this.centerDirection,
      previousFov,
      projectionService.getDesiredFov(),
      this.targetVector,
      deltaSeconds,
    )

    this.centerDirection = navigation.centerDirection
    projectionService.setCurrentFov(navigation.fovRadians)
    this.targetVector = navigation.targetVector

    return (
      !navigation.centerDirection.equalsWithEpsilon(previousCenterDirection, 0.000001) ||
      Math.abs(navigation.fovRadians - previousFov) > 0.000001
    )
  }

  handleWheelInput(
    canvas: HTMLCanvasElement,
    projectionService: SkyProjectionService,
    input: { clientX: number; clientY: number; deltaY: number },
  ) {
    const nextDesiredFov = projectionService.stepWheelFov(input.deltaY)
    const bounds = canvas.getBoundingClientRect()
    const previousPointerDirection = projectionService.unproject(
      input.clientX - bounds.left,
      input.clientY - bounds.top,
      this.centerDirection,
      projectionService.getCurrentFov(),
    )
    const nextPointerDirection = projectionService.unproject(
      input.clientX - bounds.left,
      input.clientY - bounds.top,
      this.centerDirection,
      nextDesiredFov,
    )

    this.centerDirection = rotateVectorTowardPointerAnchor(this.centerDirection, nextPointerDirection, previousPointerDirection).normalizeToNew()
    this.targetVector = null
  }

  beginPointerInteraction(
    canvas: HTMLCanvasElement,
    projectionService: SkyProjectionService,
    input: { pointerId: number; clientX: number; clientY: number },
  ) {
    const bounds = canvas.getBoundingClientRect()
    this.activePointerId = input.pointerId
    this.dragStartX = input.clientX - bounds.left
    this.dragStartY = input.clientY - bounds.top
    this.dragMoved = false
    this.dragBaseCenterDirection = this.centerDirection.clone()
    this.dragAnchorDirection = projectionService.unproject(
      this.dragStartX,
      this.dragStartY,
      this.dragBaseCenterDirection,
    )
    canvas.setPointerCapture(input.pointerId)
  }

  updatePointerInteraction(
    canvas: HTMLCanvasElement,
    projectionService: SkyProjectionService,
    input: { pointerId: number; clientX: number; clientY: number },
  ) {
    if (this.activePointerId !== input.pointerId || !this.dragAnchorDirection || !this.dragBaseCenterDirection) {
      return
    }

    const bounds = canvas.getBoundingClientRect()
    const screenX = input.clientX - bounds.left
    const screenY = input.clientY - bounds.top
    const pointerDistance = Math.hypot(screenX - this.dragStartX, screenY - this.dragStartY)

    if (pointerDistance >= SKY_NAVIGATION_POINTER_DRAG_THRESHOLD_PX) {
      this.dragMoved = true
    }

    if (!this.dragMoved) {
      return
    }

    const nextPointerDirection = projectionService.unproject(screenX, screenY, this.dragBaseCenterDirection)
    this.centerDirection = rotateVectorTowardPointerAnchor(
      this.dragBaseCenterDirection,
      nextPointerDirection,
      this.dragAnchorDirection,
    ).normalizeToNew()
    this.targetVector = null
  }

  releasePointerInteraction(canvas: HTMLCanvasElement, pointerId: number) {
    if (this.activePointerId !== pointerId) {
      return
    }

    this.activePointerId = null
    this.dragAnchorDirection = null
    this.dragBaseCenterDirection = null
    this.dragMoved = false

    if (canvas.hasPointerCapture(pointerId)) {
      canvas.releasePointerCapture(pointerId)
    }
  }

  completePointerInteraction(
    canvas: HTMLCanvasElement,
    pointerId: number,
    clientX: number,
    clientY: number,
    projectedPickEntries: readonly ProjectedPickTargetEntry[],
  ) {
    if (this.activePointerId !== pointerId) {
      return undefined
    }

    let objectId: string | null | undefined

    if (!this.dragMoved) {
      const bounds = canvas.getBoundingClientRect()
      objectId = resolveSkyEnginePickSelection(
        projectedPickEntries,
        clientX - bounds.left,
        clientY - bounds.top,
      )
    }

    this.releasePointerInteraction(canvas, pointerId)
    return objectId
  }
}
