# 📄 `ARCHITECTURE_OVERVIEW.md`

This document defines the **non-negotiable system structure** for Astronomy Hub.

---

# 🌌 ASTRONOMY HUB — ARCHITECTURE OVERVIEW (AUTHORITATIVE)

---

# 0. PURPOSE

This document defines the **core architecture** of Astronomy Hub.

It establishes:

* system structure
* engine model
* filter model
* scope model
* scene instancing rules
* frontend vs backend responsibilities

This is a **system law document**.

All implementation must conform to this.

---

# 1. 🧠 SYSTEM MODEL

Astronomy Hub is a:

> **Multi-engine, filter-driven, scene-instanced intelligence system**

---

## 1.1 Core Structure

```text
User → Scope → Engine → Filter → Scene → Object → Detail View
```

---

## 1.2 Definitions

### Engine

A domain authority responsible for:

* data ingestion
* normalization
* structured output

Examples:

* Earth Engine
* Solar Engine
* Satellite Engine
* Flight Engine
* Solar System Engine
* Deep Sky Engine
* News Engine

---

### Filter

A scoped data view inside an engine.

A filter defines:

* what data subset is active
* what data is processed
* what visualization is used

Example:

```text
Earth Engine → Earthquake Filter
Solar Engine → Sunspot Filter
Satellite Engine → Visible Passes Filter
```

---

### Scope

Defines the scale of the system:

* Above Me
* Earth
* Sun
* Satellites
* Flights
* Solar System
* Deep Sky / Galaxy (future)

---

### Scene

The currently rendered environment.

A scene is:

* scope-bound
* engine-bound
* filter-driven

---

### Object

A selectable entity within a scene.

Examples:

* satellite
* planet
* flight
* earthquake
* sunspot region
* deep sky object

---

### Detail View

A full information panel for any object.

---

# 2. 🧠 ENGINE ARCHITECTURE

---

## 2.1 Engine Responsibilities

Each engine must:

* ingest external data
* normalize to system contracts
* expose filter-based outputs
* support object-level detail retrieval

---

## 2.2 Engine Independence Rule

> Engines must operate independently and must not depend on each other for core functionality.

Cross-engine relationships are handled by:

* the Main Engine
* the Knowledge / Linking system

---

## 2.3 Engine List (Authoritative)

### Earth Engine

* weather
* earthquakes
* aurora
* radiation
* meteor events
* light pollution

---

### Solar Engine

* sunspots
* flares
* CMEs
* magnetic activity
* solar imagery

---

### Satellite Engine

* visible passes
* Starlink
* communications
* science missions
* deep-space assets

---

### Flight Engine

* global flights
* above-horizon flights

---

### Solar System Engine

* planets
* moons
* comets
* asteroids
* spacecraft

---

### Deep Sky Engine

* galaxies
* nebulae
* clusters
* visible objects

---

### News Engine

* cross-domain news
* research linking
* media linking

---

# 3. 🔍 FILTER MODEL (CRITICAL)

---

## 3.1 Filter Rule

> Only the active filter drives computation and rendering.

---

## 3.2 Filter Behavior

When a filter is selected:

* only relevant data is fetched
* only relevant objects are processed
* only relevant visualization is rendered

---

## 3.3 No Multi-Filter Default

> Engines must not activate multiple filters simultaneously by default.

Multi-filter stacking must be:

* explicit
* controlled
* limited

---

# 4. 🎛️ SCOPE MODEL

---

## 4.1 Scope Rule

> Scope determines which engine and scene are active.

---

## 4.2 Scope Mapping

```text
Above Me       → Unified Multi-Engine Scene
Earth          → Earth Engine
Sun            → Solar Engine
Satellites     → Satellite Engine
Flights        → Flight Engine
Solar System   → Solar System Engine
Deep Sky       → Deep Sky Engine
```

---

# 5. 🔄 SCENE INSTANCING (CRITICAL)

---

## 5.1 Instancing Rule

> The system must only compute and render the active scene.

---

## 5.2 Scene Constraints

Every scene must be limited by:

* user location
* time
* viewport
* selected filter
* relevance ranking

---

## 5.3 No Global Computation

> The system must never compute all engines or all data globally in real time.

---

## 5.4 Progressive Loading

Scenes must:

* load summary first
* load detail on demand
* load media lazily

---

# 6. 🌌 “ABOVE ME” MERGE SYSTEM

---

## 6.1 Purpose

Provide a unified view of everything visible in the sky.

---

## 6.2 Merge Rule

> Each engine contributes only its sky-relevant filtered output.

---

## 6.3 Engine Contributions

```text
Satellite Engine → visible objects above horizon
Flight Engine    → aircraft above horizon
Solar System     → visible planets
Deep Sky Engine  → visible objects
Event System     → sky-relevant events
Earth Engine     → observing conditions
```

---

## 6.4 Output

* ranked objects
* filtered by visibility
* limited to relevance

---

# 7. 🖥️ FRONTEND ARCHITECTURE

---

## 7.1 Responsibilities

The frontend is responsible for:

* rendering scenes
* handling user interaction
* managing scope / engine / filter
* rendering 2D / 3D environments
* managing state

---

## 7.2 Rendering

Frontend must support:

* 2D maps (Earth)
* 3D globes (Earth / Sun)
* 3D solar system
* sky visualization
* object overlays

---

## 7.3 Data Handling

Frontend must:

* request scoped data only
* avoid full dataset requests
* progressively load detail

---

# 8. ⚙️ BACKEND ARCHITECTURE

---

## 8.1 Responsibilities

Backend is responsible for:

* data ingestion
* normalization
* caching
* API exposure
* scene-scoped query handling

---

## 8.2 Backend Constraints

> Backend must remain lightweight.

It must NOT:

* perform heavy rendering
* perform full global computation
* expose raw external APIs

---

## 8.3 Data Flow

```text
External APIs → Ingestion → Normalization → Cache → API → Frontend
```

---

# 9. 📡 DATA STRATEGY

---

## 9.1 Source Strategy

* use authoritative sources only
* minimize unnecessary APIs
* expand gradually

---

## 9.2 Normalization Rule

> All data must conform to internal contracts before use.

---

## 9.3 Caching

* cache frequently accessed data
* avoid repeated API calls
* support scheduled refresh

---

# 10. 🔗 OBJECT ROUTING

---

## 10.1 Rule

> Every object belongs to exactly one engine.

---

## 10.2 Routing

```text
Click Object → Identify Engine → Load Engine Detail View
```

---

## 10.3 Shared Layout

All detail views share:

* layout
* interaction model

Content is engine-specific.

---

# 11. 🚀 PERFORMANCE MODEL

---

## 11.1 Core Rule

> The system computes only what the user is looking at.

---

## 11.2 Constraints

* one active scene
* one active filter
* limited object count
* progressive loading

---

## 11.3 Result

* scalable system
* low backend load
* responsive UI

---

# 12. ⚠️ FORBIDDEN PATTERNS

---

The system must NOT:

* compute all engines at once
* load all filters simultaneously
* expose raw data dumps
* create UI without scope awareness
* allow uncontrolled API expansion

---

# 13. 🔥 FINAL ARCHITECTURE STATEMENT

```text
Astronomy Hub is a multi-engine, filter-driven, scene-instanced system
that computes only the active user context and renders only what is relevant.
```

---

# ✔️ Outcome

This document ensures:

* no architectural drift
* scalable system design
* alignment with Raspberry Pi backend
* alignment with browser-heavy rendering
* clean engine separation
* predictable system behavior

---