import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api/client'
import type { QueryParams } from '../../lib/api/types'

export interface ScopesQueryParams {
  scope?: string
  engine?: string
  filter?: string
}

const SCOPES_PATH = '/scopes'

export const scopesKeys = {
  all: ['scopes'] as const,
  list: (params?: ScopesQueryParams) => ['scopes', params || null] as const,
}

function toQueryParams(params?: ScopesQueryParams): QueryParams | undefined {
  if (!params) return undefined
  return {
    scope: params.scope,
    engine: params.engine,
    filter: params.filter,
  }
}

export async function fetchScopes(params?: ScopesQueryParams) {
  return apiGet<unknown>(SCOPES_PATH, { query: toQueryParams(params) })
}

export function useScopesQuery(params?: ScopesQueryParams) {
  return useQuery({
    queryKey: scopesKeys.list(params),
    queryFn: () => fetchScopes(params),
  })
}
