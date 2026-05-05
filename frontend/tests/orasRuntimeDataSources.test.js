import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const appVuePath = path.resolve(
  process.cwd(),
  '../vendor/stellarium-web-engine/apps/web-frontend/src/App.vue'
)

describe('oras runtime data sources', () => {
  it('uses bundled same-origin skydata for local catalogs', () => {
    const source = fs.readFileSync(appVuePath, 'utf8')

    expect(source).toContain("const bundledDataBase = process.env.BASE_URL + 'skydata'")
    expect(source).toContain("core.stars.addDataSource({ url: bundledDataBase + '/stars' })")
    expect(source).toContain("core.dsos.addDataSource({ url: bundledDataBase + '/dso' })")
    expect(source).toContain("core.minor_planets.addDataSource({ url: bundledDataBase + '/mpcorb.dat', key: 'mpc_asteroids' })")
    expect(source).toContain("core.comets.addDataSource({ url: bundledDataBase + '/CometEls.txt', key: 'mpc_comets' })")
    expect(source).toContain("core.satellites.addDataSource({ url: bundledDataBase + '/tle_satellite.jsonl.gz', key: 'jsonl/sat' })")
  })

  it('does not hard-code remote star and DSO pack URLs by default', () => {
    const source = fs.readFileSync(appVuePath, 'utf8')

    expect(source).not.toContain("remoteDataBase + '/swe-data-packs")
    expect(source).not.toContain("remoteDataBase + '/mpc/v1/mpcorb.dat'")
    expect(source).not.toContain("remoteDataBase + '/mpc/v1/CometEls.txt'")
    expect(source).toContain('const remoteSurveyDataBase = process.env.VUE_APP_ORAS_RUNTIME_REMOTE_DATA_BASE')
  })
})