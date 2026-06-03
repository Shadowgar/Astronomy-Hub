import fs from 'node:fs'
import path from 'node:path'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const frontendPort = Number(process.env.FRONTEND_PORT || 4173)
const runtimePublicDir = path.resolve(__dirname, 'public/oras-sky-engine')
const runtimeIndexHtml = path.join(runtimePublicDir, 'index.html')

// Default to host loopback so `npm run dev` / `vite preview` on the machine works.
// docker-compose sets VITE_DEV_PROXY_TARGET=http://backend:8000 for the frontend container.
const proxyTarget =
  process.env.VITE_DEV_PROXY_TARGET ||
  process.env.API_URL ||
  'http://127.0.0.1:8000'

const apiProxy = {
  '/api': {
    target: proxyTarget,
    changeOrigin: true,
    secure: false,
  },
  '/oras-sky-engine/remote-data': {
    target: 'https://stellarium.sfo2.cdn.digitaloceanspaces.com',
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(/^\/oras-sky-engine\/remote-data/, ''),
  },
}

export function isOrasRuntimeProxyPath(requestPath) {
  return requestPath.startsWith('/oras-sky-engine/remote-data')
}

export function getExistingOrasRuntimeStaticPath(requestPath) {
  if (!requestPath.startsWith('/oras-sky-engine')) {
    return undefined
  }

  const cleanPath = requestPath.split('?')[0]
  const relativeRuntimePath = cleanPath.replace(/^\/oras-sky-engine\/?/, '')
  if (!relativeRuntimePath) {
    return undefined
  }

  const staticCandidatePath = path.join(runtimePublicDir, relativeRuntimePath)
  return fs.existsSync(staticCandidatePath) ? staticCandidatePath : undefined
}

export function isOrasRuntimeSpaPath(requestPath) {
  if (!requestPath.startsWith('/oras-sky-engine')) {
    return false
  }

  if (isOrasRuntimeProxyPath(requestPath)) {
    return false
  }

  const cleanPath = requestPath.split('?')[0]
  const relativeRuntimePath = cleanPath.replace(/^\/oras-sky-engine\/?/, '')

  if (!relativeRuntimePath) {
    return true
  }

  if (path.extname(relativeRuntimePath)) {
    return false
  }

  return !getExistingOrasRuntimeStaticPath(requestPath)
}

export function isMissingOrasRuntimeDataAsset(requestPath) {
  if (!requestPath.startsWith('/oras-sky-engine/skydata/')) {
    return false
  }

  const cleanPath = requestPath.split('?')[0]
  const relativeRuntimePath = cleanPath.replace(/^\/oras-sky-engine\/?/, '')
  if (!path.extname(relativeRuntimePath)) {
    return false
  }

  const staticCandidatePath = path.join(runtimePublicDir, relativeRuntimePath)
  return !fs.existsSync(staticCandidatePath)
}

export function getOrasRuntimeRemoteFallbackPath(requestPath) {
  if (!isMissingOrasRuntimeDataAsset(requestPath)) {
    return undefined
  }

  const cleanPath = requestPath.split('?')[0]
  const relativeSkydataPath = cleanPath.replace(/^\/oras-sky-engine\/skydata\/?/, '')
  const query = requestPath.includes('?') ? requestPath.slice(requestPath.indexOf('?')) : ''
  const remoteMappings = [
    ['packs/minimal/stars/', 'swe-data-packs/minimal/2020-09-01/minimal_2020-09-01_186e7ee2/stars/'],
    ['packs/base/stars/', 'swe-data-packs/base/2020-09-01/base_2020-09-01_1aa210df/stars/'],
    ['packs/extended/stars/', 'swe-data-packs/extended/2020-03-11/extended_2020-03-11_26aa5ab8/stars/'],
    ['packs/base/dso/', 'swe-data-packs/base/2020-09-01/base_2020-09-01_1aa210df/dso/'],
    ['packs/extended/dso/', 'swe-data-packs/extended/2020-03-11/extended_2020-03-11_26aa5ab8/dso/'],
    ['surveys/dss/v1/', 'surveys/dss/v1/'],
    ['surveys/gaia/v1/', 'surveys/gaia/v1/'],
    ['surveys/milkyway/', 'surveys/milkyway/v1/'],
    ['surveys/sso/', 'surveys/sso/'],
    ['landscapes/guereins/', 'landscapes/v1/guereins/'],
  ]

  for (const [localPrefix, remotePrefix] of remoteMappings) {
    if (relativeSkydataPath.startsWith(localPrefix)) {
      const suffix = relativeSkydataPath.slice(localPrefix.length)
      const normalizedSuffix = localPrefix === 'surveys/sso/' && !suffix.includes('/v1/')
        ? suffix.replace(/^([^/]+)\//, '$1/v1/')
        : suffix
      return `/oras-sky-engine/remote-data/${remotePrefix}${normalizedSuffix}${query}`
    }
  }

  return undefined
}

export function serveOrasRuntimeRequest(req, res, next) {
  const requestPath = req.url || ''
  const staticRuntimePath = getExistingOrasRuntimeStaticPath(requestPath)

  if (staticRuntimePath) {
    const cleanPath = requestPath.split('?')[0]
    const relativeRuntimePath = cleanPath.replace(/^\/oras-sky-engine\/?/, '')

    if (!path.extname(relativeRuntimePath)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end(fs.readFileSync(staticRuntimePath))
      return
    }

    next()
    return
  }

  if (isMissingOrasRuntimeDataAsset(requestPath)) {
    const remoteFallbackPath = getOrasRuntimeRemoteFallbackPath(requestPath)
    if (remoteFallbackPath) {
      req.url = remoteFallbackPath
      next()
      return
    }
    res.statusCode = 404
    res.end('ORAS runtime data asset not found')
    return
  }

  if (!isOrasRuntimeSpaPath(requestPath) || !fs.existsSync(runtimeIndexHtml)) {
    next()
    return
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end(fs.readFileSync(runtimeIndexHtml, 'utf8'))
}

const orasRuntimeSpaPlugin = {
  name: 'oras-runtime-spa',
  configureServer(server) {
    server.middlewares.use(serveOrasRuntimeRequest)
  },
  configurePreviewServer(server) {
    server.middlewares.use(serveOrasRuntimeRequest)
  },
}

export default defineConfig({
  plugins: [react(), orasRuntimeSpaPlugin],
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.{js,jsx}'],
  },
  server: {
    host: '0.0.0.0',
    port: frontendPort,
    strictPort: true,
    watch: {
      // The promoted Stellarium runtime can contain hundreds of thousands of
      // static tiles. Polling those files stalls local asset delivery.
      ignored: [
        '**/public/oras-sky-engine/skydata/**',
        '**/public/oras-sky-engine/js/**',
        '**/public/oras-sky-engine/css/**',
        '**/public/oras-sky-engine/fonts/**',
        '**/public/oras-sky-engine/img/**',
      ],
    },
    proxy: apiProxy,
  },
  preview: {
    host: '0.0.0.0',
    port: frontendPort,
    strictPort: true,
    proxy: apiProxy,
  },
})
