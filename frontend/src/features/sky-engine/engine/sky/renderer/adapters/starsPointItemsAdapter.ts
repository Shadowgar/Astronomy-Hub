import type { ProjectedSceneObjectEntry } from '../../runtime/modules/runtimeFrame'
import type {
  SkyPainterPoint,
  SkyPainterQueuedCall,
} from '../../runtime/renderer/painterPort'
import {
  createPointRenderItem,
  type StellariumPointRenderItem,
} from '../renderItems'

function parseHexChannel(hex: string): number {
  const parsed = Number.parseInt(hex, 16)
  if (!Number.isFinite(parsed)) {
    return 255
  }
  return Math.max(0, Math.min(255, parsed))
}

function resolveHexRgb(hexColor: string | undefined): [number, number, number] {
  if (!hexColor) {
    return [255, 255, 255]
  }

  const normalized = hexColor.trim().replace(/^#/, '')
  if (normalized.length === 6) {
    return [
      parseHexChannel(normalized.slice(0, 2)),
      parseHexChannel(normalized.slice(2, 4)),
      parseHexChannel(normalized.slice(4, 6)),
    ]
  }

  if (normalized.length === 3) {
    return [
      parseHexChannel(`${normalized[0]}${normalized[0]}`),
      parseHexChannel(`${normalized[1]}${normalized[1]}`),
      parseHexChannel(`${normalized[2]}${normalized[2]}`),
    ]
  }

  return [255, 255, 255]
}

function resolveDeterministicStarOrder(stars: readonly ProjectedSceneObjectEntry[]) {
  return [...stars].sort((left, right) => {
    if (left.object.id !== right.object.id) {
      return left.object.id.localeCompare(right.object.id)
    }
    if (left.depth !== right.depth) {
      return left.depth - right.depth
    }
    return left.markerRadiusPx - right.markerRadiusPx
  })
}

function buildProjectedStarsPayload(stars: readonly ProjectedSceneObjectEntry[]) {
  const orderedStars = resolveDeterministicStarOrder(stars)
  const payload: number[] = []

  for (const star of orderedStars) {
    const [red, green, blue] = resolveHexRgb(star.starProfile?.colorHex ?? star.object.colorHex)
    const alpha = Math.max(0, Math.min(255, Math.round((star.renderAlpha ?? 1) * 255)))
    payload.push(
      star.screenX,
      star.screenY,
      star.depth,
      star.markerRadiusPx,
      red,
      green,
      blue,
      alpha,
    )
  }

  return payload
}

function isPaint2dPointsCommand(
  command: SkyPainterQueuedCall,
): command is SkyPainterQueuedCall<'paint_2d_points'> {
  return command.kind === 'paint_2d_points'
}

function buildPainterPointsPayload(points: readonly SkyPainterPoint[]) {
  const payload: number[] = []
  for (const point of points) {
    payload.push(
      point.pos[0],
      point.pos[1],
      point.size,
      point.color[0],
      point.color[1],
      point.color[2],
      point.color[3],
    )
  }
  return payload
}

export function createStarsPointRenderItemFromProjectedStars(input: {
  projectedStars: readonly ProjectedSceneObjectEntry[]
  order?: number
}): StellariumPointRenderItem {
  const payload = buildProjectedStarsPayload(input.projectedStars)
  const sourceObjectId = input.projectedStars.length === 1 ? input.projectedStars[0].object.id : null

  return createPointRenderItem({
    order: input.order ?? 20,
    flags: 0,
    pointCount: input.projectedStars.length,
    vertexPayload: payload,
    textureIdentity: 'stars-point-sprite',
    materialIdentity: 'stars-point-material',
    sourceModule: 'stars',
    sourceObjectId,
    dimensions: '2d',
  })
}

export function createStarsPointRenderItemFromPainterPoints(input: {
  points: readonly SkyPainterPoint[]
  order?: number
}): StellariumPointRenderItem {
  return createPointRenderItem({
    order: input.order ?? 20,
    flags: 0,
    pointCount: input.points.length,
    vertexPayload: buildPainterPointsPayload(input.points),
    textureIdentity: 'stars-point-sprite',
    materialIdentity: 'stars-point-material',
    sourceModule: 'stars',
    sourceObjectId: null,
    dimensions: '2d',
  })
}

export function createStarsPointRenderItemFromPainterCommand(
  command: SkyPainterQueuedCall,
): StellariumPointRenderItem | null {
  if (!isPaint2dPointsCommand(command)) {
    return null
  }
  return createStarsPointRenderItemFromPainterPoints({
    points: command.payload.points,
    order: command.sequence,
  })
}
