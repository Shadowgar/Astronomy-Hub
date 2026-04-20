export interface DssSurveyPatch {
  readonly id: string
  readonly name: string
  readonly rightAscensionHours: number
  readonly declinationDeg: number
  readonly radiusDeg: number
  readonly intensity: number
}

export const DSS_SURVEY_PATCHES: readonly DssSurveyPatch[] = [
  {
    id: 'dss-patch-milky-core',
    name: 'Milky Way Core Survey',
    rightAscensionHours: 17.75,
    declinationDeg: -29.0,
    radiusDeg: 18,
    intensity: 0.7,
  },
  {
    id: 'dss-patch-cygnus',
    name: 'Cygnus Survey',
    rightAscensionHours: 20.6,
    declinationDeg: 40.0,
    radiusDeg: 14,
    intensity: 0.45,
  },
  {
    id: 'dss-patch-orion',
    name: 'Orion Survey',
    rightAscensionHours: 5.5,
    declinationDeg: -5.0,
    radiusDeg: 12,
    intensity: 0.4,
  },
]
