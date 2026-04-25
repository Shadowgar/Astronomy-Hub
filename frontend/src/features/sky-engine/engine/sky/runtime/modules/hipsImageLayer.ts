import { Vector3 } from '@babylonjs/core/Maths/math.vector'

import { projectDirectionToViewport, isProjectedPointVisible, getProjectionScale, type SkyProjectionView } from '../../../../projectionMath'
import type { ObserverSnapshot } from '../../contracts/observer'
import type { ObserverAstrometrySnapshot } from '../../transforms/coordinates'
import { raDecToObserverUnitVector } from '../../transforms/coordinates'
import { healpixPixToRaDec } from '../../adapters/healpix'
import { buildHipsTilePath } from '../../adapters/ephCodec'
import { hipsGetRenderOrderUnclamped, clampHipsRenderOrder } from '../../adapters/hipsRenderOrder'

interface HipsImageTileRef {
  readonly order: number
  readonly pix: number
}

interface CachedImageEntry {
  image: HTMLImageElement | null
  state: 'loading' | 'loaded' | 'failed'
}

export interface HipsSurveyConfig {
  readonly id: string
  readonly baseUrl: string
  readonly extension: string
  readonly minOrder: number
  readonly maxOrder: number
  readonly tileWidthPx?: number
}

export interface HipsRenderStats {
  readonly requestedTileCount: number
  readonly renderedTileCount: number
  readonly fallbackTileCount: number
  readonly allskyFallbackCount: number
}

const imageCache = new Map<string, CachedImageEntry>()

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function normalizeBaseUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

function loadImage(url: string) {
  const cached = imageCache.get(url)
  if (cached !== undefined) {
    return cached
  }

  const entry: CachedImageEntry = {
    image: null,
    state: 'loading',
  }
  imageCache.set(url, entry)

  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.decoding = 'async'
  image.onload = () => {
    entry.image = image
    entry.state = 'loaded'
  }
  image.onerror = () => {
    entry.image = null
    entry.state = 'failed'
  }
  image.src = url

  return entry
}

function healpixTileAngularRadiusRad(order: number) {
  const area = Math.PI / (3 * (1 << (2 * order)))
  return Math.sqrt(area / Math.PI)
}

function buildVisibleTileList(
  view: SkyProjectionView,
  observerSnapshot: ObserverSnapshot,
  observerFrameAstrometry: ObserverAstrometrySnapshot,
  targetOrder: number,
) {
  const tiles: HipsImageTileRef[] = []
  const projectionScale = getProjectionScale(view)

  const visit = (order: number, pix: number) => {
    const center = healpixPixToRaDec(order, pix)
    const observed = raDecToObserverUnitVector(
      center.raDeg,
      center.decDeg,
      observerSnapshot,
      observerFrameAstrometry,
    )
    const direction = new Vector3(observed.vector.x, observed.vector.y, observed.vector.z)
    const projected = projectDirectionToViewport(direction, view)
    const tileRadiusPx = projectionScale * Math.tan(healpixTileAngularRadiusRad(order))

    if (!projected || !isProjectedPointVisible(projected, view, Math.max(24, tileRadiusPx * 1.8))) {
      return
    }

    if (order >= targetOrder) {
      tiles.push({ order, pix })
      return
    }

    const childBase = pix * 4
    visit(order + 1, childBase)
    visit(order + 1, childBase + 1)
    visit(order + 1, childBase + 2)
    visit(order + 1, childBase + 3)
  }

  for (let pix = 0; pix < 12; pix += 1) {
    visit(0, pix)
  }

  return tiles
}

function computeCropRect(
  requested: HipsImageTileRef,
  loaded: HipsImageTileRef,
  imageWidth: number,
  imageHeight: number,
) {
  if (requested.order <= loaded.order) {
    return {
      sx: 0,
      sy: 0,
      sw: imageWidth,
      sh: imageHeight,
    }
  }

  let sx = 0
  let sy = 0
  let sw = imageWidth
  let sh = imageHeight

  for (let level = requested.order; level > loaded.order; level -= 1) {
    const span = 1 << (2 * (requested.order - level))
    const pixAtLevel = Math.floor(requested.pix / span)
    const childIndex = pixAtLevel % 4
    const halfW = sw / 2
    const halfH = sh / 2
    const childX = Math.floor(childIndex / 2)
    const childY = childIndex % 2

    sx += childX * halfW
    sy += childY * halfH
    sw = halfW
    sh = halfH
  }

  return { sx, sy, sw, sh }
}

function resolveTileTexture(
  survey: HipsSurveyConfig,
  requested: HipsImageTileRef,
): { image: HTMLImageElement; loadedTile: HipsImageTileRef } | null {
  const baseUrl = normalizeBaseUrl(survey.baseUrl)

  for (let order = requested.order; order >= survey.minOrder; order -= 1) {
    const parentDivisor = 1 << (2 * (requested.order - order))
    const pix = Math.floor(requested.pix / parentDivisor)
    const tilePath = buildHipsTilePath(baseUrl, order, pix, survey.extension)
    const entry = loadImage(tilePath)

    if (entry.state === 'loaded' && entry.image) {
      return {
        image: entry.image,
        loadedTile: { order, pix },
      }
    }
  }

  return null
}

function resolveTargetOrder(survey: HipsSurveyConfig, view: SkyProjectionView) {
  const suggested = hipsGetRenderOrderUnclamped({
    tileWidthPx: survey.tileWidthPx ?? 256,
    windowHeightPx: Math.max(1, view.viewportHeight),
    projectionMat11: Math.abs(getProjectionScale(view) / Math.max(1, view.viewportHeight)),
  })

  return clampHipsRenderOrder(suggested, survey.minOrder, survey.maxOrder)
}

export function renderHipsSurveyToCanvas(params: {
  context: CanvasRenderingContext2D
  view: SkyProjectionView
  observerSnapshot: ObserverSnapshot
  observerFrameAstrometry: ObserverAstrometrySnapshot
  survey: HipsSurveyConfig
  alpha: number
}) : HipsRenderStats {
  const alpha = clamp(params.alpha, 0, 1.2)
  if (alpha <= 0.0001) {
    return {
      requestedTileCount: 0,
      renderedTileCount: 0,
      fallbackTileCount: 0,
      allskyFallbackCount: 0,
    }
  }

  const projectionScale = getProjectionScale(params.view)
  const targetOrder = resolveTargetOrder(params.survey, params.view)
  const visibleTiles = buildVisibleTileList(
    params.view,
    params.observerSnapshot,
    params.observerFrameAstrometry,
    targetOrder,
  )

  let renderedTileCount = 0
  let fallbackTileCount = 0

  params.context.save()
  params.context.globalCompositeOperation = 'screen'
  params.context.globalAlpha = alpha

  for (const tile of visibleTiles) {
    const texture = resolveTileTexture(params.survey, tile)
    if (!texture) {
      continue
    }

    if (texture.loadedTile.order !== tile.order || texture.loadedTile.pix !== tile.pix) {
      fallbackTileCount += 1
    }

    const center = healpixPixToRaDec(tile.order, tile.pix)
    const observed = raDecToObserverUnitVector(
      center.raDeg,
      center.decDeg,
      params.observerSnapshot,
      params.observerFrameAstrometry,
    )
    const direction = new Vector3(observed.vector.x, observed.vector.y, observed.vector.z)
    const projected = projectDirectionToViewport(direction, params.view)

    if (!projected) {
      continue
    }

    const drawRadiusPx = clamp(
      projectionScale * Math.tan(healpixTileAngularRadiusRad(tile.order)) * 1.45,
      24,
      Math.max(params.view.viewportWidth, params.view.viewportHeight),
    )
    const crop = computeCropRect(tile, texture.loadedTile, texture.image.width, texture.image.height)

    params.context.drawImage(
      texture.image,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      projected.screenX - drawRadiusPx,
      projected.screenY - drawRadiusPx,
      drawRadiusPx * 2,
      drawRadiusPx * 2,
    )
    renderedTileCount += 1
  }

  params.context.restore()

  return {
    requestedTileCount: visibleTiles.length,
    renderedTileCount,
    fallbackTileCount,
    allskyFallbackCount: 0,
  }
}
