// Stellarium Web - Copyright (c) 2022 - Stellarium Labs SRL
//
// This program is licensed under the terms of the GNU AGPL v3, or
// alternatively under a commercial licence.
//
// The terms of the AGPL v3 license can be found in the main directory of this
// repository.

import Vue from 'vue'
import _ from 'lodash'
import StelWebEngine from '@/assets/js/stellarium-web-engine.js'
import Moment from 'moment'
import { ORAS_OBJECT_MEDIA_ROOT, buildOrasObjectLookupUrl, buildOrasSearchUrl, normalizeOrasSearchQuery, toOrasSkySource } from '@/assets/oras_data_config.js'
import { orasCatalogPacks } from '@/assets/oras_catalog_packs.js'

var DDDate = Date
DDDate.prototype.getJD = function () {
  return (this.getTime() / 86400000) + 2440587.5
}

DDDate.prototype.setJD = function (jd) {
  this.setTime((jd - 2440587.5) * 86400000)
}

DDDate.prototype.getMJD = function () {
  return this.getJD() - 2400000.5
}

DDDate.prototype.setMJD = function (mjd) {
  this.setJD(mjd + 2400000.5)
}

const swh = {
  initStelWebEngine: function (store, wasmFile, canvasElem, callBackOnDone) {
    StelWebEngine({
      wasmFile: wasmFile,
      canvas: canvasElem,
      translateFn: function (domain, str) {
        return str
        // return i18next.t(str, {ns: domain});
      },
      onReady: function (lstel) {
        store.commit('replaceStelWebEngine', lstel.getTree())
        lstel.onValueChanged(function (path, value) {
          const tree = store.state.stel
          _.set(tree, path, value)
          store.commit('replaceStelWebEngine', tree)
        })
        Vue.prototype.$stel = lstel
        Vue.prototype.$selectionLayer = lstel.createLayer({ id: 'slayer', z: 50, visible: true })
        Vue.prototype.$observingLayer = lstel.createLayer({ id: 'obslayer', z: 40, visible: true })
        Vue.prototype.$skyHintsLayer = lstel.createLayer({ id: 'skyhintslayer', z: 38, visible: true })
        callBackOnDone()
      }
    })
  },

  monthNames: ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],

  astroConstants: {
    // Light time for 1 au in s
    ERFA_AULT: 499.004782,
    // Seconds per day
    ERFA_DAYSEC: 86400.0,
    // Days per Julian year
    ERFA_DJY: 365.25,
    // Astronomical unit in m
    ERFA_DAU: 149597870000
  },

  iconForSkySourceTypes: function (skySourceTypes) {
    // Array sorted by specificity, i.e. the most generic names at the end
    const iconForType = {
      // Stars
      'Pec?': 'star',
      '**?': 'double_star',
      '**': 'double_star',
      'V*': 'variable_star',
      'V*?': 'variable_star',
      '*': 'star',

      // Candidates
      'As?': 'group_of_stars',
      'SC?': 'group_of_galaxies',
      'Gr?': 'group_of_galaxies',
      'C?G': 'group_of_galaxies',
      'G?': 'galaxy',

      // Multiple objects
      reg: 'region_defined_in_the_sky',
      SCG: 'group_of_galaxies',
      ClG: 'group_of_galaxies',
      GrG: 'group_of_galaxies',
      IG: 'interacting_galaxy',
      PaG: 'pair_of_galaxies',
      'C?*': 'open_galactic_cluster',
      'Gl?': 'globular_cluster',
      GlC: 'globular_cluster',
      OpC: 'open_galactic_cluster',
      'Cl*': 'open_galactic_cluster',
      'As*': 'group_of_stars',
      mul: 'multiple_objects',

      // Interstellar matter
      'PN?': 'planetary_nebula',
      PN: 'planetary_nebula',
      SNR: 'planetary_nebula',
      'SR?': 'planetary_nebula',
      ISM: 'interstellar_matter',

      // Galaxies
      PoG: 'part_of_galaxy',
      QSO: 'quasar',
      G: 'galaxy',

      dso: 'deep_sky',

      // Solar System
      Asa: 'artificial_satellite',
      Moo: 'moon',
      Sun: 'sun',
      Pla: 'planet',
      DPl: 'planet',
      Com: 'comet',
      MPl: 'minor_planet',
      SSO: 'minor_planet',

      Con: 'constellation'
    }
    for (const i in skySourceTypes) {
      if (skySourceTypes[i] in iconForType) {
        return process.env.BASE_URL + 'images/svg/target_types/' + iconForType[skySourceTypes[i]] + '.svg'
      }
    }
    return process.env.BASE_URL + 'images/svg/target_types/unknown.svg'
  },

  iconForSkySource: function (skySource) {
    return swh.iconForSkySourceTypes(skySource.types)
  },

  iconForObservation: function (obs) {
    if (obs && obs.target) {
      return this.iconForSkySource(obs.target)
    } else {
      return this.iconForSkySourceTypes(['reg'])
    }
  },

  cleanupOneSkySourceName: function (name, flags) {
    flags = flags || 4
    return Vue.prototype.$stel.designationCleanup(name, flags)
  },

  nameForSkySource: function (skySource) {
    if (!skySource || !skySource.names) {
      return '?'
    }
    return this.cleanupOneSkySourceName(skySource.names[0])
  },

  culturalNameToList: function (cn) {
    const res = []

    const formatNative = function (_cn) {
      if (cn.name_native && cn.name_pronounce) {
        return cn.name_native + ', <i>' + cn.name_pronounce + '</i>'
      }
      if (cn.name_native) {
        return cn.name_native
      }
      if (cn.name_pronounce) {
        return cn.name_pronounce
      }
    }

    const nativeName = formatNative(cn)
    if (cn.user_prefer_native && nativeName) {
      res.push(nativeName)
    }
    if (cn.name_translated) {
      res.push(cn.name_translated)
    }
    if (!cn.user_prefer_native && nativeName) {
      res.push(nativeName)
    }
    return res
  },

  namesForSkySource: function (ss, flags) {
    // Return a list of cleaned up names
    if (!ss || !ss.names) {
      return []
    }
    if (!flags) flags = 10
    let res = []
    if (ss.culturalNames) {
      for (const i in ss.culturalNames) {
        res = res.concat(this.culturalNameToList(ss.culturalNames[i]))
      }
    }
    res = res.concat(ss.names.map(n => Vue.prototype.$stel.designationCleanup(n, flags)))
    // Remove duplicates, this can happen between * and V* catalogs
    res = res.filter(function (v, i) { return res.indexOf(v) === i })
    res = res.filter(function (v, i) { return !v.startsWith('CON ') })
    return res
  },

  nameForSkySourceType: function (otype) {
    const $stel = Vue.prototype.$stel
    const res = $stel.otypeToStr(otype)
    return res || 'Unknown Type'
  },

  nameForGalaxyMorpho: function (morpho) {
    const galTab = {
      E: 'Elliptical',
      SB: 'Barred Spiral',
      SAB: 'Intermediate Spiral',
      SA: 'Spiral',
      S0: 'Lenticular',
      S: 'Spiral',
      Im: 'Irregular',
      dSph: 'Dwarf Spheroidal',
      dE: 'Dwarf Elliptical'
    }
    for (const morp in galTab) {
      if (morpho.startsWith(morp)) {
        return galTab[morp]
      }
    }
    return ''
  },

  getShareLink: function (context) {
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : ''
    const basePath = process.env.BASE_URL || '/'
    let link = origin + (basePath.endsWith('/') ? basePath : basePath + '/')
    const selectedObject = context.$store.state.selectedObject
    if (selectedObject) {
      link += 'skysource/' + this.cleanupOneSkySourceName(selectedObject.names[0], 5).replace(/\s+/g, '')
    }
    link += '?'
    link += 'fov=' + (context.$store.state.stel.fov * 180 / Math.PI).toPrecision(5)
    const d = new Date()
    d.setMJD(context.$stel.core.observer.utc)
    link += '&date=' + new Moment(d).utc().format()
    link += '&lat=' + (context.$stel.core.observer.latitude * 180 / Math.PI).toFixed(2)
    link += '&lng=' + (context.$stel.core.observer.longitude * 180 / Math.PI).toFixed(2)
    link += '&elev=' + context.$stel.core.observer.elevation
    if (selectedObject) {
      if (selectedObject.catalog) {
        link += '&catalog=' + encodeURIComponent(selectedObject.catalog)
      }
      if (selectedObject.source_id != null) {
        link += '&source_id=' + encodeURIComponent(String(selectedObject.source_id))
      }
      if (selectedObject.model) {
        link += '&model=' + encodeURIComponent(selectedObject.model)
      }
      if (selectedObject.ra != null) {
        link += '&ra=' + encodeURIComponent(String(selectedObject.ra))
      }
      if (selectedObject.dec != null) {
        link += '&dec=' + encodeURIComponent(String(selectedObject.dec))
      }
    }
    if (!selectedObject) {
      link += '&az=' + (context.$stel.core.observer.yaw * 180 / Math.PI).toPrecision(5)
      link += '&alt=' + (context.$stel.core.observer.pitch * 180 / Math.PI).toPrecision(5)
    }
    return link
  },

  // Return a SweObj matching a passed sky source JSON object if it's already instanciated in SWE
  skySource2SweObj: function (ss) {
    if (!ss || !ss.model) {
      return undefined
    }
    const $stel = Vue.prototype.$stel
    let obj
    if (ss.model === 'tle_satellite') {
      const id = 'NORAD ' + ss.model_data.norad_number
      obj = $stel.getObj(id)
    } else if (ss.model === 'constellation' && ss.model_data.iau_abbreviation) {
      const id = 'CON western ' + ss.model_data.iau_abbreviation
      obj = $stel.getObj(id)
    }
    if (!obj) {
      const baseNames = []
      if (Array.isArray(ss.names)) {
        baseNames.push(...ss.names)
      }
      if (ss.display_name) {
        baseNames.push(ss.display_name)
      }
      if (ss.source_id != null) {
        baseNames.push(String(ss.source_id))
      }

      const candidateNames = []
      const compactMessierPattern = /^M\d+$/i
      for (const rawName of baseNames) {
        const name = String(rawName || '').trim()
        if (!name) {
          continue
        }

        candidateNames.push(name)
        candidateNames.push(this.cleanupOneSkySourceName(name, 5))
        candidateNames.push('NAME ' + name)
        candidateNames.push('* ' + name)

        const compactName = name.replace(/\s+/g, '')
        if (compactMessierPattern.test(compactName)) {
          const messierNumber = compactName.slice(1)
          candidateNames.push('M' + messierNumber)
          candidateNames.push('M ' + messierNumber)
        }

        candidateNames.push('M ' + name.replace(/^M\s*/i, ''))
        candidateNames.push('NGC ' + name.replace(/^NGC\s*/i, ''))
        candidateNames.push('IC ' + name.replace(/^IC\s*/i, ''))
      }

      obj = candidateNames
        .map(candidate => String(candidate || '').trim())
        .filter((candidate, index, all) => candidate !== '' && all.indexOf(candidate) === index)
        .map(candidate => $stel.getObj(candidate))
        .find(Boolean)
    }
    if (!obj && ss.names[0].startsWith('Gaia DR2 ')) {
      const gname = ss.names[0].replace(/^Gaia DR2 /, 'GAIA ')
      obj = $stel.getObj(gname)
    }
    if (obj === null) return undefined
    return obj
  },

  localSolarSystemCatalog: function () {
    return [
      { match: 'Sun', names: ['NAME Sun', 'Sun'] },
      { match: 'Moon', names: ['NAME Moon', 'Moon'] },
      { match: 'Mercury', names: ['NAME Mercury', 'Mercury'] },
      { match: 'Venus', names: ['NAME Venus', 'Venus'] },
      { match: 'Earth', names: ['NAME Earth', 'Earth'] },
      { match: 'Mars', names: ['NAME Mars', 'Mars'] },
      { match: 'Jupiter', names: ['NAME Jupiter', 'Jupiter'] },
      { match: 'Saturn', names: ['NAME Saturn', 'Saturn'] },
      { match: 'Uranus', names: ['NAME Uranus', 'Uranus'] },
      { match: 'Neptune', names: ['NAME Neptune', 'Neptune'] }
    ]
  },

  localSkySourceFromSweObj: function (obj, match) {
    if (!obj) {
      return undefined
    }
    const ss = Object.assign({}, obj.__orasSkySourceData || obj.jsonData || {})
    ss.match = match || ss.match || this.cleanupOneSkySourceName((ss.names && ss.names[0]) || obj.designations()[0], 5)
    ss.names = ss.names || obj.designations()
    ss.types = ss.types || (obj.type ? [obj.type] : ['SSO'])
    ss.model = ss.model || 'jpl_sso'
    ss.model_data = ss.model_data || {}
    ss.culturalNames = obj.culturalDesignations()
    return ss
  },

  localQueryResults: function (query, limit) {
    const results = []
    const exactLocalResult = this.lookupSkySourceLocallyByName(query)

    if (exactLocalResult) {
      results.push(exactLocalResult)
    }

    const localMatches = this.queryLocalSkySources(query, limit)
    for (const localMatch of localMatches) {
      if (!results.find(existing => existing.names[0] === localMatch.names[0])) {
        results.push(localMatch)
      }
    }

    return results.slice(0, limit || 10)
  },

  fetchOrasSkySearch: function (query) {
    const normalized = normalizeOrasSearchQuery(query)
    const searchUrl = buildOrasSearchUrl(normalized)

    if (!searchUrl) {
      return Promise.resolve({ results: [], recognizedQuery: false })
    }

    if (typeof fetch !== 'function') {
      return Promise.reject(new Error('fetch is not available'))
    }

    return fetch(searchUrl, {
      headers: {
        Accept: 'application/json'
      }
    }).then(response => {
      if (!response.ok) {
        throw new Error('ORAS sky search request failed with status ' + response.status)
      }
      return response.json()
    }).then(payload => {
      const data = payload && payload.data ? payload.data : {}
      const rawResults = Array.isArray(data.results) ? data.results : []
      return {
        recognizedQuery: Boolean(data.recognized_query),
        results: rawResults.map(toOrasSkySource).filter(Boolean)
      }
    })
  },

  fetchOrasSkySourceByIdentity: function ({ catalog, sourceId, model, time, lat, lng, elev }) {
    const lookupUrl = buildOrasObjectLookupUrl({ catalog, sourceId, model, time, lat, lng, elev })

    if (!lookupUrl) {
      return Promise.reject(new Error('Sky source identity is incomplete'))
    }

    if (typeof fetch !== 'function') {
      return Promise.reject(new Error('fetch is not available'))
    }

    return fetch(lookupUrl, {
      headers: {
        Accept: 'application/json'
      }
    }).then(response => {
      if (!response.ok) {
        throw new Error('ORAS sky object request failed with status ' + response.status)
      }
      return response.json()
    }).then(payload => {
      return toOrasSkySource(payload && payload.data ? payload.data : undefined)
    })
  },

  shouldPreferLocalSkySourceFallback: function () {
    if (typeof window === 'undefined' || !window.location) {
      return false
    }
    const hostname = window.location.hostname || ''
    return hostname === '127.0.0.1' || hostname === 'localhost'
  },

  lookupSkySourceLocallyByName: function (name) {
    const localResult = this.lookupLocalSkySourceByName(name)
    if (localResult) {
      return localResult
    }

    const $stel = Vue.prototype.$stel
    if (!$stel || !name) {
      return undefined
    }

    const candidates = [
      name,
      this.cleanupOneSkySourceName(name, 5),
      'NAME ' + name,
      '*' + ' ' + name,
      'M ' + name.replace(/^M\s*/i, ''),
      'NGC ' + name.replace(/^NGC\s*/i, ''),
      'IC ' + name.replace(/^IC\s*/i, '')
    ].filter(Boolean)

    const obj = candidates
      .map(candidate => String(candidate).trim())
      .filter((candidate, index, array) => candidate !== '' && array.indexOf(candidate) === index)
      .map(candidate => $stel.getObj(candidate))
      .find(Boolean)

    return this.localSkySourceFromSweObj(obj, name)
  },

  lookupLocalSkySourceByName: function (name) {
    const $stel = Vue.prototype.$stel
    if (!$stel || !name) {
      return undefined
    }
    const normalized = String(name).trim().toUpperCase().replace(/\s+/g, '')
    const entry = this.localSolarSystemCatalog().find(candidate => {
      return candidate.names.some(candidateName => candidateName.toUpperCase().replace(/\s+/g, '') === normalized) ||
        candidate.match.toUpperCase().replace(/\s+/g, '') === normalized
    })
    if (!entry) {
      return undefined
    }
    const obj = entry.names
      .map(candidateName => $stel.getObj(candidateName))
      .find(Boolean)
    return this.localSkySourceFromSweObj(obj, entry.match)
  },

  queryLocalSkySources: function (str, limit) {
    const $stel = Vue.prototype.$stel
    if (!$stel || !str) {
      return []
    }
    const normalized = String(str).trim().toUpperCase().replace(/\s+/g, '')
    if (!normalized) {
      return []
    }
    return this.localSolarSystemCatalog()
      .filter(candidate => {
        return candidate.match.toUpperCase().replace(/\s+/g, '').includes(normalized) ||
          candidate.names.some(candidateName => candidateName.toUpperCase().replace(/\s+/g, '').includes(normalized))
      })
      .map(candidate => {
        const obj = candidate.names
          .map(candidateName => $stel.getObj(candidateName))
          .find(Boolean)
        return this.localSkySourceFromSweObj(obj, candidate.match)
      })
      .filter(Boolean)
      .slice(0, limit || 10)
  },

  lookupSkySourceByName: function (name) {
    const normalized = normalizeOrasSearchQuery(name)
    if (!normalized) {
      return Promise.reject(new Error('Sky source name is required'))
    }

    const findLocalResult = () => {
      const localResult = this.lookupSkySourceLocallyByName(normalized)
      if (localResult) {
        return Promise.resolve(localResult)
      }
      return Promise.reject(new Error('Local sky source not found'))
    }

    return this.fetchOrasSkySearch(normalized).then(searchResponse => {
      if (searchResponse.results.length) {
        return searchResponse.results[0]
      }
      return findLocalResult()
    }, () => {
      return findLocalResult()
    })
  },

  querySkySources: function (str, limit) {
    limit = limit || 10
    const normalized = normalizeOrasSearchQuery(str)
    if (!normalized) {
      return Promise.resolve([])
    }

    const packResults = orasCatalogPacks.search(normalized, limit).map(toOrasSkySource).filter(Boolean)

    return this.fetchOrasSkySearch(normalized).then(searchResponse => {
      return this.mergeSkySourceResults(
        searchResponse.results,
        packResults,
        this.localQueryResults(normalized, limit)
      ).slice(0, limit)
    }, () => {
      return this.mergeSkySourceResults(packResults, this.localQueryResults(normalized, limit)).slice(0, limit)
    })
  },

  mergeSkySourceResults: function (...groups) {
    const results = []
    const identities = new Set()
    for (const group of groups) {
      for (const result of group || []) {
        const identity = [result.catalog, result.source_id, result.model]
          .map(value => String(value || '').trim().toLowerCase())
          .join('\u0000')
        const fallbackIdentity = String((result.names && result.names[0]) || result.match || '').trim().toLowerCase()
        const key = identity === '\u0000\u0000' ? fallbackIdentity : identity
        if (!key || identities.has(key)) continue
        identities.add(key)
        results.push(result)
      }
    }
    return results
  },

  skySourceMatchesIdentity: function (ss, identity) {
    if (!ss || !identity) {
      return false
    }
    const ssCatalog = String(ss.catalog || '').trim().toLowerCase()
    const ssSourceId = ss.source_id == null ? '' : String(ss.source_id).trim().toLowerCase()
    const ssModel = String(ss.model || '').trim().toLowerCase()

    return ssCatalog === String(identity.catalog || '').trim().toLowerCase() &&
      ssSourceId === String(identity.sourceId || '').trim().toLowerCase() &&
      ssModel === String(identity.model || '').trim().toLowerCase()
  },

  sweObj2SkySource: function (obj) {
    const names = obj.designations()
    const that = this

    const exactSelection = this.exactSkySourceSelection
    const currentSelection = Vue.prototype.$stel && Vue.prototype.$stel.core.selection
    const isCurrentSelection = currentSelection === obj || (currentSelection && obj && currentSelection.v === obj.v)
    if (exactSelection && isCurrentSelection) {
      exactSelection.culturalNames = obj.culturalDesignations()
      return Promise.resolve(exactSelection)
    }

    const buildLocalSkySource = function (fallbackName) {
      const ss = that.localSkySourceFromSweObj(obj, fallbackName || names[0])
      if (!ss) {
        return undefined
      }

      if (!ss.model_data) {
        ss.model_data = {}
      }

      for (const i in ss.names) {
        if (ss.names[i].startsWith('GAIA')) {
          ss.names[i] = ss.names[i].replace(/^GAIA /, 'Gaia DR2 ')
        }
      }

      ss.culturalNames = obj.culturalDesignations()
      return ss
    }

    if (obj.__orasSkySourceData && obj.__orasSkySourceData.catalog && obj.__orasSkySourceData.source_id && obj.__orasSkySourceData.model) {
      return Promise.resolve(buildLocalSkySource(obj.__orasSkySourceData.match || obj.__orasSkySourceData.display_name || names[0]))
    }

    if (!names || !names.length) {
      throw new Error("Can't find object without names")
    }

    // Several artifical satellites share the same common name, so we use
    // the unambiguous NORAD number instead
    for (const j in names) {
      if (names[j].startsWith('NORAD ')) {
        const tmpName = names[0]
        names[0] = names[j]
        names[j] = tmpName
      }
    }

    const printErr = function (n) {
      console.log("Couldn't find ORAS skysource data for name: " + n)
      return buildLocalSkySource(n)
    }

    return that.lookupSkySourceByName(names[0]).then(res => {
      return res
    }, () => {
      if (names.length === 1) return printErr(names)
      return that.lookupSkySourceByName(names[1]).then(res => {
        return res
      }, () => {
        if (names.length === 2) return printErr(names)
        return that.lookupSkySourceByName(names[2]).then(res => {
          return res
        }, () => {
          return printErr(names[2])
        })
      })
    }).then(res => {
      res.culturalNames = obj.culturalDesignations()
      return res
    })
  },

  setSweObjAsSelection: function (obj, exactSkySource) {
    const $stel = Vue.prototype.$stel
    this.exactSkySourceSelection = exactSkySource || undefined
    $stel.core.selection = obj
    $stel.pointAndLock(obj)
  },

  // Get data for a SkySource from wikipedia
  getSkySourceSummaryFromWikipedia: function (ss) {
    const aliases = []
    for (const i in (ss.names || [])) {
      aliases.push(String(ss.names[i]).trim())
    }
    if (ss.display_name) aliases.push(String(ss.display_name).trim())
    if (ss.source_id) aliases.push('Gaia DR2 ' + String(ss.source_id).trim())
    if (!aliases.length) return Promise.reject(new Error('No aliases available for local summary lookup'))

    const url = ORAS_OBJECT_MEDIA_ROOT + '/summaries/index.json'
    return fetch(url).then(res => {
      if (!res.ok) throw new Error('No local summary for selection')
      return res.json()
    }).then(index => {
      const keyMap = index && index.alias_to_file ? index.alias_to_file : {}
      for (const alias of aliases) {
        const normalized = alias.toLowerCase()
        if (keyMap[normalized]) {
          return fetch(ORAS_OBJECT_MEDIA_ROOT + '/summaries/' + keyMap[normalized]).then(r => {
            if (!r.ok) throw new Error('Failed to read local summary file')
            return r.json()
          })
        }
      }
      throw new Error('No local summary for selection')
    })
  },

  getGeolocation: function () {
    console.log('Getting geolocalization')
    if (!navigator.geolocation) {
      return Promise.reject(new Error('Cannot detect position'))
    }
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(function (position) {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
      }, function () {
        reject(new Error('Cannot detect position'))
      }, { enableHighAccuracy: true })
    })
  },

  delay: function (t, v) {
    return new Promise(function (resolve) {
      setTimeout(resolve.bind(null, v), t)
    })
  },

  geoCodePosition: function (pos, ctx) {
    console.log('Geocoding position... ')
    const ll = ctx.$t('Lat {0}° Lon {1}°', [pos.lat.toFixed(3), pos.lng.toFixed(3)])
    var loc = {
      short_name: pos.accuracy > 500 ? ctx.$t('Near {0}', [ll]) : ll,
      country: 'Unknown',
      lng: pos.lng,
      lat: pos.lat,
      alt: pos.alt ? pos.alt : 0,
      accuracy: pos.accuracy,
      street_address: ''
    }
    return Promise.resolve(loc)
  },

  getDistanceFromLatLonInM: function (lat1, lon1, lat2, lon2) {
    var deg2rad = function (deg) {
      return deg * (Math.PI / 180)
    }
    var R = 6371000 // Radius of the earth in m
    var dLat = deg2rad(lat2 - lat1)
    var dLon = deg2rad(lon2 - lon1)
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    var d = R * c // Distance in m
    return d
  },

  // Look for the next time starting from now on when the night Sky is visible
  // i.e. when sun is more than 10 degree below horizon.
  // If no such time was found (e.g. in a northern country in summer),
  // we default to current time.
  getTimeAfterSunset: function (stel) {
    const sun = stel.getObj('NAME Sun')
    const obs = stel.observer.clone()
    const utc = Math.floor(obs.utc * 24 * 60 / 5) / (24 * 60 / 5)
    let i
    for (i = 0; i < 24 * 60 / 5 + 1; i++) {
      obs.utc = utc + 1.0 / (24 * 60) * (i * 5)
      const sunRadec = sun.getInfo('RADEC', obs)
      const azalt = stel.convertFrame(obs, 'ICRF', 'OBSERVED', sunRadec)
      const alt = stel.anpm(stel.c2s(azalt)[1])
      if (alt < -13 * Math.PI / 180) {
        break
      }
    }
    if (i === 0 || i === 24 * 60 / 5 + 1) {
      return stel.observer.utc
    }
    return obs.utc
  },

  // Get the list of circumpolar stars in a given magnitude range
  //
  // Arguments:
  //   obs      - An observer.
  //   maxMag   - The maximum magnitude above which objects are discarded.
  //   filter   - a function called for each object returning false if the
  //              object must be filtered out.
  //
  // Return:
  //   An array SweObject. It is the responsibility of the caller to properly
  //   destroy all the objects of the list when they are not needed, by calling
  //   obj.destroy() on each of them.
  //
  // Example code:
  //   // Return all cicumpolar stars between mag -2 and 4
  //   let res = swh.getCircumpolarStars(this.$stel.observer, -2, 4)
  //   // Do something with the stars
  //   console.log(res.length)
  //   // Destroy the objects (don't forget this line!)
  //   res.map(e => e.destroy())
  getCircumpolarStars: function (obs, minMag, maxMag) {
    const $stel = Vue.prototype.$stel
    const filter = function (obj) {
      if (obj.getInfo('vmag', obs) <= minMag) {
        return false
      }
      const posJNOW = $stel.convertFrame(obs, 'ICRF', 'JNOW', obj.getInfo('radec'))
      const radecJNOW = $stel.c2s(posJNOW)
      const decJNOW = $stel.anpm(radecJNOW[1])
      if (obs.latitude >= 0) {
        return decJNOW >= Math.PI / 2 - obs.latitude
      } else {
        return decJNOW <= -Math.PI / 2 + obs.latitude
      }
    }
    return $stel.core.stars.listObjs(obs, maxMag, filter)
  },

  circumpolarMask: undefined,
  showCircumpolarMask: function (obs, show) {
    if (show === undefined) {
      show = true
    }
    const layer = Vue.prototype.$skyHintsLayer
    const $stel = Vue.prototype.$stel
    if (this.circumpolarMask) {
      layer.remove(this.circumpolarMask)
      this.circumpolarMask = undefined
    }
    if (show) {
      const diam = 2.0 * Math.PI - Math.abs(obs.latitude) * 2
      const shapeParams = {
        pos: [0, 0, obs.latitude > 0 ? -1 : 1, 0],
        frame: $stel.FRAME_JNOW,
        size: [diam, diam],
        color: [0.1, 0.1, 0.1, 0.8],
        border_color: [0.1, 0.1, 0.6, 1]
      }
      this.circumpolarMask = layer.add('circle', shapeParams)
    }
  }
}

export default swh
