import type { SkyModule } from '../SkyModule'
import { projectDirectionToViewport, isProjectedPointVisible, type SkyProjectionView } from '../../../../projectionMath'
import { buildSyntheticSkyDensityField } from '../../../../syntheticStarField'
import { computeVisibilityAlpha } from '../../../../starVisibility'
import { getStarRenderProfileForMagnitude, type StarRenderProfile } from '../../../../starRenderer'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import type { ProjectedSceneObjectEntry } from './runtimeFrame'
import type { SkyBrightnessExposureState } from '../types'

const SYNTHETIC_SKY_DENSITY_SAMPLES = buildSyntheticSkyDensityField(2800)
const SYNTHETIC_STAR_OVERLAP_CELL_PX = 24

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function smoothstep(edge0: number, edge1: number, value: number) {
  if (edge0 === edge1) {
    return value >= edge1 ? 1 : 0
  }

  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return amount * amount * (3 - 2 * amount)
}

function mix(left: number, right: number, amount: number) {
  return left + (right - left) * amount
}

function hexToRgb(hex: string) {
  return {
    red: Number.parseInt(hex.slice(1, 3), 16),
    green: Number.parseInt(hex.slice(3, 5), 16),
    blue: Number.parseInt(hex.slice(5, 7), 16),
  }
}

function hexToRgba(hex: string, alpha: number) {
  const { red, green, blue } = hexToRgb(hex)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function drawStar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  profile: StarRenderProfile,
  alpha: number,
) {
  const starAlpha = clamp(alpha * (0.42 + profile.alpha * 0.82), 0.14, 0.98)
  const haloRadius = Math.max(radius * (2.1 + profile.diameter * 1.8), profile.haloRadiusPx)
  const coreRadius = Math.max(radius * 0.92, profile.coreRadiusPx)

  context.save()
  const halo = context.createRadialGradient(x, y, 0, x, y, haloRadius)
  halo.addColorStop(0, hexToRgba(profile.colorHex, starAlpha))
  halo.addColorStop(0.22, hexToRgba(profile.colorHex, starAlpha * 0.52))
  halo.addColorStop(1, hexToRgba(profile.colorHex, 0))
  context.fillStyle = halo
  context.beginPath()
  context.arc(x, y, haloRadius, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = hexToRgba(profile.colorHex, clamp(starAlpha + 0.06, 0.18, 1))
  context.beginPath()
  context.arc(x, y, coreRadius, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = `rgba(255, 255, 255, ${clamp(0.18 + starAlpha * 0.84, 0.22, 0.98)})`
  context.beginPath()
  context.arc(x, y, Math.max(0.42, Math.min(coreRadius * 0.52, profile.coreRadiusPx * 0.68)), 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function getSyntheticDensityMagnitudeLimit(fovDegrees: number, renderLimitingMagnitude: number) {
  const wideBlend = smoothstep(40, 85, fovDegrees)
  const syntheticOffset = 0.35 * wideBlend
  return clamp(renderLimitingMagnitude + syntheticOffset, -1, 14.6)
}

function getSyntheticDensityBudget(fovDegrees: number, brightnessExposureState: SkyBrightnessExposureState) {
  const visibility = clamp(brightnessExposureState.starVisibility, 0, 1)
  const brightness = clamp(brightnessExposureState.starFieldBrightness, 0, 1)
  const wideBlend = smoothstep(45, 95, fovDegrees)
  const baseBudget = mix(0, 900, wideBlend)

  return Math.round(baseBudget * (0.3 + visibility * 0.7) * (0.34 + brightness * 0.66))
}

function buildProjectedStarOverlapGrid(projectedObjects: readonly ProjectedSceneObjectEntry[]) {
  const grid = new Map<string, ProjectedSceneObjectEntry[]>()

  projectedObjects.forEach((entry) => {
    if (entry.object.type !== 'star') {
      return
    }

    const cellX = Math.floor(entry.screenX / SYNTHETIC_STAR_OVERLAP_CELL_PX)
    const cellY = Math.floor(entry.screenY / SYNTHETIC_STAR_OVERLAP_CELL_PX)
    const key = `${cellX}:${cellY}`
    const bucket = grid.get(key)

    if (bucket) {
      bucket.push(entry)
      return
    }

    grid.set(key, [entry])
  })

  return grid
}

function overlapsProjectedStar(
  overlapGrid: ReadonlyMap<string, readonly ProjectedSceneObjectEntry[]>,
  screenX: number,
  screenY: number,
) {
  const cellX = Math.floor(screenX / SYNTHETIC_STAR_OVERLAP_CELL_PX)
  const cellY = Math.floor(screenY / SYNTHETIC_STAR_OVERLAP_CELL_PX)

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      const key = `${cellX + columnOffset}:${cellY + rowOffset}`
      const bucket = overlapGrid.get(key)

      if (!bucket) {
        continue
      }

      for (const entry of bucket) {
        const dx = entry.screenX - screenX
        const dy = entry.screenY - screenY
        const minimumDistance = Math.max(5.5, entry.markerRadiusPx * 0.9)

        if (dx * dx + dy * dy < minimumDistance * minimumDistance) {
          return true
        }
      }
    }
  }

  return false
}

function drawSyntheticDensityStars(
  context: CanvasRenderingContext2D,
  view: SkyProjectionView,
  projectedObjects: readonly ProjectedSceneObjectEntry[],
  latest: ScenePropsSnapshot,
  brightnessExposureState: SkyBrightnessExposureState,
  sceneTimestampIso: string | undefined,
  renderLimitingMagnitude: number,
  animationTime: number,
) {
  const fovDegrees = (view.fovRadians * 180) / Math.PI
  const magnitudeLimit = getSyntheticDensityMagnitudeLimit(fovDegrees, renderLimitingMagnitude)
  const densityBudget = getSyntheticDensityBudget(fovDegrees, brightnessExposureState)

  if (densityBudget <= 0) {
    return
  }

  const overlapGrid = buildProjectedStarOverlapGrid(projectedObjects)
  const viewportCenterX = view.viewportWidth * 0.5
  const viewportCenterY = view.viewportHeight * 0.5
  const wideBlend = smoothstep(115, 185, fovDegrees)
  const closeBlend = 1 - smoothstep(24, 90, fovDegrees)
  let drawnCount = 0

  for (const sample of SYNTHETIC_SKY_DENSITY_SAMPLES) {
    const renderedMagnitude = sample.magnitude
    const visibilityAlpha = computeVisibilityAlpha(renderedMagnitude, magnitudeLimit)

    if (visibilityAlpha <= 0 || drawnCount >= densityBudget) {
      if (drawnCount >= densityBudget) {
        break
      }

      continue
    }

    const projected = projectDirectionToViewport(sample.direction, view)

    if (!projected || !isProjectedPointVisible(projected, view, 20)) {
      continue
    }

    if (overlapsProjectedStar(overlapGrid, projected.screenX, projected.screenY)) {
      continue
    }

    const distanceToCenter = Math.hypot(projected.screenX - viewportCenterX, projected.screenY - viewportCenterY)
    const normalizedCenterDistance = clamp(distanceToCenter / Math.max(view.viewportWidth, view.viewportHeight), 0, 1)
    const centerFill = 1 + wideBlend * (1 - normalizedCenterDistance) * 0.38
    const profile = getStarRenderProfileForMagnitude(
      renderedMagnitude,
      sample.colorIndexBV,
      brightnessExposureState.visualCalibration,
      brightnessExposureState,
      Math.min(view.viewportWidth, view.viewportHeight),
    )
    const markerRadiusPx = clamp((profile.coreRadiusPx * 0.32 + sample.size * 0.34) * (0.88 + closeBlend * 0.18) * centerFill, 0.22, 1.55)
    const twinkle = 1 + Math.sin(animationTime + sample.twinklePhase) * profile.twinkleAmplitude * 0.9
    const alpha = clamp(
      sample.alpha * profile.alpha * (0.18 + sample.bandWeight * 0.16) * (0.62 + closeBlend * 0.1) * centerFill,
      0.016,
      0.16,
    )

    drawStar(context, projected.screenX, projected.screenY, markerRadiusPx * twinkle, profile, alpha)
    drawnCount += 1
  }
}

export function createBackgroundRuntimeModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-background-runtime-module',
    renderOrder: 6,
    render() {
      // Synthetic density fallback is disabled. Star density is sourced from catalog surveys only.
      return
      /*
      const latest = getProps()
      const projectedFrame = runtime.projectedSceneFrame
      const brightnessExposureState = runtime.brightnessExposureState

      if (!projectedFrame || !brightnessExposureState) {
        return
      }

      const backgroundContext = runtime.backgroundCanvas.getContext('2d')

      if (!backgroundContext) {
        return
      }

      drawSyntheticDensityStars(
        backgroundContext,
        projectedFrame.view,
        projectedFrame.projectedObjects,
        latest,
        brightnessExposureState,
        projectedFrame.sceneTimestampIso,
        projectedFrame.limitingMagnitude,
        services.clockService.getAnimationTimeSeconds(),
      )
      */
    },
  }
}
