import { describe, expect, it, vi, afterEach } from 'vitest'

import { SkyInputService } from '../src/features/sky-engine/engine/sky/runtime/SkyInputService.ts'
import { createSkyInteractionTraceTelemetry } from '../src/features/sky-engine/engine/sky/runtime/interactionTrace.ts'

function createCanvasStub() {
  const listeners = new Map()

  return {
    addEventListener(type, listener) {
      listeners.set(type, listener)
    },
    removeEventListener(type) {
      listeners.delete(type)
    },
    dispatch(type, event) {
      const listener = listeners.get(type)
      if (listener) {
        listener(event)
      }
    },
    getBoundingClientRect() {
      return { left: 0, top: 0 }
    },
    setPointerCapture: vi.fn(),
    hasPointerCapture: vi.fn(() => true),
    releasePointerCapture: vi.fn(),
  }
}

describe('SkyInputService', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('applies only the latest pointer move once per engine frame', () => {
    const requestRender = vi.fn()
    const navigationService = {
      beginPointerInteraction: vi.fn(() => true),
      updatePointerInteraction: vi.fn(() => true),
      completePointerInteraction: vi.fn(() => undefined),
      releasePointerInteraction: vi.fn(),
      handleWheelInput: vi.fn(() => true),
    }
    const projectionService = {}
    const canvas = createCanvasStub()
    const telemetry = createSkyInteractionTraceTelemetry()

    const service = new SkyInputService()
    service.attach({
      canvas,
      getProjectedPickEntries: () => [],
      getProps: () => ({ onSelectObject: vi.fn() }),
      navigationService,
      projectionService,
      requestRender,
      interactionTraceTelemetry: telemetry,
    })

    canvas.dispatch('pointerdown', { pointerId: 4, clientX: 8, clientY: 12 })
    requestRender.mockClear()
    telemetry.counts = {}
    telemetry.durationsMs = {}

    canvas.dispatch('pointermove', { pointerId: 4, clientX: 10, clientY: 20 })
    canvas.dispatch('pointermove', { pointerId: 4, clientX: 40, clientY: 80 })

    expect(navigationService.updatePointerInteraction).not.toHaveBeenCalled()

    service.advanceFrame()

    expect(navigationService.updatePointerInteraction).toHaveBeenCalledTimes(1)
    expect(navigationService.updatePointerInteraction).toHaveBeenCalledWith(canvas, projectionService, {
      pointerId: 4,
      clientX: 40,
      clientY: 80,
    })
    expect(requestRender).toHaveBeenCalledTimes(1)
    expect(telemetry.counts.pointerMoveRawCount).toBe(2)
    expect(telemetry.counts.pointerMoveAppliedCount).toBe(1)
    expect(telemetry.counts.navigationUpdateCount).toBe(1)
  })

  it('coalesces wheel updates and accumulates deltaY per animation frame', () => {
    const requestRender = vi.fn()
    const navigationService = {
      beginPointerInteraction: vi.fn(() => true),
      updatePointerInteraction: vi.fn(() => true),
      completePointerInteraction: vi.fn(() => undefined),
      releasePointerInteraction: vi.fn(),
      handleWheelInput: vi.fn(() => true),
    }
    const projectionService = {}
    const canvas = createCanvasStub()
    const telemetry = createSkyInteractionTraceTelemetry()
    const frameCallbacks = []
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => {
      frameCallbacks.push(callback)
      return frameCallbacks.length
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const service = new SkyInputService()
    service.attach({
      canvas,
      getProjectedPickEntries: () => [],
      getProps: () => ({ onSelectObject: vi.fn() }),
      navigationService,
      projectionService,
      requestRender,
      interactionTraceTelemetry: telemetry,
      coalesceWheelEnabled: true,
    })

    const firstWheelEvent = {
      clientX: 10,
      clientY: 20,
      deltaY: 15,
      preventDefault: vi.fn(),
    }
    const secondWheelEvent = {
      clientX: 30,
      clientY: 40,
      deltaY: -5,
      preventDefault: vi.fn(),
    }

    canvas.dispatch('wheel', firstWheelEvent)
    canvas.dispatch('wheel', secondWheelEvent)

    expect(navigationService.handleWheelInput).not.toHaveBeenCalled()
    expect(frameCallbacks).toHaveLength(1)

    frameCallbacks[0](16)

    expect(navigationService.handleWheelInput).toHaveBeenCalledTimes(1)
    expect(navigationService.handleWheelInput).toHaveBeenCalledWith(canvas, projectionService, {
      clientX: 30,
      clientY: 40,
      deltaY: 10,
    })
    expect(firstWheelEvent.preventDefault).toHaveBeenCalledTimes(1)
    expect(secondWheelEvent.preventDefault).toHaveBeenCalledTimes(1)
    expect(requestRender).toHaveBeenCalledTimes(1)
    expect(telemetry.counts.wheelRawCount).toBe(2)
    expect(telemetry.counts.wheelAppliedCount).toBe(1)
    expect(telemetry.counts.navigationUpdateCount).toBe(1)
  })
})