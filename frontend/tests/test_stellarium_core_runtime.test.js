import { describe, expect, it, vi } from 'vitest'

import {
  StellariumCoreRuntime,
  STELLARIUM_CORE_SOURCE_FUNCTIONS,
} from '../src/features/sky-engine/engine/sky/runtime/StellariumCoreRuntime'

describe('StellariumCoreRuntime core.c port spine', () => {
  it('runs core_update task callbacks before module updates and removes completed tasks', () => {
    const core = new StellariumCoreRuntime()
    const order = []

    core.core_init({
      windowWidth: 800,
      windowHeight: 600,
      pixelScale: 2,
      clockSeconds: 10,
    })
    core.core_add_task((task, dt) => {
      order.push(`task:${task.user}:${dt.toFixed(3)}`)
      return 0
    }, 'persist')
    core.core_add_task((task, dt) => {
      order.push(`task:${task.user}:${dt.toFixed(3)}`)
      return 1
    }, 'done')

    const result = core.core_update({
      nowSeconds: 10,
      updateModules: (dt) => {
        order.push(`modules:${dt.toFixed(3)}`)
      },
    })

    expect(result.deltaSeconds).toBe(0.001)
    expect(order).toEqual([
      'task:persist:0.001',
      'task:done:0.001',
      'modules:0.001',
    ])
    expect(core.snapshot().taskCount).toBe(1)

    order.length = 0
    core.core_update({
      nowSeconds: 10.25,
      updateModules: (dt) => {
        order.push(`modules:${dt.toFixed(3)}`)
      },
    })

    expect(order).toEqual([
      'task:persist:0.250',
      'modules:0.250',
    ])
    expect(core.snapshot().taskCount).toBe(1)
  })

  it('derives source-shaped render state and records luminance reports', () => {
    const core = new StellariumCoreRuntime()

    core.core_init({
      windowWidth: 1200,
      windowHeight: 800,
      pixelScale: 1.5,
      clockSeconds: 20,
    })

    const renderState = core.core_render({
      windowWidth: 1200,
      windowHeight: 800,
      pixelScale: 1.5,
      fovDegrees: 47,
      tonemapper: {
        p: 2.15,
        exposure: 1.8,
        lwmax: 4200,
      },
      updateObserver: vi.fn(),
    })

    expect(renderState.frameIndex).toBe(1)
    expect(renderState.projection.windowWidth).toBe(1200)
    expect(renderState.projection.windowHeight).toBe(800)
    expect(renderState.projection.pixelScale).toBe(1.5)
    expect(renderState.projection.fovDegrees).toBe(47)
    expect(renderState.painterLimits.hardLimitMag).toBe(99)
    expect(renderState.painterLimits.starsLimitMag).toBeLessThan(99)
    expect(renderState.painterLimits.hintsLimitMag).toBeLessThan(99)

    core.core_update({ deltaSeconds: 0.016 })
    core.core_report_luminance_in_fov(0.4, false)
    core.core_report_luminance_in_fov(0.2, true)
    core.core_report_luminance_in_fov(0.7, true)

    expect(core.snapshot().luminance.lwmax).toBe(0.7)
    expect(core.snapshot().luminance.fastAdaptation).toBe(true)
  })

  it('keeps explicit source anchors for the first core.c function group', () => {
    expect(STELLARIUM_CORE_SOURCE_FUNCTIONS).toEqual([
      'core_init',
      'core_release',
      'core_update',
      'core_render',
      'core_add_task',
      'core_get_proj',
      'core_get_point_for_mag',
      'core_report_luminance_in_fov',
    ])
  })
})
