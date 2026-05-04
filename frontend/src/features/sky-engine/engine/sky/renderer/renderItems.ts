export const STELLARIUM_RENDER_ITEM_TYPES = {
  POINTS: 'ITEM_POINTS',
  MESH: 'ITEM_MESH',
  TEXT: 'ITEM_TEXT',
  TEXTURE: 'ITEM_TEXTURE',
} as const

export type StellariumRenderItemType =
  (typeof STELLARIUM_RENDER_ITEM_TYPES)[keyof typeof STELLARIUM_RENDER_ITEM_TYPES]

export interface StellariumRenderItemBase {
  readonly itemType: StellariumRenderItemType
  readonly flags: number
  readonly order: number
  readonly pointCount: number
  readonly vertexPayload: ReadonlyArray<number> | Float32Array
  readonly textureIdentity: string | null
  readonly materialIdentity: string | null
  readonly sourceModule: string
  readonly sourceObjectId: string | null
}

export interface StellariumPointRenderItem extends StellariumRenderItemBase {
  readonly itemType: typeof STELLARIUM_RENDER_ITEM_TYPES.POINTS
  readonly dimensions: '2d' | '3d'
}

export interface StellariumMeshRenderItem extends StellariumRenderItemBase {
  readonly itemType: typeof STELLARIUM_RENDER_ITEM_TYPES.MESH
  readonly meshPrimitive: 'triangles' | 'lines'
}

export interface StellariumTextRenderItem extends StellariumRenderItemBase {
  readonly itemType: typeof STELLARIUM_RENDER_ITEM_TYPES.TEXT
  readonly text: string
  readonly textStyle: string | null
}

export interface StellariumTextureRenderItem extends StellariumRenderItemBase {
  readonly itemType: typeof STELLARIUM_RENDER_ITEM_TYPES.TEXTURE
}

export type StellariumRenderItem =
  | StellariumPointRenderItem
  | StellariumMeshRenderItem
  | StellariumTextRenderItem
  | StellariumTextureRenderItem

export function createPointRenderItem(input: {
  order: number
  flags?: number
  pointCount: number
  vertexPayload: ReadonlyArray<number> | Float32Array
  textureIdentity?: string | null
  materialIdentity?: string | null
  sourceModule: string
  sourceObjectId?: string | null
  dimensions?: '2d' | '3d'
}): StellariumPointRenderItem {
  return {
    itemType: STELLARIUM_RENDER_ITEM_TYPES.POINTS,
    flags: input.flags ?? 0,
    order: input.order,
    pointCount: input.pointCount,
    vertexPayload: input.vertexPayload,
    textureIdentity: input.textureIdentity ?? null,
    materialIdentity: input.materialIdentity ?? null,
    sourceModule: input.sourceModule,
    sourceObjectId: input.sourceObjectId ?? null,
    dimensions: input.dimensions ?? '3d',
  }
}
