# LEGACY REFERENCE NOTICE

This document is retained for planning/history context only.
Active execution authority is feature-first under docs/features/*.

# 📄 ✅ **PHASE 2 — IMPLEMENTATION PLAN (REWRITE — ENGINE + UI + DATA ALIGNED)**

````markdown id="c3wrm2"
# 🌌 PHASE 2 — IMPLEMENTATION PLAN (AUTHORITATIVE — ENGINE + DATA ALIGNED)

---

# 1. PURPOSE

This document defines the implementation structure for:

**Phase 2 — Multi-Engine Decision System**

It translates the Phase 2 specification into a **controlled, enforceable build plan**.

This document:

- defines execution structure
- enforces architectural law
- prevents scope drift
- aligns all work with engine specifications

This document does NOT authorize:

- scope expansion
- UI redesign beyond defined spec
- Phase 3 features

---

# 2. IMPLEMENTATION GOAL

Phase 2 transforms the system into:

> **A multi-engine, provider-backed, decision-support system**

---

## REQUIRED CAPABILITIES

- multiple scopes
- multiple engines
- engine-specific filters
- engine-generated scenes
- cross-engine orchestration (Above Me)
- preserved object → detail flow

---

## SYSTEM MUST REMAIN

- backend-authoritative
- scene-driven
- deterministic
- provider-backed
- decision-support oriented

---

# 3. LOCKED ARCHITECTURAL RULE

The system MUST follow:

```text
User → Scope → Engine → Filter → Scene → Object → Detail
````

---

## ENFORCEMENT

* NO bypass paths
* NO UI-side computation
* NO engine-level UI behavior
* ALL objects originate from scene

---

# 4. PHASE 2 BUILD STRATEGY (CORRECTED)

Phase 2 MUST be implemented in this order:

```text id="c5gr3s"
1. UI STRUCTURE (layout only)
2. UI STANDARDIZATION
3. DETAIL PANEL SYSTEM
4. DATA INGESTION PIPELINE
5. CORE ENGINES (conditions → satellites → solar → deep sky → sun)
6. SUPPORTING ENGINES (events → flights)
7. ABOVE ME ORCHESTRATION
8. STATE + ROUTING SYSTEM
9. FILTER SYSTEM
10. SCENE GENERATION VALIDATION
11. FULL SYSTEM VALIDATION
```

---

## CRITICAL RULE

Frontend MUST NOT move ahead of backend authority.

---

# 5. WORKSTREAMS (RESTRUCTURED)

---

## 5.1 WORKSTREAM A — UI FOUNDATION (NEW FIRST WORKSTREAM)

### Objective

Build full command center layout before any data integration.

---

### Required Outcomes

* UI matches UI_SPEC.md
* layout is complete and stable
* modules exist for all engines
* detail panel container exists

---

### Must NOT Include

* API calls
* real data
* logic
* ranking
* filtering

---

## 5.2 WORKSTREAM B — UI STRUCTURE STANDARDIZATION

### Objective

Ensure all modules follow identical structure

---

### Required Outcomes

* consistent module template
* consistent item structure
* consistent grid system
* no per-engine UI variation

---

## 5.3 WORKSTREAM C — DETAIL PANEL SYSTEM

### Objective

Implement unified object interaction layer

---

### Required Outcomes

* right-side panel exists
* reusable across all engines
* hub remains visible
* no page navigation

---

## 5.4 WORKSTREAM D — DATA INGESTION PIPELINE

### Objective

Enforce provider-backed data system

---

### Required Pipeline

```text
Provider → Adapter → Normalizer → Validator → Cache → Engine
```

---

### Required Outcomes

* no raw provider data reaches engines
* normalized contracts enforced
* invalid data rejected
* caching implemented

---

## 5.5 WORKSTREAM E — ENGINE IMPLEMENTATION (SPEC-DRIVEN)

### Objective

Implement all engines according to their specification documents

---

### REQUIRED ENGINE ORDER

1. CONDITIONS_SPEC.md
2. SATELLITE_ENGINE_SPEC.md
3. SOLAR_SYSTEM_ENGINE_SPEC.md
4. DEEP_SKY_ENGINE_SPEC.md
5. SUN_ENGINE_SPEC.md

---

### SUPPORTING ENGINES

6. TRANSIENT_EVENTS_ENGINE_SPEC.md
7. FLIGHT_ENGINE_SPEC.md

---

### Required Outcomes

Each engine:

* follows spec exactly
* uses correct providers
* computes meaning
* produces structured scene-ready output
* includes reasoning
* does not expose raw data

---

## 5.6 WORKSTREAM F — ABOVE ME ORCHESTRATION

### Objective

Combine engine outputs into one decision scene

---

### Required Outcomes

* merges multiple engines
* applies visibility filtering
* applies cross-engine ranking
* produces single coherent scene

---

## 5.7 WORKSTREAM G — STATE + ROUTING SYSTEM

### Objective

Control system context deterministically

---

### Required Outcomes

* scope routing implemented
* engine routing implemented
* state fully tracked
* state deterministic and restorable

---

## 5.8 WORKSTREAM H — FILTER SYSTEM

### Objective

Enable controlled filtering per engine

---

### Required Outcomes

* filters defined per engine
* filter validation enforced
* filtering executed backend-side
* filters affect output deterministically

---

## 5.9 WORKSTREAM I — OBJECT SYSTEM INTEGRITY

### Objective

Ensure all objects are scene-driven and resolvable

---

### Required Outcomes

* all objects originate from scene
* stable IDs
* `/api/object/{id}` works for all objects
* no duplication of detail data

---

## 5.10 WORKSTREAM J — FRONTEND INTEGRATION

### Objective

Expose system without introducing UI logic

---

### Required Outcomes

* scope selector works
* engine selector works
* filter controls work
* scenes render consistently
* detail panel works

---

### Must NOT Happen

* frontend ranking
* frontend filtering
* custom UI per engine

---

## 5.11 WORKSTREAM K — VALIDATION + REVIEW

### Objective

Verify system correctness

---

### Required Outcomes

* full pipeline verified
* engine outputs match specs
* system deterministic
* outputs match real-world conditions
* no mock runtime data

---

# 6. BACKEND SHAPE (ENFORCED)

---

## REQUIRED RESPONSIBILITIES

* scope routing
* engine routing
* filter validation
* scene generation
* object resolution
* ranking
* reasoning

---

## RULE

Backend is the ONLY source of:

* meaning
* object inclusion
* prioritization
* grouping

---

# 7. FRONTEND SHAPE (ENFORCED)

---

## REQUIRED RESPONSIBILITIES

* render scene
* expose controls
* open detail panel
* maintain state

---

## RULE

Frontend:

* DOES NOT compute
* DOES NOT filter
* DOES NOT rank
* DOES NOT generate reasoning

---

# 8. SEQUENCE CONSTRAINTS

---

## Backend Before Frontend Logic

No UI-driven behavior allowed before backend authority exists

---

## UI Structure Before Data

Layout must be complete before engines are implemented

---

## Required Before Optional

Core engines must complete before supporting engines

---

## Contract Before Implementation

No engine logic without spec

---

# 9. ANTI-DRIFT RULES

The following are NOT allowed:

* UI redesign work
* animation work
* 3D rendering
* charts/maps
* prediction systems
* AI assistant logic
* personalization
* search systems

---

## RULE

If work does NOT strengthen:

```text
Scope → Engine → Filter → Scene → Object → Detail
```

It does NOT belong in Phase 2.

---

# 10. COMPLETION STANDARD

Phase 2 is COMPLETE ONLY IF:

* user can move through full pipeline
* all engines spec-compliant
* scenes are decision-support outputs
* object detail remains authoritative
* all data provider-backed
* system is deterministic
* no Phase 3 features present

---

# 11. EXECUTION HANDOFF REQUIREMENT

Execution MUST follow:

* PHASE_2_EXECUTION_TODO.md
* PHASE_2_BUILD_SEQUENCE.md
* PHASE_2_VALIDATION_CHECKLIST.md
* PHASE_2_ACCEPTANCE_CRITERIA.md

---

## FINAL RULE

```text
No batching.
No skipping.
No speculative work.
No undocumented changes.
```

```

---