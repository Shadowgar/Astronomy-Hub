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
  buildOrasObjectLookupUrl,
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

it('prefers a bundled ORAS DSS survey root when local properties exist', async () => {
    const fetchCalls = []
    const surveyUrl = await resolveOrasDssSurveyUrl({
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

  it('returns undefined when no local DSS survey exists', async () => {
    const surveyUrl = await resolveOrasDssSurveyUrl({
      fetchImpl: async () => ({ ok: false })
    })

    expect(surveyUrl).toBeUndefined()
  })

  it('keeps the vendored runtime DSS registration behind the ORAS resolver', () => {
    const source = fs.readFileSync(appVuePath, 'utf8')

    expect(source).toContain('ORAS_BUNDLED_GAIA_SURVEY_ROOT')
    expect(source).toContain('listOrasPackRoots')
    expect(source).toContain('resolveOrasDssSurveyUrl')
    expect(source).toContain('resolveOrasDssSurveyUrl().then(dssSurveyUrl => {')
    expect(source).toContain('core.dss.addDataSource({ url: dssSurveyUrl })')
    expect(source).not.toContain('VUE_APP_ORAS_RUNTIME_REMOTE_DATA_BASE')
  })

  it('normalizes Gaia aliases and builds same-origin ORAS search urls', () => {
    expect(normalizeOrasSearchQuery('  GAIA 2252802052894084352  ')).toBe('Gaia DR2 2252802052894084352')
    expect(buildOrasSearchUrl('Gaia DR2 2252802052894084352')).toBe('/api/sky/search?q=Gaia+DR2+2252802052894084352')
  })

  it('builds same-origin ORAS object lookup urls from stable identity fields', () => {
    expect(buildOrasObjectLookupUrl({
      catalog: 'Messier (local)',
      sourceId: 'M31',
      model: 'dso'
    })).toBe('/api/sky/object?catalog=Messier+%28local%29&source_id=M31&model=dso')

    expect(buildOrasObjectLookupUrl({
      catalog: 'Bright Star Catalog (local)',
      sourceId: 'star-betelgeuse',
      model: 'star'
    })).toBe('/api/sky/object?catalog=Bright+Star+Catalog+%28local%29&source_id=star-betelgeuse&model=star')
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

  it('maps local Messier and bright-star payloads without Gaia aliases', () => {
    const messierSkySource = toOrasSkySource({
      catalog: 'Messier (local)',
      source_id: 'M31',
      display_name: 'M31 Andromeda Galaxy',
      ra: 10.68,
      dec: 41.269,
      indexed: true,
      status: 'indexed',
      provenance: { source_key: 'messier_local_seed' }
    })

    expect(messierSkySource).toMatchObject({
      names: ['M31 Andromeda Galaxy', 'M31', 'M 31'],
      types: ['dso'],
      model: 'dso',
      status: 'indexed'
    })
    expect(messierSkySource.names.join(' ')).not.toContain('GAIA')

    const brightStarSkySource = toOrasSkySource({
      catalog: 'Bright Stars (local)',
      source_id: 'star-capella',
      display_name: 'Capella',
      ra: 79.172,
      dec: 45.998,
      indexed: true,
      status: 'indexed'
    })

    expect(brightStarSkySource).toMatchObject({
      names: ['Capella', 'NAME Capella'],
      types: ['*'],
      model: 'star',
      status: 'indexed'
    })
    expect(brightStarSkySource.names.join(' ')).not.toContain('GAIA')
  })

  it('routes vendored runtime search through ORAS backend first and keeps local-only fallback', () => {
    const source = fs.readFileSync(swHelpersPath, 'utf8')

    expect(source).toContain('fetchOrasSkySearch: function (query)')
    expect(source).toContain('fetchOrasSkySourceByIdentity: function ({ catalog, sourceId, model })')
    expect(source).toContain('return fetch(searchUrl, {')
    expect(source).toContain('return this.localQueryResults(normalized, limit)')
    expect(source).not.toContain('api.noctuasky.com')
    expect(source).not.toContain('nominatim')
    expect(source).not.toContain('wikipedia.org')
  })

  it('uses stable identity fields in generated share links and route startup selection', () => {
    const helpersSource = fs.readFileSync(swHelpersPath, 'utf8')
    const appSource = fs.readFileSync(appVuePath, 'utf8')

    expect(helpersSource).toContain("link += '&catalog=' +")
    expect(helpersSource).toContain("link += '&source_id=' +")
    expect(helpersSource).toContain("link += '&model=' +")
    expect(helpersSource).toContain("link += '&ra=' +")
    expect(helpersSource).toContain("link += '&dec=' +")

    expect(appSource).toContain('const routeIdentity = this.skySourceRouteIdentity()')
    expect(appSource).toContain('return this.selectSkySourceRouteTargetByIdentity(routeIdentity)')
  })

  it('preserves raw query text for backend-compatible Gaia searches', () => {
    const source = fs.readFileSync(skySourceSearchPath, 'utf8')

    expect(source).toContain('const rawQuery = that.searchText.trim()')
    expect(source).toContain('swh.querySkySources(rawQuery, 10)')
    expect(source).not.toContain("str = str.toUpperCase()")
    expect(source).not.toContain("str = str.replace(/\\s+/g, '')")
  })
})
