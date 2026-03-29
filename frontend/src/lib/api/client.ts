import { ApiRequestConfig, QueryParams, QueryValue } from './types'
import { ApiError, buildApiError } from './errors'

function resolveApiBaseUrl(): string {
  const fromWindow =
    typeof window !== 'undefined'
      ? (window as Window & { __API_BASE_URL__?: string }).__API_BASE_URL__
      : undefined
  return (fromWindow || '/api/v1').replace(/\/+$/, '')
}

export const API_BASE_URL = resolveApiBaseUrl()

function buildUrl(path: string, query?: QueryParams): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${API_BASE_URL}${normalizedPath}`, window.location.origin)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      url.searchParams.set(key, String(value as QueryValue))
    })
  }

  return `${url.pathname}${url.search}`
}

function createRequestId(): string {
  const randomId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `frontend-${randomId}`
}

function normalizeBody(body: ApiRequestConfig['body']): BodyInit | null | undefined {
  if (body === undefined || body === null) return body
  if (
    typeof body === 'string' ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  ) {
    return body
  }
  return JSON.stringify(body)
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  config: ApiRequestConfig = {}
): Promise<T> {
  const {
    body,
    query,
    requestId,
    propagateRequestId = true,
    headers,
    ...rest
  } = config

  const finalHeaders = new Headers(headers || {})
  if (!finalHeaders.has('Accept')) {
    finalHeaders.set('Accept', 'application/json')
  }

  const normalizedBody = normalizeBody(body)
  if (normalizedBody && typeof body === 'object' && !(body instanceof FormData)) {
    if (!finalHeaders.has('Content-Type')) {
      finalHeaders.set('Content-Type', 'application/json')
    }
  }

  if (propagateRequestId) {
    finalHeaders.set('X-Request-ID', requestId || createRequestId())
  }

  const response = await fetch(buildUrl(path, query), {
    ...rest,
    headers: finalHeaders,
    body: normalizedBody,
  })

  const payload = await parseJsonSafe(response)
  if (!response.ok) {
    const error = buildApiError(response.status, payload)
    if (!error.requestId) {
      error.requestId = response.headers.get('x-request-id')
    }
    throw error
  }

  return payload as T
}

export function apiGet<T = unknown>(path: string, config: Omit<ApiRequestConfig, 'method'> = {}) {
  return apiRequest<T>(path, { ...config, method: 'GET' })
}

export function apiPost<T = unknown>(
  path: string,
  body?: ApiRequestConfig['body'],
  config: Omit<ApiRequestConfig, 'method' | 'body'> = {}
) {
  return apiRequest<T>(path, { ...config, method: 'POST', body })
}

export type { ApiError }
