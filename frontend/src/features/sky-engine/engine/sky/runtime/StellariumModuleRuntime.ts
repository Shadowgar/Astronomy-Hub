import type { StellariumCoreRuntime } from './StellariumCoreRuntime'

export const MODULE_AGAIN = 2

export const STELLARIUM_MODULE_SOURCE_FUNCTIONS = [
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
] as const

export type StellariumModuleSourceFunction = typeof STELLARIUM_MODULE_SOURCE_FUNCTIONS[number]
export type StellariumObjectFlag = 'OBJ_MODULE' | 'OBJ_LISTABLE' | 'OBJ_IN_JSON_TREE'

export interface StellariumObjectLike {
  readonly id: string | null
  readonly klassId: string
  readonly flags: ReadonlySet<StellariumObjectFlag>
  readonly renderOrder: number
  readonly update?: (module: StellariumObjectLike, deltaSeconds: number) => number
  readonly list?: (
    module: StellariumObjectLike,
    maxMagnitude: number,
    hint: number,
    source: string | null,
    user: unknown,
    callback: (user: unknown, obj: StellariumObjectLike) => number,
  ) => number
  readonly addDataSource?: (module: StellariumObjectLike, url: string, key: string | null) => number
  readonly getRenderOrder?: (module: StellariumObjectLike) => number
  parent: StellariumObjectLike | null
  ref: number
  children: StellariumObjectLike[]
}

export interface StellariumObjectInput {
  readonly id?: string | null
  readonly klassId?: string
  readonly renderOrder?: number
  readonly flags?: ReadonlyArray<StellariumObjectFlag>
  readonly update?: StellariumObjectLike['update']
  readonly list?: StellariumObjectLike['list']
  readonly addDataSource?: StellariumObjectLike['addDataSource']
  readonly getRenderOrder?: StellariumObjectLike['getRenderOrder']
  readonly children?: ReadonlyArray<StellariumObjectLike>
}

export interface StellariumModuleRuntimeConfig {
  readonly core?: StellariumCoreRuntime | null
}

/**
 * Source-shaped owner for the first `module.c` / `module.h` slice.
 *
 * Ported source anchors:
 * - `module_update`: module flag assertion + optional class update callback.
 * - `module_list_objs`: class `list` override or default listable child traversal.
 * - `module_add_data_source`: immediate add attempt and `MODULE_AGAIN` retry through `core_add_task`.
 * - `module_get_render_order`: callback fallback to class render-order field.
 * - `module_add_global_listener` / `module_changed`.
 * - `module_add`, `module_remove`, `module_get_child`: parent/children and retain/release semantics.
 *
 * Full `obj.c` class registry, JSON tree generation, and path serialization stay
 * blocked until the next source-order object runtime slice.
 */
export class StellariumModuleRuntime {
  private readonly core: StellariumCoreRuntime | null
  private globalListener: ((module: StellariumObjectLike, attr: string) => void) | null = null

  constructor(config: StellariumModuleRuntimeConfig = {}) {
    this.core = config.core ?? null
  }

  createObject(input: StellariumObjectInput = {}): StellariumObjectLike {
    const object: StellariumObjectLike = {
      id: input.id ?? null,
      klassId: input.klassId ?? input.id ?? 'obj',
      flags: new Set(input.flags ?? []),
      renderOrder: input.renderOrder ?? 0,
      update: input.update,
      list: input.list,
      addDataSource: input.addDataSource,
      getRenderOrder: input.getRenderOrder,
      parent: null,
      ref: 1,
      children: [],
    }

    for (const child of input.children ?? []) {
      this.module_add(object, child)
    }

    return object
  }

  createModule(input: StellariumObjectInput = {}) {
    const flags = new Set<StellariumObjectFlag>(input.flags ?? [])
    flags.add('OBJ_MODULE')
    return this.createObject({
      ...input,
      flags: Array.from(flags),
      klassId: input.klassId ?? input.id ?? 'module',
    })
  }

  module_update(module: StellariumObjectLike, deltaSeconds: number) {
    this.assertModule(module)
    if (!module.update) {
      return 0
    }
    return module.update(module, deltaSeconds)
  }

  module_list_objs(
    obj: StellariumObjectLike,
    maxMagnitude: number,
    hint: number,
    source: string | null,
    user: unknown,
    callback: (user: unknown, obj: StellariumObjectLike) => number,
  ) {
    if (obj.list) {
      return obj.list(obj, maxMagnitude, hint, source, user, callback)
    }
    if (!obj.flags.has('OBJ_LISTABLE')) {
      return -1
    }

    for (const child of obj.children) {
      if (callback(user, child)) {
        break
      }
    }
    return 0
  }

  module_list_objs2(
    obj: StellariumObjectLike,
    maxMagnitude: number,
    user: unknown,
    callback: (user: unknown, obj: StellariumObjectLike) => number,
  ) {
    return this.module_list_objs(obj, maxMagnitude, 0, null, user, callback)
  }

  module_add_data_source(module: StellariumObjectLike, url: string, key: string | null) {
    if (!module.addDataSource) {
      throw new Error('module_add_data_source requires a module addDataSource callback')
    }

    const result = module.addDataSource(module, url, key)
    if (result === MODULE_AGAIN && this.core) {
      this.core.core_add_task(() => {
        const retryResult = module.addDataSource?.(module, url, key)
        return retryResult === MODULE_AGAIN ? 0 : 1
      }, {
        module,
        url,
        key,
      })
    }
    return result
  }

  module_get_render_order(module: StellariumObjectLike) {
    return module.getRenderOrder ? module.getRenderOrder(module) : module.renderOrder
  }

  module_add_global_listener(listener: (module: StellariumObjectLike, attr: string) => void) {
    this.globalListener = listener
  }

  module_changed(module: StellariumObjectLike, attr: string) {
    this.globalListener?.(module, attr)
  }

  module_add(parent: StellariumObjectLike, child: StellariumObjectLike) {
    if (child.parent) {
      throw new Error('module_add requires a child without an existing parent')
    }
    child.parent = parent
    parent.children.push(child)
    this.obj_retain(child)
  }

  module_add_new(parent: StellariumObjectLike, input: StellariumObjectInput) {
    const child = this.createObject(input)
    this.module_add(parent, child)
    this.obj_release(child)
    return child
  }

  module_remove(parent: StellariumObjectLike, child: StellariumObjectLike) {
    if (child.parent !== parent) {
      throw new Error('module_remove requires child.parent to match parent')
    }
    child.parent = null
    parent.children = parent.children.filter((entry) => entry !== child)
    this.obj_release(child)
  }

  module_get_child(module: StellariumObjectLike, id: string) {
    const child = module.children.find((entry) => entry.id === id) ?? null
    if (child) {
      this.obj_retain(child)
    }
    return child
  }

  obj_retain<T extends StellariumObjectLike>(obj: T): T {
    obj.ref += 1
    return obj
  }

  obj_release(obj: StellariumObjectLike) {
    obj.ref = Math.max(0, obj.ref - 1)
  }

  private assertModule(module: StellariumObjectLike) {
    if (!module.flags.has('OBJ_MODULE')) {
      throw new Error('module_update requires OBJ_MODULE')
    }
  }
}
