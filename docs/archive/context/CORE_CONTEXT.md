# CORE CONTEXT — SYSTEM AUTHORITY

## Purpose

This document defines the permanent system rules of Astronomy Hub.

It is always loaded. It is not a roadmap, not a phase document, and not a task list.

Its job is to tell the coding AI:

* what Astronomy Hub is
* how the system is structured
* which documents are authoritative for deeper rules
* what must never be violated

---

## Document Role

This document is the top-level architectural authority for system behavior.

It does not define:

* current build task
* current engine being worked on
* current sprint or phase
* UI polish tasks
* implementation order

Those belong in `docs/context/LIVE_SESSION_BRIEF.md`.

---

## Required Load Order

Any coding session that changes product behavior must load these documents in this order:

1. `docs/context/CORE_CONTEXT.md`
2. `docs/context/LIVE_SESSION_BRIEF.md`

If deeper system detail is required, these may then be loaded as references:

3. `docs/architecture/ARCHITECTURE_OVERVIEW.md`
4. `docs/architecture/ENGINE_SPEC.md`
5. `docs/architecture/ENGINE_CATALOG.md`
6. `docs/architecture/OBJECT_MODEL.md`
7. `docs/architecture/DATA_CONTRACTS.md`
8. `docs/architecture/INGESTION_STRATEGY.md`

The master plan is vision-only and must not be used as an execution document.

Vision reference:

* `docs/product/ASTRONOMY_HUB_MASTER_PLAN.md`

---

## System Identity

Astronomy Hub is a real-time multi-engine astronomy intelligence system.

Its primary user-facing question is:

> What is above me right now, from the selected location and time, and what should I pay attention to?

The system may later expand into broader Earth, solar, satellite, flight, and deep-sky exploration, but all implementation must preserve that core question.

---

## Core Structural Model

The system hierarchy is:

Scope → Engine → Filter → Scene → Object → Detail

### Definitions

**Scope**
The top-level domain the user is currently in. Examples: Above Me, Earth, Solar System, Deep Sky.

**Engine**
A domain authority that owns data logic, candidate generation, detail behavior, and exploration context.

**Filter**
A user- or system-selected subset of engine output.

**Scene**
The currently rendered interactive surface for the active scope or engine.

**Object**
A normalized entity that can be shown, selected, and explored.

**Detail**
The object-specific expanded information view.

---

## Hub Rule

The Hub is the `Above Me` decision layer.

The Hub is not a raw data surface.

The Hub does four things only:

1. receives candidate objects from engines
2. filters candidates by current visibility and other constraints
3. ranks candidates by relevance
4. returns a short curated result set

### Hard Hub Rules

The Hub must never:

* display raw unranked engine lists
* act as an engine scene
* render all candidates from all engines
* exceed the current output limit defined in the live session brief

### Hub Output Rule

The Hub shows only curated, ranked, decision-ready items.

Hub ranking responsibility belongs to the Hub, not to engines.

Detailed ranking and candidate contracts are defined in:

* `docs/architecture/DATA_CONTRACTS.md`
* `docs/architecture/OBJECT_MODEL.md`

---

## Engine Rule

An engine is a domain-specific system that must do all of the following:

* ingest or receive data for its domain
* normalize that data into the shared object model
* produce candidate objects or signals
* provide object detail behavior
* support user focus inside its own domain context

Detailed engine rules are defined in:

* `docs/architecture/ENGINE_SPEC.md`
* `docs/architecture/ENGINE_CATALOG.md`

### Engine Types

Astronomy Hub supports three engine roles:

**Primary Engine**
Owns a complete domain scene and can be entered directly.

**Sub-Engine**
Operates inside a parent engine and shares that engine’s rendering context.

**Dual-Role Engine**
Can function both as a primary engine and as a sub-engine inside another engine.

Current example:

* Conditions Engine = primary engine and Earth sub-engine

---

## Earth / Satellite / Flight Relationship

Earth, Satellite, and Flight are not peer experiences at the same level.

The correct relationship is:

* Earth Engine = parent geospatial environment
* Satellite = sub-engine of Earth
* Flight = sub-engine of Earth
* Conditions = sub-engine of Earth and also a primary engine

That means:

* selecting a satellite opens Earth Engine with Satellite layer active
* selecting a flight opens Earth Engine with Flight layer active
* selecting a conditions-related Earth event may open Earth Engine or Conditions Engine depending on context

This rule must be preserved throughout architecture and routing.

Reference:

* `docs/architecture/ENGINE_CATALOG.md`

---

## Object Rule

All user-facing entities must conform to the normalized object system.

This is not optional.

The canonical object structure is defined in:

* `docs/architecture/OBJECT_MODEL.md`

No other file may redefine the object contract.

If an implementation needs additional fields, they must extend the canonical object model rather than replace it.

---

## Data Contract Rule

All data passed between engines, hub, scene, and detail flows must follow the canonical contracts.

Canonical data contracts are defined in:

* `docs/architecture/DATA_CONTRACTS.md`

No UI component, route, or service may invent incompatible ad hoc data shapes for core object flow.

---

## Ingestion Rule

All provider data must follow the ingestion strategy.

Canonical ingestion rules are defined in:

* `docs/architecture/INGESTION_STRATEGY.md`

### Non-Negotiable Ingestion Constraints

The system must not:

* fabricate authoritative values when source data is missing
* silently replace missing values with fake “good enough” estimates in user-facing truth
* mix incompatible provider semantics without normalization
* expose placeholder truth as real truth

If data is degraded, that degraded state must be explicit.

---

## Scene Rule

Only one scene may be active at a time.

A scene may contain multiple visible objects, but only one active scene context governs rendering and interaction.

This means:

* the front-page hub is one scene type
* an engine page is another scene type
* sub-engine layers do not create independent scenes

The front page must never try to simultaneously behave as:

* a full immersive engine scene
* a raw data dashboard
* and a decision surface

If a scene attempts to do all three, it is architecturally wrong.

---

## Front-End / Back-End Split

### Browser Responsibilities

The browser owns:

* rendering
* interaction
* scene transitions
* object focus behavior
* view-layer filtering and selection behavior

### Backend Responsibilities

The backend owns:

* provider ingestion
* normalization
* caching
* candidate generation
* detail data assembly
* delivery of deterministic contracts

The backend must not become a UI layout engine.
The frontend must not become a truth-generation engine.

---

## Runtime Authority

FastAPI application runtime is the only active backend runtime authority.

The valid active runtime path is the FastAPI app path used by the current architecture.

Legacy or parallel runtime paths must not be treated as equal authorities.

The live session brief must state the exact currently valid startup/runtime path.

---

## Forbidden Drift Behaviors

The coding AI must not do any of the following unless the live session brief explicitly authorizes it:

* rewrite architecture while implementing a feature
* load phase docs as execution authority
* use the master plan as a build checklist
* introduce new engines during unrelated work
* redefine hub behavior ad hoc inside a UI component
* bypass the canonical object model
* bypass canonical data contracts
* replace missing truth with fabricated user-facing data
* preserve placeholder or dead-end UI in active product flows

---

## Stability Rule

When architecture and execution documents disagree:

* `CORE_CONTEXT.md` defines permanent system law
* `LIVE_SESSION_BRIEF.md` defines current active execution state
* architecture docs provide detail under those rules
* phase docs and historical docs do not override either one

---

## Final Rule

Astronomy Hub must always preserve this separation:

* Vision describes the dream
* Architecture defines the system
* Live session context defines what is active now
* Execution changes only what the live session allows
