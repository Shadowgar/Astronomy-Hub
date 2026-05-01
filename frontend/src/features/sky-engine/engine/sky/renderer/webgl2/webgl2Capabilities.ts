export interface WebGL2SupportStatus {
  readonly supported: boolean
  readonly reason: string | null
}

type CanvasLike = {
  getContext: (contextId: string, options?: Record<string, unknown>) => unknown
}

export function isWebGL2ContextLike(value: unknown): value is WebGL2RenderingContext {
  if (!value || typeof value !== 'object') {
    return false
  }

  const maybeContext = value as Record<string, unknown>
  return (
    typeof maybeContext.viewport === 'function' &&
    typeof maybeContext.clearColor === 'function' &&
    typeof maybeContext.clear === 'function'
  )
}

export function detectWebGL2Support(input?: {
  canvas?: HTMLCanvasElement | null
}): WebGL2SupportStatus {
  const canvas = input?.canvas
  if (canvas && typeof canvas.getContext === 'function') {
    const context = canvas.getContext('webgl2')
    if (isWebGL2ContextLike(context)) {
      return { supported: true, reason: null }
    }
    return {
      supported: false,
      reason: 'canvas_webgl2_unavailable',
    }
  }

  if (typeof document === 'undefined') {
    return {
      supported: false,
      reason: 'document_unavailable',
    }
  }

  const candidate = document.createElement('canvas')
  const context = candidate.getContext('webgl2')
  if (!isWebGL2ContextLike(context)) {
    return {
      supported: false,
      reason: 'webgl2_unavailable',
    }
  }

  return {
    supported: true,
    reason: null,
  }
}

export function createWebGL2ContextFromCanvas(canvas: CanvasLike | null | undefined): WebGL2RenderingContext | null {
  if (!canvas || typeof canvas.getContext !== 'function') {
    return null
  }

  const context = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: false,
  })

  return isWebGL2ContextLike(context) ? context : null
}
