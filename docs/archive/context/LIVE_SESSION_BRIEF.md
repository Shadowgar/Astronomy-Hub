# LIVE SESSION BRIEF

## Purpose

This document defines the current active execution state for Astronomy Hub.

It is always loaded with `CORE_CONTEXT.md`.

If this file and any older execution, phase, or tracker documents disagree, this file wins for current work.

---

## Current Execution Status

Astronomy Hub is in a controlled product reset.

This means:

* existing backend and data capabilities may be preserved
* existing product surface may be replaced
* architecture is not being reinvented during feature work
* phase advancement is frozen until the active product surface is usable

---

## Active Product Definition

The active front page is the **Above Me Hub**.

The Above Me Hub is a decision layer that shows the most relevant items above the selected user location and time.

It is not:

* a raw dashboard
* an immersive engine scene
* a full Earth globe
* a mixed control center with dead controls

If the front page behaves like those things, it is wrong.

---

## Current UI Model

### Front Page

The front page must act as a curated hub.

It may use themed panels or grouped sections, but all visible content must still represent filtered, ranked, current-value output tied to the selected location/time.

### Engine Pages

Immersive center-screen interactive experiences belong inside engines, not on the front page.

That means:

* Earth globe interactions belong in Earth Engine
* satellite and flight layer views belong inside Earth Engine
* solar system exploration belongs in Solar System Engine
* deep sky exploration belongs in Deep Sky Engine

---

## Active Architectural Boundaries

The following architectural rules are active and must be obeyed now:

* Hub = decision layer
* Engines = exploration layers
* Earth = primary engine
* Satellite = Earth sub-engine
* Flight = Earth sub-engine
* Conditions = primary engine and Earth sub-engine
* canonical object model must be used
* canonical data contracts must be used

---

## Active Runtime Authority

The current active backend runtime must be the single FastAPI application path used by the modern app architecture.

No parallel or legacy backend runtime is allowed to act as equal authority during current execution.

If legacy runtime files still exist in the repo, they are not active execution targets unless explicitly stated here.

---

## Active Scope of Work

The current effort is to establish a usable product surface and a stable document authority model.

That means current work may include:

* replacing or simplifying the active UI shell
* consolidating architecture and context docs
* cleaning authority drift
* making the front-page Above Me experience actually usable
* ensuring routed engine entry behavior is coherent

Current work must not include:

* broad feature expansion across all engines
* adding new major domains
* phase progression work
* speculative engine build-out
* parallel architecture rewrites

---

## Current Output Constraints

The front-page hub must be curated.

### Required Constraints

* no raw merged lists from all engines
* no placeholder content in active UI
* no fake action buttons in active UI
* no fabricated “live” truth shown as authoritative
* no uncontrolled object flood

The exact visible output cap for the active hub should be kept small and intentional. If the current implementation exceeds a small curated set, it must be treated as a defect.

---

## Current Authority Documents

For current work, the active authority set is:

1. `docs/context/CORE_CONTEXT.md`
2. `docs/context/LIVE_SESSION_BRIEF.md`
3. `docs/architecture/ARCHITECTURE_OVERVIEW.md`
4. `docs/architecture/ENGINE_SPEC.md`
5. `docs/architecture/ENGINE_CATALOG.md`
6. `docs/architecture/OBJECT_MODEL.md`
7. `docs/architecture/DATA_CONTRACTS.md`
8. `docs/architecture/INGESTION_STRATEGY.md`

### Vision-Only Reference

* `docs/product/ASTRONOMY_HUB_MASTER_PLAN.md`

### Not Current Execution Authority

Unless explicitly reactivated, the following are reference-only:

* phase docs
* historical handoff docs
* stale feature trackers
* outdated changelog framing
* old diagram assumptions that conflict with current architecture authority

---

## Current Failure Conditions

Current work is considered unsuccessful if any of the following occur:

* the front page becomes a raw data dump
* hub and engine responsibilities are mixed together
* Earth, Satellite, and Flight are modeled as unrelated peers
* the coding AI invents new data contracts
* stale docs override active docs
* placeholder UI remains in the active product path
* execution expands to unrelated engines before the active surface is coherent

---

## Current Review Standard

When reviewing any change, ask these questions in order:

1. Does it obey `CORE_CONTEXT.md`?
2. Does it obey the architecture docs?
3. Does it improve the current active product surface?
4. Does it avoid introducing new authority drift?
5. Does it avoid broadening scope?

If the answer to any of the first three is no, the change is not acceptable.

---

## Immediate Working Direction

The system is currently being stabilized by:

* reducing document authority ambiguity
* consolidating architecture rules
* preserving the full long-term vision while narrowing current execution
* separating hub behavior from engine behavior

This direction remains active until explicitly changed here.
