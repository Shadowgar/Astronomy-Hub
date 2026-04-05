# `SYSTEM_VALIDATION_SPEC.md`

---

# SYSTEM VALIDATION SPEC (AUTHORITATIVE)

---

## 1. VALIDATION PRINCIPLE

A claim is valid only when it is:

1. implemented
2. architecture-aligned
3. runtime-proven
4. source-traceable
5. evidence-backed

If any dimension is missing:

```text
Status must be PARTIAL, FAKE, or BLOCKED
```

---

## 2. PROOF REQUIREMENTS (MANDATORY)

Every completion claim must include:

* exact file references
* exact commands run
* exact observed outputs
* explicit pass/fail statement

Preferred proof bundle:

* API response snippets
* UI screenshots (if UI claimed)
* test output
* build output

---

## 3. AUTHORITY RESOLUTION

On conflict, resolve in this order:

1. SYSTEM_VALIDATION_SPEC.md
2. CORE_CONTEXT.md
3. LIVE_SESSION_BRIEF.md
4. CONTEXT_MANIFEST.yaml
5. PROJECT_STATE.md
6. MASTER_PLAN.md
7. features/*
8. architecture/* + contracts/*
9. legacy docs

---

## 4. ARCHITECTURE VALIDATION

Must preserve:

```text
Scope → Engine → Filter → Scene → Object → Detail
```

And:

```text
Ingestion → Normalization → Storage → Cache → API → Client Rendering
```

---

### HARD FAILURES

* UI invents truth outside backend
* raw provider payload reaches UI
* object identity chain breaks
* engine ownership is incorrect
* scene does not match active engine

---

## 5. VIEWPORT VALIDATION (NEW — CRITICAL)

```text
Viewport = Active Engine Scene
```

Must pass:

* correct engine is rendered
* scene matches engine
* interaction updates scene correctly
* hub does not override engine rendering

---

### FAILURE IF:

* wrong engine is displayed
* multiple engine scenes appear
* hub acts as rendering layer
* viewport state inconsistent

---

## 6. ROUTING VALIDATION (NEW — CRITICAL)

Must verify:

* object → correct engine
* engine switching works
* sub-engine activation correct

---

### FAILURE IF:

* object opens wrong engine
* routing ambiguous
* ownership unclear

---

## 7. RUNTIME VALIDATION

Minimum checks:

* backend routes respond
* frontend renders behavior
* viewport reflects engine
* deterministic variation works (time/location/scope)
* degraded behavior is explicit

---

## 8. FEATURE CLASSIFICATION LAW

Only allowed states:

* REAL
* PARTIAL
* FAKE
* BLOCKED

---

## 9. REQUIRED FEATURE EVIDENCE CARD

Each feature must declare:

* Feature
* User-visible output
* Entry point
* Backend path
* Data source
* Routing behavior
* Viewport behavior
* Truth gaps
* Proof artifacts
* Status

---

## 10. EXECUTION BLOCK RULE

If any failure occurs:

```text
STOP → record → fix → re-validate
```

---

## 11. NON-NEGOTIABLE RULE

```text
If it cannot be proven from runtime behavior, it is not complete.
```

---

## 12. ROLE BOUNDARY

This document:

* defines validation authority
* defines truth classification

It does NOT:

* define scope
* define execution order
* replace feature definitions

---

## FINAL PRINCIPLE

```text
Validation defines truth.
```

---
