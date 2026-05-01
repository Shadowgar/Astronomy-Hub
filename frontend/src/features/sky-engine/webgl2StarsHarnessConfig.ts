export const WEBGL2_STARS_HARNESS_QUERY_PARAM = 'webgl2StarsHarness'
export const WEBGL2_STARS_HARNESS_MODE_QUERY_PARAM = 'webgl2StarsHarnessMode'
export const WEBGL2_STARS_HARNESS_DENSE_GRID_QUERY_PARAM = 'webgl2StarsHarnessDenseGrid'
export const WEBGL2_STARS_HARNESS_DENSE_GRID_SIZE_QUERY_PARAM = 'webgl2StarsHarnessDenseGridSize'
export const WEBGL2_STARS_HARNESS_REAL_CATALOG_DENSE_PRESET_QUERY_PARAM = 'webgl2StarsHarnessRealCatalogDensePreset'
export const WEBGL2_STARS_HARNESS_POINT_SCALE_QUERY_PARAM = 'webgl2StarsHarnessPointScale'
export const WEBGL2_STARS_HARNESS_ALPHA_SCALE_QUERY_PARAM = 'webgl2StarsHarnessAlphaScale'
export const WEBGL2_STARS_HARNESS_COLOR_MODE_QUERY_PARAM = 'webgl2StarsHarnessColorMode'
export const WEBGL2_STARS_HARNESS_REAL_CATALOG_DENSE_PRESET_AT = '2026-05-01T02:00:00Z'

export type WebGL2StarsHarnessMode = 'overlay' | 'side-by-side'
export type WebGL2StarsHarnessColorMode = 'payload' | 'white-hot' | 'grayscale'

export interface WebGL2StarsHarnessConfig {
  readonly enabled: boolean
  readonly mode: WebGL2StarsHarnessMode
  readonly devOnly: boolean
  readonly denseVerificationGridEnabled: boolean
  readonly denseVerificationGridSize: number
  readonly realCatalogDensePresetEnabled: boolean
  readonly realCatalogDensePresetAtIso: string
  readonly pointScale: number
  readonly alphaScale: number
  readonly colorMode: WebGL2StarsHarnessColorMode
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
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

function resolvePointScale(rawScale: string | null): number {
  if (rawScale == null || rawScale.trim() === '') {
    return 1
  }
  const parsed = Number(rawScale)
  if (!Number.isFinite(parsed)) {
    return 1
  }

  return clamp(parsed, 0.25, 6)
}

function resolveAlphaScale(rawScale: string | null): number {
  if (rawScale == null || rawScale.trim() === '') {
    return 1
  }
  const parsed = Number(rawScale)
  if (!Number.isFinite(parsed)) {
    return 1
  }

  return clamp(parsed, 0.1, 4)
}

function resolveColorMode(rawMode: string | null): WebGL2StarsHarnessColorMode {
  if (rawMode === 'white-hot' || rawMode === 'white' || rawMode === 'hot') {
    return 'white-hot'
  }
  if (rawMode === 'grayscale' || rawMode === 'gray' || rawMode === 'mono') {
    return 'grayscale'
  }
  return 'payload'
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
  const pointScale = resolvePointScale(params.get(WEBGL2_STARS_HARNESS_POINT_SCALE_QUERY_PARAM))
  const alphaScale = resolveAlphaScale(params.get(WEBGL2_STARS_HARNESS_ALPHA_SCALE_QUERY_PARAM))
  const colorMode = resolveColorMode(params.get(WEBGL2_STARS_HARNESS_COLOR_MODE_QUERY_PARAM))
  const realCatalogDensePresetEnabled =
    params.get(WEBGL2_STARS_HARNESS_REAL_CATALOG_DENSE_PRESET_QUERY_PARAM) === '1' && input.isDev

  return {
    enabled: explicitlyEnabled && (!devOnly || input.isDev),
    mode,
    devOnly,
    denseVerificationGridEnabled,
    denseVerificationGridSize,
    realCatalogDensePresetEnabled,
    realCatalogDensePresetAtIso: WEBGL2_STARS_HARNESS_REAL_CATALOG_DENSE_PRESET_AT,
    pointScale,
    alphaScale,
    colorMode,
  }
}
