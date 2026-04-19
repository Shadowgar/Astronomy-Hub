import { HIP_PIX_ORDER_2_BASE64, HIP_PIX_ORDER_2_BYTE_LENGTH } from './hipPixOrder2.generated'

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
