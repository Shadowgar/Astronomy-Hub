````markdown
# 🌌 PHASE 4 BUILD SEQUENCE (AUTHORITATIVE — KNOWLEDGE GRAPH SYSTEM)

---

# 0. PURPOSE

Defines exact execution steps to build:

```text
Canonical knowledge graph + relationship system
````

Execution model:

```text
VERIFY → ACCEPT or REBUILD → RE-VERIFY → LOCK
```

---

# 1. EXECUTION LAW

For EVERY step:

1. VERIFY against:

   * PHASE_4_SPEC.md
   * SYSTEM_VALIDATION_SPEC.md

2. IF VALID → LOCK

3. IF INVALID → FIX MINIMALLY

4. RE-VERIFY

5. LOCK

---

# 2. GLOBAL RULES

```text
No skipping
No batching
No Phase 5 features
No UI-side relationship logic
```

---

# STEP 1 — CANONICAL NODE MODEL

---

## VERIFY

System defines canonical node structure for:

* objects
* events
* missions
* news
* research

Each node includes:

* id (stable)
* type
* owner
* normalized name/title

---

## LOCK CONDITION

```text
All graph entities have stable, canonical identity.
```

---

# STEP 2 — RELATIONSHIP SCHEMA

---

## VERIFY

System defines typed relationships:

* related_to
* caused_by
* affects
* observed_by
* part_of
* launched_by
* associated_with
* source_for
* references

Verify:

* each type has explicit meaning
* direction defined where required

---

## LOCK CONDITION

```text
Relationship types are explicit and consistent.
```

---

# STEP 3 — GRAPH STORAGE MODEL

---

## VERIFY

System stores:

* nodes
* relationships (edges)

Verify:

* relationships reference canonical IDs
* cross-engine relationships are supported
* relationship origin is tracked

---

## LOCK CONDITION

```text
Graph structure is stable and queryable.
```

---

# STEP 4 — RELATIONSHIP OWNERSHIP

---

## VERIFY

Each relationship includes:

* source node
* target node
* relationship type
* origin/source authority

Verify:

* no ambiguous relationships
* cross-engine links are explicit

---

## LOCK CONDITION

```text
All relationships have clear ownership and origin.
```

---

# STEP 5 — GRAPH API LAYER

---

## VERIFY

Backend exposes endpoints such as:

* /api/object/{id}/related
* /api/object/{id}/relationships
* /api/object/{id}/news

Verify:

* normalized responses
* stable IDs
* includes relationship type + explanation

---

## LOCK CONDITION

```text
Graph API is deterministic and normalized.
```

---

# STEP 6 — RELATIONSHIP EXPLANATION

---

## VERIFY

Every surfaced relationship includes:

* relationship type
* explanation (why related)

Verify:

* explanations are consistent
* explanations are not generated ad hoc

---

## LOCK CONDITION

```text
All relationships are explainable.
```

---

# STEP 7 — DETAIL VIEW INTEGRATION

---

## VERIFY

Detail pages include:

* related objects
* related events
* related missions
* related news
* related research

Verify:

* grouped clearly
* not overloaded
* explanation present

---

## LOCK CONDITION

```text
Detail views are relationship-aware.
```

---

# STEP 8 — RELATIONSHIP NAVIGATION

---

## VERIFY

Flow:

```text
Object → Related Entity → Detail → Return
```

Verify:

* navigation is stable
* context preserved
* return restores origin

---

## LOCK CONDITION

```text
Relationship navigation is deterministic.
```

---

# STEP 9 — CROSS-ENGINE LINKING

---

## VERIFY

System supports:

* object → event
* object → mission
* object → news
* object → research

Across engines

Verify:

* no broken links
* consistent identity

---

## LOCK CONDITION

```text
Cross-engine relationships work correctly.
```

---

# STEP 10 — DATA LAW ENFORCEMENT

---

## VERIFY

* backend constructs graph
* frontend renders graph
* frontend does NOT compute relationships

---

## LOCK CONDITION

```text
Backend owns relationship meaning.
```

---

# STEP 11 — BOUNDED TRAVERSAL

---

## VERIFY

* relationship queries are limited
* no deep/unbounded traversal
* no full graph expansion

---

## LOCK CONDITION

```text
Graph remains performant and bounded.
```

---

# STEP 12 — UI RELATIONSHIP SYSTEM

---

## VERIFY

Frontend:

* displays relationship sections
* groups by type
* supports navigation

Verify:

* no UI-generated relationships
* no arbitrary sorting of graph meaning

---

## LOCK CONDITION

```text
UI faithfully renders graph structure.
```

---

# STEP 13 — PERFORMANCE

---

## VERIFY

* detail loads quickly
* relationship queries efficient
* no graph explosion

---

## LOCK CONDITION

```text
Graph system performs within limits.
```

---

# STEP 14 — TESTING

---

## VERIFY

* node identity stable
* relationships correct
* navigation works
* cross-engine linking works
* API responses consistent

---

## LOCK CONDITION

```text
Graph system is fully verified.
```

---

# STEP 15 — ANTI-SCOPE

---

## VERIFY

System does NOT include:

* prediction
* personalization
* recommendation engines
* watchlists

---

## LOCK CONDITION

```text
Phase 4 scope is clean.
```

---

# FINAL PHASE LOCK

---

Phase 4 COMPLETE ONLY IF:

```text
ALL steps locked
Graph system deterministic
Relationships explainable
Navigation stable
Performance controlled
```

---

# FINAL RULE

```text
Do NOT proceed to Phase 5 unless Phase 4 is fully locked.
```
---

# NOAA RADAR INGESTION ADDENDUM (AUTHORIZED TRACK)

This addendum is additive and does not remove or invalidate the canonical relationship-system sequence above.

## ADDENDUM STEP A1 — NOAA PROVIDER FOUNDATION

### VERIFY

* NOAA NEXRAD Level III fetch path exists in backend provider layer
* provider failures are handled safely

### LOCK CONDITION

```text
Backend can fetch NOAA radar source metadata/assets reliably.
```

---

## ADDENDUM STEP A2 — ADAPTER / NORMALIZER / VALIDATOR

### VERIFY

* raw NOAA payload is transformed to internal radar model
* normalized radar contract fields are stable
* invalid payloads are rejected/degraded safely

### LOCK CONDITION

```text
No raw NOAA payload reaches engine/response contracts.
```

---

## ADDENDUM STEP A3 — CACHE + FRESHNESS

### VERIFY

* radar payloads are cached with explicit TTL behavior
* freshness/staleness status is exposed deterministically

### LOCK CONDITION

```text
Radar responses are stable and freshness-aware.
```

---

## ADDENDUM STEP A4 — CONDITIONS CONTRACT INTEGRATION

### VERIFY

* conditions payload includes normalized radar block
* degraded mode is explicit when radar is unavailable
* radar/smoke enrichment remains compatible with Conditions Engine V2 metric+decision contract

### LOCK CONDITION

```text
Radar is backend-authoritative within Conditions contract.
```

---

## ADDENDUM STEP A5 — API SURFACE VERIFICATION

### VERIFY

* radar contract is available through conditions/scene API path
* response shape is deterministic for identical inputs

### LOCK CONDITION

```text
Radar contract is consumable by frontend with no provider logic.
```
