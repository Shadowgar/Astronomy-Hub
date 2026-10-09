# `MASTER_PLAN.md`


---

# MASTER PLAN — PRODUCT REFERENCE (NON-EXECUTION)

---

## PURPOSE

This document defines the complete product scope of Astronomy Hub.

It answers:

* what the system must eventually include
* what domains exist
* what capabilities are expected

This document does NOT:

* define execution order
* define current work
* authorize implementation

Execution is controlled by:

```text
PROJECT_STATE.md
LIVE_SESSION_BRIEF.md
```

---

## PRODUCT MODEL

Astronomy Hub is a:

```text
unified, continuously navigable astronomy, Earth, and planetary exploration workspace
```

Core interaction model:

```text
Hub → Engine → Scene → Object → Detail → Exploration
```

---

## PRIMARY USER GOAL

```text
What is above me right now, and what should I observe?
```

---

## Current Foundation and Approved Direction — non-execution summary

C0–C5.6 completed bounded foundations: owned Earth/selective pinned modules,
serial Sky/Earth bridge, unified workspace, quakes/perimeters/latest CONUS radar,
bounded CONUS HD, local development and Sky wheel/search/Gaia/controls stabilization.
PR63/64/65 are merged. Full Earth feature parity/global weather/real terrain/
planetary/ISS/production readiness are not complete; [audit](../audits/GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md)
and [Feature Tracker](../features/FEATURE_TRACKER.md) retain actual limits.
This product reference does not define order or authorize implementation.

Execution sequence and gates: [PROJECT_STATE](PROJECT_STATE.md) and
[LIVE_SESSION_BRIEF](../context/LIVE_SESSION_BRIEF.md). Earth planning:
[Earth plan](EARTH_CAPABILITY_PLAN.md), [proposed C5.7](C5_7_EARTH_CORE_RECOVERY_SPEC.md),
[C6 direction](C6_GLOBAL_MAPPING_SPEC.md). C5.6.75 is current documentation review;
C5.7 needs approval, C6 provider-specific work unapproved, D/E/F/G/H planned.
Keep complete applicable future Earth scope through preferential feature reuse/
wrapping in owned Viewer, not complete upstream app ownership. Development remains
local WSL/Docker; production requires owner-declared Release Candidate and separate
deployment approval.

## FEATURE DOMAINS (REFERENCE ONLY)

These define full system scope.
They do NOT define build order.

---

### 1. Product Shell and Astronomy Decision Layer (Hub)

* Above Me decision surface
* curated outputs
* contextual drawers and progressive disclosure in the implemented renderer-centered workspace
* global navigation and future universal product state

---

### 2. Sky Engine (Primary)

* stars
* constellations
* visible planets
* deep sky objects
* contained Stellarium Web / Stellarium Web Engine runtime at `/oras-sky-engine/`

---

### 3. Scene Rendering

* engine-owned rendering; the active Sky Engine uses contained Stellarium Web Engine
* interactive viewport
* object selection and focus
* thin host ↔ engine mount interfaces

---

### 4. Above Me Orchestration

* multi-engine aggregation
* ranking and filtering
* visibility logic
* public discovery through `/api/above-me`
* stable links into `/oras-sky-engine/`

---

### 5. Conditions Intelligence

* cloud cover
* seeing
* transparency
* visibility scoring

---

### 6. Satellite Intelligence

* satellite tracking
* visible passes
* orbital behavior

---

### 7. Flight Awareness

* aircraft identification
* overhead awareness

---

### 8. Earth, Planet and Solar-System Context

* complete applicable upstream God's Eye Earth capabilities; provider terms qualified separately
* body-aware Cesium planetary surfaces with qualified body data, first proof Mars
* solar-system scale navigation; renderer undecided pending compatibility study
* explicit and scale-driven renderer handoffs preserving product context
* external additive Earth astronomy layers, with upgradeable immutable-default upstream source

---

### 9. Deep Sky Targeting

* galaxies
* nebulae
* clusters
* observation difficulty

---

### 10. Solar Activity

* sunspots
* flares
* solar events

---

### 11. Events & Alerts

* meteor events
* transient phenomena
* notable sky events

---

### 12. Object Detail System

* object-specific data
* relationships
* cross-engine navigation

---

### 13. News & Knowledge

* scientific updates
* mission data
* contextual enrichment

---

### 14. Asset & Data Reliability

* ingestion integrity
* normalization
* deterministic outputs

---

### 15. Performance & Stability

* scene-based rendering
* minimal computation
* responsive interaction

---

## COMPLETION RULE

A feature is complete only if:

* it works in runtime
* behavior is correct
* results are meaningful
* output supports user decisions
* validation is proven

---

## NON-GOALS

This document does NOT:

* define current work
* define priority
* authorize scope expansion
* override execution constraints

---

## FINAL PRINCIPLE

```text
The Master Plan defines intended product scope, not what is already implemented.
Execution decides what is built.
```
