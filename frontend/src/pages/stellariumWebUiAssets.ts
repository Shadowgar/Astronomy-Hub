/**
 * Toolbar artwork from Stellarium Web Engine `apps/simple-html/static/imgs/symbols/`
 * at pinned commit (see `docs/runtime/port/stellarium-web-engine-src.md`).
 */
export const STELLARIUM_WEB_UI_BASE = '/stellarium-web' as const

export const STELLARIUM_WEB_UI = {
  constellationLines: `${STELLARIUM_WEB_UI_BASE}/btn-cst-lines.svg`,
  azimuthalGrid: `${STELLARIUM_WEB_UI_BASE}/btn-azimuthal-grid.svg`,
  equatorialGrid: `${STELLARIUM_WEB_UI_BASE}/btn-equatorial-grid.svg`,
  atmosphere: `${STELLARIUM_WEB_UI_BASE}/btn-atmosphere.svg`,
  pointer: `${STELLARIUM_WEB_UI_BASE}/pointer.svg`,
} as const
