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

  const staticCandidatePath = path.join(runtimePublicDir, relativeRuntimePath)
  return !fs.existsSync(staticCandidatePath)
}

function serveOrasRuntimeIndex(req, res, next) {
  const requestPath = req.url || ''

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
    server.middlewares.use(serveOrasRuntimeIndex)
  },
  configurePreviewServer(server) {
    server.middlewares.use(serveOrasRuntimeIndex)
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
    proxy: apiProxy,
  },
  preview: {
    host: '0.0.0.0',
    port: frontendPort,
    strictPort: true,
    proxy: apiProxy,
  },
})
