import fs from 'node:fs'
import zlib from 'node:zlib'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const appVuePath = path.resolve(
  process.cwd(),
  '../vendor/stellarium-web-engine/apps/web-frontend/src/App.vue'
)
const buildScriptPath = path.resolve(
  process.cwd(),
  '../scripts/build-stellarium-safe.sh'
)
const syncScriptPath = path.resolve(
  process.cwd(),
  '../scripts/sync-stellarium-runtime.sh'
)
const runtimeVueConfigPath = path.resolve(
  process.cwd(),
  '../vendor/stellarium-web-engine/apps/web-frontend/vue.config.js'
)
const satelliteFeedPath = path.resolve(
  process.cwd(),
  'public/oras-sky-engine/skydata/tle_satellite.jsonl.gz'
)

describe('oras runtime data sources', () => {
  it('uses bundled same-origin skydata for local catalogs', () => {
    const source = fs.readFileSync(appVuePath, 'utf8')

    expect(source).toContain("const bundledDataBase = process.env.BASE_URL + 'skydata'")
    expect(source).not.toContain("core.stars.addDataSource({ url: bundledDataBase + '/stars' })")
    expect(source).not.toContain("core.dsos.addDataSource({ url: bundledDataBase + '/dso' })")
    expect(source).toContain("core.dsos.addDataSource({ url: bundledDataBase + '/packs/base/dso' })")
    expect(source).toContain("core.dsos.addDataSource({ url: bundledDataBase + '/packs/extended/dso' })")
    expect(source).toContain("core.stars.addDataSource({ url: ORAS_BUNDLED_GAIA_SURVEY_ROOT, key: 'gaia' })")
    expect(source).toContain("core.minor_planets.addDataSource({ url: bundledDataBase + '/mpcorb.dat', key: 'mpc_asteroids' })")
    expect(source).toContain("core.comets.addDataSource({ url: bundledDataBase + '/CometEls.txt', key: 'mpc_comets' })")
    expect(source).toContain("core.satellites.addDataSource({ url: bundledDataBase + '/tle_satellite.jsonl.gz', key: 'jsonl/sat' })")
  })

  it('does not hard-code remote star and DSO pack URLs by default', () => {
    const source = fs.readFileSync(appVuePath, 'utf8')

    expect(source).not.toContain("remoteDataBase + '/swe-data-packs")
    expect(source).not.toContain("remoteDataBase + '/mpc/v1/mpcorb.dat'")
    expect(source).not.toContain("remoteDataBase + '/mpc/v1/CometEls.txt'")
    expect(source).toContain("listOrasPackRoots().forEach((packRoot) => {")
    expect(source).not.toContain('VUE_APP_ORAS_RUNTIME_REMOTE_DATA_BASE')
  })

  it('retries local skysource route selection after star pack registration', () => {
    const source = fs.readFileSync(appVuePath, 'utf8')

    expect(source).toContain('selectSkySourceRouteTarget: function (name, attempt = 0)')
    expect(source).toContain('swh.lookupSkySourceLocallyByName(name)')
    expect(source).toContain('this.selectSkySourceRouteTarget(name, attempt + 1)')
  })

  it('keeps the satellite feed double-gzipped for browser-decoded SWE loading', () => {
    const compressed = fs.readFileSync(satelliteFeedPath)
    const browserDecodedPayload = zlib.gunzipSync(compressed)
    expect([...browserDecodedPayload.subarray(0, 2)]).toEqual([0x1f, 0x8b])

    const jsonlPayload = zlib.gunzipSync(browserDecodedPayload).toString('utf8')
    const firstRecord = JSON.parse(jsonlPayload.trim().split('\n')[0])
    expect(firstRecord).toHaveProperty('model', 'tle_satellite')
    expect(firstRecord).toHaveProperty('model_data')
  })

  it('builds through source-controlled runtime scripts with a build marker and configurable swap', () => {
    const buildScript = fs.readFileSync(buildScriptPath, 'utf8')
    const syncScript = fs.readFileSync(syncScriptPath, 'utf8')

    expect(buildScript).toContain('STELLARIUM_BUILD_MEMORY_SWAP_MB')
    expect(buildScript).not.toContain('--memory-swap "${memory_mb}m"')
    expect(buildScript).toContain('oras-runtime-build.json')
    expect(buildScript).toContain('STELLARIUM_BUILD_ALLOW_HOST_FALLBACK')
    expect(buildScript).toContain('ORAS_RUNTIME_COPY_SKYDATA=0')
    expect(buildScript).not.toContain('staging_skydata_dir')
    expect(buildScript).not.toContain('rsync -a --delete "$skydata_dir/"')
    expect(syncScript).toContain('oras-runtime-build.json')
  })

  it('keeps the vendored Vue production build within local memory limits', () => {
    const vueConfig = fs.readFileSync(runtimeVueConfigPath, 'utf8')

    expect(vueConfig).toContain("process.env.ORAS_RUNTIME_COPY_SKYDATA === '1'")
    expect(vueConfig).toContain('if (shouldCopySkydata)')
    expect(vueConfig).toContain('productionSourceMap: false')
    expect(vueConfig).toContain('config.optimization.minimize(false)')
  })
})
