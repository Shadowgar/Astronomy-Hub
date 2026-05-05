# ORAS Sky-Engine Same-Origin Runtime — 2026-05-04

## Scope

This slice keeps the vendored ORAS Sky-Engine runtime on the same origin as the Hub frontend under `/oras-sky-engine/` so `/sky-engine` does not depend on a separate `:8080` runtime during normal frontend use.

During validation, two runtime-data defects were identified and repaired:

- the frontend Vite SPA fallback treated `/oras-sky-engine/remote-data/...` as a client route and returned `index.html`
- the vendored runtime still wired stars, DSO, asteroids, and comets to the stellarium-web.org-style remote pack layout even though this repo already ships bundled same-origin copies of those catalogs

This work does not claim full stellarium-web.org data parity.

## Selected Strategy

- selected strategy: serve the synced vendored runtime from `frontend/public/oras-sky-engine`
- embedded runtime route: `/sky-engine`
- standalone same-origin runtime route: `/oras-sky-engine/`
- build path: `npm run build:stellarium` builds the vendored Vue runtime with `ORAS_RUNTIME_PUBLIC_PATH=/oras-sky-engine/` and syncs the output into `frontend/public/oras-sky-engine`

## Stellarium-Web Reference Review

Reference implementation reviewed in vendored upstream source:

- `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/web-frontend/src/App.vue`

Observed upstream behavior:

- stars and DSO are layered from remote data-pack URLs under `process.env.BASE_URL + 'remote-data'`
- DSS imagery is also added from the remote survey base

Astronomy Hub adjustment:

- same-origin bundled catalogs now default to local `skydata` assets already shipped in this repository
- optional remote survey imagery remains opt-in through `VUE_APP_ORAS_RUNTIME_REMOTE_DATA_BASE`
- this preserves the same runtime structure while avoiding the blocked external CDN path in local Hub usage

## Files Changed

- `/home/rocco/Astronomy-Hub/frontend/vite.config.mjs`
- `/home/rocco/Astronomy-Hub/frontend/tests/orasRuntimeSpaFallback.test.js`
- `/home/rocco/Astronomy-Hub/frontend/tests/orasRuntimeDataSources.test.js`
- `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/web-frontend/src/App.vue`
- `/home/rocco/Astronomy-Hub/frontend/public/oras-sky-engine/**` regenerated via `npm run build:stellarium`

## Root Cause

### Same-Origin Host Path

The same-origin serving path was already present before this slice:

- Vite served `/oras-sky-engine/` from `frontend/public/oras-sky-engine`
- `/sky-engine` already preferred same-origin runtime discovery before falling back to legacy `:8080`

### Data Failures

The missing stars / DSO / satellite / survey complaints came from two different issues:

1. `frontend/vite.config.mjs` returned `index.html` for `/oras-sky-engine/remote-data/...` because the SPA fallback matcher did not exclude proxy paths.
2. After fixing that matcher, the proxied remote pack URLs reached DigitalOcean Spaces and returned `HTTP/1.1 403 Forbidden` for the catalog paths used by the vendored runtime.

Because the vendored runtime already ships bundled copies of:

- `skydata/stars`
- `skydata/dso`
- `skydata/mpcorb.dat`
- `skydata/CometEls.txt`
- `skydata/tle_satellite.jsonl.gz`

the correct fix for Hub same-origin usage was to default those catalogs to the bundled same-origin files instead of the blocked remote pack URLs.

## Runtime Data Status

### Stars

- status: repaired
- source now used: `/oras-sky-engine/skydata/stars`
- proof: `/oras-sky-engine/skydata/stars/properties` returns `HTTP/1.1 200 OK`

### DSO

- status: repaired
- source now used: `/oras-sky-engine/skydata/dso`
- proof: `/oras-sky-engine/skydata/dso/properties` returns `HTTP/1.1 200 OK`

### Satellites

- status: confirmed on bundled same-origin path
- source used: `/oras-sky-engine/skydata/tle_satellite.jsonl.gz`
- proof: `/oras-sky-engine/skydata/tle_satellite.jsonl.gz` returns `HTTP/1.1 200 OK`

### Minor Planets / Comets

- status: repaired
- sources now used:
  - `/oras-sky-engine/skydata/mpcorb.dat`
  - `/oras-sky-engine/skydata/CometEls.txt`
- proof: both files return `HTTP/1.1 200 OK`

### Surveys

- bundled survey status: repaired for local same-origin assets
- bundled sources used:
  - `/oras-sky-engine/skydata/surveys/milkyway`
  - `/oras-sky-engine/skydata/surveys/sso/*`
- proof: Milky Way properties continue to return `HTTP/1.1 200 OK`

- DSS remote imagery status: intentionally disabled by default in this slice
- reason: the upstream remote survey base is not reliable here and returned `403 Forbidden` for the remote catalog path family
- follow-up direction: later data-improvement work can add better local survey imagery or re-enable a vetted remote survey base through `VUE_APP_ORAS_RUNTIME_REMOTE_DATA_BASE`

## Browser Verification

Same-origin runtime checks passed with `:8080` down:

- `curl -I --max-time 10 http://127.0.0.1:8080` failed after shutdown, confirming no legacy runtime was serving
- `http://127.0.0.1:4173/oras-sky-engine/` returned `HTTP/1.1 200 OK`
- `http://127.0.0.1:4173/sky-engine` settled into the embedded ORAS runtime iframe
- the embedded runtime showed the ORAS toolbar and drawer under the Hub route

Data checks passed after the repair:

- the embedded same-origin runtime booted cleanly after the rebuilt bundle was synced
- in-frame object lookups for a star, a DSO, and a satellite completed without throwing
- the same-origin runtime no longer depended on the blocked external catalog URLs for those bundled catalog types

## Commands Run

- `cd /home/rocco/Astronomy-Hub && curl -I --max-time 10 http://127.0.0.1:8080`
- `cd /home/rocco/Astronomy-Hub && curl -I --max-time 10 http://127.0.0.1:4173/oras-sky-engine/ && curl -I --max-time 10 http://127.0.0.1:4173/oras-sky-engine/favicon.ico && curl -I --max-time 10 http://127.0.0.1:4173/oras-sky-engine/skydata/landscapes/guereins/properties`
- `cd /home/rocco/Astronomy-Hub && curl -I --max-time 20 http://127.0.0.1:4173/oras-sky-engine/remote-data/swe-data-packs/minimal/2020-09-01/minimal_2020-09-01_186e7ee2/stars && curl -I --max-time 20 http://127.0.0.1:4173/oras-sky-engine/remote-data/swe-data-packs/base/2020-09-01/base_2020-09-01_1aa210df/dso`
- `cd /home/rocco/Astronomy-Hub && curl -I --max-time 20 https://stellarium.sfo2.cdn.digitaloceanspaces.com/swe-data-packs/minimal/2020-09-01/minimal_2020-09-01_186e7ee2/stars && curl -I --max-time 20 https://stellarium.sfo2.cdn.digitaloceanspaces.com/remote-data/swe-data-packs/minimal/2020-09-01/minimal_2020-09-01_186e7ee2/stars && curl -I --max-time 20 https://stellarium.sfo2.cdn.digitaloceanspaces.com/remote-data/swe-data-packs/base/2020-09-01/base_2020-09-01_1aa210df/dso`
- `cd /home/rocco/Astronomy-Hub/frontend && npm run test -- tests/orasRuntimeSpaFallback.test.js`
- `cd /home/rocco/Astronomy-Hub && npm run build:stellarium`
- `cd /home/rocco/Astronomy-Hub && curl -I --max-time 20 http://127.0.0.1:4173/oras-sky-engine/skydata/stars/properties && curl -I --max-time 20 http://127.0.0.1:4173/oras-sky-engine/skydata/dso/properties && curl -I --max-time 20 http://127.0.0.1:4173/oras-sky-engine/skydata/mpcorb.dat && curl -I --max-time 20 http://127.0.0.1:4173/oras-sky-engine/skydata/CometEls.txt && curl -I --max-time 20 http://127.0.0.1:4173/oras-sky-engine/skydata/tle_satellite.jsonl.gz`
- `cd /home/rocco/Astronomy-Hub/frontend && npm run test -- tests/orasRuntimeSpaFallback.test.js tests/orasRuntimeDataSources.test.js`

## Validation Results

- initial `/oras-sky-engine/remote-data/...` star and DSO checks before the Vite fix: failed logically, returning `HTTP/1.1 200 OK` with `Content-Type: text/html; charset=utf-8`
- post-Vite-fix remote checks: reached upstream, but failed with `HTTP/1.1 403 Forbidden`
- `frontend npm run test -- tests/orasRuntimeSpaFallback.test.js`: pass
- `npm run build:stellarium`: pass
- bundled catalog file checks: pass with `HTTP/1.1 200 OK`
  - stars properties
  - DSO properties
  - `mpcorb.dat`
  - `CometEls.txt`
  - `tle_satellite.jsonl.gz`
- `frontend npm run test -- tests/orasRuntimeSpaFallback.test.js tests/orasRuntimeDataSources.test.js`: pass
- browser verification: pass
  - same-origin runtime booted under `/sky-engine`
  - embedded runtime UI reached the healthy state after rebuild
  - in-frame star / DSO / satellite object lookup validation completed without throwing

## Remaining Blockers

No blocking issue remains for same-origin runtime startup with bundled catalog data.

Non-blocking notes:

- the worktree contains unrelated new binary skyculture illustration assets under `frontend/public/oras-sky-engine/skydata/skycultures/western/illustrations`; those were not introduced by this slice and were left in place
- DSS remote imagery is now opt-in rather than default-on; later data work can add better local survey imagery or configure a trusted remote survey base
- this slice intentionally uses the bundled same-origin catalogs that ship in the repo today; later parity work can increase star density and improve survey imagery quality