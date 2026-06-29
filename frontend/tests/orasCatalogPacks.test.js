import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { createOrasCatalogPackManager } from '../../vendor/stellarium-web-engine/apps/web-frontend/src/assets/oras_catalog_packs.js'


const appVuePath = path.resolve(
  process.cwd(),
  '../vendor/stellarium-web-engine/apps/web-frontend/src/App.vue'
)
const runtimeModulePath = path.resolve(
  process.cwd(),
  '../vendor/stellarium-web-engine/apps/web-frontend/src/assets/oras_catalog_packs.js'
)
const statusDialogPath = path.resolve(
  process.cwd(),
  '../vendor/stellarium-web-engine/apps/web-frontend/src/components/oras-catalog-status-dialog.vue'
)
const searchComponentPath = path.resolve(
  process.cwd(),
  '../vendor/stellarium-web-engine/apps/web-frontend/src/components/skysource-search.vue'
)
const detailComponentPath = path.resolve(
  process.cwd(),
  '../vendor/stellarium-web-engine/apps/web-frontend/src/components/selected-object-info.vue'
)
const targetSearchPath = path.resolve(
  process.cwd(),
  '../vendor/stellarium-web-engine/apps/web-frontend/src/components/target-search.vue'
)
const swHelpersPath = path.resolve(
  process.cwd(),
  '../vendor/stellarium-web-engine/apps/web-frontend/src/assets/sw_helpers.js'
)
const catalogHarnessPath = path.resolve(
  process.cwd(),
  '../scripts/skydata/validate_oras_catalog_release.js'
)
const rootPackagePath = path.resolve(process.cwd(), '../package.json')

function record (overrides = {}) {
  return Object.assign({
    catalog: 'Gaia DR3',
    source_id: '5853498713190525696',
    model: 'star',
    display_name: 'Gaia DR3 5853498713190525696',
    category: 'stars',
    ra: 217.392,
    dec: -62.676,
    source_attribution: [{ name: 'ESA Gaia Archive', source_key: 'gaia_dr3', license_note: 'Gaia acknowledgement' }]
  }, overrides)
}

function response (payload, ok = true) {
  return {
    ok,
    status: ok ? 200 : 404,
    text: async () => payload
  }
}

function releaseFixture ({ badChecksum = false } = {}) {
  const chunkText = JSON.stringify(record()) + '\n'
  const sha256 = crypto.createHash('sha256').update(chunkText).digest('hex')
  const manifest = {
    schema_version: 1,
    release_version: '2026.06',
    generated_at: '2026-06-23T06:00:00Z',
    object_count: 1,
    pack_count: 1,
    packs: [{
      pack_id: 'stars-core',
      label: 'Stars Core',
      category: 'stars',
      version: '2026.06',
      generated_at: '2026-06-23T06:00:00Z',
      object_count: 1,
      browser_index_count: 1,
      overlay_limit: 10,
      sources: [{ name: 'ESA Gaia Archive', source_key: 'gaia_dr3', license_note: 'Gaia acknowledgement' }],
      chunks: [{
        path: 'packs/stars-core/chunk-00000.jsonl',
        object_count: 1,
        byte_size: Buffer.byteLength(chunkText),
        sha256: badChecksum ? 'bad' : sha256
      }]
    }]
  }
  return { manifest, chunkText }
}

function managerForFixture (fixture, options = {}) {
  const fetchImpl = async (url) => {
    if (url.endsWith('/manifest.json')) return response(JSON.stringify(fixture.manifest))
    if (url.endsWith('/packs/stars-core/chunk-00000.jsonl')) return response(fixture.chunkText)
    return response('', false)
  }
  return createOrasCatalogPackManager({
    root: '/oras-sky-engine/skydata/catalog-packs',
    fetchImpl,
    digestImpl: async (text) => crypto.createHash('sha256').update(text).digest('hex'),
    ...options
  })
}

describe('ORAS catalog pack runtime', () => {
  it('loads mounted release manifest without forcing all pack records into browser memory', async () => {
    expect(fs.readFileSync(runtimeModulePath, 'utf8')).not.toContain('globalThis')
    const manager = managerForFixture(releaseFixture())

    const snapshot = await manager.load()

    expect(snapshot.mounted).toBe(true)
    expect(snapshot.releaseVersion).toBe('2026.06')
    expect(snapshot.objectCount).toBe(1)
    expect(snapshot.packs[0]).toMatchObject({ packId: 'stars-core', status: 'loaded', loadedObjectCount: 1 })
    expect(manager.search('Gaia DR3 5853498713190525696')).toEqual([])
    expect(manager.overlayRecords()).toHaveLength(0)
  })

  it('can explicitly load and validate mounted pack records for focused fixtures', async () => {
    const manager = managerForFixture(releaseFixture(), { loadRecords: true })

    const snapshot = await manager.load()
    const results = manager.search('Gaia DR3 5853498713190525696')

    expect(snapshot.mounted).toBe(true)
    expect(snapshot.releaseVersion).toBe('2026.06')
    expect(snapshot.objectCount).toBe(1)
    expect(snapshot.packs[0]).toMatchObject({ packId: 'stars-core', status: 'loaded', loadedObjectCount: 1 })
    expect(results[0]).toMatchObject({
      catalog: 'Gaia DR3',
      source_id: '5853498713190525696',
      pack_id: 'stars-core'
    })
    expect(typeof results[0].source_id).toBe('string')
    expect(manager.overlayRecords()).toHaveLength(1)
  })

  it('fails a bad pack independently without throwing from runtime startup', async () => {
    const manager = managerForFixture(releaseFixture({ badChecksum: true }), { loadRecords: true })

    const snapshot = await manager.load()

    expect(snapshot.mounted).toBe(true)
    expect(snapshot.objectCount).toBe(0)
    expect(snapshot.packs[0].status).toBe('failed')
    expect(snapshot.packs[0].error).toContain('checksum')
    expect(manager.search('Gaia DR3')).toEqual([])
  })

  it('rejects unsafe browser chunk paths and invalid coordinates when explicitly loading records', async () => {
    const unsafe = releaseFixture()
    unsafe.manifest.packs[0].chunks[0].path = '../escape.jsonl'
    const unsafeManager = managerForFixture(unsafe, { loadRecords: true })

    const unsafeSnapshot = await unsafeManager.load()

    expect(unsafeSnapshot.packs[0].status).toBe('failed')
    expect(unsafeSnapshot.packs[0].error).toContain('unsafe chunk path')

    const invalidCoordinate = releaseFixture()
    invalidCoordinate.chunkText = JSON.stringify(record({ ra: 360 })) + '\n'
    invalidCoordinate.manifest.packs[0].chunks[0].byte_size = Buffer.byteLength(invalidCoordinate.chunkText)
    invalidCoordinate.manifest.packs[0].chunks[0].sha256 = crypto.createHash('sha256').update(invalidCoordinate.chunkText).digest('hex')
    const invalidManager = managerForFixture(invalidCoordinate, { loadRecords: true })

    const invalidSnapshot = await invalidManager.load()

    expect(invalidSnapshot.packs[0].status).toBe('failed')
    expect(invalidSnapshot.packs[0].error).toContain('coordinates are out of range')
  })

  it('reports an absent mount without failing the Sky Engine', async () => {
    const manager = createOrasCatalogPackManager({
      fetchImpl: async () => response('', false)
    })

    const snapshot = await manager.load()

    expect(snapshot).toMatchObject({ mounted: false, phase: 'not-mounted', objectCount: 0 })
    expect(snapshot.packs).toEqual([])
  })

  it('wires a visible catalog status action and dialog into the runtime', () => {
    const appSource = fs.readFileSync(appVuePath, 'utf8')
    const dialogSource = fs.readFileSync(statusDialogPath, 'utf8')

    expect(appSource).toContain("title: this.$t('ORAS Catalog Packs')")
    expect(appSource).toContain("action: 'catalogPacks'")
    expect(appSource).toContain('<oras-catalog-status-dialog')
    expect(appSource).toContain('orasCatalogPacks.load()')
    expect(dialogSource).toContain('ORAS Catalog Packs')
    expect(dialogSource).toContain('Loaded objects')
    expect(dialogSource).toContain('Data source')
    expect(dialogSource).toContain('Generated')
  })

  it('wires direct pack search, catalog badges, enhanced details, and overlay materialization', () => {
    const appSource = fs.readFileSync(appVuePath, 'utf8')
    const searchSource = fs.readFileSync(searchComponentPath, 'utf8')
    const detailSource = fs.readFileSync(detailComponentPath, 'utf8')
    const targetSource = fs.readFileSync(targetSearchPath, 'utf8')
    const helperSource = fs.readFileSync(swHelpersPath, 'utf8')

    expect(helperSource).toContain('orasCatalogPacks.search(normalized, limit)')
    expect(helperSource).toContain('mergeSkySourceResults')
    expect(searchSource).toContain('source.catalog')
    expect(searchSource).toContain('source.pack_id || source.source_attribution')
    expect(searchSource).toContain('ORAS Enhanced')
    expect(detailSource).toContain('ORAS Enhanced')
    expect(detailSource).toContain('Source attribution')
    expect(detailSource).toContain('Unavailable from mounted sources')
    expect(targetSource).toContain('obj.__orasSkySourceData = ss')
    expect(targetSource).toContain('swh.setSweObjAsSelection(obj, ss)')
    expect(appSource).toContain('materializeOrasCatalogOverlays')
    expect(appSource).toContain('orasCatalogPacks.overlayRecords()')
  })

  it('provides a catalog release browser acceptance command with representative families', () => {
    const harnessSource = fs.readFileSync(catalogHarnessPath, 'utf8')
    const packageJson = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'))

    expect(packageJson.scripts['validate:oras-catalog-release']).toBe(
      'node scripts/skydata/validate_oras_catalog_release.js'
    )
    for (const query of [
      'Caldwell 6', 'LBN350', 'Collinder 140', 'Gaia DR3', 'TYC 1-1015-1',
      'Gliese 1', 'WDS ', 'STF 1', 'PSR J0437-4715', 'IGR J17454-2919'
    ]) {
      expect(harnessSource).toContain(query)
    }
    expect(harnessSource).toContain('ORAS Catalog Packs')
    expect(harnessSource).toContain('Physical properties: Unavailable from mounted sources')
    expect(harnessSource).toContain('satelliteParsePattern')
    expect(harnessSource).toContain('satelliteCount < 1')
  })
})
