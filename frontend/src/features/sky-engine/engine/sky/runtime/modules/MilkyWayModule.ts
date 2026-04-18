import { Vector3 } from '@babylonjs/core/Maths/math.vector'

import type { ObserverSnapshot } from '../../contracts/observer'
import { raDecToObserverUnitVector, type ObserverAstrometrySnapshot } from '../../transforms/coordinates'
import type { SkyModule } from '../SkyModule'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import {
  directionToHorizontal,
  getProjectionScale,
  isProjectedPointVisible,
  projectDirectionToViewport,
  type SkyProjectionView,
} from '../../../../projectionMath'
import type { SkyBrightnessExposureState } from '../types'

interface ProceduralMilkyWayPatch {
  readonly galacticLongitudeDeg: number
  readonly galacticLatitudeDeg: number
  readonly radiusDeg: number
  readonly alpha: number
  readonly coreWeight: number
  readonly colorHex: string
}

export interface MilkyWayRenderState {
  readonly visibility: number
  readonly contrast: number
}

const GALACTIC_TO_EQUATORIAL_MATRIX = [
  [-0.0548755604, -0.8734370902, -0.4838350155],
  [0.4941094279, -0.44482963, 0.7469822445],
  [-0.867666149, -0.1980763734, 0.4559837762],
] as const

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function fract(value: number) {
  return value - Math.floor(value)
}

function pseudoRandom(seed: number) {
  return fract(Math.sin(seed * 12.9898 + 78.233) * 43758.5453123)
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

function radiansToDegrees(value: number) {
  return (value * 180) / Math.PI
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360
}

function angularDistanceDegrees(left: number, right: number) {
  const normalized = Math.abs(normalizeDegrees(left - right))
  return normalized > 180 ? 360 - normalized : normalized
}

function mix(left: number, right: number, amount: number) {
  return left + (right - left) * amount
}

function smoothstep(edge0: number, edge1: number, value: number) {
  if (edge0 === edge1) {
    return value >= edge1 ? 1 : 0
  }
  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return amount * amount * (3 - 2 * amount)
}

function limitingMagnitudeVisibilityGate(limitingMagnitude: number | undefined) {
  if (limitingMagnitude === undefined || !Number.isFinite(limitingMagnitude)) {
    return 1
  }

  // Core painter limits / runtime limiting magnitude govern whether faint extended
  // structures are even admissible in the current frame.
  return clamp((limitingMagnitude - 1) / 5, 0, 1)
}

function hexToRgba(hex: string, alpha: number) {
  const red = Number.parseInt(hex.slice(1, 3), 16)
  const green = Number.parseInt(hex.slice(3, 5), 16)
  const blue = Number.parseInt(hex.slice(5, 7), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function galacticCoreWeight(galacticLongitudeDeg: number) {
  const sagittarius = Math.exp(-Math.pow(angularDistanceDegrees(galacticLongitudeDeg, 0) / 32, 2))
  const cygnus = 0.74 * Math.exp(-Math.pow(angularDistanceDegrees(galacticLongitudeDeg, 78) / 42, 2))
  const anticenter = 0.3 * Math.exp(-Math.pow(angularDistanceDegrees(galacticLongitudeDeg, 180) / 82, 2))
  const modulation = 0.74 + 0.26 * (0.5 + 0.5 * Math.sin(degreesToRadians(galacticLongitudeDeg * 2.35 - 18)))

  return clamp((0.16 + sagittarius + cygnus + anticenter) * modulation, 0.1, 1.35)
}

export function buildProceduralMilkyWaySamples() {
  const latitudeBands = [-11, -7, -4, -2, 0, 2, 4, 7, 11]

  return Array.from({ length: 72 }, (_, longitudeIndex) => {
    const longitudeBaseDeg = longitudeIndex * 5

    return latitudeBands.map((latitudeBaseDeg, latitudeIndex) => {
      const seed = longitudeIndex * 37 + latitudeIndex * 101
      const coreWeight = galacticCoreWeight(longitudeBaseDeg)
      const latitudeJitter = (pseudoRandom(seed + 17) - 0.5) * 1.4
      const longitudeJitter = (pseudoRandom(seed + 41) - 0.5) * 3.2
      const bandDistance = Math.abs(latitudeBaseDeg) / 11
      const bandWeight = Math.exp(-bandDistance * bandDistance * 2.4)
      const radiusDeg = mix(7, 16.5, coreWeight / 1.35) * mix(1.12, 0.82, bandDistance)
      const alpha = (0.026 + bandWeight * 0.072) * (0.82 + coreWeight * 0.38)
      const warmBlend = clamp(coreWeight * 0.68 + bandWeight * 0.12, 0, 1)
      const red = Math.round(mix(126, 214, warmBlend))
      const green = Math.round(mix(146, 204, warmBlend))
      const blue = Math.round(mix(178, 220, 1 - bandWeight * 0.42))

      return {
        galacticLongitudeDeg: normalizeDegrees(longitudeBaseDeg + longitudeJitter),
        galacticLatitudeDeg: latitudeBaseDeg + latitudeJitter,
        radiusDeg,
        alpha,
        coreWeight,
        colorHex: `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`,
      } satisfies ProceduralMilkyWayPatch
    })
  }).flat()
}

const PROCEDURAL_MILKY_WAY_SAMPLES = buildProceduralMilkyWaySamples()

function galacticToEquatorial(galacticLongitudeDeg: number, galacticLatitudeDeg: number) {
  const longitudeRad = degreesToRadians(galacticLongitudeDeg)
  const latitudeRad = degreesToRadians(galacticLatitudeDeg)
  const galacticX = Math.cos(latitudeRad) * Math.cos(longitudeRad)
  const galacticY = Math.cos(latitudeRad) * Math.sin(longitudeRad)
  const galacticZ = Math.sin(latitudeRad)

  const equatorialX =
    GALACTIC_TO_EQUATORIAL_MATRIX[0][0] * galacticX +
    GALACTIC_TO_EQUATORIAL_MATRIX[0][1] * galacticY +
    GALACTIC_TO_EQUATORIAL_MATRIX[0][2] * galacticZ
  const equatorialY =
    GALACTIC_TO_EQUATORIAL_MATRIX[1][0] * galacticX +
    GALACTIC_TO_EQUATORIAL_MATRIX[1][1] * galacticY +
    GALACTIC_TO_EQUATORIAL_MATRIX[1][2] * galacticZ
  const equatorialZ =
    GALACTIC_TO_EQUATORIAL_MATRIX[2][0] * galacticX +
    GALACTIC_TO_EQUATORIAL_MATRIX[2][1] * galacticY +
    GALACTIC_TO_EQUATORIAL_MATRIX[2][2] * galacticZ

  return {
    raDeg: normalizeDegrees(radiansToDegrees(Math.atan2(equatorialY, equatorialX))),
    decDeg: radiansToDegrees(Math.asin(clamp(equatorialZ, -1, 1))),
  }
}

function buildObserverSnapshot(
  view: SkyProjectionView,
  projectionMode: ObserverSnapshot['projection'],
  latitudeDeg: number,
  longitudeDeg: number,
  timestampUtc: string,
): ObserverSnapshot {
  const centerHorizontal = directionToHorizontal(view.centerDirection)

  return {
    timestampUtc,
    latitudeDeg,
    longitudeDeg,
    fovDeg: (view.fovRadians * 180) / Math.PI,
    centerAltDeg: centerHorizontal.altitudeDeg,
    centerAzDeg: centerHorizontal.azimuthDeg,
    projection: projectionMode,
  }
}

export function evaluateMilkyWayRenderState(
  brightnessExposureState: SkyBrightnessExposureState,
  limitingMagnitude?: number,
  fovDegrees?: number,
): MilkyWayRenderState {
  const gate = limitingMagnitudeVisibilityGate(limitingMagnitude)
  const fovVisibility = Number.isFinite(fovDegrees) ? smoothstep(10, 20, fovDegrees ?? 20) : 1
  const lwskyAverageProxy = Math.max(
    1e-6,
    ((brightnessExposureState.nightSkyZenithLuminance + brightnessExposureState.nightSkyHorizonLuminance) * 0.5),
  )
  const atmosphereVisibility = clamp(0.004 / lwskyAverageProxy, 0, 1)
  return {
    visibility: clamp(brightnessExposureState.milkyWayVisibility * gate * fovVisibility * atmosphereVisibility, 0, 1),
    contrast: clamp(brightnessExposureState.milkyWayContrast, 0.06, 1),
  }
}

function renderMilkyWayLayer(
  context: CanvasRenderingContext2D,
  view: SkyProjectionView,
  observerSnapshot: ObserverSnapshot,
  observerFrameAstrometry: ObserverAstrometrySnapshot,
  brightnessExposureState: SkyBrightnessExposureState,
  limitingMagnitude: number,
) {
  context.clearRect(0, 0, view.viewportWidth, view.viewportHeight)

  const renderState = evaluateMilkyWayRenderState(
    brightnessExposureState,
    limitingMagnitude,
    (view.fovRadians * 180) / Math.PI,
  )

  if (renderState.visibility <= 0.01) {
    return
  }

  const projectionScale = getProjectionScale(view)
  const wideFieldBlend = clamp((view.fovRadians * 180) / Math.PI / 100, 0.28, 1)

  context.save()
  context.globalCompositeOperation = 'screen'

  PROCEDURAL_MILKY_WAY_SAMPLES.forEach((sample) => {
    const equatorial = galacticToEquatorial(sample.galacticLongitudeDeg, sample.galacticLatitudeDeg)
    const observed = raDecToObserverUnitVector(
      equatorial.raDeg,
      equatorial.decDeg,
      observerSnapshot,
      observerFrameAstrometry,
    )
    const direction = new Vector3(observed.vector.x, observed.vector.y, observed.vector.z)
    const projected = projectDirectionToViewport(direction, view)

    if (!projected || !isProjectedPointVisible(projected, view, 96)) {
      return
    }

    const radiusPx = clamp(
      projectionScale * Math.tan(degreesToRadians(sample.radiusDeg) * 0.5),
      18,
      240,
    )
    const alpha = clamp(
      sample.alpha * renderState.visibility * renderState.contrast * wideFieldBlend * (0.74 + sample.coreWeight * 0.68),
      0.006,
      0.3,
    )

    if (alpha <= 0.005) {
      return
    }

    const gradient = context.createRadialGradient(
      projected.screenX,
      projected.screenY,
      0,
      projected.screenX,
      projected.screenY,
      radiusPx,
    )

    gradient.addColorStop(0, hexToRgba(sample.colorHex, alpha))
    gradient.addColorStop(0.28, hexToRgba(sample.colorHex, alpha * 0.56))
    gradient.addColorStop(0.72, hexToRgba(sample.colorHex, alpha * 0.16))
    gradient.addColorStop(1, hexToRgba(sample.colorHex, 0))

    context.fillStyle = gradient
    context.beginPath()
    context.arc(projected.screenX, projected.screenY, radiusPx, 0, Math.PI * 2)
    context.fill()

    if (sample.coreWeight > 0.55) {
      const haze = context.createRadialGradient(
        projected.screenX,
        projected.screenY,
        0,
        projected.screenX,
        projected.screenY,
        radiusPx * 1.9,
      )

      haze.addColorStop(0, hexToRgba(sample.colorHex, alpha * 0.16))
      haze.addColorStop(0.45, hexToRgba(sample.colorHex, alpha * 0.08))
      haze.addColorStop(1, hexToRgba(sample.colorHex, 0))
      context.fillStyle = haze
      context.beginPath()
      context.arc(projected.screenX, projected.screenY, radiusPx * 1.9, 0, Math.PI * 2)
      context.fill()
    }
  })

  context.restore()
}

export function createMilkyWayModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-milky-way-runtime-module',
    renderOrder: 5,
    render({ runtime, getProps }) {
      const projectedFrame = runtime.projectedSceneFrame
      const brightnessExposureState = runtime.brightnessExposureState
      const context = runtime.backgroundCanvas.getContext('2d')

      if (!projectedFrame || !brightnessExposureState || !context) {
        if (context && runtime.backgroundCanvas.width > 0 && runtime.backgroundCanvas.height > 0) {
          context.clearRect(0, 0, runtime.backgroundCanvas.width, runtime.backgroundCanvas.height)
        }
        return
      }

      const latest = getProps()
      const timestampUtc = projectedFrame.sceneTimestampIso

      if (!timestampUtc) {
        context.clearRect(0, 0, projectedFrame.width, projectedFrame.height)
        return
      }

      renderMilkyWayLayer(
        context,
        projectedFrame.view,
        buildObserverSnapshot(
          projectedFrame.view,
          projectedFrame.view.projectionMode ?? 'stereographic',
          latest.observer.latitude,
          latest.observer.longitude,
          timestampUtc,
        ),
        latest.observerFrameAstrometry,
        brightnessExposureState,
        projectedFrame.limitingMagnitude,
      )
    },
  }
}
