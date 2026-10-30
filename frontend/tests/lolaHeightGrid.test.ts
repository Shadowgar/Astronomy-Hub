import { readFileSync } from 'node:fs'
import { webcrypto } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLolaHeightGrid, loadLolaHeightGrid, lolaHeightSource } from '../src/features/planet/lolaHeightGrid'

const bytes = readFileSync(new URL('../public/solar-assets/lunar-height-v1/ldem_4.img', import.meta.url))
const raw = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
const grid = createLolaHeightGrid(raw)
afterEach(() => vi.unstubAllGlobals())

describe('original LOLA height grid', () => {
  it('preserves independent pinned source samples, half-metre units and east/north pixel registration', () => {
    expect(grid.sampleHeightMeters(.125, 89.875)).toEqual({ heightMeters: -119.5, polarEdgeExtended: false })
    expect(grid.sampleHeightMeters(180.125, -.125).heightMeters).toBe(2836.5)
    expect(grid.sampleHeightMeters(359.875, -89.875).heightMeters).toBe(91)
    expect(lolaHeightSource.referenceRadiusMeters).toBe(1737400)
    expect(lolaHeightSource.mapReferenceFrame).toBe('MEAN EARTH/POLAR AXIS OF DE421')
  })

  it('wraps at the prime meridian without a seam and discloses polar row extension', () => {
    expect(grid.sampleHeightMeters(-.125, 0)).toEqual(grid.sampleHeightMeters(359.875, 0))
    expect(grid.sampleHeightMeters(0, 20)).toEqual(grid.sampleHeightMeters(360, 20))
    expect(grid.sampleHeightMeters(0, 90).polarEdgeExtended).toBe(true)
    expect(grid.sampleHeightMeters(0, -90).polarEdgeExtended).toBe(true)
  })

  it('shares exact edge samples between adjacent native terrain tiles', () => {
    const west = grid.sampleTile(0, -10, 10, 10, 17, 17)
    const east = grid.sampleTile(10, -10, 20, 10, 17, 17)
    for (let row = 0; row < 17; row++) expect(west.heights[row * 17 + 16]).toBe(east.heights[row * 17])
    expect(west.heights).toHaveLength(17 * 17)
    expect(grid.sampleTile(350, -10, 370, 10, 3, 3).heights[4]).toBe(grid.sampleHeightMeters(0, 0).heightMeters)
  })

  it('rejects corrupt lengths, unbounded tiles, nonfinite inputs and invalid latitudes', () => {
    expect(() => createLolaHeightGrid(new ArrayBuffer(2))).toThrow('length mismatch')
    expect(() => grid.sampleHeightMeters(NaN, 0)).toThrow(RangeError)
    expect(() => grid.sampleHeightMeters(0, 91)).toThrow(RangeError)
    expect(() => grid.sampleTile(0, -90, 361, 90)).toThrow(RangeError)
    expect(() => grid.sampleTile(0, -90, 360, 90, 258, 65)).toThrow(RangeError)
  })

  it('admits original bytes only and preserves cancellation', async () => {
    vi.stubGlobal('crypto', webcrypto)
    const fetcher = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => raw.slice(0) })
    vi.stubGlobal('fetch', fetcher)
    expect((await loadLolaHeightGrid()).sampleHeightMeters(.125, 89.875).heightMeters).toBe(-119.5)
    const corrupted = raw.slice(0); new Uint8Array(corrupted)[0] ^= 1
    fetcher.mockResolvedValueOnce({ ok: true, arrayBuffer: async () => corrupted })
    await expect(loadLolaHeightGrid()).rejects.toThrow('SHA-256 mismatch')
    const controller = new AbortController(); controller.abort()
    await expect(loadLolaHeightGrid(controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
  })
})
