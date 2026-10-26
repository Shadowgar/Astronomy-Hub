# Commands and evidence

Working directory `.worktrees/sky-satellite-observing-1`; existing Node22 and
`/home/rocco/Astronomy-Hub/.venv/bin/python`. No dependency installation.

```sh
PATH=/home/rocco/.nvm/versions/node/v22.22.0/bin:$PATH npm --prefix frontend test
PATH=/home/rocco/.nvm/versions/node/v22.22.0/bin:$PATH npm --prefix frontend run typecheck
/home/rocco/.nvm/versions/node/v22.22.0/bin/node --test tests/runtime/protocol.test.mjs tests/runtime/workspace-protocol.test.mjs tests/runtime/satellite-simulation.test.mjs tests/runtime/satellite-presentation.test.mjs tests/runtime/satellite-tracking.test.mjs
```

415 frontend / 60 files, TypeScript,27 native tests pass. RED/GREEN logs cover missing
simulation contract, explicit labeling, pass cards, microsecond normalization and
simulation tracking controls. Additional tests cover paused reload, selection-only
URL preservation and departed-client acknowledgement rejection. Native historical
motion tests were not rerun as new product qualification.

Backend exact Docker commands/results and verified exit0: [backend report](evidence/backend/RESULTS.md).
85tests pass;316dependency deprecations retained. One prior combined execution
reported143 after a passing summary, so that result alone was not counted; the
bounded detached Docker rerun supplies independently inspected exit0.

```sh
PATH=/home/rocco/.nvm/versions/node/v22.22.0/bin:$PATH npm --prefix frontend run build -- --outDir ../output/satellite-observing/hub --emptyOutDir
PATH=/home/rocco/.nvm/versions/node/v22.22.0/bin:$PATH npm --prefix frontend run build -- --outDir ../output/satellite-observing/hub-repeat --emptyOutDir
docker run --rm --network none --user 1001:1001 -v /home/rocco/Astronomy-Hub:/home/rocco/Astronomy-Hub:ro -v "$PWD/output/satellite-observing/vite-temp:/home/rocco/Astronomy-Hub/frontend/node_modules/.vite-temp" -v "$PWD/output/satellite-observing/hub-container:$PWD/output/satellite-observing/hub-container" -w "$PWD" node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 npm --prefix frontend run build -- --outDir ../output/satellite-observing/hub-container --emptyOutDir
/home/rocco/Astronomy-Hub/.venv/bin/python scripts/validation/start_satellite_observing_preview.py
python3 scripts/validation/verify_satellite_observing_delivery.py
```

All three builds exit0, existing chunk-size warnings;143files identical and every
served byte matches. Candidate verifier CANDIDATE_VERIFIED does not bind a new
commit or assert browser acceptance. Final `--committed` receipt is separate.
Windows Invoke-WebRequest to172.26.23.204:4228 returnedHTTP200/410bytes.
Only the new backend was restarted to load its final tested source; unrelated
workloads and original preview configurations remain untouched.

```sh
SO_OUT=output/satellite-observing/browser-delivery /home/rocco/.nvm/versions/node/v22.22.0/bin/node scripts/validation/verify_satellite_observing.mjs
python3 scripts/validation/verify_satellite_observing_delivery.py --committed
git status --short
git diff --check
git log --oneline -5
```

Browser proof/recordings are generated under `output/satellite-observing/` with
source identities and actual state/assertions. The final report records results;
commands listed here are not evidence that an unfinished step passed.

Accuracy analysis reused preserved source-matched capture inputs; exact commands,
pinned source identities and new numerical outputs: [investigation](evidence/accuracy/REPORT.md).
No native math/artifact or source data was changed by that investigation.

Documentation validation:

```sh
python3 scripts/validation/validate_architecture_docs.py
```

PASS:391 manifest document-path entries across8packs;68 checkpoint documents,
1884relative references and10expected ADRs. Historical private artifacts remain
explicitly registered; no new runtime proof is inferred from this check.

Independent proposal review: [report](evidence/review/proposal-review.md), immutable
`e5efd5ca2ecfc3344b57f4262023157f1e7d1763`, draft PR103; no actionable P1/P2.
Pre-delivery implementation review: [two reproduced races](evidence/review/pre-review.md).
Final correction results and exact-head review are separate from this initial review.

Final async correction:

```sh
/home/rocco/.nvm/versions/node/v22.22.0/bin/node frontend/node_modules/vitest/vitest.mjs run tests/workspaceIntentRaces.test.tsx tests/workspaceRuntimeAdapter.test.ts tests/workspaceSelectionSync.test.ts tests/workspaceTime.test.tsx tests/workspace.test.tsx tests/satellitePasses.test.tsx --root frontend
/home/rocco/.nvm/versions/node/v22.22.0/bin/node frontend/node_modules/typescript/bin/tsc --noEmit -p frontend/tsconfig.json
```

93 tests / 6 files pass, including 19 new intent-race cases. Initial 12 failures
are retained alongside GREEN evidence. Final full frontend run:415 tests /60 files,
0 failures. [Exact repair results](evidence/review/intent-RESULTS.md).

Final browser command exits0:39/36/36 assertions,3viewports PASS, source_unchanged=true. [Full proof and recordings](BROWSER.md). All three final builds exit0;143served files match.

Versioned text logs have trailing whitespace and extra blank EOF lines removed for repository whitespace checks. Original command output remains unchanged under `output/satellite-observing/`. No assertions, counts, warnings or errors were removed.
