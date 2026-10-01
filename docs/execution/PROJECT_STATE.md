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

If any document conflicts with execution:

```text
PROJECT_STATE.md wins
```

---

## CURRENT MODE

```text
Mode: HUB_PUBLIC_SHELL_HOMEPAGE
Approach: integrate existing public contracts through one ORAS product shell
```

---

## CURRENT OBJECTIVE

The user-authorized shared public shell and homepage pass follows merged PR #51
at main `1e341746b05609b3237388514691fe3c5edecaf3`.

Public navigation is Home `/`, Observe `/observe`, Tonight `/tonight`, and Sky
`/sky-engine`. Home is a decision surface, not an engine-control dashboard.
Observe and Tonight keep their qualified contracts. The Sky host wraps the
contained Stellarium renderer; standalone `/oras-sky-engine/` is unchanged.
WordPress remains deferred.

## ACTIVE FEATURE

```text
Feature: Shared public shell and ORAS decision homepage
Branch: hub-public-shell-homepage-1
Status: UI behavior qualified; PARTIAL for blanket console-clean acceptance (legacy Sky tiles)
```

## CURRENT PRIORITY

Complete frontend qualification and a review-ready unmerged PR. Independent
Home module degradation, shared query caches, scientific behavior, exact links,
accessibility, desktop/mobile navigation, and engine isolation are required.
No backend algorithms or astronomy data releases change in this pass.

## KNOWN ISSUES

* Gaia DR3-scale ingestion and zoom-aware star delivery are not complete
* DSO media and higher-definition imagery remain incomplete
* Pan-STARRS does not provide safe full-sky default coverage
* WordPress consumption of `/api/above-me` has not started

---

## HARD CONSTRAINTS

Must preserve:

```text
Scope → Engine → Filter → Scene → Object → Detail
```

And:

* hub = decision layer
* engines = domain authority
* when a viewport is mounted, viewport = active engine scene
* hub mounts engines but does not own engine runtimes
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

After this public UI PR is owner-merged, the next planned scientific milestone
is `oras_horizon.v1`: a calibrated/measured azimuth horizon for ORAS and eventual
panorama alignment. Do not start it here; it needs separate authorization.

Existing catalog/media/deeper survey gaps remain tracked separately. This UI
pass does not authorize WordPress, new catalogs, equipment or telescope control.

## FINAL RULE

```text
If the system is not usable from the user's perspective,
the feature is not complete.
```

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

UI behavior is qualified for review; global console cleanliness remains the
explicit legacy gap above. GitHub owns final PR/CI/review state. Do not merge or
start `oras_horizon.v1` in this task.
