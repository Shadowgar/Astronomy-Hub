import logger from '../logger.js'

// Adapter to map provider payloads to the UI-friendly Conditions shape.
// This is a minimal stub: it returns the payload unchanged but emits a
// validation warning via the dev logger when the payload looks malformed.

export function toUi(payload) {
  if (!payload || typeof payload !== 'object') {
    // Log a validation warning when payload is missing or not an object.
    try {
      logger.warn('adapter.conditions', 'validation_warning', { reason: 'invalid_payload', type: typeof payload })
    } catch (e) {
      // swallow logger errors in non-dev environments
    }
    return {}
  }

  // No transformation yet — return payload as-is.
  return payload
}

export default { toUi }
