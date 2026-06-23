import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { createOrasCatalogPackManager } from '../../vendor/stellarium-web-engine/apps/web-frontend/src/assets/oras_catalog_packs.js'


const appVuePath = path.resolve(
  process.cwd(),
  '../vendor/stellarium-web-engine/apps/web-frontend/src/App.vue'
)
const statusDialogPath = path.resolve(
  process.cwd(),
  '../vendor/stellarium-web-engine/apps/web-frontend/src/components/oras-catalog-status-dialog.vue'
)

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

function managerForFixture (fixture) {
  const fetchImpl = async (url) => {
    if (url.endsWith('/manifest.json')) return response(JSON.stringify(fixture.manifest))
    if (url.endsWith('/packs/stars-core/chunk-00000.jsonl')) return response(fixture.chunkText)
    return response('', false)
  }
  return createOrasCatalogPackManager({
    root: '/oras-sky-engine/skydata/catalog-packs',
    fetchImpl,
    digestImpl: async (text) => crypto.createHash('sha256').update(text).digest('hex')
  })
}

describe('ORAS catalog pack runtime', () => {
  it('loads and validates mounted pack records for direct runtime search', async () => {
    const manager = managerForFixture(releaseFixture())

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
  })

  it('fails a bad pack independently without throwing from runtime startup', async () => {
    const manager = managerForFixture(releaseFixture({ badChecksum: true }))

    const snapshot = await manager.load()

    expect(snapshot.mounted).toBe(true)
    expect(snapshot.objectCount).toBe(0)
    expect(snapshot.packs[0].status).toBe('failed')
    expect(snapshot.packs[0].error).toContain('checksum')
    expect(manager.search('Gaia DR3')).toEqual([])
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
})
