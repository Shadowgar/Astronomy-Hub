````markdown
# 🌌 PHASE 2 ACCEPTANCE CRITERIA (AUTHORITATIVE — BINARY VALIDATION)

---

# CORE RULE

```text
If any condition cannot be proven → Phase 2 is NOT complete.
````

---

# 1. STATE SYSTEM

---

## REQUIRED

* [x] System tracks:

  * active scope
  * active engine
  * active filter
  * current scene
  * selected object

* [x] State is deterministic (same inputs → same outputs)

* [x] State is restorable (reload preserves context)

---

## FAIL CONDITIONS

* missing state variables
* inconsistent state after interaction
* state resets incorrectly

---

# 2. SCOPE SYSTEM

---

## REQUIRED

* [x] All scopes exist:

  * Above Me
  * Earth
  * Sun
  * Satellites
  * Flights
  * Solar System
  * Deep Sky

* [x] Scope switching:

  * resets engine
  * resets filter
  * regenerates scene

* [x] Scope visibly changes system output

---

## FAIL CONDITIONS

* scope does not change behavior
* stale data after switching
* partial updates

---

# 3. ENGINE SYSTEM

---

## REQUIRED

* [x] Only ONE engine active at a time
  (except Above Me merge mode)

* [x] Engines:

  * are independent
  * return structured data only
  * do NOT render UI

* [x] Each engine defines:

  * dataset
  * valid filters

---

## FAIL CONDITIONS

* multiple engines active improperly
* engines overlap responsibility
* UI logic inside engines

---

# 4. FILTER SYSTEM

---

## REQUIRED

* [x] Only ONE filter active per engine

* [x] Filters:

  * visibly affect scene
  * execute in backend
  * change output deterministically

---

## FAIL CONDITIONS

* filter has no effect
* filter logic in UI
* multiple conflicting filters

---

# 5. SCENE SYSTEM

---

## REQUIRED

* [x] Scene is generated ONLY from:
  Scope + Engine + Filter

* [x] Scene is:

  * deterministic
  * reproducible
  * backend-generated

* [x] Same inputs → identical scene

---

## FAIL CONDITIONS

* inconsistent scenes
* scene built in UI
* filters ignored

---

# 6. ABOVE ME MODE

---

## REQUIRED

* [x] Above Me merges multiple engines

* [x] Above Me still:

  * applies filters
  * produces ONE scene

---

## FAIL CONDITIONS

* Above Me behaves like single engine
* inconsistent merge behavior

---

# 7. COMMAND BAR

---

## REQUIRED

* [x] Command bar includes:

  * scope selector
  * engine selector
  * filter selector
  * location
  * mode

* [x] Each control:

  * updates system state
  * triggers scene rebuild

---

## FAIL CONDITIONS

* controls do not update state
* controls do not trigger scene update
* UI logic modifies data

---

# 8. TRANSITIONS

---

## REQUIRED

* [x] Changing:

  * scope
  * engine
  * filter

Produces:

* [x] full scene refresh
* [x] no stale data
* [x] no partial updates

---

## FAIL CONDITIONS

* stale UI
* mixed states
* delayed updates

---

# 9. OBJECT SYSTEM

---

## REQUIRED

* [x] Objects originate ONLY from scene

* [x] Objects:

  * maintain identity across transitions
  * support detail routing

---

## FAIL CONDITIONS

* objects exist outside scene
* IDs change unexpectedly
* detail breaks across contexts

---

# 10. DATA LAW

---

## REQUIRED

* [x] Backend assembles scene

* [x] Frontend:

  * receives normalized data only
  * does NOT filter data
  * does NOT rank data
  * does NOT generate reasoning

---

## FAIL CONDITIONS

* raw API data in UI
* frontend logic affecting meaning
* fallback parsing in components

---

# 11. PERFORMANCE

---

## REQUIRED

* [x] Only active scene computed

* [x] No preloading all scopes

* [x] No full dataset rendering

---

## FAIL CONDITIONS

* performance degradation on switching
* unnecessary computation

---

# 12. TESTING

---

## REQUIRED

* [x] Scope switching works
* [x] Engine switching works
* [x] Filter switching works
* [x] Scene updates correctly
* [x] Object detail works across all contexts

---

## FAIL CONDITIONS

* broken transitions
* inconsistent behavior
* failing tests

---

# 13. ANTI-SCOPE

---

## REQUIRED

System MUST NOT include:

* [x] spatial UI (Phase 3)
* [x] prediction (Phase 5)
* [x] personalization (Phase 5)
* [x] knowledge graph (Phase 4)

---

## FAIL CONDITIONS

* any future-phase feature present

---

# 14. USER VALIDATION

---

## REQUIRED

User MUST be able to:

* [x] switch scope and understand change instantly
* [x] switch engine and see meaningful difference
* [x] apply filter and see clear impact
* [x] navigate without confusion

---

## FAIL CONDITIONS

* user cannot understand changes
* system feels inconsistent
* system behaves unpredictably

---

# 15. LIVE DATA & LOCATION-TIME AUTHORITY

---

## REQUIRED

* [x] Above Me scene is assembled from provider-backed normalized inputs, not static `MOCK_*` runtime sources
* [x] Active location affects scene output
* [x] Time affects scene output
* [x] Provider degradation is explicit
* [x] Provider baseline implemented and traceable

---

## FAIL CONDITIONS

* mock data drives runtime
* location/time ignored
* provider failure hidden
* scene not traceable to provider

---

# 🔥 16. DATA INGESTION SYSTEM (NEW — CRITICAL)

## REQUIRED

* [x] Provider → Adapter → Normalizer → Validator → Cache pipeline exists
* [x] Raw provider data never reaches engines
* [x] Normalized contracts are enforced

---

## FAIL CONDITIONS

* engines consume raw provider data
* no ingestion layer exists
* normalization missing

---

# 🔥 17. ENGINE DATA LAW ENFORCEMENT

## REQUIRED

* [x] Engines DO NOT create data
* [x] Engines ONLY transform provider-backed inputs
* [x] No synthetic runtime datasets

---

## FAIL CONDITIONS

* hardcoded data
* mock runtime inputs
* fabricated objects

---

# 🔥 18. SCENE AUTHORITY (PHASE 1 GAP FIX)

## REQUIRED

* [ ] ALL objects originate from Scene
* [ ] No engine → UI bypass

---

## FAIL CONDITIONS

* objects bypass scene
* UI constructs objects

---

# 🔥 19. TRACEABILITY

## REQUIRED

* [ ] Every object has provider source
* [ ] Every scene has data origin trace
* [ ] timestamps present

---

## FAIL CONDITIONS

* cannot trace data origin
* hidden data source

---

# 🔥 20. DETERMINISM (FULL INPUT SET)

## REQUIRED

* [ ] Scene inputs include:

  * location
  * time
  * provider snapshot
  * scope
  * engine
  * filter

---

## FAIL CONDITIONS

* unexplained output differences
* nondeterministic behavior

---

# 🔥 21. VISIBILITY + RELEVANCE

## REQUIRED

* [ ] below-horizon objects excluded
* [ ] irrelevant objects filtered
* [ ] scene is NOT full dataset

---

## FAIL CONDITIONS

* dataset dumping
* irrelevant objects shown

---

# 🔥 22. RANKING SYSTEM

## REQUIRED

* [ ] deterministic ranking exists
* [ ] priority ordering consistent
* [ ] decision-support output maintained

---

## FAIL CONDITIONS

* random ordering
* no prioritization

---

# 🔥 23. CACHE + FRESHNESS

## REQUIRED

* [x] TTL exists
* [x] stale data detectable
* [x] freshness exposed

---

## FAIL CONDITIONS

* stale data treated as live
* no cache control

---

# 🔥 24. DEGRADED MODE

## REQUIRED

* [ ] degraded state exposed
* [ ] missing sources listed
* [ ] no silent fallback

---

## FAIL CONDITIONS

* fake success response
* hidden provider failure

---

# 🔥 25. MOCK DATA REMOVAL

## REQUIRED

* [ ] no runtime MOCK_* usage

---

## FAIL CONDITIONS

* any static dataset remains

---

# 🔥 26. SYSTEM INVALIDATION

System is INVALID if:

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
