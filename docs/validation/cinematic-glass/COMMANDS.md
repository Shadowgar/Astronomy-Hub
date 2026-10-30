# Exact qualification commands and evidence classes

Node: `/home/rocco/.nvm/versions/node/v22.22.0/bin/node`; npm uses that PATH.
Working branch `cinematic-glass-1`, base4fa9ffd8. Output root `output/cinematic-glass`.

- `npm --prefix frontend test`:337 tests in52 files passed.
- `npm --prefix frontend run typecheck`:passed.
- `node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs`:252 passed.
- `python3 tests/runtime/test_sky_promotion.py`:3 promotion tests passed
  (test module invocation details retained in native agent output).
- `node scripts/validation/inspect_glass_material.mjs`:actual Solar computed filter,
  transparency toggle and scene capture passed. Baseline4220 run retained missing
  option failure (`GLASS_BASE`, `GLASS_OUT` envs).
- `node scripts/validation/verify_cinematic_glass.mjs`:three viewports ×three modes
  ×baseline/candidate. `GLASS_RESUME=1` reuses completed observations and retries
  only the affected incomplete case. Historical/failed records retained separately.
- `node scripts/validation/verify_glass_accessibility.mjs`:keyboard/focus/reload,
  OS reduced transparency, native preference, Night, forced colors and44px targets.
- `node scripts/validation/verify_glass_compositing.mjs`:actual bright Earth globe
  under Solar dialog, plus explicitly labeled filter-disabled/opaque diagnostics.
- `python3 scripts/validation/measure_glass_pixels.py`:stdlib read-only PNG decoding
  and comparison, no image generation/edit or new dependency. Pixel changes are
  compositing evidence, not an aesthetic score.
- `INTEGRATION_BASE=http://127.0.0.1:4221 INTEGRATION_OUT=output/cinematic-glass/integration node scripts/validation/verify_earth_sky_completion.mjs`:
  fresh desktop/mobile native camera/time/history/touch/lifetime journeys.
- Same env prefix with `INTEGRATION_OUT=output/cinematic-glass/recovery node scripts/validation/verify_earth_sky_completion_recovery.mjs`:
  fresh observing/wheel/native handoff and actual Solar WebGL loss/retry/disposal.
- `npm --prefix frontend run build -- --outDir ../output/cinematic-glass/hub --emptyOutDir`,
  repeated with `hub-repeat`:complete payload comparison; native pinned offline
  Docker UI build repeated separately (recipe below).
- `python3 scripts/validation/verify_cinematic_references.py` and
  `python3 scripts/validation/verify_solar_assets.py`:original bytes pass.
- `python3 scripts/validation/verify_glass_delivery.py`:source/manifest/repeated/served
  identities and protected paths; full output retained.
- `python3 scripts/validation/validate_architecture_docs.py`, `git diff --check`.

Native recipe preserves source023e3b26 and the existing qualified JS/WASM. Apply
`apply_sky_overlay.py`, `integrate_sky_bridge.py`; run in isolated stages with
`--network none --user1001:1001`, qualified readonly node_modules and pinned
`node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0`,
`ORAS_RUNTIME_PUBLIC_PATH=/oras-sky-engine/`, `ORAS_RUNTIME_COPY_SKYDATA=0`,
`NODE_OPTIONS=--openssl-legacy-provider --max-old-space-size=4096`, `npm run build`.
110 emitted native files repeat exactly;4 native/vendor files preserved. Shared and
native material source hashes are bound into promotion/marker/lock. Native WASM
remains d62afde16d3695adc1f33401a51fa715cfa7618e8a5a1b82f5cbbd40f1fad942.
`record_runtime_versions.py` reuses unchanged qualified E1 Earth artifact.
Host Hub builds are supporting compilation evidence; actual native UI builds,
readonly nginx runtime serving, API and browser journeys use Docker. No production
deployment/build qualification or physical GPU benchmark is claimed.

Backend/source contracts were not changed. Prior23 science and28 search/observability
Docker passes are retained historical source-preserved evidence, not fresh reruns.
No full N1 navigation suite or unrelated resource troubleshooting occurred.

Versioned command-output text copies normalize trailing whitespace/terminal line endings only; raw local output remains under output/cinematic-glass and named /tmp build logs. No result or failure text is rewritten.
