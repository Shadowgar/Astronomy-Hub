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

function buildProjectedStarsPayload(stars: readonly ProjectedSceneObjectEntry[]) {
  const payload = new Float32Array(stars.length * 8)

  for (let index = 0; index < stars.length; index += 1) {
    const star = stars[index]
    const [red, green, blue] = resolveHexRgb(star.starProfile?.colorHex ?? star.object.colorHex)
    const alpha = Math.max(0, Math.min(255, Math.round((star.renderAlpha ?? 1) * 255)))
    const offset = index * 8
    payload[offset + 0] = star.screenX
    payload[offset + 1] = star.screenY
    payload[offset + 2] = star.depth
    payload[offset + 3] = star.markerRadiusPx
    payload[offset + 4] = red
    payload[offset + 5] = green
    payload[offset + 6] = blue
    payload[offset + 7] = alpha
  }

  return payload
}

function isPaint2dPointsCommand(
  command: SkyPainterQueuedCall,
): command is SkyPainterQueuedCall<'paint_2d_points'> {
  return command.kind === 'paint_2d_points'
}

function buildPainterPointsPayload(points: readonly SkyPainterPoint[]) {
  const payload = new Float32Array(points.length * 7)
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]
    const offset = index * 7
    payload[offset + 0] = point.pos[0]
    payload[offset + 1] = point.pos[1]
    payload[offset + 2] = point.size
    payload[offset + 3] = point.color[0]
    payload[offset + 4] = point.color[1]
    payload[offset + 5] = point.color[2]
    payload[offset + 6] = point.color[3]
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
