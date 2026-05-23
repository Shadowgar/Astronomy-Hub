export const STELLARIUM_VENDOR_ROOT = '/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine'
export const STELLARIUM_WORKING_DIRECTORY = `${STELLARIUM_VENDOR_ROOT}/apps/web-frontend`
export const STELLARIUM_BUILD_DIRECTORY = `${STELLARIUM_VENDOR_ROOT}/build`
export const STELLARIUM_SKYDATA_DIRECTORY = `${STELLARIUM_VENDOR_ROOT}/apps/test-skydata`
export const STELLARIUM_SAME_ORIGIN_RUNTIME_PUBLIC_PATH = '/oras-sky-engine/'
export const STELLARIUM_RUNTIME_PORT = 8080

export type RuntimeKind = 'same-origin' | 'legacy'

export type RuntimeDiscovery = {
  sameOriginRuntimeUrl: string
  legacyRuntimeUrl: string
  launchCommand: string
  buildCommand: string
  installCommand: string
  sourceRoot: string
  workingDirectory: string
  buildDirectory: string
  skyDataDirectory: string
}

export function discoverRuntime(hostname: string, browserOrigin?: string): RuntimeDiscovery {
  const resolvedHost = hostname && hostname !== '0.0.0.0' ? hostname : '127.0.0.1'
  const sameOriginBase = browserOrigin || `http://${resolvedHost}:4173`

  return {
    sameOriginRuntimeUrl: `${sameOriginBase}${STELLARIUM_SAME_ORIGIN_RUNTIME_PUBLIC_PATH}`,
    legacyRuntimeUrl: `http://${resolvedHost}:${STELLARIUM_RUNTIME_PORT}`,
    launchCommand: 'cd /home/rocco/Astronomy-Hub/frontend && npm run dev -- --host 0.0.0.0',
    buildCommand: 'cd /home/rocco/Astronomy-Hub && npm run build:stellarium',
    installCommand: `cd ${STELLARIUM_WORKING_DIRECTORY} && npm install`,
    sourceRoot: STELLARIUM_VENDOR_ROOT,
    workingDirectory: STELLARIUM_WORKING_DIRECTORY,
    buildDirectory: STELLARIUM_BUILD_DIRECTORY,
    skyDataDirectory: STELLARIUM_SKYDATA_DIRECTORY,
  }
}