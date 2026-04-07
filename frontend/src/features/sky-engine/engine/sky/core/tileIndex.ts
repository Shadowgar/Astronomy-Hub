import type { SkyTileBounds } from '../contracts/tiles'

export type SkyTileDescriptor = {
  tileId: string
  level: number
  parentTileId: string | null
  childTileIds: string[]
  bounds: SkyTileBounds
  centerRaDeg: number
  centerDecDeg: number
  angularRadiusDeg: number
}

export const SKY_TILE_MAX_LEVEL = 3

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

function radiansToDegrees(value: number) {
  return (value * 180) / Math.PI
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360
}

function normalizeSignedDegrees(value: number) {
  const normalized = normalizeDegrees(value)
  return normalized > 180 ? normalized - 360 : normalized
}

function angularDistanceDeg(raLeftDeg: number, decLeftDeg: number, raRightDeg: number, decRightDeg: number) {
  const leftRaRad = degreesToRadians(raLeftDeg)
  const leftDecRad = degreesToRadians(decLeftDeg)
  const rightRaRad = degreesToRadians(raRightDeg)
  const rightDecRad = degreesToRadians(decRightDeg)
  const cosine =
    Math.sin(leftDecRad) * Math.sin(rightDecRad) +
    Math.cos(leftDecRad) * Math.cos(rightDecRad) * Math.cos(leftRaRad - rightRaRad)

  return radiansToDegrees(Math.acos(clamp(cosine, -1, 1)))
}

function computeTileAngularRadius(bounds: SkyTileBounds, centerRaDeg: number, centerDecDeg: number) {
  const corners = [
    [bounds.raMinDeg, bounds.decMinDeg],
    [bounds.raMinDeg, bounds.decMaxDeg],
    [bounds.raMaxDeg, bounds.decMinDeg],
    [bounds.raMaxDeg, bounds.decMaxDeg],
  ] as const

  return corners.reduce((maximumRadius, [cornerRaDeg, cornerDecDeg]) => {
    const distance = angularDistanceDeg(centerRaDeg, centerDecDeg, cornerRaDeg, cornerDecDeg)
    return Math.max(maximumRadius, distance)
  }, 0)
}

function buildTileDescriptor(tileId: string, level: number, parentTileId: string | null, bounds: SkyTileBounds): SkyTileDescriptor {
  const centerRaDeg = normalizeDegrees((bounds.raMinDeg + bounds.raMaxDeg) / 2)
  const centerDecDeg = (bounds.decMinDeg + bounds.decMaxDeg) / 2
  const childTileIds = level >= SKY_TILE_MAX_LEVEL
    ? []
    : ['nw', 'ne', 'sw', 'se'].map((suffix) => `${tileId}-${suffix}`)

  return {
    tileId,
    level,
    parentTileId,
    childTileIds,
    bounds,
    centerRaDeg,
    centerDecDeg,
    angularRadiusDeg: computeTileAngularRadius(bounds, centerRaDeg, centerDecDeg),
  }
}

function subdivideBounds(bounds: SkyTileBounds) {
  const raMidDeg = normalizeDegrees((bounds.raMinDeg + bounds.raMaxDeg) / 2)
  const decMidDeg = (bounds.decMinDeg + bounds.decMaxDeg) / 2

  return {
    nw: {
      raMinDeg: bounds.raMinDeg,
      raMaxDeg: raMidDeg,
      decMinDeg: decMidDeg,
      decMaxDeg: bounds.decMaxDeg,
    },
    ne: {
      raMinDeg: raMidDeg,
      raMaxDeg: bounds.raMaxDeg,
      decMinDeg: decMidDeg,
      decMaxDeg: bounds.decMaxDeg,
    },
    sw: {
      raMinDeg: bounds.raMinDeg,
      raMaxDeg: raMidDeg,
      decMinDeg: bounds.decMinDeg,
      decMaxDeg: decMidDeg,
    },
    se: {
      raMinDeg: raMidDeg,
      raMaxDeg: bounds.raMaxDeg,
      decMinDeg: bounds.decMinDeg,
      decMaxDeg: decMidDeg,
    },
  }
}

function addTileFamily(descriptors: Map<string, SkyTileDescriptor>, descriptor: SkyTileDescriptor) {
  descriptors.set(descriptor.tileId, descriptor)

  if (descriptor.level >= SKY_TILE_MAX_LEVEL) {
    return
  }

  const childBounds = subdivideBounds(descriptor.bounds)
  descriptor.childTileIds.forEach((childTileId, index) => {
    const suffix = ['nw', 'ne', 'sw', 'se'][index] as keyof typeof childBounds
    addTileFamily(
      descriptors,
      buildTileDescriptor(childTileId, descriptor.level + 1, descriptor.tileId, childBounds[suffix]),
    )
  })
}

function buildTileIndex() {
  const descriptors = new Map<string, SkyTileDescriptor>()
  const rootDescriptors = [
    buildTileDescriptor('root-nw', 0, null, { raMinDeg: 0, raMaxDeg: 180, decMinDeg: 0, decMaxDeg: 90 }),
    buildTileDescriptor('root-ne', 0, null, { raMinDeg: 180, raMaxDeg: 360, decMinDeg: 0, decMaxDeg: 90 }),
    buildTileDescriptor('root-sw', 0, null, { raMinDeg: 0, raMaxDeg: 180, decMinDeg: -90, decMaxDeg: 0 }),
    buildTileDescriptor('root-se', 0, null, { raMinDeg: 180, raMaxDeg: 360, decMinDeg: -90, decMaxDeg: 0 }),
  ]

  rootDescriptors.forEach((descriptor) => addTileFamily(descriptors, descriptor))

  return {
    descriptors,
    rootTileIds: rootDescriptors.map((descriptor) => descriptor.tileId),
  }
}

const SKY_TILE_INDEX = buildTileIndex()

export function getSkyTileDescriptor(tileId: string) {
  return SKY_TILE_INDEX.descriptors.get(tileId) ?? null
}

export function getSkyTileChildren(tileId: string) {
  return getSkyTileDescriptor(tileId)?.childTileIds ?? []
}

export function getSkyRootTileIds() {
  return [...SKY_TILE_INDEX.rootTileIds]
}

export function getAllSkyTileDescriptors() {
  return Array.from(SKY_TILE_INDEX.descriptors.values())
}

export function getSkyTileMaxLevel() {
  return SKY_TILE_MAX_LEVEL
}

export function tileIntersectsView(tile: SkyTileDescriptor, centerRaDeg: number, centerDecDeg: number, viewRadiusDeg: number) {
  const centerDistanceDeg = angularDistanceDeg(centerRaDeg, centerDecDeg, tile.centerRaDeg, tile.centerDecDeg)
  return centerDistanceDeg <= viewRadiusDeg + tile.angularRadiusDeg
}

export function normalizeSkyRightAscensionDeg(value: number) {
  return normalizeDegrees(value)
}

export function normalizeSkySignedDegrees(value: number) {
  return normalizeSignedDegrees(value)
}