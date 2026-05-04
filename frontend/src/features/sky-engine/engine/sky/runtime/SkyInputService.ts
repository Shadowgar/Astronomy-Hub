import type { ProjectedPickTargetEntry } from '../../../pickTargets'
import {
  addSkyInteractionTraceDuration,
  incrementSkyInteractionTraceCount,
  type SkyInteractionTraceTelemetry,
} from './interactionTrace'
import type { SkyNavigationService } from './SkyNavigationService'
import type { SkyProjectionService } from './SkyProjectionService'

interface SkyInputServiceAttachConfig<TProps> {
  canvas: HTMLCanvasElement
  getProjectedPickEntries: () => readonly ProjectedPickTargetEntry[]
  getProps: () => TProps
  navigationService: SkyNavigationService
  projectionService: SkyProjectionService
  requestRender: () => void
  interactionTraceTelemetry?: SkyInteractionTraceTelemetry
  coalescePointerMoveEnabled?: boolean
  coalesceWheelEnabled?: boolean
}

export class SkyInputService<TProps extends { onSelectObject: (objectId: string | null) => void }> {
  private detachListeners: (() => void) | null = null
  private advanceFrameCallback: (() => void) | null = null

  advanceFrame() {
    this.advanceFrameCallback?.()
  }

  attach(config: SkyInputServiceAttachConfig<TProps>) {
    this.detach()

    const resolveNowMs = () => {
      if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        return performance.now()
      }
      return Date.now()
    }
    const recordCount = (key: string, delta = 1) => {
      if (!config.interactionTraceTelemetry) {
        return
      }

      incrementSkyInteractionTraceCount(config.interactionTraceTelemetry, key, delta)
    }
    const recordDuration = (key: string, durationMs: number) => {
      if (!config.interactionTraceTelemetry) {
        return
      }

      addSkyInteractionTraceDuration(config.interactionTraceTelemetry, key, durationMs)
      addSkyInteractionTraceDuration(config.interactionTraceTelemetry, 'inputHandlerTotalMs', durationMs)
    }
    const requestAnimationFrameCompat = (callback: FrameRequestCallback) => {
      if (typeof globalThis.requestAnimationFrame === 'function') {
        return globalThis.requestAnimationFrame(callback)
      }
      return globalThis.setTimeout(() => callback(resolveNowMs()), 16)
    }
    const cancelAnimationFrameCompat = (handle: number) => {
      if (typeof globalThis.cancelAnimationFrame === 'function') {
        globalThis.cancelAnimationFrame(handle)
        return
      }
      globalThis.clearTimeout(handle)
    }

    let pendingWheel:
      | {
          clientX: number
          clientY: number
          deltaY: number
        }
      | null = null
    let activePointerId: number | null = null
    let latestPointerMove:
      | {
          pointerId: number
          clientX: number
          clientY: number
        }
      | null = null
    let wheelFrameHandle: number | null = null
    const pointerEventTarget = typeof globalThis.document?.addEventListener === 'function'
      && typeof globalThis.document?.removeEventListener === 'function'
      ? globalThis.document
      : config.canvas

    const applyWheel = (input: { clientX: number; clientY: number; deltaY: number }) => {
      const handlerStartMs = resolveNowMs()
      const navigationChanged = config.navigationService.handleWheelInput(config.canvas, config.projectionService, input)
      recordCount('wheelAppliedCount')
      if (navigationChanged) {
        recordCount('navigationUpdateCount')
      }
      recordDuration('wheelHandlerMs', resolveNowMs() - handlerStartMs)
      config.requestRender()
    }

    const flushWheel = () => {
      wheelFrameHandle = null
      if (!pendingWheel) {
        return
      }

      const nextWheel = pendingWheel
      pendingWheel = null
      applyWheel(nextWheel)
    }

    const applyPointerMove = (input: { pointerId: number; clientX: number; clientY: number }) => {
      const handlerStartMs = resolveNowMs()
      const navigationChanged = config.navigationService.updatePointerInteraction(
        config.canvas,
        config.projectionService,
        input,
      )
      if (navigationChanged) {
        recordCount('pointerMoveAppliedCount')
        recordCount('navigationUpdateCount')
        config.requestRender()
      }
      recordDuration('pointerMoveHandlerMs', resolveNowMs() - handlerStartMs)
    }

    const flushPointerMove = () => {
      if (!latestPointerMove) {
        return
      }

      applyPointerMove(latestPointerMove)
    }

    const handleWheel = (event: WheelEvent) => {
      recordCount('wheelRawCount')
      event.preventDefault()
      if (config.coalesceWheelEnabled) {
        pendingWheel = pendingWheel
          ? {
              clientX: event.clientX,
              clientY: event.clientY,
              deltaY: pendingWheel.deltaY + event.deltaY,
            }
          : {
              clientX: event.clientX,
              clientY: event.clientY,
              deltaY: event.deltaY,
            }

        if (wheelFrameHandle == null) {
          wheelFrameHandle = requestAnimationFrameCompat(() => {
            flushWheel()
          })
        }
        return
      }

      applyWheel({
        clientX: event.clientX,
        clientY: event.clientY,
        deltaY: event.deltaY,
      })
    }

    const handlePointerDown = (event: PointerEvent) => {
      const handlerStartMs = resolveNowMs()
      activePointerId = event.pointerId
      latestPointerMove = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
      }
      const navigationChanged = config.navigationService.beginPointerInteraction(config.canvas, config.projectionService, {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
      })
      if (navigationChanged) {
        recordCount('navigationUpdateCount')
      }
      recordDuration('pointerDownHandlerMs', resolveNowMs() - handlerStartMs)
      config.requestRender()
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) {
        return
      }

      recordCount('pointerMoveRawCount')
      latestPointerMove = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
      }
    }

    const handlePointerUp = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) {
        return
      }

      if (latestPointerMove?.pointerId === event.pointerId) {
        flushPointerMove()
      }

      const handlerStartMs = resolveNowMs()
      const objectId = config.navigationService.completePointerInteraction(
        config.canvas,
        event.pointerId,
        event.clientX,
        event.clientY,
        config.getProjectedPickEntries(),
      )

      if (objectId !== undefined) {
        config.getProps().onSelectObject(objectId)
      }

      activePointerId = null
      latestPointerMove = null
      recordDuration('pointerUpHandlerMs', resolveNowMs() - handlerStartMs)
      config.requestRender()
    }

    const handlePointerCancel = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) {
        return
      }

      if (latestPointerMove?.pointerId === event.pointerId) {
        flushPointerMove()
      }

      const handlerStartMs = resolveNowMs()
      config.navigationService.releasePointerInteraction(config.canvas, event.pointerId)
      activePointerId = null
      latestPointerMove = null
      recordDuration('pointerCancelHandlerMs', resolveNowMs() - handlerStartMs)
      config.requestRender()
    }

    config.canvas.addEventListener('wheel', handleWheel, { passive: false })
    config.canvas.addEventListener('pointerdown', handlePointerDown)
    pointerEventTarget.addEventListener('pointermove', handlePointerMove)
    pointerEventTarget.addEventListener('pointerup', handlePointerUp)
    pointerEventTarget.addEventListener('pointercancel', handlePointerCancel)

    this.advanceFrameCallback = () => {
      flushPointerMove()
    }

    this.detachListeners = () => {
      if (wheelFrameHandle != null) {
        cancelAnimationFrameCompat(wheelFrameHandle)
        wheelFrameHandle = null
      }
      pendingWheel = null
      activePointerId = null
      latestPointerMove = null
      this.advanceFrameCallback = null
      config.canvas.removeEventListener('wheel', handleWheel)
      config.canvas.removeEventListener('pointerdown', handlePointerDown)
      pointerEventTarget.removeEventListener('pointermove', handlePointerMove)
      pointerEventTarget.removeEventListener('pointerup', handlePointerUp)
      pointerEventTarget.removeEventListener('pointercancel', handlePointerCancel)
    }
  }

  detach() {
    this.detachListeners?.()
    this.detachListeners = null
    this.advanceFrameCallback = null
  }
}
