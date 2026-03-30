# 🌌 ASTRONOMY HUB — MASTER PLAN (AUTHORITATIVE)

---

# 0. PURPOSE

This document defines:

> **What is being built right now, and how the system progresses phase by phase**

This is the **execution control document**.

---

# 1. 🧠 RELATION TO MASTER VISION

---

## Rule

```text
ASTRONOMY_HUB_MASTER_PLAN.md defines the full vision

THIS document defines what is allowed to be built now
```

---

## Constraint

```text
No feature may be built unless it exists in the current phase scope
```

---

# 2. 🎯 SYSTEM OBJECTIVE (CURRENT)

The system is being built toward:

> A multi-engine astronomy command center

But development proceeds in **controlled phases**, not full-system implementation.

---

# 3. 🧱 PHASE MODEL (LOCKED)

---

## Phase 1 — Command Center (Above Me)

Focus:

* what is above the user right now

Includes:

* satellites
* planets
* deep sky (visible)
* basic conditions

Outcome:

* user can identify and understand the sky

---

## Phase 2 — Engine Exploration

Focus:

* individual systems

Includes:

* Earth engine
* Solar engine
* Satellite engine
* Flight engine (first introduced here)
* Solar system (basic)
* Deep sky (basic)

Outcome:

* user can explore each domain independently

---

## Backend Stabilization (Phase 2)

Focus:

* system integrity

Includes:

* FastAPI runtime
* contract enforcement
* normalization
* caching

Outcome:

* backend becomes authoritative

---

## Phase 3 — Visual System

Focus:

* spatial understanding

Includes:

* 2D maps
* 3D globes
* sky view
* solar system visualization

Outcome:

* user explores visually

---

## Phase 4 — Knowledge System

Focus:

* connections

Includes:

* object relationships
* cross-engine linking
* discovery system

Outcome:

* system becomes intelligent

---

## Phase 5 — Prediction System

Focus:

* future awareness

Includes:

* timeline
* forecasts
* alerts
* personalization

Outcome:

* system becomes proactive

---

# 4. ⚙️ BUILD ORDER RULES

---

## Rule 1 — No Phase Skipping

```text
You must fully complete a phase before expanding into the next
```

---

## Rule 2 — No Future Leakage

```text
Future-phase features must not appear in current phase implementation
```

---

## Rule 3 — Minimal Valid System

Each phase must produce:

* a usable system
* not a placeholder
* not a mock-only UI

---

## Rule 4 — Architecture First

```text
All implementation must follow:
- ARCHITECTURE_OVERVIEW.md
- DATA_CONTRACTS.md
```

---

# 5. 🧠 SYSTEM CONSTRAINTS

---

## Must Always Be True

* one active scene
* one active filter
* scoped computation only
* backend normalized data
* frontend renders only

---

## Must Never Happen

* full-system computation
* raw API exposure
* mixed engine logic
* UI without context

---

# 6. 🎛️ UI ALIGNMENT RULE

---

## Rule

```text
UI must reflect:
Scope → Engine → Filter → Scene → Object → Detail
```

---

## Constraint

UI must not:

* behave like a dashboard
* behave like a data table
* lose hierarchy

---

# 7. 📊 COMPLETION RULE

---

A phase is complete ONLY IF:

* it works end-to-end
* user can use it without explanation
* data is consistent
* UI is stable
* no placeholder behavior

---

# 8. 🚫 FAILURE CONDITIONS

---

Development is considered off-track if:

* features from future phases appear early
* UI becomes cluttered
* backend becomes inconsistent
* system behaves like a demo

---

# 9. 🔥 FINAL STATEMENT

```text
This document controls execution.

ASTRONOMY_HUB_MASTER_PLAN defines the dream.

This document defines reality.
```

---

## Where you are now

You now have:

* **Vision (locked)**
* **Architecture (locked)**
* **Phases (locked)**
* **Execution control (this doc)**

---

## Next move (don’t skip this)

Now we fix the **repo truth layer**:

👉 Next doc:
**`PROJECT_STATE.md`**

This is what prevents:

* confusion
* drift
* “what phase are we in?” problems

---
