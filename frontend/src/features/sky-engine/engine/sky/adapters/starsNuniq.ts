import { decodeEphTileNuniq, encodeEphTileNuniq } from './ephCodec'

/**
 * HEALPix nested `nuniq` → `(order, pix)` — same decomposition as Stellarium `stars.c` `nuniq_to_pix`
 * and `eph-file.c` / {@link decodeEphTileNuniq}.
 */
export function nuniqToHealpixOrderAndPix(nuniq: bigint | number): { order: number; pix: number } {
  return decodeEphTileNuniq(nuniq)
}

export { encodeEphTileNuniq as healpixOrderPixToNuniq }
