# `FEATURE_CATALOG.md`

---

# FEATURE CATALOG

---

## PURPOSE

Defines the bounded feature set for Astronomy Hub.

This document defines:

* valid feature domains
* feature boundaries
* feature naming stability

This document does NOT:

* define execution order
* define current active work
* override execution authority

Execution is controlled by:

```text id="2kz3af"
PROJECT_STATE.md
LIVE_SESSION_BRIEF.md
```

---

## CORE PRINCIPLE

```text id="9q2k8v"
A feature represents a user-visible capability, not a system component.
```

---

## Current Foundation and Approved Future Scope

CURRENT: PR #52 shared shell/Home, Observe, Tonight, contained SWE and existing
satellite identity/TLE/freshness/local propagation support.
PLANNED: full-viewport workspace with contextual controls, complete applicable
God's Eye Earth, body-aware Cesium planetary surfaces, universal state, controlled
renderer handoffs, and external additive Earth astronomy layers.
DECIDED / PLANNED BY PHASE B: external pinned upstream source, independent full-app
build/external wrapper, same-origin disposable frames, versioned Hub bridge and
one active heavy renderer after settled switches.
OPEN: exact state/extension API, transition choreography, runtime/provider
qualification and solar-system-scale renderer. Legacy domain code does not prove
the planned runtimes are integrated.

[Unified Universe Architecture](../architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md)
is the detailed approved reference; `PROJECT_STATE.md` controls order. The lists
below enumerate capability scope, not implementation status. The current task
is documentation only; `oras_horizon.v1` belongs to later astronomy extensions.

## FEATURE LIST (AUTHORITATIVE)

---

### 1. Product Shell / Hub Surface

* Above Me decision surface
* global navigation and future universal state
* renderer-centered workspace with contextual drawers; Observe/Tonight stay independent routes

---

### 2. Scope / Engine / Filter Control

* user control over scope
* engine selection
* filtering behavior

---

### 3. Scene Rendering (Viewport System)

* engine-owned rendering; Stellarium Web Engine for the active Sky Engine
* active engine viewport
* object interaction
* scene transitions

---

### 4. Above Me Orchestration

* multi-engine aggregation
* visibility filtering
* ranking logic
* decision output

---

### 5. Conditions Decision Support

* cloud cover
* seeing
* transparency
* visibility scoring

---

### 6. Earth Exploration (PLANNED)

* complete applicable God's Eye Earth feature set; retain non-astronomy capabilities
* external additive astronomy layers, including eclipse, fireball, aurora, smoke,
  light pollution, observatories and ORAS context
* provider/asset terms and qualification separate from source-code licensing
* pinned upgradeable upstream with compatibility boundary; integration not started

---

### 7. Satellite Awareness

* satellite tracking
* visible passes
* orbital context

---

### 8. Flight Awareness

* aircraft identification
* overhead tracking

---

### 9. Planetary and Solar-System Exploration (PLANNED)

* body-aware Cesium planetary surface direction with qualified data; Mars first
* cross-body navigation and controlled explicit/scale-driven handoffs
* solar-system-scale renderer remains OPEN, not a new renderer decision

---

### 10. Deep Sky Targeting

* galaxies
* nebulae
* clusters
* observation difficulty

---

### 11. Solar Activity Awareness

* sunspots
* flares
* solar events

---

### 12. Alerts / Events Intelligence

* meteor events
* transient events
* notable sky activity

---

### 13. Object Detail Resolution

* object-specific data
* relationships
* cross-engine navigation

---

### 14. News / Knowledge Feed

* scientific updates
* mission data
* contextual enrichment

---

### 15. Asset / Media Reliability

* images
* media
* data integrity

---

### 16. Performance and Cache Freshness

* caching behavior
* data freshness
* responsiveness

---

## FEATURE RULES

---

### Rule 1 — Feature Must Be User-Visible

A feature must represent:

* something the user sees
* something the user interacts with
* something the user relies on

---

### Rule 2 — Feature Is Not Architecture

A feature is NOT:

* an engine
* a contract
* a rendering library
* a backend service

---

### Rule 3 — Feature Must Be Bounded

A feature must:

* have clear boundaries
* be testable independently
* not span the entire system

---

### Rule 4 — Feature Must Map to Reality

A feature must be describable in:

* behavior
* interaction
* output

---

### Rule 5 — No Feature Drift

Do NOT:

* invent features casually
* split features unnecessarily
* merge unrelated domains

---

## FEATURE vs ENGINE RELATIONSHIP

---

### Engines

Define:

* domain logic
* object ownership
* rendering context

---

### Features

Define:

* user experience
* behavior across engines
* interaction patterns

---

### Example

* Sky Engine → renders stars
* Above Me Orchestration → selects which stars matter

---

## FEATURE vs VIEWPORT

Features must respect:

```text id="6xq8nz"
Viewport = Active Engine Scene
```

Meaning:

* features cannot override rendering ownership
* features must integrate with engine behavior

---

## LEGACY PHASE RELATIONSHIP

Legacy phase documents are:

* reference only
* not authoritative

Mapping:

```text id="5o1b3k"
docs/features/FEATURE_MIGRATION_MAP.md
```

---

## FINAL RULE

```text id="8t2p9m"
If a feature cannot be experienced, it is not a feature.
```
