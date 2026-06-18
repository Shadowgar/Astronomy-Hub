# CORE CONTEXT — SYSTEM AUTHORITY

## Purpose

This document defines the permanent system rules of Astronomy Hub.

It is always loaded in Default Mode. It is not a roadmap, not a phase document, and not a task list.

Its job is to define:

- what Astronomy Hub is
- how the system is structured
- which boundaries must never be violated
- how the Hub, engines, APIs, data, and rendering surfaces relate to each other

This document defines architectural truth. It does not define current implementation order.

---

## Document Role

This document is a top-level architectural authority for system behavior.

It does not define:

- current build task
- current branch
- current PR
- UI polish tasks
- implementation order
- temporary validation targets
- active pass number

Those belong in:

- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/PROJECT_STATE.md`
- `docs/MASTER_PLAN.md`
- task-specific execution documents

If this document conflicts with `SYSTEM_VALIDATION_SPEC.md`, validation authority wins for proof and status classification.

If this document conflicts with proven runtime reality, the conflict must be reported as documentation drift. Working runtime behavior must not be silently rewritten to match stale text.

---

## Required Load Order

Any Default Mode coding session must load:

1. `docs/context/CORE_CONTEXT.md`
2. `docs/context/LIVE_SESSION_BRIEF.md`

Then load only task-specific documents from:

3. `docs/context/CONTEXT_MANIFEST.yaml`

Optional deeper references may include:

- `ARCHITECTURE_OVERVIEW.md`
- `ENGINE_SPEC.md`
- `ENGINE_CATALOG.md`
- `OBJECT_MODEL.md`
- `DATA_CONTRACTS.md`
- `INGESTION_STRATEGY.md`
- relevant feature or contract documents

Vision reference only:

- `ASTRONOMY_HUB_MASTER_PLAN.md`

Do not scan the full `/docs` directory by default.

---

## System Identity

Astronomy Hub is a real-time multi-engine astronomy intelligence system.

Primary question:

- What is above me right now, and what should I pay attention to?

The system is not merely a sky renderer.

The system is not merely a catalog browser.

The system is not merely a WordPress widget.

Astronomy Hub combines:

- observer context
- time context
- location context
- domain engines
- normalized object data
- visibility filtering
- relevance ranking
- detail views
- engine-specific rendering

---

## Core Structural Model

The primary user-facing structure is:

- Scope → Engine → Filter → Scene → Object → Detail → Assets

The primary data/system structure is:

- Ingestion → Normalization → Storage → Cache → API → Client Rendering

Both models must be preserved.

Do not introduce features that bypass these models.

---

## Current Runtime Reality

The active public ORAS sky runtime is:

- `/oras-sky-engine/`

This surface is the ORAS-hosted Stellarium Web / Stellarium Web Engine runtime.

It is a contained runtime inside Astronomy Hub.

It is not a generic Hub scene.

It is not a React-owned rendering component.

It is not a BabylonJS scene unless a future approved document explicitly replaces the current runtime direction.

The current ORAS Sky Engine runtime uses:

- `vendor/stellarium-web-engine/apps/web-frontend`
- `vendor/stellarium-web-engine/src`
- `frontend/public/oras-sky-engine`

Current backend/API support includes:

- `/api/sky/object`
- `/api/above-me`
- `backend/app/services`
- `backend/app/routes`

Older references to `/sky-engine`, BabylonJS sky rendering, or legacy engine plans must not override the current `/oras-sky-engine/` runtime without an explicit documented direction change.

---

## Hub Rule

The Hub is the Above Me decision layer.

The Hub receives candidate objects, filters them by visibility and constraints, ranks relevance, and outputs a curated set.

The Hub defines importance.

The Hub does not define astronomical reality.

The Hub does not own primary engine rendering.

### The Hub may

- request candidate objects
- rank and filter visible objects
- display curated object summaries
- link to engine views
- pass observer/time/location/config through defined contracts
- mount an isolated engine viewport through approved interfaces

### The Hub must not

- render full engine scenes
- display raw uncurated engine lists as the main product
- act as a simulation surface
- overwhelm the user with data
- own engine-internal render loops
- modify engine scene internals directly
- fake object visibility, coordinates, or catalog identity

### Hub Output Rule

The Hub output must be:

- small
- curated
- decision-ready
- source-backed
- routeable to the correct engine/detail view

---

## Engine Rule

An engine is a domain authority.

Each engine must:

- ingest or receive domain data
- normalize to the object model
- produce candidate objects when applicable
- provide detail data
- control scene behavior when it owns a primary scene
- own its runtime and render loop when it is a primary visual engine

Engines define reality within their domain.

The Hub decides which engine outputs matter to the user.

---

## Engine Types

### Primary Engine

A primary engine owns a domain and a scene.

It controls:

- rendering behavior
- scene composition
- object interaction
- runtime lifecycle
- engine-specific math and thresholds

### Sub-Engine

A sub-engine provides a layer inside a parent engine.

It may contribute data, overlays, or domain-specific objects.

It does not own the primary render loop.

### Dual-Role Engine

A dual-role engine can act as both:

- a primary engine in its own viewport
- a sub-engine within another parent engine

Any dual-role behavior must be explicitly defined by contracts.

---

## ORAS Sky Engine Rule

The ORAS Sky Engine is the `/oras-sky-engine/` Stellarium runtime.

It is a self-contained runtime that owns its own:

- rendering pipeline
- scene lifecycle
- object selection behavior
- camera behavior
- sky survey rendering
- star/DSO/planet/satellite visual behavior
- runtime update lifecycle

The ORAS Sky Engine may receive input only through defined interfaces, such as:

- URL route
- query parameters
- observer location
- time
- object identity contract
- API object lookup
- static runtime data

The Hub may link to it.

The Hub may mount it.

The Hub may pass state into it through approved contracts.

The Hub must not take over its internals.

### ORAS Sky Engine must not be converted into

- a shared Hub renderer
- a React-owned scene
- a BabylonJS replacement scene
- a generic visualization layer
- a cross-engine rendering utility

### ORAS Sky Engine data/API support may provide

- object identity
- catalog/source/model contracts
- RA/Dec fallback coordinates
- visibility-ranked objects
- stable Sky Engine URLs
- normalized catalog data
- survey provider configuration

### ORAS Sky Engine data/API support must not provide

- fake coordinates
- fake visibility
- fake survey coverage
- hand-registered production catalogs
- broken source identity
- raw provider payloads directly to public UI

---

## Viewport Rule

The system has a single primary rendering surface at a time.

Center Viewport = Active Engine Scene.

Rules:

- only one primary engine scene may be active
- the viewport is the primary interaction surface
- the Hub does not render scenes directly
- the active engine owns its own scene
- the viewport must match the active engine
- object routes must open the correct engine

### Failure conditions

The following violate the viewport rule:

- wrong engine displayed
- multiple primary scenes active unintentionally
- Hub acts as the rendering layer
- Hub controls engine-internal render loop
- `/oras-sky-engine/` is treated as a Hub-owned React/Babylon scene
- object route opens the wrong engine or wrong object

---

## Rendering Rule

Primary engines control:

- rendering behavior
- scene composition
- visual thresholds
- object interaction
- camera behavior
- runtime lifecycle

Sub-engines provide layers or data and do not own the primary render loop.

Host rule:

- the Hub may mount a primary engine viewport
- the Hub must not own the engine render loop
- the Hub must not become a shared universal rendering core

For the ORAS Sky Engine specifically, Stellarium runtime behavior wins over stale Hub abstractions.

---

## Scene Rule

Only one primary scene may be active.

A scene:

- belongs to one primary engine
- contains visible objects for that engine
- defines interaction behavior
- owns visual state

The system must never attempt to:

- render multiple primary engine scenes simultaneously
- mix Hub and engine rendering roles
- merge isolated engine rendering pipelines
- centralize all 3D rendering into the Hub

---

## Object Rule

All objects must follow:

- `OBJECT_MODEL.md`

No exceptions.

Object identity must preserve:

- catalog
- source_id
- model
- ra
- dec

Rules:

- `catalog + source_id + model` are authoritative.
- slug/display name is cosmetic.
- aliases must not replace authoritative identity.
- RA/Dec are fallback coordinates and must not be fabricated.
- large IDs, including Gaia source IDs, must remain strings.
- known object classes must not degrade to `Unknown Type`.

---

## Data Contract Rule

All system communication must follow:

- `DATA_CONTRACTS.md`

No custom one-off public formats are allowed.

API outputs must be normalized before reaching public UI.

Raw provider payloads must not become public UI contracts.

Sky Engine URL/object contracts must remain stable.

Required Sky Engine object link fields include:

- catalog
- source_id
- model
- ra
- dec
- sky_engine_url where applicable

---

## Ingestion Rule

All external data must follow:

- `INGESTION_STRATEGY.md`

No raw external data is allowed directly in public UI.

All external data must pass through:

- ingestion
- normalization
- storage or static mounted data
- cache/index where appropriate
- API or runtime contract
- client rendering

Production catalog data must be scalable.

Do not hand-register production object catalogs.

Allowed hand-added objects are limited to:

- tests
- fixtures
- temporary validation targets
- controlled proof cases

---

## Data Source Rule

Astronomy Hub may use upstream/public astronomy sources directly where license and access allow.

The system must not scrape Stellarium-Web.

The system must not copy Stellarium CDN data.

The system may use Stellarium credits/source lists as a source map, but source lists are not themselves implementation tasks.

Preferred data directions include:

### Stars

- Hipparcos / bright-star data
- Gaia-derived data
- future Gaia DR3 or EDR3 tiled/indexed star pipeline
- magnitude-limited and zoom-aware loading
- stable source IDs as strings

### Deep Sky Objects

- OpenNGC-derived normalized data
- Messier compatibility
- future Caldwell alias layer
- future HyperLeda/SIMBAD/NED enrichment where permitted
- future DSO image/media manifest

### Survey Imagery

- DSS as safe full-sky fallback
- higher-definition surveys where coverage is good
- controlled Pan-STARRS-style HiPS providers where validated
- DESI parked unless explicitly approved

### Solar System and Minor Bodies

- NASA/JPL-backed solar-system data
- future MPC asteroid/comet ingestion where approved
- no stubbed ephemeris or fake coordinates

### Satellites

- TLE-backed satellite identity
- validated propagation for visibility
- no fake RA/Dec/alt/az
- no fake visibility

---

## Earth / Satellite / Flight Rule

The Earth domain must preserve this hierarchy:

- Earth
  - Satellite
  - Flight
  - Conditions

Never flatten these into unrelated top-level systems.

Satellite may appear in sky-facing workflows when it is being rendered or ranked as an above-me object, but its domain relationship to Earth must remain preserved in architecture.

---

## Frontend / Backend Split

### Browser responsibilities

- rendering
- interaction
- scene transitions
- viewport hosting
- client-side route behavior
- engine-specific runtime execution when the engine is client-rendered

### Backend responsibilities

- ingestion
- normalization
- data contracts
- source-backed object lookup
- visibility calculations where backend-owned
- ranking/filtering APIs
- cache/index coordination

### Shared rule

The browser may render and interact.

The backend must own source-backed truth where API truth is claimed.

The UI must not invent truth.

---

## WordPress / ORAS Site Integration Rule

WordPress or ORAS site integration must be API-first.

Expected product path:

- WordPress page or shortcode
- calls `/api/above-me`
- receives curated ranked objects
- renders cards or a list
- user clicks an object
- opens `/oras-sky-engine/` centered on that object

WordPress must not:

- hardcode astronomy objects
- duplicate sky calculations
- scrape Sky Engine output
- depend on Sky Engine internals
- fake object visibility

---

## Validation Rule

Validation defines truth.

All completion claims must comply with:

- `docs/validation/SYSTEM_VALIDATION_SPEC.md`

If it cannot be proven from runtime behavior, it is not complete.

If it cannot be traced to real source/data/code, it is not complete.

If it relies on fake data, it is not real.

Expected statuses are:

- REAL
- PARTIAL
- FAKE
- BLOCKED

---

## Runtime Rule

Docker is the authoritative integrated runtime unless a task explicitly states local-only.

For `/oras-sky-engine/`, browser/runtime validation is required when work affects:

- deep links
- object selection
- camera centering
- runtime object materialization
- survey imagery
- skydata loading
- satellites
- star/DSO/planet fallback behavior
- loader/progress behavior

Local tests support runtime proof. They do not replace it when runtime behavior is claimed.

---

## Forbidden Behaviors

The system must NOT:

- fabricate truth
- fake coordinates
- fake visibility
- fake survey coverage
- bypass object model
- bypass contracts
- mix Hub and engine responsibilities
- introduce new architecture mid-task
- create dead-end UI
- hand-register production catalogs
- copy Stellarium CDN data
- scrape Stellarium-Web
- bake huge astronomy datasets into Docker without explicit approval
- silently follow stale docs over proven runtime behavior

---

## Stability Rule

If documents conflict:

1. `SYSTEM_VALIDATION_SPEC.md` defines validation truth.
2. `AGENTS.md` defines operating rules and override modes.
3. `CORE_CONTEXT.md` defines permanent architecture.
4. `LIVE_SESSION_BRIEF.md` defines active execution memory.
5. `PROJECT_STATE.md` defines recorded project reality.
6. `MASTER_PLAN.md` defines execution control.
7. vision documents are secondary.

If runtime evidence conflicts with stale documentation, report the drift explicitly.

Do not silently rewrite working runtime behavior to match stale text.

---

## Final Rule

Engines define reality.

The Hub defines importance.

The viewport renders the active truth.

The API must not fake truth.

The ORAS Sky Engine remains an isolated Stellarium runtime unless explicitly replaced by approved architecture.