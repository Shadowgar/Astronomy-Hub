export const WEBGL2_STARS_PERF_TRACE_QUERY_PARAM = 'webgl2StarsPerfTrace'
export const WEBGL2_STARS_STATUS_UI_QUERY_PARAM = 'webgl2StarsStatusUi'
export const WEBGL2_STARS_DIAGNOSTICS_WRITES_QUERY_PARAM = 'webgl2StarsDiagnosticsWrites'

export interface WebGL2StarsPerfTraceConfig {
  readonly perfTraceEnabled: boolean
  readonly statusUiEnabled: boolean
  readonly diagnosticsWritesEnabled: boolean
  readonly devOnly: boolean
}

function resolveOptOutFlag(rawValue: string | null) {
  return rawValue !== '0'
}

export function resolveWebGL2StarsPerfTraceConfig(input: {
  search: string
  isDev: boolean
  devOnly?: boolean
}): WebGL2StarsPerfTraceConfig {
  const params = new URLSearchParams(input.search)
  const devOnly = input.devOnly ?? true
  const debugAllowed = !devOnly || input.isDev

  return {
    perfTraceEnabled: debugAllowed && params.get(WEBGL2_STARS_PERF_TRACE_QUERY_PARAM) === '1',
    statusUiEnabled: debugAllowed ? resolveOptOutFlag(params.get(WEBGL2_STARS_STATUS_UI_QUERY_PARAM)) : true,
    diagnosticsWritesEnabled: debugAllowed ? resolveOptOutFlag(params.get(WEBGL2_STARS_DIAGNOSTICS_WRITES_QUERY_PARAM)) : true,
    devOnly,
  }
}