import type { RuntimeStar } from '../contracts/stars'
import { healpixAngToPix } from './healpix'
import { HIP_PIX_ORDER_2_BASE64, HIP_PIX_ORDER_2_BYTE_LENGTH } from './hipPixOrder2.generated'

const HIP_SOURCE_ID = /^HIP\s+(\d+)\s*$/i
const HIP_ID_PREFIX = /^hip-(\d+)$/i

let cachedTable: Uint8Array | null = null

function decodeBase64ToUint8(b64: string): Uint8Array {
  const bin = globalThis.atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) {
    out[i] = bin.charCodeAt(i)
  }
  return out
}

function getPixOrder2Table(): Uint8Array {
  if (!cachedTable) {
    cachedTable = decodeBase64ToUint8(HIP_PIX_ORDER_2_BASE64)
    if (cachedTable.length !== HIP_PIX_ORDER_2_BYTE_LENGTH) {
      throw new Error(
        `hip.inl decode length mismatch: got ${cachedTable.length}, expected ${HIP_PIX_ORDER_2_BYTE_LENGTH}`,
      )
    }
  }
  return cachedTable
}

/**
 * Stellarium `hip.c` `hip_get_pix`: nested HEALPix pixel index for a Hipparcos id at `order` 0–2.
 * Returns `-1` when the star has no tile (`255` in the lookup) or inputs are out of range.
 */
export function hipGetPix(hip: number, order: number): number {
  if (order > 2 || !Number.isFinite(hip)) {
    return -1
  }

  const hipIndex = hip | 0
  if (hipIndex !== hip || hipIndex < 0) {
    return -1
  }

  const table = getPixOrder2Table()
  if (hipIndex >= table.length) {
    return -1
  }

  let ret = table[hipIndex]
  if (ret === 255) {
    return -1
  }

  const divisor = 1 << (2 * (2 - order))
  ret = (ret / divisor) | 0
  return ret
}

/**
 * Hipparcos id from `sourceId` (`"HIP 91262"`), `id` (`"hip-91262"`), or numeric `id`.
 */
export function parseHipIdFromRuntimeStar(star: RuntimeStar): number | null {
  const source = star.sourceId?.match(HIP_SOURCE_ID)
  if (source) {
    return Number(source[1])
  }

  const prefixed = star.id?.match(HIP_ID_PREFIX)
  if (prefixed) {
    return Number(prefixed[1])
  }

  if (star.id != null && /^\d+$/.test(star.id)) {
    return Number(star.id)
  }

  return null
}

/**
 * When a HIP is present, Stellarium’s `PIX_ORDER_2[hip]` at order **2** matches nested HEALPix from catalog RA/Dec.
 * Stars without a parseable HIP pass through; unknown HIP (`hip_get_pix` → `-1`) is dropped.
 */
export function runtimeStarMatchesHipHealpixLookup(star: RuntimeStar): boolean {
  const hip = parseHipIdFromRuntimeStar(star)
  if (hip == null) {
    return true
  }

  const pix = hipGetPix(hip, 2)
  if (pix === -1) {
    return false
  }

  return pix === healpixAngToPix(2, star.raDeg, star.decDeg)
}
