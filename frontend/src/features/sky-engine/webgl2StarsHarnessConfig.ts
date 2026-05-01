export const WEBGL2_STARS_HARNESS_QUERY_PARAM = 'webgl2StarsHarness'
export const WEBGL2_STARS_HARNESS_MODE_QUERY_PARAM = 'webgl2StarsHarnessMode'
export const WEBGL2_STARS_HARNESS_DENSE_GRID_QUERY_PARAM = 'webgl2StarsHarnessDenseGrid'
export const WEBGL2_STARS_HARNESS_DENSE_GRID_SIZE_QUERY_PARAM = 'webgl2StarsHarnessDenseGridSize'

export type WebGL2StarsHarnessMode = 'overlay' | 'side-by-side'

export interface WebGL2StarsHarnessConfig {
  readonly enabled: boolean
  readonly mode: WebGL2StarsHarnessMode
  readonly devOnly: boolean
  readonly denseVerificationGridEnabled: boolean
  readonly denseVerificationGridSize: number
}

function resolveDenseGridSize(rawSize: string | null): number {
  const parsed = Number(rawSize)
  if (!Number.isFinite(parsed)) {
    return 12
  }

  const rounded = Math.round(parsed)
  return Math.max(4, Math.min(64, rounded))
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
  const denseVerificationGridEnabled = params.get(WEBGL2_STARS_HARNESS_DENSE_GRID_QUERY_PARAM) === '1'
  const denseVerificationGridSize = resolveDenseGridSize(
    params.get(WEBGL2_STARS_HARNESS_DENSE_GRID_SIZE_QUERY_PARAM),
  )

  return {
    enabled: explicitlyEnabled && (!devOnly || input.isDev),
    mode,
    devOnly,
    denseVerificationGridEnabled,
    denseVerificationGridSize,
  }
}
