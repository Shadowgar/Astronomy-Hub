export const WEBGL2_STARS_OWNER_QUERY_PARAM = 'webgl2StarsOwner'
export const WEBGL2_STARS_OWNER_FORCE_FAIL_QUERY_PARAM = 'webgl2StarsOwnerForceFail'

export interface WebGL2StarsOwnerConfig {
  readonly enabled: boolean
  readonly devOnly: boolean
  readonly forceFailure: boolean
}

export function resolveWebGL2StarsOwnerConfig(input: {
  search: string
  isDev: boolean
  devOnly?: boolean
}): WebGL2StarsOwnerConfig {
  const params = new URLSearchParams(input.search)
  const devOnly = input.devOnly ?? true
  const explicitlyEnabled = params.get(WEBGL2_STARS_OWNER_QUERY_PARAM) === '1'

  return {
    enabled: explicitlyEnabled && (!devOnly || input.isDev),
    devOnly,
    forceFailure: input.isDev && params.get(WEBGL2_STARS_OWNER_FORCE_FAIL_QUERY_PARAM) === '1',
  }
}