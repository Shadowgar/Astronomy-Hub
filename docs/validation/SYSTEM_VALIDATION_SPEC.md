# SYSTEM VALIDATION SPEC

AUTHORITATIVE VALIDATION STANDARD

---

## 1. Validation Principle

A claim is valid only when it is:

1. implemented
2. architecture-aligned
3. runtime-proven
4. source-traceable
5. evidence-backed
6. boundary-compliant

If any required dimension is missing, status must be one of:

- PARTIAL
- FAKE
- BLOCKED

A feature is not complete because code exists.

A feature is complete only when the claimed behavior is proven in the correct runtime.

---

## 2. Allowed Feature Status

Only these status values are allowed:

- REAL
- PARTIAL
- FAKE
- BLOCKED

### REAL

The feature is implemented, architecture-aligned, runtime-proven, source-traceable, and evidence-backed.

### PARTIAL

Some real implementation exists, but one or more required proof dimensions are incomplete.

Examples:

- local tests pass but Docker runtime was not validated
- backend works but UI was not validated
- exact links resolve but camera centering was not browser-proven
- data loads but source licensing/source path is not documented
- survey provider works for some targets but fallback is incomplete

### FAKE

The feature appears to work but is not backed by real implementation or real data.

Examples:

- hardcoded production objects instead of catalog ingestion
- fake RA/Dec
- fake alt/az
- fake visibility
- fake magnitude
- fake satellite propagation
- fake survey coverage
- UI-only truth not backed by API/data/runtime
- screenshots without working route/API/runtime proof

### BLOCKED

The feature cannot be completed because of an explicit blocker.

Examples:

- upstream dataset unavailable
- license/access terms unresolved
- Docker runtime broken
- required source unavailable
- browser validation cannot run
- architecture conflict unresolved

---

## 3. Proof Requirements

Every completion claim must include:

- exact files changed
- exact commands run
- exact observed outputs
- explicit pass/fail statement
- runtime used
- remaining gaps

Preferred proof bundle:

- API response snippets
- test output
- build output
- Docker runtime output
- browser validation output
- screenshots only when UI/visual behavior is claimed

Screenshots alone are not proof.

A screenshot must be backed by route/API/runtime evidence when the feature depends on runtime behavior.

---

## 4. Authority Resolution

On validation conflicts, resolve in this order:

1. `docs/validation/SYSTEM_VALIDATION_SPEC.md`
2. `AGENTS.md`
3. `docs/context/CORE_CONTEXT.md`
4. `docs/context/LIVE_SESSION_BRIEF.md`
5. `docs/context/CONTEXT_MANIFEST.yaml`
6. `docs/PROJECT_STATE.md`
7. `docs/MASTER_PLAN.md`
8. relevant feature documents
9. architecture and contract documents
10. legacy documents

If an explicitly activated override mode exists in `AGENTS.md`, that mode may change source/context authority for that task.

Validation authority still applies.

Override modes change what source of truth is inspected first. They do not remove proof requirements.

---

## 5. Runtime Reality Rule

Runtime evidence overrides unproven assumptions.

If documentation says a behavior exists but runtime proof fails, the status is not REAL.

If code exists but runtime proof fails, the status is not REAL.

If runtime behavior works but documentation is stale, the stale documentation must be reported as drift.

Do not silently force working runtime behavior to match stale documents.

---

## 6. Architecture Validation

Must preserve both system models:

- Scope → Engine → Filter → Scene → Object → Detail → Assets
- Ingestion → Normalization → Storage → Cache → API → Client Rendering

### Hard failures

The following are validation failures:

- UI invents truth outside backend/data contracts
- raw provider payload reaches public UI without normalization
- object identity chain breaks
- engine ownership is incorrect
- scene does not match active engine
- Hub owns engine-internal rendering behavior
- large production data is hand-added instead of ingested/indexed
- production data is faked
- runtime behavior contradicts claimed architecture

---

## 7. ORAS Sky Engine Validation

The active ORAS sky runtime is:

- `/oras-sky-engine/`

This is a contained Stellarium Web / Stellarium Web Engine runtime.

For `/oras-sky-engine/` work, validation must prove the actual runtime behavior.

### Required when affected

Browser/runtime validation is required when changes affect:

- `/oras-sky-engine/`
- deep links
- object selection
- camera centering
- runtime object materialization
- star lookup
- DSO lookup
- planet or Moon lookup
- satellite lookup or propagation
- survey imagery
- runtime data loading
- loader/progress behavior

### Must verify

Sky Engine validation must verify:

- page loads
- no persistent loader
- no fatal JavaScript errors
- object route resolves correctly
- selected object identity matches expected object
- camera centers/locks when claimed
- runtime data source loads
- satellite parser count remains correct when relevant
- fallback behavior works when relevant

### Failure if

- panel title resolves but camera centers incorrectly
- object opens wrong coordinates
- wrong object is selected
- browser route works only by UI coincidence
- route works locally but fails in Docker/runtime
- stale cached asset masks a broken runtime
- fallback-created object lacks required Stellarium-compatible model data

---

## 8. Viewport Validation

Viewport equals active engine scene.

Must verify:

- correct engine is rendered
- scene matches engine
- interaction updates the scene correctly
- Hub does not override engine rendering
- Hub does not own engine-internal render loop or module composition

### Failure if

- wrong engine is displayed
- multiple engine scenes appear unintentionally
- Hub acts as rendering layer for an isolated engine
- viewport state is inconsistent
- Hub directly owns engine-internal runtime behavior
- Sky Engine is converted into a shared renderer
- `/oras-sky-engine/` is treated as a React/Babylon scene without explicit authorization

---

## 9. Routing Validation

Must verify:

- object routes to correct engine
- engine switching works when applicable
- sub-engine activation is correct when applicable
- direct links are stable
- query parameters are preserved or normalized correctly
- invalid query values degrade safely

### Failure if

- object opens wrong engine
- object opens wrong route
- routing is ambiguous
- ownership is unclear
- invalid query causes broken page or stuck loader
- explicit route override breaks default route behavior

---

## 10. Object Identity Validation

Object identity must preserve:

- catalog
- source_id
- model
- ra
- dec

Rules:

- `catalog + source_id + model` are authoritative.
- slug/display name is cosmetic.
- RA/Dec are fallback coordinates and must not be fabricated.
- Gaia and other large numeric IDs must remain strings.
- source IDs must remain stable.
- aliases must not replace authoritative IDs.
- known object types must not degrade to `Unknown Type`.

### Failure if

- source_id is numerically corrupted
- object identity relies only on display name
- catalog namespace is missing
- model is missing or wrong
- RA/Dec is invented
- aliases overwrite source identity
- exact lookup cannot round-trip into a Sky Engine URL

---

## 11. Data and Ingestion Validation

Production catalog data must be source-backed and scalable.

Allowed:

- normalized catalog loaders
- indexed/tiled datasets
- mounted/static data files
- upstream public datasets when allowed
- bounded test fixtures

Forbidden:

- hand-registering production stars
- hand-registering production DSOs
- faking catalog scale
- faking missing fields
- baking huge datasets into Docker unless explicitly approved
- copying Stellarium CDN data
- scraping Stellarium-Web

### Must verify

For catalog/data changes, proof must include:

- data source
- normalized record count
- skipped/unsupported count when applicable
- file path or storage path
- loader path
- API path
- exact lookup example
- above-me/discovery example if applicable
- performance note for representative request

---

## 12. Survey Imagery Validation

Survey imagery claims must prove runtime visual/data behavior.

Must document:

- provider ID
- service URL or local path
- tile format
- HiPS order when applicable
- coverage/MOC when available
- CORS behavior when external
- fallback behavior
- default/query/optional status
- visual QA targets tested

### Required target set when claiming visual improvement

Use a representative target set such as:

- M31
- M42
- M45
- M57
- M81/M82
- NGC 6543
- NGC 7000
- Veil Nebula
- dense Milky Way field

### Failure if

- partial coverage is claimed as full coverage
- default changes without fallback
- invalid provider breaks page
- tiles fail silently
- visual improvement is claimed without browser validation
- survey provider causes stuck loader
- DESI is promoted without explicit approval

---

## 13. Satellite Validation

Satellite claims must distinguish identity from propagation.

### Exact identity lookup

May validate:

- catalog
- source_id
- model
- NORAD ID
- name
- TLE presence
- category/groups

Exact identity lookup must not fabricate RA/Dec/alt/az.

### Propagation

Propagation claims must prove:

- TLE parsed
- propagation library used
- observer/time/location used
- RA/Dec finite
- alt/az finite
- range finite when claimed
- visibility computed from propagated altitude
- below-horizon objects excluded by default when claimed

### Failure if

- fake RA/Dec
- fake alt/az
- fake visibility
- malformed TLE crashes request
- Starlink flood dominates curated output
- propagation result lacks deterministic test case

---

## 14. API Validation

Backend/API validation must include:

- endpoint path
- request parameters
- response status
- response snippet
- schema/field proof
- degraded/error behavior when relevant

For `/api/above-me`, proof must include:

- observer/location/time inputs
- returned object types
- bounded result behavior
- stable `sky_engine_url`
- no fake visibility
- no fake coordinates

For `/api/sky/object`, proof must include:

- catalog
- source_id
- model
- returned identity
- returned coordinate behavior
- Sky Engine URL behavior when applicable

---

## 15. Frontend and Browser Validation

Frontend validation must include:

- build/test command
- test output
- route tested
- browser/runtime behavior where UI is claimed

For `/oras-sky-engine/`, validation must include browser evidence when any visual/runtime behavior is claimed.

A frontend unit test is not enough to prove runtime visual behavior.

A successful build is not enough to prove runtime visual behavior.

---

## 16. Docker Runtime Validation

Docker is the authoritative runtime unless the task explicitly states local-only.

Required when claiming integrated runtime success:

- Docker stack starts
- relevant service is healthy or responding
- route/API responds through Docker-served runtime
- browser/runtime validation uses Docker-served frontend when applicable

If Docker Compose Bake fails locally, use:

- `COMPOSE_BAKE=false`

and report that explicitly.

Local tests are supporting evidence. Docker/runtime proof is required for runtime completion claims.

---

## 17. Source Traceability

Source-traceable means the claim points to the correct source of truth for the task.

Examples:

- code source file/function
- upstream dataset
- normalized generated data file
- API endpoint
- runtime route
- browser validation harness
- upstream Stellarium behavior when in Runtime Mode
- validation output

For data upgrades, source traceability must identify the upstream dataset or provider.

For runtime parity work, source traceability must identify the upstream/vendored runtime behavior inspected.

For API work, source traceability must identify the backend service/route and returned fields.

---

## 18. Feature Evidence Card

Each feature completion report must include:

- Feature
- Status: REAL, PARTIAL, FAKE, or BLOCKED
- User-visible output
- Entry point
- Backend path
- Frontend/runtime path
- Data source
- Routing behavior
- Viewport behavior
- Object identity behavior, if applicable
- Degraded/fallback behavior
- Truth gaps
- Proof artifacts
- Commands run
- Observed outputs
- Remaining gaps

If any required field is not applicable, state `N/A` with reason.

---

## 19. Execution Block Rule

If any validation failure occurs:

STOP → record → fix → re-validate

Do not continue building new scope on failed validation.

Do not merge or claim completion over known validation failure unless the feature is explicitly marked PARTIAL or BLOCKED.

---

## 20. Non-Negotiable Rule

If it cannot be proven from runtime behavior, it is not complete.

If it cannot be traced to real source/data/code, it is not complete.

If it relies on fake data, it is not REAL.

---

## 21. Role Boundary

This document defines:

- validation authority
- truth classification
- proof standards
- runtime proof requirements

This document does NOT define:

- product scope
- execution order
- feature priority
- user-facing roadmap
- replacement for feature specifications

---

## Final Principle

Validation defines truth.