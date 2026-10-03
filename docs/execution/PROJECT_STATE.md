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

ORA-8 / Phase C5 Earth live-layer expansion. SINGLE AGENT ONLY. Default mode.

## CURRENT OBJECTIVE / ACTIVE TASK

Unified workspace ORA-7 / PR #58 is merged on main at
`f55b9b2721cb692b4cda106e415c8fef59454c80`, final PR head
`a45fa637dce0b420f63d49abe30f4d76633bd410`. Its locked design and contained SWE /
owned Cesium Earth architecture remain the baseline.

The only active slice is `phase-c5-earth-live-layers-1`: bounded provider
qualification and implementation of source-backed Earth event/environment layers.
USGS earthquakes, NIFC/WFIGS public fire perimeters and NOAA CONUS radar are the
implemented and locally qualified layers; Launch Library's production HTTP 403 blocks launches here.
No upstream pin change or complete God's Eye application ownership is authorized.

## CURRENT PRIORITY

C5 implementation and production-like local qualification pass: 52 runtime/
protocol, 42 frontend, 35 Docker backend tests, five fixture browser checks and
one actual-provider browser check. PR [#59](https://github.com/Shadowgar/Astronomy-Hub/pull/59)
is open. One normal review is requested; Category A receives focused retests.
ORA-8 is handed back **In Review**, pending owner approval; do not mark Done or
merge. See
[Earth expansion evidence](../validation/EARTH_CAPABILITY_EXPANSION_EVIDENCE.md).
ISS, Mars/Moon, measured horizon and Phase D are not started. Preserve unrelated
editor settings unchanged and unstaged. Historical evidence remains unchanged.

## KNOWN ISSUES

* Gaia DR3-scale ingestion and zoom-aware star delivery are not complete
* DSO media and higher-definition imagery remain incomplete
* Pan-STARRS does not provide safe full-sky default coverage
* WordPress consumption of `/api/above-me` has not started

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

After this Phase B study PR: the bounded **Phase C Sky/Earth skeleton**,
starting with source/artifact gates in study section 29. Do not implement C
or horizon work inside this study checkpoint.

Approved order: A architecture docs → B compatibility study → C unified runtime
skeleton → D ISS cross-engine slice → E Mars planetary proof → F astronomy
extensions. The unified architecture defines the scope and open questions.

`oras_horizon.v1` remains approved and important within Phase F, integrating
Observe, Tonight, Sky, Earth/ORAS site context and panorama alignment. It is no
longer the immediate next implementation task and still needs measured inputs.
WordPress and unrelated data/feature work remain separately gated.

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
