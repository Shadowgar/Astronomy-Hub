
# `CORE_CONTEXT.md`



---

# CORE CONTEXT — SYSTEM AUTHORITY

---

## Purpose

This document defines the permanent system rules of Astronomy Hub.

It is always loaded. It is not a roadmap, not a phase document, and not a task list.

Its job is to define:

* what Astronomy Hub is
* how the system is structured
* which rules must never be violated

---

## Document Role

This document is the top-level architectural authority for system behavior.

It does not define:

* current build task
* current engine being worked on
* UI polish tasks
* implementation order

Those belong in:

```text
docs/context/LIVE_SESSION_BRIEF.md
```

---

## Required Load Order

Any coding session must load:

1. CORE_CONTEXT.md
2. LIVE_SESSION_BRIEF.md

Optional deeper references:

3. ARCHITECTURE_OVERVIEW.md
4. ENGINE_SPEC.md
5. ENGINE_CATALOG.md
6. OBJECT_MODEL.md
7. DATA_CONTRACTS.md
8. INGESTION_STRATEGY.md

Vision reference only:

* ASTRONOMY_HUB_MASTER_PLAN.md

---

## System Identity

Astronomy Hub is a **real-time multi-engine astronomy intelligence system**.

Primary question:

```text
What is above me right now, and what should I pay attention to?
```

---

## Core Structural Model

```text
Scope → Engine → Filter → Scene → Object → Detail
```

---

## Viewport Rule (CRITICAL)

The system has a single primary rendering surface:

```text
Center Viewport = Active Engine Scene
```

Rules:

* only one engine scene may be active
* the viewport is the primary interaction surface
* the hub does not render scenes directly

---

## Hub Rule

The Hub is the **Above Me decision layer**.

The Hub:

* receives candidate objects
* filters by visibility and constraints
* ranks relevance
* outputs a curated set

---

### Hub Must NOT:

* render full engine scenes
* display raw engine lists
* act as a simulation surface
* overwhelm the user with data

---

### Hub Output Rule

The Hub outputs:

* small
* curated
* decision-ready

---

## Engine Rule

An engine is a domain authority.

Each engine must:

* ingest or receive domain data
* normalize to object model
* produce candidate objects
* provide detail
* control scene behavior (if primary)

---

## Engine Types

**Primary Engine**
Owns domain + scene

**Sub-Engine**
Layer inside parent

**Dual-Role Engine**
Both primary + sub

---

## Rendering Rule

Primary engines:

* control rendering behavior
* define scene composition
* manage object interaction

Sub-engines:

* provide layers
* do not own rendering

---

## Scene Rule

Only one scene may be active.

A scene:

* belongs to one primary engine
* contains all visible objects
* defines interaction

The system must never attempt to:

* render multiple engine scenes simultaneously
* mix hub and engine rendering roles

---

## Object Rule

All objects must follow:

* OBJECT_MODEL.md

No exceptions.

---

## Data Contract Rule

All system communication must follow:

* DATA_CONTRACTS.md

No custom formats allowed.

---

## Ingestion Rule

All external data must follow:

* INGESTION_STRATEGY.md

No raw data allowed in UI.

---

## Earth / Satellite / Flight Rule

Must remain:

```text
Earth (parent)
 ├─ Satellite
 ├─ Flight
 └─ Conditions
```

Never flatten these.

---

## Frontend / Backend Split

### Browser

* rendering
* interaction
* scene transitions

### Backend

* ingestion
* normalization
* data contracts

---

## Forbidden Behaviors

The system must NOT:

* fabricate truth
* bypass object model
* bypass contracts
* mix hub and engine responsibilities
* introduce new architecture mid-task
* create dead-end UI

---

## Stability Rule

If documents conflict:

* CORE_CONTEXT wins
* LIVE_SESSION defines active work

---

## Final Rule

```text
Engines define reality.  
The Hub defines importance.  
The viewport renders the active truth.
```

---