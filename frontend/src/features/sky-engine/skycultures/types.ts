export interface SkyCultureConstellationCommonName {
  readonly english: string | null
  readonly native: string | null
  readonly pronounce: string | null
}

export interface SkyCultureConstellationImageAnchor {
  readonly hip: number
  readonly posPx: readonly [number, number]
  readonly uv: readonly [number, number]
}

export interface SkyCultureConstellationImage {
  readonly file: string
  readonly sizePx: readonly [number, number]
  readonly anchors: readonly SkyCultureConstellationImageAnchor[]
}

export interface SkyCultureConstellationDefinition {
  readonly id: string
  readonly iau: string | null
  readonly commonName: SkyCultureConstellationCommonName
  readonly description: string | null
  readonly lines: readonly (readonly number[])[]
  readonly image: SkyCultureConstellationImage | null
}

export interface SkyCultureBoundaryPoint {
  readonly rightAscensionHours: number
  readonly declinationDeg: number
}

export interface SkyCultureBoundaryDefinition {
  readonly id: string
  readonly leftIau: string
  readonly rightIau: string
  readonly start: SkyCultureBoundaryPoint
  readonly end: SkyCultureBoundaryPoint
}

export interface SkyCultureDefinition {
  readonly id: string
  readonly region: string | null
  readonly fallbackToInternationalNames: boolean
  readonly langsUseNativeNames: readonly string[]
  readonly constellations: readonly SkyCultureConstellationDefinition[]
  readonly boundaries: readonly SkyCultureBoundaryDefinition[]
}
