# CORE CONTEXT - SYSTEM AUTHORITY

## Purpose

This document defines the permanent system rules of Astronomy Hub.

It is always loaded in Default Mode. It is not a roadmap, not a phase document,
and not a task list.

This document defines:

- what Astronomy Hub is
- how the system is structured
- which boundaries must not be violated
- how the Hub, APIs, data, engines, and rendering surfaces relate to each other

If this document conflicts with `docs/validation/SYSTEM_VALIDATION_SPEC.md`,
validation authority wins for proof and status classification.

If this document conflicts with proven runtime reality, report documentation
drift. Do not silently rewrite working runtime behavior to match stale text.

## Required Load Order

Default Mode sessions must load:

1. `docs/context/CORE_CONTEXT.md`
2. `docs/context/LIVE_SESSION_BRIEF.md`
3. task-specific documents from `docs/context/CONTEXT_MANIFEST.yaml`

Do not scan the full `docs/` directory by default.

## System Identity

Astronomy Hub is a unified, continuously navigable astronomy, Earth, and planetary
exploration workspace with astronomy intelligence. The approved architecture is
[Unified Universe Architecture](../architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md).
Its current foundation is the shared public shell, Observe, Tonight, and SWE;
Earth/planet integration and universal multi-renderer state are planned.

Primary user question:

```text
What is above me right now, and what should I pay attention to?
```

Astronomy Hub is not merely a sky renderer, catalog browser, or WordPress
widget.

It combines:

- observer context
- time context
- location context
- domain engines
- normalized object data
- visibility filtering
- relevance ranking
- detail views
- engine-specific rendering

## Core Structural Models

Preserve both models:

```text
Scope -> Engine -> Filter -> Scene -> Object -> Detail -> Assets
```

```text
Ingestion -> Normalization -> Storage -> Cache -> API -> Client Rendering
```

Do not introduce features that bypass these models.

## Current Runtime Reality

The active public ORAS sky runtime is:

```text
/oras-sky-engine/
```

`/oras-sky-engine/` is the ORAS-hosted Stellarium Web / Stellarium Web Engine
runtime.

It is not:

- the `/sky-engine` Hub host route (which embeds this runtime)
- a BabylonJS sky scene
- a React-owned rendering component
- a shared Hub renderer

It uses:

- `vendor/stellarium-web-engine/apps/web-frontend`
- `vendor/stellarium-web-engine/src`
- `frontend/public/oras-sky-engine`

Current supporting API surfaces include:

- `/api/sky/object`
- `/api/above-me`

Claims that `/sky-engine` is a placeholder or a replacement sky renderer are
stale: it is the implemented Hub host for `/oras-sky-engine/`. BabylonJS sky
rendering and generic Hub-owned sky rendering are not the current direction.

## Hub Rule

The Hub owns the product shell, navigation, and Above Me decision layer.

The approved future Hub-owned universal state is small: mode, time, observer,
selected entity/body, camera intent, applicable layers, and history/context.
The [Phase B study](../studies/GODS_EYE_SWE_COMPATIBILITY_STUDY.md) recommends
a versioned capability bridge between independently built, same-origin runtime
frames with only the active heavy renderer mounted. Exact schema and runtime
qualification remain open. Engines realize these intents
through qualified adapters and own their internal camera, selection and scene
behavior. Shared product intent is not permission to modify renderer internals.

Its Above Me decision capability:

- receives candidate objects
- filters by visibility and constraints
- ranks relevance
- outputs a curated set
- links users to the correct engine/detail view

The Hub may:

- request candidate objects
- rank and filter visible objects
- display curated summaries
- pass observer/time/location/config through defined contracts
- link to `/oras-sky-engine/`
- mount an isolated engine viewport through approved interfaces

The Hub must not:

- reach into SWE scene or render-loop internals
- turn the Hub shell into a shared universal renderer
- modify Sky Engine scene internals
- present raw uncurated provider lists as curated Above Me decisions
- fake object visibility, coordinates, or catalog identity

Above Me discovery output must be small, curated, decision-ready, source-backed,
and routeable. This bounds the observing decision feed, not the complete applicable
Earth feature set or the unified product's exploration capabilities.

## ORAS Sky Engine Isolation Rule

The ORAS Sky Engine is a contained Stellarium runtime.

It owns its own:

- rendering pipeline
- scene lifecycle
- renderer-local selection realization
- camera execution and behavior
- survey imagery behavior
- visual math
- runtime data loading

The Hub and backend may provide input only through defined interfaces:

- observer
- time
- location
- configuration
- stable object identity and product selection/camera intent through qualified interfaces
- validated fallback coordinates

The Hub and backend must not override Stellarium runtime math or lifecycle.

## Data Truth Rule

No fake data.

No fake coordinates.

No fake visibility.

No fake magnitudes.

No fake survey coverage.

No fake object availability.

Production object support must be data-driven and scalable. Hand-added objects
are allowed only as tests, fixtures, or controlled validation targets.

Stable Sky Engine identity is:

```text
catalog + source_id + model
```

Rules:

- slug/display name is cosmetic
- `ra` and `dec` are fallback centering data and must not be fabricated
- large IDs such as Gaia IDs must remain strings
- catalog namespaces must be explicit and durable

## Runtime Authority

Docker is the authoritative runtime for system validation.

Local commands and unit tests are supporting evidence. Runtime-sensitive claims
must be proven against the running stack when required.

Expected runtime proof may include:

- `docker compose ps`
- API `curl` checks
- backend tests
- frontend tests
- browser/Playwright checks
- `npm run validate:oras-deep-links`

## WordPress / ORAS Site Integration

WordPress and ORAS shortcode work is deferred until explicitly approved.

The expected future path is:

```text
WordPress page or shortcode
-> calls /api/above-me
-> receives curated ranked objects
-> renders cards/list
-> user clicks object
-> opens /oras-sky-engine/ centered on that object
```

The public Hub homepage was implemented in merged PR #52. WordPress integration
and further homepage/workspace implementation still require bounded approval.

## High-Definition Data and Imagery Lane

High-definition data and imagery remain an active future lane.

Allowed direction:

- deeper star catalogs through tiled/indexed ingestion
- richer DSO catalogs and media manifests
- validated satellite freshness and propagation
- controlled survey providers with DSS fallback
- high-definition imagery where coverage and validation support it

Forbidden direction:

- scraping TheSkyLive
- scraping Stellarium-Web
- copying Stellarium CDN data
- promoting DESI without approval
- baking huge skydata into Docker
- faking completeness

Credits-update work is not part of this lane unless explicitly requested.

## Approved Upstream Boundaries

Astronomy Hub owns the Cesium Earth runtime. God's Eye supplies selectively
adapted public modules from an immutable external pin; its complete application
and Viewer startup are prohibited. Useful capabilities remain in the parity ledger.
Future astronomy additions are external additive extensions. Body-aware Cesium is the planned planetary
surface direction. The solar-system-scale renderer remains open. Earth foundation implementation is active; planetary integration has not started.

SWE and God's Eye must remain pinned, qualified, upgradeable, and low-divergence.
Upstream source is immutable by default; unavoidable changes require explicit
architectural exception under the unified architecture. Code licensing never
implicitly licenses third-party data, visual assets, or runtime providers.

## Final Rule

The Hub defines importance.

Engines define domain reality.

The ORAS Sky Engine owns Stellarium runtime behavior at `/oras-sky-engine/`.
