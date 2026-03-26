# 🌌 ASTRONOMY HUB — PHASE 1 BUILD SEQUENCE (AUTHORITATIVE)

---

# 0. PURPOSE

This document defines:

> **The exact build order for rebuilding Phase 1 correctly**

It exists to prevent:

* implementation drift
* frontend-first shortcuts
* future-phase leakage
* incomplete object interaction

---

# 1. 🧠 CORE RULE

```text
Execute ONE step at a time.
Verify before continuing.
Do NOT mix Phase 2 functionality into Phase 1.
```

---

# 2. 📍 PHASE 1 SCOPE LOCK

Phase 1 includes only:

* Above Me scope
* satellite objects
* planet objects
* deep sky objects
* observing conditions
* events and light news that support observing now

Phase 1 explicitly excludes:

* flight tracking
* Flights scope
* Flight Engine behavior
* Phase 2 engine switching

Flights enter the product for the first time in `PHASE_2_SPEC.md`.

---

# 3. 🔢 BUILD SEQUENCE

---

# ✅ STEP 1 — Canonical Phase 1 Contracts

## Goal

Lock the backend-owned contracts for the Above Me scene and object detail flow.

## Actions

* define the canonical response shape for:

  * `/api/scene/above-me`
  * `/api/object/{id}`
* ensure every Phase 1 object has:

  * `id`
  * `name`
  * `type`
  * `engine`
  * `summary`
  * visibility data
  * approximate position
* ensure contracts use only Phase 1 object types

## Verify

* contracts align with `DATA_CONTRACTS.md`
* no flight objects appear in Phase 1 contracts
* no raw provider fields leak into the response shapes

---

# ✅ STEP 2 — Backend Endpoint Skeleton

## Goal

Expose the canonical Phase 1 routes in the authoritative backend runtime.

## Actions

* add `GET /api/scene/above-me`
* add `GET /api/object/{id}`
* keep handlers minimal if needed, but contract-correct
* do not migrate unrelated routes in this step

## Verify

* both endpoints respond successfully
* response shapes are stable
* no existing Phase 1 behavior breaks

---

# ✅ STEP 3 — Limited Engine Slice Normalization

## Goal

Produce normalized Phase 1 data from the engines that participate in Above Me.

## Actions

* implement Satellite Engine slice:

  * visible passes only
* implement Solar System Engine slice:

  * visible planets only
* implement Deep Sky Engine slice:

  * visible tonight only
* implement Earth Engine slice:

  * observing conditions only
* exclude Flight Engine entirely

## Verify

* each slice is independently testable
* each slice returns limited, normalized data
* no engine emits Phase 2 filters or extra scopes

---

# ✅ STEP 4 — Above Me Scene Assembly

## Goal

Assemble one unified Above Me scene from the Phase 1 engine slices.

## Actions

* merge engine outputs into one scene contract
* rank objects by relevance
* include only above-horizon objects
* keep object count intentionally limited
* derive briefing, events, and supporting panel data from the same backend-owned scene state

## Verify

* `/api/scene/above-me` answers “what is above me right now?”
* scene data is coherent and limited
* no flight markers or flight detail targets appear

---

# ✅ STEP 5 — Object Detail Records

## Goal

Provide real detail payloads for every Phase 1 object type.

## Actions

* support detail for:

  * satellites
  * planets
  * deep sky objects
* include:

  * plain-language explanation
  * why it matters now
  * visibility guidance
  * basic data
  * at least one image
  * related news if available

## Verify

* every object in the scene resolves through `/api/object/{id}`
* detail payloads are consistent with the owning engine
* detail responses preserve canonical identity

---

# ✅ STEP 6 — Frontend Command Center Shell

## Goal

Render the Phase 1 command center from canonical backend data.

## Actions

* build the Above Me command bar state
* render a dominant sky-based scene
* render the live briefing panel
* render supporting objects, events, and news panels
* keep frontend responsibility limited to rendering and interaction

## Verify

* the scene is visually dominant
* the hierarchy is clear on desktop and mobile
* no placeholder-only sections remain

---

# ✅ STEP 7 — Interaction And Detail Flow

## Goal

Make object interaction behave according to the system model.

## Actions

* click scene object or panel object
* route to the owning engine detail target
* open detail without losing scene state
* support easy return to the same scene context

## Verify

* objects are actually clickable
* detail opens from both scene and panel entries
* returning preserves the prior Above Me state

---

# ✅ STEP 8 — Validation And Hardening

## Goal

Prove that Phase 1 is complete before any Phase 2 work begins.

## Actions

* run the `VALIDATION_CHECKLIST.md` Phase 1 criteria
* run the `PHASE_1_ACCEPTANCE_CRITERIA.md` checks
* verify ORAS default and manual coordinate override
* verify degraded/failure handling does not collapse the UI
* verify performance and responsiveness

## Verify

* the user can answer:

  * Is tonight worth observing?
  * What should I look at?
  * When should I look?
  * Are there any important events or passes?
* all Phase 1 requirements pass without Phase 2 leakage

---

# 4. 🛑 STOP CONDITIONS

Stop immediately if:

* a step requires Phase 2 scope or engine switching
* flight tracking re-enters Phase 1
* a contract conflicts with `DATA_CONTRACTS.md`
* frontend starts compensating for backend-owned data problems
* a required verification step fails

---

# 5. 🔥 FINAL RULE

```text
Phase 1 must be rebuilt in this order.

Do not jump ahead to polish, expansion, or Phase 2 exploration.
Build the foundation first.
```