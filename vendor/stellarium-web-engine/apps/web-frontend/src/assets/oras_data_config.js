export const ORAS_DATA_ROOT = '/oras-sky-engine/skydata'
export const ORAS_BUNDLED_DSS_SURVEY_ROOT = ORAS_DATA_ROOT + '/surveys/dss/v1'
export const ORAS_BUNDLED_GAIA_SURVEY_ROOT = ORAS_DATA_ROOT + '/surveys/gaia/v1'
export const ORAS_PACKS_ROOT = ORAS_DATA_ROOT + '/packs'
export const ORAS_SEARCH_API = '/api/sky/search'
export const ORAS_OBJECT_API_ROOT = '/api/sky/object'
export const ORAS_CATALOG_STATUS_API = '/api/sky/catalog/status'
export const ORAS_RUNTIME_MODE = 'oras-local'
export const ORAS_OBJECT_MEDIA_ROOT = ORAS_DATA_ROOT + '/object-media'
export const ORAS_DEFAULT_DSS_SURVEY_KEY = 'oras-hd-auto'

const ORAS_DEFAULT_SURVEY_MIN_COVERAGE = 0.99

const ORAS_DSS_SURVEY_PROVIDERS = [
  {
    key: ORAS_DEFAULT_DSS_SURVEY_KEY,
    label: 'ORAS HD auto',
    source: 'auto',
    isDefault: true,
    preferredProviderKeys: ['panstarrs-dr1-color-z-zg-g']
  },
  {
    key: 'dss',
    label: 'DSS colored',
    url: ORAS_BUNDLED_DSS_SURVEY_ROOT,
    source: 'bundled'
  },
  {
    key: 'dss-colored',
    label: 'DSS colored',
    url: ORAS_BUNDLED_DSS_SURVEY_ROOT,
    source: 'bundled',
    aliasFor: 'dss'
  },
  {
    key: 'panstarrs-dr1-color-z-zg-g',
    label: 'Pan-STARRS DR1 color z-zg-g',
    url: 'https://alasky.cds.unistra.fr/Pan-STARRS/DR1/color-z-zg-g',
    hipsOrder: 11,
    tileFormat: 'jpeg',
    coverage: 0.78125,
    source: 'external-query-only'
  },
  {
    key: 'panstarrs-dr1-color-i-r-g',
    label: 'Pan-STARRS DR1 color i-r-g',
    url: 'https://alasky.cds.unistra.fr/Pan-STARRS/DR1/color-i-r-g',
    hipsOrder: 11,
    tileFormat: 'jpeg',
    coverage: 0.76386,
    source: 'external-query-only'
  }
]

const GAIA_SOURCE_ALIAS_RE = /^\s*gaia\s+([0-9]+)\s*$/i
const GAIA_DISPLAY_NAME_RE = /^Gaia DR2 ([0-9]+)$/
const MESSIER_ID_RE = /^M\s*([0-9]+)$/i

function buildOrasNames (result, displayName, sourceId, isGaiaResult) {
  const names = [displayName]

  if (isGaiaResult && sourceId) {
    names.push(buildOrasGaiaAlias(sourceId))
    return names
  }

  if (sourceId && MESSIER_ID_RE.test(sourceId)) {
    const messierId = String(sourceId).replace(/\s+/g, '').toUpperCase()
    const messierNumber = messierId.slice(1)
    names.push(messierId)
    names.push('M ' + messierNumber)
  }

  if (result && ['Bright Stars (local)', 'Bright Star Catalog (local)'].includes(result.catalog)) {
    names.push('NAME ' + displayName)
  }

  return names.filter((name, index, array) => {
    return name && array.indexOf(name) === index
  })
}

export function normalizeOrasSearchQuery (query) {
  if (typeof query !== 'string') {
    return ''
  }
  const trimmed = query.trim()
  if (!trimmed) {
    return ''
  }
  return trimmed.replace(GAIA_SOURCE_ALIAS_RE, 'Gaia DR2 $1')
}

export function buildOrasSearchUrl (query) {
  const normalized = normalizeOrasSearchQuery(query)
  if (!normalized) {
    return undefined
  }
  const params = new URLSearchParams({ q: normalized })
  return ORAS_SEARCH_API + '?' + params.toString()
}

export function buildOrasObjectLookupUrl ({ catalog, sourceId, model, time, lat, lng, elev }) {
  const normalizedCatalog = typeof catalog === 'string' ? catalog.trim() : ''
  const normalizedSourceId = sourceId == null ? '' : String(sourceId).trim()
  const normalizedModel = typeof model === 'string' ? model.trim() : ''

  if (!normalizedCatalog || !normalizedSourceId || !normalizedModel) {
    return undefined
  }

  const params = new URLSearchParams({
    catalog: normalizedCatalog,
    source_id: normalizedSourceId,
    model: normalizedModel
  })
  if (time != null && String(time).trim() !== '') {
    params.set('time', String(time).trim())
  }
  if (lat != null && String(lat).trim() !== '') {
    params.set('lat', String(lat).trim())
  }
  if (lng != null && String(lng).trim() !== '') {
    params.set('lng', String(lng).trim())
  }
  if (elev != null && String(elev).trim() !== '') {
    params.set('elev', String(elev).trim())
  }
  return ORAS_OBJECT_API_ROOT + '?' + params.toString()
}

export function listOrasDssSurveyProviders () {
  return ORAS_DSS_SURVEY_PROVIDERS.map(provider => Object.assign({}, provider))
}

export function getOrasDssSurveyProvider (requestedKey) {
  const normalizedKey = typeof requestedKey === 'string' ? requestedKey.trim().toLowerCase() : ''
  if (!normalizedKey) {
    return ORAS_DSS_SURVEY_PROVIDERS.find(provider => provider.isDefault)
  }
  return ORAS_DSS_SURVEY_PROVIDERS.find(provider => provider.key === normalizedKey) ||
    ORAS_DSS_SURVEY_PROVIDERS.find(provider => provider.key === 'dss')
}

function isProviderSafeForDefault (provider) {
  return provider &&
    provider.source === 'external-query-only' &&
    Number(provider.coverage) >= ORAS_DEFAULT_SURVEY_MIN_COVERAGE
}

async function probeOrasSurveyProvider (provider, fetchImpl) {
  if (!provider || !provider.url) {
    return undefined
  }
  if (provider.source !== 'external-query-only') {
    return provider.url
  }
  if (typeof fetchImpl !== 'function') {
    return provider.url
  }
  try {
    const response = await fetchImpl(provider.url + '/properties', { method: 'GET' })
    if (response && response.ok) {
      return provider.url
    }
  } catch (error) {
  }
  return undefined
}

async function resolveOrasAutoDssSurveyUrl (provider, fetchImpl, localSurveyRoot) {
  const preferredProviderKeys = Array.isArray(provider.preferredProviderKeys)
    ? provider.preferredProviderKeys
    : []
  for (const preferredProviderKey of preferredProviderKeys) {
    const preferredProvider = ORAS_DSS_SURVEY_PROVIDERS.find(item => item.key === preferredProviderKey)
    if (!isProviderSafeForDefault(preferredProvider)) {
      continue
    }
    const surveyUrl = await probeOrasSurveyProvider(preferredProvider, fetchImpl)
    if (surveyUrl) {
      return surveyUrl
    }
  }
  return resolveOrasBundledDssSurveyUrl(fetchImpl, localSurveyRoot)
}

async function resolveOrasBundledDssSurveyUrl (fetchImpl, localSurveyRoot) {
  if (typeof fetchImpl === 'function') {
    try {
      const response = await fetchImpl(localSurveyRoot + '/properties', { method: 'HEAD' })
      if (response && response.ok) {
        return localSurveyRoot
      }
    } catch (error) {
    }
  }

  return undefined
}

export async function resolveOrasDssSurveyUrl (requestedKeyOrOptions = undefined, maybeOptions = {}) {
  const options = requestedKeyOrOptions && typeof requestedKeyOrOptions === 'object'
    ? requestedKeyOrOptions
    : maybeOptions
  const requestedKey = typeof requestedKeyOrOptions === 'string' ? requestedKeyOrOptions : undefined
  const provider = getOrasDssSurveyProvider(requestedKey)
  const fetchImpl = options.fetchImpl || (typeof fetch === 'function' ? fetch : undefined)
  const localSurveyRoot = options.localSurveyRoot || ORAS_BUNDLED_DSS_SURVEY_ROOT

  if (provider && provider.source === 'auto') {
    return resolveOrasAutoDssSurveyUrl(provider, fetchImpl, localSurveyRoot)
  }

  if (provider && provider.source === 'bundled') {
    return resolveOrasBundledDssSurveyUrl(fetchImpl, localSurveyRoot)
  }

  const requestedSurveyUrl = await probeOrasSurveyProvider(provider, fetchImpl)
  if (requestedSurveyUrl) {
    return requestedSurveyUrl
  }

  if (!provider || provider.source === 'external-query-only') {
    return resolveOrasBundledDssSurveyUrl(fetchImpl, localSurveyRoot)
  }

  return undefined
}

export function buildOrasGaiaAlias (sourceId) {
  return 'GAIA ' + sourceId
}

function preferDisplayNameFirst (names, displayName) {
  const orderedNames = [displayName]
  if (Array.isArray(names)) {
    orderedNames.push(...names)
  }
  return orderedNames.filter((name, index, array) => {
    return name && array.indexOf(name) === index
  })
}

function normalizeOrasSkySourceTypes (types, model) {
  const normalizedTypes = Array.isArray(types) && types.length ? types : undefined
  const normalizedModel = String(model || '').toLowerCase()

  if (normalizedModel === 'dso') {
    if (!normalizedTypes) {
      return ['G']
    }
    return normalizedTypes.map(type => String(type).toLowerCase() === 'dso' ? 'G' : type)
  }

  return normalizedTypes || ['*']
}

function numberOrNull (value) {
  if (value == null) {
    return null
  }
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function buildOrasModelData (result, model, sourceId) {
  const normalizedModel = String(model || '').toLowerCase()
  const resultModelData = result.model_data && typeof result.model_data === 'object' ? result.model_data : undefined
  const modelData = {
    source_id: sourceId == null ? null : sourceId,
    phot_g_mean_mag: result.phot_g_mean_mag == null ? null : result.phot_g_mean_mag,
    bp_rp: result.bp_rp == null ? null : result.bp_rp,
    parallax: result.parallax == null ? null : result.parallax,
    pmra: result.pmra == null ? null : result.pmra,
    pmdec: result.pmdec == null ? null : result.pmdec,
    oras_catalog: result.catalog || null,
    oras_status: result.status || null,
    oras_indexed: Boolean(result.indexed),
    provenance: result.provenance || null
  }

  if (result.pack_id) modelData.oras_pack_id = result.pack_id
  if (result.pack_version) modelData.oras_pack_version = result.pack_version
  if (result.category) modelData.oras_category = result.category
  if (result.source_attribution) modelData.oras_source_attribution = result.source_attribution

  if (normalizedModel === 'tle_satellite' && resultModelData) {
    Object.assign(modelData, resultModelData)
  }

  if (normalizedModel === 'star') {
    const ra = numberOrNull(result.ra)
    const de = numberOrNull(result.dec)
    const vmag = numberOrNull(result.phot_g_mean_mag == null ? result.magnitude : result.phot_g_mean_mag)
    const plx = numberOrNull(result.parallax)
    const pmRa = numberOrNull(result.pmra)
    const pmDe = numberOrNull(result.pmdec)

    if (ra != null) modelData.ra = ra
    if (de != null) modelData.de = de
    if (vmag != null) modelData.Vmag = vmag
    if (plx != null) modelData.plx = plx
    if (pmRa != null) modelData.pm_ra = pmRa
    if (pmDe != null) modelData.pm_de = pmDe
    if (result.spectral_type) modelData.spect_t = result.spectral_type
    if (numberOrNull(result.color_index) != null) modelData.color_index = numberOrNull(result.color_index)
    if (numberOrNull(result.mass_solar) != null) modelData.mass_solar = numberOrNull(result.mass_solar)
    if (numberOrNull(result.radius_solar) != null) modelData.radius_solar = numberOrNull(result.radius_solar)
    if (numberOrNull(result.temperature_k) != null) modelData.temperature_k = numberOrNull(result.temperature_k)
    modelData.epoch = 2000
  }

  if (normalizedModel === 'dso') {
    if (resultModelData) {
      Object.assign(modelData, resultModelData)
    }
    const ra = numberOrNull(result.ra)
    const de = numberOrNull(result.dec)
    const vmag = numberOrNull(result.phot_g_mean_mag == null ? result.magnitude : result.phot_g_mean_mag)
    const angularSize = result.angular_size && typeof result.angular_size === 'object'
      ? result.angular_size
      : {}
    const dimx = numberOrNull(angularSize.major_arcmin)
    const dimy = numberOrNull(angularSize.minor_arcmin)
    const angle = numberOrNull(angularSize.position_angle_deg)

    if (ra != null && numberOrNull(modelData.ra) == null) modelData.ra = ra
    if (de != null && numberOrNull(modelData.de) == null) modelData.de = de
    if (vmag != null && numberOrNull(modelData.Vmag) == null) modelData.Vmag = vmag
    if (dimx != null && numberOrNull(modelData.dimx) == null) modelData.dimx = dimx
    if (dimy != null && numberOrNull(modelData.dimy) == null) modelData.dimy = dimy
    if (angle != null && numberOrNull(modelData.angle) == null) modelData.angle = angle
  }

  return modelData
}

export function listOrasPackRoots () {
  return [
    ORAS_PACKS_ROOT + '/minimal',
    ORAS_PACKS_ROOT + '/base',
    ORAS_PACKS_ROOT + '/extended'
  ]
}

export function toOrasSkySource (result) {
  if (!result || !result.display_name) {
    return undefined
  }

  const displayName = String(result.display_name).trim()
  const displayNameMatch = displayName.match(GAIA_DISPLAY_NAME_RE)
  const sourceId = displayNameMatch
    ? displayNameMatch[1]
    : (result.source_id == null ? undefined : String(result.source_id).trim())
  const isGaiaResult = Boolean(displayNameMatch || String(result.catalog || '').toLowerCase().includes('gaia'))
  const isLocalMessierResult = String(result.catalog || '').toLowerCase().includes('messier')
  const skySourceModel = isLocalMessierResult ? 'dso' : 'star'
  const model = result.model || skySourceModel
  const enrichedNames = [
    ...(Array.isArray(result.names) ? result.names : []),
    ...(Array.isArray(result.aliases) ? result.aliases : []),
    ...(Array.isArray(result.common_names) ? result.common_names : []),
    ...(Array.isArray(result.catalog_ids) ? result.catalog_ids : [])
  ]
  const names = enrichedNames.length
    ? preferDisplayNameFirst(enrichedNames, displayName)
    : buildOrasNames(result, displayName, sourceId, isGaiaResult)

  const types = normalizeOrasSkySourceTypes(result.types, model)

  const skySource = {
    match: displayName,
    names,
    types,
    model,
    model_data: buildOrasModelData(result, model, sourceId),
    catalog: result.catalog || null,
    source_id: sourceId == null ? null : sourceId,
    display_name: displayName,
    ra: result.ra == null ? null : result.ra,
    dec: result.dec == null ? null : result.dec,
    phot_g_mean_mag: result.phot_g_mean_mag == null ? (result.magnitude == null ? null : result.magnitude) : result.phot_g_mean_mag,
    indexed: Boolean(result.indexed),
    status: result.status || null,
    message: result.message || null,
    provenance: result.provenance || null
  }

  const enrichmentFields = [
    'aliases', 'common_names', 'catalog_ids', 'category', 'object_type',
    'source_attribution', 'pack_id', 'pack_version', 'pack_sources',
    'magnitude', 'magnitude_band', 'color_index', 'spectral_type', 'parallax',
    'distance_pc', 'proper_motion_ra', 'proper_motion_dec',
    'radial_velocity_km_s', 'temperature_k', 'mass_solar', 'radius_solar',
    'variability', 'angular_size', 'double_star', 'period_seconds', 'redshift',
    'flux', 'candidate_status', 'description'
  ]
  enrichmentFields.forEach(field => {
    if (result[field] != null) skySource[field] = result[field]
  })
  return skySource
}

export function withOrasRouteIdentityFallback (skySource, identity) {
  if (!skySource || !identity) {
    return skySource
  }

  const routeRa = numberOrNull(identity.ra)
  const routeDec = numberOrNull(identity.dec)
  const skySourceRa = numberOrNull(skySource.ra)
  const skySourceDec = numberOrNull(skySource.dec)
  const hasRouteCoordinates = routeRa != null && routeDec != null
  const needsRouteCoordinates = hasRouteCoordinates && (skySourceRa == null || skySourceDec == null)

  if (!needsRouteCoordinates) {
    return skySource
  }

  const exactSkySource = Object.assign({}, skySource, {
    ra: skySourceRa == null ? routeRa : skySource.ra,
    dec: skySourceDec == null ? routeDec : skySource.dec,
    model_data: Object.assign({}, skySource.model_data || {})
  })

  const exactModel = String(exactSkySource.model || '').toLowerCase()
  if (exactModel === 'star') {
    if (numberOrNull(exactSkySource.model_data.ra) == null) {
      exactSkySource.model_data.ra = exactSkySource.ra
    }
    if (numberOrNull(exactSkySource.model_data.de) == null) {
      exactSkySource.model_data.de = exactSkySource.dec
    }
    if (exactSkySource.model_data.epoch == null) {
      exactSkySource.model_data.epoch = 2000
    }
  }

  if (exactModel === 'dso') {
    if (numberOrNull(exactSkySource.model_data.ra) == null) {
      exactSkySource.model_data.ra = exactSkySource.ra
    }
    if (numberOrNull(exactSkySource.model_data.de) == null) {
      exactSkySource.model_data.de = exactSkySource.dec
    }
  }

  return exactSkySource
}
