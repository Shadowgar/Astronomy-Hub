import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it, vi } from 'vitest'

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

const targetSearchPath = path.resolve(
  process.cwd(),
  '../vendor/stellarium-web-engine/apps/web-frontend/src/components/target-search.vue'
)

function extractFunction(source, signature) {
  const signatureStart = source.indexOf(signature)
  expect(signatureStart).toBeGreaterThanOrEqual(0)
  const asyncStart = source.indexOf('async function', signatureStart)
  const plainStart = source.indexOf('function', signatureStart)
  const functionStart = asyncStart >= 0 && asyncStart < plainStart ? asyncStart : plainStart
  const bodyStart = source.indexOf('{', functionStart)
  let depth = 0
  let quote = null
  let escaped = false
  for (let index = bodyStart; index < source.length; index += 1) {
    const character = source[index]
    if (quote) {
      if (escaped) {
        escaped = false
      } else if (character === '\\') {
        escaped = true
      } else if (character === quote) {
        quote = null
      }
      continue
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character
      continue
    }
    if (character === '{') depth += 1
    if (character === '}') depth -= 1
    if (depth === 0) return source.slice(functionStart, index + 1)
  }
  throw new Error(`Could not extract ${signature}`)
}

function compileExactRouteMethod(swh, warningConsole = console) {
  const source = fs.readFileSync(appVuePath, 'utf8')
  const functionSource = extractFunction(source, 'selectSkySourceRouteTargetByIdentity: function')
  return new Function(
    'swh',
    'withOrasRouteIdentityFallback',
    'console',
    `return (${functionSource})`,
  )(swh, (skySource) => skySource, warningConsole)
}

function compileCanonicalStarMethod(stel, denseStars) {
  const source = fs.readFileSync(swHelpersPath, 'utf8')
  const functionSource = extractFunction(source, 'resolveCanonicalStar: async function')
  return new Function(
    'Vue',
    'orasDenseStars',
    `return (${functionSource})`,
  )({ prototype: { $stel: stel } }, denseStars)
}

function exactStarIdentity() {
  return {
    catalog: 'Hipparcos (CDS)',
    sourceId: 'hip-42',
    model: 'star',
    ra: 120.5,
    dec: -20,
  }
}

function indexedStarSource() {
  return {
    catalog: 'Hipparcos (CDS)',
    source_id: 'hip-42',
    model: 'star',
    star_science: { render_magnitude: 1.0 },
  }
}

describe('oras runtime search routing', () => {
  it('preserves source-backed catalog-pack enrichment through SWE materialization', () => {
    const sourceId = '5853498713190525696'
    const skySource = toOrasSkySource({
      catalog: 'Gaia DR3',
      source_id: sourceId,
      model: 'star',
      display_name: `Gaia DR3 ${sourceId}`,
      names: [`Gaia DR3 ${sourceId}`],
      aliases: [`Gaia ${sourceId}`],
      common_names: ['Release star'],
      catalog_ids: [`Gaia DR3 ${sourceId}`],
      category: 'stars',
      object_type: 'star',
      types: ['*'],
      ra: 217.392,
      dec: -62.676,
      magnitude: 7.1,
      color_index: 0.82,
      spectral_type: 'G2V',
      mass_solar: 1.02,
      source_attribution: [{ name: 'ESA Gaia Archive', source_key: 'gaia_dr3' }],
      pack_id: 'stars-core',
      pack_version: '2026.06',
      indexed: true,
      status: 'indexed'
    })

    expect(skySource.source_id).toBe(sourceId)
    expect(skySource.names).toContain('Release star')
    expect(skySource.aliases).toContain(`Gaia ${sourceId}`)
    expect(skySource.source_attribution[0].source_key).toBe('gaia_dr3')
    expect(skySource.pack_id).toBe('stars-core')
    expect(skySource.pack_version).toBe('2026.06')
    expect(skySource.category).toBe('stars')
    expect(skySource.spectral_type).toBe('G2V')
    expect(skySource.mass_solar).toBe(1.02)
    expect(skySource.model_data.spect_t).toBe('G2V')
    expect(skySource.model_data.oras_pack_id).toBe('stars-core')
  })
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
      magnitude: 0.08,
      magnitude_band: 'V',
      coordinate_epoch: 2000,
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
    expect(source).toContain(
      'this.mergeSkySourceResults(packResults, this.localQueryResults(normalized, limit))',
    )
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

  it('waits for registration and uses one bounded canonical tile lookup', () => {
    const helpersSource = fs.readFileSync(swHelpersPath, 'utf8')
    const appSource = fs.readFileSync(appVuePath, 'utf8')
    expect(appSource).toContain("identity.model === 'star' ? this.starDataSourcesReady : Promise.resolve()")
    expect(appSource).toContain('await swh.resolveCanonicalStar(ss)')
    expect(appSource).not.toContain('maxNativeAttempts = 40')
    expect(helpersSource).toContain("stel.cwrap('stars_get_by_identity'")
    expect(helpersSource).toContain("stel.HEAP32[status >> 2] !== 0")
    expect(helpersSource).toContain('hint.order, hint.pix, status')
    expect(helpersSource).toContain('const maxLookupAttempts = 60')
    expect(helpersSource).toContain('lookupAttempts < maxLookupAttempts')
  })

  it.each([
    ['active profile excludes the star', true, 4.8],
    ['dense profile is disabled', false, 20],
  ])('searches native continuations when %s', async (_label, ready, magnitudeLimit) => {
    const native = { v: 17 }
    const context = { skySource2SweObj: vi.fn(() => native) }
    const method = compileCanonicalStarMethod(
      { cwrap: vi.fn(), _malloc: vi.fn(), _free: vi.fn() },
      {
        getSnapshot: vi.fn(() => ({ magnitudeLimit })),
        isReadyForNativeRegistration: vi.fn(() => ready),
      },
    )
    const source = {
      model: 'star',
      star_science: {
        render_magnitude: 10,
        native_tile: { identity: 'GAIA 42', order: 3, pix: 7 },
      },
    }

    await expect(method.call(context, source)).resolves.toBe(native)
    expect(context.skySource2SweObj).toHaveBeenCalledWith(source)
  })

  it('retries a transient exact-star API failure and selects the successful response', async () => {
    vi.useFakeTimers()
    try {
      const skySource = indexedStarSource()
      const obj = { v: 42 }
      const swh = {
        fetchOrasSkySourceByIdentity: vi.fn()
          .mockRejectedValueOnce(new Error('backend starting'))
          .mockResolvedValueOnce(skySource),
        skySourceMatchesIdentity: vi.fn(() => true),
        setSweObjAsSelection: vi.fn(),
      }
      const method = compileExactRouteMethod(swh, { warn: vi.fn() })
      const context = {
        starLookupMessage: '',
        skySourceRouteIdentity: vi.fn(() => exactStarIdentity()),
        resolveExactSkySourceRouteObject: vi.fn().mockResolvedValue(obj),
      }
      context.selectSkySourceRouteTargetByIdentity = method

      const pending = method.call(context, exactStarIdentity())
      await vi.runAllTimersAsync()
      await pending

      expect(swh.fetchOrasSkySourceByIdentity).toHaveBeenCalledTimes(2)
      expect(swh.setSweObjAsSelection).toHaveBeenCalledWith(obj, skySource)
      expect(context.starLookupMessage).toBe('')
    } finally {
      vi.useRealTimers()
    }
  })

  it('ends permanent exact-star request failures in a controlled unavailable state', async () => {
    vi.useFakeTimers()
    try {
      const warningConsole = { warn: vi.fn() }
      const swh = {
        fetchOrasSkySourceByIdentity: vi.fn().mockRejectedValue(new Error('service unavailable')),
        skySourceMatchesIdentity: vi.fn(() => true),
        setSweObjAsSelection: vi.fn(),
      }
      const method = compileExactRouteMethod(swh, warningConsole)
      const context = {
        starLookupMessage: '',
        resolveExactSkySourceRouteObject: vi.fn(),
      }
      context.selectSkySourceRouteTargetByIdentity = method

      const pending = method.call(context, exactStarIdentity())
      await vi.runAllTimersAsync()
      await pending

      expect(swh.fetchOrasSkySourceByIdentity).toHaveBeenCalledTimes(3)
      expect(context.starLookupMessage).toBe('Star lookup unavailable for Hipparcos (CDS) hip-42.')
      expect(warningConsole.warn).toHaveBeenCalledWith(
        'Star lookup request failed.',
        expect.any(Error),
      )
      expect(context.resolveExactSkySourceRouteObject).not.toHaveBeenCalled()
      expect(swh.setSweObjAsSelection).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('treats a successful not-indexed exact-star response as final', async () => {
    const unavailable = {
      catalog: 'Gaia DR2',
      source_id: '2252802052894084352',
      model: 'star',
      indexed: false,
      status: 'not_indexed',
    }
    const swh = {
      fetchOrasSkySourceByIdentity: vi.fn().mockResolvedValue(unavailable),
      skySourceMatchesIdentity: vi.fn(() => true),
      setSweObjAsSelection: vi.fn(),
    }
    const method = compileExactRouteMethod(swh, { warn: vi.fn() })
    const context = {
      starLookupMessage: '',
      resolveExactSkySourceRouteObject: vi.fn(),
    }
    context.selectSkySourceRouteTargetByIdentity = method

    await method.call(context, {
      ...exactStarIdentity(),
      catalog: 'Gaia DR2',
      sourceId: '2252802052894084352',
    })

    expect(swh.fetchOrasSkySourceByIdentity).toHaveBeenCalledTimes(1)
    expect(context.starLookupMessage).toContain('Star data unavailable for Gaia DR2')
    expect(context.resolveExactSkySourceRouteObject).not.toHaveBeenCalled()
  })

  it('selects an indexed Gaia response that uses the legacy source-backed fields', async () => {
    const indexed = toOrasSkySource({
      catalog: 'Gaia DR2',
      source_id: '2252802052894084352',
      model: 'star',
      indexed: true,
      status: 'indexed',
      ra: 79.17232794,
      dec: 45.99799147,
      phot_g_mean_mag: 0.08,
    })
    expect(indexed.model_data.Gmag).toBe(0.08)
    const obj = { v: 42 }
    const swh = {
      fetchOrasSkySourceByIdentity: vi.fn().mockResolvedValue(indexed),
      skySourceMatchesIdentity: vi.fn(() => true),
      setSweObjAsSelection: vi.fn(),
    }
    const method = compileExactRouteMethod(swh, { warn: vi.fn() })
    const context = {
      starLookupMessage: '',
      skySourceRouteIdentity: vi.fn(() => ({
        ...exactStarIdentity(),
        catalog: 'Gaia DR2',
        sourceId: '2252802052894084352',
      })),
      resolveExactSkySourceRouteObject: vi.fn().mockResolvedValue(obj),
    }
    context.selectSkySourceRouteTargetByIdentity = method

    await method.call(context, {
      ...exactStarIdentity(),
      catalog: 'Gaia DR2',
      sourceId: '2252802052894084352',
    })

    expect(context.resolveExactSkySourceRouteObject).toHaveBeenCalledWith(
      indexed,
      expect.objectContaining({ catalog: 'Gaia DR2' }),
    )
    expect(swh.setSweObjAsSelection).toHaveBeenCalledWith(obj, indexed)
    expect(context.starLookupMessage).toBe('')
  })

  it('releases a stale owned exact-route object without selecting it', async () => {
    const firstIdentity = exactStarIdentity()
    const secondIdentity = { ...firstIdentity, sourceId: 'hip-84' }
    const skySource = indexedStarSource()
    const ownedObject = { __orasOwnedLookup: true, destroy: vi.fn() }
    let resolveLookup
    let currentIdentity = firstIdentity
    const swh = {
      fetchOrasSkySourceByIdentity: vi.fn().mockResolvedValue(skySource),
      skySourceMatchesIdentity: vi.fn(() => true),
      setSweObjAsSelection: vi.fn(),
    }
    const method = compileExactRouteMethod(swh, { warn: vi.fn() })
    const context = {
      starLookupMessage: '',
      skySourceRouteIdentity: vi.fn(() => currentIdentity),
      resolveExactSkySourceRouteObject: vi.fn(() => new Promise(resolve => { resolveLookup = resolve })),
    }
    context.selectSkySourceRouteTargetByIdentity = method

    const pending = method.call(context, firstIdentity)
    await vi.waitFor(() => expect(resolveLookup).toBeTypeOf('function'))
    currentIdentity = secondIdentity
    resolveLookup(ownedObject)
    await pending

    expect(ownedObject.destroy).toHaveBeenCalledTimes(1)
    expect(ownedObject.__orasOwnedLookup).toBe(false)
    expect(swh.setSweObjAsSelection).not.toHaveBeenCalled()
  })

  it('releases a stale owned canonical lookup object without selecting it', async () => {
    const source = fs.readFileSync(targetSearchPath, 'utf8')
    const watcherSource = extractFunction(source, 'obsSkySource: async function')
    const ownedObject = { __orasOwnedLookup: true, destroy: vi.fn() }
    let resolveLookup
    const swh = {
      resolveCanonicalStar: vi.fn(() => new Promise(resolve => { resolveLookup = resolve })),
      skySource2SweObj: vi.fn(),
      setSweObjAsSelection: vi.fn(),
    }
    const watcher = new Function('swh', `return (${watcherSource})`)(swh)
    const first = { model: 'star', source_id: 'first' }
    const second = { model: 'star', source_id: 'second' }
    const context = {
      obsSkySource: first,
      $selectionLayer: { add: vi.fn() },
      $stel: { createObj: vi.fn() },
    }

    const pending = watcher.call(context, first)
    context.obsSkySource = second
    resolveLookup(ownedObject)
    await pending

    expect(ownedObject.destroy).toHaveBeenCalledTimes(1)
    expect(ownedObject.__orasOwnedLookup).toBe(false)
    expect(swh.setSweObjAsSelection).not.toHaveBeenCalled()
    expect(context.$selectionLayer.add).not.toHaveBeenCalled()
  })

  it('routes exact-object resolution failures through the bounded retry handler', () => {
    const appSource = fs.readFileSync(appVuePath, 'utf8')
    const methodStart = appSource.indexOf('selectSkySourceRouteTargetByIdentity: function')
    const methodEnd = appSource.indexOf('\n    }\n  },', methodStart)

    expect(methodStart).toBeGreaterThanOrEqual(0)
    expect(methodEnd).toBeGreaterThan(methodStart)
    const method = appSource.slice(methodStart, methodEnd)

    expect(method).toContain('const request = swh.fetchOrasSkySourceByIdentity(identity).catch(err => {')
    expect(method).toContain('return request.then(ss => {')
    expect(method).toContain("if (identity.model !== 'star')")
    expect(method).toContain("console.warn('Star lookup request failed.', err)")
    expect(method).toContain("console.warn('Star route resolution failed.', err)")
    expect(method).not.toContain('}, err => {')
  })

  it('materializes exhausted exact-star fallbacks with native astrometry only', () => {
    const appSource = fs.readFileSync(appVuePath, 'utf8')
    const methodStart = appSource.indexOf('selectSkySourceRouteTargetByIdentity: function')
    const methodEnd = appSource.indexOf('\n    }\n  },', methodStart)

    expect(methodStart).toBeGreaterThanOrEqual(0)
    expect(methodEnd).toBeGreaterThan(methodStart)
    const method = appSource.slice(methodStart, methodEnd)

    expect(method).toContain("identity.model === 'star' && (identity.ra == null || identity.dec == null)")
    expect(method).toContain("identity.model === 'star' || identity.model === 'dso'")
    expect(method).toContain('{ ra: identity.ra, de: identity.dec, source_id: identity.sourceId }')
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

  it('stops selection when SWE object creation fails', () => {
    const runtimeSources = [appVuePath, targetSearchPath].map(sourcePath => fs.readFileSync(sourcePath, 'utf8'))

    for (const source of runtimeSources) {
      expect(source).not.toContain('console.warning(')
      expect(source).toMatch(/obj = this\.\$stel\.createObj\(ss\.model, ss\)\s+if \(obj\) \{\s+this\.\$selectionLayer\.add\(obj\)\s+\}/)
      expect(source).toContain('const label = Array.isArray(ss.names)')
      expect(source).toContain("ss.display_name || String(ss.source_id || 'unknown')")
      expect(source).toMatch(/if \(!obj\) \{\s+const label =[\s\S]+?console\.warn\([^}]+\)\s+return\s+\}/)
    }
  })

  it('handles rejected WASM imports without leaving the loader active', () => {
    const appSource = fs.readFileSync(appVuePath, 'utf8')

    expect(appSource).toMatch(/import\('@\/assets\/js\/stellarium-web-engine\.wasm'\)[\s\S]+?\.catch\(\(error\) => \{/)
    expect(appSource).toContain("that.$store.commit('setValue', { varName: 'wasmSupport', newValue: false })")
  })

  it('preserves raw query text for backend-compatible Gaia searches', () => {
    const source = fs.readFileSync(skySourceSearchPath, 'utf8')

    expect(source).toContain('const rawQuery = that.searchText.trim()')
    expect(source).toContain('swh.querySkySources(rawQuery, 10)')
    expect(source).not.toContain("str = str.toUpperCase()")
    expect(source).not.toContain("str = str.replace(/\\s+/g, '')")
  })
})
