#`ARCHITECTURE_OVERVIEW.md`

---

# ASTRONOMY HUB — ARCHITECTURE OVERVIEW

---

## PURPOSE

This document defines the **system architecture** of Astronomy Hub.

It describes:

* system structure
* responsibility boundaries
* runtime behavior
* data flow

This document is **authoritative for system structure**, but does NOT define execution order.

---

## Current Foundation and Approved Future Direction

C0–C5.6 completed bounded local checkpoints implement the renderer-centered
workspace, small Hub product state and serial versioned Sky/Earth bridge. SWE
owns Sky scene/math; the independent Earth runtime owns its Cesium Viewer.
Prefer qualified reuse/wrapping of pinned God's Eye functions/modules, preserving
stronger Hub science/security guards. No upstream full app or Viewer singleton.
[ADR0009](decisions/0009-owned-earth-feature-reuse.md) supersedes dated full-app
recommendations. [Unified Universe Architecture](UNIFIED_UNIVERSE_ARCHITECTURE.md)
and [PROJECT_STATE](../execution/PROJECT_STATE.md) distinguish this current
foundation from proposed C5.7, unimplemented C6 and later body/astronomy work.

## CORE MODEL (AUTHORITATIVE)

```text
Scope → Engine → Filter → Scene → Object → Detail → Assets
```

---

## SYSTEM LAYERS

---

### 1. HUB (PRODUCT AND DECISION LAYER)

The Hub owns product shell/navigation and astronomy decisions. Its implemented small
product state owns mode, time, observer, selected entity, camera intent,
applicable layers and history/context. Renderers realize this intent through
qualified adapters and own internal scene/camera/selection behavior.

Responsibilities:

* collect candidate objects from engines
* filter by visibility, time, and conditions
* rank by relevance
* provide contextual feeds
* route interaction to engines

The Hub:

* product shell does not render scenes; independent Earth runtime owns its Viewer
* does NOT own object behavior
* does NOT simulate reality

---

### 2. ENGINES (DOMAIN LAYERS)

Each engine:

* owns a domain
* produces candidate objects
* provides detail views
* supports exploration
* controls its scene (if primary)
* may own an isolated runtime if primary

Renderer roles:

* CURRENT Sky: SWE
* CURRENT Earth: independently owned Cesium Viewer, bounded adapters and pinned feature reuse; broader capabilities gated
* PLANNED Planet: body-aware Cesium surface direction with qualified data, Mars first
* OPEN solar-system scale: study SWE sufficiency before selecting another scene

Other domain engines are capability references, not evidence of integrated runtimes.

---

### 3. SCENE (RENDER LAYER)

The Scene is the **active rendering environment**.

Rules:

* only one scene is active at a time
* the scene is owned by the active primary engine
* only relevant objects are rendered
* detail loads on demand

---

## VIEWPORT MODEL (CRITICAL)

`/` and `/sky-engine` open the Sky workspace; `/earth` opens Earth.
Observe and Tonight remain decision routes. The workspace mounts one independent
Sky or Earth scene at a time through the qualified serial
bridge/lifetime. `/oras-sky-engine/` stays standalone SWE. Product intent persists;
renderer-specific state/math stays with the active engine. No shared render core.
Exact later visual handoff/prewarming needs separate device qualification.

## PRIMARY ENGINE RUNTIME BOUNDARY

For a primary engine:

* the engine owns its renderer-specific runtime
* the engine owns its render loop and internal module graph
* the host owns mount surface, application chrome, product context, and routing
* current adapters translate bounded selection/time/observer/camera/layer intent without absorbing SWE math
* the host must not absorb engine-internal rendering behavior

The active ORAS Sky Engine is contained SWE at `/oras-sky-engine/`; owned Cesium
Earth exists at `/earth-runtime/`. Planetary surfaces remain planned. Qualified
pinned upstream code stays immutable by default; external adapters own additions.
Full-app Earth topology is superseded by ADR0009, not an implementation mandate.

---

### 4. OBJECTS

Objects are **clickable entities** produced by engines.

Examples:

* star
* planet
* satellite
* flight
* deep sky object
* event

Objects:

* belong to an engine
* are rendered in a scene
* trigger detail and navigation

---

## RUNTIME RULES

* focus rendering/computation on the active scene; backend ingestion/caches and
  independent Observe/Tonight requests need not stop when that scene changes
* planned settled switches retain one active heavy renderer and dispose/unmount
  the inactive runtime; mobile uses serial teardown/start. Brief desktop overlap
  is only a later qualified visual-handoff option, not the Phase C default.
  Actual memory/performance measurements and exact prewarming remain open
* only the active filter drives computation
* only visible objects are rendered
* detail is loaded on demand
* scene updates are driven by interaction

---

## INTERACTION FLOW (ARCHITECTURAL)

```text
User interacts
→ Hub receives intent
→ Hub determines target engine
→ Active engine updates scene
→ Object is focused
→ Detail layer opens
```

---

## FRONTEND / BACKEND SPLIT

---

### Frontend (Browser)

Responsibilities:

* hosting engine-owned rendering surfaces
* interaction handling
* routing and engine switching
* UI composition

---

### Backend (API / Pi)

Responsibilities:

* ingestion
* normalization
* caching
* aggregation
* distribution

---

## DATA FLOW

```text
External Sources
→ Ingestion
→ Normalization
→ Database
→ Cache
→ API
→ Frontend
→ Engine Scene
```

---

## ENGINE COORDINATION

Engines operate independently but must:

* conform to shared object model
* expose consistent contracts
* support cross-engine navigation
* preserve thin host-facing interfaces

---

## NON-GOALS

This document does NOT define:

* feature order
* UI styling or layout specifics
* execution sequencing
* task prioritization

---

## AUTHORITY

This document defines:

* system structure
* responsibility boundaries
* runtime rules

Execution decisions must come from execution and feature documents.

---

## FINAL PRINCIPLE

```text
The Hub selects context.  
The Engine defines the scene.  
The Scene renders reality.  
The user explores through interaction.
```
