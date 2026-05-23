export interface ApiErrorOptions {
  status: number
  code?: string
  requestId?: string | null
  details?: unknown
}

export class ApiError extends Error {
  status: number
  code?: string
  requestId?: string | null
  details?: unknown

  constructor(message: string, options: ApiErrorOptions) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code
    this.requestId = options.requestId
    this.details = options.details
  }
}

export function buildApiError(status: number, payload: unknown, fallbackMessage = 'request failed'): ApiError {
  const data = payload as Record<string, unknown> | null
  const errorObj =
    data && typeof data === 'object' && data.error && typeof data.error === 'object'
      ? (data.error as Record<string, unknown>)
      : null

  const message =
    (errorObj?.message as string | undefined) ||
    (data?.message as string | undefined) ||
    fallbackMessage
  const code = errorObj?.code as string | undefined
  const requestId =
    (errorObj?.request_id as string | undefined) ||
    (data?.request_id as string | undefined) ||
    null

  return new ApiError(message, {
    status,
    code,
    requestId,
    details: payload,
  })
}
