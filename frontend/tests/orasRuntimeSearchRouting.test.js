import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  ORAS_BUNDLED_DSS_SURVEY_ROOT,
  ORAS_CATALOG_STATUS_API,
  ORAS_DATA_ROOT,
  ORAS_DEFAULT_DSS_SURVEY_KEY,
  ORAS_OBJECT_API_ROOT,
  ORAS_RUNTIME_MODE,
  ORAS_SEARCH_API,
  getOrasDssSurveyProvider,
  listOrasDssSurveyProviders,
  buildOrasObjectLookupUrl,
  buildOrasSearchUrl,
  normalizeOrasSearchQuery,
  resolveOrasDssSurveyUrl,
  toOrasSkySource,
  withOrasRouteIdentityFallback,
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

  it('uses ORAS HD auto by default but falls back to bundled DSS when no HD provider is full-coverage safe', async () => {
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
    expect(ORAS_DEFAULT_DSS_SURVEY_KEY).toBe('oras-hd-auto')
    expect(surveyUrl).toBe('/oras-sky-engine/skydata/surveys/dss/v1')
  })

  it('keeps HD survey options hidden behind explicit query keys', () => {
    expect(listOrasDssSurveyProviders()).toEqual([
      expect.objectContaining({
        key: 'oras-hd-auto',
        isDefault: true,
        source: 'auto'
      }),
      expect.objectContaining({
        key: 'dss',
        url: '/oras-sky-engine/skydata/surveys/dss/v1',
      }),
      expect.objectContaining({
        key: 'dss-colored',
        url: '/oras-sky-engine/skydata/surveys/dss/v1',
      }),
      expect.objectContaining({
        key: 'panstarrs-dr1-color-z-zg-g',
        url: 'https://alasky.cds.unistra.fr/Pan-STARRS/DR1/color-z-zg-g'
      }),
      expect.objectContaining({
        key: 'panstarrs-dr1-color-i-r-g',
        url: 'https://alasky.cds.unistra.fr/Pan-STARRS/DR1/color-i-r-g'
      })
    ])

    expect(getOrasDssSurveyProvider('panstarrs-dr1-color-z-zg-g')).toMatchObject({
      key: 'panstarrs-dr1-color-z-zg-g',
      label: 'Pan-STARRS DR1 color z-zg-g'
    })
    expect(getOrasDssSurveyProvider()).toMatchObject({
      key: 'oras-hd-auto'
    })
    expect(getOrasDssSurveyProvider('dss-colored')).toMatchObject({
      key: 'dss-colored',
      url: '/oras-sky-engine/skydata/surveys/dss/v1'
    })
    expect(getOrasDssSurveyProvider('bad-value')).toMatchObject({
      key: 'dss',
      url: '/oras-sky-engine/skydata/surveys/dss/v1'
    })
  })

  it('resolves Pan-STARRS query-only surveys only after a properties probe', async () => {
    const fetchCalls = []
    const surveyUrl = await resolveOrasDssSurveyUrl('panstarrs-dr1-color-i-r-g', {
      fetchImpl: async (url, init) => {
        fetchCalls.push({ url, init })
        return { ok: true }
      }
    })

    expect(fetchCalls).toEqual([
      {
        url: 'https://alasky.cds.unistra.fr/Pan-STARRS/DR1/color-i-r-g/properties',
        init: { method: 'GET' }
      }
    ])
    expect(surveyUrl).toBe('https://alasky.cds.unistra.fr/Pan-STARRS/DR1/color-i-r-g')
  })

  it('resolves explicit DSS colored alias through the bundled DSS properties probe', async () => {
    const fetchCalls = []
    const surveyUrl = await resolveOrasDssSurveyUrl('dss-colored', {
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

  it('resolves explicit bundled DSS aliases through a configured local survey root', async () => {
    const fetchCalls = []
    const surveyUrl = await resolveOrasDssSurveyUrl('dss-colored', {
      localSurveyRoot: '/custom/oras-dss',
      fetchImpl: async (url, init) => {
        fetchCalls.push({ url, init })
        return { ok: true }
      }
    })

    expect(fetchCalls).toEqual([
      {
        url: '/custom/oras-dss/properties',
        init: { method: 'HEAD' }
      }
    ])
    expect(surveyUrl).toBe('/custom/oras-dss')
  })

  it('falls back to bundled DSS when a query-only survey probe fails', async () => {
    const fetchCalls = []
    const surveyUrl = await resolveOrasDssSurveyUrl('panstarrs-dr1-color-i-r-g', {
      fetchImpl: async (url, init) => {
        fetchCalls.push({ url, init })
        return { ok: !url.includes('Pan-STARRS') }
      }
    })

    expect(fetchCalls).toEqual([
      {
        url: 'https://alasky.cds.unistra.fr/Pan-STARRS/DR1/color-i-r-g/properties',
        init: { method: 'GET' }
      },
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
    expect(source).toContain('resolveOrasDssSurveyUrl(that.$route.query.hips).then(dssSurveyUrl => {')
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

    expect(buildOrasObjectLookupUrl({
      catalog: 'Solar System (JPL)',
      sourceId: 'mars',
      model: 'planet',
      time: '2026-06-04T02:16:04Z',
      lat: 41.44,
      lng: -79.69,
      elev: 0
    })).toBe('/api/sky/object?catalog=Solar+System+%28JPL%29&source_id=mars&model=planet&time=2026-06-04T02%3A16%3A04Z&lat=41.44&lng=-79.69&elev=0')
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
    expect(roundedNumericSkySource.source_id).toBe('2252802052894084352')
    expect(roundedNumericSkySource.model_data.source_id).toBe('2252802052894084352')

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

  it('uses route ra/dec to materialize controlled not-indexed Gaia identity links', () => {
    const skySource = toOrasSkySource({
      catalog: 'Gaia DR2',
      source_id: '999999999999999999',
      display_name: 'Gaia DR2 999999999999999999',
      indexed: false,
      status: 'not_indexed',
      message: 'Gaia DR2 source is not present in the local ORAS catalog yet.',
    })

    const exactSkySource = withOrasRouteIdentityFallback(skySource, {
      catalog: 'Gaia DR2',
      sourceId: '999999999999999999',
      model: 'star',
      ra: 123.45,
      dec: -54.321,
    })

    expect(exactSkySource).toMatchObject({
      catalog: 'Gaia DR2',
      source_id: '999999999999999999',
      indexed: false,
      status: 'not_indexed',
      ra: 123.45,
      dec: -54.321,
    })
    expect(exactSkySource.model_data).toMatchObject({
      source_id: '999999999999999999',
      oras_status: 'not_indexed',
      oras_indexed: false,
      ra: 123.45,
      de: -54.321,
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
      types: ['G'],
      model: 'dso',
      status: 'indexed'
    })
    expect(messierSkySource.model_data).toMatchObject({
      ra: 10.68,
      de: 41.269,
      source_id: 'M31',
      oras_catalog: 'Messier (local)'
    })
    expect(messierSkySource.names.join(' ')).not.toContain('GAIA')

    const brightStarSkySource = toOrasSkySource({
      catalog: 'Bright Stars (local)',
      source_id: 'star-capella',
      display_name: 'Capella',
      names: ['HD 34029', 'Capella'],
      ra: 79.172,
      dec: 45.998,
      phot_g_mean_mag: 0.08,
      indexed: true,
      status: 'indexed'
    })

    expect(brightStarSkySource).toMatchObject({
      names: ['Capella', 'HD 34029'],
      types: ['*'],
      model: 'star',
      status: 'indexed'
    })
    expect(brightStarSkySource.names[0]).toBe('Capella')
    expect(brightStarSkySource.names).toContain('HD 34029')
    expect(brightStarSkySource.names.join(' ')).not.toContain('GAIA')
    expect(brightStarSkySource.model_data).toMatchObject({
      ra: 79.172,
      de: 45.998,
      Vmag: 0.08
    })
  })

  it('maps fallback-created DSO payloads into Stellarium-compatible model data', () => {
    const openNgcSkySource = toOrasSkySource({
      catalog: 'NGC (OpenNGC)',
      source_id: 'NGC7000',
      display_name: 'NGC 7000 North America Nebula',
      names: ['NGC 7000', 'NGC7000', 'North America Nebula'],
      types: ['BNe'],
      model: 'dso',
      ra: 314.8214166667,
      dec: 44.5287777778,
      phot_g_mean_mag: 4.0,
      angular_size: {
        major_arcmin: 120.0,
        minor_arcmin: 30.0,
        position_angle_deg: 15.0
      },
      indexed: true,
      status: 'indexed',
      provenance: { source_key: 'openngc_local' }
    })

    expect(openNgcSkySource).toMatchObject({
      names: ['NGC 7000 North America Nebula', 'NGC 7000', 'NGC7000', 'North America Nebula'],
      types: ['BNe'],
      model: 'dso',
      ra: 314.8214166667,
      dec: 44.5287777778
    })
    expect(openNgcSkySource.model_data).toMatchObject({
      source_id: 'NGC7000',
      ra: 314.8214166667,
      de: 44.5287777778,
      Vmag: 4.0,
      dimx: 120.0,
      dimy: 30.0,
      angle: 15.0,
      oras_catalog: 'NGC (OpenNGC)',
      oras_status: 'indexed',
      provenance: { source_key: 'openngc_local' }
    })
  })

  it('uses route ra/dec to materialize DSO identity links without backend coordinates', () => {
    const skySource = toOrasSkySource({
      catalog: 'NGC (OpenNGC)',
      source_id: 'NGC9999',
      display_name: 'NGC 9999',
      model: 'dso',
      types: ['G'],
      indexed: false,
      status: 'not_indexed'
    })

    const exactSkySource = withOrasRouteIdentityFallback(skySource, {
      catalog: 'NGC (OpenNGC)',
      sourceId: 'NGC9999',
      model: 'dso',
      ra: 210.25,
      dec: -12.5,
    })

    expect(exactSkySource).toMatchObject({
      catalog: 'NGC (OpenNGC)',
      source_id: 'NGC9999',
      model: 'dso',
      ra: 210.25,
      dec: -12.5,
    })
    expect(exactSkySource.model_data).toMatchObject({
      source_id: 'NGC9999',
      ra: 210.25,
      de: -12.5,
      oras_status: 'not_indexed',
      oras_indexed: false,
    })
  })

  it('preserves satellite TLE model data for exact Sky Engine identity links', () => {
    const skySource = toOrasSkySource({
      catalog: 'Satellite TLE (local)',
      source_id: '25544',
      display_name: 'International Space Station',
      names: ['NAME International Space Station', 'NAME ISS', 'NORAD 25544'],
      types: ['Asa'],
      model: 'tle_satellite',
      norad_id: '25544',
      model_data: {
        norad_number: 25544,
        tle: [
          '1 25544U 98067A   26154.70949191  .00008646  00000-0  16154-3 0  9992',
          '2 25544  51.6330   6.8180 0007089 128.9940 231.1681 15.49585865569660',
        ],
        mag: -1.3,
        status: 'Operational',
        group: ['Station'],
      },
      indexed: true,
      status: 'indexed',
      link_status: 'exact_link_ready',
    })

    expect(skySource).toMatchObject({
      match: 'International Space Station',
      names: ['International Space Station', 'NAME International Space Station', 'NAME ISS', 'NORAD 25544'],
      types: ['Asa'],
      model: 'tle_satellite',
      catalog: 'Satellite TLE (local)',
      source_id: '25544',
      indexed: true,
      status: 'indexed',
    })
    expect(skySource.model_data).toMatchObject({
      source_id: '25544',
      norad_number: 25544,
      tle: [
        '1 25544U 98067A   26154.70949191  .00008646  00000-0  16154-3 0  9992',
        '2 25544  51.6330   6.8180 0007089 128.9940 231.1681 15.49585865569660',
      ],
      group: ['Station'],
      oras_catalog: 'Satellite TLE (local)',
      oras_status: 'indexed',
      oras_indexed: true,
    })
  })

  it('routes vendored runtime search through ORAS backend first and keeps local-only fallback', () => {
    const source = fs.readFileSync(swHelpersPath, 'utf8')

    expect(source).toContain('fetchOrasSkySearch: function (query)')
    expect(source).toContain('fetchOrasSkySourceByIdentity: function ({ catalog, sourceId, model, time, lat, lng, elev })')
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
    expect(appSource).toContain('withOrasRouteIdentityFallback(ss, identity)')
  })

  it('preserves exact ORAS identity after route selection updates the panel', () => {
    const helpersSource = fs.readFileSync(swHelpersPath, 'utf8')
    const appSource = fs.readFileSync(appVuePath, 'utf8')

    expect(appSource).toContain('obj.__orasSkySourceData = ss')
    expect(appSource).toContain('swh.setSweObjAsSelection(obj, ss)')
    expect(appSource).toContain('const fallbackObj = this.$stel.createObj(ss.model, ss)')
    expect(helpersSource).toContain('Object.assign({}, obj.__orasSkySourceData || obj.jsonData || {})')
    expect(helpersSource).toContain('const exactSelection = this.exactSkySourceSelection')
    expect(helpersSource).toContain('currentSelection.v === obj.v')
    expect(helpersSource).toContain('return Promise.resolve(exactSelection)')
    expect(helpersSource).toContain('setSweObjAsSelection: function (obj, exactSkySource)')
    expect(helpersSource).toContain('this.exactSkySourceSelection = exactSkySource || undefined')
    expect(helpersSource).toContain('if (obj.__orasSkySourceData && obj.__orasSkySourceData.catalog && obj.__orasSkySourceData.source_id && obj.__orasSkySourceData.model)')
    expect(helpersSource).toContain('return Promise.resolve(buildLocalSkySource(obj.__orasSkySourceData.match || obj.__orasSkySourceData.display_name || names[0]))')
  })

  it('preserves raw query text for backend-compatible Gaia searches', () => {
    const source = fs.readFileSync(skySourceSearchPath, 'utf8')

    expect(source).toContain('const rawQuery = that.searchText.trim()')
    expect(source).toContain('swh.querySkySources(rawQuery, 10)')
    expect(source).not.toContain("str = str.toUpperCase()")
    expect(source).not.toContain("str = str.replace(/\\s+/g, '')")
  })
})
