import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  ORAS_CATALOG_STATUS_API,
  ORAS_DATA_ROOT,
  ORAS_OBJECT_API_ROOT,
  ORAS_RUNTIME_MODE,
  ORAS_SEARCH_API,
  buildOrasSearchUrl,
  normalizeOrasSearchQuery,
  toOrasSkySource,
} from '../../vendor/stellarium-web-engine/apps/web-frontend/src/assets/oras_data_config.js'

const swHelpersPath = path.resolve(
  process.cwd(),
  '../vendor/stellarium-web-engine/apps/web-frontend/src/assets/sw_helpers.js'
)

const skySourceSearchPath = path.resolve(
  process.cwd(),
  '../vendor/stellarium-web-engine/apps/web-frontend/src/components/skysource-search.vue'
)

describe('oras runtime search routing', () => {
  it('uses only local ORAS runtime and backend paths in config', () => {
    expect(ORAS_DATA_ROOT).toBe('/oras-sky-engine/skydata')
    expect(ORAS_SEARCH_API).toBe('/api/sky/search')
    expect(ORAS_OBJECT_API_ROOT).toBe('/api/sky/object')
    expect(ORAS_CATALOG_STATUS_API).toBe('/api/sky/catalog/status')
    expect(ORAS_RUNTIME_MODE).toBe('oras-local')
  })

  it('normalizes Gaia aliases and builds same-origin ORAS search urls', () => {
    expect(normalizeOrasSearchQuery('  GAIA 2252802052894084352  ')).toBe('Gaia DR2 2252802052894084352')
    expect(buildOrasSearchUrl('Gaia DR2 2252802052894084352')).toBe('/api/sky/search?q=Gaia+DR2+2252802052894084352')
  })

  it('maps backend Gaia payloads into runtime sky-source objects', () => {
    const skySource = toOrasSkySource({
      catalog: 'Gaia DR2',
      source_id: '2252802052894084352',
      display_name: 'Gaia DR2 2252802052894084352',
      ra: 79.17232794,
      dec: 45.99799147,
      phot_g_mean_mag: 0.08,
      indexed: false,
      status: 'not_indexed',
      message: 'Gaia DR2 source is not present in the local ORAS catalog yet.',
      provenance: { source_key: null },
    })

    expect(skySource).toMatchObject({
      match: 'Gaia DR2 2252802052894084352',
      names: ['Gaia DR2 2252802052894084352', 'GAIA 2252802052894084352'],
      types: ['*'],
      model: 'star',
      status: 'not_indexed',
      indexed: false,
      phot_g_mean_mag: 0.08,
    })
    expect(skySource.model_data).toMatchObject({
      source_id: '2252802052894084352',
      phot_g_mean_mag: 0.08,
      oras_catalog: 'Gaia DR2',
      oras_status: 'not_indexed',
      oras_indexed: false,
    })

    const roundedNumericSkySource = toOrasSkySource({
      catalog: 'Gaia DR2',
      source_id: Number('2252802052894084352'),
      display_name: 'Gaia DR2 2252802052894084352',
      indexed: false,
      status: 'not_indexed',
    })

    expect(roundedNumericSkySource.names[1]).toBe('GAIA 2252802052894084352')
  })

  it('routes vendored runtime search through ORAS backend first and keeps local-only fallback', () => {
    const source = fs.readFileSync(swHelpersPath, 'utf8')

    expect(source).toContain('fetchOrasSkySearch: function (query)')
    expect(source).toContain('return fetch(searchUrl, {')
    expect(source).toContain('return this.localQueryResults(normalized, limit)')
    expect(source).not.toContain('api.noctuasky.com')
    expect(source).not.toContain('nominatim')
    expect(source).not.toContain('wikipedia.org')
  })

  it('preserves raw query text for backend-compatible Gaia searches', () => {
    const source = fs.readFileSync(skySourceSearchPath, 'utf8')

    expect(source).toContain('const rawQuery = that.searchText.trim()')
    expect(source).toContain('swh.querySkySources(rawQuery, 10)')
    expect(source).not.toContain("str = str.toUpperCase()")
    expect(source).not.toContain("str = str.replace(/\\s+/g, '')")
  })
})