export const ORAS_CATALOG_PACKS_ROOT = '/oras-sky-engine/skydata/catalog-packs'

function emptySnapshot (phase = 'idle') {
  return {
    phase,
    mounted: false,
    releaseVersion: null,
    generatedAt: null,
    objectCount: 0,
    packs: []
  }
}

export function createOrasCatalogPackManager (options = {}) {
  const root = String(options.root || ORAS_CATALOG_PACKS_ROOT).replace(/\/$/, '')
  const fetchImpl = options.fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : undefined)
  const digestImpl = options.digestImpl || digestText
  let snapshot = emptySnapshot()
  let records = []
  let searchCandidates = []
  let loadingPromise
  const listeners = new Set()

  function publish (nextSnapshot) {
    snapshot = Object.assign({}, nextSnapshot, {
      packs: (nextSnapshot.packs || []).map(pack => Object.assign({}, pack))
    })
    listeners.forEach(listener => listener(getSnapshot()))
    return getSnapshot()
  }

  function getSnapshot () {
    return Object.assign({}, snapshot, {
      packs: snapshot.packs.map(pack => Object.assign({}, pack))
    })
  }

  async function load () {
    if (loadingPromise) return loadingPromise
    loadingPromise = loadRelease().finally(() => { loadingPromise = undefined })
    return loadingPromise
  }

  async function loadRelease () {
    publish(Object.assign(emptySnapshot('loading'), { mounted: snapshot.mounted }))
    records = []
    searchCandidates = []
    if (typeof fetchImpl !== 'function') {
      return publish(emptySnapshot('not-mounted'))
    }

    let manifestResponse
    try {
      manifestResponse = await fetchImpl(root + '/manifest.json', { cache: 'no-store' })
    } catch (error) {
      return publish(emptySnapshot('not-mounted'))
    }
    if (!manifestResponse || !manifestResponse.ok) {
      return publish(emptySnapshot('not-mounted'))
    }

    let manifest
    try {
      manifest = JSON.parse(await manifestResponse.text())
      validateManifest(manifest)
    } catch (error) {
      return publish(Object.assign(emptySnapshot('failed'), {
        mounted: true,
        packs: [{ packId: 'manifest', label: 'Catalog manifest', status: 'failed', error: error.message }]
      }))
    }

    const packStatuses = []
    for (const pack of manifest.packs) {
      const status = await loadPack(pack)
      packStatuses.push(status)
    }
    const loadedCount = packStatuses.reduce((total, pack) => total + pack.loadedObjectCount, 0)
    return publish({
      phase: packStatuses.some(pack => pack.status === 'failed') ? 'degraded' : 'loaded',
      mounted: true,
      releaseVersion: String(manifest.release_version),
      generatedAt: manifest.generated_at || null,
      objectCount: loadedCount,
      packs: packStatuses
    })
  }

  async function loadPack (pack) {
    const status = {
      packId: String(pack.pack_id),
      label: String(pack.label || pack.pack_id),
      category: String(pack.category || 'unknown'),
      version: String(pack.version || ''),
      generatedAt: pack.generated_at || null,
      declaredObjectCount: Number(pack.object_count) || 0,
      loadedObjectCount: 0,
      sources: Array.isArray(pack.sources) ? pack.sources.map(source => Object.assign({}, source)) : [],
      status: 'loaded',
      error: null
    }
    const packRecords = []
    try {
      for (const chunk of pack.chunks || []) {
        const chunkResponse = await fetchImpl(root + '/' + chunk.path, { cache: 'no-store' })
        if (!chunkResponse || !chunkResponse.ok) throw new Error('chunk request failed: ' + chunk.path)
        const text = await chunkResponse.text()
        const byteSize = new TextEncoder().encode(text).byteLength
        if (byteSize !== Number(chunk.byte_size)) throw new Error('byte size mismatch: ' + chunk.path)
        const digest = await digestImpl(text)
        if (digest !== chunk.sha256) throw new Error('checksum mismatch: ' + chunk.path)
        const chunkRecords = text.split('\n').filter(Boolean).map(line => JSON.parse(line))
        if (chunkRecords.length !== Number(chunk.object_count)) {
          throw new Error('object count mismatch: ' + chunk.path)
        }
        chunkRecords.forEach(record => packRecords.push(validateRecord(record, pack)))
      }
      if (packRecords.length !== status.declaredObjectCount) throw new Error('pack object count mismatch')
      const existingIdentities = new Set(records.map(identityKey))
      const packIdentities = packRecords.map(identityKey)
      if (new Set(packIdentities).size !== packIdentities.length || packIdentities.some(key => existingIdentities.has(key))) {
        throw new Error('duplicate catalog identity')
      }
      records.push(...packRecords)
      searchCandidates.push(...packRecords.map(record => ({
        record,
        aliases: recordAliases(record).map(normalizeSearchText)
      })))
      status.loadedObjectCount = packRecords.length
    } catch (error) {
      status.status = 'failed'
      status.error = error.message
    }
    return status
  }

  function search (query, limit = 10) {
    const normalizedQuery = normalizeSearchText(query)
    if (!normalizedQuery || limit < 1) return []
    return searchCandidates
      .map(candidate => ({
        record: candidate.record,
        score: candidate.aliases.reduce((best, alias) => {
          if (alias === normalizedQuery) return Math.max(best, 4)
          if (alias.startsWith(normalizedQuery)) return Math.max(best, 3)
          if (normalizedQuery.length >= 3 && alias.includes(normalizedQuery)) return Math.max(best, 2)
          return best
        }, 0)
      }))
      .filter(candidate => candidate.score > 0)
      .sort((a, b) => b.score - a.score || magnitude(a.record) - magnitude(b.record) || a.record.display_name.localeCompare(b.record.display_name))
      .slice(0, limit)
      .map(candidate => Object.assign({}, candidate.record))
  }

  function find (identity) {
    const key = identityKey({
      catalog: identity && identity.catalog,
      source_id: identity && (identity.sourceId == null ? identity.source_id : identity.sourceId),
      model: identity && identity.model
    })
    const match = records.find(record => identityKey(record) === key)
    return match ? Object.assign({}, match) : undefined
  }

  function subscribe (listener) {
    listeners.add(listener)
    listener(getSnapshot())
    return () => listeners.delete(listener)
  }

  return { load, search, find, subscribe, getSnapshot }
}

function validateManifest (manifest) {
  if (!manifest || manifest.schema_version !== 1) throw new Error('unsupported catalog manifest schema')
  if (!Array.isArray(manifest.packs)) throw new Error('catalog manifest packs must be a list')
  if (!manifest.release_version) throw new Error('catalog release version is required')
}

function validateRecord (record, pack) {
  if (!record || typeof record !== 'object') throw new Error('catalog record must be an object')
  for (const field of ['catalog', 'source_id', 'model', 'display_name', 'category']) {
    if (typeof record[field] !== 'string' || !record[field].trim()) {
      throw new Error('catalog record identity fields must be strings')
    }
  }
  if (!Array.isArray(record.source_attribution) || !record.source_attribution.length) {
    throw new Error('catalog record source attribution is required')
  }
  if (!Number.isFinite(Number(record.ra)) || !Number.isFinite(Number(record.dec))) {
    throw new Error('catalog record coordinates are required')
  }
  return Object.assign({}, record, {
    source_id: String(record.source_id),
    ra: Number(record.ra),
    dec: Number(record.dec),
    pack_id: String(pack.pack_id),
    pack_version: String(pack.version),
    pack_sources: Array.isArray(pack.sources) ? pack.sources.map(source => Object.assign({}, source)) : [],
    indexed: true,
    status: 'indexed',
    provenance: { source_key: 'oras_catalog_pack', pack_id: String(pack.pack_id), pack_version: String(pack.version) }
  })
}

function recordAliases (record) {
  return uniqueStrings([
    record.display_name,
    record.source_id,
    record.catalog + ' ' + record.source_id,
    ...(record.names || []),
    ...(record.aliases || []),
    ...(record.common_names || []),
    ...(record.catalog_ids || [])
  ])
}

function identityKey (record) {
  return [record.catalog, record.source_id, record.model].map(value => String(value || '').trim().toLowerCase()).join('\u0000')
}

function normalizeSearchText (value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function uniqueStrings (values) {
  return values.map(value => String(value || '').trim()).filter((value, index, all) => value && all.indexOf(value) === index)
}

function magnitude (record) {
  const value = Number(record.magnitude)
  return Number.isFinite(value) ? value : 99
}

async function digestText (text) {
  if (!globalThis.crypto || !globalThis.crypto.subtle) throw new Error('Web Crypto is unavailable')
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, '0')).join('')
}

export const orasCatalogPacks = createOrasCatalogPackManager()
