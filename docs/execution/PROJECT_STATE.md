# `PROJECT_STATE.md`


---

# PROJECT STATE — EXECUTION AUTHORITY

---

## PURPOSE

Defines the **current, factual execution state** of Astronomy Hub.

This is the only document that defines:

* what is being worked on
* what is active
* what is allowed
* what is constrained

Authority follows `docs/validation/SYSTEM_VALIDATION_SPEC.md`, then core context
and live session brief, then the document index and this execution record.
Proven runtime conflicts must be reported, not silently overwritten.

## CURRENT MODE

Owner-authorized integration/repository hygiene, SINGLE AGENT ONLY. Laptop WSL
and local/disposable Docker; no runtime override mode or new feature phase.
PR #63 / bounded HD Earth is COMPLETE after owner approval and normal merge
`126da1537c734de817d9f9c59468d995807da37c` on 2026-10-05. The exact approved
head is `a9f3e207235d42399d37d8c51b18103f6edcbb87`; initial main was
`70daeb8087a5439dc27d1a5da3d64d8ec436f495`. The merged tree is identical.

## CURRENT OBJECTIVE / ACTIVE TASK

Integrate the preserved local-development repair and the Sky wheel/search/routing,
Gaia-loading and ORAS-controls chain as two separately reviewable, unmerged PRs.
Tooling original `1cb71b84` is replayed as `8d2b3742` directly on new main,
without source conflicts or semantic changes. Its integration branch is
`dev-wsl-performance-integration-20261005`. The original branch/commit and both
Sky originals (`5328afba`, `7b2d4927`) remain reachable and untouched.
Sky's installed-data launcher extends tooling, so its PR will be stacked on the
tooling branch; its review diff must contain only Sky changes.
See [local repair evidence](../validation/LOCAL_DEVELOPMENT_REPAIR_EVIDENCE.md).

PR #58's unified workspace and PR #59's complete C5 package remain preserved,
as do merged Sky lifecycle #60, Tonight fallback #61 and context enforcement #62.
Earth retains one owned Cesium Viewer and immutable pinned God's Eye feature
modules; Sky retains contained SWE with one active heavy renderer.

## CURRENT PRIORITY

Fresh unchanged-main Docker smoke passed four cases: live ORAS USGS detail,
outside-CONUS global fallback, C5 event/surface fixture controls and a canonical
Sky → Earth → Sky transition. Earth identity remains
`ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d`.
Historical feature campaign evidence remains in
[HD mapping evidence](../validation/EARTH_HD_MAPPING_EVIDENCE.md); it is not
assigned to reconstructed follow-up branches.

Review the tooling PR first and the stacked Sky PR second; neither is authorized
for merge by this integration task. Preserve owner editor settings unchanged and
unstaged, and retain Docker volumes/datastores. HD imagery is CONUS-focused and
historical; lower-resolution global fallback and ellipsoid-only terrain remain.
Global HD, terrain/3D and physical-device qualification are separately gated.
ISS, Mars/Moon, measured horizon and provider expansion have not started.
Production/SSH/Cloudflare/oras.org work is deferred to an owner-declared Release
Candidate; historical openclaw storage is not a feature blocker or next action.

## KNOWN ISSUES

* Gaia DR3-scale ingestion and zoom-aware star delivery are not complete
* DSO media and higher-definition imagery remain incomplete
* Pan-STARRS does not provide safe full-sky default coverage
* WordPress consumption of `/api/above-me` has not started

## REVIEW-HISTORY DISPOSITION

The obsolete embedded navigation-drawer messages are superseded by host-owned
workspace controls. `runtimes/sky-adapter/plugin.js` hides the embedded toolbar
and drawer, while the Sky overlay retains standalone fallbacks. Restore neither
obsolete host handlers nor hidden embedded controls merely to close an old thread.

The merged `a45fa637` corrections already address Live time, custom-observer
timezones and Earth source refresh. Merged PR #60 preserves the Sky endpoint and
resets inactive interaction/timers on cached departure, retaining genuine cleanup.
Merged PR #61 preserves local Messier rows through partial enrichment failures,
recovers canonical OpenNGC deduplication and retains accurate source status.
Any separately authorized future source changes require their own
qualification; an unresolved older thread is an inventory item, not proof of a
current defect or authorization for a broad implementation pass.

---

## HARD CONSTRAINTS

Must preserve:

```text
Scope → Engine → Filter → Scene → Object → Detail → Assets
```

And:

* Hub = product context/shell and astronomy decision layer; future universal
  state owns product intent, engines own internal scene/camera/selection behavior
* engines = domain authority
* when a viewport is mounted, viewport = active engine scene
* Hub shell mounts engines; the separate ORAS Earth runtime owns its Viewer,
  SWE retains its own contained scene/runtime
* backend owns meaning
* contracts must be deterministic
* `/api/above-me` is the public object-discovery contract
* `/api/v1/scene/above-me` is legacy scene support, not the future public product API

---

## FORBIDDEN ACTIONS

Do NOT:

* fabricate data
* mix hub and engine responsibilities
* expand into new engines
* introduce unauthorized architecture
* bypass contracts
* create placeholder UI
* simulate correctness without validation
* implement or refactor Hub home-route (`/`) panels/viewport without explicit approval
* fabricate catalog, coordinate, visibility, magnitude, or survey data
* commit raw Gaia bulk or giant browser catalog dumps
* bake bulk skydata into Docker images
* add the full upstream vendor tree when only maintained runtime sources are needed

---

## EXECUTION RULE

Only one bounded feature slice may be active.

Work must follow:

```text
verify → fix minimally → verify again
```

---

## COMPLETION REQUIREMENT

A feature is NOT complete unless:

* behavior works in runtime
* output is correct
* user can make a decision from it
* interaction behaves correctly
* system is stable

---

## NEXT ACTION

Owner review of [PR #63](https://github.com/Shadowgar/Astronomy-Hub/pull/63) is next. Its implementation
and local qualification are complete; it is not merged or publicly deployed.
All implementation and qualification stay in laptop WSL/local disposable Docker.
Do not merge without owner review. Do not SSH to historical infrastructure, repair
storage, deploy production, configure Cloudflare or integrate `oras.org`.

At an owner-declared Release Candidate, reassess deployment architecture, target,
persistent storage, hostname and site integration separately. Their absence does
not block feature completion. Historical ORA-7/C5 evidence is preserved.

The Phase B study and owned Earth foundation are already merged historical
checkpoints. ISS handoff, planetary surfaces, measured `oras_horizon.v1`, broad
God's Eye parity and WordPress work remain separately gated. The approved future
direction and historical sequence remain in the unified architecture.

## FINAL RULE

```text
If the system is not usable from the user's perspective,
the feature is not complete.
```

## Historical implementation evidence retained from PRs #51–#52

The following qualification was recorded before this docs-only checkpoint; it
was not rerun here. PR #52 is now merged. GitHub owns current check/review truth.

## Merged Tonight baseline

PR #51 merged on 2026-10-01. `/tonight` and `tonight.v1` are the unchanged
scientific baseline for this frontend pass. Its historical evidence remains in
`docs/validation/TONIGHT_MVP_EVIDENCE.md`; GitHub has current merge/review truth.

## Public shell qualification

Fresh qualification on 2026-10-01:

- `npm --prefix frontend run test`: 18 files, 155 tests passed.
- `npm --prefix frontend run typecheck`: exit 0.
- `npm --prefix frontend run build`: exit 0; 96 modules, 7m49s. Main JS
  265.58 kB (81.44 kB gzip), CSS 77.51 kB (13.01 kB gzip). Existing public
  runtime/data copying accounts for the long prepare-output-directory step.
- `git diff --check`: exit 0.
- `COMPOSE_BAKE=false docker compose up -d --build --no-deps frontend`:
  exit 0, one frontend rebuild, healthy container. Backend was not rebuilt.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 PLAYWRIGHT_SKIP_WEBSERVER=1 npm --prefix frontend run test:e2e -- publicShell.spec.ts tonight.spec.ts tonightRollover.spec.ts`:
  16 passed in 38.6s against Docker.

Desktop 1440x900 and mobile 390x844 passed all four public routes: active nav,
landmarks, direct refresh, Back/Forward, no horizontal overflow, usable Sky
viewport, category/detail interactions and supported route context. Keyboard
skip-link focus passed. Exact Observe identity/camera centering and Tonight
peak-time/site/identity handoffs passed; local-noon/DST rollover regressions
remain green. Home performs one Tonight and one Above Me request; Observe and
conditions share the latter cache. Controlled Tonight/Above Me/weather/all-data
failures leave independent modules and navigation usable. Pending Tonight does
not block Observe or Sky.

Screenshots: `output/playwright/public-shell-{home,observe,tonight,sky}-{desktop,mobile}.png`
and `public-shell-viewport-{home,observe,tonight,sky}-{desktop,mobile}.png`.
Failure screenshots use `public-shell-failure-{tonight,above-me,all,weather}.png`.

Console audit: Home, Observe and Tonight have zero console/page errors. Embedded
Sky has 58 resource 404 errors; unchanged standalone Sky has 61 of the same
missing mounted dense-star tile pattern, with zero other console errors and
zero fatal page errors. Counts depend on camera/viewport. Evidence:
`output/playwright/public-shell-console.json` and
`output/playwright/public-shell-standalone-console.json`. The blanket console-clean
acceptance gate is therefore PARTIAL, not claimed passed. This existing runtime
mount/data-availability issue is a Category B unrelated follow-up under the
owner's review stopping rule; catalog installs/rebuilds are outside this UI pass.

No backend tests were required or run: backend code/contracts are unchanged.
`git diff --name-only -- backend frontend/public vendor` is empty. Standalone
index SHA-256 remains `ee9a6b719213e8ff5785b9c9e3bf564795fde87ca049de900200ae7592fa4f55`.
No NightAstro code, CSS, assets, branding or scoring was copied. No new font,
icon library, heavyweight framework, sky renderer or bulk data was introduced.

PR #52 merged with the documented global console-cleanliness gap retained.
This evidence remains historical, not a new runtime qualification. The active
Phase B study must not merge its PR or implement Phase C or `oras_horizon.v1`.


Current-main integration is committed in `69c4f1f5` (parents accepted Earth head
`ff488339` and main `fc41ac19`). Fresh automatic review identified one additional
Category A P2: same-ID earthquake revisions retained stale depth color, magnitude
visibility range and label text. The focused correction refreshes those properties
while retaining entity/selection identity; selected/unselected regressions reproduce
the old failure and pass after correction. This is a third unique Category A
finding, separate from the two historical review repairs above. Its owned runtime
input change requires a pinned Earth rebuild and regenerated identity metadata.
Fresh qualification and the existing-PR handoff are recorded in
[Earth expansion evidence](../validation/EARTH_CAPABILITY_EXPANSION_EVIDENCE.md).
This does not authorize another broad review, a new provider, mapping/ISS/Mars/Moon,
merge or production deployment. PR #59 remains In Review for owner approval.

Owner-review correction on reviewed head `2bb9ba8`: radar manifests now lease
exact timestamp-keyed PNG bytes for a bounded 120-second grace (two slots), and
WorkspaceShell serializes layer restoration/user commands per runtime client,
preserving newer user choices and cancelling departed-client work. Both mandatory
regressions failed before correction and pass afterward. Fresh proof: 42 local
backend, 37 Docker Earth/aircraft, 62 runtime/Earth, 196 frontend tests, 14 Docker
browser cases including desktop/mobile races, live providers and actual bfcache;
typecheck, six manifest negative tests and architecture validation pass.
No Earth-owned input changed: existing artifact `f4f5e84c82cceb5f6fb0b363f39163c3ce70e0e3068663fb5b70f48f35641d0b`
is reverified against source, all files, recorded/served metadata and seven exports.
The two named Category A blockers are closed by implementation/qualification;
remote SHA, CI and thread closure are recorded in the final PR handoff. Next task
is owner re-review of #59. Category B limits and all excluded work remain unchanged.
