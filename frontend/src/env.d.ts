/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SKY_ENGINE_TILE_MODE?: 'mock' | 'hipparcos'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}