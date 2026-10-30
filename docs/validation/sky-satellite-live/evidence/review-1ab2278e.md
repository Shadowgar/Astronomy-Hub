# Independent exact-HEAD technical review

Reviewed HEAD: `1ab2278e8fc9f66dd27247c64594afdbed147d71`.
Base: PR95 `9ee6d85982edb3db276490706a82af83538e5e8d`.
Branch: `sky-satellite-live-repair-1`; PR101 is the parent-reported open draft stacked on PR95. This reviewer made no commits, pushes, GitHub messages, source changes, release acquisitions, merges or deployments. Only this ignored review artifact was written.

## Result

**No P0–P2 actionable findings. One P3 API boundary regression.** The four earlier review corrections are present and the focused checks below pass. This result does not approve current orbital accuracy, owner acceptance, physical GPU behavior, merge or deployment.

### P3 — Bound the freshness window at the supported datetime limits

File: `backend/app/services/satellite_feed_status_service.py:45`.

`_parse_time` accepts valid timezone-qualified ISO dates near years 1 and 9999, but the new expression `as_of + window` / `as_of - window` can raise `OverflowError`. Requests to `/api/sky/satellite-feed?time=0001-01-01T00:00:00Z` and `...?time=9999-12-31T00:00:00Z` now return HTTP500. The ordinary `2026-06-04T02:58:00Z` request returns HTTP200. The PR95 implementation returns a controlled `ok/unavailable` result for both boundary dates using the same mounted environment. The route catches `ValueError`, so this exception bypasses its controlled invalid-request handling.

Suggested narrow correction: saturate the search bounds at timezone-aware `datetime.min` / `datetime.max`, or reject unsupported extremes through the existing `ValueError`/HTTP400 contract. Add one focused boundary regression. This is low priority because the new Hub status hook requests present UTC; the current and June 2026 qualification paths are unaffected.

## Source and evidence review

- Configured alternate feed/manifest filenames cannot borrow canonical release provenance. Canonical names and common directory are checked before release validation; fallback remains unvalidated and reports the configured file's parsed count.
- Embedded Track A → select B releases A's satellite lock. Native pointer identity `v` preserves equivalent native wrappers. Standalone watcher updates do not clear the native lock. Other native-object locks remain outside the satellite helper's release scope.
- Native hints-off and offset changes are observed before widening/release, including immediate release before a reactive watcher runs. Existing5°/7° thresholds and native point/photometry behavior remain unchanged.
- Native tracking invokes the existing native `pointAndLock`; the helper does not mutate time, observer, FOV, atmosphere or propagation. The existing focus semantics were not redefined.
- Committed native-motion evidence: all 8 source hashes match HEAD;3 viewports each record5 PASS control groups; all 3 served markers match admitted Sky artifact `c8edee7e59ec889c07abb8f5fd870dc3d4b8d724aca151ec464f372531793dbf`.
- Committed status evidence: all 5 source hashes match HEAD; all 3 viewport runs PASS. Committed navigation summary: all 9 source hashes match HEAD,22 checkpoints PASS, matching Sky artifact.
- All 30 committed screenshot hashes match their manifest. The portrait Live/Tracking/Stale-data screenshot was visually inspected.
- Final `output/sky-satellite-live/delivery.json` is PASS, `candidate:false`, exact reviewed HEAD,142 Hub files / 111 Sky files served. This parent-produced final receipt was inspected, not independently rerun by this reviewer. The committed candidate receipt is correctly a precommit receipt at PR95 with 27 source hashes that all match the reviewed source.
- The browser runner separates frozen satellite on/off point pixels, central identification glyph pixels, native historical 1× time progression and fixed-camera point displacement. Its current Live phase is explicitly limited to clock/camera mechanics because the mounted TLEs are stale. No broad browser campaign was repeated.

## Fresh checks run by this reviewer

Working directory: `/home/rocco/Astronomy-Hub/.worktrees/sky-satellite-live-repair-1`.

```sh
/home/rocco/.nvm/versions/node/v22.22.0/bin/node --test tests/runtime/satellite-presentation.test.mjs tests/runtime/satellite-tracking.test.mjs tests/runtime/sky-landscape-context.test.mjs tests/runtime/sky-artifact.test.mjs
PYTHONDONTWRITEBYTECODE=1 /home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_satellite_feed_api.py -q -p no:cacheprovider
PATH=/home/rocco/.nvm/versions/node/v22.22.0/bin:$PATH npm --prefix frontend test -- --run tests/workspaceTime.test.tsx tests/workspace.test.tsx
git diff --check
git status --short
git rev-parse HEAD
```

Results: runtime/artifact 28 passed, 0 failed; backend 16 passed with 1 existing httpx `app` shortcut deprecation warning; frontend 25 passed across 2 files; diff check exit 0; tracked worktree clean; HEAD unchanged. These local reruns support the review and do not replace the retained Docker/browser evidence. The broader 114 runtime / 384 frontend / 39 Docker / 6 promotion-source counts are inspected parent evidence, not fresh reviewer reruns.

Boundary reproduction used `TestClient(app, raise_server_exceptions=False)` and GET `/api/sky/satellite-feed` with each time above: ordinary UTC 200, lower boundary 500, upper boundary 500. An in-memory `exec(compile(git show BASE:backend/app/services/satellite_feed_status_service.py))` comparison produced:

```text
PR95 0001-01-01T00:00:00Z controlled ok unavailable
HEAD 0001-01-01T00:00:00Z OverflowError date value out of range
PR95 9999-12-31T00:00:00Z controlled ok unavailable
HEAD 9999-12-31T00:00:00Z OverflowError date value out of range
```

Read-only Python SHA256 comparisons produced zero mismatches for the 8 motion, 5 status, 9 navigation, 27 candidate source hashes and 30 screenshots described above.

## Context and residual gates

Default Mode; existing `frontend_change`, `backend_change`, `validation`, `review`, `debug` packs. Loaded project context: bounded/current portions of `docs/context/CORE_CONTEXT.md`, `docs/context/LIVE_SESSION_BRIEF.md`, `docs/context/CONTEXT_MANIFEST.yaml`; `docs/validation/SYSTEM_VALIDATION_SPEC.md`; `docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md`; task `README.md`, `ROOT_CAUSES.md`, `FILES_CHANGED.md`, `loaded-documents.json`, `COMMANDS.md`; task source-audit `REPORT.md`; task navigation summary; task motion/status/source/artifact/screenshot evidence referenced above. These are registered pack documents or explicitly supplied task evidence. No broad `/docs` scan or unrelated project documents were loaded. The parent-established 59-document inventory was consulted as an inventory, not claimed as a fresh full reread. The owner attachment and requesting-code-review/verification-before-completion skills defined review scope.

The retained evidence and report correctly leave these gates open:

- All 14,281 mounted TLE records are stale at current UTC. Neither bounded CelesTrak request returned bytes; no source release was promoted. Current Live orbital accuracy remains BLOCKED.
- Browser evidence is Chromium software rendering and emulated mobile input. Physical-device/GPU behavior and actual owner functional acceptance remain open.
- Navigation retains 59 tile 404s, 17 aborted requests and 4 SwiftShader warnings. Docker tests retain inherited deprecations. Warning-clean qualification is not established.
- The earlier startup failure cause remains unresolved; its failing evidence is retained.
- Native hints-off is preserved within the existing frame and on release. A new native frame resets to its baseline default; persistent cross-frame satellite hint preferences remain unimplemented and explicitly disclosed.

Recommended next action: optionally correct the bounded P3 date-window exception, rerun its focused regression and refresh the exact-HEAD review if source changes. Otherwise deliver the qualified historical/control result for owner review with the current-source gate intact. The next current-orbit task remains approved source availability and a separately qualified fresh staged release; no acquisition, promotion, merge or production deployment is authorized by this review.
