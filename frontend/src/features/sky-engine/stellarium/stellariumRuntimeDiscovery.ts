export const STELLARIUM_VENDOR_ROOT = '/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine'
export const STELLARIUM_WORKING_DIRECTORY = `${STELLARIUM_VENDOR_ROOT}/apps/web-frontend`
export const STELLARIUM_BUILD_DIRECTORY = `${STELLARIUM_VENDOR_ROOT}/build`
export const STELLARIUM_SKYDATA_DIRECTORY = `${STELLARIUM_VENDOR_ROOT}/apps/test-skydata`
export const STELLARIUM_RUNTIME_PORT = 8080

export type RuntimeDiscovery = {
  runtimeUrl: string
  launchCommand: string
  buildCommand: string
  installCommand: string
  sourceRoot: string
  workingDirectory: string
  buildDirectory: string
  skyDataDirectory: string
}

export function discoverRuntime(hostname: string): RuntimeDiscovery {
  const resolvedHost = hostname && hostname !== '0.0.0.0' ? hostname : '127.0.0.1'

  return {
    runtimeUrl: `http://${resolvedHost}:${STELLARIUM_RUNTIME_PORT}`,
    launchCommand: 'cd /home/rocco/Astronomy-Hub && npm run dev:stellarium',
    buildCommand: 'cd /home/rocco/Astronomy-Hub && npm run build:stellarium',
    installCommand: `cd ${STELLARIUM_WORKING_DIRECTORY} && npm install`,
    sourceRoot: STELLARIUM_VENDOR_ROOT,
    workingDirectory: STELLARIUM_WORKING_DIRECTORY,
    buildDirectory: STELLARIUM_BUILD_DIRECTORY,
    skyDataDirectory: STELLARIUM_SKYDATA_DIRECTORY,
  }
}