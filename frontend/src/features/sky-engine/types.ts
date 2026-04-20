export type SkyEngineObjectSource =
  | 'computed_real_sky'
  | 'computed_ephemeris'
  | 'temporary_scene_seed'
  | 'engine_mock_tile'
  | 'engine_catalog_tile'
  | 'backend_star_catalog'
  | 'backend_satellite_scene'
  | 'minor_planet_catalog'
  | 'comet_catalog'
  | 'meteor_shower_catalog'
export type SkyEngineObjectType = 'star' | 'moon' | 'planet' | 'deep_sky' | 'satellite' | 'minor_planet' | 'comet' | 'meteor_shower'
export type SkyEngineTrackingMode = 'fixed_equatorial' | 'lunar_ephemeris' | 'static'
export type SkyEngineGuidanceTier = 'featured' | 'guide' | 'none'
export type SkyEngineDeepSkyClass = 'galaxy' | 'nebula' | 'cluster' | 'generic'

export interface SkyEngineObserver {
  label: string
  latitude: number
  longitude: number
  elevationFt: number
}

export interface SkyEngineCelestialSourceObject {
  id: string
  name: string
  type: 'star'
  rightAscensionHours: number
  declinationDeg: number
  magnitude: number
  colorHex: string
  colorIndexBV?: number
  summary: string
  description: string
  constellation?: string
}

export interface SkyEngineSceneObject {
  id: string
  name: string
  type: SkyEngineObjectType
  altitudeDeg: number
  azimuthDeg: number
  magnitude: number
  colorHex: string
  summary: string
  description: string
  constellation?: string
  truthNote: string
  source: SkyEngineObjectSource
  trackingMode: SkyEngineTrackingMode
  rightAscensionHours?: number
  declinationDeg?: number
  colorIndexBV?: number
  timestampIso?: string
  providerSource?: string
  tleLine1?: string
  tleLine2?: string
  stdMagnitude?: number
  orbitEpochIso?: string
  orbitalPeriodMinutes?: number
  orbitalInclinationDeg?: number
  meteorPeakIso?: string
  meteorZenithRatePerHour?: number
  visibilityWindowStartIso?: string
  visibilityWindowEndIso?: string
  detailRoute?: string
  apparentSizeDeg?: number
  deepSkyClass?: SkyEngineDeepSkyClass
  orientationDeg?: number
  majorAxis?: number
  minorAxis?: number
  illuminationFraction?: number
  phaseAngle?: number
  phaseMagnitudeAdjustment?: number
  brightLimbAngleDeg?: number
  ringOpening?: number
  ringTiltAngle?: number
  ringBrightnessGain?: number
  phaseLabel?: string
  waxing?: boolean
  guidanceScore?: number
  guidanceTier?: SkyEngineGuidanceTier
  isAboveHorizon: boolean
}

export interface SkyEngineTrajectorySample {
  timestampIso: string
  hourOffset: number
  altitudeDeg: number
  azimuthDeg: number
  isAboveHorizon: boolean
}

export interface SkyEnginePickTarget {
  objectId: string
  objectName: string
  objectType: SkyEngineObjectType
  objectSource: SkyEngineObjectSource
  screenX: number
  screenY: number
  radiusPx: number
}

export interface SkyEngineAtmosphereStatus {
  mode: 'addon' | 'fallback'
  message: string
}

export interface SkyEngineDirectionVector {
  x: number
  y: number
  z: number
}

export interface SkyEngineAidVisibility {
  constellations: boolean
  azimuthRing: boolean
  altitudeRings: boolean
  atmosphere: boolean
  landscape: boolean
  deepSky: boolean
  nightMode: boolean
}

export interface SkyEngineGuidanceTarget {
  objectId: string
  name: string
  score: number
  summary: string
}

export interface SkyEnginePlanetDefinition {
  id: string
  name: string
  colorHex: string
  summary: string
  description: string
}

export type SkyEngineSunPhase = 'Daylight' | 'Low Sun' | 'Night'

export interface SkyEngineVisualCalibration {
  phaseLabel: SkyEngineSunPhase
  directionalLightIntensity: number
  ambientLightIntensity: number
  directionalLightColorHex: string
  ambientLightColorHex: string
  backgroundColorHex: string
  skyZenithColorHex: string
  skyHorizonColorHex: string
  twilightBandColorHex: string
  horizonColorHex: string
  horizonGlowColorHex: string
  horizonGlowAlpha: number
  landscapeFogColorHex: string
  groundTintHex: string
  landscapeShadowAlpha: number
  starVisibility: number
  starFieldBrightness: number
  starLabelVisibility: number
  starHaloVisibility: number
  starTwinkleAmplitude: number
  atmosphereExposure: number
  atmosphereAerialPerspectiveIntensity: number
  atmosphereMultiScatteringIntensity: number
  atmosphereMieScatteringScale: number
}

export interface SkyEngineSunState {
  altitudeDeg: number
  azimuthDeg: number
  isAboveHorizon: boolean
  phaseLabel: SkyEngineSunPhase
  rightAscensionHours: number
  declinationDeg: number
  localSiderealTimeDeg: number
  skyDirection: SkyEngineDirectionVector
  lightDirection: SkyEngineDirectionVector
  visualCalibration: SkyEngineVisualCalibration
}