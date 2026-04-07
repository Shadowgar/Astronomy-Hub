export type SkyProjectionMode = 'stereographic' | 'gnomonic' | 'orthographic'

export type ObserverSnapshot = {
  timestampUtc: string
  latitudeDeg: number
  longitudeDeg: number
  elevationM?: number
  fovDeg: number
  centerAltDeg: number
  centerAzDeg: number
  projection: SkyProjectionMode
}