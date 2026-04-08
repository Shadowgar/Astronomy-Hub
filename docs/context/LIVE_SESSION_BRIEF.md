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

Astronomy Hub is in a **controlled product reset**.

This means:

* backend and data capabilities may be preserved
* the product surface is being rebuilt
* architecture is stable and must not be redefined
* execution is constrained to a narrow scope

---

## Active Product Definition

The active product is:

```text
Above Me Hub + Sky Engine viewport
```

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

The front page must:

* act as a curated decision surface
* present limited, high-value outputs
* provide context through panels
* allow interaction with the viewport

---

### Engine Viewport Behavior

The viewport:

* renders the active engine
* supports interaction (click, focus, highlight)
* updates based on feed interaction
* does NOT expand into full engine mode by default
* mounts Sky Engine as an engine-owned runtime, not as hub-owned rendering logic

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

* building the Above Me Hub
* implementing Sky Engine rendering (Babylon.js)
* recovering Sky Engine as a self-contained Babylon.js runtime
* connecting hub → engine interaction
* enforcing architecture rules
* cleaning document authority

---

### Not Allowed

* expanding all engines simultaneously
* building full Earth Engine
* adding new domains
* phase progression work
* speculative architecture changes
* turning the Hub into a shared engine runtime

---

## Current Output Constraints

The Hub must remain:

* curated
* small
* intentional

---

### Hard Constraints

* no raw merged lists
* no placeholder UI
* no fake data
* no dead controls
* no uncontrolled object volume

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