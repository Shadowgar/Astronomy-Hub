# Exact validation commands and results

Terminal logs are archived as lossless UTF-8 JSON strings with their original byte SHA256; JSON escaping retains original terminal whitespace. Proof JSON retains its original status.

Working directory: `.worktrees/cinematic-hub-integration-1`. Shell exit statuses and proof JSON are retained in the evidence bundle; representative browser screenshots are in the gallery. `timeout` bounds remained fixed; none were increased to obtain passes.

```bash
npm --prefix frontend test
npm --prefix frontend run typecheck
node --test tests/earth/*.test.mjs tests/runtime/*.test.mjs
```

Final fresh result:319tests/49files passed; TypeScript exit0;239native tests passed. [Frontend](evidence/frontend-tests.log.json), [TypeScript](evidence/typecheck.log.json), [native](evidence/native-final-tests.log.json).

```bash
docker exec -e PYTHONPATH=/work -e ORAS_PLANETARY_EPHEMERIS_DIR=/runtime/planetary-ephemeris -w /work oras-cinematic-hub-backend python3 -m pytest -o cache_dir=/tmp/cinematic-acceptance-pytest backend/tests/test_solar_exploration.py -q
docker compose ps --format json
```

23passed, two existing deprecation warnings. [Docker log](evidence/docker-science.log.json). No backend/scientific source was changed.

```bash
R3_BASE=http://127.0.0.1:4217 R3_EVIDENCE=output/cinematic-acceptance/navigation timeout 240s node scripts/validation/verify_cinematic_hub.mjs
CINEMATIC_BASE=http://127.0.0.1:4217 CINEMATIC_LIFECYCLE_EVIDENCE=output/cinematic-acceptance/lifecycle timeout 180s node scripts/validation/verify_cinematic_lifecycle.mjs
```

Final source:14desktop +14mobile groups passed; lifecycle7passed. [Navigation](evidence/navigation.json), [lifecycle](evidence/lifecycle.json). Native original assets were deliberately aborted/held only in the separately labeled lifecycle fault-injection cases. The lifecycle script uses the current expanded body set's actual draw-call reduction rather than the obsolete three-body absolute count.

```bash
CIN_ACCEPT_WIDTHS=1440 timeout 180s node scripts/validation/verify_cinematic_earth_acceptance.mjs
CIN_ACCEPT_WIDTHS=390 CIN_ACCEPT_OUT=output/cinematic-acceptance/earth-mobile timeout 180s node scripts/validation/verify_cinematic_earth_acceptance.mjs
CIN_ACCEPT_WIDTHS=1440 CIN_ACCEPT_UI_ONLY=1 CIN_ACCEPT_OUT=output/cinematic-acceptance/earth-desktop-final timeout 90s node scripts/validation/verify_cinematic_earth_acceptance.mjs
```

Four functional checks each desktop/mobile; three later desktop UI checks with source/loading labels, plus six native camera/LOD observations. Actual DPR1/2/3 framebuffer measurements passed separately. The first desktop run predates the harness's extra bounded later-load capture; it is not mislabeled as that later run. [Early desktop](evidence/earth-desktop.json), [mobile](evidence/earth-mobile.json), [later desktop](evidence/earth-desktop-later.json), [DPR baseline](evidence/earth-dpr-baseline.json), [DPR green](evidence/earth-dpr-green.json).

```bash
CIN_SKY_BASE=http://127.0.0.1:4217 CIN_SKY_OUT=output/cinematic-acceptance/sky/green node scripts/validation/verify_cinematic_sky_acceptance.mjs
CIN_SKY_BASE=http://127.0.0.1:4217 CIN_SKY_OUT=output/cinematic-acceptance/sky/green-scenes node scripts/validation/inspect_cinematic_sky_acceptance.mjs
CIN_SKY_BASE=http://127.0.0.1:4217 CIN_SKY_WIDTHS=667 CIN_SKY_OUT=output/cinematic-acceptance/sky/green-short-scenes node scripts/validation/inspect_cinematic_sky_acceptance.mjs
python3 - <<'PY_SHORT'
from pathlib import Path
s = Path('scripts/validation/verify_cinematic_sky.mjs').read_text()
needle = '[[1440,900],[390,900],[667,390]]'
assert s.count(needle) == 1
s = s.replace(needle, '[[667,390]]').replace(
    "'../../node_modules/playwright/index.mjs'",
    repr((Path.cwd() / 'node_modules/playwright/index.mjs').as_uri()))
Path('/tmp/cinematic-sky-native-short.mjs').write_text(s)
PY_SHORT
CIN_SKY_BASE=http://127.0.0.1:4217 CIN_SKY_OUT=output/cinematic-acceptance/sky/native-short-regression node /tmp/cinematic-sky-native-short.mjs
```

The native short run used a temporary copy of the existing validator, changing only the viewport matrix and resolving its Playwright import absolutely; no unsupported viewport environment variable or product change was used. Focused journey5passed; native short3passed. Six scene slices completed separately; enclosing failed/interrupted attempts remain separately labeled. [Slice provenance](evidence/sky-completed-slices.json), [focused journey](evidence/sky-green.json), [short native](evidence/sky-native-short.json), [original failed scene audit](evidence/sky-scene-failed.json). No claim of an uninterrupted full scene-suite pass.

```bash
SOLAR_BASE=http://127.0.0.1:4217 SOLAR_OUT=output/cinematic-acceptance/solar/final-qualified node scripts/validation/verify_solar_acceptance.mjs
SOLAR_BASE=http://127.0.0.1:4217 SOLAR_OUT=output/cinematic-acceptance/solar/approach-motion-green node scripts/validation/verify_solar_approach_motion.mjs
SOLAR_BASE=http://127.0.0.1:4217 SOLAR_OUT=output/cinematic-acceptance/solar/performance node scripts/validation/measure_solar_acceptance_performance.mjs
```

345checks across five viewports; normal motion2passed. Performance measured24real orbit steps per case on SwiftShader; GPU timer unsupported. [Final Solar](evidence/solar-final.json), [motion red](evidence/solar-motion-red.json), [motion green](evidence/solar-motion-green.json), [performance](evidence/solar-performance.json), [source identities](evidence/solar-source-sha256.json). The15s readiness timeout is preserved with UNKNOWN cause in [its failed probe](evidence/solar-readiness-failed.json).

```bash
python3 scripts/validation/verify_cinematic_references.py
python3 scripts/validation/verify_solar_assets.py
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/validate_reconciliation_docs.py
git diff --check
```

Original archive/four PNGs/NASA source bytes/Mars UVs pass. Documentation counts and exact output are in the committed logs. Existing asset hashes and original reference images remain unchanged.

```bash
npm --prefix frontend run build -- --emptyOutDir --outDir ../output/cinematic-acceptance/hub
npm --prefix frontend run build -- --emptyOutDir --outDir ../output/cinematic-acceptance/hub-second
docker run --rm --network none --user 1001:1001 -v /home/rocco/Astronomy-Hub/.worktrees/cinematic-hub-integration-1:/work:ro -v /home/rocco/Astronomy-Hub/frontend/node_modules:/work/frontend/node_modules:ro -v /home/rocco/Astronomy-Hub/.worktrees/cinematic-hub-integration-1/output/cinematic-acceptance:/proof -w /work/frontend node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 node --input-type=module -e 'globalThis.__dirname="/work/frontend";const{build}=await import("/work/frontend/node_modules/vite/dist/node/index.js");await build({root:"/work/frontend",configFile:"/work/frontend/vite.config.mjs",configLoader:"native",build:{outDir:"/proof/hub-docker",emptyOutDir:true}})'
```

Three identical136-file Hub builds. Earth used two offline builds with the same pinned Node24 image, mounted immutable `/var/tmp/oras-cesium/gods-eye:/source:ro`, this worktree `/hub:ro`, separate `/output`, `GODS_EYE_SOURCE=/source`, `ORAS_EARTH_OUT=/output`, and command `node /source/node_modules/vite/bin/vite.js build --configLoader native --config /hub/runtimes/earth-runtime/vite.config.mjs`. Existing qualified static SDK assets/licenses were copied without alteration, then `record_owned_earth.py` and `record_runtime_versions.py` recorded identities. [Earth reproducibility](evidence/earth-reproducibility.json). Sky's UI-only build preserved all native/vendor scientific bytes; [artifact preservation](evidence/sky-artifact-preservation.json).

The task's delivery and preservation scripts verify three Hub/two Earth trees,136Hub/514Earth served bytes, original data/settings/kernel/pins/rollback,117original container states/mounts and90volumes. [Delivery receipt](evidence/delivery.json), [preservation](evidence/preservation.json). Source/preview identities are rechecked after commit and reported in PR88. No merge/deployment commands were run.

The native Sky UI build used an isolated `git archive` of SWE pin `023e3b26babf7ffddf45f39293230b14cfe96993` (`apps/web-frontend` only), `apply_sky_overlay.py`, and `integrate_sky_bridge.py`. Existing qualified `stellarium-web-engine.js`/`.wasm` were copied from the preserved N1 native-horizon build; the WASM SHA was asserted against the lock before building. No native compilation or dependency installation ran. Exact build/promotion commands:

```bash
docker run --rm --network none --user 1001:1001 -v /home/rocco/Astronomy-Hub/.worktrees/cinematic-hub-integration-1/output/cinematic-acceptance/sky/native-ui-build/apps/web-frontend:/work -v /var/tmp/oras-phase-c/sky-reconstruction/upstream/apps/web-frontend/node_modules:/work/node_modules:ro -w /work -e ORAS_RUNTIME_PUBLIC_PATH=/oras-sky-engine/ -e ORAS_RUNTIME_COPY_SKYDATA=0 -e NODE_OPTIONS='--openssl-legacy-provider --max-old-space-size=4096' node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0 npm run build
python3 scripts/runtime/record_sky_workspace.py output/cinematic-acceptance/sky/native-ui-build/apps/web-frontend/dist
```

Promotion output: `SKY WORKSPACE ARTIFACT b1dbd0f039ccf4ed4c0a669baf5bd7288b1ea07c9db98e199c04949431a644fb native WASM/vendor chunks unchanged 111 files`. Build warnings remain in [the log](evidence/sky-native-ui-build.log.json).
