import { describe, expect, it, vi } from 'vitest'

import {
  PROJ_COUNT,
  PROJ_HAMMER,
  PROJ_HAS_DISCONTINUITY,
  PROJ_MERCATOR,
  PROJ_PERSPECTIVE,
  STELLARIUM_PROJ_MERCATOR_SOURCE_FUNCTIONS,
  STELLARIUM_PROJECTION_SOURCE_FUNCTIONS,
  STELLARIUM_PROJ_HAMMER_SOURCE_FUNCTIONS,
  StellariumProjectionRuntime,
  createStellariumHammerProjectionKlass,
  createStellariumMercatorProjectionKlass,
} from '../src/features/sky-engine/engine/sky/runtime/StellariumProjectionRuntime'

describe('StellariumProjectionRuntime projection.c port spine', () => {
  it('registers projection classes and delegates FOV computation', () => {
    const runtime = new StellariumProjectionRuntime()
    const computeFovs = vi.fn((_type, fov, aspect) => ({
      fovx: fov * aspect,
      fovy: fov,
    }))

    runtime.proj_register_({
      id: PROJ_PERSPECTIVE,
      name: 'perspective',
      maxFov: Math.PI,
      maxUiFov: Math.PI / 2,
      init: vi.fn(),
      project: (_input) => ({ ok: true, value: [0, 0, 0] }),
      backward: (_input) => ({ ok: true, value: [0, 0, 1] }),
      computeFovs,
    })

    expect(PROJ_COUNT).toBe(6)
    expect(runtime.projection_compute_fovs(PROJ_PERSPECTIVE, 0.5, 2)).toEqual({
      fovx: 1,
      fovy: 0.5,
    })
    expect(computeFovs).toHaveBeenCalledWith(PROJ_PERSPECTIVE, 0.5, 2)
  })

  it('initializes projection state and projects to clip and window coordinates', () => {
    const runtime = new StellariumProjectionRuntime()
    const init = vi.fn((projection, fovy, aspect) => {
      projection.flags = 64
      projection.mat = [
        [2, 0, 0, 0],
        [0, 2, 0, 0],
        [0, 0, 2, 0],
        [0, 0, 0, 1],
      ]
      projection.state.aspect = aspect
      projection.state.fovy = fovy
    })

    runtime.proj_register_({
      id: PROJ_PERSPECTIVE,
      name: 'perspective',
      maxFov: Math.PI,
      maxUiFov: Math.PI / 2,
      init,
      project: (input) => ({ ok: input[2] >= 0, value: [input[0] + 1, input[1] - 1, input[2]] }),
      backward: (input) => ({ ok: true, value: [input[0] - 1, input[1] + 1, input[2]] }),
      computeFovs: (_type, fov, aspect) => ({ fovx: fov * aspect, fovy: fov }),
    })

    const projection = runtime.projection_init(PROJ_PERSPECTIVE, 0.75, 800, 400)

    expect(init).toHaveBeenCalledWith(projection, 0.75, 2)
    expect(projection.windowSize).toEqual([800, 400])
    expect(projection.fovy).toBe(0.75)
    expect(projection.state).toMatchObject({ aspect: 2, fovy: 0.75 })
    expect(runtime.project_to_clip(projection, [1, 2, 0.25])).toEqual({
      ok: true,
      value: [4, 2, 0.5, 1],
    })
    expect(runtime.project_to_win(projection, [1, 2, 0.25])).toEqual({
      ok: true,
      value: [2000, -200, 0.75],
    })
    expect(runtime.project_to_win_xy(projection, [1, 2, 0.25])).toEqual({
      ok: true,
      value: [2000, -200],
    })
    expect(runtime.project_to_clip(projection, [1, 2, -1]).ok).toBe(false)
  })

  it('unprojects window coordinates through inverse projection matrix and backward class callback', () => {
    const runtime = new StellariumProjectionRuntime()
    runtime.proj_register_({
      id: PROJ_PERSPECTIVE,
      name: 'perspective',
      maxFov: Math.PI,
      maxUiFov: Math.PI / 2,
      init: (projection) => {
        projection.mat = [
          [2, 0, 0, 0],
          [0, 4, 0, 0],
          [0, 0, 2, 0],
          [0, 0, 0, 1],
        ]
      },
      project: (input) => ({ ok: true, value: input }),
      backward: (input) => ({ ok: true, value: [input[0] * 10, input[1] * 10, input[2] * 10] }),
      computeFovs: (_type, fov, aspect) => ({ fovx: fov * aspect, fovy: fov }),
    })

    const projection = runtime.projection_init(PROJ_PERSPECTIVE, 1, 800, 400)

    expect(runtime.unproject(projection, [800, 0, 1])).toEqual({
      ok: true,
      value: [5, 2.5, 5],
    })
  })

  it('keeps explicit source anchors for projection.c', () => {
    expect(STELLARIUM_PROJECTION_SOURCE_FUNCTIONS).toEqual([
      'proj_register_',
      'projection_compute_fovs',
      'projection_init',
      'project_to_clip',
      'project_to_win',
      'project_to_win_xy',
      'unproject',
    ])
  })
})

describe('StellariumProjectionRuntime proj_mercator.c port', () => {
  it('projects and back-projects Mercator coordinates from the native formulas', () => {
    const mercator = createStellariumMercatorProjectionKlass()
    const center = mercator.project([0, 0, -2])
    const elevated = mercator.project([0, 0.5, -Math.sqrt(0.75)])
    const backCenter = mercator.backward([0, 0, -1])
    const backElevated = mercator.backward([0, 0.5493061443340549, -1])
    const outside = mercator.backward([Math.PI + 0.1, 0, -1])

    expect(mercator.id).toBe(PROJ_MERCATOR)
    expect(mercator.maxFov).toBeCloseTo(2 * Math.PI, 12)
    expect(mercator.maxUiFov).toBeCloseTo(175 * Math.PI / 180, 12)
    expect(center).toEqual({ ok: true, value: [0, 0, -2] })
    expect(elevated.ok).toBe(true)
    expect(elevated.value[0]).toBeCloseTo(0, 12)
    expect(elevated.value[1]).toBeCloseTo(0.5493061443340549, 12)
    expect(elevated.value[2]).toBeCloseTo(-1, 12)
    expect(backCenter).toEqual({ ok: true, value: [0, 0, -1] })
    expect(backElevated.ok).toBe(true)
    expect(backElevated.value[1]).toBeCloseTo(0.5, 12)
    expect(backElevated.value[2]).toBeCloseTo(-Math.sqrt(0.75), 12)
    expect(outside.ok).toBe(false)
  })

  it('uses the native polar guard and init flag behavior', () => {
    const runtime = new StellariumProjectionRuntime()
    const mercator = createStellariumMercatorProjectionKlass()
    const northPole = mercator.project([0, 1, 0])
    runtime.proj_register_(mercator)

    const projection = runtime.projection_init(PROJ_MERCATOR, 1, 800, 400)

    expect(northPole).toEqual({ ok: true, value: [Math.PI, 1024, -1] })
    expect(projection.flags).toBe(PROJ_HAS_DISCONTINUITY)
  })

  it('keeps explicit source anchors for proj_mercator.c', () => {
    expect(STELLARIUM_PROJ_MERCATOR_SOURCE_FUNCTIONS).toEqual([
      'proj_mercator_project',
      'proj_mercator_backward',
      'proj_mercator_init',
    ])
  })
})

describe('StellariumProjectionRuntime proj_hammer.c port', () => {
  it('projects and back-projects Hammer coordinates from the native formulas', () => {
    const hammer = createStellariumHammerProjectionKlass()
    const center = hammer.project([0, 0, -1])
    const rightAngle = hammer.project([1, 0, 0])
    const backCenter = hammer.backward([0, 0, -1])
    const outside = hammer.backward([4, 0, 0])

    expect(hammer.id).toBe(PROJ_HAMMER)
    expect(hammer.maxFov).toBeCloseTo(2 * Math.PI, 12)
    expect(hammer.maxUiFov).toBeCloseTo(2 * Math.PI, 12)
    expect(center).toEqual({ ok: true, value: [0, 0, -1] })
    expect(rightAngle.ok).toBe(true)
    expect(rightAngle.value[0]).toBeCloseTo(2 / Math.sqrt(1 + Math.SQRT1_2), 12)
    expect(rightAngle.value[1]).toBeCloseTo(0, 12)
    expect(rightAngle.value[2]).toBeCloseTo(-1, 12)
    expect(backCenter).toEqual({ ok: true, value: [0, 0, -1] })
    expect(outside.ok).toBe(false)
  })

  it('initializes Hammer projection flags without changing the projection matrix', () => {
    const runtime = new StellariumProjectionRuntime()
    runtime.proj_register_(createStellariumHammerProjectionKlass())

    const projection = runtime.projection_init(PROJ_HAMMER, 1, 800, 400)

    expect(projection.flags).toBe(PROJ_HAS_DISCONTINUITY)
    expect(projection.mat).toEqual([
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ])
  })

  it('keeps explicit source anchors for proj_hammer.c', () => {
    expect(STELLARIUM_PROJ_HAMMER_SOURCE_FUNCTIONS).toEqual([
      'proj_hammer_project',
      'proj_hammer_backward',
      'proj_hammer_init',
    ])
  })
})
