export const ORAS_DENSE_STARS_ROOT = '/oras-sky-engine/skydata/dense-star-tiles'
const STORAGE_KEY = 'orasDenseStarsEnabled'

function emptySnapshot (phase = 'idle') {
  return {
    phase,
    mounted: false,
    enabled: defaultDenseStarsEnabled(),
    releaseVersion: null,
    generatedAt: null,
    renderingPath: 'native_swe_star_tiles',
    sourceCatalogs: {},
    sourceAttribution: [],
    starCount: 0,
    tileCount: 0,
    magnitudeLimit: null,
    tileOrder: null,
    error: null
  }
}

export function defaultDenseStarsEnabled () {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(STORAGE_KEY) !== '0'
    }
  } catch (error) {
  }
  return true
}

export function persistDenseStarsEnabled (enabled) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
    }
  } catch (error) {
  }
}

export function createOrasDenseStarsManager (options = {}) {
  const root = String(options.root || ORAS_DENSE_STARS_ROOT).replace(/\/$/, '')
  const fetchImpl = options.fetchImpl || (typeof window !== 'undefined' && typeof window.fetch === 'function' ? window.fetch.bind(window) : undefined)
  let snapshot = emptySnapshot()
  let loadingPromise
  const listeners = new Set()

  function publish (nextSnapshot) {
    snapshot = Object.assign({}, nextSnapshot, {
      sourceCatalogs: Object.assign({}, nextSnapshot.sourceCatalogs || {}),
      sourceAttribution: (nextSnapshot.sourceAttribution || []).map(source => Object.assign({}, source))
    })
    listeners.forEach(listener => listener(getSnapshot()))
    return getSnapshot()
  }

  function getSnapshot () {
    return Object.assign({}, snapshot, {
      sourceCatalogs: Object.assign({}, snapshot.sourceCatalogs || {}),
      sourceAttribution: (snapshot.sourceAttribution || []).map(source => Object.assign({}, source))
    })
  }

  async function load () {
    if (loadingPromise) return loadingPromise
    loadingPromise = loadRelease().finally(() => { loadingPromise = undefined })
    return loadingPromise
  }

  async function loadRelease () {
    publish(Object.assign(emptySnapshot('loading'), { mounted: snapshot.mounted, enabled: snapshot.enabled }))
    if (typeof fetchImpl !== 'function') {
      return publish(emptySnapshot('not-mounted'))
    }

    let response
    try {
      response = await fetchImpl(root + '/manifest.json', { cache: 'no-store' })
    } catch (error) {
      return publish(emptySnapshot('not-mounted'))
    }
    if (!response || !response.ok) {
      return publish(emptySnapshot('not-mounted'))
    }

    try {
      const manifest = JSON.parse(await response.text())
      validateManifest(manifest)
      return publish({
        phase: snapshot.enabled ? 'loaded' : 'off',
        mounted: true,
        enabled: snapshot.enabled,
        releaseVersion: String(manifest.release_version),
        generatedAt: manifest.generated_at || null,
        renderingPath: 'native_swe_star_tiles',
        sourceCatalogs: Object.assign({}, manifest.source_catalogs || {}),
        sourceAttribution: Array.isArray(manifest.source_attribution) ? manifest.source_attribution.map(source => Object.assign({}, source)) : [],
        starCount: Number(manifest.star_count) || 0,
        tileCount: Number(manifest.tile_count) || 0,
        magnitudeLimit: Number(manifest.magnitude_limit),
        tileOrder: Number(manifest.tile_order),
        error: null
      })
    } catch (error) {
      return publish(Object.assign(emptySnapshot('failed'), {
        mounted: true,
        error: error.message
      }))
    }
  }

  function setEnabled (enabled) {
    persistDenseStarsEnabled(enabled)
    publish(Object.assign(getSnapshot(), {
      enabled,
      phase: enabled ? (snapshot.mounted ? 'loaded' : snapshot.phase) : 'off'
    }))
  }

  function getSurveyRoot () {
    return root
  }

  function isReadyForNativeRegistration () {
    return snapshot.mounted && snapshot.enabled && snapshot.renderingPath === 'native_swe_star_tiles'
  }

  function subscribe (listener) {
    listeners.add(listener)
    listener(getSnapshot())
    return () => listeners.delete(listener)
  }

  return { getSnapshot, getSurveyRoot, isReadyForNativeRegistration, load, setEnabled, subscribe }
}

function validateManifest (manifest) {
  if (!manifest || manifest.schema_version !== 1) throw new Error('unsupported dense star manifest schema')
  if (manifest.rendering_path !== 'native_swe_star_tiles') throw new Error('unsupported dense star rendering path')
  if (manifest.source_id_type !== 'string') throw new Error('dense star source IDs must remain strings')
  if (!Number.isFinite(Number(manifest.star_count)) || Number(manifest.star_count) < 1) throw new Error('dense star count must be positive')
  if (!Number.isFinite(Number(manifest.tile_count)) || Number(manifest.tile_count) < 1) throw new Error('dense star tile count must be positive')
}

export const orasDenseStars = createOrasDenseStarsManager()
