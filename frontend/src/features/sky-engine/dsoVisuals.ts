import type { SkyEngineDeepSkyClass, SkyEngineSceneObject } from './types'

export interface DeepSkyVisualStyle {
  readonly visualClass: SkyEngineDeepSkyClass
  readonly defaultOrientationDeg: number
  readonly defaultMinorAxisRatio: number
  readonly minimumMajorDiameterPx: number
  readonly minimumMinorDiameterPx: number
  readonly maximumMajorDiameterPx: number
  readonly maximumMinorDiameterPx: number
  readonly projectionMagnitudeBoostPx: number
}

export interface DeepSkyResolvedAxes {
  readonly visualClass: SkyEngineDeepSkyClass
  readonly orientationDeg: number
  readonly majorAxis: number
  readonly minorAxis: number
  readonly axisRatio: number
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

const DEEP_SKY_VISUAL_STYLES: Record<SkyEngineDeepSkyClass, DeepSkyVisualStyle> = {
  galaxy: {
    visualClass: 'galaxy',
    defaultOrientationDeg: 32,
    defaultMinorAxisRatio: 0.42,
    minimumMajorDiameterPx: 20,
    minimumMinorDiameterPx: 10,
    maximumMajorDiameterPx: 68,
    maximumMinorDiameterPx: 36,
    projectionMagnitudeBoostPx: 2.2,
  },
  nebula: {
    visualClass: 'nebula',
    defaultOrientationDeg: 48,
    defaultMinorAxisRatio: 0.68,
    minimumMajorDiameterPx: 22,
    minimumMinorDiameterPx: 14,
    maximumMajorDiameterPx: 72,
    maximumMinorDiameterPx: 52,
    projectionMagnitudeBoostPx: 2.4,
  },
  cluster: {
    visualClass: 'cluster',
    defaultOrientationDeg: 0,
    defaultMinorAxisRatio: 1,
    minimumMajorDiameterPx: 18,
    minimumMinorDiameterPx: 18,
    maximumMajorDiameterPx: 48,
    maximumMinorDiameterPx: 48,
    projectionMagnitudeBoostPx: 1.4,
  },
  generic: {
    visualClass: 'generic',
    defaultOrientationDeg: 0,
    defaultMinorAxisRatio: 0.86,
    minimumMajorDiameterPx: 18,
    minimumMinorDiameterPx: 14,
    maximumMajorDiameterPx: 52,
    maximumMinorDiameterPx: 40,
    projectionMagnitudeBoostPx: 1.7,
  },
}

export function resolveDeepSkyVisualClass(object: Pick<SkyEngineSceneObject, 'deepSkyClass'>): SkyEngineDeepSkyClass {
  return object.deepSkyClass ?? 'generic'
}

export function getDeepSkyVisualStyle(object: Pick<SkyEngineSceneObject, 'deepSkyClass'>): DeepSkyVisualStyle {
  return DEEP_SKY_VISUAL_STYLES[resolveDeepSkyVisualClass(object)]
}

export function getDeepSkyProjectionStyle(
  object: Pick<SkyEngineSceneObject, 'deepSkyClass' | 'source'>,
): DeepSkyVisualStyle {
  const style = getDeepSkyVisualStyle(object)

  if (object.source !== 'temporary_scene_seed') {
    return style
  }

  return {
    ...style,
    minimumMajorDiameterPx: Math.max(16, Math.round(style.minimumMajorDiameterPx * 0.88)),
    minimumMinorDiameterPx: Math.max(12, Math.round(style.minimumMinorDiameterPx * 0.86)),
    maximumMajorDiameterPx: Math.round(style.maximumMajorDiameterPx * 0.74),
    maximumMinorDiameterPx: Math.round(style.maximumMinorDiameterPx * 0.72),
    projectionMagnitudeBoostPx: Math.min(style.projectionMagnitudeBoostPx, 1.2),
  }
}

export function resolveDeepSkyAxes(
  object: Pick<SkyEngineSceneObject, 'deepSkyClass' | 'apparentSizeDeg' | 'majorAxis' | 'minorAxis' | 'orientationDeg'>,
): DeepSkyResolvedAxes {
  const style = getDeepSkyVisualStyle(object)
  const majorAxis = Math.max(object.majorAxis ?? object.apparentSizeDeg ?? 0.25, 0.05)
  const minorAxis = clamp(
    object.minorAxis ?? majorAxis * style.defaultMinorAxisRatio,
    0.05,
    majorAxis,
  )

  return {
    visualClass: style.visualClass,
    orientationDeg: object.orientationDeg ?? style.defaultOrientationDeg,
    majorAxis,
    minorAxis,
    axisRatio: Math.max(1, majorAxis / Math.max(minorAxis, 0.05)),
  }
}

export function getDeepSkyMarkerDimensionsPx(
  object: Pick<SkyEngineSceneObject, 'deepSkyClass' | 'apparentSizeDeg' | 'majorAxis' | 'minorAxis' | 'orientationDeg'>,
  markerRadiusPx: number,
) {
  const style = getDeepSkyVisualStyle(object)
  const axes = resolveDeepSkyAxes(object)
  const widthPx = clamp(
    Math.max(style.minimumMajorDiameterPx, markerRadiusPx * 2 + 6),
    style.minimumMajorDiameterPx,
    style.maximumMajorDiameterPx,
  )
  const heightPx = clamp(
    Math.max(style.minimumMinorDiameterPx, widthPx / axes.axisRatio),
    style.minimumMinorDiameterPx,
    Math.min(style.maximumMinorDiameterPx, widthPx),
  )

  return {
    visualClass: style.visualClass,
    widthPx,
    heightPx,
    rotationDeg: axes.orientationDeg,
  }
}