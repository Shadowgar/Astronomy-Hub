# LEGACY REFERENCE NOTICE

This document is retained for planning/history context only.
Active execution authority is feature-first under docs/features/*.

````markdown id="p3accept"
# 🌌 PHASE 3 ACCEPTANCE CRITERIA (AUTHORITATIVE — BINARY VALIDATION)

---

# CORE RULE

```text id="p3a1"
If any condition cannot be proven → Phase 3 is NOT complete.
````

---

# 1. MODE SYSTEM

---

## REQUIRED

* [ ] System supports:

  * Command Center (default)
  * Spatial / Immersive mode

* [ ] Switching modes preserves:

  * scope
  * engine
  * filter
  * selected object

* [ ] Both modes use identical underlying data

---

## FAIL CONDITIONS

* mode switch resets context
* different data between modes
* command center removed or degraded

---

# 2. SCENE SYSTEM

---

## REQUIRED

* [ ] Each scope renders correct spatial scene:

  * Above Me → sky dome
  * Earth → globe/map
  * Solar → solar surface
  * Satellite → orbital map
  * Solar System → planetary system
  * Deep Sky → sky exploration

* [ ] Scene reflects real spatial relationships

* [ ] Scene is visually readable

---

## FAIL CONDITIONS

* incorrect scene type
* abstract/non-spatial representation
* cluttered or unreadable scene

---

# 3. CAMERA SYSTEM

---

## REQUIRED

* [ ] Camera supports:

  * pan
  * zoom
  * rotate (if applicable)
  * reset

* [ ] Movement is:

  * smooth
  * predictable
  * non-disorienting

---

## FAIL CONDITIONS

* jitter
* lag
* unpredictable movement
* loss of control

---

# 4. OBJECT RENDERING

---

## REQUIRED

* [ ] Objects appear in correct spatial positions

* [ ] Objects:

  * are visible
  * are selectable
  * maintain identity

---

## FAIL CONDITIONS

* missing objects
* incorrect positions
* identity instability

---

# 5. OBJECT FOCUS SYSTEM

---

## REQUIRED

* [ ] Objects support:

  * hover
  * focus
  * selection

* [ ] Selected object:

  * is visually dominant
  * displays context

* [ ] User always knows selected object

---

## FAIL CONDITIONS

* unclear selection
* no visual dominance
* ambiguous focus state

---

# 6. TRANSITION SYSTEM

---

## REQUIRED

* [ ] Transitions exist for:

  * scope changes
  * engine changes
  * filter changes
  * object selection
  * detail navigation

* [ ] Transitions are:

  * smooth
  * context-preserving
  * non-abrupt

---

## FAIL CONDITIONS

* abrupt changes
* lost orientation
* broken transitions

---

# 7. OBJECT → DETAIL FLOW

---

## REQUIRED

* [ ] Flow works:
  Scene → Object → Detail → Return

* [ ] Clicking object:

  * zooms/focuses correctly
  * opens detail view

* [ ] Return restores:

  * position
  * zoom level
  * selection

---

## FAIL CONDITIONS

* broken navigation
* lost scene state
* incorrect return position

---

# 8. OVERLAY SYSTEM

---

## REQUIRED

* [ ] Overlays include:

  * labels
  * orbits
  * markers
  * highlights

* [ ] Overlays:

  * are readable
  * do not clutter

---

## FAIL CONDITIONS

* excessive overlays
* unreadable overlays
* visual overload

---

# 9. CONTEXT PRESERVATION

---

## REQUIRED

* [ ] User always knows:

  * current scope
  * current engine
  * current filter
  * current position
  * selected object

---

## FAIL CONDITIONS

* user feels lost
* context disappears
* navigation confusion

---

# 10. UI HIERARCHY

---

## REQUIRED

* [ ] Scene is visually dominant

* [ ] Hierarchy order maintained:

  1. Scene
  2. Focused object
  3. Overlays
  4. Panels

---

## FAIL CONDITIONS

* panels overpower scene
* unclear hierarchy
* visual competition

---

# 11. DATA LAW

---

## REQUIRED

* [ ] Backend generates scene

* [ ] Frontend:

  * renders only
  * does NOT compute meaning
  * does NOT filter or rank

---

## FAIL CONDITIONS

* frontend logic affects data
* raw data leaks into UI

---

# 12. PERFORMANCE

---

## REQUIRED

* [ ] Scene renders smoothly

* [ ] No:

  * frame drops
  * noticeable lag
  * heavy loading delays

---

## FAIL CONDITIONS

* laggy interaction
* unstable performance
* excessive computation

---

# 13. TESTING

---

## REQUIRED

* [ ] Camera controls verified
* [ ] Transitions verified
* [ ] Object focus verified
* [ ] Context preservation verified
* [ ] Performance verified

---

## FAIL CONDITIONS

* any interaction unverified
* inconsistent behavior

---

# 14. ANTI-SCOPE

---

## REQUIRED

System MUST NOT include:

* [ ] prediction systems
* [ ] personalization
* [ ] knowledge graph

---

## FAIL CONDITIONS

* any Phase 4 or 5 features present

---

# 15. USER VALIDATION (CRITICAL)

---

User MUST:

* [ ] feel immersed in the scene

* [ ] NOT feel lost

* [ ] understand where they are

* [ ] easily interact with objects

* [ ] move naturally through system

---

## FAIL CONDITIONS

* confusion
* disorientation
* inability to navigate

---

# FINAL RULE

```text id="p3aFinal"
ALL checks must pass.
Clarity must remain intact.
Immersion must not degrade usability.
```

```


