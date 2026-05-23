# STELLARIUM WEB RUNTIME TRAFFIC AUDIT

- Generated: 2026-05-15T18:04:35.324Z
- Run ID: skydata-audit-20260515T180112Z
- Profiles: matrix, max_zoom_izar, focused_unobserved
- Target URL: https://stellarium-web.org
- Tool mode: Real Playwright Chromium persistent profile capture
- Scope: Only browser-observed requests/responses during normal interaction flow

## Interaction Coverage

- matrix:
  - panned and zoomed
  - requested faint-star depth
  - searched Sirius
  - searched M31
  - searched Jupiter
  - searched Moon
  - searched Sun
  - searched ISS
  - attempted DSS toggle
  - reserved HiDEF observation window
  - attempted Milky Way toggle
  - attempted skyculture-affecting control
  - attempted landscape toggle
  - attempted time/date shortcuts
  - attempted observer-location shortcuts
- max_zoom_izar:
  - searched/selected Izar
  - max zoom wheel pass
  - max zoom key pass
  - high-zoom pan sweep
  - high-zoom dwell complete
- focused_unobserved:
  - loaded explicit date/location URL
  - loaded NAME%20Moon focused route
  - loaded NAME%20Sun focused route
  - loaded Jupiter focused route
  - loaded object lookup route

## Observed URL Families

- `stellarium-web.org`
  - `/`
  - `/skysource/NAME%20Jupiter`
  - `/skysource/NAME%20Moon`
  - `/skysource/NAME%20Sun`
- `fonts.googleapis.com`
  - `/css`
- `d3ufh70wg9uzo4.cloudfront.net`
  - `/css/app.3714d66a.css`
  - `/css/chunk-vendors.bd381c0a.css`
  - `/fonts/Roboto-Bold.b52fac2b.woff2`
  - `/fonts/Roboto-Bold.ttf`
  - `/fonts/Roboto-BoldItalic.94008e69.woff2`
  - `/fonts/Roboto-Light.d26871e8.woff2`
  - `/fonts/Roboto-Medium.90d16760.woff2`
  - `/fonts/Roboto-MediumItalic.13ec0eb5.woff2`
  - `/fonts/Roboto-Regular.73f0a88b.woff2`
  - `/fonts/Roboto-Regular.ttf`
  - `/fonts/Roboto-RegularItalic.4357beb8.woff2`
  - `/fonts/materialdesignicons-webfont.c61b9c12.woff2`
  - `/images/svg/target_types`
  - `/img/Website-ad-1-nobadges.d86ff320.png`
  - `/img/add_circle_outline.24a5986c.svg`
  - `/img/btn-atmosphere.26bed3a1.svg`
  - `/img/btn-azimuthal-grid.bd02effc.svg`
  - `/img/btn-cst-art.e7785b5a.svg`
  - `/img/btn-cst-lines.1844e97d.svg`
  - `/img/btn-equatorial-grid.37de933f.svg`
  - `/img/btn-landscape.8fc552f5.svg`
  - `/img/btn-nebulae.923eae18.svg`
  - `/img/btn-night-mode.bc3006ed.svg`
  - `/img/fullscreen.ddcd813e.svg`
  - `/img/header.f792b4d9.png`
  - `/img/logo.5901f70d.svg`
  - `/img/remove_circle_outline.558922b2.svg`
  - `/js/app.44b5ed00.js`
  - `/js/chunk-2d2253ec.6784855b.js`
  - `/js/chunk-vendors.a9e667ff.js`
- `www.googletagmanager.com`
  - `/gtag/js`
- `stellarium.sfo2.cdn.digitaloceanspaces.com`
  - `/landscapes/v1/guereins`
  - `/mpc/v1/CometEls.txt`
  - `/mpc/v1/mpcorb.dat`
  - `/skycultures/v3/western`
  - `/skysources/v1/tle_satellite.jsonl.gz`
  - `/surveys/dss/v1`
  - `/surveys/gaia/v1`
  - `/surveys/milkyway/v1`
  - `/surveys/sso/callisto`
  - `/surveys/sso/io`
  - `/surveys/sso/jupiter`
  - `/surveys/sso/moon`
  - `/surveys/sso/moon-normal`
  - `/surveys/sso/sun`
  - `/swe-data-packs/base/2020-09-01`
  - `/swe-data-packs/extended/2020-03-11`
  - `/swe-data-packs/minimal/2020-09-01`
- `freegeoip.stellarium.org`
  - `/json/`
- `www.google-analytics.com`
  - `/analytics.js`
- `nominatim.openstreetmap.org`
  - `/reverse`
- `www.google.com`
  - `/ccm/collect`
  - `/g/collect`
  - `/pagead/1p-user-list/974868566`
  - `/rmkt/collect/974868566`
- `googleads.g.doubleclick.net`
  - `/pagead/viewthroughconversion/974868566`
- `analytics.google.com`
  - `/g/collect`
- `stats.g.doubleclick.net`
  - `/g/collect`
- `api.noctuasky.com`
  - `/api/v1/skysources`
- `en.wikipedia.org`
  - `/w/api.php`

## Taxonomy

- DSO: 162
- DSS / HiPS / survey imagery: 341
- landscapes: 83
- minor planets/comets: 16
- planet textures: 30
- runtime/WASM/app code: 80
- stars: 338
- unknown: 264

## Status Breakdown

- 200: 1302
- 204: 9
- 403: 3

## Browser Storage Metadata

- localStorage keys: 1
- sessionStorage keys: 0
- IndexedDB databases: 0
- CacheStorage buckets: 0
- Service worker registrations: 0

## Coverage Statement

- This is observed-session coverage only; it is not complete global coverage of all Stellarium Web assets.
