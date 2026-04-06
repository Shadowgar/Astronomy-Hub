import type { SkyEngineObserver, SkyEngineSceneObject } from './types'

export const ORAS_OBSERVER: SkyEngineObserver = {
  label: 'ORAS Observatory',
  latitude: 41.321903,
  longitude: -79.585394,
  elevationFt: 1420,
}

export const SKY_ENGINE_TEMPORARY_SCENE_SEED: readonly SkyEngineSceneObject[] = [
  {
    id: 'sky-seed-jupiter',
    name: 'Jupiter',
    type: 'planet',
    altitudeDeg: 31,
    azimuthDeg: 151,
    magnitude: -2.1,
    colorHex: '#ffd38a',
    summary: 'Seeded bright planet marker for the initial Babylon sky layout.',
    description:
      'Jupiter remains a temporary bright planet marker while this slice upgrades only a tiny fixed-star starter set to computed sky placement.',
    truthNote: 'Temporary demo placement retained to keep non-computed objects explicitly visible and honestly labeled.',
    source: 'temporary_scene_seed',
    isAboveHorizon: true,
  },
  {
    id: 'sky-seed-andromeda',
    name: 'Andromeda Galaxy',
    type: 'deep_sky',
    altitudeDeg: 46,
    azimuthDeg: 305,
    magnitude: 3.44,
    colorHex: '#b8a6ff',
    summary: 'Seeded deep-sky target proving the scene can host more than stars and planets.',
    description:
      'This deep-sky marker is intentionally labeled as temporary scene-seed data and exists to prove selection and detail-shell flow.',
    constellation: 'Andromeda',
    truthNote: 'Temporary demo placement retained so remaining non-computed objects are not mixed silently with real-sky stars.',
    source: 'temporary_scene_seed',
    isAboveHorizon: true,
  },
] as const