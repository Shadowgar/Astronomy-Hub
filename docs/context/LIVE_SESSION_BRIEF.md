# LIVE SESSION BRIEF

## Purpose

This document defines the current active execution state for Astronomy Hub.

It is always loaded with:

- `docs/context/CORE_CONTEXT.md`

If this file conflicts with older execution, phase, tracker, or vision documents, this file wins for current work unless `SYSTEM_VALIDATION_SPEC.md`, `AGENTS.md`, or an explicitly activated override mode says otherwise.

This document is active execution memory.

It is not the permanent architecture authority.

It must be kept current.

---

## Current Execution Status

Astronomy Hub is in an ORAS Sky Engine modernization and high-definition data cycle.

The active public sky runtime is:

- `/oras-sky-engine/`

This is the ORAS-hosted Stellarium Web / Stellarium Web Engine runtime.

The current active work is not the old `/sky-engine` BabylonJS lane.

The current active work is not a full Hub homepage build.

The current active work is:

- preserve and improve the contained Stellarium runtime
- expand source-backed astronomy data
- improve object discovery through `/api/above-me`
- improve exact-link behavior into `/oras-sky-engine/`
- improve survey imagery and visual parity
- keep WordPress/ORAS shortcode integration deferred until explicitly started

---

## Current Product Definition

The active product direction is:

- a source-backed astronomy intelligence layer
- a contained ORAS Sky Engine runtime at `/oras-sky-engine/`
- stable object links that open the Sky Engine centered on the correct object
- curated above-me object discovery through `/api/above-me`
- future WordPress/ORAS display consuming `/api/above-me`

Primary user-facing path:

- user asks what is above me
- backend computes/ranks visible objects
- UI or WordPress page renders curated cards/list
- user clicks object
- `/oras-sky-engine/` opens centered on that object

The front-page Hub route `/` is not the current implementation target unless explicitly approved.

---

## Active Execution Surface

The active execution surface is:

- `/oras-sky-engine/`

Supporting backend/API surfaces:

- `/api/sky/object`
- `/api/above-me`

Supporting runtime source paths:

- `vendor/stellarium-web-engine/apps/web-frontend`
- `vendor/stellarium-web-engine/src`
- `frontend/public/oras-sky-engine`

Supporting backend source paths:

- `backend/app/routes`
- `backend/app/services`
- `backend/app/data/sky`
- `backend/tests`

Supporting validation paths:

- `scripts/skydata/validate_oras_deep_links.js`
- `frontend/tests`
- backend test suite

---

## Explicit Stale Assumption Corrections

The following older assumptions are stale and must not drive current work:

- active surface is `/sky-engine`
- Sky Engine is BabylonJS
- current goal is a BabylonJS port
- current work is only Stellarium source parity
- Hub homepage `/` is the active implementation target
- the Sky Engine should be converted into a shared Hub renderer
- production objects should be hand-registered
- visual parity should be blocked by stale phase documents

Correct current assumptions:

- active surface is `/oras-sky-engine/`
- runtime is contained Stellarium Web / Stellarium Web Engine
- Hub is API/decision layer
- Sky Engine owns its own scene/rendering/runtime behavior
- data must be source-backed and scalable
- validation must prove browser/runtime behavior when visual behavior is claimed

---

## Current System Model

Preserve:

- Scope → Engine → Filter → Scene → Object → Detail → Assets
- Ingestion → Normalization → Storage → Cache → API → Client Rendering

The Hub defines importance.

Engines define domain reality.

The viewport renders the active engine truth.

The API/data layer must not fake truth.

---

## The Above Me Hub

The Hub is a decision layer.

It shows:

- the most relevant objects
- from the selected location and time
- in a curated, ranked format
- with stable links into the correct engine

The Hub must remain:

- small
- curated
- decision-ready
- source-backed
- API-driven

The Hub must not become:

- a raw catalog dump
- a full immersive engine page
- a renderer
- a simulation surface
- a duplicate of Sky Engine logic

---

## Viewport Rule

Center Viewport = Active Engine Scene.

Rules:

- only one primary engine scene may be active
- the viewport is the primary interaction surface
- the active engine owns scene behavior
- the Hub may mount or link to the viewport
- the Hub must not own engine-internal rendering
- `/oras-sky-engine/` must remain a contained Stellarium runtime

Failure conditions:

- wrong engine rendered
- object opens wrong route
- object opens wrong coordinates
- Hub controls engine-internal render loop
- Sky Engine is treated as React/Babylon instead of Stellarium runtime
- scene state is inconsistent with active engine

---

## Current UI Model

### ORAS Sky Engine Page

The active runtime page is:

- `/oras-sky-engine/`

Expected behavior:

- loads contained Stellarium runtime
- supports direct object links
- supports object selection
- supports camera centering/locking when claimed
- supports configured survey imagery
- preserves runtime data loading
- does not expose broken or dead controls

### Front Page / Hub Mode

For the current cycle:

- `/` is not the active implementation target
- no Hub homepage panel implementation is scheduled unless explicitly requested
- no WordPress shortcode implementation is active unless explicitly requested
- current API work may prepare for future Hub/WordPress use

### WordPress / ORAS Future Surface

Future product path:

- WordPress shortcode/page
- calls `/api/above-me`
- renders curated object cards
- links to `/oras-sky-engine/`

This remains deferred until explicitly started.

---

## Active Architectural Boundaries

### Hub

Allowed:

- decision layer
- object filtering/ranking
- curated output
- stable engine links
- API consumption

Not allowed:

- raw rendering ownership
- full scene rendering
- raw object flood
- fake visibility
- duplicate sky calculations

### ORAS Sky Engine

Allowed:

- own contained Stellarium runtime
- own rendering
- own selection/camera behavior
- load configured skydata/surveys
- receive object identity and fallback coordinate input through contracts

Not allowed:

- be converted into React/Babylon
- be merged with Hub rendering
- be coupled to other engine internals
- receive fake object data

### Backend / Data

Allowed:

- source-backed ingestion
- normalization
- exact lookup
- visibility/ranking
- stable Sky Engine URL generation
- bounded catalog scans
- validated propagation/ephemeris

Not allowed:

- fake coordinates
- fake visibility
- fake survey coverage
- hand-registered production catalogs
- raw provider payloads in public UI

---

## Active Runtime Authority

The system uses:

- FastAPI backend
- Docker Compose runtime
- frontend runtime serving `/oras-sky-engine/`
- mounted or static skydata where appropriate

Docker is authoritative for integrated runtime validation unless a task explicitly states local-only.

No parallel backend authority is allowed.

No separate untracked runtime source may be treated as authoritative without explicit approval.

---

## Current Completed Capability Baseline

The following capabilities are part of the current working baseline or recent pass stack and should be preserved.

### Exact-link and runtime stability

Completed behavior includes:

- stable Sky Engine deep-link URL contract
- star exact-link centering
- Gaia ID string preservation
- DSO exact links for registered and fallback-created objects
- satellite exact-link metadata support
- browser deep-link harness coverage

Important behavior:

- `catalog + source_id + model` are authoritative
- slug/display name is cosmetic
- RA/Dec are fallback coordinates and must not be fabricated
- Gaia/source IDs must remain strings

### `/api/above-me`

Current direction:

- data-driven visible/ranked object discovery
- stable Sky Engine URLs
- bounded output
- object discovery source-backed by local services/catalogs

Current object families include or are being integrated:

- Messier/local DSOs
- OpenNGC DSOs
- bright stars
- Hipparcos Tier 2 stars
- solar-system objects
- visible satellites

### Stars

Current baseline includes:

- bright/local star support
- Hipparcos Tier 2 subset
- Gaia exact-link proof paths

Future direction:

- Gaia DR3 or EDR3 tiled/indexed star pipeline
- no giant browser JSON star dump
- no hand-registered production star list

### Solar System

Current baseline includes:

- JPL-backed solar-system support
- exact links for configured solar-system bodies
- browser validation for selected planet/Moon deep links

Rules:

- no stubbed planet coordinates
- no fake ephemeris
- exact lookup/above-me behavior must remain source-backed

### Satellites

Current baseline includes:

- local TLE catalog
- ISS/HST exact identity lookup
- TLE model data preserved through Sky Engine mapping
- Skyfield-backed propagation for visible candidates in `/api/above-me`
- satellite parser count validation remains important

Rules:

- exact metadata lookup must not fabricate RA/Dec/alt/az
- propagated satellite candidates must use real propagation
- below-horizon objects excluded by default when visibility is claimed
- Starlink flood must remain bounded

### DSOs

Current baseline includes:

- Messier/local compatibility
- OpenNGC normalized catalog discovery
- exact lookup for NGC/OpenNGC and IC/OpenNGC identities
- fallback-created DSO camera centering fixed through Stellarium-compatible `model_data` fields

Rules:

- no hand-added production DSO list as a substitute for catalog ingestion
- known classes must not degrade to `Unknown Type`
- aliases must not replace authoritative IDs

### Survey Imagery

Current baseline includes:

- DSS Color as safe full-sky fallback/default
- query-only Pan-STARRS providers
- DSO fallback centering fixed for visual QA targets
- DESI parked/not promoted

Current finding:

- Pan-STARRS `z-zg-g` improves sharpness for galaxies/northern fields
- DSS remains better or safer for broad nebula/full-sky fallback
- Pan-STARRS should not become default without safe fallback behavior and broad validation

Future direction:

- smart high-definition default where coverage is good
- DSS fallback always preserved
- no scraping Stellarium-Web
- no copying Stellarium CDN data

---

## Recent Pass Stack

The following recent passes are relevant to current execution memory.

If branches are not yet merged, merge/rebase in dependency order.

### Data parity and discovery

- Pass 1: `/api/above-me` foundation
- Pass 2: Hipparcos Tier 2 stars
- Pass 3: solar-system exact-link support
- Pass 3B: solar-system browser validation
- Pass 4A: satellite TLE exact-link support
- Pass 4B: Skyfield satellite propagation in `/api/above-me`
- Pass 5: OpenNGC DSO discovery

### Visual parity

- Visual Parity Pass 1: query-only Pan-STARRS survey providers
- Visual Parity Pass 1B: DSO fallback centering fix

Dependency-sensitive order:

1. above-me foundation
2. star catalog expansion
3. solar-system support
4. solar browser validation
5. satellite exact lookup
6. satellite propagation
7. OpenNGC DSO discovery
8. query-only survey providers
9. DSO fallback centering

---

## Active Scope of Work

Current work is limited to:

- improving `/oras-sky-engine/`
- improving source-backed data depth
- improving survey imagery
- improving exact-link reliability
- improving `/api/above-me`
- preserving architecture boundaries
- cleaning stale document authority
- preparing for future WordPress/ORAS shortcode only through API contracts

---

## Allowed Work

Allowed in the current cycle:

- ORAS Sky Engine runtime fixes
- Stellarium runtime behavior preservation
- object exact-link fixes
- camera centering validation
- survey provider validation
- source-backed catalog ingestion
- `/api/sky/object` improvements
- `/api/above-me` improvements
- satellite propagation/freshness work
- OpenNGC/Caldwell/DSO metadata work
- high-definition survey/data planning
- document drift cleanup

---

## Not Allowed Without Explicit Approval

Do not start these unless explicitly requested:

- WordPress shortcode implementation
- Hub homepage `/` implementation
- full Earth Engine
- full Solar System Engine page
- new unrelated engine domains
- broad UI redesign
- public survey selector
- DESI promotion
- TheSkyLive scraping
- Stellarium-Web scraping
- copying Stellarium CDN data
- baking huge skydata into Docker
- postgres-only migration work mixed into runtime/data passes
- Dependabot/CodeQL mixed into feature passes

---

## Current Output Constraints

Current output must remain:

- source-backed
- runtime-proven
- architecture-aligned
- bounded
- exact-link safe
- Docker/runtime validated when claiming integrated success
- browser validated when claiming visual/Sky Engine behavior

Hard constraints:

- no fake data
- no fake coordinates
- no fake visibility
- no fake survey coverage
- no dead controls
- no hub-coupled rendering logic inside Sky Engine
- no hand-registered production catalogs as a substitute for ingestion

---

## Current Authority Documents

Active authority set:

1. `docs/validation/SYSTEM_VALIDATION_SPEC.md`
2. `AGENTS.md`
3. `docs/context/CORE_CONTEXT.md`
4. `docs/context/LIVE_SESSION_BRIEF.md`
5. `docs/context/CONTEXT_MANIFEST.yaml`
6. `docs/PROJECT_STATE.md`
7. `docs/MASTER_PLAN.md`
8. relevant architecture / engine / object / contract / ingestion documents

Vision reference only:

- `docs/product/PRODUCT_VISION.md`
- `docs/ASTRONOMY_HUB_MASTER_PLAN.md`

If this brief conflicts with older `/sky-engine` or BabylonJS language, this brief wins for current work.

---

## Current Validation Standard

Evaluate all work using:

1. Does it follow `SYSTEM_VALIDATION_SPEC.md`?
2. Does it follow `AGENTS.md`?
3. Does it preserve `CORE_CONTEXT.md` boundaries?
4. Does it improve the active product surface?
5. Does it avoid scope expansion?
6. Does it avoid fake data?
7. Does it prove runtime behavior?
8. Does it avoid stale authority drift?

Completion reports must include:

- loaded documents or active override mode
- branch name
- files changed
- exact commands run
- exact outputs or pass/fail counts
- Docker/runtime validation when applicable
- browser validation when applicable
- commit hash if committed
- push/PR status
- remaining gaps
- recommended next task

---

## Immediate Working Direction

Current immediate direction:

1. Finish document drift cleanup so agents stop using stale `/sky-engine` and BabylonJS assumptions.
2. Preserve and merge current data/visual pass stack in order.
3. Continue high-definition data and imagery upgrade planning.
4. Prefer a smart high-definition survey default only after fallback behavior is validated.
5. Continue source-backed data upgrades:
   - Gaia DR3/EDR3 tiled/indexed star pipeline planning
   - Caldwell alias layer
   - DSO media/thumbnail manifest
   - MPC asteroid/comet pipeline when approved
6. Start WordPress/ORAS shortcode only when explicitly approved.

---

## Recommended Next Technical Lanes

### Lane A — Visual improvement

Goal:

- make `/oras-sky-engine/` visibly better

Likely next steps:

- smart HD survey default
- safe fallback to DSS
- broader survey provider QA
- optional/experimental survey selector only if approved

### Lane B — Data depth

Goal:

- make object discovery richer and more complete

Likely next steps:

- Caldwell aliases
- DSO media manifest
- Gaia DR3/EDR3 tile/index plan
- asteroid/comet ingestion plan

### Lane C — Product surface

Goal:

- create public ORAS above-me feature

Likely next steps:

- WordPress shortcode/page
- consumes `/api/above-me`
- renders curated cards
- links to `/oras-sky-engine/`

Not active until explicitly approved.

---

## Current Failure Conditions

Work is invalid if:

- Hub becomes a data dump
- Hub renders full engine scenes uncontrolled
- engine and Hub responsibilities mix
- viewport behavior is inconsistent
- new data contracts are invented without approval
- placeholder UI is claimed as real
- scope expands beyond the requested lane
- fake data is introduced
- fake visibility is introduced
- fake coordinates are introduced
- stale `/sky-engine` or BabylonJS assumptions override current runtime reality
- `/oras-sky-engine/` is converted into a Hub-owned renderer
- experimental surveys are promoted without validation
- large astronomy data is baked into Docker without approval

---

## Final Rule

Build the smallest correct system first:

- source-backed data
- reliable `/api/above-me`
- stable object identity
- reliable `/oras-sky-engine/` links
- improved visual runtime
- API-first future WordPress/ORAS surface

The ORAS Sky Engine remains a contained Stellarium runtime.

The Hub remains the decision layer.

Validation defines truth.
