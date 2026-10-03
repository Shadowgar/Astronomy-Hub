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

Owner-authorized bounded review-history follow-up to merged ORA-7. SINGLE AGENT ONLY.
No runtime override mode is active.

## CURRENT OBJECTIVE / ACTIVE TASK

ORA-7 was owner-approved and merged in PR #58 at
`f55b9b2721cb692b4cda106e415c8fef59454c80`, including correction `a45fa637`.
Its locked design ancestor remains `2a4a665bc2db8399dd0728f918f5aae695ac0cd5`.
The active task repairs remaining validated review-history findings in Sky cached
page lifecycle, Tonight fallback, manifest validation and execution documentation.
Root Sky workspace, Sky/Earth modes, reusable Tonight/Observe context, bounded
selection/time surfaces, responsive mobile sheets and immersive UI are implemented.
The Earth visual foundation uses NASA GIBS static imagery with local Natural Earth
fallback; configured terrain/3D requires separately qualified deployment assets.

The Hub owns the independent Earth Viewer. SWE remains contained; immutable God's
Eye supplies selective feature modules. Native Sky science/vendor bytes and the
serial authenticated renderer lifecycle remain protected. The full-app experiment
on `phase-c-full-gods-eye-experiment-backup` at `dd15ae1b` remains local-only.

## CURRENT PRIORITY

Deliver the remaining repairs in separate bounded draft PRs with focused source
tests and explicit qualification limits. Rebuild affected immutable runtime
artifacts and complete Docker/browser qualification before marking the runtime
follow-up complete. The retained ORA-7 evidence is historical; see
[workspace implementation evidence](../validation/UNIFIED_WORKSPACE_IMPLEMENTATION_EVIDENCE.md).
Do not merge follow-ups or start another phase. No ISS handoff, Mars/Moon surfaces, measured horizon or
broad feature parity. Preserve unrelated editor settings unchanged and unstaged.

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
timezones and Earth source refresh. Remaining source changes require their own
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

Complete the owner-authorized review-history repairs for ORA-7, including the
previously deferred Tonight fallback and documentation findings. Verify the
changed sources, rebuild and requalify affected immutable runtime artifacts, and
run focused Docker/browser checks before treating these repairs as qualified.

ORA-7 implementation was owner-approved and merged in PR #58 at `f55b9b2721`.
Its final `a45fa637` Live-time/custom-timezone/Earth-observer corrections are
already implemented and qualified in the retained PR evidence. Preserve them;
the active work is the remaining bounded review-history follow-up.
Return these changes and their own evidence for owner review. Do not merge
follow-ups or begin another phase.

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
