# PHASE_2_5_BACKEND_INVENTORY (REWRITTEN)

## Purpose

This document is the backend reality audit for Astronomy Hub during the architecture reset.

It exists to answer four questions clearly:

1. What backend code exists right now?
2. What role does each part currently play?
3. What can be preserved?
4. What must be replaced or restructured to align with the authoritative architecture?

This is not a roadmap document.
This is not a vision document.
This is a current-state inventory aligned to the new engine-based system model.

---

## 1. Current backend truth

At the time of this inventory, the backend is still primarily a lightweight prototype runtime centered around a small HTTP server entrypoint and mock-domain data files.

Observed current truth:

- The backend does exist and is runnable.
- The backend does expose API paths for current product slices.
- The backend is not yet the canonical FastAPI architecture required by the rewritten Phase 2.5 specification.
- The backend currently behaves more like a transitional prototype than a finalized system authority.

This means the backend is useful as a source of working behavior and reusable logic, but not as the final architectural form.

---

## 2. Current runtime entry

### Current primary entrypoint
- `backend/server.py`

### Current role
- lightweight runtime entry
- handles incoming HTTP requests
- dispatches to current route logic
- assembles current scene-like responses
- applies limited normalization
- performs limited caching

### Current architectural status
- **usable**
- **not final**
- **must be replaced or absorbed into canonical FastAPI runtime**

### Keep / Replace
- **Keep**: request/response behavior knowledge, endpoint intent, small reusable helper logic
- **Replace**: runtime structure, routing model, canonical API authority, server architecture

---

## 3. Current backend file groups

### 3.1 Runtime / entry files
Observed files:
- `backend/server.py`

Purpose:
- current prototype runtime
- current observable API behavior

Status:
- transitional
- not authoritative future architecture

---

### 3.2 Domain mock / provider stub files
Observed files:
- `backend/conditions_data.py`
- `backend/targets_data.py`
- `backend/passes_data.py`
- `backend/alerts_data.py`

Purpose:
- provide current mock payloads
- provide current domain-specific placeholder outputs
- support existing frontend scenes

Status:
- useful as temporary data fixtures
- not final engine architecture
- should eventually become engine fixtures, test fixtures, or seed data, not direct runtime truth

Keep / Replace:
- **Keep**: representative payload examples, any useful domain shaping
- **Replace**: direct use as authoritative runtime source

---

### 3.3 Services / enrichment helpers
Observed files:
- `backend/services/imageResolver.py`

Purpose:
- enrich target-like objects with image URLs
- prototype-level helper for media association

Status:
- potentially reusable
- currently too narrow and too implicit for the future multi-engine media system

Keep / Replace:
- **Keep**: concept of media resolution and enrichment
- **Replace / Refactor**: location, naming, interface, engine ownership, contract alignment

---

### 3.4 Cache layer
Observed files:
- `backend/cache/simple_cache.py`

Purpose:
- in-process TTL cache
- reduces repeated response assembly

Status:
- useful as a local prototype cache
- not sufficient as the final system-wide caching strategy

Keep / Replace:
- **Keep**: basic cache behavior if still useful for local dev or fallback
- **Replace / Extend**: production caching architecture, central cache strategy, engine-aware cache keys

---

### 3.5 Normalizer / validator layer
Observed files:
- `backend/normalizers/conditions_normalizer.py`
- `backend/normalizers/validator.py`

Purpose:
- normalize or validate payloads against contracts
- prototype contract enforcement

Status:
- important conceptually
- currently incomplete
- current normalizer implementation is still stub-level

Keep / Replace:
- **Keep**: contract validation concept, validator intent
- **Replace / Expand**: full engine-based normalization layer, broader schema enforcement, canonical runtime integration

---

### 3.6 Logging / observability
Observed files:
- `backend/logging_config.py`

Purpose:
- central logging configuration
- supports error visibility and degraded mode observations

Status:
- useful and likely reusable

Keep / Replace:
- **Keep**: centralized logging concept
- **Refactor as needed**: naming, structured logging fields, runtime integration

---

### 3.7 Backend test files
Observed files:
- `backend/tests/test_degraded_mode.py`
- `backend/tests/test_normalizers_conditions.py`
- `backend/tests/test_validator.py`

Purpose:
- verify portions of prototype behavior
- verify validator imports and partial degraded-mode behavior

Status:
- useful as evidence of existing behavior
- insufficient for final architecture
- should be restructured around engines, contracts, scenes, and object-detail APIs

Keep / Replace:
- **Keep**: any valid behavioral assertions
- **Replace / Expand**: full engine contract tests, scene tests, object detail tests, routing tests

---

## 4. Current backend behavior by responsibility

### 4.1 Routing
Current state:
- centralized in prototype runtime
- minimal endpoint handling
- not yet engine-router based

Needed future state:
- canonical FastAPI router structure
- scene routes
- object routes
- engine routes
- filter-aware query handling

Conclusion:
- current routing behavior is informative
- current routing structure is not acceptable as final architecture

---

### 4.2 Data normalization
Current state:
- partially acknowledged
- incompletely implemented
- contract intent exists, but not full enforcement

Needed future state:
- every engine normalizes through explicit adapters
- no raw provider payload reaches frontend
- object summaries, scenes, details all conform to canonical contracts

Conclusion:
- normalization concept exists
- implementation is not mature enough

---

### 4.3 Scene assembly
Current state:
- some current endpoints effectively assemble view payloads
- current behavior is closer to prototype scene assembly than full engine-scoped scene composition

Needed future state:
- scene-aware backend
- scope-aware backend
- engine-aware scene assembly
- “Above Me” merged scene resolver

Conclusion:
- current behavior is a useful precursor
- not yet aligned to rewritten architecture

---

### 4.4 Object detail handling
Current state:
- object-detail architecture is incomplete or absent as a unified authority
- domain detail is still fragmented

Needed future state:
- `/api/object/{id}` as canonical detail route
- owning engine resolution
- full detail contract
- related objects / media / news / relationships

Conclusion:
- major required expansion area

---

### 4.5 Media integration
Current state:
- image enrichment exists in narrow form
- not yet generalized

Needed future state:
- reusable media resolution model
- engine-aware media enrichment
- contract-based media arrays
- source attribution

Conclusion:
- promising seed exists, but architecture must change

---

### 4.6 Caching
Current state:
- simple local cache exists
- endpoint-level caching behavior exists

Needed future state:
- scene cache
- object cache
- engine/filter-aware caching
- scheduled invalidation / refresh strategy
- optional Redis-backed future path

Conclusion:
- current cache is a starting point only

---

## 5. Gap analysis against authoritative architecture

### Required by new architecture
The authoritative architecture now requires:

- FastAPI as canonical backend runtime
- engine-based backend structure
- filter-aware scene APIs
- unified object detail routing
- strict contract enforcement
- normalized data across all engines
- scene instancing behavior
- backend authority over all structured outputs

### Current backend gaps
Current backend is missing or incomplete in these areas:

- canonical FastAPI runtime
- engine directory/ownership model
- filter-specific engine routing
- full scene contract assembly
- full object-detail contract
- consistent cross-engine linking
- knowledge-graph or relationship exposure
- robust ingestion structure
- production-grade caching strategy

---

## 6. Preservation plan

The current backend should not be thrown away blindly.

### Preserve
These parts may be preserved or adapted:

- current endpoint intent
- current mock payload shapes where useful
- image enrichment concept
- validator concept
- logging structure concept
- local cache behavior for dev/testing
- any real behavioral tests that still align with new contracts

### Replace or restructure
These parts must change:

- runtime entry architecture
- server organization
- route ownership
- domain file layout
- normalization depth
- object-detail authority
- cross-engine linking model
- current direct reliance on stub-style payload modules

---

## 7. Recommended future backend structure

A target backend layout should move toward something like:

- `backend/app/main.py`
- `backend/app/api/`
- `backend/app/engines/earth/`
- `backend/app/engines/solar/`
- `backend/app/engines/satellite/`
- `backend/app/engines/flight/`
- `backend/app/engines/solar_system/`
- `backend/app/engines/deep_sky/`
- `backend/app/contracts/`
- `backend/app/services/`
- `backend/app/cache/`
- `backend/app/ingest/`
- `backend/tests/`

This is illustrative architecture guidance for alignment, not a required exact path map for this inventory document.

---

## 8. Current codebase classification

### Safe to treat as prototype behavior source
- `backend/server.py`
- current mock data files
- current image resolver
- current normalizer/validator layer
- current simple cache

### Safe to treat as architectural law
- none of the current prototype runtime files by themselves

### Architectural law must come from
- rewritten master plan
- rewritten architecture overview
- rewritten data contracts
- rewritten phase documents

---

## 9. Final inventory conclusion

The backend already contains valuable prototype work, but it is not yet the final architecture.

The correct interpretation of the current backend is:

- **not disposable**
- **not authoritative**
- **partially reusable**
- **structurally incomplete for the dream system**

The backend should therefore be treated as:

> a prototype behavior and utility source to be migrated into the new engine-based, contract-driven, FastAPI architecture

—not as the architecture that future work should continue extending in place without reorganization.

---

## 10. Final statement

This inventory establishes the backend truth clearly:

> Astronomy Hub already has a working backend prototype, but the system now requires a formal migration from prototype runtime behavior into a canonical multi-engine backend architecture.

