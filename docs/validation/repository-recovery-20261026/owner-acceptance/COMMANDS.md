# Context and focused commands

Fresh task context: `AGENTS.md`; `docs/context/CORE_CONTEXT.md`; `LIVE_SESSION_BRIEF.md`; `CONTEXT_MANIFEST.yaml`; `docs/validation/SYSTEM_VALIDATION_SPEC.md`; `docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md`; `docs/design/ASTRONOMY_HUB_CINEMATIC_REFERENCE_2026-10-21.md`; `UNIFIED_WORKSPACE_DESIGN_SPEC.md`; existing recovery preview receipt/config. Frontend/validation/review packs and previously loaded recovery/source evidence were reused; no full docs scan. The owner's current bounded UX request supersedes historical stop points only for preview/evaluation and small repairs.

Executed in the existing recovery worktree unless noted:

```sh
git status --short
git branch --show-current
git rev-parse HEAD
python3 output/playwright/owner-acceptance/preview.py
curl --fail http://127.0.0.1:4231/api/v1/health
# Windows read-only availability/access checks via powershell.exe
# Windows Node + Playwright: inspection, journeys and final Sky recheck
"/mnt/c/Program Files/nodejs/node.exe" "$(wslpath -w "$PWD/output/playwright/owner-acceptance/inspect.mjs")"
"/mnt/c/Program Files/nodejs/node.exe" "$(wslpath -w "$PWD/output/playwright/owner-acceptance/journeys.mjs")"
"/mnt/c/Program Files/nodejs/node.exe" "$(wslpath -w "$PWD/output/playwright/owner-acceptance/sky-recheck.mjs")"
# Run before/after the respective repairs; outputs preserved separately.
"/mnt/c/Program Files/nodejs/node.exe" "$(wslpath -w "$PWD/scripts/validation/verify_owner_earth_search.mjs")" "$(wslpath -w "$PWD/output/playwright/owner-acceptance/earth-final-green")"
# In frontend/:
npm test -- --run tests/earthSearch.test.ts tests/earthDirectSearch.test.tsx tests/earthCinematic.test.tsx tests/earthLocationNavigation.test.ts
npm run typecheck
VITE_SOURCE_REVISION="$(git rev-parse HEAD)" npm run build -- --outDir ../output/playwright/owner-acceptance/hub --emptyOutDir
# Task-owned preview config switched to /owner-review/hub; no existing service changed.
docker exec pr107-owner-preview nginx -s reload
node --check scripts/validation/verify_owner_earth_search.mjs
git diff --check
```

Results: initial HEAD0cad847b/clean; real API healthy; Windows localhost HTTP200; all five modes rendered. Initial36-step captures32PASS/4FAIL: one measured cold search delay, two incorrect native-panel/mobile-Time interactions, and one real Sources pointer obstruction. Final narrow Sky3/3PASS and Earth3/3PASS replace those inconclusive/failing cases; no failed initial run is relabeled green. Separate22/22 tests, typecheck/build pass. Earlier incorrect labels/placeholders and relative Windows output assumptions are retained in initial receipts; focused RED output was at the script's default `earth-search/` before being preserved as `earth-search-red/`.

Native111-file comparison: zero differences. Owner settings hash `6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`; owner legacy TLE `431592eb5ec6db56d79c26792853f3fafe36ddf76c98834d9ddb36ddc0846436`, unchanged. New preview uses the preserved recovered TLE release read-only. Windows recorder helper installed only in the task user's Playwright cache. No firewall, public listener, external tunnel, production/data-volume mutation, new branch/PR, main merge or deployment.

Separate reviewer: no actionable findings in0cad847b→3e4459f7 after revision/focus guards; no actionable findings in3e4459f7→47fcc14c after Sources repair. Reviewed code and actual saved RED/GREEN evidence; no independent release or owner acceptance inferred.
