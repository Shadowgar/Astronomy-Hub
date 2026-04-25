# `LIVE_SESSION_BRIEF.md`


---

# LIVE SESSION BRIEF

---

## Purpose

This document defines the **current active execution state** for Astronomy Hub.

It is always loaded with:

```text
CORE_CONTEXT.md
```

If this file conflicts with any other execution, phase, or tracker document:

```text
LIVE_SESSION_BRIEF.md wins for current work
```

---

## Current Execution Status

Astronomy Hub is in a **Sky Engine Stellarium Port Priority** cycle.

This means:

* `/sky-engine` parity work is the active lane
* backend and data capabilities may be preserved
* architecture is stable and must not be redefined
* execution is constrained to a narrow scope
* Hub surface integration on `/` is deferred until parity completion

---

## Active Product Definition

The active execution surface is:

```text
Sky Engine runtime at /sky-engine (port-first)
```

The front-page Hub route (`/`) remains outside the active implementation scope during this cycle.

---

### The Above Me Hub

The Hub is a **decision layer**.

It shows:

* the most relevant objects
* from the selected location and time
* in a curated, ranked format

---

### The Viewport (CRITICAL)

The interface includes a central viewport:

```text
Center Viewport = Active Engine Scene
```

---

### Important Clarification

The front page is:

* NOT a full immersive engine page
* NOT a raw dashboard
* NOT a data dump

But it DOES:

* contain a controlled engine viewport
* allow object interaction
* reflect the active engine context

---

## Current UI Model

---

### Front Page (Hub Mode)

For the current cycle:

* `/` is documentation/contract-only
* no active implementation work is scheduled on Hub panels or Hub viewport composition
* existing `/` behavior is not the parity target

---

### Engine Viewport Behavior

The active viewport target is `/sky-engine`:

* renders the Sky Engine runtime directly
* supports interaction (click, focus, highlight)
* preserves Stellarium-equivalent behavior for math, thresholds, and lifecycle
* remains engine-owned runtime logic (no host-owned rendering logic)

---

### Engine Pages (Expanded Mode)

Full immersive experiences belong in engine pages.

Examples:

* Earth Engine → globe interaction
* Solar System Engine → planetary exploration
* Deep Sky Engine → catalog exploration

---

## Active Architectural Boundaries

The following rules are active:

---

### Hub

* decision layer only
* no raw rendering ownership
* no object flood

---

### Engines

* own domain logic
* own scene behavior
* control rendering

---

### Rendering

```text
Viewport = Active Engine Scene
```

---

### Engine Relationships

```text
Earth (primary)
 ├─ Satellite
 ├─ Flight
 └─ Conditions

Sky = default entry engine
```

---

### Data Rules

* canonical object model required
* canonical contracts required
* no fabricated data

---

## Active Runtime Authority

The system uses:

```text
FastAPI (single runtime)
```

No parallel backend authority allowed.

---

## Active Scope of Work

Current work is LIMITED to:

---

### Allowed

* porting Stellarium behavior into Sky Engine (`/sky-engine`)
* implementing and validating Sky Engine rendering/runtime behavior (Babylon.js)
* replacing non-parity local heuristics with Stellarium-equivalent logic
* expanding parity coverage across high-use source modules and interaction shell
* enforcing architecture rules and Sky Engine isolation
* cleaning document authority

---

### Not Allowed

* implementation work on `/` Hub panels or home-route viewport integration during this cycle
* expanding all engines simultaneously
* building full Earth Engine
* adding new domains
* phase progression work
* speculative architecture changes
* turning the Hub into a shared engine runtime

---

## Current Output Constraints

Current output must remain:

* parity-driven
* source-traceable to Stellarium
* validated by runtime and parity evidence

---

### Hard Constraints

* no fake data
* no dead controls
* no heuristic drift from Stellarium behavior in `/sky-engine`
* no hub-coupled rendering logic inside Sky Engine

---

## Current Authority Documents

Active authority set:

1. CORE_CONTEXT.md
2. LIVE_SESSION_BRIEF.md
3. ARCHITECTURE_OVERVIEW.md
4. ENGINE_SPEC.md
5. ENGINE_CATALOG.md
6. OBJECT_MODEL.md
7. DATA_CONTRACTS.md
8. INGESTION_STRATEGY.md

---

### Vision Reference (NON-EXECUTION)

* /docs/product/PRODUCT_VISION.md

---

## Porting Reprioritization (Active)

Execution order for this cycle:

1. Port and validate `/sky-engine` runtime parity end-to-end.
2. Fix object ownership and routing contracts within Sky Engine boundaries.
3. Port high-use Stellarium interaction shell modules relevant to `/sky-engine` behavior.
4. Continue source-module parity until the Sky Engine is complete.

Deferred until after parity:

* Hub panel and viewport integration work on `/`

---

## Current Failure Conditions

Work is invalid if:

* hub becomes a data dump
* hub renders full engine scenes uncontrolled
* engine and hub responsibilities mix
* viewport behavior is inconsistent
* new data contracts are invented
* placeholder UI exists
* scope expands beyond Sky Engine + Hub

---

## Current Review Standard

Evaluate all work using:

1. Does it follow CORE_CONTEXT?
2. Does it follow architecture docs?
3. Does it improve the active product surface?
4. Does it avoid scope expansion?
5. Does it avoid authority drift?

---

## Immediate Working Direction

The system is being stabilized by:

* locking architecture rules
* building Sky Engine as the rendering core
* establishing Hub + Viewport interaction
* preventing scope expansion
* eliminating document conflicts

---

## Final Rule

```text
Build the smallest correct system first:
Sky Engine + Above Me Hub + Controlled Viewport.
```
---