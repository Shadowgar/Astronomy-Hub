# 📄 ✅ **PHASE 2 — VALIDATION CHECKLIST (REWRITE — ENGINE + DATA + UI ALIGNED)**

```markdown
# 🌌 PHASE 2 — VALIDATION CHECKLIST (AUTHORITATIVE — ENGINE + DATA ALIGNED)

---

# 1. PURPOSE

This document defines the **mandatory validation criteria** for Phase 2.

Phase 2 is NOT complete until ALL checks pass.

This checklist enforces:

- architectural integrity
- decision-support behavior
- backend authority
- provider-backed truth
- engine specification compliance
- UI system integrity
- anti-scope compliance

---

# 2. VALIDATION RULES

- Every check must be explicitly verified
- No assumptions allowed
- If ANY item fails:
  - STOP
  - fix the issue
  - revalidate before continuing

---

# 3. SYSTEM PIPELINE VALIDATION

## 3.1 Core Flow

- [ ] System follows:
  Scope → Engine → Filter → Scene → Object → Detail

- [ ] No path bypasses this flow

- [ ] All navigation paths are consistent

- [ ] Scene is the ONLY source of surfaced objects

---

# 4. STATE VALIDATION

- [ ] System tracks:
  - active scope
  - active engine
  - active filter
  - current scene
  - selected object

- [ ] State is deterministic

- [ ] State is restorable

---

# 5. SCOPE VALIDATION

- [ ] All required scopes exist:
  - above_me
  - solar_system
  - deep_sky
  - satellites
  - flights
  - sun
  - earth (if applicable)

- [ ] Scope switching:
  - resets engine
  - resets filter
  - regenerates scene

- [ ] Invalid scope requests are rejected

---

# 6. ENGINE VALIDATION (SPEC-DRIVEN)

- [ ] All required engines exist:

  - Conditions Engine
  - Satellite Engine
  - Solar System Engine
  - Deep Sky Engine
  - Sun Engine
  - Flight Engine
  - Transient Events Engine

---

## 6.1 Engine Spec Compliance

For EACH engine:

- [ ] follows its specification document
- [ ] uses defined data sources
- [ ] implements defined computation model
- [ ] produces defined output contract
- [ ] includes “why it matters”
- [ ] does NOT expose raw provider data
- [ ] does NOT fabricate data

---

## 6.2 Engine Behavior

- [ ] engines are isolated
- [ ] only one engine active (except Above Me)
- [ ] engines return structured scene-ready data

---

# 7. PROVIDER + DATA VALIDATION

---

## 7.1 Provider Pipeline

- [ ] System implements:

  Provider → Adapter → Normalizer → Validator → Cache → Engine

- [ ] No raw provider data reaches engines

---

## 7.2 Provider Authority

- [ ] All runtime data is provider-backed or computed from provider data
- [ ] No mock data used as runtime truth
- [ ] All outputs traceable to provider inputs

---

## 7.3 Data Integrity

- [ ] stale data is detected
- [ ] invalid data is rejected
- [ ] degraded state is visible

---

# 8. FILTER VALIDATION

- [ ] Filters are defined per engine
- [ ] One filter active at a time
- [ ] Filters affect object selection
- [ ] Filters do not bypass engine logic
- [ ] Invalid filters are rejected
- [ ] No uncontrolled filters exist

---

# 9. SCENE VALIDATION

---

## 9.1 Structural Integrity

- [ ] Every scene includes:
  - title
  - summary
  - grouped objects
  - reasoning
  - time context
  - conditions context

- [ ] No unstructured lists returned

---

## 9.2 Decision Behavior

- [ ] Scene answers a clear question
- [ ] Scene summary explains what matters NOW
- [ ] Scene usable without opening detail panel

---

## 9.3 Grouping

- [ ] Objects grouped meaningfully
- [ ] Groups have purpose
- [ ] No duplicate or arbitrary groups

---

## 9.4 Reasoning

- [ ] Every object includes a reason
- [ ] Reasons are human-readable
- [ ] Reasons reflect:
  - time
  - conditions
  - visibility

---

## 9.5 Time Context

- [ ] Scene reflects:
  - now
  - soon (if relevant)
  - best window

---

## 9.6 Conditions Integration

- [ ] Conditions influence:
  - object selection
  - ranking
  - reasoning

- [ ] Observing score present and believable
- [ ] ClearSky-aligned metrics surfaced:
  - cloud cover
  - transparency
  - seeing
  - darkness
  - wind
  - humidity
  - smoke (when available)
- [ ] Conditions decision includes explanation + warnings (not raw weather dump)

---

# 10. OBJECT VALIDATION

- [ ] Objects include valid IDs
- [ ] Objects resolve via `/api/object/{id}`
- [ ] Objects contain NO full detail payload
- [ ] Objects are relevant to scene
- [ ] Objects include reasoning

---

# 11. OBJECT DETAIL VALIDATION

- [ ] Detail panel loads for all objects
- [ ] No duplication of detail in scene
- [ ] Scene → object → detail flow intact
- [ ] Panel updates without breaking hub
- [ ] Return to scene works correctly

---

# 12. ABOVE ME VALIDATION

- [ ] Above Me merges multiple engines
- [ ] Applies visibility filtering
- [ ] Applies ranking across engines
- [ ] Produces a single decision scene
- [ ] Output is coherent and useful

---

# 13. BACKEND AUTHORITY VALIDATION

- [ ] Backend controls:
  - inclusion
  - grouping
  - reasoning
  - ranking

- [ ] Frontend does NOT:
  - reorder objects
  - generate reasoning
  - filter independently

---

# 14. FRONTEND / UI VALIDATION

---

## 14.1 Layout

- [ ] UI matches system diagram
- [ ] All modules exist:
  - solar system
  - deep sky
  - satellites
  - sun
  - flights
  - conditions
  - events

---

## 14.2 Behavior

- [ ] User can:
  - select scope
  - select engine
  - select filters

- [ ] UI does NOT:
  - compute logic
  - rank objects
  - alter data

---

## 14.3 Detail Panel

- [ ] panel opens on click
- [ ] panel updates on new selection
- [ ] hub remains visible

---

# 15. PERFORMANCE VALIDATION

- [ ] only active scene computed
- [ ] no full dataset rendering
- [ ] system remains responsive

---

# 16. PHASE 1 INTEGRITY

- [ ] Above Me still works
- [ ] no regression
- [ ] endpoints remain functional

---

# 17. ANTI-SCOPE VALIDATION

The following MUST NOT exist:

- [ ] UI redesign beyond defined spec
- [ ] 3D systems
- [ ] charts/graphs
- [ ] timeline scrubbing
- [ ] predictive AI
- [ ] personalization
- [ ] search engine

IF ANY EXIST → PHASE INVALID

---

# 18. SYSTEM BEHAVIOR VALIDATION

- [ ] engines produce DIFFERENT outputs
- [ ] system is NOT a data dashboard
- [ ] system answers:
  “What should I look at right now?”
- [ ] output supports decision making

---

# 19. DEGRADED MODE VALIDATION

- [ ] provider failure detected
- [ ] degraded state exposed
- [ ] no silent fallback
- [ ] no fake success responses

---

# 20. FINAL REALITY VALIDATION

- [ ] outputs match real-world expectations
- [ ] planets match sky
- [ ] satellites accurate
- [ ] conditions believable
- [ ] events timely

---

# 21. COMPLETION GATE

Phase 2 is COMPLETE ONLY IF:

- [ ] ALL checks pass
- [ ] ALL engines spec-compliant
- [ ] ALL data provider-backed
- [ ] NO mock runtime data
- [ ] NO pipeline violations
- [ ] system is deterministic
- [ ] system is trustworthy

---

# FINAL RULE

Do NOT mark Phase 2 complete early.

A system that looks correct but is not reality-backed is INVALID.
```

---
