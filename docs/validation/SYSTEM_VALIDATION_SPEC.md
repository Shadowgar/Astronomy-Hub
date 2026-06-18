# SYSTEM VALIDATION SPEC - AUTHORITATIVE

## 1. Validation Principle

A claim is valid only when it is:

1. implemented
2. architecture-aligned
3. runtime-proven when runtime behavior is claimed
4. source-traceable
5. evidence-backed

If any dimension is missing, status must be one of:

- PARTIAL
- FAKE
- BLOCKED

## 2. Proof Requirements

Every completion claim must include:

- exact file references
- exact commands run
- exact observed outputs or pass/fail counts
- explicit pass/fail statement
- known gaps

Preferred proof bundle:

- API response snippets
- UI screenshots when UI is claimed
- test output
- build output when builds are required
- browser/runtime output for visual or route behavior

## 3. Authority Resolution

Resolve conflicts in this order:

1. `docs/validation/SYSTEM_VALIDATION_SPEC.md`
2. `docs/context/CORE_CONTEXT.md`
3. `docs/context/LIVE_SESSION_BRIEF.md`
4. `docs/context/CONTEXT_MANIFEST.yaml`
5. `docs/DOCUMENT_INDEX.md`
6. `docs/execution/PROJECT_STATE.md`
7. `docs/execution/MASTER_PLAN.md`
8. relevant feature, architecture, contract, object, and ingestion documents
9. legacy documents

Runtime evidence must be reported when it conflicts with stale documentation.

## 4. Required System Models

Preserve:

```text
Scope -> Engine -> Filter -> Scene -> Object -> Detail -> Assets
```

And:

```text
Ingestion -> Normalization -> Storage -> Cache -> API -> Client Rendering
```

Hard failures:

- UI invents truth outside backend/source data
- raw provider payload reaches user-facing UI without normalization
- object identity chain breaks
- engine ownership is incorrect
- scene does not match active engine
- fake coordinates or fake visibility are returned as real data

## 5. Active Runtime Validation

The active public ORAS sky runtime is:

```text
/oras-sky-engine/
```

This is the ORAS-hosted Stellarium Web / Stellarium Web Engine runtime.

Validation must not assume:

- `/sky-engine`
- BabylonJS as the active Sky Engine
- Hub-owned sky rendering

If a task affects `/oras-sky-engine/`, validation must prove the relevant
runtime behavior instead of relying only on static code inspection.

## 6. Sky Engine Runtime Validation

For `/oras-sky-engine/`, validate the behavior being claimed:

- page loads
- data sources load
- object identity resolves through `catalog + source_id + model`
- copied exact links open the intended object
- selected object identity matches the requested object
- camera centering/locking works when claimed
- detail panel shows meaningful type/metadata for known objects
- survey provider fallback works when survey behavior is claimed
- no persistent loader appears
- no fatal JavaScript errors appear

Panel selection alone is not proof of correct camera centering.

## 7. API Validation

For `/api/sky/object` and `/api/above-me`, validate:

- response shape
- source-backed identity
- stable string IDs for large identifiers
- no fabricated coordinates
- no fabricated visibility
- bounded response size
- explicit missing-data behavior
- generated `/oras-sky-engine/` URLs when links are claimed

## 8. Docker Runtime Authority

Docker is the authoritative runtime.

Local tests are supporting evidence. Runtime-sensitive completion claims require
runtime-level proof unless the task explicitly says local-only.

Expected runtime checks may include:

- `docker compose ps`
- `COMPOSE_BAKE=false docker compose up -d --build ...`
- `curl` checks for API/runtime endpoints
- backend tests
- frontend tests
- browser/Playwright validation
- `npm run validate:oras-deep-links`

## 9. High-Definition Data and Imagery Validation

High-definition data and imagery work must report:

- source/dataset inspected
- license/access note when relevant
- storage or mounting strategy
- fallback behavior
- coverage gaps
- runtime/browser proof if visual improvement is claimed

Do not claim full coverage from partial survey or catalog support.

DSS remains the safe fallback unless a validated replacement is explicitly
approved.

DESI must not be promoted unless explicitly approved.

Credits-update work is not part of data/imagery validation unless explicitly
requested.

## 10. WordPress / ORAS Integration Validation

WordPress shortcode/page work is deferred until explicitly approved.

When approved, it must validate the API-first path:

```text
WordPress/ORAS surface
-> /api/above-me
-> curated object result
-> sky_engine_url
-> /oras-sky-engine/ exact-link route
```

It must not duplicate sky calculations or hardcode production objects.

## 11. Feature Classification Law

Only these states are allowed:

- REAL
- PARTIAL
- FAKE
- BLOCKED

## 12. Execution Block Rule

If validation fails:

```text
STOP -> record -> fix -> re-validate
```

## Final Principle

If it cannot be proven from runtime behavior and source-backed data, it is not
complete.
