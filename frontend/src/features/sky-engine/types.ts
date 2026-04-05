export type SkyEngineSeedSource = 'temporary_scene_seed'

export interface SkyEngineObserver {
  label: string
  latitude: number
  longitude: number
  elevationFt: number
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
  seededReason: string
  source: SkyEngineSeedSource
}

export interface SkyEngineAtmosphereStatus {
  mode: 'addon' | 'fallback'
  message: string
}