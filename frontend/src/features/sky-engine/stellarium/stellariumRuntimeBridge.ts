import type { RuntimeDiscovery } from './stellariumRuntimeDiscovery'

const PROBE_TIMEOUT_MS = 2500

export function getRuntimeFrameUrl(discovery: RuntimeDiscovery) {
  return discovery.runtimeUrl
}

export async function probeRuntime(discovery: RuntimeDiscovery) {
  return new Promise((resolve) => {
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
    probeImage.src = `${discovery.runtimeUrl}/favicon.ico?probe=${Date.now()}`
  })
}