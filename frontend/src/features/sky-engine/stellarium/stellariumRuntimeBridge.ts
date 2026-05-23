import type { RuntimeDiscovery, RuntimeKind } from './stellariumRuntimeDiscovery'

const PROBE_TIMEOUT_MS = 2500

export type RuntimeProbeResult = {
  isAvailable: boolean
  runtimeUrl: string
  runtimeKind: RuntimeKind | null
}

function getRuntimeProbeUrl(runtimeUrl: string) {
  const normalizedRuntimeUrl = runtimeUrl.endsWith('/') ? runtimeUrl : `${runtimeUrl}/`
  return `${normalizedRuntimeUrl}favicon.ico?probe=${Date.now()}`
}

export function getRuntimeFrameUrl(discovery: RuntimeDiscovery, runtimeKind: RuntimeKind = 'same-origin') {
  return runtimeKind === 'same-origin' ? discovery.sameOriginRuntimeUrl : discovery.legacyRuntimeUrl
}

function probeRuntimeUrl(runtimeUrl: string) {
  return new Promise<boolean>((resolve) => {
    const probeImage = new Image()
    const timeoutHandle = window.setTimeout(() => {
      cleanup(false)
    }, PROBE_TIMEOUT_MS)

    const cleanup = (result: boolean) => {
      window.clearTimeout(timeoutHandle)
      probeImage.onload = null
      probeImage.onerror = null
      resolve(result)
    }

    probeImage.onload = () => cleanup(true)
    probeImage.onerror = () => cleanup(false)
    probeImage.src = getRuntimeProbeUrl(runtimeUrl)
  })
}

export async function probeRuntime(discovery: RuntimeDiscovery): Promise<RuntimeProbeResult> {
  const sameOriginRuntimeUrl = getRuntimeFrameUrl(discovery, 'same-origin')
  if (await probeRuntimeUrl(sameOriginRuntimeUrl)) {
    return {
      isAvailable: true,
      runtimeUrl: sameOriginRuntimeUrl,
      runtimeKind: 'same-origin',
    }
  }

  const legacyRuntimeUrl = getRuntimeFrameUrl(discovery, 'legacy')
  if (await probeRuntimeUrl(legacyRuntimeUrl)) {
    return {
      isAvailable: true,
      runtimeUrl: legacyRuntimeUrl,
      runtimeKind: 'legacy',
    }
  }

  return {
    isAvailable: false,
    runtimeUrl: sameOriginRuntimeUrl,
    runtimeKind: null,
  }
}