export const STELLARIUM_OBJECT_SOURCE_FUNCTIONS = [
  'obj_register_',
  'obj_get_all_klasses',
  'obj_get_klass_by_name',
  'obj_create',
  'obj_create_str',
  'obj_release',
  'obj_retain',
  'obj_clone',
  'obj_get_name',
  'obj_get_id',
  'obj_get_designations',
  'obj_get_json_data',
  'obj_get_json_data_str',
  'obj_get_attr_',
  'obj_foreach_attr',
  'obj_has_attr',
  'obj_call_json',
  'obj_call_json_str',
  'obj_render',
  'obj_get_pvo',
  'obj_get_info',
] as const

export type StellariumObjectSourceFunction = typeof STELLARIUM_OBJECT_SOURCE_FUNCTIONS[number]
export type StellariumObjectInfo =
  | 'INFO_VMAG'
  | 'INFO_SEARCH_VMAG'
  | 'INFO_DISTANCE'
  | 'INFO_RADEC'
  | 'INFO_PVO'
  | 'INFO_LHA'
  | string

export interface StellariumObjectInfoResult {
  readonly status: number
  readonly value: unknown
}

export type StellariumObjectAttributeSetter = (
  obj: StellariumRuntimeObject,
  value: unknown,
) => void

export type StellariumObjectAttributeHandler = (
  obj: StellariumRuntimeObject,
  value: unknown,
) => unknown

export interface StellariumObjectAttribute {
  readonly isProp?: boolean
  readonly call: StellariumObjectAttributeHandler
}

export type StellariumObjectAttributeDefinition =
  | StellariumObjectAttributeSetter
  | StellariumObjectAttribute

export type StellariumDesignationCallback = (
  obj: StellariumRuntimeObject,
  user: unknown,
  catOrDesignation: string,
  value?: string,
) => number | void

export type StellariumDesignationConsumer = (
  obj: StellariumRuntimeObject,
  user: unknown,
  designation: string,
) => number | void

export interface StellariumObjectKlass {
  readonly id?: string | null
  readonly model?: string | null
  readonly createOrder?: number
  readonly renderOrder?: number
  readonly init?: (obj: StellariumRuntimeObject, args: Record<string, unknown> | null) => number
  readonly del?: (obj: StellariumRuntimeObject) => void
  readonly render?: (obj: StellariumRuntimeObject, painter: unknown) => number
  readonly clone?: (obj: StellariumRuntimeObject) => StellariumRuntimeObject | null
  readonly getInfo?: (
    obj: StellariumRuntimeObject,
    observer: unknown,
    info: StellariumObjectInfo,
  ) => StellariumObjectInfoResult
  readonly getDesignations?: (
    obj: StellariumRuntimeObject,
    user: unknown,
    callback: StellariumDesignationCallback,
  ) => void
  readonly getJsonData?: (obj: StellariumRuntimeObject) => Record<string, unknown>
  readonly getTypeParents?: (obj: StellariumRuntimeObject) => ReadonlyArray<string>
  readonly attributes?: Record<string, StellariumObjectAttributeDefinition>
}

export interface StellariumRuntimeObject {
  klass: StellariumObjectKlass
  ref: number
  id: string | null
  type: string
  parent: unknown | null
  children: StellariumRuntimeObject[]
  prev: StellariumRuntimeObject | null
  next: StellariumRuntimeObject | null
  state: Record<string, unknown>
}

/**
 * Source-shaped owner for the first `obj.c` / `obj.h` lifecycle slice.
 *
 * Ported source anchors:
 * - `obj_register_`, `obj_get_all_klasses`, `obj_get_klass_by_name`: global
 *   class table behavior, including creation/render-order sorting.
 * - `obj_create` / `obj_create_str`: class lookup by `id` or `model`, init
 *   callback, then argument-backed attribute calls for known attributes.
 * - `obj_retain` / `obj_release`: null-retain behavior, ref assertions,
 *   parent-owned release guard, destructor dispatch at zero.
 * - `obj_clone`, `obj_render`, `obj_get_name`, `obj_get_designations`,
 *   `obj_get_json_data`: vtable dispatch, designation joining, and immutable
 *   object-data envelope.
 *
 * The full native attribute JSON bridge, frame-backed position conversions,
 * object paths, and JSON tree dumping remain source-order successors.
 */
export class StellariumObjectRuntime {
  private readonly klasses: StellariumObjectKlass[] = []

  obj_register_klass(klass: StellariumObjectKlass) {
    if (!klass.id && !klass.model) {
      throw new Error('Stellarium object class requires id or model')
    }
    this.klasses.unshift(klass)
  }

  obj_get_all_klasses() {
    return [...this.klasses].sort((a, b) => this.klassSortKey(a) - this.klassSortKey(b))
  }

  obj_get_klass_by_name(name: string) {
    return this.klasses.find((klass) => klass.id === name) ?? null
  }

  obj_create(type: string, args: Record<string, unknown> | null = null) {
    const klass = this.klasses.find((entry) => entry.id === type || entry.model === type)
    if (!klass) {
      throw new Error(`Unknown Stellarium object class: ${type}`)
    }
    return this.obj_create_from_klass(klass, args)
  }

  obj_create_str(type: string, args: string | null = null) {
    const parsed = args ? this.parseObjectArgs(args) : null
    return this.obj_create(type, parsed)
  }

  obj_retain<T extends StellariumRuntimeObject | null>(obj: T): T {
    if (!obj) {
      return null as T
    }
    this.assertLive(obj)
    obj.ref += 1
    return obj
  }

  obj_release(obj: StellariumRuntimeObject | null) {
    if (!obj) {
      return
    }
    this.assertLive(obj)
    if (obj.ref === 1 && obj.parent) {
      throw new Error('Trying to delete an object still owned by a parent')
    }
    obj.ref -= 1
    if (obj.ref === 0) {
      obj.klass.del?.(obj)
    }
  }

  obj_clone(obj: StellariumRuntimeObject) {
    if (!obj.klass.clone) {
      throw new Error('obj_clone requires a class clone callback')
    }
    return obj.klass.clone(obj)
  }

  obj_render(obj: StellariumRuntimeObject, painter: unknown) {
    return obj.klass.render ? obj.klass.render(obj, painter) : 0
  }

  obj_get_id(obj: StellariumRuntimeObject) {
    return obj.id
  }

  obj_get_pvo(obj: StellariumRuntimeObject, observer: unknown): StellariumObjectInfoResult {
    if (!obj.klass.getInfo) {
      return { status: 1, value: null }
    }
    const result = obj.klass.getInfo(obj, observer, 'INFO_PVO')
    if (result.status === 0 && this.pvoHasNaN(result.value)) {
      throw new Error(`NAN value in obj position (${this.obj_get_name(obj)})`)
    }
    return result
  }

  obj_get_info(
    obj: StellariumRuntimeObject,
    observer: unknown,
    info: StellariumObjectInfo,
  ): StellariumObjectInfoResult {
    const direct = obj.klass.getInfo?.(obj, observer, info)
    if (direct && direct.status === 0) {
      return direct
    }
    if (direct && direct.status !== 1) {
      return direct
    }

    switch (info) {
      case 'INFO_RADEC': {
        const pvo = this.obj_get_info(obj, observer, 'INFO_PVO')
        if (pvo.status !== 0) {
          return pvo
        }
        return { status: 0, value: this.readPvoPosition(pvo.value) }
      }
      case 'INFO_PVO':
        return this.obj_get_pvo(obj, observer)
      case 'INFO_LHA':
        throw new Error('obj_get_info(INFO_LHA) requires full frames.c conversion support')
      case 'INFO_DISTANCE': {
        const pvo = this.obj_get_pvo(obj, observer)
        if (pvo.status !== 0) {
          return pvo
        }
        const pos = this.readPvoPosition(pvo.value)
        return {
          status: 0,
          value: pos[3] ? Math.hypot(pos[0], pos[1], pos[2]) : Number.NaN,
        }
      }
      case 'INFO_SEARCH_VMAG':
        return this.obj_get_info(obj, observer, 'INFO_VMAG')
      default:
        return { status: 1, value: null }
    }
  }

  obj_get_name(obj: StellariumRuntimeObject) {
    let score = 0
    let name = ''

    this.obj_get_designations(obj, null, (_entry, _user, designation) => {
      let currentDesignation = designation
      let currentScore = 1
      if (designation.startsWith('NAME ')) {
        currentDesignation = designation.slice(5)
        currentScore = 2
      }
      if (currentScore <= score) {
        return 0
      }
      score = currentScore
      name = currentDesignation
      return 0
    })

    return name
  }

  obj_get_designations(
    obj: StellariumRuntimeObject,
    user: unknown,
    callback: StellariumDesignationConsumer,
  ) {
    let count = 0
    obj.klass.getDesignations?.(obj, null, (_entry, _user, catOrDesignation, value) => {
      const designation = value === undefined
        ? catOrDesignation
        : catOrDesignation
          ? `${catOrDesignation} ${value}`
          : value
      callback(obj, user, designation)
      count += 1
      return 0
    })
    return count
  }

  obj_get_json_data(obj: StellariumRuntimeObject) {
    const ret: Record<string, unknown> = {
      ...(obj.klass.getJsonData?.(obj) ?? {}),
    }
    const model = obj.klass.model ?? obj.klass.id ?? null
    ret.model = model
    ret.types = [
      obj.type,
      ...(obj.klass.getTypeParents?.(obj) ?? []),
    ].filter((entry) => entry)

    const names: string[] = []
    this.obj_get_designations(obj, names, (_entry, out, designation) => {
      if (Array.isArray(out)) {
        out.push(designation)
      }
    })
    ret.names = names
    return ret
  }

  obj_get_json_data_str(obj: StellariumRuntimeObject) {
    return JSON.stringify(this.obj_get_json_data(obj))
  }

  obj_get_attr_(obj: StellariumRuntimeObject, attrName: string) {
    return obj.klass.attributes?.[attrName] ?? null
  }

  obj_foreach_attr(
    obj: StellariumRuntimeObject,
    user: unknown,
    callback: (attr: string, isProperty: boolean, user: unknown) => void,
  ) {
    const attributes = obj.klass.attributes
    if (!attributes) {
      return
    }
    for (const [name, attr] of Object.entries(attributes)) {
      callback(name, this.isPropertyAttribute(attr), user)
    }
  }

  obj_has_attr(obj: StellariumRuntimeObject, attr: string) {
    return this.obj_get_attr_(obj, attr) !== null
  }

  obj_call_json(obj: StellariumRuntimeObject, name: string, args: unknown) {
    const attr = this.obj_get_attr_(obj, name)
    if (!attr) {
      return null
    }
    return this.callAttribute(attr, obj, args)
  }

  obj_call_json_str(obj: StellariumRuntimeObject, attr: string, args: string | null) {
    const parsed = args === null ? null : JSON.parse(args)
    const ret = this.obj_call_json(obj, attr, parsed)
    return ret === null || ret === undefined ? null : JSON.stringify(ret)
  }

  private obj_create_from_klass(klass: StellariumObjectKlass, args: Record<string, unknown> | null) {
    const obj: StellariumRuntimeObject = {
      klass,
      ref: 1,
      id: null,
      type: '',
      parent: null,
      children: [],
      prev: null,
      next: null,
      state: {},
    }

    if (klass.init && klass.init(obj, args) !== 0) {
      return null
    }

    if (args) {
      for (const [attr, value] of Object.entries(args)) {
        const definition = klass.attributes?.[attr]
        if (definition) {
          this.callAttribute(definition, obj, value)
        }
      }
    }

    return obj
  }

  private parseObjectArgs(args: string) {
    const parsed = JSON.parse(args) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('obj_create_str requires a JSON object argument')
    }
    return parsed as Record<string, unknown>
  }

  private assertLive(obj: StellariumRuntimeObject) {
    if (obj.ref <= 0) {
      throw new Error('obj_retain/obj_release requires a non-zero ref')
    }
  }

  private klassSortKey(klass: StellariumObjectKlass) {
    return klass.createOrder ?? klass.renderOrder ?? 0
  }

  private callAttribute(
    attr: StellariumObjectAttributeDefinition,
    obj: StellariumRuntimeObject,
    args: unknown,
  ) {
    if (typeof attr === 'function') {
      return attr(obj, args)
    }
    return attr.call(obj, args)
  }

  private isPropertyAttribute(attr: StellariumObjectAttributeDefinition) {
    return typeof attr === 'function' ? true : attr.isProp === true
  }

  private readPvoPosition(value: unknown) {
    if (!Array.isArray(value) || !Array.isArray(value[0])) {
      throw new Error('obj_get_info expected INFO_PVO value shaped as double[2][4]')
    }
    const position = value[0]
    if (position.length < 4) {
      throw new Error('obj_get_info expected INFO_PVO position with four components')
    }
    return [
      Number(position[0]),
      Number(position[1]),
      Number(position[2]),
      Number(position[3]),
    ] as const
  }

  private pvoHasNaN(value: unknown) {
    if (!Array.isArray(value) || !Array.isArray(value[0])) {
      return false
    }
    return [value[0][0], value[0][1], value[0][2]].some((entry) => Number.isNaN(Number(entry)))
  }
}
