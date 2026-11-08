# Exact finalization commands

Worktree `.worktrees/repository-recovery-20261026`; application revision 5ef2b8a52c6542f18ff616481439598c6140d7bf. Raw logs are gzip-preserved under receipts; read with `gzip -cd`.

```sh
docker exec -e PYTHONPATH=/work -w /work oras-repository-recovery-20261026-backend python3 -m pytest backend/tests/test_satellite_feed_api.py -k validation_diagnostics -q -p no:cacheprovider
# Red: 3 failed,19 deselected. After the fixed public-reason boundary:
docker exec -e PYTHONPATH=/work -w /work oras-repository-recovery-20261026-backend python3 -m pytest backend/tests/test_satellite_feed_api.py backend/tests/test_satellite_tle_release_pipeline.py -q -p no:cacheprovider
# Final: 28 passed, 2 warnings.
(cd frontend && npm test -- --run tests/workspaceTime.test.tsx)
# UI red: 2 failed/20 passed; final focused: 22 passed.
(cd frontend && npm run build -- --outDir ../output/recovery/p0-finalization-hub)
(cd frontend && npm test -- --run)
(cd frontend && npm run typecheck)
# Final: 386 passed/58 files; build/typecheck exit 0.
node --experimental-test-isolation=none --test tests/runtime/satellite-presentation.test.mjs tests/runtime/satellite-tracking.test.mjs
python3 -m unittest discover -s tests/runtime -p test_native_satellite_source_stage.py -v
# 14 and 5 pass respectively.
P0_BENCH_OUT=output/playwright/p0-satellite-finalization/discovery-qualified-api node scripts/validation/benchmark_satellite_discovery.mjs
node scripts/validation/verify_satellite_mobile_usability.mjs
# Mobile portrait/landscape real-touch paths pass; desktop guard fails; exit2.
P0_VIEWPORT=1440x900 P0_ZOOM_DESKTOP=1 P0_USABILITY_OUT=output/playwright/p0-satellite-finalization/desktop-zoom node scripts/validation/verify_satellite_mobile_usability.mjs
# Separate desktop capture:point-only passes; initial Polaris reference unavailable; exit2.
P0_CONTROLS_OUT=output/playwright/p0-satellite-finalization/tracking-final node scripts/validation/verify_satellite_tracking_controls.mjs
node output/playwright/p0-satellite-finalization/smoke.mjs
node output/playwright/p0-satellite-finalization/guidance-check.mjs
# 3 layout journeys, 10 route surfaces, 3 reachable guidance checks pass.
git status --short
git diff --check
```

The smoke script is a path-preserving copy of the existing recovery harness into the task output directory, avoiding overwriting earlier evidence. No native Sky rebuild was performed because native/adapter/generated Sky inputs did not change. Hub output was copied only into its existing task bind after comparing every Sky payload byte; task backend restart loaded the changed service. These actions did not deploy production or modify protected data.

Open alert 79 was retrieved from the named CodeQL alert/PR review thread. One read-only investigator traced the source-to-sink boundary; one fresh reviewer checked the actual backend diff and direct callers. Plugin-owned remediation evidence is retained through the Codex Security artifact tool; repository receipts follow the owner's requested validation location. No scan-wide or independent-integration approval is implied.
