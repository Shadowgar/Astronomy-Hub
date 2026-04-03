# LEGACY REFERENCE NOTICE

This document is retained for planning/history context only.
Active execution authority is feature-first under docs/features/*.

# 📄 ✅ **PHASE 2 — EXECUTION TODO (FINAL — PRESERVED + CORRECTED)**

```markdown
# 🌌 PHASE 2 — EXECUTION TODO (AUTHORITATIVE — PRESERVED + CORRECTED)

---

# 1. EXECUTION RULES

- Execute ONE step at a time
- Do NOT batch steps
- Do NOT skip steps
- Do NOT invent steps
- Do NOT expand scope
- Minimal diffs only
- Verify each step before continuing

IF A STEP FAILS:

- STOP
- fix ONLY the failure
- re-verify
- resume

---

# 2. PHASE MODE (CRITICAL)

Phase 2 includes TWO MODES:

## 2.1 Exploration Mode (EARLY PHASE)

- validate engine concepts
- refine filters
- refine scene structure
- confirm system behavior

## 2.2 Implementation Mode (LOCKED PHASE)

- follow engine specs
- enforce contracts
- build final system

---

## RULE

No engine may enter full implementation until:

- scope model is fixed
- engine model is fixed
- filter model is defined
- scene structure is defined

---

# 3. PHASE OBJECTIVE

Implement:

User → Scope → Engine → Filter → Scene → Object → Detail

WITH:

- backend authority
- deterministic outputs
- provider-backed data (when required)
- preserved object detail flow

WITHOUT:

- breaking Phase 1
- introducing Phase 3 features
- introducing frontend logic

---

# 4. EXECUTION SEQUENCE

---

# ✅ STEP 0 — CONTRACT LOCK (RESTORED — CRITICAL, LOCKED)

## VERIFY

- scope list finalized
- engine list agreed
- filter model defined
- scene structure defined

## LOCK CONDITION

No further structural changes without explicit revision.

---

# ✅ STEP 1 — UI LAYOUT FOUNDATION (LOCKED)

## Goal
Build command center layout

## Tasks
- [x] Top control bar
- [x] Main scene area
- [x] Right context panel
- [x] Now Above Me section
- [x] Engine module grid
- [x] Detail panel placeholder

## Constraints
- NO logic
- NO APIs
- static data only

## LOCK CONDITION

UI matches system diagram of astronomy_hub_diagram.md

---

# ✅ STEP 2 — UI STANDARDIZATION (LOCKED)

## VERIFY

- module consistency
- grid consistency
- spacing/typography consistency

## LOCK CONDITION

UI structure unified

---

# ✅ STEP 3 — DETAIL PANEL SYSTEM (UI ONLY, LOCKED)

## VERIFY

- panel exists
- reusable layout
- hub remains visible

## LOCK CONDITION

Panel stable and reusable

---

# ✅ STEP 4 — DATA PIPELINE (FOUNDATION, LOCKED)

## VERIFY

System supports:

Provider → Adapter → Normalizer → Validator → Cache

## LOCK CONDITION

No raw data reaches engines

---

# ✅ STEP 5 — CONDITIONS ENGINE (FIRST ENGINE, LOCKED)

SPEC: docs/architecture/CONDITIONS_ENGINE_SPEC.md

## VERIFY

- ingestion works
- score computed
- summary generated
- clear-sky-aligned metrics present (transparency, seeing, darkness; smoke when available)
- decision includes explanation/warnings

## LOCK CONDITION

Conditions drive system behavior

---

# ✅ STEP 6 — SATELLITE ENGINE (LOCKED)

SPEC: docs/architecture/SATELLITE_ENGINE_SPEC.md

## VERIFY

- TLE ingestion
- propagation
- pass computation

## LOCK CONDITION

Satellite output matches reality

---

# ✅ STEP 7 — SOLAR SYSTEM ENGINE (LOCKED)

SPEC: docs/architecture/SOLAR_SYSTEM_ENGINE_SPEC.md

## VERIFY

- ephemeris integration
- correct positioning

## LOCK CONDITION

Planets match real sky

---

# ✅ STEP 8 — DEEP SKY ENGINE (LOCKED)

SPEC: docs/architecture/DEEP_SKY_ENGINE_SPEC.md

## VERIFY

- catalog loaded
- visibility computed
- ranking applied

## LOCK CONDITION

Targets are valid and useful

---

# ✅ STEP 9 — SUN ENGINE (LOCKED)

SPEC: docs/architecture/SUN_ENGINE_SPEC.md

## VERIFY

- events ingested
- activity classification correct

## LOCK CONDITION

Solar data accurate

---

# ✅ STEP 10 — EVENTS ENGINE (LOCKED)

SPEC: docs/architecture/TRANSIENT_EVENTS_ENGINE_SPEC.md

## VERIFY

- time filtering
- relevance

## LOCK CONDITION

Events meaningful

---

# ✅ STEP 11 — FLIGHT ENGINE (LOCKED)

SPEC: docs/architecture/FLIGHT_ENGINE_SPEC.md

## VERIFY

- filtered aircraft only

## LOCK CONDITION

No UI clutter

---

# 🔴 STEP 12 — ABOVE ME ORCHESTRATION (ACTIVE)

## VERIFY

- merges engines
- applies ranking

## LOCK CONDITION

Produces single decision scene

---

# 🔴 STEP 13 — STATE SYSTEM

## VERIFY

- deterministic state
- restorable state

## LOCK CONDITION

State stable

---

# 🔴 STEP 14 — SCOPE SYSTEM

## VERIFY

- scope controls context
- resets correctly

## LOCK CONDITION

Scope authoritative

---

# 🔴 STEP 15 — ENGINE ROUTING

## VERIFY

- valid engine access
- invalid rejected

## LOCK CONDITION

Engines isolated

---

# 🔴 STEP 16 — FILTER SYSTEM

## VERIFY

- filters affect output
- backend execution

## LOCK CONDITION

Filtering deterministic

---

# 🔴 STEP 17 — SCENE GENERATION

## VERIFY

- built from:
  scope + engine + filter + time + location

## LOCK CONDITION

Scene deterministic

---

# 🔴 STEP 18 — OBJECT SYSTEM

## VERIFY

- stable IDs
- scene-only origin

## LOCK CONDITION

Object integrity maintained

---

# 🔴 STEP 19 — OBJECT DETAIL FLOW

## VERIFY

- detail panel works
- no duplication

## LOCK CONDITION

Flow intact

---

# 🔴 STEP 20 — PHASE 1 PRESERVATION (RESTORED)

## VERIFY

- Above Me still works
- no regression
- no rewrites

## LOCK CONDITION

Phase 1 intact

---

# 🔴 STEP 21 — DATA LAW ENFORCEMENT

## VERIFY

- no mock runtime data
- provider-backed or computed only

## LOCK CONDITION

System truth enforced

---

# 🔴 STEP 22 — DEGRADED MODE

## VERIFY

- failure detected
- state exposed

## LOCK CONDITION

No hidden failures

---

# 🔴 STEP 23 — REALITY VALIDATION

## VERIFY

- outputs match real world
- engines accurate

## LOCK CONDITION

System trustworthy

---

# 🔴 STEP 24 — ANTI-SCOPE VALIDATION

## VERIFY

- no Phase 3 features

## LOCK CONDITION

Scope preserved

---

# 🔴 STEP 25 — FINAL SYSTEM VALIDATION

## VERIFY

System answers:

“What should I look at right now?”

## LOCK CONDITION

Decision-support achieved

---

# 5. COMPLETION RULE

Phase 2 is COMPLETE ONLY IF:

- ALL steps locked
- ALL engines spec-compliant
- ALL outputs reality-backed
- NO mock runtime data
- NO pipeline violations
- Phase 1 preserved

---

# FINAL RULE

Do NOT mark complete early.

Correctness > progress.
```

---
