import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api/client'

const OBJECTS_PATH = '/object'

export const objectsKeys = {
  all: ['objects'] as const,
  detail: (objectId?: string) => ['objects', 'detail', objectId || null] as const,
}

export async function fetchObjectDetail(objectId: string) {
  return apiGet<unknown>(`${OBJECTS_PATH}/${encodeURIComponent(objectId)}`)
}

export function useObjectDetailQuery(objectId?: string) {
  return useQuery({
    queryKey: objectsKeys.detail(objectId),
    enabled: Boolean(objectId),
    queryFn: () => fetchObjectDetail(objectId as string),
  })
}
