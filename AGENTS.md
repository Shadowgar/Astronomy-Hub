# Astronomy Hub — Repository Operating Rules

## 1. Purpose

Astronomy Hub is a document-driven, authority-controlled system.

The AI must not improvise project truth.

Authoritative documents define intended truth. Runtime evidence and current committed code define implementation reality. If documents and implementation reality conflict, the AI must surface the conflict explicitly and follow the authority hierarchy or an explicitly activated override mode.

Do not silently force working code to match stale documents.

This repository uses:

- controlled document authority
- controlled context injection
- proof-based validation
- explicit execution state management
- runtime evidence as a required completion standard
- current ORAS Sky Engine runtime authority at `/oras-sky-engine/`
- explicit rejection of stale `/sky-engine` and BabylonJS assumptions for the active sky runtime

---

## 2. Authority Order

### Default authority hierarchy

Follow this order when determining truth:

1. `docs/validation/SYSTEM_VALIDATION_SPEC.md`
2. `docs/context/CORE_CONTEXT.md`
3. `docs/context/LIVE_SESSION_BRIEF.md`
4. `docs/DOCUMENT_INDEX.md`
5. `docs/execution/PROJECT_STATE.md`
6. `docs/execution/MASTER_PLAN.md`
7. relevant phase / execution documents
8. architecture / engine / object / contract / ingestion documents
9. `docs/ASTRONOMY_HUB_MASTER_PLAN.md` — vision only

### Rule

- Validation authority overrides vague descriptions.
- Reality documents and committed runtime evidence override stale assumptions.
- Execution control documents override vision documents for current work.
- If code and docs conflict, report the conflict before proceeding.
- If the conflict involves the ORAS Sky Engine runtime, use the ORAS Sky Engine rules in this file.

---

## 3. Context Loading Authority

The AI MUST NOT scan the full `/docs` directory by default.

The AI MUST load documents only through the context system unless the prompt explicitly activates an override mode.

### Required loading order in Default Mode

1. Always load:

   - `docs/context/CORE_CONTEXT.md`
   - `docs/context/LIVE_SESSION_BRIEF.md`

2. Then load task-specific documents from:

   - `docs/context/CONTEXT_MANIFEST.yaml`

3. Do not load additional documents unless explicitly instructed or required by the manifest pack.

### Required behavior before starting any task

The AI MUST:

1. list all loaded documents
2. confirm they match the correct task pack
3. confirm no extra documents were loaded

### Failure conditions

The following are invalid in Default Mode:

- loading the full `/docs` directory
- loading documents outside the context manifest without explicit instruction
- starting work without declaring context
- relying on prior chat memory as the current execution state

---

## 4. Current Execution Context

Always treat `docs/context/LIVE_SESSION_BRIEF.md` as the active execution memory unless an explicit override mode is active.

Do not rely on prior chat memory to determine the current phase, current branch, or active task.

If live session state conflicts with older session-oriented documents, surface the conflict explicitly and defer to the authority hierarchy.

If live session state conflicts with proven runtime reality, report the conflict and do not silently rewrite working runtime behavior to match stale docs.

---

## 5. Current Runtime Reality

As of the current execution state, the active public ORAS sky runtime is:

- `/oras-sky-engine/`

This surface is the ORAS-hosted Stellarium Web / Stellarium Web Engine runtime.

Do not assume `/sky-engine` or BabylonJS is the active implementation target unless `LIVE_SESSION_BRIEF.md`, `PROJECT_STATE.md`, and the active task explicitly restore that direction.

Docs-only authority cleanup must update control documents without runtime, package, backend, or frontend edits.

The current ORAS Sky Engine runtime uses:

- `vendor/stellarium-web-engine/apps/web-frontend`
- `vendor/stellarium-web-engine/src`
- `frontend/public/oras-sky-engine`

The data/API support layer includes:

- `/api/sky/object`
- `/api/above-me`
- `backend/app/services`
- `backend/app/routes`

---

## 6. System Models

Preserve both system models:

- `Scope → Engine → Filter → Scene → Object → Detail → Assets`
- `Ingestion → Normalization → Storage → Cache → API → Client Rendering`

Do not introduce structures that violate these models.

The Hub is a decision layer.

The engine owns scene behavior.

The API/data layer may provide object identity, object metadata, observer/time/location input, and stable links.

The API/data layer must not fake visibility, coordinates, or catalog identity.

---

## 7. Locked Stack

Implementation must follow `docs/STACK_OVERVIEW.md`, subject to the ORAS Sky Engine runtime exception below.

### Backend stack

- FastAPI
- Uvicorn
- Pydantic
- PostgreSQL + PostGIS
- SQLAlchemy / GeoAlchemy2
- Alembic
- Redis
- pytest
- Docker Compose

### Main frontend / Hub stack

- React
- Vite
- TypeScript
- TanStack Query
- Zustand
- React Router
- token-based styling
- Vitest
- Playwright

### Engine-specific rendering

The ORAS Sky Engine at `/oras-sky-engine/` uses the vendored Stellarium Web / Stellarium Web Engine runtime.

Do not replace `/oras-sky-engine/` with BabylonJS.

Do not port `/oras-sky-engine/` into the Hub renderer.

Do not convert the ORAS Sky Engine into a React-owned or Hub-owned rendering component.

BabylonJS may apply only to future or legacy non-Stellarium engine work explicitly authorized by the current execution context.

No substitutions unless the active execution context or an explicit override mode authorizes them.

---

## 8. ORAS Sky Engine Stellarium Runtime Rule

The ORAS Sky Engine at `/oras-sky-engine/` is a contained Stellarium Web / Stellarium Web Engine runtime.

It is NOT:

- a React component owned by the Hub
- a BabylonJS scene
- a shared rendering system
- a generic visualization layer
- a cross-engine utility
- a Hub-managed rendering surface

It IS:

- a self-contained Stellarium runtime
- a source-authoritative runtime integration
- a separate engine surface mounted by Astronomy Hub
- the owner of its own rendering, scene lifecycle, object selection, survey imagery, and visual math

### The Hub may

- link to `/oras-sky-engine/`
- pass observer, time, location, and configuration through defined URL/API contracts
- mount or embed the runtime only through approved interfaces

### The Hub may NOT

- control Sky Engine rendering behavior
- inject scene data directly
- replace Stellarium runtime behavior with Hub abstractions
- merge Sky Engine rendering with a shared renderer
- convert `/oras-sky-engine/` into BabylonJS

### Data/API systems may

- provide object identity
- provide catalog/source/model contracts
- provide RA/Dec fallback coordinates
- provide `/api/sky/object`
- provide `/api/above-me`
- generate stable Sky Engine URLs
- normalize upstream catalog data
- rank visible objects using validated calculations

### Data/API systems may NOT

- fake coordinates
- fake visibility
- hand-register production catalogs
- override Stellarium runtime math
- claim object availability without data-backed identity
- claim visibility without validated calculations

### Violation conditions

The following are critical violations:

- replacing `/oras-sky-engine/` with BabylonJS
- moving Stellarium rendering into the Hub
- coupling Sky Engine internals to other engines
- silently following stale docs over proven runtime behavior
- hand-adding production object catalogs instead of building scalable ingestion/indexing
- baking huge skydata into Docker images

If any of these occur:

1. STOP
2. report the violation
3. do not proceed until the conflict is resolved

---

## 9. ORAS Sky Engine Data Rules

The ORAS Sky Engine data path must be scalable and source-backed.

Production data must not be built by manually registering individual stars, DSOs, planets, or satellites except as test fixtures.

### Required identity contract

Sky Engine links and object lookups must preserve:

- `catalog`
- `source_id`
- `model`
- `ra`
- `dec`

Rules:

- `catalog + source_id + model` are authoritative.
- slug/display name is cosmetic.
- `ra/dec` are fallback coordinates and must not be fabricated.
- large IDs, including Gaia IDs, must remain strings.
- source IDs must remain stable.
- catalog namespaces must be explicit and durable.

### Current approved catalog/data directions

Stars:

- Hipparcos / bright-star data
- Gaia-derived data
- future Gaia DR3 / EDR3 tiled or indexed star pipeline
- no giant browser JSON star dump
- no hand-registered production star list

DSOs:

- OpenNGC-derived normalized catalog
- Messier local compatibility
- future Caldwell alias layer
- future HyperLeda / SIMBAD / NED enrichment only when permitted
- future DSO image/media manifest

Solar system:

- NASA/JPL-backed solar-system identities
- no stubbed planet coordinates
- RA/Dec/alt/az must come from validated ephemeris or validated conversion

Satellites:

- local TLE catalog
- Skyfield-backed propagation for visible candidates
- no fake RA/Dec/alt/az
- no fake visibility
- no Starlink flood in public lists

Survey imagery:

- DSS remains the safe full-sky fallback
- higher-definition surveys may be preferred where coverage is good
- Pan-STARRS-style HiPS providers may be used through controlled provider logic
- DESI must not be promoted unless explicitly approved
- no scraping Stellarium-Web
- no copying Stellarium CDN data
- use upstream/public sources directly where licenses and access allow

---

## 10. Execution Rules

Work only within a defined phase, task pack, or approved override mode.

No skipping phases unless override mode explicitly allows it.

No scope expansion.

No speculative redesign.

No feature invention.

If the requested task conflicts with governing docs:

1. STOP
2. surface the conflict
3. follow the authority hierarchy or active override mode

If the user explicitly requests a product-direction change, the AI must identify the governing document conflict and recommend the narrowest document/runtime update required.

---

## 11. Change Discipline

Prefer minimal, surgical diffs.

Preserve architecture boundaries.

Do not modify unrelated files.

Do not casually rename or move core structures.

Do not combine unrelated work.

Keep separate branches/PRs for separate concerns:

- runtime safety
- catalog ingestion
- API contracts
- visual survey providers
- satellite propagation
- WordPress shortcode
- Dependabot
- CodeQL/security
- Postgres/database migration

If code and docs conflict:

- do not silently choose one
- identify the conflict explicitly
- follow the authority hierarchy or explicit override mode

---

## 12. Validation Authority

All completion claims must be proven using:

- `docs/validation/SYSTEM_VALIDATION_SPEC.md`
- relevant phase specs
- acceptance criteria
- runtime evidence where applicable

### Proof rule

Completion reports must include:

- exact files changed
- exact commands run
- exact outputs
- pass/fail statement
- remaining known gaps

If it cannot be proven, it is NOT complete.

---

## 13. Runtime Authority

Docker is the authoritative runtime.

Local commands such as `pytest`, `npm run build`, or local browser checks are supporting evidence only unless the task explicitly says local-only.

Do not claim success for runtime-sensitive work without runtime-level validation if required.

For ORAS Sky Engine work, browser/runtime validation is required when the task affects:

- `/oras-sky-engine/`
- deep links
- object selection
- camera centering
- survey imagery
- runtime data loading
- satellites
- DSO/star/planet fallback materialization

Expected validation may include:

- `docker compose ps`
- `COMPOSE_BAKE=false docker compose up -d --build ...`
- `pytest ...`
- `npm run ...`
- `npm run validate:oras-deep-links`
- browser/Playwright validation
- curl checks for API/runtime endpoints

If Docker Compose Bake crashes locally, use `COMPOSE_BAKE=false` and report that explicitly.

---

## 14. Default Working Style

Default Mode workflow:

`context load → inspect docs → inspect code → plan → execute → validate → review`

When uncertain:

- choose the conservative interpretation
- do not assume missing behavior
- do not invent data
- do not fake a passing result
- report blockers clearly

---

## 15. Available Skills

Available skills may include:

- `phase-guard`
- `doc-drift-check`
- `backend-change`
- `frontend-change`
- `be-audit-ladder`
- `fe-audit-ladder`
- `fe-8-5-checkpoint`

Skills guide execution.

Skills do NOT override:

- authority hierarchy
- ORAS Sky Engine runtime rules
- Stellarium Runtime Mode
- validation requirements

---

## 16. Special Mode — Stellarium Runtime Mode

This mode overrides Default Mode when explicitly activated.

### Activation

Runtime Mode is active ONLY when the prompt contains:

- `Stellarium Runtime Mode ACTIVE`

Legacy phrase also accepted:

- `Stellarium Port Mode ACTIVE`

### Authority Override

When active, authority becomes:

1. upstream Stellarium Web / Stellarium Web Engine behavior
2. vendored Astronomy Hub Stellarium runtime source:
   - `vendor/stellarium-web-engine/apps/web-frontend`
   - `vendor/stellarium-web-engine/src`
3. Astronomy Hub runtime integration:
   - `frontend/public/oras-sky-engine`
   - `backend/app/services`
   - `backend/app/routes`
   - `/api/sky/object`
   - `/api/above-me`
4. runtime validation evidence
5. repository documentation, secondary only

### Context Loading Override

When Runtime Mode is active:

- DO NOT perform broad document loading first.
- DO NOT scan the full `/docs` directory.
- DO NOT let stale phase docs block source/runtime analysis.
- Load only the minimal docs needed for naming, contracts, or current task pack.
- Use source behavior and runtime evidence as primary context.

### Runtime Mode Rules

- Match Stellarium behavior for rendering, object lifecycle, camera, selection, surveys, stars, DSOs, planets, and satellites where applicable.
- Replace incorrect local heuristics when source/runtime behavior proves them wrong.
- Preserve exact-link identity contracts:
  - `catalog`
  - `source_id`
  - `model`
  - `ra`
  - `dec`
- Preserve Gaia and other large IDs as strings.
- Do not fake data.
- Do not hand-register production catalogs.
- Do not bake huge runtime data into Docker.
- Keep large skydata mounted or externally served.
- Do not rewrite `/oras-sky-engine/` into React/Babylon.
- Do not couple the Hub renderer to the Stellarium runtime.
- Do not expose experimental survey providers publicly unless explicitly approved.
- Do not promote DESI unless explicitly approved.

### Runtime Mode Completion Rule

A Runtime Mode task is NOT complete unless it includes:

1. source/runtime files inspected
2. exact Astronomy Hub files changed
3. list of removed or replaced incorrect local logic
4. validation commands and outputs
5. browser/runtime validation when the task affects `/oras-sky-engine/`
6. clear statement of remaining gaps

### Exit Condition

When the subsystem reaches parity or the requested runtime fix is complete:

1. exit Runtime Mode
2. reconcile docs to code if required
3. return to Default Mode

---

## 17. Special Mode — High-Definition Data and Imagery Upgrade Mode

This mode is for replacing or upgrading current Stellarium-era data sources with newer, better, higher-definition data and imagery.

### Activation

This mode is active only when the prompt contains:

- `High-Definition Data Mode ACTIVE`

or explicitly asks for:

- newer, better high-definition data and images

### Purpose

The goal is to improve:

- star depth
- catalog scale
- DSO metadata
- DSO imagery/media
- background survey quality
- satellite freshness/visibility
- minor body data
- visible `/oras-sky-engine/` quality

This mode is not a credits-update task.

Credits/source text may be used as a source map.

Do not spend implementation time updating credits unless the task explicitly requires it.

### Data Source Rules

Allowed direction:

- use upstream/public datasets directly
- build ingestion scripts
- build normalized local indexes
- build mounted/static runtime data
- build cache/proxy layers when appropriate
- respect license/access constraints
- document source/license notes only where technically necessary

Forbidden direction:

- scraping Stellarium-Web
- copying Stellarium CDN data
- baking huge data into Docker
- hand-registering production objects
- pretending partial coverage is full coverage
- faking coordinates or visibility

### Preferred upgrade tracks

#### Star data

Current baseline may include:

- Gaia DR2-style lineage
- Hipparcos
- Bright Star Catalog
- local Hipparcos Tier 2 subset

Upgrade direction:

- Gaia DR3 or EDR3-derived tiled/indexed catalog
- magnitude-limited tiles
- zoom-aware loading
- stable Gaia source IDs as strings
- no JavaScript numeric corruption
- no giant browser JSON file
- no Docker-baked star bulk data

#### DSO data

Current baseline may include:

- Messier local compatibility
- OpenNGC normalized catalog
- base/extended DSO packs

Upgrade direction:

- Caldwell alias layer
- richer OpenNGC metadata
- optional HyperLeda/SIMBAD/NED enrichment where permitted
- DSO media/thumbnail manifest
- better object detail panels
- no `Unknown Type` for known object classes

#### Survey imagery

Current baseline may include:

- DSS Color default
- query-only Pan-STARRS providers
- DESI parked

Upgrade direction:

- smart high-definition default
- prefer better high-definition survey where coverage is good
- DSS fallback always available
- evaluate Pan-STARRS and other broad optical/color HiPS candidates
- no DESI promotion unless explicitly approved
- no full local mirror unless explicitly approved

#### Solar/minor bodies

Current baseline may include:

- JPL solar-system exact links
- TLE satellites with Skyfield propagation

Upgrade direction:

- MPC asteroid/comet ingestion
- freshness pipeline
- exact links for bright/current comets and asteroids
- above-me ranking for visible objects

### Completion Rule

A High-Definition Data task is NOT complete unless it reports:

1. datasets inspected
2. current local data inventory
3. chosen upgrade source
4. storage/index strategy
5. runtime/API integration strategy
6. validation commands and results
7. visible result if the task claims visual improvement
8. remaining gaps

---

## 18. WordPress / ORAS Site Integration Rule

The WordPress or ORAS site integration must be API-first.

Do not build the shortcode before the backend contract is ready.

The expected product path is:

WordPress page or shortcode → calls `/api/above-me` → receives curated ranked objects → renders object cards/list → user clicks object → opens `/oras-sky-engine/` centered on that object.

The shortcode/page must consume API output.

It must not hardcode astronomy objects.

It must not duplicate sky calculations in WordPress.

It must not scrape the Sky Engine.

It must not depend on Sky Engine internals.

Required object link data:

- `catalog`
- `source_id`
- `model`
- `ra`
- `dec`
- `sky_engine_url`

Useful public object fields:

- `name`
- `type`
- `magnitude`
- `alt`
- `az`
- `reason`
- `is_visible`
- `category`
- `summary`
- `thumbnail`

Do not start WordPress integration until the user explicitly approves that phase.

---

## 19. Branch and PR Discipline

Use bounded branches.

Do not stack unrelated work into one PR.

Preferred branch naming examples:

- `sky-engine-data-parity-pass-*`
- `sky-engine-visual-parity-pass-*`
- `sky-engine-runtime-stability-*`
- `sky-engine-satellite-*`
- `sky-engine-opengc-*`
- `sky-engine-survey-*`
- `wordpress-above-me-shortcode-*`

Before committing:

- `git status --short`
- `git diff --check`
- run relevant tests

Before pushing:

- `git status --short`
- `git log --oneline -5`

Completion reports must include:

- branch name
- commit hash if committed
- push status
- PR number if opened
- files changed
- tests run
- runtime validation
- remaining gaps

---

## 20. Large Data and Docker Rule

Large astronomy data must not be baked into Docker images unless explicitly approved.

Large data should be:

- mounted
- cached
- externally served
- tiled
- indexed
- streamed on demand

Applies to:

- Gaia catalogs
- star tiles
- DSO media
- HiPS surveys
- satellite feeds
- MPC data
- large skydata folders

Docker images may contain application/runtime shell files.

Docker images must not contain unnecessary skydata bulk data.

---

## 21. Survey Provider Rule

Survey providers must be controlled.

DSS is the safe full-sky fallback.

Higher-definition survey providers may be added if they meet validation requirements.

### Requirements for any survey provider

Must document:

- provider ID
- service URL
- tile format
- HiPS order
- coverage/MOC if available
- CORS behavior
- fallback behavior
- visual QA result
- whether it is default, optional, query-only, or rejected

### Default behavior

The default may be upgraded only if:

- fallback to DSS is preserved
- invalid provider fallback works
- browser visual QA passes
- deep links still work
- no persistent loader appears
- broad target QA passes

### Experimental providers

Experimental providers must remain:

- query-only, or
- hidden/admin-only, or
- explicitly marked experimental in UI

DESI must remain parked unless explicitly approved.

---

## 22. Object Catalog Rule

Object catalogs must be data-driven.

Do not hand-add production catalogs.

Allowed hand-added objects:

- tests
- fixtures
- minimal validation targets
- temporary controlled proof cases

Forbidden:

- manually registering a handful of production stars as a substitute for catalog ingestion
- manually registering a handful of DSOs as a substitute for OpenNGC/other ingestion
- treating validation fixtures as production data

Catalog loaders must preserve:

- stable source IDs
- source catalog namespace
- object model
- RA/Dec
- object type
- names/aliases
- magnitude where available
- size/shape where available
- source provenance internally where appropriate

---

## 23. No Fake Data Rule

No fake data.

No fake coordinates.

No fake visibility.

No fake magnitudes.

No fake TLE propagation.

No fake survey coverage.

No fake object availability.

If a value is unknown:

- omit it
- mark it as unavailable
- return a controlled status
- document the blocker

Do not invent values to make a UI look complete.

---

## 24. Final Response Requirements for Coding Agents

Every coding-agent report must include:

1. loaded documents or active override mode
2. branch name
3. files changed
4. exact commands run
5. exact outputs or summarized pass/fail counts
6. runtime validation if applicable
7. browser validation if applicable
8. commit hash if committed
9. push/PR status
10. remaining gaps
11. recommended next task

If any required validation was not run, say so directly.

Do not claim completion when validation was skipped.
