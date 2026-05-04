# Stellarium Source Relocation — 2026-05-04

## Selected Strategy

Option C: vendor the working Stellarium source at the repo root and let the clean `/sky-engine` React boundary consume the running vendor runtime.

Why this approach was selected:

- the working Stellarium tree is a large standalone upstream-style source tree with its own Make and SCons flow
- the working browser runtime is a Vue app under `apps/web-frontend`
- the current working launch path depends on that app's own dev-server proxy for `/remote-data`
- burying that tree under React component source would make the clean boundary harder to maintain and would not improve runtime ownership

## Previous Primary Source Path

- `/home/rocco/Astronomy-Hub/study/stellarium-web-engine/source/stellarium-web-engine-master`

## New Primary Source and Runtime Paths

- source root: `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine`
- runtime working directory: `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/web-frontend`
- wasm build output: `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/build`
- local sky data: `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/test-skydata`
- route wrapper: `/home/rocco/Astronomy-Hub/frontend/src/features/sky-engine`

`/study` is retained as a reference source only. The repo's active scripts and route wrapper now target the vendor path.

## Launch and Build Commands

Before relocation:

- launch helper: `cd /home/rocco/Astronomy-Hub && npm run dev:stellarium`
- direct launch: `cd /home/rocco/Astronomy-Hub/study/stellarium-web-engine/source/stellarium-web-engine-master/apps/web-frontend && npm run dev -- --host 0.0.0.0 --port 8080`
- asset prep: `cd /home/rocco/Astronomy-Hub && bash scripts/prepare-stellarium-reference.sh`

After relocation:

- launch helper: `cd /home/rocco/Astronomy-Hub && npm run dev:stellarium`
- direct launch: `cd /home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/web-frontend && npm run dev -- --host 0.0.0.0 --port 8080`
- build helper: `cd /home/rocco/Astronomy-Hub && npm run build:stellarium`
- asset prep: `cd /home/rocco/Astronomy-Hub && bash scripts/prepare-stellarium-reference.sh`

## Asset Strategy

- preserve the vendor tree's own wasm and js engine artifacts in `apps/web-frontend/src/assets/js`
- preserve sky data in `apps/test-skydata`
- preserve the upstream build products in `build/`
- keep the Vue app's existing `/remote-data` proxy behavior by running the vendor app on port `8080`
- do not recreate rendering logic inside React

## Route Strategy

- `/sky-engine` now resolves to `frontend/src/features/sky-engine/SkyEnginePage.tsx`
- `SkyEnginePage.tsx` renders `StellariumRuntimeHost.tsx`
- `StellariumRuntimeHost.tsx` probes the moved runtime on `http://<current-host>:8080`
- when the vendor runtime is available, the route mounts it through an iframe
- when the runtime is unavailable, the route shows the exact launch and build commands needed to start it

## Local Fixes Preserved

- helper scripts pin Vue to `2.6.12` with matching `vue-template-compiler`
- helper scripts build engine wasm and js artifacts into the vendor app asset folder
- helper scripts regenerate the compatibility satellite feed by stripping unsupported `launch_date` fields
- the vendor app `.gitignore` was normalized to ignore local `yarn.lock` directly instead of the old study-relative path

## Blockers

- no blocker for the moved launch path if the vendored app dependencies and assets remain present
- static embedding through the main React build was not selected because the working vendor runtime currently relies on its own Vue dev-server proxy for `/remote-data`