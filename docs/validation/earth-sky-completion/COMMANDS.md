# Qualification command ledger

All commands ran in isolated Earth/Sky worktrees, against disposable Docker
previews. Logs copied into `evidence/logs/*.txt` retain actual outputs and failed
attempts. Node executable: `/home/rocco/.nvm/versions/node/v22.22.0/bin/node`.
No full stalled N1 suite or resource-management investigation was rerun.

## Earth source-matched evidence retained from E1

- `node --test tests/runtime/*.test.mjs tests/earth-runtime/*.test.mjs`:242 passed.
- `npm --prefix frontend test -- --run`:336 passed in51 files.
- Focused EarthSearch frontend follow-up:6 passed in2 files.
- `npm --prefix frontend exec tsc -- --noEmit`:pass.
- `node scripts/validation/verify_earth_completion.mjs`:18 groups across3 sizes.
- `node scripts/validation/verify_earth_completion_search.mjs`:live Paris/address,
  invalid coordinates and controlled refocus error passed.
- Earth pinned repeat build and Hub repeat build:byte-identical emitted files.

These are E1 observations, not new S1 reruns. E1 source/artifact and Hub application
source remain unchanged by S1; the combined browser journeys are new observations.

## S1 and combined result

- `node --test tests/runtime/*.test.mjs tests/earth-runtime/*.test.mjs`:250 passed.
- `npm --prefix frontend test -- --run`:336 passed in51 files; Hub source unchanged
  by the subsequent adapter-only native-SSO repair.
- `npm --prefix frontend exec tsc -- --noEmit`:pass.
- `docker exec -e PYTHONPATH=/work -e ORAS_PLANETARY_EPHEMERIS_DIR=/runtime/planetary-ephemeris -w /work oras-cinematic-hub-backend python3 -m pytest -o cache_dir=/tmp/earth-sky-completion-pytest backend/tests/test_solar_exploration.py -q`:23 passed,2 deprecation warnings.
- Same Docker prefix, `backend/tests/test_earth_search.py backend/tests/test_observability_service.py -q`:28 passed,2 deprecation warnings.
- `node scripts/validation/capture_sky_completion_scenes.mjs`:native Moon/Jupiter/M42,
  wide/close and expanded context, constellation overlays and atmosphere capture.
- `S1_OUT=output/earth-sky-completion/sky-final node scripts/validation/verify_sky_completion.mjs`:final three-size native display, preference, selection/focus checks.
- `node scripts/validation/verify_earth_sky_completion.mjs`:10 groups, desktop/mobile.
- `node scripts/validation/capture_earth_sky_comparison.mjs`:baseline/candidate native
  Earth/Sky at three viewports; diagnostics retained with screenshots.
- `node scripts/validation/verify_earth_sky_completion_recovery.mjs`:focused observing,
  wheel handoff and actual WebGL loss/retry/disposal.
- `python3 scripts/validation/verify_earth_sky_completion_delivery.py`:111 native Sky,
 136 Hub and514 Earth served files;110 native UI and136 Hub repeated files identical.
- `python3 scripts/validation/verify_cinematic_references.py`:original archive/images pass.
- `python3 scripts/validation/verify_solar_assets.py`:original qualified assets pass.
- `python3 scripts/validation/validate_architecture_docs.py`:documentation/authority validation.
- `git diff --check`:required before commit.

## Reproducible native UI build

Native source anchor `023e3b26babf7ffddf45f39293230b14cfe96993` is extracted into
`output/earth-sky-completion/sky-ui` and `sky-repeat`. Apply:
`python3 scripts/runtime/apply_sky_overlay.py <stage>` and
`python3 scripts/runtime/integrate_sky_bridge.py <stage>/apps/web-frontend`.
Reuse the qualified native JS/WASM inputs; no native compilation or source patch.
For each stage run:

```sh
docker run --rm --network none --user 1001:1001 \
  -v "$PWD/output/earth-sky-completion/$stage/apps/web-frontend:/work" \
  -v /var/tmp/oras-phase-c/sky-reconstruction/upstream/apps/web-frontend/node_modules:/work/node_modules:ro \
  -w /work -e ORAS_RUNTIME_PUBLIC_PATH=/oras-sky-engine/ \
  -e ORAS_RUNTIME_COPY_SKYDATA=0 \
  -e NODE_OPTIONS='--openssl-legacy-provider --max-old-space-size=4096' \
  node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0 npm run build
```

Native WASM SHA256 stays
`d62afde16d3695adc1f33401a51fa715cfa7618e8a5a1b82f5cbbd40f1fad942`.
Legacy build asset-size/Browserslist warnings are retained, not dependency upgrades.
Promotion uses `record_sky_workspace.py`; Earth identity uses
`record_runtime_versions.py`. Hub build command:
`npm --prefix frontend run build -- --outDir ../output/earth-sky-completion/hub --emptyOutDir`,
repeated with `hub-repeat`. Docker nginx serves these exact readonly build bytes.
Host Hub compilation is supporting evidence; actual serving/browser/API/native UI
build evidence uses Docker. No production build/deployment is claimed.

## Retained failed evidence

Initial display preference tests, standalone restore test and native Moon identity
test failed before their corresponding repairs. Early browser Earth overlap and
hidden error findings were fixed in E1. Native Moon originally selected successfully
but lacked Hub canonical context; repaired through existing JPL API identity.
One scene harness attempted PageUp while the search retained focus; close-up capture
now uses the native adapter zoom API and is labeled accordingly. A separate new
integration journey clicks the canvas and verifies genuine keyboard zoom.
Initial Jupiter query selected Jupiter's Ghost Nebula; corrected scene capture
requires the exact Jupiter result and `source_id=jupiter`. That earlier capture is
not planet qualification. These failures are retained rather than relabeled passes.
