import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { computeMoonSceneObject } from '../src/features/sky-engine/astronomy'
import {
  assembleSkyScenePacket,
  buildSkyEngineQuery,
  createFileBackedSkyTileRepository,
  raDecToHorizontalCoordinates,
} from '../src/features/sky-engine/engine/sky'
import { resolveRepositoryQueryLimitingMagnitude } from '../src/features/sky-engine/sceneQueryState'
import { computeSunState } from '../src/features/sky-engine/solar'
import {
  computeEffectiveLimitingMagnitude,
  evaluateStellariumSkyBrightnessBaseline,
  resolveTonemapperLwmaxFromLuminance,
} from '../src/features/sky-engine/skyBrightness'

const DEGREES_TO_RADIANS = Math.PI / 180
const STELLARIUM_QUERY_TONEMAPPER_EXPOSURE = 2
const PUBLIC_ROOT = join(process.cwd(), 'public')
const ORIGINAL_FETCH = globalThis.fetch

const OBSERVER = {
  latitude: 41.321903,
  longitude: -79.585394,
  elevationFt: 1420,
}

const TIMESTAMP_UTC = '2026-04-13T09:00:00.000Z'

const VEGA_EQUATORIAL = {
  raDeg: 279.23473479,
  decDeg: 38.78368896,
}

function toAssetPath(assetPath) {
  return join(PUBLIC_ROOT, assetPath.replace(/^\//, ''))
}

function buildResponse(fileBuffer, assetPath) {
  const extension = extname(assetPath).toLowerCase()
  let contentType = 'text/plain'

  if (extension === '.json') {
    contentType = 'application/json'
  } else if (extension === '.eph') {
    contentType = 'application/octet-stream'
  }

  return new Response(fileBuffer, {
    status: 200,
    headers: {
      'content-type': contentType,
    },
  })
}

async function installFilesystemFetch() {
  globalThis.fetch = async (input) => {
    let assetPath

    if (typeof input === 'string') {
      assetPath = input
    } else if (input instanceof URL) {
      assetPath = input.pathname
    } else {
      assetPath = input.url
    }

    const resolvedPath = assetPath.startsWith('http://') || assetPath.startsWith('https://')
      ? new URL(assetPath).pathname
      : assetPath

    try {
      const fileBuffer = await readFile(toAssetPath(resolvedPath))
      return buildResponse(fileBuffer, resolvedPath)
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      throw error
    }
  }
}

function resolveQueryLimitingMagnitude(fovDegrees) {
  const observer = {
    latitude: OBSERVER.latitude,
    longitude: OBSERVER.longitude,
    elevationFt: OBSERVER.elevationFt,
  }
  const sunState = computeSunState(observer, TIMESTAMP_UTC)
  const moonObject = computeMoonSceneObject(observer, TIMESTAMP_UTC)
  const baseline = evaluateStellariumSkyBrightnessBaseline({
    timestampIso: TIMESTAMP_UTC,
    latitudeDeg: observer.latitude,
    observerElevationM: observer.elevationFt * 0.3048,
    sunAltitudeRad: sunState.altitudeDeg * DEGREES_TO_RADIANS,
    moonAltitudeRad: moonObject.altitudeDeg * DEGREES_TO_RADIANS,
    moonMagnitude: moonObject.magnitude,
  })

  return resolveRepositoryQueryLimitingMagnitude('hipparcos', computeEffectiveLimitingMagnitude({
    fovDegrees,
    skyBrightness: baseline.skyBrightness,
    tonemapperExposure: STELLARIUM_QUERY_TONEMAPPER_EXPOSURE,
    tonemapperLwmax: resolveTonemapperLwmaxFromLuminance(baseline.zenithSkyLuminance),
    viewportMinSizePx: 1085,
  }))
}

async function collectCountsForVegaCenter() {
  const repository = createFileBackedSkyTileRepository('/sky-engine-assets/catalog/hipparcos/manifest.json')
  const vegaHorizontal = raDecToHorizontalCoordinates(VEGA_EQUATORIAL.raDeg, VEGA_EQUATORIAL.decDeg, {
    timestampUtc: TIMESTAMP_UTC,
    latitudeDeg: OBSERVER.latitude,
    longitudeDeg: OBSERVER.longitude,
    elevationM: OBSERVER.elevationFt * 0.3048,
    fovDeg: 60,
    centerAltDeg: 0,
    centerAzDeg: 0,
    projection: 'stereographic',
  })
  const fovs = [120, 60, 20, 5]
  const rows = []

  for (const fovDeg of fovs) {
    const query = buildSkyEngineQuery({
      timestampUtc: TIMESTAMP_UTC,
      latitudeDeg: OBSERVER.latitude,
      longitudeDeg: OBSERVER.longitude,
      elevationM: OBSERVER.elevationFt * 0.3048,
      fovDeg,
      centerAltDeg: vegaHorizontal.altitudeDeg,
      centerAzDeg: vegaHorizontal.azimuthDeg,
      projection: 'stereographic',
    }, {
      limitingMagnitude: resolveQueryLimitingMagnitude(fovDeg),
    })

    const loadResult = await repository.loadTiles(query)
    const scenePacket = assembleSkyScenePacket(query, loadResult.tiles, loadResult)

    rows.push({
      fovDeg,
      limitingMagnitude: Number(query.limitingMagnitude.toFixed(3)),
      visibleTileCount: query.visibleTileIds.length,
      repositoryTileCount: loadResult.tiles.length,
      tileStarCount: loadResult.tiles.reduce((total, tile) => total + tile.stars.length, 0),
      sceneAssemblerStarCount: scenePacket.stars.length,
    })
  }

  return rows
}

beforeAll(async () => {
  await installFilesystemFetch()
})

afterAll(() => {
  globalThis.fetch = ORIGINAL_FETCH
})

describe('close-FOV star counts', () => {
  it('keeps real Hipparcos packets populated from 120 through 5 degrees', async () => {
    const rows = await collectCountsForVegaCenter()

    console.table(rows)

    expect(rows).toHaveLength(4)
    expect(rows.map((row) => row.fovDeg)).toEqual([120, 60, 20, 5])
    expect(rows.every((row) => row.visibleTileCount > 0)).toBe(true)
    expect(rows.every((row) => row.repositoryTileCount > 0)).toBe(true)
    expect(rows.every((row) => row.tileStarCount > 0)).toBe(true)
    expect(rows.every((row) => row.sceneAssemblerStarCount > 0)).toBe(true)
  }, 120000)
})