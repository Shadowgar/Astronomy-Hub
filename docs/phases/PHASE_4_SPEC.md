````markdown
# 🌌 PHASE 4 — KNOWLEDGE GRAPH / RELATIONSHIP SYSTEM (AUTHORITATIVE — MASTER PLAN ALIGNED)

---

# 0. PURPOSE

This document defines:

```text
The introduction of a canonical, graph-backed relationship system
connecting objects, events, missions, news, and research
across all engines.
````

Phase 4 transforms the system from:

```text
Scene exploration + spatial interaction
```

into:

```text
Connected knowledge + cross-engine relationship navigation
```

---

# 1. SYSTEM LAW (NON-NEGOTIABLE)

```text
Scope → Engine → Filter → Scene → Object → Detail
```

---

## HARD RULE

```text
The knowledge graph extends object meaning.
It does NOT replace the core pipeline.
```

---

# 2. PHASE 4 OBJECTIVE

The system MUST allow the user to:

* move from an object to related objects
* move from an object to related events
* move from an object to related missions
* move from an object to related news
* move from an object to related research
* understand why these relationships exist

---

## RESULT

```text
The system becomes a connected intelligence platform,
not just a scene explorer.
```

---

# 3. KNOWLEDGE GRAPH MODEL (CORE OF PHASE 4)

---

## RULE

```text
Relationships are a first-class system primitive in Phase 4.
```

---

## GRAPH ENTITIES (REQUIRED)

The graph MUST support canonical nodes for:

* objects
* events
* missions
* news items
* research items

---

## RULES

* every graph node MUST have stable identity
* every relationship MUST be typed
* every surfaced relationship MUST be explainable
* graph data MUST be normalized before frontend use

---

## FAILURE

* unstable graph identities
* ad hoc related links without model
* unexplained relationships

---

# 4. CANONICAL NODE IDENTITY

---

## REQUIRED

Every graph node MUST include:

* canonical id
* entity type
* owning engine or system owner
* normalized title / name
* relationship-ready metadata

---

## RULE

```text
No relationship system is valid without stable identity.
```

---

## FAILURE

* IDs differ across relationship calls
* nodes cannot be re-resolved deterministically

---

# 5. RELATIONSHIP MODEL

---

## REQUIRED RELATIONSHIP TYPES

The system MUST support typed edges such as:

* related_to
* caused_by
* affects
* observed_by
* part_of
* launched_by
* associated_with
* source_for
* references

---

## RULES

* each relationship type MUST have explicit meaning
* relationships MUST NOT be vague or generic by default
* relationships MUST be directional where appropriate
* relationship meaning MUST be preserved across UI and API

---

## FAILURE

* arbitrary links
* opaque relationship meaning
* inconsistent edge semantics

---

# 6. GRAPH OWNERSHIP MODEL

---

## RULE

```text
Graph relationships may span engines,
but ownership must remain explicit.
```

---

## REQUIRED

* source node owner known
* target node owner known
* relationship origin known
* relationship type known

---

## EXAMPLES

* solar flare → caused_by → solar active region
* solar event → affects → Earth event
* satellite → launched_by → mission
* mission → associated_with → news item
* planet → observed_by → mission

---

## FAILURE

* relationship exists without source authority
* cross-engine links are ambiguous

---

# 7. DETAIL VIEW EXPANSION (PHASE 4 UI)

---

## RULE

```text
Object Detail becomes relationship-aware in Phase 4.
```

---

## REQUIRED DETAIL SECTIONS

Detail views MUST now support:

* related objects
* related events
* related missions
* related news
* related research
* relationship explanation

---

## RULES

* relationships MUST be grouped clearly
* user MUST understand why an item is related
* sections MUST not feel like arbitrary link dumps

---

## FAILURE

* related content shown without explanation
* overwhelming detail page
* noisy unrelated panels

---

# 8. NAVIGATION MODEL (EXPANDED)

---

## REQUIRED FLOW

```text
Scope → Engine → Filter → Scene → Object → Detail → Related Entity → Detail → Return
```

---

## RULES

* relationship navigation MUST preserve context
* user MUST always know current entity and previous origin
* return behavior MUST remain deterministic

---

## FAILURE

* user gets lost in relationship chains
* broken back behavior
* disconnected navigation

---

# 9. GRAPH API SYSTEM

---

## REQUIRED ENDPOINTS

The backend MUST provide canonical relationship-aware endpoints such as:

* /api/object/{id}/related
* /api/object/{id}/relationships
* /api/object/{id}/news

Equivalent canonical endpoints may exist for non-object entities if required by the graph model.

---

## RULES

* endpoints MUST return normalized graph-aware contracts
* endpoints MUST preserve stable identity
* endpoints MUST include relationship type and explanation
* endpoints MUST NOT leak raw upstream data

---

## FAILURE

* raw graph payloads exposed
* inconsistent relationship contracts
* missing relationship explanation

---

# 10. UI RELATIONSHIP SYSTEM

---

## REQUIRED

The frontend MUST support:

* relationship sections in detail views
* clear grouping by entity type
* typed relationship display
* deterministic related-entity navigation

---

## RULES

* frontend renders relationships
* frontend does NOT invent relationships
* frontend does NOT infer graph meaning
* frontend does NOT reorder graph truth arbitrarily

---

## FAILURE

* UI generates “related” logic locally
* graph meaning changes between views

---

# 11. DISCOVERY MODEL

---

## RULE

```text
Phase 4 supports deterministic discovery,
not freeform exploration chaos.
```

---

## REQUIRED

The system MUST support guided discovery through:

* related objects
* related events
* related missions
* linked news
* linked research

---

## NOT ALLOWED

* freeform graph browser
* recommendation magic without explicit relationship basis
* speculative AI-generated links

---

## FAILURE

* system behaves like an uncontrolled knowledge browser
* relationships feel random or noisy

---

# 12. DATA LAW (UNCHANGED BUT EXPANDED)

---

## REQUIRED

* backend owns graph construction
* backend owns relationship typing
* backend owns relationship explanation
* frontend receives normalized relationship contracts only

---

## FAILURE

* frontend builds graph meaning
* frontend invents or filters relationships independently

---

# 13. PERFORMANCE MODEL

---

## REQUIRED

* relationship queries must be bounded
* graph traversal must be limited and deterministic
* detail expansion must not require loading the whole graph
* related sections load efficiently

---

## RULE

```text
The system must surface relationship context,
not compute the entire universe.
```

---

## FAILURE

* unbounded traversal
* slow detail pages
* graph load explosion

---

# 14. TESTING

---

## REQUIRED

Must verify:

* stable graph identities
* valid relationship typing
* cross-engine relationship resolution
* detail-to-related navigation
* return navigation
* normalized relationship contracts
* efficient bounded traversal

---

# 15. ANTI-SCOPE

Phase 4 MUST NOT include:

* prediction systems
* alerts forecasting
* personalization
* watchlists
* adaptive recommendations
* timeline forecasting

Those belong to later phases.

---

# 16. COMPLETION RULE

Phase 4 is COMPLETE ONLY IF:

```text
- canonical graph model exists
- typed relationships work
- cross-engine linking works
- detail views become relationship-aware
- navigation remains deterministic
- backend remains authoritative
- no Phase 5 leakage occurs
```

---

# FINAL STATEMENT

```text
Phase 4 transforms Astronomy Hub into a connected intelligence system
where objects, events, missions, news, and research
are linked through a canonical, explainable relationship graph.
```

