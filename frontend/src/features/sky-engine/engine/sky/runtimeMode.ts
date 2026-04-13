import type { SkyTileCatalog } from './contracts/tiles'

export function resolveSkyTileRepositoryMode(_search: string = globalThis.location?.search ?? ''): Extract<SkyTileCatalog, 'mock' | 'hipparcos'> {
  return 'hipparcos'
}