import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const frontendPort = Number(process.env.FRONTEND_PORT || 4173)

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
}

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.js'],
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
