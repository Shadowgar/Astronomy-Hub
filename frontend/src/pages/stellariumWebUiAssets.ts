/**
 * Toolbar artwork from Stellarium Web Engine `apps/simple-html/static/imgs/symbols/`
 * at pinned commit (see `docs/runtime/port/stellarium-web-engine-src.md`).
 */
export const STELLARIUM_WEB_UI_BASE = '/stellarium-web' as const

export const STELLARIUM_WEB_UI = {
  constellationLines: `${STELLARIUM_WEB_UI_BASE}/btn-cst-lines.svg`,
  constellationArt: `${STELLARIUM_WEB_UI_BASE}/btn-cst-art.svg`,
  azimuthalGrid: `${STELLARIUM_WEB_UI_BASE}/btn-azimuthal-grid.svg`,
  equatorialGrid: `${STELLARIUM_WEB_UI_BASE}/btn-equatorial-grid.svg`,
  atmosphere: `${STELLARIUM_WEB_UI_BASE}/btn-atmosphere.svg`,
  landscape: `${STELLARIUM_WEB_UI_BASE}/btn-landscape.svg`,
  nebulae: `${STELLARIUM_WEB_UI_BASE}/btn-nebulae.svg`,
  nightMode: `${STELLARIUM_WEB_UI_BASE}/btn-night-mode.svg`,
  fullscreen: `${STELLARIUM_WEB_UI_BASE}/fullscreen.svg`,
  fullscreenExit: `${STELLARIUM_WEB_UI_BASE}/fullscreen_exit.svg`,
  pointer: `${STELLARIUM_WEB_UI_BASE}/pointer.svg`,
} as const
