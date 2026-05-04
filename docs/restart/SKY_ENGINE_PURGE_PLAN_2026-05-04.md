# Sky Engine Purge Plan

Date: 2026-05-04

## Scope

Delete the failed custom Sky Engine implementation and renderer-port lane while preserving the frontend app shell, Hub route, shared layout/navigation, build configuration, and the `/study` Stellarium source tree.

## Delete Targets

- `frontend/src/features/sky-engine/`
- `frontend/src/pages/SkyEnginePage.tsx`
- `frontend/src/pages/stellariumWebUiAssets.ts`
- Sky-engine-only tests under `frontend/tests/`, including files matching these lanes:
  - `*sky-engine*`
  - `*sky_engine*`
  - `*webgl2*`
  - `*painter*`
  - `*stellarium_renderer*`
  - module parity and runtime replay tests that only exercise `frontend/src/features/sky-engine/**`
- `docs/runtime/port/` after preserving one small restart summary
- Old renderer/profiling output under `output/playwright/` tied to the deleted lane
- `parity_list.md` if it only tracks the deleted sky-engine parity lane

## Keep Targets

- `study/`
- Frontend startup and shell:
  - `frontend/src/main.jsx`
  - `frontend/src/App.jsx`
  - `frontend/src/routes/AppRouter.tsx`
  - layout/navigation used by the Hub page under `frontend/src/components/layout/**`
- Hub/home route implementation on `/`
- Shared frontend query/state/features that power the Hub page and are not tied to the deleted sky-engine tree
- Frontend build/package/config files:
  - `frontend/package.json`
  - `frontend/tsconfig.json`
  - `frontend/vite.config.mjs`
  - lockfiles and root package metadata if still needed
- General docs that are not specific to the failed sky-engine lane

## Routes To Remove Or Replace

- Keep `/sky-engine`, but replace its element with a clean placeholder page from `frontend/src/features/stellarium-sky/`
- Remove any route element imports that point at `frontend/src/pages/SkyEnginePage.tsx`

## Hub Link Updates

- Preserve the existing Hub link target in `frontend/src/components/layout/foundation/ScenePanel.jsx`
- Keep it pointing to `/sky-engine`, now backed by the placeholder page

## Imports Expected To Break

- `frontend/src/routes/AppRouter.tsx` currently imports `../pages/SkyEnginePage`
- `frontend/src/pages/SkyEnginePage.tsx` imports the legacy tree under `../features/sky-engine/**`
- Any remaining imports from these deleted prefixes must be removed:
  - `features/sky-engine`
  - `pages/SkyEnginePage`
  - `pages/stellariumWebUiAssets`

## Packages Likely No Longer Needed

- `@babylonjs/core`
- `@babylonjs/addons`

These should only be removed if no active app source, guard script, or retained test imports them after the purge.

## Validation Commands

Run after the purge:

```bash
cd /home/rocco/Astronomy-Hub/frontend
npm run typecheck
npm run build
npm run test
```

```bash
cd /home/rocco/Astronomy-Hub
git diff --check
rg "features/sky-engine" frontend/src
rg "directStarLayer|WebGL2StarsOwner|WebGL2StarsHarness|painterPort|StarsModule" frontend/src
rg "babylon" frontend/src frontend/package.json
```

## Expected End State

- Hub route `/` still renders
- `/sky-engine` resolves to a clean Stellarium-backed placeholder page
- No active frontend source imports the deleted sky-engine tree
- Babylon/WebGL2 owner-harness code is absent from active app code
- `/study` remains intact for the next integration task