# `VALIDATION_CHECKLIST.md`

Your current one is good, but:

* still phase-heavy
* missing viewport + routing checks
* mixes old execution model

We modernize it.

---

## Replace the entire file with this:

---

# VALIDATION CHECKLIST (AUTHORITATIVE)

---

## PURPOSE

Defines how to verify that a feature or system is complete.

This document supports:

* SYSTEM_VALIDATION_SPEC.md
* FEATURE_ACCEPTANCE.md

---

## CORE RULE

```text
Completion is determined by validation results.
```

---

## VALIDATION TYPES

Every feature must pass:

---

### 1. FUNCTIONAL VALIDATION

* behavior works
* interaction works
* no broken flows

---

### 2. DATA VALIDATION

* data matches contracts
* no missing fields
* no inconsistent schemas
* no raw API data

---

### 3. UI VALIDATION

* user understands system
* layout stable
* no broken components
* no placeholder UI

---

### 4. ARCHITECTURAL VALIDATION

* engine ownership correct
* object model used
* contracts respected
* backend is authoritative

---

### 5. VIEWPORT VALIDATION (CRITICAL)

```text
Viewport = Active Engine Scene
```

Must pass:

* correct engine visible
* scene matches engine
* interaction updates scene

---

---

### 6. ROUTING VALIDATION (CRITICAL)

Must pass:

* object routes correctly
* engine switching correct
* sub-engine behavior correct

---

---

### 7. STATE VALIDATION

* scope works
* engine switching works
* filters work
* state persists

---

---

### 8. PERFORMANCE VALIDATION

Must pass:

* fast load
* no UI freeze
* no unnecessary computation

---

## SYSTEM INTEGRITY CHECKS

Must pass:

* system runs without errors
* no broken routes
* no console errors

---

## API CHECKS

Must pass:

* endpoints respond
* consistent response shapes
* contract compliance

---

## FRONTEND CHECKS

Must pass:

* scene renders correctly
* objects clickable
* detail works
* navigation works

---

## BACKEND CHECKS

Must pass:

* routes valid
* normalization active
* caching active
* no raw passthrough

---

## AUTOMATIC FAILURE CONDITIONS

System FAILS if:

* contract violation
* viewport incorrect
* routing incorrect
* fake data present
* UI breaks
* architecture broken

---

## VALIDATION PROCESS

```text
1. Run system
2. Test endpoints
3. Verify contracts
4. Test UI
5. Test viewport behavior
6. Test routing
7. Test edge cases
8. confirm performance
```

---

## FINAL RULE

```text
If validation is skipped, the system is not complete.
```

---

