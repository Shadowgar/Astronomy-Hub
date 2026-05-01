export const PROJ_NULL = 0
export const PROJ_PERSPECTIVE = 1
export const PROJ_STEREOGRAPHIC = 2
export const PROJ_MERCATOR = 3
export const PROJ_HAMMER = 4
export const PROJ_MOLLWEIDE = 5
export const PROJ_COUNT = 6

export const PROJ_FLIP_VERTICAL = 1 << 5
export const PROJ_FLIP_HORIZONTAL = 1 << 6
export const PROJ_HAS_DISCONTINUITY = 1 << 7

export const STELLARIUM_PROJECTION_SOURCE_FUNCTIONS = [
  'proj_register_',
  'projection_compute_fovs',
  'projection_init',
  'project_to_clip',
  'project_to_win',
  'project_to_win_xy',
  'unproject',
] as const

export const STELLARIUM_PROJ_HAMMER_SOURCE_FUNCTIONS = [
  'proj_hammer_project',
  'proj_hammer_backward',
  'proj_hammer_init',
] as const

export const STELLARIUM_PROJ_MERCATOR_SOURCE_FUNCTIONS = [
  'proj_mercator_project',
  'proj_mercator_backward',
  'proj_mercator_init',
] as const

export type StellariumProjectionSourceFunction = typeof STELLARIUM_PROJECTION_SOURCE_FUNCTIONS[number]
export type Vec3 = readonly [number, number, number]
export type Vec4 = readonly [number, number, number, number]
export type Mat4 = readonly [
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
]

export interface StellariumProjectionResult<T> {
  readonly ok: boolean
  readonly value: T
}

export interface StellariumProjectionKlass {
  readonly id: number
  readonly name: string
  readonly maxFov: number
  readonly maxUiFov: number
  readonly init: (projection: StellariumProjection, fovy: number, aspect: number) => void
  readonly project: (input: Vec3) => StellariumProjectionResult<Vec3>
  readonly backward: (input: Vec3) => StellariumProjectionResult<Vec3>
  readonly computeFovs: (projType: number, fov: number, aspect: number) => {
    readonly fovx: number
    readonly fovy: number
  }
}

export interface StellariumProjection {
  klass: StellariumProjectionKlass
  fovy: number
  flags: number
  mat: Mat4
  windowSize: [number, number]
  state: Record<string, unknown>
}

const IDENTITY_MAT4: Mat4 = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
]

/**
 * Source-shaped owner for the generic `projection.c` / `projection.h` layer.
 *
 * This ports the class registry, projection initialization, clip/window
 * projection wrappers, and `unproject` matrix pre/post processing. Individual
 * native projection classes (`projections/*.c`) remain source-order successors.
 */
export class StellariumProjectionRuntime {
  private readonly klasses: Array<StellariumProjectionKlass | null> = Array(PROJ_COUNT).fill(null)

  proj_register_(klass: StellariumProjectionKlass) {
    if (klass.id < 0 || klass.id >= PROJ_COUNT) {
      throw new Error(`Invalid Stellarium projection id: ${klass.id}`)
    }
    this.klasses[klass.id] = klass
  }

  projection_compute_fovs(type: number, fov: number, aspect: number) {
    return this.requireKlass(type).computeFovs(type, fov, aspect)
  }

  projection_init(type: number, fovy: number, w: number, h: number): StellariumProjection {
    const klass = this.requireKlass(type)
    const projection: StellariumProjection = {
      klass,
      fovy,
      flags: 0,
      mat: IDENTITY_MAT4,
      windowSize: [w, h],
      state: {},
    }
    klass.init(projection, fovy, w / h)
    return projection
  }

  project_to_clip(proj: StellariumProjection, input: Vec3): StellariumProjectionResult<Vec4> {
    const projected = proj.klass.project(input)
    const out = mat4MulVec4(proj.mat, [
      projected.value[0],
      projected.value[1],
      projected.value[2],
      1,
    ])
    return { ok: projected.ok, value: out }
  }

  project_to_win(proj: StellariumProjection, input: Vec3): StellariumProjectionResult<Vec3> {
    const projected = proj.klass.project(input)
    const p = mat4MulVec4(proj.mat, [
      projected.value[0],
      projected.value[1],
      projected.value[2],
      1,
    ])
    if (!p[3]) {
      return { ok: false, value: [0, 0, 0] }
    }
    const ndc: Vec3 = [p[0] / p[3], p[1] / p[3], p[2] / p[3]]
    return {
      ok: true,
      value: [
        ((ndc[0] + 1) / 2) * proj.windowSize[0],
        ((-ndc[1] + 1) / 2) * proj.windowSize[1],
        (ndc[2] + 1) / 2,
      ],
    }
  }

  project_to_win_xy(proj: StellariumProjection, input: Vec3): StellariumProjectionResult<readonly [number, number]> {
    const win = this.project_to_win(proj, input)
    if (!win.ok) {
      return { ok: false, value: [0, 0] }
    }
    return { ok: true, value: [win.value[0], win.value[1]] }
  }

  unproject(proj: StellariumProjection, v: Vec3): StellariumProjectionResult<Vec3> {
    const p: Vec4 = [
      (v[0] / proj.windowSize[0]) * 2 - 1,
      1 - (v[1] / proj.windowSize[1]) * 2,
      2 * v[2] - 1,
      1,
    ]
    const inv = invertMat4(proj.mat)
    if (!inv) {
      throw new Error('Cannot invert Stellarium projection matrix')
    }
    const out = mat4MulVec4(inv, p)
    return proj.klass.backward([out[0], out[1], out[2]])
  }

  private requireKlass(type: number) {
    const klass = this.klasses[type]
    if (!klass) {
      throw new Error(`Unregistered Stellarium projection type: ${type}`)
    }
    return klass
  }
}

export function createStellariumHammerProjectionKlass(): StellariumProjectionKlass {
  return {
    id: PROJ_HAMMER,
    name: 'hammer',
    maxFov: 360 * (Math.PI / 180),
    maxUiFov: 360 * (Math.PI / 180),
    init: (projection) => {
      projection.flags = PROJ_HAS_DISCONTINUITY
    },
    project: projHammerProject,
    backward: projHammerBackward,
    computeFovs: () => {
      throw new Error('proj_hammer.c does not define compute_fovs')
    },
  }
}

export function createStellariumMercatorProjectionKlass(): StellariumProjectionKlass {
  return {
    id: PROJ_MERCATOR,
    name: 'mercator',
    maxFov: 360 * (Math.PI / 180),
    maxUiFov: 175 * (Math.PI / 180),
    init: (projection) => {
      projection.flags = PROJ_HAS_DISCONTINUITY
    },
    project: projMercatorProject,
    backward: projMercatorBackward,
    computeFovs: () => {
      throw new Error('proj_mercator.c does not define compute_fovs')
    },
  }
}

function projHammerProject(v: Vec3): StellariumProjectionResult<Vec3> {
  const r = Math.hypot(v[0], v[1], v[2])
  const alpha = Math.atan2(v[0], -v[2])
  const cosDelta = Math.sqrt(1 - (v[1] * v[1]) / (r * r))
  const z = Math.sqrt(1 + cosDelta * Math.cos(alpha / 2))
  return {
    ok: true,
    value: [
      r * ((2 * Math.SQRT2 * cosDelta * Math.sin(alpha / 2)) / z),
      r * ((Math.SQRT2 * v[1]) / r / z),
      r * -1,
    ],
  }
}

function projHammerBackward(v: Vec3): StellariumProjectionResult<Vec3> {
  const zsq = 1 - 0.25 * 0.25 * v[0] * v[0] - 0.5 * 0.5 * v[1] * v[1]
  const ok = 0.25 * v[0] * v[0] + v[1] * v[1] < 2.0
  const z = zsq < 0 ? 0 : Math.sqrt(zsq)
  const alpha = 2 * Math.atan2(z * v[0], 2 * (2 * zsq - 1))
  const delta = Math.asin(v[1] * z)
  const cd = Math.cos(delta)
  return {
    ok,
    value: [
      cd * Math.sin(alpha),
      v[1] * z,
      -cd * Math.cos(alpha),
    ],
  }
}

function projMercatorProject(v: Vec3): StellariumProjectionResult<Vec3> {
  const r = Math.hypot(v[0], v[1], v[2])
  const p: [number, number, number] = [
    v[0] / r,
    v[1] / r,
    v[2] / r,
  ]
  const s = p[1]
  p[0] = Math.atan2(p[0], -p[2])
  p[1] = Math.abs(s) !== 1
    ? 0.5 * Math.log((1 + s) / (1 - s))
    : 1024
  p[2] = -1
  return {
    ok: true,
    value: [r * p[0], r * p[1], r * p[2]],
  }
}

function projMercatorBackward(v: Vec3): StellariumProjectionResult<Vec3> {
  const ok = v[1] < Math.PI / 2 && v[1] > -Math.PI / 2 && v[0] > -Math.PI && v[0] < Math.PI
  const e = Math.exp(v[1])
  const h = e * e
  const h1 = 1.0 / (1.0 + h)
  const sinDelta = (h - 1.0) * h1
  const cosDelta = 2.0 * e * h1
  return {
    ok,
    value: [
      cosDelta * Math.sin(v[0]),
      sinDelta,
      -cosDelta * Math.cos(v[0]),
    ],
  }
}

function mat4MulVec4(mat: Mat4, vec: Vec4): Vec4 {
  return [
    mat[0][0] * vec[0] + mat[0][1] * vec[1] + mat[0][2] * vec[2] + mat[0][3] * vec[3],
    mat[1][0] * vec[0] + mat[1][1] * vec[1] + mat[1][2] * vec[2] + mat[1][3] * vec[3],
    mat[2][0] * vec[0] + mat[2][1] * vec[1] + mat[2][2] * vec[2] + mat[2][3] * vec[3],
    mat[3][0] * vec[0] + mat[3][1] * vec[1] + mat[3][2] * vec[2] + mat[3][3] * vec[3],
  ]
}

function invertMat4(input: Mat4): Mat4 | null {
  const a = input.map((row, index) => [
    ...row,
    index === 0 ? 1 : 0,
    index === 1 ? 1 : 0,
    index === 2 ? 1 : 0,
    index === 3 ? 1 : 0,
  ])

  for (let col = 0; col < 4; col += 1) {
    let pivot = col
    for (let row = col + 1; row < 4; row += 1) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) {
        pivot = row
      }
    }
    if (Math.abs(a[pivot][col]) < 1e-15) {
      return null
    }
    if (pivot !== col) {
      const tmp = a[col]
      a[col] = a[pivot]
      a[pivot] = tmp
    }
    const pivotValue = a[col][col]
    for (let j = 0; j < 8; j += 1) {
      a[col][j] /= pivotValue
    }
    for (let row = 0; row < 4; row += 1) {
      if (row === col) {
        continue
      }
      const factor = a[row][col]
      for (let j = 0; j < 8; j += 1) {
        a[row][j] -= factor * a[col][j]
      }
    }
  }

  return [
    [a[0][4], a[0][5], a[0][6], a[0][7]],
    [a[1][4], a[1][5], a[1][6], a[1][7]],
    [a[2][4], a[2][5], a[2][6], a[2][7]],
    [a[3][4], a[3][5], a[3][6], a[3][7]],
  ]
}
