# LEGACY REFERENCE NOTICE

This document is retained for planning/history context only.
Active execution authority is feature-first under docs/features/*.

# 📄 ✅ **PHASE 2 ACCEPTANCE CRITERIA (REWRITE — ENGINE + DATA + UI ALIGNED)**

````markdown
# 🌌 PHASE 2 ACCEPTANCE CRITERIA (AUTHORITATIVE — BINARY VALIDATION)

---

# CORE RULE

```text
If any condition cannot be PROVEN → Phase 2 is NOT complete.
````

This is NOT subjective validation.

Everything must be:

* observable
* testable
* reproducible
* traceable to real-world data

---

# 1. STATE SYSTEM

---

## REQUIRED

* [ ] System tracks:

  * active scope
  * active engine
  * active filter
  * current scene
  * selected object

* [ ] State is deterministic
  (same inputs → same outputs)

* [ ] State is restorable
  (reload preserves context)

---

## FAIL CONDITIONS

* missing state variables
* inconsistent state after interaction
* state resets incorrectly

---

# 2. SCOPE SYSTEM

---

## REQUIRED

* [ ] All scopes exist:

  * above_me
  * solar_system
  * deep_sky
  * satellites
  * flights
  * sun
  * earth

* [ ] Scope switching:

  * resets engine
  * resets filter
  * regenerates scene

* [ ] Scope visibly changes system output

---

## FAIL CONDITIONS

* scope does not change behavior
* stale data after switching
* partial updates

---

# 3. ENGINE SYSTEM

---

## REQUIRED

* [ ] Only ONE engine active at a time
  (except Above Me)

* [ ] Engines:

  * are independent
  * follow their specification documents
  * return structured data only
  * do NOT render UI
  * do NOT expose raw provider data

---

## ENGINE SPEC COMPLIANCE

For EACH engine:

* [ ] matches its spec file exactly
* [ ] uses correct providers
* [ ] implements defined computation
* [ ] outputs match contract
* [ ] includes “why it matters”

---

## FAIL CONDITIONS

* engines overlap responsibility
* engine logic differs from spec
* UI logic inside engines

---

# 4. FILTER SYSTEM

---

## REQUIRED

* [ ] Only ONE filter active per engine

* [ ] Filters:

  * visibly affect scene
  * execute in backend
  * change output deterministically

---

## FAIL CONDITIONS

* filter has no effect
* filter logic in UI
* conflicting filters

---

# 5. SCENE SYSTEM

---

## REQUIRED

* [ ] Scene generated ONLY from:

  Scope + Engine + Filter + Location + Time

* [ ] Scene is:

  * deterministic
  * reproducible
  * backend-generated

---

## FAIL CONDITIONS

* inconsistent scenes
* UI-built scenes
* filters ignored

---

# 6. ABOVE ME MODE

---

## REQUIRED

* [ ] Above Me:

  * merges multiple engines
  * applies visibility filtering
  * applies ranking
  * outputs ONE coherent scene

---

## FAIL CONDITIONS

* behaves like single engine
* inconsistent merging
* no cross-engine ranking

---

# 7. COMMAND BAR

---

## REQUIRED

* [ ] Command bar includes:

  * scope selector
  * engine selector
  * filter selector
  * location
  * mode

* [ ] Each control:

  * updates state
  * triggers scene rebuild

---

## FAIL CONDITIONS

* controls do not update state
* controls do not trigger scene rebuild
* UI modifies data logic

---

# 8. TRANSITIONS

---

## REQUIRED

Changing:

* scope
* engine
* filter

Produces:

* [ ] full scene refresh
* [ ] no stale data
* [ ] no partial updates

---

## FAIL CONDITIONS

* stale UI
* mixed states
* delayed updates

---

# 9. OBJECT SYSTEM

---

## REQUIRED

* [ ] Objects originate ONLY from scene

* [ ] Objects:

  * maintain identity across transitions
  * support detail routing

---

## FAIL CONDITIONS

* objects exist outside scene
* IDs change unexpectedly
* broken detail routing

---

# 10. OBJECT DETAIL SYSTEM (NEW)

---

## REQUIRED

* [ ] Clicking object opens detail panel

* [ ] Panel updates when selecting new object

* [ ] Hub remains visible

* [ ] No full page navigation

* [ ] Detail includes:

  * overview
  * sky position
  * images (if available)
  * data
  * reasoning

---

## FAIL CONDITIONS

* navigation replaces hub
* panel breaks context
* detail duplicated in scene

---

# 11. DATA LAW

---

## REQUIRED

* [ ] Backend assembles scene

* [ ] Frontend:

  * receives normalized data only
  * does NOT filter
  * does NOT rank
  * does NOT generate reasoning

---

## FAIL CONDITIONS

* raw API data in UI
* frontend logic affects meaning

---

# 12. PROVIDER + DATA VALIDATION

---

## REQUIRED

* [ ] All runtime data is provider-backed
* [ ] No MOCK_* runtime data
* [ ] Provider pipeline exists:

```text
Provider → Adapter → Normalizer → Validator → Cache → Engine
```

* [ ] All outputs traceable to provider

---

## FAIL CONDITIONS

* mock data used
* provider path missing
* raw data reaches engines

---

# 13. PERFORMANCE

---

## REQUIRED

* [ ] Only active scene computed
* [ ] No full dataset rendering
* [ ] System responsive

---

## FAIL CONDITIONS

* performance degradation
* unnecessary computation

---

# 14. ANTI-SCOPE

---

## REQUIRED

System MUST NOT include:

* [ ] 3D systems
* [ ] advanced visualization
* [ ] prediction systems
* [ ] personalization
* [ ] AI assistant
* [ ] search engine

---

## FAIL CONDITIONS

* any future-phase feature present

---

# 15. USER VALIDATION

---

## REQUIRED

User MUST be able to:

* [ ] understand scene instantly
* [ ] see difference between engines
* [ ] understand “why it matters”
* [ ] navigate without confusion

---

## FAIL CONDITIONS

* system unclear
* system feels like data dump

---

# 16. LOCATION / TIME AUTHORITY

---

## REQUIRED

* [ ] Location affects output
* [ ] Time affects output
* [ ] Different inputs produce different scenes

---

## FAIL CONDITIONS

* static output
* ignored context

---

# 17. VISIBILITY + RELEVANCE

---

## REQUIRED

* [ ] below-horizon objects excluded
* [ ] irrelevant objects filtered
* [ ] scene NOT full dataset

---

## FAIL CONDITIONS

* dataset dumping
* irrelevant objects shown

---

# 18. RANKING SYSTEM

---

## REQUIRED

* [ ] deterministic ranking exists
* [ ] priority ordering consistent
* [ ] decision-support output maintained

---

## FAIL CONDITIONS

* random ordering
* no prioritization

---

# 19. CACHE + FRESHNESS

---

## REQUIRED

* [ ] TTL exists
* [ ] stale detection exists
* [ ] freshness exposed

---

## FAIL CONDITIONS

* stale data treated as live
* no cache control

---

# 20. DEGRADED MODE

---

## REQUIRED

* [ ] provider failure detected
* [ ] degraded state exposed
* [ ] no silent fallback

---

## FAIL CONDITIONS

* fake success
* hidden failure

---

# 21. FINAL REALITY VALIDATION

---

## REQUIRED

* [ ] outputs match real-world expectations
* [ ] satellites accurate
* [ ] planets accurate
* [ ] conditions believable
* [ ] conditions expose clear-sky-aligned metrics (cloud/transparency/seeing/darkness/wind/humidity; smoke when available)
* [ ] conditions decision includes explanation (summary/warnings) and is not raw weather text
* [ ] events timely

---

# 22. SYSTEM INVALIDATION

System is INVALID if ANY:

* [ ] mock data used
* [ ] provider path missing
* [ ] engines create data
* [ ] scene bypassed
* [ ] location/time ignored

---

# FINAL RULE

```text
ALL checks must pass.
System must reflect real-world truth.
```

```

---
