import type { SkyEngineDeepSkyClass, SkyEngineSceneObject } from './types'

export interface DeepSkyVisualStyle {
  readonly visualClass: SkyEngineDeepSkyClass
  readonly widthScale: number
  readonly heightScale: number
  readonly minimumDiameterPx: number
  readonly diameterScale: number
  readonly diameterBiasPx: number
  readonly projectionMinimumRadiusPx: number
  readonly projectionMaximumRadiusPx: number
  readonly projectionRadiusGain: number
  readonly projectionMagnitudeBoostPx: number
}

const DEEP_SKY_VISUAL_STYLES: Record<SkyEngineDeepSkyClass, DeepSkyVisualStyle> = {
  galaxy: {
    visualClass: 'galaxy',
    widthScale: 1.28,
    heightScale: 0.82,
    minimumDiameterPx: 18,
    diameterScale: 2.85,
    diameterBiasPx: 6,
    projectionMinimumRadiusPx: 8,
    projectionMaximumRadiusPx: 34,
    projectionRadiusGain: 1,
    projectionMagnitudeBoostPx: 1.8,
  },
  nebula: {
    visualClass: 'nebula',
    widthScale: 1.08,
    heightScale: 1.08,
    minimumDiameterPx: 20,
    diameterScale: 2.95,
    diameterBiasPx: 6,
    projectionMinimumRadiusPx: 9,
    projectionMaximumRadiusPx: 38,
    projectionRadiusGain: 1.04,
    projectionMagnitudeBoostPx: 2.2,
  },
  cluster: {
    visualClass: 'cluster',
    widthScale: 1,
    heightScale: 1,
    minimumDiameterPx: 16,
    diameterScale: 2.35,
    diameterBiasPx: 4,
    projectionMinimumRadiusPx: 6.4,
    projectionMaximumRadiusPx: 24,
    projectionRadiusGain: 0.9,
    projectionMagnitudeBoostPx: 1.4,
  },
  generic: {
    visualClass: 'generic',
    widthScale: 1,
    heightScale: 1,
    minimumDiameterPx: 16,
    diameterScale: 2.5,
    diameterBiasPx: 4,
    projectionMinimumRadiusPx: 7,
    projectionMaximumRadiusPx: 26,
    projectionRadiusGain: 0.95,
    projectionMagnitudeBoostPx: 1.6,
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
    projectionMinimumRadiusPx: Math.max(5.8, style.projectionMinimumRadiusPx * 0.82),
    projectionMaximumRadiusPx: style.projectionMaximumRadiusPx * 0.74,
    projectionRadiusGain: style.projectionRadiusGain * 0.86,
    projectionMagnitudeBoostPx: Math.min(style.projectionMagnitudeBoostPx, 1.2),
  }
}

export function getDeepSkyMarkerDimensionsPx(
  object: Pick<SkyEngineSceneObject, 'deepSkyClass'>,
  markerRadiusPx: number,
) {
  const style = getDeepSkyVisualStyle(object)
  const baseDiameterPx = Math.max(style.minimumDiameterPx, markerRadiusPx * style.diameterScale + style.diameterBiasPx)

  return {
    visualClass: style.visualClass,
    widthPx: baseDiameterPx * style.widthScale,
    heightPx: baseDiameterPx * style.heightScale,
  }
}