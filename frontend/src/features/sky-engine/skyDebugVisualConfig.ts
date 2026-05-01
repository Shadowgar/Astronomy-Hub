export const SKY_DEBUG_DARK_QUERY_PARAM = 'skyDebugDark'
export const SKY_DEBUG_STARS_VISIBLE_QUERY_PARAM = 'skyDebugStarsVisible'

export interface SkyDebugVisualConfig {
  readonly darkSkyOverrideEnabled: boolean
  readonly starsVisibleOverrideEnabled: boolean
  readonly devOnly: boolean
}

export function resolveSkyDebugVisualConfig(input: {
  search: string
  isDev: boolean
  devOnly?: boolean
}): SkyDebugVisualConfig {
  const params = new URLSearchParams(input.search)
  const devOnly = input.devOnly ?? true
  const debugAllowed = !devOnly || input.isDev

  return {
    darkSkyOverrideEnabled: debugAllowed && params.get(SKY_DEBUG_DARK_QUERY_PARAM) === '1',
    starsVisibleOverrideEnabled: debugAllowed && params.get(SKY_DEBUG_STARS_VISIBLE_QUERY_PARAM) === '1',
    devOnly,
  }
}
