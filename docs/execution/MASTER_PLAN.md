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

## Current Foundation and Approved Direction

CURRENT foundation: unified Sky-first workspace, Sky/Earth modes, reusable
Tonight/Observe contexts, focused routes and contained SWE;
existing satellite identity/TLE/freshness/local propagation remain intact.
IMPLEMENTED Phase C: Hub-owned independent Cesium Earth with selective externally
pinned God's Eye feature modules, small Hub intent and serial bridge/lifecycle.
The prior complete-app topology is superseded by explicit owner instruction.
Retain useful Earth capabilities through the pinned capability ledger.

Sequence: C0 reproducible SWE; C1 ORAS Cesium core; C2 selective adapters;
C3 core parity; C4 unified bridge/lifecycle; C5 broader feature expansion;
D ISS handoff; E Mars; F astronomy extensions; G immersive UX; H solar-system scale.
ORA-7 implements the locked unified workspace and Earth visual foundation.
It stops after qualification and one PR review cycle; owner approval remains required.
Later phases remain planned and require explicit authorization.

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
