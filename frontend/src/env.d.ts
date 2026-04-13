/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SKY_ENGINE_TILE_MODE?: 'mock' | 'hipparcos' | 'multi-survey'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}