import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import { createLolaHeightGrid } from '../../frontend/src/features/planet/lolaHeightGrid.ts'
import { createLolaTerrainProvider } from './lolaTerrain.mjs'

const Cesium = await import(pathToFileURL((process.env.GODS_EYE_SOURCE || '/var/tmp/oras-cesium/gods-eye') + '/node_modules/cesium/Source/Cesium.js').href)
const file = readFileSync(new URL('../../frontend/public/solar-assets/lunar-height-v1/ldem_4.img', import.meta.url))
const grid = createLolaHeightGrid(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer)

test('qualified native Cesium provider uses lunar frame, signed metre heights and bounded source LOD', async () => {
  const provider = createLolaTerrainProvider(Cesium, grid)
  assert.equal(Cesium.VERSION, '1.138.0')
  assert.equal(provider.tilingScheme.ellipsoid.radii.x, 1737400)
  assert.equal(provider.getTileDataAvailable(0, 0, 3), true)
  assert.equal(provider.getTileDataAvailable(0, 0, 4), false)
  const tile = await provider.requestTileGeometry(8, 4, 3)
  assert.ok(tile instanceof Cesium.HeightmapTerrainData)
  assert.equal(tile.childTileMask, 0)
  const rect = provider.tilingScheme.tileXYToRectangle(8, 4, 3)
  const lng = 5, lat = -5
  const interpolated = tile.interpolateHeight(rect, Cesium.Math.toRadians(lng), Cesium.Math.toRadians(lat))
  assert.ok(Math.abs(interpolated - grid.sampleHeightMeters(lng, lat).heightMeters) < 0.001)
  assert.equal(provider.diagnostics().generatedTiles, 1)
  await assert.rejects(provider.requestTileGeometry(0, 0, 4), /No source terrain/)
  provider.dispose()
  assert.equal(provider.diagnostics().sourceGridBytes, 0)
})

test('native tile triangles preserve terrain heights and adjacent tile boundaries', async () => {
  const provider = createLolaTerrainProvider(Cesium, grid)
  const west = await provider.requestTileGeometry(7, 4, 3)
  const east = await provider.requestTileGeometry(8, 4, 3)
  const a = provider.tilingScheme.tileXYToRectangle(7, 4, 3), b = provider.tilingScheme.tileXYToRectangle(8, 4, 3)
  for (const lat of [-.25, -5, -20]) assert.equal(west.interpolateHeight(a, 0, Cesium.Math.toRadians(lat)), east.interpolateHeight(b, 0, Cesium.Math.toRadians(lat)))
  assert.ok(provider.getLevelMaximumGeometricError(3) > 0)
  assert.equal(provider.hasWaterMask, false)
  provider.dispose()
})

test('request cancellation and provider disposal cannot publish queued terrain', async () => {
  const abort = new AbortController(), provider = createLolaTerrainProvider(Cesium, grid, { signal: abort.signal })
  const pending = provider.requestTileGeometry(0, 0, 0)
  abort.abort()
  await assert.rejects(pending, { name: 'AbortError' })
  await assert.rejects(provider.requestTileGeometry(0, 0, 0), { name: 'AbortError' })
  assert.equal(provider.diagnostics().generatedTiles, 0)
  assert.equal(provider.diagnostics().disposed, true)
})

test('each geometric pole has one explicitly extrapolated height across all native tiles and source levels', async () => {
  const provider = createLolaTerrainProvider(Cesium, grid)
  for (const latitude of [-90, 90]) {
    let poleHeight: number | undefined
    for (let level = 0; level <= 3; level++) {
      const y = latitude > 0 ? 0 : provider.tilingScheme.getNumberOfYTilesAtLevel(level) - 1
      for (let x = 0; x < provider.tilingScheme.getNumberOfXTilesAtLevel(level); x++) {
        const tile = await provider.requestTileGeometry(x, y, level)
        const rect = provider.tilingScheme.tileXYToRectangle(x, y, level)
        for (const longitude of [rect.west, (rect.west + rect.east) / 2, rect.east]) {
          const actual = tile.interpolateHeight(rect, longitude, Cesium.Math.toRadians(latitude))
          poleHeight ??= actual
          assert.ok(Math.abs(actual - poleHeight) < .001, 'One geometric pole cannot have longitude-dependent heights')
        }
      }
    }
  }
  assert.equal(provider.diagnostics().polarCaps.measured, false)
  provider.dispose()
})
