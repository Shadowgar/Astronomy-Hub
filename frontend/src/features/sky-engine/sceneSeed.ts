import type { SkyEngineObserver, SkyEngineSceneObject } from './types'

export const ORAS_OBSERVER: SkyEngineObserver = {
  label: 'ORAS Observatory',
  latitude: 41.321903,
  longitude: -79.585394,
  elevationFt: 1420,
}

export const SKY_ENGINE_TEMPORARY_SCENE_SEED: readonly SkyEngineSceneObject[] = [
  {
    id: 'sky-seed-vega',
    name: 'Vega',
    type: 'star',
    altitudeDeg: 67,
    azimuthDeg: 82,
    magnitude: 0.03,
    colorHex: '#8ec5ff',
    summary: 'Bright summer anchor rendered from temporary scene-seed data.',
    description:
      'Vega is used here as a visible interaction target while the first Babylon Sky Engine foundation is being established.',
    constellation: 'Lyra',
    seededReason: 'Temporary scene-seed data for first Babylon Sky Engine interaction slice.',
    source: 'temporary_scene_seed',
  },
  {
    id: 'sky-seed-deneb',
    name: 'Deneb',
    type: 'star',
    altitudeDeg: 54,
    azimuthDeg: 28,
    magnitude: 1.25,
    colorHex: '#d6e7ff',
    summary: 'Second seed target used to test object picking and detail response.',
    description:
      'Deneb gives the initial scene more than one selectable object without claiming live astronomical accuracy.',
    constellation: 'Cygnus',
    seededReason: 'Temporary scene-seed data for first Babylon Sky Engine interaction slice.',
    source: 'temporary_scene_seed',
  },
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
      'Jupiter is rendered as a temporary bright planet marker to validate scene ownership, camera interaction, and selection flow.',
    seededReason: 'Temporary scene-seed data for first Babylon Sky Engine interaction slice.',
    source: 'temporary_scene_seed',
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
    seededReason: 'Temporary scene-seed data for first Babylon Sky Engine interaction slice.',
    source: 'temporary_scene_seed',
  },
] as const