import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import type { Vector3 } from '@babylonjs/core/Maths/math.vector'

import type { LabelRenderRef } from './labelManager'
import type { SkyLodState } from './skyLod'
import type { SkyEngineSceneObject, SkyEngineSunState } from './types'

export interface SkyRendererPickEntry {
  readonly object: SkyEngineSceneObject
  readonly pickMesh: AbstractMesh
  readonly pickRadiusPx: number
}

export interface SkyRendererSyncInput {
  readonly objects: readonly SkyEngineSceneObject[]
  readonly selectedObjectId: string | null
  readonly guidedObjectIds: ReadonlySet<string>
  readonly sunState: SkyEngineSunState
  readonly lod: SkyLodState
  readonly animationTime: number
}

export interface SkyObjectRenderer {
  sync: (input: SkyRendererSyncInput) => void
  getPickEntries: () => readonly SkyRendererPickEntry[]
  getLabelRefs: () => Record<string, LabelRenderRef>
  getAnchor: (objectId: string) => Vector3 | null
  dispose: () => void
}
