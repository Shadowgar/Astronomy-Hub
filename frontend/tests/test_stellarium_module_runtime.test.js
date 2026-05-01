import { describe, expect, it, vi } from 'vitest'

import {
  MODULE_AGAIN,
  STELLARIUM_MODULE_SOURCE_FUNCTIONS,
  StellariumModuleRuntime,
} from '../src/features/sky-engine/engine/sky/runtime/StellariumModuleRuntime'
import { StellariumCoreRuntime } from '../src/features/sky-engine/engine/sky/runtime/StellariumCoreRuntime'

describe('StellariumModuleRuntime module.c port spine', () => {
  it('updates modules, lists default listable children, and resolves render order', () => {
    const runtime = new StellariumModuleRuntime()
    const update = vi.fn(() => 7)
    const childA = runtime.createObject({ id: 'a', klassId: 'star' })
    const childB = runtime.createObject({ id: 'b', klassId: 'planet' })
    const module = runtime.createModule({
      id: 'stars',
      renderOrder: 42,
      flags: ['OBJ_MODULE', 'OBJ_LISTABLE'],
      update,
      children: [childA, childB],
    })

    expect(runtime.module_update(module, 0.25)).toBe(7)
    expect(update).toHaveBeenCalledWith(module, 0.25)
    expect(runtime.module_get_render_order(module)).toBe(42)

    const listed = []
    expect(runtime.module_list_objs(module, Number.NaN, 0, null, listed, (out, child) => {
      out.push(child.id)
      return 0
    })).toBe(0)
    expect(listed).toEqual(['a', 'b'])

    const stopped = []
    runtime.module_list_objs(module, Number.NaN, 0, null, stopped, (out, child) => {
      out.push(child.id)
      return 1
    })
    expect(stopped).toEqual(['a'])
  })

  it('adds, retains, finds, removes children, and emits the global change listener', () => {
    const runtime = new StellariumModuleRuntime()
    const changed = vi.fn()
    runtime.module_add_global_listener(changed)

    const parent = runtime.createModule({ id: 'core', flags: ['OBJ_MODULE'] })
    const child = runtime.createObject({ id: 'atmosphere', klassId: 'atmosphere' })
    expect(child.ref).toBe(1)

    runtime.module_add(parent, child)
    expect(child.parent).toBe(parent)
    expect(child.ref).toBe(2)
    expect(parent.children.map((entry) => entry.id)).toEqual(['atmosphere'])

    const found = runtime.module_get_child(parent, 'atmosphere')
    expect(found).toBe(child)
    expect(child.ref).toBe(3)

    runtime.module_changed(parent, 'visible')
    expect(changed).toHaveBeenCalledWith(parent, 'visible')

    runtime.obj_release(found)
    runtime.module_remove(parent, child)
    expect(child.parent).toBeNull()
    expect(child.ref).toBe(1)
    expect(parent.children).toEqual([])
  })

  it('schedules MODULE_AGAIN data-source retries on the core task queue', () => {
    const core = new StellariumCoreRuntime()
    core.core_init({
      windowWidth: 1,
      windowHeight: 1,
      pixelScale: 1,
      clockSeconds: 1,
    })

    const runtime = new StellariumModuleRuntime({ core })
    const attempts = []
    const module = runtime.createModule({
      id: 'dss',
      flags: ['OBJ_MODULE'],
      addDataSource: (_module, url, key) => {
        attempts.push(`${url}:${key ?? ''}`)
        return attempts.length < 2 ? MODULE_AGAIN : 0
      },
    })

    expect(runtime.module_add_data_source(module, 'https://example.test/hips', 'survey-a')).toBe(MODULE_AGAIN)
    expect(core.snapshot().taskCount).toBe(1)

    core.core_update({ deltaSeconds: 0.016 })

    expect(attempts).toEqual([
      'https://example.test/hips:survey-a',
      'https://example.test/hips:survey-a',
    ])
    expect(core.snapshot().taskCount).toBe(0)
  })

  it('keeps explicit source anchors for the module.c function group', () => {
    expect(STELLARIUM_MODULE_SOURCE_FUNCTIONS).toEqual([
      'module_update',
      'module_list_objs',
      'module_list_objs2',
      'module_add_data_source',
      'module_get_render_order',
      'module_add_global_listener',
      'module_changed',
      'module_add',
      'module_add_new',
      'module_remove',
      'module_get_child',
    ])
  })
})
