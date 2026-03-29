import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api/client'

const ASSETS_PATH = '/assets'

export const assetsKeys = {
  all: ['assets'] as const,
  detail: (assetKey?: string) => ['assets', assetKey || null] as const,
}

export async function fetchAsset(assetKey: string) {
  return apiGet<unknown>(`${ASSETS_PATH}/${encodeURIComponent(assetKey)}`)
}

export function useAssetQuery(assetKey?: string) {
  return useQuery({
    queryKey: assetsKeys.detail(assetKey),
    enabled: Boolean(assetKey),
    queryFn: () => fetchAsset(assetKey as string),
  })
}
