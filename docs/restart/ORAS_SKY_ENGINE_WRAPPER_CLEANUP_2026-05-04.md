# ORAS Sky-Engine Wrapper Cleanup — 2026-05-04

## Scope

This slice removed the large full-width host banner from the healthy `/sky-engine` route, kept runtime utility actions in a compact overlay, and added a `Hub Frontpage` entry to the vendored ORAS Sky-Engine drawer above `View Settings`.

This work did not reintroduce any deleted custom sky-engine code and did not change the repaired sky data layout.

## Files Changed

- `/home/rocco/Astronomy-Hub/frontend/src/features/sky-engine/RuntimeHost.tsx`
- `/home/rocco/Astronomy-Hub/frontend/src/features/sky-engine/stellarium/stellariumRuntimeBridge.ts`
- `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/web-frontend/src/App.vue`
- `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/web-frontend/src/locales/en.json`

## Wrapper / Header Result

### Previous Behavior

Healthy `/sky-engine` showed a large wrapper banner above the runtime with:

- `Sky Engine`
- `ORAS Sky-Engine`
- runtime path copy
- `Recheck Runtime`
- `Open Standalone Runtime`

That banner consumed vertical space and made the engine feel secondary.

### New Healthy Behavior

- the large full-width top wrapper/status banner is removed
- the embedded ORAS runtime fills the route area directly
- the route now uses a compact overlay in the top-right corner for:
  - `ORAS Sky-Engine Live`
  - `Recheck Runtime`
  - `Open Standalone Runtime`
- the runtime begins at the top of the route content area with no extra host header block above it

### Unavailable Fallback Behavior

When the runtime is unavailable, the route now shows a single full-page fallback state with:

- `ORAS Sky-Engine unavailable`
- launch command: `npm run dev:stellarium`
- build command: `npm run build:stellarium`
- install command: `cd /home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/web-frontend && npm install`
- `Recheck Runtime`
- `Open Standalone Runtime`

## Runtime Probe Adjustment

The host route availability check was updated during this cleanup.

### Root Cause

The prior fetch-based probe could leave the host route in the fallback state even while the runtime was already healthy.

### Fix

- `stellariumRuntimeBridge.ts` now uses a cross-origin image probe against the vendored runtime favicon instead of the prior fetch/abort pattern
- after the fix, the healthy route reliably settles into the embedded runtime view

## Menu Result

### Added Item

- label: `Hub Frontpage`
- placement: first drawer item
- position: above `View Settings`
- icon: `mdi-home-variant-outline`

### Navigation Behavior

- when embedded in the host route, the runtime uses `document.referrer` to derive the frontend origin and navigates the top window back to `/`
- when not embedded, it falls back through `window.top`, `window.parent`, then `window.location`

### Verified Result

- hamburger menu opens
- `Hub Frontpage` appears above `View Settings`
- clicking `Hub Frontpage` from the embedded runtime returned the top page to `http://127.0.0.1:4173/`

## Browser Verification

Verified in the integrated browser against:

- `http://127.0.0.1:4173/sky-engine`
- `http://127.0.0.1:8080`

Observed results:

- healthy `/sky-engine` no longer shows the large wrapper/status banner
- the runtime begins at the top of the route area
- compact overlay controls remain available without a full-width host header
- runtime drawer shows `Hub Frontpage` above `View Settings`
- clicking `Hub Frontpage` from the embedded runtime returned to the Hub frontpage
- ORAS branding remained intact
- landscape remained rendered
- satellites remained rendered
- no front-facing Stellarium text reappeared

## Screenshot / Artifacts

- runtime drawer screenshot captured in-session showing `Hub Frontpage` above `View Settings`
- healthy `/sky-engine` screenshot captured in-session showing the compact live overlay and full-bleed runtime

The browser screenshot tool did not emit stable workspace file paths for these images, so no repository file paths are available for the captured artifacts.

## Commands Run

- `cd /home/rocco/Astronomy-Hub && npm run build:stellarium`
- `cd /home/rocco/Astronomy-Hub && npm run dev:stellarium:restart`
- `cd /home/rocco/Astronomy-Hub && curl -I --max-time 10 http://127.0.0.1:8080`
- `cd /home/rocco/Astronomy-Hub/frontend && npm run typecheck`
- `cd /home/rocco/Astronomy-Hub/frontend && npm run test`
- `cd /home/rocco/Astronomy-Hub/frontend && npm run build`
- `cd /home/rocco/Astronomy-Hub && git diff --check`
- `cd /home/rocco/Astronomy-Hub && rg -n "Stellarium|Stellarium Web" vendor/stellarium-web-engine/apps/web-frontend/src frontend/src/features/sky-engine frontend/public`
- `cd /home/rocco/Astronomy-Hub && if rg -n "directStarLayer|WebGL2StarsOwner|WebGL2StarsHarness|painterPort|StarsModule|runtimeFrame|@babylonjs|babylon" frontend/src/features/sky-engine frontend/package.json; then exit 1; else echo clean; fi`

## Validation Results

- `npm run build:stellarium`: pass
  - non-blocking webpack asset-size warnings only
- `npm run dev:stellarium:restart`: pass
- `curl -I --max-time 10 http://127.0.0.1:8080`: pass with `HTTP/1.1 200 OK`
- `frontend npm run typecheck`: pass
- `frontend npm run test`: pass
- `frontend npm run build`: pass
- `git diff --check`: pass
- branding grep: pass with expected remaining matches only
  - upstream copyright comments
  - `Stellarium Labs` attribution link in data credits
- forbidden legacy renderer grep: pass with `clean`

## Remaining Non-Blocking Notes

- the host route still shows a browser permissions-policy warning for geolocation inside the embedded runtime; this does not block rendering, the drawer item, landscape, or satellites
- the compact live overlay is intentionally still visible in the healthy state so standalone/recheck controls remain accessible without restoring a full-width wrapper banner

## Next Task

Move the compact host overlay actions into the vendored runtime itself or into the drawer so the embedded route can become completely chrome-free while still preserving runtime utility actions.