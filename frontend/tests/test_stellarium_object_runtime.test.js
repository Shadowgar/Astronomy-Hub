import { describe, expect, it, vi } from 'vitest'

import {
  STELLARIUM_OBJECT_SOURCE_FUNCTIONS,
  StellariumObjectRuntime,
} from '../src/features/sky-engine/engine/sky/runtime/StellariumObjectRuntime'

describe('StellariumObjectRuntime obj.c port spine', () => {
  it('creates objects by class id or model and applies matching attributes after init', () => {
    const runtime = new StellariumObjectRuntime()
    const init = vi.fn((obj) => {
      obj.state.initialized = true
      return 0
    })
    const changed = []

    runtime.obj_register_klass({
      id: 'stars',
      model: 'StarsModel',
      init,
      attributes: {
        id: (obj, value) => {
          obj.id = String(value)
          changed.push(`id:${obj.id}`)
        },
        visible: (obj, value) => {
          obj.state.visible = Boolean(value)
          changed.push(`visible:${obj.state.visible}`)
        },
      },
    })

    const byId = runtime.obj_create('stars', { id: 'hip', visible: false, ignored: true })
    const byModel = runtime.obj_create('StarsModel', { id: 'gaia', visible: true })

    expect(init).toHaveBeenCalledTimes(2)
    expect(byId.id).toBe('hip')
    expect(byId.ref).toBe(1)
    expect(byId.state).toMatchObject({ initialized: true, visible: false })
    expect(byModel.id).toBe('gaia')
    expect(byModel.state.visible).toBe(true)
    expect(changed).toEqual(['id:hip', 'visible:false', 'id:gaia', 'visible:true'])
  })

  it('returns null when init fails and rejects unknown classes', () => {
    const runtime = new StellariumObjectRuntime()
    runtime.obj_register_klass({
      id: 'broken',
      init: () => -1,
    })

    expect(runtime.obj_create('broken', {})).toBeNull()
    expect(() => runtime.obj_create('missing', {})).toThrow(/Unknown Stellarium object class/)
  })

  it('retains, releases, calls destructors at zero, and protects parent-owned objects', () => {
    const runtime = new StellariumObjectRuntime()
    const deleted = vi.fn()
    runtime.obj_register_klass({ id: 'planet', del: deleted })

    const obj = runtime.obj_create('planet', {})
    expect(runtime.obj_retain(obj)).toBe(obj)
    expect(obj.ref).toBe(2)

    runtime.obj_release(obj)
    expect(obj.ref).toBe(1)
    expect(deleted).not.toHaveBeenCalled()

    obj.parent = { id: 'core' }
    expect(() => runtime.obj_release(obj)).toThrow(/still owned by a parent/)
    expect(obj.ref).toBe(1)
    expect(deleted).not.toHaveBeenCalled()

    obj.parent = null
    runtime.obj_release(obj)
    expect(obj.ref).toBe(0)
    expect(deleted).toHaveBeenCalledWith(obj)
    expect(runtime.obj_retain(null)).toBeNull()
    expect(() => runtime.obj_release(obj)).toThrow(/non-zero ref/)
  })

  it('dispatches clone and render through the class table', () => {
    const runtime = new StellariumObjectRuntime()
    const render = vi.fn(() => 3)
    runtime.obj_register_klass({
      id: 'overlay',
      render,
      clone: (obj) => runtime.obj_create('overlay', { id: `${obj.id}-copy` }),
      attributes: {
        id: (obj, value) => {
          obj.id = String(value)
        },
      },
    })
    runtime.obj_register_klass({ id: 'empty' })

    const obj = runtime.obj_create('overlay', { id: 'labels' })
    const clone = runtime.obj_clone(obj)

    expect(clone.id).toBe('labels-copy')
    expect(runtime.obj_render(obj, { painter: true })).toBe(3)
    expect(render).toHaveBeenCalledWith(obj, { painter: true })
    expect(runtime.obj_render(runtime.obj_create('empty', {}), {})).toBe(0)
  })

  it('selects object names from designations with NAME preference', () => {
    const runtime = new StellariumObjectRuntime()
    runtime.obj_register_klass({
      id: 'star',
      getDesignations: (_obj, user, callback) => {
        callback(_obj, user, 'HIP 11767')
        callback(_obj, user, 'NAME Sirius')
        callback(_obj, user, 'HD 48915')
      },
    })

    expect(runtime.obj_get_name(runtime.obj_create('star', {}))).toBe('Sirius')
  })

  it('lists designations with source cat/value joining and returns object ids', () => {
    const runtime = new StellariumObjectRuntime()
    runtime.obj_register_klass({
      id: 'designation-source',
      attributes: {
        id: (obj, value) => {
          obj.id = String(value)
        },
      },
      getDesignations: (obj, user, callback) => {
        callback(obj, user, 'HIP', '11767')
        callback(obj, user, '', 'NAME Sirius')
      },
    })

    const obj = runtime.obj_create('designation-source', { id: 'sirius' })
    const designations = []

    expect(runtime.obj_get_designations(obj, designations, (_obj, out, designation) => {
      out.push(designation)
    })).toBe(2)
    expect(designations).toEqual(['HIP 11767', 'NAME Sirius'])
    expect(runtime.obj_get_id(obj)).toBe('sirius')
  })

  it('builds generic json data with model, type ancestry, and names', () => {
    const runtime = new StellariumObjectRuntime()
    runtime.obj_register_klass({
      id: 'star',
      model: 'StarModel',
      getJsonData: () => ({ immutable: true }),
      getTypeParents: () => ['Obj'],
      init: (obj) => {
        obj.type = 'Star'
        return 0
      },
      getDesignations: (obj, user, callback) => {
        callback(obj, user, '', 'NAME Sirius')
        callback(obj, user, 'HIP', '11767')
      },
    })

    const data = runtime.obj_get_json_data(runtime.obj_create('star', {}))

    expect(data).toEqual({
      immutable: true,
      model: 'StarModel',
      types: ['Star', 'Obj'],
      names: ['NAME Sirius', 'HIP 11767'],
    })
    expect(runtime.obj_get_json_data_str(runtime.obj_create('star', {}))).toBe(
      '{"immutable":true,"model":"StarModel","types":["Star","Obj"],"names":["NAME Sirius","HIP 11767"]}',
    )
  })

  it('preserves direct designation strings for existing class callbacks', () => {
    const runtime = new StellariumObjectRuntime()
    runtime.obj_register_klass({
      id: 'legacy-designation-source',
      getDesignations: (obj, user, callback) => {
        callback(obj, user, 'NAME Vega')
      },
    })

    const out = []
    expect(runtime.obj_get_designations(runtime.obj_create('legacy-designation-source', {}), out, (_obj, user, designation) => {
      user.push(designation)
    })).toBe(1)
    expect(out).toEqual(['NAME Vega'])
  })

  it('looks up, lists, and calls object attributes through obj_call_json', () => {
    const runtime = new StellariumObjectRuntime()
    const changed = []
    runtime.obj_register_klass({
      id: 'attr-source',
      attributes: {
        visible: {
          isProp: true,
          call: (obj, value) => {
            if (value === undefined || value === null) {
              return obj.state.visible
            }
            obj.state.visible = Boolean(value)
            changed.push(`visible:${obj.state.visible}`)
            return null
          },
        },
        reset: {
          isProp: false,
          call: (obj) => {
            obj.state.visible = true
            return 'reset'
          },
        },
      },
    })

    const obj = runtime.obj_create('attr-source', {})
    obj.state.visible = false
    const attrs = []

    expect(runtime.obj_has_attr(obj, 'visible')).toBe(true)
    expect(runtime.obj_get_attr_(obj, 'missing')).toBeNull()
    runtime.obj_foreach_attr(obj, attrs, (attr, isProperty, out) => {
      out.push(`${attr}:${isProperty ? 'prop' : 'fn'}`)
    })
    expect(attrs).toEqual(['visible:prop', 'reset:fn'])
    expect(runtime.obj_call_json(obj, 'visible', null)).toBe(false)
    expect(runtime.obj_call_json(obj, 'visible', true)).toBeNull()
    expect(runtime.obj_call_json(obj, 'reset', null)).toBe('reset')
    expect(changed).toEqual(['visible:true'])
  })

  it('serializes obj_call_json_str results and fails missing attributes as null', () => {
    const runtime = new StellariumObjectRuntime()
    runtime.obj_register_klass({
      id: 'attr-string-source',
      attributes: {
        value: (obj, value) => {
          if (value !== undefined && value !== null) {
            obj.state.value = value
            return null
          }
          return { v: obj.state.value }
        },
      },
    })

    const obj = runtime.obj_create('attr-string-source', {})
    expect(runtime.obj_call_json_str(obj, 'value', '{"n":7}')).toBeNull()
    expect(runtime.obj_call_json_str(obj, 'value', null)).toBe('{"v":{"n":7}}')
    expect(runtime.obj_call_json(obj, 'missing', null)).toBeNull()
  })

  it('sets constructor args through function-style attributes', () => {
    const runtime = new StellariumObjectRuntime()
    runtime.obj_register_klass({
      id: 'function-attr-source',
      attributes: {
        mode: (_obj, value) => `mode:${value}`,
      },
    })

    const obj = runtime.obj_create('function-attr-source', { mode: 'equatorial' })

    expect(runtime.obj_call_json(obj, 'mode', 'azimuthal')).toBe('mode:azimuthal')
  })

  it('applies obj_get_info source fallbacks for PVO-derived values and search magnitude', () => {
    const runtime = new StellariumObjectRuntime()
    runtime.obj_register_klass({
      id: 'body',
      getInfo: (_obj, _observer, info) => {
        if (info === 'INFO_PVO') {
          return {
            status: 0,
            value: [
              [3, 4, 0, 1],
              [0, 0, 0, 0],
            ],
          }
        }
        if (info === 'INFO_VMAG') {
          return { status: 0, value: 2.5 }
        }
        return { status: 1, value: null }
      },
    })

    const obj = runtime.obj_create('body', {})

    expect(runtime.obj_get_info(obj, null, 'INFO_RADEC')).toEqual({
      status: 0,
      value: [3, 4, 0, 1],
    })
    expect(runtime.obj_get_info(obj, null, 'INFO_DISTANCE')).toEqual({
      status: 0,
      value: 5,
    })
    expect(runtime.obj_get_info(obj, null, 'INFO_SEARCH_VMAG')).toEqual({
      status: 0,
      value: 2.5,
    })
    expect(() => runtime.obj_get_info(obj, null, 'INFO_LHA')).toThrow(/requires full frames/)
  })

  it('propagates concrete obj_get_info errors instead of falling back', () => {
    const runtime = new StellariumObjectRuntime()
    runtime.obj_register_klass({
      id: 'error-body',
      getInfo: () => ({ status: -7, value: 'bad' }),
    })

    expect(runtime.obj_get_info(runtime.obj_create('error-body', {}), null, 'INFO_DISTANCE')).toEqual({
      status: -7,
      value: 'bad',
    })
  })

  it('keeps explicit source anchors for the obj.c function group', () => {
    expect(STELLARIUM_OBJECT_SOURCE_FUNCTIONS).toEqual([
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
    ])
  })
})
