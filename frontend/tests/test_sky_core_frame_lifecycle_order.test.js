import { describe, expect, it, vi } from 'vitest'

import { SkyCore } from '../src/features/sky-engine/engine/sky/runtime/SkyCore'

function withWindowEventStubs(run) {
  const originalAdd = globalThis.addEventListener
  const originalRemove = globalThis.removeEventListener
  globalThis.addEventListener = vi.fn()
  globalThis.removeEventListener = vi.fn()

  try {
    run()
  } finally {
    globalThis.addEventListener = originalAdd
    globalThis.removeEventListener = originalRemove
  }
}

describe('SkyCore frame lifecycle (core.c port)', () => {
  it('runs update and render phases in strict core.c order each frame', () => {
    withWindowEventStubs(() => {
      const order = []
      let loopCallback = null

      const runtime = {
        canvas: {},
        backgroundCanvas: {},
        camera: {},
        scene: {
          render: vi.fn(() => {
            order.push('scene.render')
          }),
          dispose: vi.fn(),
        },
        engine: {
          runRenderLoop: vi.fn((callback) => {
            loopCallback = callback
            callback()
          }),
          stopRenderLoop: vi.fn(),
          resize: vi.fn(),
          dispose: vi.fn(),
        },
      }

      const moduleA = {
        id: 'module-a',
        renderOrder: 20,
        update: vi.fn(() => order.push('module-a.update')),
        render: vi.fn(() => order.push('module-a.render')),
        postRender: vi.fn(() => order.push('module-a.postRender')),
      }
      const moduleB = {
        id: 'module-b',
        renderOrder: 10,
        update: vi.fn(() => order.push('module-b.update')),
        render: vi.fn(() => order.push('module-b.render')),
        postRender: vi.fn(() => order.push('module-b.postRender')),
      }

      const core = new SkyCore({
        canvas: runtime.canvas,
        backgroundCanvas: runtime.backgroundCanvas,
        initialProps: {},
        createRuntime: () => runtime,
        createServices: () => ({}),
        updateServices: ({ markFrameDirty }) => {
          order.push('services.update')
          markFrameDirty()
        },
        coreUpdatePreamble: () => {
          order.push('core.updatePreamble')
        },
        coreRenderPreamble: () => {
          order.push('core.renderPreamble')
        },
      })

      core.registerModule(moduleA)
      core.registerModule(moduleB)
      core.start()

      expect(order).toEqual([
        'services.update',
        'core.updatePreamble',
        'module-b.update',
        'module-a.update',
        'core.renderPreamble',
        'module-b.render',
        'module-a.render',
        'scene.render',
        'module-b.postRender',
        'module-a.postRender',
      ])

      expect(loopCallback).toBeTypeOf('function')
    })
  })
})
