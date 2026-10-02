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

Merged PR #52 provides Home/Observe/Tonight/Sky under the shared ORAS shell.
SWE at `/oras-sky-engine/` is the current renderer; `/sky-engine` is its Hub host.
[Unified Universe Architecture](UNIFIED_UNIVERSE_ARCHITECTURE.md) is the detailed
approved reference: Hub-owned universal product state, complete applicable God's
Eye Earth, body-aware Cesium Planet Mode, controlled handoffs and additive astronomy
extensions. Those integrations are PLANNED, not implemented. Git/build topology,
exact state/extension API and solar-system-scale renderer remain OPEN.

## CORE MODEL (AUTHORITATIVE)

```text
Scope → Engine → Filter → Scene → Object → Detail → Assets
```

---

## SYSTEM LAYERS

---

### 1. HUB (PRODUCT AND DECISION LAYER)

The Hub owns product shell/navigation and astronomy decisions. Its future small
universal state owns mode, time, observer, selected entity/body, camera intent,
applicable layers and history/context. Renderers realize this intent through
qualified adapters and own internal scene/camera/selection behavior.

Responsibilities:

* collect candidate objects from engines
* filter by visibility, time, and conditions
* rank by relevance
* provide contextual feeds
* route interaction to engines

The Hub:

* does NOT render scenes
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
* PLANNED Earth: complete applicable God's Eye Earth runtime plus external Hub astronomy layers
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

The public shell contains Home, Observe, Tonight and Sky decision/navigation
surfaces. Only Sky mounts the **single contained engine viewport**. Home is not
a renderer or a mandatory command-center viewport.

```text
Viewport = Active Engine Scene
```

Rules:

* the viewport always reflects the active engine
* future renderer handoffs preserve product context while the engine changes; exact animation/lifetime policy remains open
* the Hub does not render scenes directly
* the mounted viewport is the Sky interaction surface

---

## PRIMARY ENGINE RUNTIME BOUNDARY

For a primary engine:

* the engine owns its renderer-specific runtime
* the engine owns its render loop and internal module graph
* the host owns mount surface, application chrome, product context, and routing
* future adapters translate selection/time/observer/camera/layer intent without owning render math
* the host must not absorb engine-internal rendering behavior

The active ORAS Sky Engine is the contained Stellarium Web / Stellarium Web
Engine runtime at `/oras-sky-engine/`. God's Eye Earth and Cesium Planet Mode
are approved future directions; implementation requires the compatibility study
and a bounded task. Both upstream renderers are pinned/qualified and immutable
by default, with Hub additions outside upstream code.

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
* future multi-renderer lifetime/performance policy remains open pending study
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
