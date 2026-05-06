import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  ORAS_BUNDLED_DSS_SURVEY_ROOT,
  ORAS_CATALOG_STATUS_API,
  ORAS_DATA_ROOT,
  ORAS_OBJECT_API_ROOT,
  ORAS_RUNTIME_MODE,
  ORAS_SEARCH_API,
  buildOrasSearchUrl,
  normalizeOrasSearchQuery,
  resolveOrasDssSurveyUrl,
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

const appVuePath = path.resolve(
  process.cwd(),
  '../vendor/stellarium-web-engine/apps/web-frontend/src/App.vue'
)

describe('oras runtime search routing', () => {
  it('uses only local ORAS runtime and backend paths in config', () => {
    expect(ORAS_DATA_ROOT).toBe('/oras-sky-engine/skydata')
    expect(ORAS_BUNDLED_DSS_SURVEY_ROOT).toBe('/oras-sky-engine/skydata/surveys/dss/v1')
    expect(ORAS_SEARCH_API).toBe('/api/sky/search')
    expect(ORAS_OBJECT_API_ROOT).toBe('/api/sky/object')
    expect(ORAS_CATALOG_STATUS_API).toBe('/api/sky/catalog/status')
    expect(ORAS_RUNTIME_MODE).toBe('oras-local')
  })

  it('prefers a bundled ORAS DSS survey before any remote fallback', async () => {
    const fetchCalls = []
    const surveyUrl = await resolveOrasDssSurveyUrl({
      remoteSurveyDataBase: 'https://remote.example',
      fetchImpl: async (url, init) => {
        fetchCalls.push({ url, init })
        return { ok: true }
      }
    })

    expect(fetchCalls).toEqual([
      {
        url: '/oras-sky-engine/skydata/surveys/dss/v1/properties',
        init: { method: 'HEAD' }
      }
    ])
    expect(surveyUrl).toBe('/oras-sky-engine/skydata/surveys/dss/v1')
  })

  it('falls back to the configured remote DSS survey when no bundled survey exists', async () => {
    const surveyUrl = await resolveOrasDssSurveyUrl({
      remoteSurveyDataBase: 'https://remote.example',
      fetchImpl: async () => ({ ok: false })
    })

    expect(surveyUrl).toBe('https://remote.example/surveys/dss/v1')
  })

  it('keeps the vendored runtime DSS registration behind the ORAS resolver', () => {
    const source = fs.readFileSync(appVuePath, 'utf8')

    expect(source).toContain("import { resolveOrasDssSurveyUrl } from '@/assets/oras_data_config.js'")
    expect(source).toContain('resolveOrasDssSurveyUrl({ remoteSurveyDataBase }).then(dssSurveyUrl => {')
    expect(source).toContain('core.dss.addDataSource({ url: dssSurveyUrl })')
    expect(source).not.toContain("core.dss.addDataSource({ url: remoteSurveyDataBase + '/surveys/dss/v1' })")
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

    const indexedSkySource = toOrasSkySource({
      catalog: 'Gaia DR2',
      source_id: '2252802052894084352',
      display_name: 'Gaia DR2 2252802052894084352',
      indexed: true,
      status: 'indexed',
      provenance: { source_key: 'gaia-dr2-proof-2252802052894084352' },
    })

    expect(indexedSkySource).toMatchObject({
      names: ['Gaia DR2 2252802052894084352', 'GAIA 2252802052894084352'],
      indexed: true,
      status: 'indexed',
    })
    expect(indexedSkySource.model_data).toMatchObject({
      oras_status: 'indexed',
      oras_indexed: true,
      provenance: { source_key: 'gaia-dr2-proof-2252802052894084352' },
    })
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