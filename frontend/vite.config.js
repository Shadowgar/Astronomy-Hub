import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Minimal Vite config for React
export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    // Proxy /api requests to local backend to avoid CORS during development
    proxy: {
      '/api': 'http://127.0.0.1:8000'
    }
  }
})
