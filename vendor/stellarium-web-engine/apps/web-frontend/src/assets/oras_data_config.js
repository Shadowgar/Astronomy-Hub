export const ORAS_DATA_ROOT = '/oras-sky-engine/skydata'
export const ORAS_BUNDLED_DSS_SURVEY_ROOT = ORAS_DATA_ROOT + '/surveys/dss/v1'
export const ORAS_BUNDLED_GAIA_SURVEY_ROOT = ORAS_DATA_ROOT + '/surveys/gaia/v1'
export const ORAS_PACKS_ROOT = ORAS_DATA_ROOT + '/packs'
export const ORAS_SEARCH_API = '/api/sky/search'
export const ORAS_OBJECT_API_ROOT = '/api/sky/object'
export const ORAS_CATALOG_STATUS_API = '/api/sky/catalog/status'
export const ORAS_RUNTIME_MODE = 'oras-local'
export const ORAS_OBJECT_MEDIA_ROOT = ORAS_DATA_ROOT + '/object-media'

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

export async function resolveOrasDssSurveyUrl (options = {}) {
  const localSurveyRoot = options.localSurveyRoot || ORAS_BUNDLED_DSS_SURVEY_ROOT
  const fetchImpl = options.fetchImpl || (typeof fetch === 'function' ? fetch : undefined)

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

  if (String(model || '').toLowerCase() === 'star') {
    const ra = numberOrNull(result.ra)
    const de = numberOrNull(result.dec)
    const vmag = numberOrNull(result.phot_g_mean_mag)
    const plx = numberOrNull(result.parallax)
    const pmRa = numberOrNull(result.pmra)
    const pmDe = numberOrNull(result.pmdec)

    if (ra != null) modelData.ra = ra
    if (de != null) modelData.de = de
    if (vmag != null) modelData.Vmag = vmag
    if (plx != null) modelData.plx = plx
    if (pmRa != null) modelData.pm_ra = pmRa
    if (pmDe != null) modelData.pm_de = pmDe
    modelData.epoch = 2000
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
  const names = Array.isArray(result.names) && result.names.length
    ? preferDisplayNameFirst(result.names, displayName)
    : buildOrasNames(result, displayName, sourceId, isGaiaResult)

  const types = normalizeOrasSkySourceTypes(result.types, model)

  return {
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
    phot_g_mean_mag: result.phot_g_mean_mag == null ? null : result.phot_g_mean_mag,
    indexed: Boolean(result.indexed),
    status: result.status || null,
    message: result.message || null,
    provenance: result.provenance || null
  }
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

  if (String(exactSkySource.model || '').toLowerCase() === 'star') {
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

  return exactSkySource
}
