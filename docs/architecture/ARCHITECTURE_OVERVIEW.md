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

## CORE MODEL (AUTHORITATIVE)

```text
Scope → Engine → Filter → Scene → Object → Detail
```

---

## SYSTEM LAYERS

---

### 1. HUB (DECISION LAYER)

The Hub is the **command center and aggregation layer**.

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

Examples:

* Sky Engine
* Earth Engine
* Solar System Engine
* Deep Sky Engine
* Solar Engine

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

The frontend contains a **single central viewport**.

```text
Viewport = Active Engine Scene
```

Rules:

* the viewport always reflects the active engine
* switching engines replaces the scene
* the Hub does not render scenes directly
* the viewport is the primary interaction surface

---

## PRIMARY ENGINE RUNTIME BOUNDARY

For a primary engine:

* the engine may own its own BabylonJS runtime
* the engine owns its render loop and internal module graph
* the host provides mount surface, context, and routing only
* the host must not absorb engine-internal rendering behavior

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

* only the active engine processes data
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

* rendering (Babylon / WebGL / visualization layer)
* interaction handling
* scene control
* engine switching
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
