# `README.md`

---

# Astronomy Hub

---

## What This Is

Astronomy Hub is a:

```text id="v9k3xp"
location-aware observatory command center
```

It answers one core question:

```text id="m4p8yz"
What can I see right now, and what should I observe?
```

---

## What This Is NOT

This is NOT:

* a generic dashboard
* a data dump
* a static astronomy viewer
* a collection of unrelated panels

---

## Core System Model

```text id="q2h7vn"
Hub → Engine → Scene → Object → Detail → Exploration
```

---

## Core Rendering Rule

```text id="r8x4mb"
The center viewport is always the Active Engine Scene.
```

---

## System Structure

---

### Hub (Decision Layer)

The hub:

* selects what matters
* aggregates context
* routes user interaction

The hub does NOT:

* render scenes
* own objects
* override engines

---

### Engines (Reality Layer)

Engines:

* own domain logic
* own objects
* render scenes
* control interaction
* may own isolated Babylon.js runtimes when primary

Examples:

* Sky Engine
* Earth Engine
* Solar System Engine
* Satellite Engine
* Conditions Engine

---

### Viewport (Primary Surface)

The viewport:

* renders the active engine
* supports interaction
* reflects current context

---

## Current Product Anchor

```text id="c5t9kw"
Hub shell remains active on '/'; '/sky-engine' is a clean placeholder pending a new mount from '/study'
```

Current build order:

1. Mount a working runtime from `/study`
2. Restore `/sky-engine` through the new placeholder boundary
3. Reconnect feed → engine interaction after the new runtime is real
4. Resume object exploration flow on top of the new runtime
5. Additional engines

---

## Execution Model

Astronomy Hub uses:

```text id="p7z4nv"
feature-first + runtime-proof execution
```

---

### Every change must:

* map to a feature
* produce runtime behavior
* include proof
* update tracker/state

---

## Validation Rule

```text id="y3n8zt"
If it cannot be proven in runtime, it is not complete.
```

---

## Architecture Laws

```text id="u6r2kj"
Scope → Engine → Filter → Scene → Object → Detail
```

```text id="k4d9xp"
Ingestion → Normalization → Storage → Cache → API → Client Rendering
```

---

## Document System

Docs are structured by authority:

* CORE CONTROL → execution truth
* PRODUCT DEFINITION → system behavior
* ENGINE AUTHORITY → architecture
* EXECUTION MODEL → workflow
* SUPPORT → guidance
* LEGACY → historical only

---

### Start Here

If working on the system:

1. `docs/DOCUMENT_INDEX.md`
2. `docs/context/CORE_CONTEXT.md`
3. `docs/context/LIVE_SESSION_BRIEF.md`
4. `docs/execution/PROJECT_STATE.md`

---

## Operator Workflow

```text id="w1k7rc"
load context
→ confirm authority
→ inspect runtime truth
→ implement smallest slice
→ verify with proof
→ update tracker/state
```

---

## Final Principle

```text id="d9m2qv"
The hub decides what matters.
The engine shows reality.
The user explores without limits.
```

---