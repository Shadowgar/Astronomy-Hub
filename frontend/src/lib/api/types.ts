export type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue>

export interface ApiRequestConfig extends Omit<RequestInit, 'body'> {
  body?: BodyInit | Record<string, unknown> | null
  query?: QueryParams
  requestId?: string
  propagateRequestId?: boolean
}
