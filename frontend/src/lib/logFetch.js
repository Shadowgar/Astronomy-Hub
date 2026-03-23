import logger from './logger'

// Minimal fetch wrapper that logs request/response/error when logger is enabled.
export default async function logFetch(input, init) {
  // If logger not enabled, behave exactly like native fetch
  if (!logger || !logger.isEnabled) return fetch(input, init)

  const method = (init && init.method) || 'GET'
  const url = typeof input === 'string' ? input : (input && input.url) || String(input)
  const requestId = `req-${Date.now()}-${Math.floor(Math.random() * 90000 + 10000)}`

  try {
    logger.info('api', 'request', { method, url, requestId })
  } catch (e) {
    // ignore logger failures
  }

  const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
  try {
    const resp = await fetch(input, init)
    const duration = Math.round(((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - start)
    try {
      logger.info('api', 'response', { requestId, status: resp.status, duration })
    } catch (e) {}
    return resp
  } catch (err) {
    const duration = Math.round(((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - start)
    try {
      logger.error('api', 'error', { requestId, message: err && err.message, duration })
    } catch (e) {}
    throw err
  }
}
