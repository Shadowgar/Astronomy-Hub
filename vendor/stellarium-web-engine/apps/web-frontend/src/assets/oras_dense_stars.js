export const ORAS_DENSE_STARS_ROOT = '/oras-sky-engine/skydata/dense-star-tiles'
export const OFF_PROFILE = 'off'
export const DEFAULT_PROFILE = 'visual-default'
export const PROFILE_STORAGE_KEY = 'orasDenseStarsProfile'
const LEGACY_ENABLED_STORAGE_KEY = 'orasDenseStarsEnabled'

function normalizeProfile (profile) {
  const value = String(profile || '').trim()
  return value || DEFAULT_PROFILE
}

export function defaultDenseStarsProfile () {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY)
      if (stored) return normalizeProfile(stored)
      if (window.localStorage.getItem(LEGACY_ENABLED_STORAGE_KEY) === '0') return OFF_PROFILE
    }
  } catch (error) {
  }
  return DEFAULT_PROFILE
}

export function persistDenseStarsProfile (profile) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, normalizeProfile(profile))
    }
  } catch (error) {
  }
}

function emptySnapshot (phase = 'idle') {
  return {
    phase,
    mounted: false,
    activeProfile: defaultDenseStarsProfile(),
    defaultProfile: DEFAULT_PROFILE,
    profile: undefined,
    profiles: {},
    releaseVersion: null,
    generatedAt: null,
    renderingPath: 'native_swe_star_tiles',
    sourceCatalogs: {},
    sourceAttribution: [],
    starCount: 0,
    tileCount: 0,
    magnitudeLimit: null,
    tileOrder: null,
    labelMode: 'suppressed',
    error: null
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
      sourceAttribution: (nextSnapshot.sourceAttribution || []).map(source => Object.assign({}, source)),
      profiles: Object.assign({}, nextSnapshot.profiles || {})
    })
    listeners.forEach(listener => listener(getSnapshot()))
    return getSnapshot()
  }

  function getSnapshot () {
    return Object.assign({}, snapshot, {
      sourceCatalogs: Object.assign({}, snapshot.sourceCatalogs || {}),
      sourceAttribution: (snapshot.sourceAttribution || []).map(source => Object.assign({}, source)),
      profiles: Object.assign({}, snapshot.profiles || {})
    })
  }

  async function load () {
    if (loadingPromise) return loadingPromise
    loadingPromise = loadRelease().finally(() => { loadingPromise = undefined })
    return loadingPromise
  }

  async function loadRelease () {
    publish(Object.assign(emptySnapshot('loading'), {
      mounted: snapshot.mounted,
      activeProfile: snapshot.activeProfile
    }))
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
      const profiles = Object.assign({}, manifest.profiles || {})
      const activeProfile = resolveActiveProfile(snapshot.activeProfile, profiles)
      const profile = profiles[activeProfile]
      return publish({
        phase: activeProfile === OFF_PROFILE ? 'off' : 'loaded',
        mounted: true,
        activeProfile,
        defaultProfile: String(manifest.default_profile || DEFAULT_PROFILE),
        profile: profile ? Object.assign({}, profile) : undefined,
        profiles,
        releaseVersion: String(manifest.release_version),
        generatedAt: manifest.generated_at || null,
        renderingPath: 'native_swe_star_tiles',
        sourceCatalogs: Object.assign({}, (profile && profile.source_catalogs) || manifest.source_catalogs || {}),
        sourceAttribution: Array.isArray(manifest.source_attribution) ? manifest.source_attribution.map(source => Object.assign({}, source)) : [],
        starCount: Number(profile && profile.star_count) || 0,
        tileCount: Number(profile && profile.tile_count) || 0,
        magnitudeLimit: Number(profile && profile.magnitude_limit),
        tileOrder: Number(profile && profile.tile_order),
        labelMode: String((profile && profile.label_mode) || 'suppressed'),
        error: null
      })
    } catch (error) {
      return publish(Object.assign(emptySnapshot('failed'), {
        mounted: true,
        error: error.message
      }))
    }
  }

  function setProfile (profile) {
    const activeProfile = normalizeProfile(profile)
    persistDenseStarsProfile(activeProfile)
    const profiles = snapshot.profiles || {}
    const selectedProfile = profiles[activeProfile]
    publish(Object.assign(getSnapshot(), {
      activeProfile,
      profile: selectedProfile ? Object.assign({}, selectedProfile) : undefined,
      phase: activeProfile === OFF_PROFILE ? 'off' : (snapshot.mounted ? 'loaded' : snapshot.phase),
      starCount: Number(selectedProfile && selectedProfile.star_count) || 0,
      tileCount: Number(selectedProfile && selectedProfile.tile_count) || 0,
      magnitudeLimit: Number(selectedProfile && selectedProfile.magnitude_limit),
      tileOrder: Number(selectedProfile && selectedProfile.tile_order),
      labelMode: String((selectedProfile && selectedProfile.label_mode) || 'suppressed')
    }))
  }

  function getSurveyRoot () {
    const profile = snapshot.profile
    return profile && profile.path ? root + '/' + String(profile.path).replace(/^\/+/, '') : root
  }

  function getSurveyKey () {
    return 'oras-dense-stars-' + snapshot.activeProfile
  }

  function isReadyForNativeRegistration () {
    return snapshot.phase === 'loaded' &&
      snapshot.mounted &&
      snapshot.activeProfile !== OFF_PROFILE &&
      !!snapshot.profile &&
      snapshot.renderingPath === 'native_swe_star_tiles'
  }

  function subscribe (listener) {
    listeners.add(listener)
    listener(getSnapshot())
    return () => listeners.delete(listener)
  }

  return { getSnapshot, getSurveyKey, getSurveyRoot, isReadyForNativeRegistration, load, setProfile, subscribe }
}

function resolveActiveProfile (profile, profiles) {
  const value = normalizeProfile(profile)
  if (value === OFF_PROFILE) return OFF_PROFILE
  if (profiles[value]) return value
  if (profiles[DEFAULT_PROFILE]) return DEFAULT_PROFILE
  return Object.keys(profiles)[0] || OFF_PROFILE
}

function validateManifest (manifest) {
  if (!manifest || manifest.schema_version !== 1) throw new Error('unsupported dense star manifest schema')
  if (manifest.rendering_path !== 'native_swe_star_tiles') throw new Error('unsupported dense star rendering path')
  if (manifest.source_id_type !== 'string') throw new Error('dense star source IDs must remain strings')
  if (manifest.default_profile !== DEFAULT_PROFILE) throw new Error('dense star default profile must be visual-default')
  if (!manifest.profiles || typeof manifest.profiles !== 'object') throw new Error('dense star profiles are required')
  for (const [profileId, profile] of Object.entries(manifest.profiles)) {
    if (!profile || !profile.path) throw new Error('dense star profile path is required: ' + profileId)
    if (profile.label_mode !== 'suppressed') throw new Error('dense star profile labels must be suppressed: ' + profileId)
    if (!Number.isFinite(Number(profile.star_count)) || Number(profile.star_count) < 1) throw new Error('dense star profile count must be positive: ' + profileId)
    if (!Number.isFinite(Number(profile.tile_count)) || Number(profile.tile_count) < 1) throw new Error('dense star profile tile count must be positive: ' + profileId)
  }
}

export const orasDenseStars = createOrasDenseStarsManager()
