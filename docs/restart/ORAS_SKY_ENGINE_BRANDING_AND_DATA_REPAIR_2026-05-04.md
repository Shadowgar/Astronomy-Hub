# ORAS Sky-Engine Branding And Data Repair — 2026-05-04

## Scope

This slice repaired two user-visible problems on the vendored Sky Engine runtime:

- front-facing branding still showed Stellarium strings during load and in the runtime shell
- the runtime was registering local `/skydata/...` sources that the dev server was not actually serving

This work does not claim full Stellarium parity.

## Files Changed

- `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/web-frontend/vue.config.js`
- `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/web-frontend/public/index.html`
- `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/web-frontend/src/components/gui-loader.vue`
- `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/web-frontend/src/components/toolbar.vue`
- `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/web-frontend/src/locales/en.json`
- `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/web-frontend/src/locales/de.json`
- `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/web-frontend/src/locales/fr.json`
- `/home/rocco/Astronomy-Hub/frontend/src/features/sky-engine/SkyEnginePage.tsx`
- `/home/rocco/Astronomy-Hub/frontend/src/features/sky-engine/RuntimeHost.tsx`
- `/home/rocco/Astronomy-Hub/frontend/src/features/sky-engine/README.md`
- `/home/rocco/Astronomy-Hub/frontend/src/features/sky-engine/stellarium/README.md`
- `/home/rocco/Astronomy-Hub/frontend/src/features/sky-engine/stellarium/stellariumRuntimeBridge.ts`
- `/home/rocco/Astronomy-Hub/frontend/src/features/sky-engine/stellarium/stellariumRuntimeDiscovery.ts`
- `/home/rocco/Astronomy-Hub/frontend/src/features/sky-engine/StellariumRuntimeHost.tsx` deleted

## Branding Changes

- browser title changed from `Stellarium Web Online Star Map` to `ORAS Sky-Engine`
- meta description and keywords now describe `ORAS Sky-Engine`
- noscript fallback now says `ORAS Sky-Engine`
- startup loader title now shows `ORAS Sky-Engine`
- startup loading text now says `Loading ORAS Sky-Engine, the online Star Map`
- toolbar wordmark now shows `ORAS Sky-Engine`
- the clean `/sky-engine` React wrapper now uses `ORAS Sky-Engine` in its visible heading, iframe title, and status copy

## Splash / Logo Change

- the visible Stellarium splash text was replaced with an ORAS-only wordmark in `gui-loader.vue`
- the toolbar no longer uses the visible Stellarium wordmark/logo pairing; it now renders an ORAS-only toolbar title
- the upstream icon asset was not renamed internally; the visible Stellarium logo usage was suppressed at the entry points above

## Data Path Repair

### Root Cause

The vendored Vue config still copied sky data from `../skydata`, but the actual vendored data tree lives at:

- `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/test-skydata`

Because of that mismatch, the running dev server returned `404 Not Found` for the exact URLs registered by `App.vue`, including:

- `/skydata/landscapes/guereins/...`
- `/skydata/surveys/milkyway/...`
- `/skydata/tle_satellite.jsonl.gz`

### Fix

- `vue.config.js` now mounts `/skydata` from `../test-skydata` during dev-server runtime
- `vue.config.js` now copies the build-time skydata tree from the same `../test-skydata` source into `dist/skydata`

## Runtime Data Status

### Landscape

- status: repaired
- proof: `/skydata/landscapes/guereins/properties` now returns `HTTP/1.1 200 OK`
- runtime evidence: browser screenshot showed the landscape silhouette rendered in the live scene

### Milky Way / Survey Data

- status: repaired at the serving layer
- proof: `/skydata/surveys/milkyway/properties` now returns `HTTP/1.1 200 OK`
- note: this validates the previously broken local survey path is now served; no `/skydata/surveys/milkyway` 404 remained after the fix

### Satellites

- status: repaired for the local bundled feed path
- proof: `/skydata/tle_satellite.jsonl.gz` now returns `HTTP/1.1 200 OK`
- runtime evidence: the live runtime rendered a visible satellite track/object after the repair

## Remaining Non-Blocking Notes

- `rg -n "Stellarium|Stellarium Web" vendor/stellarium-web-engine/apps/web-frontend/src frontend/src/features/sky-engine frontend/public` still returns upstream copyright headers, preserved internal upstream naming, and a `Stellarium Labs` credit link in the data credits dialog
- those remaining matches were intentionally preserved because they are attribution or internal-safe identifiers, not front-facing product branding on the repaired runtime shell
- the embedded iframe route can emit a transient aborted request during page reload as the iframe is replaced; runtime availability still settles correctly and the route mounts the live engine afterward
- an embedded-browser geolocation permissions-policy warning was observed on the host route; it is unrelated to the skydata repair and did not block engine rendering

## Commands Run

- `cd /home/rocco/Astronomy-Hub && npm run build:stellarium`
- `cd /home/rocco/Astronomy-Hub && npm run dev:stellarium:restart`
- `cd /home/rocco/Astronomy-Hub && curl -I --max-time 10 http://127.0.0.1:8080`
- `cd /home/rocco/Astronomy-Hub && curl -I --max-time 10 http://127.0.0.1:8080/skydata/landscapes/guereins/properties`
- `cd /home/rocco/Astronomy-Hub && curl -I --max-time 10 http://127.0.0.1:8080/skydata/surveys/milkyway/properties`
- `cd /home/rocco/Astronomy-Hub && curl -I --max-time 10 http://127.0.0.1:8080/skydata/tle_satellite.jsonl.gz`
- `cd /home/rocco/Astronomy-Hub/frontend && npm run typecheck`
- `cd /home/rocco/Astronomy-Hub/frontend && npm run test`
- `cd /home/rocco/Astronomy-Hub/frontend && npm run build`
- `cd /home/rocco/Astronomy-Hub && git diff --check`
- `cd /home/rocco/Astronomy-Hub && rg -n "Stellarium|Stellarium Web" vendor/stellarium-web-engine/apps/web-frontend/src frontend/src/features/sky-engine frontend/public`
- `cd /home/rocco/Astronomy-Hub && rg -n "directStarLayer|WebGL2StarsOwner|WebGL2StarsHarness|painterPort|StarsModule|runtimeFrame|@babylonjs|babylon" frontend/src/features/sky-engine frontend/package.json`

## Validation Results

- `npm run build:stellarium`: pass
- `npm run dev:stellarium:restart`: pass
- `curl -I http://127.0.0.1:8080`: pass with `HTTP/1.1 200 OK`
- `curl -I /skydata/landscapes/guereins/properties`: pass with `HTTP/1.1 200 OK`
- `curl -I /skydata/surveys/milkyway/properties`: pass with `HTTP/1.1 200 OK`
- `curl -I /skydata/tle_satellite.jsonl.gz`: pass with `HTTP/1.1 200 OK`
- runtime browser check: pass
  - page title was `ORAS Sky-Engine`
  - toolbar showed `ORAS Sky-Engine`
  - embedded route showed `ORAS Sky-Engine` and the ORAS loading splash
  - live scene rendered stars, landscape, and a visible satellite
- `frontend npm run typecheck`: pass
- `frontend npm run test`: pass
- `frontend npm run build`: pass
- `git diff --check`: pass
- forbidden legacy renderer grep: `clean`

## Next Task

Route the vendored runtime through the same origin as the main frontend so `/sky-engine` can load the engine without depending on a separate port `8080` process.