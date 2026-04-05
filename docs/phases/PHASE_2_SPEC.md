# PHASE 2 — MULTI-ENGINE SYSTEM

## Status

Legacy reference. Not execution authority.

This document defines the full doctrinal, architectural, and behavioral system introduced in Phase 2.

It preserves system law, data flow, and domain structure.
It does not define execution sequencing.

---

# 0. PURPOSE

Phase 2 transforms Astronomy Hub from:

* a single mixed-domain scene

into:

* a structured, deterministic, multi-engine system

The goal is to establish:

* domain ownership
* deterministic scene generation
* backend-controlled truth
* controlled user-driven exploration

---

# 1. CORE SYSTEM LAW

The system must follow:

```text
Scope → Engine → Filter → Scene → Object → Detail
```

This is the canonical operating structure.

No valid system behavior may bypass this chain.

---

# 2. SYSTEM OBJECTIVE

The system must allow a user to:

* select a scope
* enter a domain-specific engine
* apply valid filters
* generate a deterministic scene
* select an object
* resolve object detail without breaking context

The user controls context.
The system controls meaning.

---

# 3. SCOPE MODEL

## 3.1 Scope Definition

A scope defines the active domain context.

It determines:

* which engines are valid
* which filters are valid
* what kind of scene is allowed

---

## 3.2 Expected Scope Set

Examples include:

* Above Me
* Earth
* Solar System
* Deep Sky
* Sun
* Events
* News / Knowledge

---

## 3.3 Scope Rules

* changing scope must reset invalid engine/filter combinations
* changing scope must trigger scene regeneration
* scope must materially affect system output

---

## 3.4 Scope Failure Patterns

Invalid behavior includes:

* scope does not change output
* stale scene persists across scope change
* scope acts as label only

---

# 4. ENGINE MODEL

## 4.1 Engine Definition

An engine is a domain authority responsible for:

* consuming normalized data
* producing candidate objects
* defining domain behavior
* supporting object detail

---

## 4.2 Engine Doctrine

Engines must:

* own a clearly defined domain
* not expose raw provider data
* not perform UI logic
* not fabricate truth

---

## 4.3 Engine Output Requirements

Engines must return:

* normalized
* structured
* scene-compatible data

---

## 4.4 Engine Hierarchy (Corrected Model)

Phase 2 originally assumed peer engines.

Refined model:

### Primary Engines

* Earth
* Solar System
* Deep Sky
* Sun

### Sub-Engines (example: Earth)

* Satellite
* Flight
* Conditions

These must operate cohesively when under the same parent engine.

---

## 4.5 Engine Failure Patterns

Invalid behavior includes:

* raw provider payload exposure
* overlapping ownership between engines
* inconsistent output formats
* engine-dependent UI logic

---

# 5. FILTER MODEL

## 5.1 Filter Definition

Filters refine engine output.

They must:

* affect inclusion
* affect ranking inputs
* be deterministic

---

## 5.2 Filter Types

### Domain Filters

* object type
* domain subset
* classification

### Context Filters

* visibility
* brightness
* time window
* relevance

---

## 5.3 Filter Rules

* filters must execute in backend
* invalid filters must be rejected or reset
* filters must be compatible with scope and engine

---

## 5.4 Filter Failure Patterns

Invalid behavior includes:

* filters only change UI appearance
* filters do not change inclusion
* frontend performs filtering
* conflicting filters without rules

---

# 6. SCENE MODEL

## 6.1 Scene Definition

A scene is a deterministic output of:

* scope
* engine
* filter
* location
* time

---

## 6.2 Scene Doctrine

A scene must:

* be deterministic
* be backend-generated
* be coherent
* be decision-support oriented

---

## 6.3 Above Me Exception

Above Me is not a single-engine scene.

It:

* consumes multiple engine outputs
* applies cross-domain relevance logic
* produces a curated result

---

## 6.4 Scene Rules

* scenes must not dump full datasets
* scenes must not require frontend interpretation
* scenes must reflect real-world context

---

## 6.5 Scene Failure Patterns

Invalid behavior includes:

* same inputs produce different outputs
* raw lists instead of curated scenes
* frontend assembling scenes
* scene lacks meaning

---

# 7. OBJECT MODEL (PHASE 2)

## 7.1 Object Requirements

Each object must include or resolve:

* stable id
* canonical name
* type
* owning engine
* reason for inclusion
* time relevance
* position/context
* detail route

---

## 7.2 Object Doctrine

Objects must:

* originate from scene
* be resolvable to detail
* maintain identity across contexts

---

## 7.3 Object Failure Patterns

Invalid behavior includes:

* duplicate identities
* object created in UI
* detail mismatch
* object without context

---

# 8. OBJECT DETAIL MODEL

## 8.1 Detail Flow

```text
Scene → Object → Detail → Return
```

---

## 8.2 Detail Requirements

Detail must:

* be backend-resolved
* preserve context
* update based on object selection
* not reset system unnecessarily

---

## 8.3 Detail Failure Patterns

Invalid behavior includes:

* generic filler content
* context loss
* inconsistent data
* duplicated scene data

---

# 9. DATA LAW

## 9.1 Backend Owns

* ingestion
* normalization
* validation
* caching
* transformation
* ranking inputs
* inclusion logic

---

## 9.2 Frontend Owns

* rendering
* interaction
* navigation

---

## 9.3 Frontend Must Not

* interpret raw data
* create ranking logic
* filter authoritative data
* fabricate meaning

---

# 10. INGESTION PIPELINE

## 10.1 Required Flow

```text
Provider → Adapter → Normalizer → Validator → Cache → Engine → Scene
```

---

## 10.2 Pipeline Rules

* raw data must not reach engines
* normalization is required
* validation is required
* degraded states must be explicit

---

## 10.3 Failure Patterns

Invalid behavior includes:

* raw provider data leakage
* missing normalization
* hidden degraded states
* fake data presented as real

---

# 11. LOCATION & TIME AUTHORITY

## 11.1 Required Inputs

* latitude
* longitude
* elevation (optional but supported)
* time

---

## 11.2 Rule

Location and time must materially affect output.

---

## 11.3 Failure Patterns

Invalid behavior includes:

* static output
* non-responsive scenes
* unexplained differences

---

# 12. RANKING & RELEVANCE LAW

## 12.1 Principle

Not everything visible is worth showing.

---

## 12.2 Ranking Inputs

* visibility
* altitude
* brightness
* time sensitivity
* observing conditions
* domain importance

---

## 12.3 Above Me Requirement

Above Me must compress multiple domains into a usable set.

This prevents:

* satellite flooding
* meaningless object lists

---

# 13. PERFORMANCE MODEL

## 13.1 Rules

* compute only active scene
* avoid full dataset loading
* lazy-load detail
* minimize unnecessary computation

---

## 13.2 Failure Patterns

Invalid behavior includes:

* slow response due to over-computation
* rendering full datasets
* unnecessary preloading

---

# 14. UI MODEL

## 14.1 UI Responsibilities

* context selection (scope/engine/filter)
* scene rendering
* object selection
* detail viewing

---

## 14.2 UI Doctrine

UI controls context.
Backend controls meaning.

---

## 14.3 Failure Patterns

Invalid behavior includes:

* UI not affecting output
* UI acting as dashboard of raw data
* UI generating meaning

---

# 15. ANTI-SCOPE

Phase 2 must not include:

* prediction systems
* personalization systems
* relationship graphs
* spatial-first systems
* AI-driven opaque logic

---

# 16. SYSTEM INTENT

Phase 2 defines:

* domain authority
* deterministic output
* real data ingestion
* controlled exploration

---

# 17. COMPLETION MEANING

Phase 2 is conceptually successful when:

* scenes are deterministic
* engines are isolated
* data is real and validated
* objects are trustworthy
* detail is meaningful
* system does not behave like a raw data dump

---

# 18. FINAL PRINCIPLE

Phase 2 enforces:

> user-controlled context, system-controlled meaning
