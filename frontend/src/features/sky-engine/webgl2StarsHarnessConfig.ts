export const WEBGL2_STARS_HARNESS_QUERY_PARAM = 'webgl2StarsHarness'
export const WEBGL2_STARS_HARNESS_MODE_QUERY_PARAM = 'webgl2StarsHarnessMode'

export type WebGL2StarsHarnessMode = 'overlay' | 'side-by-side'

export interface WebGL2StarsHarnessConfig {
  readonly enabled: boolean
  readonly mode: WebGL2StarsHarnessMode
  readonly devOnly: boolean
}

function resolveMode(rawMode: string | null): WebGL2StarsHarnessMode {
  if (rawMode === 'side-by-side' || rawMode === 'split' || rawMode === 'sbs') {
    return 'side-by-side'
  }
  return 'overlay'
}

export function resolveWebGL2StarsHarnessConfig(input: {
  search: string
  isDev: boolean
  devOnly?: boolean
}): WebGL2StarsHarnessConfig {
  const params = new URLSearchParams(input.search)
  const devOnly = input.devOnly ?? true
  const explicitlyEnabled = params.get(WEBGL2_STARS_HARNESS_QUERY_PARAM) === '1'
  const mode = resolveMode(params.get(WEBGL2_STARS_HARNESS_MODE_QUERY_PARAM))

  return {
    enabled: explicitlyEnabled && (!devOnly || input.isDev),
    mode,
    devOnly,
  }
}
