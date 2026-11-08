import manifest from '../../../public/solar-assets/lunar-height-v1/manifest.json'

export const lolaHeightSource = manifest
const { width, height, scaleMetersPerUnit } = manifest
const wrapColumn = (x: number) => ((x % width) + width) % width

export interface LolaHeightSample {
  heightMeters: number
  /** Outside pixel-center latitudes, edge samples are extended; no polar measurement is invented. */
  polarEdgeExtended: boolean
}

/** A source-grid sampler only. It creates no renderer and changes no existing Moon state. */
export function createLolaHeightGrid(buffer: ArrayBuffer) {
  if (buffer.byteLength !== width * height * 2) throw new Error('LOLA grid byte length mismatch')
  const data = new DataView(buffer)
  const pixel = (x: number, y: number) => data.getInt16((y * width + wrapColumn(x)) * 2, true) * scaleMetersPerUnit

  function sampleHeightMeters(longitudeDegrees: number, latitudeDegrees: number): LolaHeightSample {
    if (!Number.isFinite(longitudeDegrees) || !Number.isFinite(latitudeDegrees) || Math.abs(latitudeDegrees) > 90) {
      throw new RangeError('Finite east-positive longitude and latitude in [-90, 90] required')
    }
    const longitude = ((longitudeDegrees % 360) + 360) % 360
    const x = longitude * 4 - .5
    const rawY = (90 - latitudeDegrees) * 4 - .5
    const y = Math.max(0, Math.min(height - 1, rawY))
    const x0 = Math.floor(x), y0 = Math.floor(y), y1 = Math.min(height - 1, y0 + 1)
    const tx = x - x0, ty = y - y0
    const north = pixel(x0, y0) * (1 - tx) + pixel(x0 + 1, y0) * tx
    const south = pixel(x0, y1) * (1 - tx) + pixel(x0 + 1, y1) * tx
    return { heightMeters: north * (1 - ty) + south * ty, polarEdgeExtended: y !== rawY }
  }

  /** Row-major north-to-south grid. East may exceed 180/360 to cross the seam. */
  function sampleTile(west: number, south: number, east: number, north: number, columns = 65, rows = 65) {
    if (![west, south, east, north].every(Number.isFinite) || east <= west || east - west > 360 || north <= south || south < -90 || north > 90 ||
      !Number.isInteger(columns) || !Number.isInteger(rows) || columns < 2 || rows < 2 || columns > 257 || rows > 257) {
      throw new RangeError('Bounded geographic rectangle and 2..257 tile dimensions required')
    }
    const heights = new Float32Array(columns * rows)
    let polarEdgeExtended = false
    for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
      const value = sampleHeightMeters(west + (east - west) * column / (columns - 1), north - (north - south) * row / (rows - 1))
      heights[row * columns + column] = value.heightMeters
      polarEdgeExtended ||= value.polarEdgeExtended
    }
    return { heights, columns, rows, polarEdgeExtended, referenceRadiusMeters: manifest.referenceRadiusMeters }
  }
  return { sampleHeightMeters, sampleTile, source: manifest }
}

export async function loadLolaHeightGrid(signal?: AbortSignal, sourceUrl = manifest.files[0].url) {
  const source = manifest.files[0]
  const response = await fetch(sourceUrl, { signal })
  if (!response.ok) throw new Error(`LOLA source unavailable (${response.status})`)
  const buffer = await response.arrayBuffer()
  if (signal?.aborted) throw new DOMException('LOLA load cancelled', 'AbortError')
  if (!globalThis.crypto?.subtle) throw new Error('A secure browser context is required to verify LOLA source bytes')
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
  if (hex !== source.sha256) throw new Error('LOLA source SHA-256 mismatch')
  if (signal?.aborted) throw new DOMException('LOLA load cancelled', 'AbortError')
  return createLolaHeightGrid(buffer)
}
