import type { ProjectedPickTargetEntry } from '../../../pickTargets'
import type { SkyNavigationService } from './SkyNavigationService'
import type { SkyProjectionService } from './SkyProjectionService'

interface SkyInputServiceAttachConfig<TProps> {
  canvas: HTMLCanvasElement
  getProjectedPickEntries: () => readonly ProjectedPickTargetEntry[]
  getProps: () => TProps
  navigationService: SkyNavigationService
  projectionService: SkyProjectionService
  requestRender: () => void
}

export class SkyInputService<TProps extends { onSelectObject: (objectId: string | null) => void }> {
  private detachListeners: (() => void) | null = null

  attach(config: SkyInputServiceAttachConfig<TProps>) {
    this.detach()

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      config.navigationService.handleWheelInput(config.canvas, config.projectionService, {
        clientX: event.clientX,
        clientY: event.clientY,
        deltaY: event.deltaY,
      })
      config.requestRender()
    }

    const handlePointerDown = (event: PointerEvent) => {
      config.navigationService.beginPointerInteraction(config.canvas, config.projectionService, {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
      })
      config.requestRender()
    }

    const handlePointerMove = (event: PointerEvent) => {
      config.navigationService.updatePointerInteraction(config.canvas, config.projectionService, {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
      })
      config.requestRender()
    }

    const handlePointerUp = (event: PointerEvent) => {
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

      config.requestRender()
    }

    const handlePointerCancel = (event: PointerEvent) => {
      config.navigationService.releasePointerInteraction(config.canvas, event.pointerId)
      config.requestRender()
    }

    config.canvas.addEventListener('wheel', handleWheel, { passive: false })
    config.canvas.addEventListener('pointerdown', handlePointerDown)
    config.canvas.addEventListener('pointermove', handlePointerMove)
    config.canvas.addEventListener('pointerup', handlePointerUp)
    config.canvas.addEventListener('pointercancel', handlePointerCancel)

    this.detachListeners = () => {
      config.canvas.removeEventListener('wheel', handleWheel)
      config.canvas.removeEventListener('pointerdown', handlePointerDown)
      config.canvas.removeEventListener('pointermove', handlePointerMove)
      config.canvas.removeEventListener('pointerup', handlePointerUp)
      config.canvas.removeEventListener('pointercancel', handlePointerCancel)
    }
  }

  detach() {
    this.detachListeners?.()
    this.detachListeners = null
  }
}
