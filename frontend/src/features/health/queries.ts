import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api/client'

const HEALTH_PATH = '/health'

export const healthKeys = {
  all: ['health'] as const,
}

export async function fetchHealth() {
  return apiGet<unknown>(HEALTH_PATH)
}

export function useHealthQuery() {
  return useQuery({
    queryKey: healthKeys.all,
    queryFn: fetchHealth,
  })
}
