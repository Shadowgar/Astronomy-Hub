import type { SkyTileCatalog } from './contracts/tiles'

type SupportedRuntimeTileMode = Extract<SkyTileCatalog, 'mock' | 'hipparcos' | 'multi-survey'>

const DEFAULT_RUNTIME_TILE_MODE: SupportedRuntimeTileMode = 'multi-survey'

function isSupportedRuntimeTileMode(value: string | null | undefined): value is SupportedRuntimeTileMode {
  return value === 'mock' || value === 'hipparcos' || value === 'multi-survey'
}

export function resolveSkyTileRepositoryMode(search: string = globalThis.location?.search ?? ''): SupportedRuntimeTileMode {
  const requestedMode = new URLSearchParams(search).get('tileMode')

  if (isSupportedRuntimeTileMode(requestedMode)) {
    return requestedMode
  }

  return DEFAULT_RUNTIME_TILE_MODE
}