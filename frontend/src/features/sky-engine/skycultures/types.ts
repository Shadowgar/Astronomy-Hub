export interface SkyCultureConstellationCommonName {
  readonly english: string | null
  readonly native: string | null
  readonly pronounce: string | null
}

export interface SkyCultureConstellationDefinition {
  readonly id: string
  readonly iau: string | null
  readonly commonName: SkyCultureConstellationCommonName
  readonly lines: readonly (readonly number[])[]
}

export interface SkyCultureDefinition {
  readonly id: string
  readonly region: string | null
  readonly fallbackToInternationalNames: boolean
  readonly constellations: readonly SkyCultureConstellationDefinition[]
}
