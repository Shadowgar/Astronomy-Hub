# ORAS Sky-Engine Chrome Removal — 2026-05-04

## Scope

This slice removed the last healthy-state host chrome from `/sky-engine` and relocated the remaining useful host actions into the vendored ORAS Sky-Engine runtime drawer.

The host remains a thin runtime boundary.

This slice does not reintroduce legacy sky-engine renderer code, Babylon usage, WebGL2 harness code, or a host-owned renderer.

## Files Changed

- `/home/rocco/Astronomy-Hub/frontend/src/features/sky-engine/RuntimeHost.tsx`
- `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/web-frontend/src/App.vue`
- `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/web-frontend/src/locales/en.json`

## Healthy Route Result

- the healthy `/sky-engine` route no longer renders any host overlay
- removed host elements:
  - `ORAS Sky-Engine Live`
  - `Recheck Runtime`
  - `Open Standalone Runtime`
- healthy state now renders only the embedded ORAS Sky-Engine runtime iframe
- the runtime fills the route surface from the top of the page

## Drawer Actions Added

The vendored runtime drawer now starts with:

1. `Hub Frontpage`
2. `Recheck Runtime`
3. `Open Standalone Runtime`
4. `View Settings`

Behavior:

- `Hub Frontpage` returns the top-level app to `/`
- `Recheck Runtime` sends a host action request when embedded
- `Open Standalone Runtime` opens the standalone runtime URL when embedded

## postMessage Bridge

Because the healthy host overlay was removed, the relocated runtime actions now use an iframe-to-parent message bridge.

Runtime action messages:

- `oras-sky-engine:recheck-runtime`
- `oras-sky-engine:open-standalone-runtime`

Host handling:

- `RuntimeHost.tsx` listens for runtime-origin messages from the vendored runtime origin
- `oras-sky-engine:recheck-runtime` triggers the parent runtime probe
- `oras-sky-engine:open-standalone-runtime` opens the standalone runtime in a new tab

Vendored runtime handling:

- `App.vue` posts the message to `window.top` or `window.parent` when embedded
- standalone fallback behavior remains available when the runtime is not embedded

## Fallback Behavior

Unavailable state remains a full-page help panel.

It preserves:

- `ORAS Sky-Engine unavailable`
- launch command
- install command
- build command
- `Recheck Runtime`
- `Open Standalone Runtime`
- moved runtime path details

## Browser Verification

Healthy runtime checks passed:

- fresh `http://127.0.0.1:4173/sky-engine` settled into the embedded runtime viewport
- no healthy-state host overlay remained above the runtime
- runtime toolbar still showed `ORAS Sky-Engine`
- runtime drawer showed `Hub Frontpage`, `Recheck Runtime`, and `Open Standalone Runtime` above `View Settings`
- clicking `Hub Frontpage` returned the top-level page to `http://127.0.0.1:4173/`
- clicking `Open Standalone Runtime` opened `http://127.0.0.1:8080/` in the browser context

Bridge check passed:

- with a loaded embedded runtime page still present, `:8080` was forced down
- a runtime-origin `oras-sky-engine:recheck-runtime` message was sent from the iframe context
- the host switched to the unavailable fallback panel and showed `Recheck Runtime` plus `Open Standalone Runtime`

Fallback checks passed:

- a fresh `http://127.0.0.1:4173/sky-engine` page while `:8080` was down showed the full fallback panel
- fallback copy changed from `Checking the vendored ORAS Sky-Engine runtime.` to `The vendored runtime is not responding. Start it with the command below, then retry.`
- fallback controls remained visible and clickable

## Commands Run

- `cd /home/rocco/Astronomy-Hub && npm run build:stellarium`
- `cd /home/rocco/Astronomy-Hub && npm run dev:stellarium:restart && curl -I --max-time 10 http://127.0.0.1:8080`
- `cd /home/rocco/Astronomy-Hub && curl -I --max-time 10 http://127.0.0.1:8080`
- `cd /home/rocco/Astronomy-Hub/frontend && npm run typecheck && npm run test && npm run build`
- `cd /home/rocco/Astronomy-Hub && git diff --check`
- `cd /home/rocco/Astronomy-Hub && rg -n "Stellarium|Stellarium Web" vendor/stellarium-web-engine/apps/web-frontend/src frontend/src/features/sky-engine frontend/public`
- `cd /home/rocco/Astronomy-Hub && if rg -n "directStarLayer|WebGL2StarsOwner|WebGL2StarsHarness|painterPort|StarsModule|runtimeFrame|@babylonjs|babylon" frontend/src/features/sky-engine frontend/package.json; then exit 1; else echo clean; fi`
- `cd /home/rocco/Astronomy-Hub && bash scripts/dev-stellarium-local.sh status`
- `cd /home/rocco/Astronomy-Hub && (pkill -f "vue-cli-service serve.*--port 8080" || true) && (pkill -f "npm run dev -- --host 0.0.0.0 --port 8080" || true) && (rm -f .run/dev-stellarium/stellarium.pid || true) && (curl -I --max-time 5 http://127.0.0.1:8080 || true)`

## Validation Results

- `npm run build:stellarium`: pass
- first immediate `curl -I` after `npm run dev:stellarium:restart`: timed out during startup settle, not accepted as final proof
- settled `curl -I http://127.0.0.1:8080`: pass with `HTTP/1.1 200 OK`
- `frontend npm run typecheck`: pass
- `frontend npm run test`: pass
- `frontend npm run build`: pass
- `git diff --check`: pass
- branding grep: pass with only allowed matches
  - upstream copyright comments
  - `Stellarium Labs` attribution link in `data-credits-dialog.vue`
- forbidden legacy renderer grep: pass with `clean`
- browser verification: pass

## Remaining Blockers

No blocking issue remains for this slice.

Non-blocking notes:

- `scripts/dev-stellarium-local.sh down` stops the managed PID file process but can leave an external `vue-cli-service serve` process alive on port `8080`; browser fallback verification required explicitly stopping that external process
- the immediate `curl` right after runtime restart can still time out before the Vue dev server finishes settling; a short follow-up probe succeeds once startup completes
- the embedded route still emits a geolocation permissions-policy warning in the browser; it does not block runtime rendering, drawer actions, or the fallback panel