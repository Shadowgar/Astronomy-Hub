import type { SkyTileCatalog } from './contracts/tiles'

export function resolveSkyTileRepositoryMode(_search: string = globalThis.location?.search ?? ''): SkyTileCatalog {
  return 'hipparcos'
}