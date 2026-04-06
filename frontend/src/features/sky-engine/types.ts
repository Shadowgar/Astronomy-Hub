export type SkyEngineObjectSource = 'computed_real_sky' | 'computed_ephemeris' | 'temporary_scene_seed'
export type SkyEngineObjectType = 'star' | 'moon' | 'planet' | 'deep_sky'
export type SkyEngineTrackingMode = 'fixed_equatorial' | 'lunar_ephemeris' | 'static'
export type SkyEngineGuidanceTier = 'featured' | 'guide' | 'none'

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
  timestampIso?: string
  illuminationFraction?: number
  brightLimbAngleDeg?: number
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
}

export interface SkyEngineGuidanceTarget {
  objectId: string
  name: string
  score: number
  summary: string
}

export type SkyEngineSunPhase = 'Daylight' | 'Low Sun' | 'Night'

export interface SkyEngineVisualCalibration {
  phaseLabel: SkyEngineSunPhase
  directionalLightIntensity: number
  ambientLightIntensity: number
  directionalLightColorHex: string
  ambientLightColorHex: string
  backgroundColorHex: string
  horizonColorHex: string
  starVisibility: number
  starLabelVisibility: number
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