# LEGACY REFERENCE NOTICE

This document is retained for planning/history context only.
Active execution authority is feature-first under docs/features/*.

````markdown id="p4accept"
# 🌌 PHASE 4 ACCEPTANCE CRITERIA (AUTHORITATIVE — BINARY VALIDATION)

---

# CORE RULE

```text
If any condition cannot be proven → Phase 4 is NOT complete.
````

---

# 1. CANONICAL NODE IDENTITY

---

## REQUIRED

* [ ] Every node has:

  * canonical id
  * entity type (object | event | mission | news | research)
  * owner (engine/system)
  * normalized name/title

* [ ] IDs are stable across:

  * API calls
  * sessions
  * navigation paths

---

## FAIL CONDITIONS

* IDs change between calls
* duplicate identities for same entity
* nodes cannot be re-resolved deterministically

---

# 2. RELATIONSHIP SCHEMA

---

## REQUIRED

* [ ] Typed relationships exist and are enforced:

  * related_to
  * caused_by
  * affects
  * observed_by
  * part_of
  * launched_by
  * associated_with
  * source_for
  * references

* [ ] Each type has:

  * explicit definition
  * consistent semantics
  * direction (when applicable)

---

## FAIL CONDITIONS

* vague or generic relationships
* inconsistent meaning per type
* missing direction where required

---

# 3. GRAPH STORAGE

---

## REQUIRED

* [ ] Graph stores:

  * nodes
  * edges (relationships)

* [ ] Edges reference canonical IDs

* [ ] Cross-engine relationships are supported

---

## FAIL CONDITIONS

* relationships not tied to canonical nodes
* graph cannot resolve cross-engine links
* inconsistent storage model

---

# 4. RELATIONSHIP OWNERSHIP

---

## REQUIRED

* [ ] Every relationship includes:

  * source node
  * target node
  * relationship type
  * origin/authority

---

## FAIL CONDITIONS

* relationships without origin
* ambiguous ownership
* cross-engine links without authority

---

# 5. GRAPH API

---

## REQUIRED

* [ ] Endpoints exist:

  * /api/object/{id}/related
  * /api/object/{id}/relationships
  * /api/object/{id}/news

* [ ] Responses include:

  * canonical IDs
  * entity types
  * relationship type
  * explanation

* [ ] Responses are normalized

---

## FAIL CONDITIONS

* raw/unstructured payloads
* missing relationship metadata
* inconsistent response formats

---

# 6. RELATIONSHIP EXPLANATION

---

## REQUIRED

* [ ] Every surfaced relationship includes:

  * relationship type
  * explanation of connection

* [ ] Explanation is:

  * consistent
  * deterministic
  * not generated ad hoc

---

## FAIL CONDITIONS

* relationships without explanation
* vague or inconsistent explanations
* dynamic/unstable explanation output

---

# 7. DETAIL VIEW INTEGRATION

---

## REQUIRED

Detail views include:

* [ ] related objects

* [ ] related events

* [ ] related missions

* [ ] related news

* [ ] related research

* [ ] Relationships grouped clearly by type

* [ ] Each relationship shows explanation

---

## FAIL CONDITIONS

* ungrouped or mixed content
* overwhelming detail layout
* unrelated or noisy items

---

# 8. RELATIONSHIP NAVIGATION

---

## REQUIRED

* [ ] Flow works:
  Object → Related Entity → Detail → Return

* [ ] Navigation preserves:

  * origin context
  * selected entity
  * prior position

---

## FAIL CONDITIONS

* broken navigation chain
* lost origin
* inconsistent back behavior

---

# 9. CROSS-ENGINE LINKING

---

## REQUIRED

System supports:

* [ ] object → event
* [ ] object → mission
* [ ] object → news
* [ ] object → research

Across engines

---

## FAIL CONDITIONS

* broken cross-engine links
* mismatched identities
* inconsistent linkage

---

# 10. DATA LAW

---

## REQUIRED

* [ ] Backend:

  * constructs graph
  * defines relationships
  * provides explanation

* [ ] Frontend:

  * renders relationships only
  * does NOT compute graph meaning

---

## FAIL CONDITIONS

* frontend generates relationships
* frontend modifies graph meaning
* raw graph data exposed

---

# 11. BOUNDED TRAVERSAL

---

## REQUIRED

* [ ] Relationship queries are limited in depth

* [ ] System does NOT:

  * traverse entire graph
  * load full graph dataset

---

## FAIL CONDITIONS

* deep/unbounded traversal
* performance degradation
* graph explosion

---

# 12. UI RELATIONSHIP SYSTEM

---

## REQUIRED

* [ ] UI:

  * groups relationships by type
  * presents clear sections
  * supports navigation

* [ ] UI does NOT:

  * invent relationships
  * reorder meaning arbitrarily

---

## FAIL CONDITIONS

* UI-generated “related” logic
* inconsistent grouping
* loss of relationship meaning

---

# 13. PERFORMANCE

---

## REQUIRED

* [ ] Relationship queries are fast

* [ ] Detail pages load without delay

* [ ] No heavy graph computation on navigation

---

## FAIL CONDITIONS

* slow detail loads
* excessive backend computation
* latency spikes

---

# 14. TESTING

---

## REQUIRED

* [ ] Node identity verified
* [ ] Relationship typing verified
* [ ] Cross-engine links verified
* [ ] Navigation verified
* [ ] API responses verified

---

## FAIL CONDITIONS

* inconsistent results
* unverified paths
* failing tests

---

# 15. ANTI-SCOPE

---

## REQUIRED

System MUST NOT include:

* [ ] prediction systems
* [ ] personalization
* [ ] recommendation engines
* [ ] watchlists
* [ ] timeline forecasting

---

## FAIL CONDITIONS

* any Phase 5 features present

---

# 16. USER VALIDATION

---

User MUST:

* [ ] understand why items are related

* [ ] navigate relationships without confusion

* [ ] move across entities without losing context

* [ ] discover meaningful connections

---

## FAIL CONDITIONS

* confusion about relationships
* inability to follow connections
* random or unclear links

---

# FINAL RULE

```text
ALL checks must pass.
Relationships must be explainable, deterministic, and consistent.
```

```


---

# NOAA RADAR INGESTION ADDENDUM ACCEPTANCE

This addendum is additive and does not remove or invalidate the canonical relationship-system acceptance criteria above.

## A1. NOAA PROVIDER INGESTION

### REQUIRED

* [ ] Backend can fetch NOAA NEXRAD Level III radar metadata/assets
* [ ] Provider failures return controlled degraded behavior

### FAIL CONDITIONS

* provider path missing
* unhandled provider failure

---

## A2. ADAPTER / NORMALIZER / VALIDATOR

### REQUIRED

* [ ] Raw NOAA fields are adapted before use
* [ ] Normalized radar contract is emitted with stable keys
* [ ] Invalid NOAA payloads are rejected/degraded safely

### FAIL CONDITIONS

* raw NOAA payload appears in response contracts
* unstable or missing normalized fields

---

## A3. CACHE + FRESHNESS

### REQUIRED

* [ ] Radar cache behavior is explicit and tested
* [ ] Freshness/staleness signal is exposed
* [ ] Identical inputs produce deterministic payloads

### FAIL CONDITIONS

* no cache control
* nondeterministic payload shape for identical inputs

---

## A4. CONDITIONS INTEGRATION

### REQUIRED

* [ ] Conditions payload includes radar block from backend
* [ ] Radar degraded mode is explicit when unavailable
* [ ] Radar/smoke addendum does not break Conditions V2 decision+metrics contract fields

### FAIL CONDITIONS

* radar is frontend-owned
* conditions contract omits radar status when provider fails

---

## A5. UI BOUNDARY ENFORCEMENT

### REQUIRED

* [ ] UI uses backend radar contract only
* [ ] UI does not own NOAA endpoint/path construction

### FAIL CONDITIONS

* frontend-owned provider logic
* frontend-owned fallback policy
