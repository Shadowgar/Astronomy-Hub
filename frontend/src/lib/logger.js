/* Minimal dev-only logger for Phase 1
 * - Enabled only when import.meta.env.DEV === true AND local flag is set
 *   (URL ?devlog=1 or localStorage astroHub.devLog === '1')
 * - Exposes debug/info/warn/error, getEntries, clear
 * - Keeps an in-memory circular buffer (max 200 entries)
 * - Console output is single-line JSON.stringify(entry)
 */

const MAX_ENTRIES = 200

function readLocalFlag() {
  try {
    if (typeof window === 'undefined') return false
    const params = new URLSearchParams(window.location.search)
    if (params.get('devlog') === '1') return true
    try {
      if (window.localStorage && window.localStorage.getItem('astroHub.devLog') === '1') return true
    } catch (e) {
      // ignore localStorage access errors
    }
    return false
  } catch (e) {
    return false
  }
}

const isEnvDev = typeof import.meta !== 'undefined' && Boolean(import.meta.env && import.meta.env.DEV)
const isEnabled = isEnvDev && readLocalFlag()

let _seq = 0
const _buf = []

function _push(entry) {
  if (_buf.length >= MAX_ENTRIES) _buf.shift()
  _buf.push(entry)
}

function _makeEntry(lvl, cat, event, data, requestId) {
  _seq += 1
  const e = {
    ts: new Date().toISOString(),
    seq: _seq,
    lvl,
    cat,
    event,
  }
  if (data !== undefined) e.data = data
  if (requestId !== undefined) e.requestId = requestId
  return e
}

function _consoleOut(entry) {
  try {
    // single-line JSON
    console.log(JSON.stringify(entry))
  } catch (e) {
    // swallow console errors in dev logger
  }
}

function _noop() {}

const logger = {
  isEnabled,
  debug: _noop,
  info: _noop,
  warn: _noop,
  error: _noop,
  getEntries: () => _buf.slice(),
  clear: () => { _buf.length = 0 },
}

if (isEnabled) {
  logger.debug = (cat, event, data, requestId) => {
    const entry = _makeEntry('debug', cat, event, data, requestId)
    _push(entry)
    _consoleOut(entry)
  }
  logger.info = (cat, event, data, requestId) => {
    const entry = _makeEntry('info', cat, event, data, requestId)
    _push(entry)
    _consoleOut(entry)
  }
  logger.warn = (cat, event, data, requestId) => {
    const entry = _makeEntry('warn', cat, event, data, requestId)
    _push(entry)
    _consoleOut(entry)
  }
  logger.error = (cat, event, data, requestId) => {
    const entry = _makeEntry('error', cat, event, data, requestId)
    _push(entry)
    _consoleOut(entry)
  }
}

export default logger
