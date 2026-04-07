import type { SkyTileRepositoryMode } from './contracts/tiles'

function resolveModeValue(value: string | null | undefined): SkyTileRepositoryMode | null {
  if (value === 'mock' || value === 'hipparcos') {
    return value
  }

  return null
}

export function resolveSkyTileRepositoryMode(search: string = globalThis.location?.search ?? ''): SkyTileRepositoryMode {
  const queryValue = resolveModeValue(new URLSearchParams(search).get('skyDataMode'))

  if (queryValue) {
    return queryValue
  }

  return 'hipparcos'
}