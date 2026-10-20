# Commands and evidence

Executed from `.worktrees/r2-earth-ux-performance-1`; output logs are retained under
`output/r2-earth-ux`, with selected immutable logs in `evidence/`. No dependency
install, resource cleanup, original-service restart/stop or timeout increase.

| Exact command / operation | Result |
|---|---|
| `gh pr view 79 --repo Shadowgar/Astronomy-Hub --json headRefOid,headRefName,baseRefName,isDraft,state,url` |OPEN DRAFT,158a77053ea18e4d0aed8725f715ca373930fd13; base r2-a-earth-search-1|
| `git worktree add .worktrees/r2-earth-ux-performance-1 -b r2-earth-ux-performance-1 158a77053ea18e4d0aed8725f715ca373930fd13` |New isolated branch; root owner settings left untouched|
| Pinned Docker invocation below with `ORAS_EARTH_OUT=/proof/earth-baseline`, then `python3 output/r2-earth-ux/finish-earth.py output/r2-earth-ux/earth-baseline` |Instrumented unchanged-timer baseline;29562cba artifact; archived exact helper and source patch|
| `bash output/r2-earth-ux/build-native.sh earth-final-first` and `... earth-final-second` |Two identical cb1f579d artifacts;513 files,111 dependency notices|
| `python3 scripts/runtime/record_runtime_versions.py output/r2-earth-ux/earth-final-first` |Verified artifact/source identity; source pin unchanged|
| `npm --prefix frontend run build -- --outDir ../output/r2-earth-ux/hub-touch-first` and `... hub-touch-second` |Final independent identical130-file Hub builds2db5ec09|
| `GODS_EYE_SOURCE=/var/tmp/oras-cesium/gods-eye node --test --test-concurrency=1 tests/runtime/*.test.mjs tests/earth/*.test.mjs` |231PASS,0fail; all-runtime-final-tests.txt|
| Pinned Docker Node24 `node --test --test-isolation=none` Earth file list in [exact argv](evidence/docker-earth-command.json) |143PASS,0fail; Python-only export check included in full host suite|
| `npm --prefix frontend test` |293PASS,42files; frontend-delivery-tests.txt|
| `npm --prefix frontend run typecheck` |Exit0; typecheck-delivery.txt|
| `docker exec -w /work oras-r2-earth-ux-backend python -m pytest backend/tests/test_earth_search.py backend/tests/test_earth_aircraft.py backend/tests/test_earth_events.py tests/validation/test_recorded_earth_search.py -q -p no:cacheprovider` |52PASS;13 existing deprecation warnings|
| `node scripts/validation/measure_r2_earth_imagery.mjs` |Baseline36 cases,108 PNGs, real providers|
| `R2_BASE=http://127.0.0.1:4206 R2_EVIDENCE=output/playwright/r2-earth-ux-after node scripts/validation/measure_r2_earth_imagery.mjs` |After36 cases,108 PNGs; same native geometry/source policies|
| `python3 scripts/validation/summarize_r2_earth_imagery.py output/playwright/r2-earth-ux-baseline` and `... r2-earth-ux-after` |Sealed per-case timing/source/tile/network/capture records|
| `node scripts/validation/verify_r2_earth_direct_search.mjs` |Final19 groups desktop and19 mobilePASS; recorded genuine candidates, actual camera/time/history/Sky return|
| `node scripts/validation/verify_r2_earth_direct_live.mjs` |One normal backend Springfield lookup200/five candidates; coordinate recoveryPASS; source-matched initial artifact only, not called final-artifact rerun|
| `R2_EVIDENCE=output/playwright/r2-earth-ux-mobile-panels-red node scripts/validation/verify_r2_earth_mobile_panels.mjs` |RED: expanded Close intercepted|
| `R2_EVIDENCE=output/playwright/r2-earth-ux-mobile-context-red node scripts/validation/verify_r2_earth_mobile_panels.mjs` |RED: Tonight target intercepted|
| `R2_EVIDENCE=output/playwright/r2-earth-ux-mobile-panels-final node scripts/validation/verify_r2_earth_mobile_panels.mjs` |GREEN: both targets and search recoveryPASS|
| `python3 scripts/validation/verify_r2_earth_ux_delivery.py` |Committed source/served bytes,107 original container states/mounts,90volumes, settings/pins/Sky and rollback bytesPASS; rerun at final head|
| `git diff --check` |PASS before commits|

The baseline Docker invocation was:

```sh
docker run --rm --user 1001:1001 -v /var/tmp/oras-cesium/gods-eye:/source:ro -v /home/rocco/Astronomy-Hub/.worktrees/r2-earth-ux-performance-1:/hub:ro -v /home/rocco/Astronomy-Hub/.worktrees/r2-earth-ux-performance-1/output/r2-earth-ux:/proof -w /hub -e GODS_EYE_SOURCE=/source -e ORAS_EARTH_OUT=/proof/earth-baseline node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 node /source/node_modules/vite/bin/vite.js build --configLoader native --config /hub/runtimes/earth-runtime/vite.config.mjs
```

Exact subsequent native Docker build invocation is retained in [build helper](evidence/build-native.sh),
with [static-assets/manifest helper](evidence/finish-earth.py), using the existing
pinned node:24.14.0-bookworm-slim digest, read-only upstream/application mounts,
qualified preexisting dependencies and an output-only bind. No Docker bulk data.
Two task-owned backends and three previews were created from existing images;
only task-owned artifact directories were promoted after browser processes closed.
Original107 containers/mounts/states and90 volumes were verified unchanged.

Focused RED/GREEN logs cover the trace module, direct-search field/duplicate Explore
search, optional zoom contract/delegation, post-settlement delay, observer-failure
isolation, native label-scale bound and mobile pointer stacking. The initial
Explore SSR RED included a missing-router harness error; a corrected Router fixture
then failed the actual duplicate-field assertion against preserved baseline Explore
(`explore-duplicate-red.txt`) before final293-test GREEN. Intermediate JSX syntax
was corrected before qualification. Initial Docker143-test attempt failed only the
known missing-Python export harness;142 application tests passed. The corrected
Docker selection and complete host suite both pass. No failed attempt is relabeled.

The baseline observation patch was checked against158a7705 in a temporary Git index:
`git read-tree 158a77053ea18e4d0aed8725f715ca373930fd13`, followed by
`git apply --cached --check docs/validation/r2-earth-ux-performance/evidence/baseline-observation.patch`;
exit0. The owner index/worktree was never changed by that check.
