# Exact P0 commands and results

Run from `.worktrees/repository-recovery-20261026` unless noted. Code revision:ab861073c62bbbf82b9e4f214389931b6ebe2f9f. Later commits are evidence/context only.

```sh
node --experimental-test-isolation=none --test tests/runtime/satellite-presentation.test.mjs tests/runtime/satellite-tracking.test.mjs
python3 -m unittest discover -s tests/runtime -p test_native_satellite_source_stage.py -v
(cd frontend && npm test -- --run)
(cd frontend && npm run typecheck)
(cd frontend && npm run build -- --outDir ../output/recovery/p0-hub-build)
docker exec -e PYTHONPATH=/work -w /work oras-repository-recovery-20261026-backend python3 -m pytest backend/tests/test_satellite_feed_api.py backend/tests/test_satellite_tle_release_pipeline.py -q -p no:cacheprovider
P0_CONTROLS_OUT=output/playwright/p0-native-satellites/tracking-layout-red node scripts/validation/verify_satellite_tracking_controls.mjs
P0_CONTROLS_OUT=output/playwright/p0-native-satellites/tracking-final node scripts/validation/verify_satellite_tracking_controls.mjs
CIN_SKY_BASE=http://127.0.0.1:4230 CIN_SKY_OUT=output/playwright/p0-native-satellites/controls-final node scripts/validation/verify_cinematic_sky.mjs
node scripts/validation/compare_native_satellite_reference.mjs
P0_OUT=output/playwright/p0-native-satellites/qualified node scripts/validation/verify_native_satellite_live_pixels.mjs
node output/playwright/p0-native-satellites/make-contact-sheets.mjs
git diff --check
git status --short
```

Results:14 Node tests;5 parser tests;384 frontend tests/58 files; typecheck exit0; Hub build exit0 with existing chunk warning; Docker24 passed/2 warnings. Tracking red exit1 (drawer handle intercepts Stop), final green3 viewport journeys; observing controls3 viewport journeys. Original comparison2 matched native scenes, exit0. Final Live check exits2:desktop motion plus real selection/Track/Stop proved; later mobile interval unproven. Earlier matching-native mobile motion is preserved and independently adjudicated; it is not substituted for that final interval.

Original comparison setup used only the existing lock-pinned cached engine files. Copy `stellarium-web-engine.js` from `/var/tmp/oras-phase-c/sky-reconstruction/upstream/apps/web-frontend/src/assets/js/` to `output/recovery/p0-reference/engine.mjs`, copy its WASM to `engine.wasm`, and copy `receipts/original-harness.html` to that directory's `index.html`. The existing task nginx `/evidence/` alias serves this isolated reference; no product route/config is changed. The validator checks the original WASM digest against the renderer lock before use.

The exact archived artifact was retrieved with the connected GitHub download-workflow-artifact tool, artifact12630695024; its ZIP/release digests were checked before extraction to the previously absent task mount. `docker start oras-repository-recovery-20261026-backend oras-repository-recovery-20261026-preview` restored only those two task containers. No external science catalog was overwritten and no new source-acquisition timestamp was asserted.

The Hub build's changed files were copied into the existing task-owned `output/recovery/hub` bind after byte-comparing every native payload; replaced entry files are retained under `output/recovery/p0-hub-before-control`. Exact changed asset hashes are in `receipts/hub-preview-update.json`. This is isolated preview qualification, not deployment. Full rebuilt output remains under `output/recovery/p0-hub-build`.
