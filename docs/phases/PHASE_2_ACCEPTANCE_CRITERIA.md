````markdown id="y2v8k3"
# 🌌 PHASE 2 ACCEPTANCE CRITERIA (AUTHORITATIVE — BINARY VALIDATION)

---

# CORE RULE

```text id="b8v4x2"
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

* [ ] Objects originate ONLY from scene

* [ ] Objects:

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

* [ ] Backend assembles scene

* [ ] Frontend:

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

* [ ] Only active scene computed

* [ ] No preloading all scopes

* [ ] No full dataset rendering

---

## FAIL CONDITIONS

* performance degradation on switching
* unnecessary computation

---

# 12. TESTING

---

## REQUIRED

* [ ] Scope switching works
* [ ] Engine switching works
* [ ] Filter switching works
* [ ] Scene updates correctly
* [ ] Object detail works across all contexts

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

* [ ] spatial UI (Phase 3)
* [ ] prediction (Phase 5)
* [ ] personalization (Phase 5)
* [ ] knowledge graph (Phase 4)

---

## FAIL CONDITIONS

* any future-phase feature present

---

# 14. USER VALIDATION

---

User MUST be able to:

* [ ] switch scope and understand change instantly
* [ ] switch engine and see meaningful difference
* [ ] apply filter and see clear impact
* [ ] navigate without confusion

---

## FAIL CONDITIONS

* user cannot understand changes
* system feels inconsistent
* system behaves unpredictably

---

# FINAL RULE

```text id="n5yqv9"
ALL checks must pass.
No interpretation allowed.
```

```
