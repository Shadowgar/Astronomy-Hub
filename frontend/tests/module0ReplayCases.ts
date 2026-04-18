/**
 * Shared Module 0 deterministic replay checkpoints (G4 / BLK-000 tier-1 contract).
 * Keep in sync with `docs/runtime/port/blockers.md` and golden fixtures.
 */
export const MODULE0_REPLAY_CASES = [
  {
    id: 'nyc-midsummer',
    observer: { label: 'nyc', latitude: 40.7128, longitude: -74.006, elevationFt: 33 },
    sceneTimestampIso: '2024-06-21T12:00:00.000Z',
  },
  {
    id: 'equator-j2000',
    observer: { label: 'equator', latitude: 0, longitude: 0, elevationFt: 0 },
    sceneTimestampIso: '2000-01-01T12:00:00.000Z',
  },
  {
    id: 'south-pole-winter',
    observer: { label: 'pole', latitude: -89.99, longitude: 139.266, elevationFt: 9300 },
    sceneTimestampIso: '2025-07-04T00:00:00.000Z',
  },
  {
    id: 'high-elev-denver',
    observer: { label: 'denver', latitude: 39.7392, longitude: -104.9903, elevationFt: 5280 },
    sceneTimestampIso: '2026-01-15T18:30:00.000Z',
  },
  {
    id: 'leap-era-utc',
    observer: { label: 'utc-edge', latitude: 51.4779, longitude: -0.0015, elevationFt: 80 },
    sceneTimestampIso: '2017-01-01T00:00:00.000Z',
  },
] as const
