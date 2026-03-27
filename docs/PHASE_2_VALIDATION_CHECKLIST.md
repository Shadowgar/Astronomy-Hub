# PHASE 2 — VALIDATION CHECKLIST

## 1. Purpose

This document defines the **mandatory validation criteria** for Phase 2.

Phase 2 is NOT complete until all checks pass.

This checklist enforces:

- architectural integrity
- decision-support behavior
- backend authority
- anti-scope compliance

---

## 2. Validation Rules

- Every check must be explicitly verified
- No assumptions allowed
- If any item fails:
  - STOP
  - fix the issue
  - revalidate before continuing

---

## 3. System Pipeline Validation

### 3.1 Core Flow

- [ ] System follows:
  Scope → Engine → Filter → Scene → Object → Detail

- [ ] No path bypasses this flow

- [ ] All navigation paths are consistent

---

## 4. Scope Validation

- [ ] All defined scopes exist (sky, solar_system, earth)

- [ ] Each scope exposes correct engines

- [ ] Invalid scope requests are rejected

- [ ] Scope switching updates available engines correctly

---

## 5. Engine Validation

- [ ] All required engines exist:
  - above_me
  - deep_sky
  - planets
  - moon
  - satellites

- [ ] Engines are only accessible within valid scopes

- [ ] Each engine produces a valid scene

- [ ] No engine returns raw data

---

## 6. Filter Validation

- [ ] Filters are defined per engine

- [ ] Invalid filters are rejected

- [ ] Filters affect object selection

- [ ] Filters do not bypass engine logic

- [ ] No freeform or uncontrolled filters exist

---

## 7. Scene Validation

### 7.1 Structural Integrity

- [ ] Every scene includes:
  - title
  - summary
  - grouped objects
  - reasoning
  - time context
  - conditions context

- [ ] No scene returns an unstructured list

---

### 7.2 Decision Behavior

- [ ] Each scene answers a clear question

- [ ] Scene summary explains what matters now

- [ ] Scene can be understood without opening object detail

---

### 7.3 Grouping

- [ ] Objects are grouped meaningfully

- [ ] Each group has a purpose

- [ ] Groups are not arbitrary or duplicated

---

### 7.4 Reasoning

- [ ] Every object includes a reason

- [ ] Reasons are human-understandable

- [ ] Reasons reflect time and conditions

---

### 7.5 Time Context

- [ ] Scenes reflect:
  - now
  - soon (if applicable)
  - best window (if applicable)

- [ ] Time relevance is clear to user

---

### 7.6 Conditions

- [ ] Scenes include observing context

- [ ] Conditions influence object selection

- [ ] Conditions influence reasoning

---

## 8. Object Validation

- [ ] All objects include valid IDs

- [ ] All objects resolve via `/api/object/{id}`

- [ ] No object includes full detail payload

- [ ] No object appears without reason

- [ ] Objects are relevant to the scene

---

## 9. Object Detail Validation

- [ ] Object detail endpoint works for all objects

- [ ] No duplication of detail data in scenes

- [ ] Scene → object → detail flow is intact

- [ ] Return to scene works correctly

---

## 10. Backend Authority Validation

- [ ] Backend controls:
  - object inclusion
  - grouping
  - reasoning
  - prioritization

- [ ] Frontend does NOT:
  - reorder objects
  - generate reasoning
  - filter independently

---

## 11. Frontend Behavior Validation

- [ ] User can select scope

- [ ] User can select engine

- [ ] User can select filters (where allowed)

- [ ] Scene renders consistently across engines

- [ ] No custom UI logic per engine

- [ ] No UI-driven ranking logic

---

## 12. Phase 1 Integrity Validation

- [ ] Existing "Above Me" still works

- [ ] No regression in Phase 1 behavior

- [ ] Existing endpoints remain functional

- [ ] Existing UI flow is preserved

---

## 13. Anti-Scope Validation

The following MUST NOT exist:

- [ ] UI redesign work
- [ ] 3D sky systems
- [ ] charts or graphs
- [ ] timeline scrubbing
- [ ] predictive recommendations
- [ ] AI assistant logic
- [ ] personalization systems
- [ ] free search functionality

If any exist → Phase 2 is invalid

---

## 14. System Behavior Validation

- [ ] Different engines produce meaningfully different scenes

- [ ] System does not behave like a data dashboard

- [ ] System answers:
  “What should I look at right now?”

- [ ] Scenes guide decisions, not just display information

---

## 15. Completion Gate

Phase 2 is COMPLETE only if:

- all validation checks pass
- system follows full pipeline
- no scope drift occurred
- architecture remains intact
- system is clearly more capable than Phase 1

Do NOT mark complete early.