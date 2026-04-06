export type SkyEngineObjectSource = 'computed_real_sky' | 'temporary_scene_seed'

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
  type: 'star' | 'planet' | 'deep_sky'
  altitudeDeg: number
  azimuthDeg: number
  magnitude: number
  colorHex: string
  summary: string
  description: string
  constellation?: string
  truthNote: string
  source: SkyEngineObjectSource
  rightAscensionHours?: number
  declinationDeg?: number
  timestampIso?: string
  isAboveHorizon: boolean
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

export interface SkyEngineSunState {
  altitudeDeg: number
  azimuthDeg: number
  isAboveHorizon: boolean
  phaseLabel: 'Daylight' | 'Civil / low sun' | 'Night'
  rightAscensionHours: number
  declinationDeg: number
  localSiderealTimeDeg: number
  skyDirection: SkyEngineDirectionVector
  lightDirection: SkyEngineDirectionVector
}