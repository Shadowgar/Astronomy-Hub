# 🌌 ASTRONOMY HUB — PHASE 2 EXPANDED SPEC

**Phase Name:** Data Expansion & System Foundation
**Primary Objective:** Expand Astronomy Hub from a local decision dashboard into a **structured, scalable astronomy data platform**, while preserving clarity, performance, and usability.

---

# 1. Purpose of Phase 2

Phase 2 builds on Phase 1 by:

* expanding the depth of data
* strengthening backend structure
* improving data accuracy and richness
* enabling more detailed exploration without overwhelming the user

Phase 2 is NOT about becoming a global system yet.

Phase 2 is about:

> “Making the system smarter, richer, and more reliable while staying local-first.”

---

## 1.1 Relationship to Phase 1

Phase 1:

* answers “what should I look at tonight?”

Phase 2:

* answers:

  * “what exactly is this object?”
  * “how does it move over time?”
  * “what more can I explore from here?”

---

# 2. What Phase 2 is trying to solve

Phase 1 provides:

* summaries
* recommendations
* quick decisions

But lacks:

* deeper object data
* structured satellite information
* expandable event intelligence
* backend consistency for scaling

Phase 2 solves:

* shallow data → structured data
* static summaries → expandable insight
* simple endpoints → scalable architecture

---

# 3. Phase 2 success definition

Phase 2 is successful if:

* users can drill deeper into any item (target, pass, event)
* data feels richer and more informative
* backend supports multiple data sources cleanly
* frontend remains simple and non-overwhelming
* performance remains fast

---

# 4. Phase 2 scope boundaries

## Included in Phase 2

* structured backend architecture
* multiple data source ingestion (limited set)
* richer object detail views
* expanded satellite information
* improved event system
* improved conditions modeling
* basic persistence layer (lightweight storage)

---

## Excluded from Phase 2 (LOCKED)

* global real-time map
* 3D Earth visualization
* AR features
* aircraft tracking
* massive distributed ingestion
* real-time streaming systems
* AI-driven recommendations
* public-scale infrastructure

---

# 5. Phase 2 user experience goals

The system must remain:

* calm
* structured
* non-overwhelming
* fast

Even though data increases, **complexity must not increase at the surface level**.

---

# 6. UX philosophy for Phase 2

### Phase 2 rule:

> “More depth on demand, not more noise by default”

### UI principles

* deeper data is hidden behind interaction
* dashboard remains simple
* detail views become richer
* navigation becomes more meaningful, not more crowded

---

# 7. Phase 2 page evolution

## 7.1 Dashboard (unchanged philosophy)

* remains summary-focused
* no new clutter added
* continues to answer “what matters now”

---

## 7.2 Enhanced drill-down pages

Each page gains depth:

### Sky Tonight (expanded)

Add:

* object descriptions
* visibility timelines
* better classification (galaxy, nebula, cluster, etc.)
* observational notes

---

### Satellites (expanded)

Add:

* object type (ISS, Starlink, debris, etc.)
* mission/operator
* brightness classification
* pass quality scoring

---

### Events (expanded)

Add:

* event duration
* peak timing
* visibility conditions
* historical context (optional)

---

### Conditions (expanded)

Add:

* more refined observing score
* optional:

  * seeing
  * transparency modeling
* light pollution integration (basic)

---

### Moon & Planets (expanded)

Add:

* phase visualization logic
* planet visibility scoring
* “best target tonight” indicators

---

# 8. Backend architecture evolution

Phase 1 backend:

* simple
* mocked
* stateless

Phase 2 backend becomes:

* structured
* modular
* ingestion-aware
* cache-driven

---

## 8.1 Phase 2 backend responsibilities

* ingest selected external data sources
* normalize into internal schema
* cache results
* serve stable API responses

---

## 8.2 Updated architecture

```text
External APIs
   ↓
Ingestion Jobs
   ↓
Normalization Layer
   ↓
Cache / Storage
   ↓
API Layer
   ↓
Frontend
```

---

# 9. Data ingestion strategy (Phase 2)

Phase 2 introduces **controlled ingestion**, not massive scale.

## Rules:

* start with small number of trusted sources
* normalize everything
* never expose raw external data directly

---

## Example categories:

* satellite TLE / pass data
* astronomical object catalogs (limited subset)
* event feeds
* weather / observing conditions

---

# 10. Data persistence (NEW)

Phase 2 may introduce lightweight storage:

Options:

* file-based cache
* simple local database (SQLite)

Purpose:

* store normalized data
* reduce repeated fetches
* improve performance

---

# 11. API expansion (Phase 2)

Existing endpoints:

* `/api/conditions`
* `/api/targets`
* `/api/passes`
* `/api/alerts`

Expanded endpoints:

* `/api/targets/:id`
* `/api/passes/:id`
* `/api/events`
* `/api/moon`
* `/api/planets`

---

# 12. Data contract evolution

Contracts must:

* remain stable
* extend carefully
* never break existing frontend behavior

All new fields must be additive only.

---

# 13. Recommendation engine evolution

Still NOT AI.

Expanded deterministic logic:

* better weighting
* more factors
* improved prioritization

---

# 14. Performance requirements

* must remain fast on local systems
* must remain Pi-compatible later
* no heavy computation per request

---

# 15. ORAS integration (expanded)

Phase 2 strengthens:

* curated targets
* ORAS recommendations
* educational overlays

---

# 16. Risks

## Risk 1: Data explosion

Mitigation:

* limit ingestion sources
* normalize aggressively

---

## Risk 2: UI overload

Mitigation:

* keep dashboard unchanged
* hide depth behind interaction

---

## Risk 3: backend complexity creep

Mitigation:

* modular design
* no overengineering

---

## Risk 4: performance degradation

Mitigation:

* caching
* limited fetch frequency

---

# 17. Phase 2 validation checklist

Phase 2 is complete when:

* deeper object views work
* satellite detail works
* events are richer
* backend ingestion works reliably
* UI remains clean
* performance remains fast

---

# 18. Documentation requirements

Add:

* PHASE_2_SPEC.md (this file)
* BACKEND_DATA_MODEL.md
* INGESTION_RULES.md
* API_EXPANSION_PLAN.md

---

# 19. Phase 2 build order

1. backend structure refactor
2. ingestion system (limited sources)
3. data normalization layer
4. caching system
5. expanded endpoints
6. detail UI views
7. validation

---

# 20. Final Phase 2 statement

Phase 2 should feel like:

> “The same clean dashboard—but now every item can be explored in meaningful depth.”

---

# 🔥 KEY DIFFERENCE FROM PHASE 1

Phase 1 = decision support
Phase 2 = structured knowledge expansion

---

# 🚀 WHERE THIS LEADS

Phase 2 sets up:

* Phase 3 → advanced exploration
* Phase 4 → global systems
* Phase 5 → full astronomy intelligence platform