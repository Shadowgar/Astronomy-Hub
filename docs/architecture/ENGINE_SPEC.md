# 🌌 ASTRONOMY HUB — ENGINE SPEC (AUTHORITATIVE)

## 0. PURPOSE

This document defines:

> **What an engine is, how it behaves, what it owns, and how it interacts with the rest of Astronomy Hub**

It exists to prevent:

* backend chaos
* mixed responsibilities
* duplicated logic
* inconsistent data handling
* future architectural drift

This is a **core system law document**.

---

## 1. CORE RULE

```text id="8t4qk2"
An engine is a domain authority.

It owns one domain.
It exposes filtered outputs.
It does not own the whole system.
```

---

## 2. DEFINITION OF AN ENGINE

An engine is a **bounded system component** that is responsible for one major knowledge domain.

Examples:

* Earth Engine
* Solar Engine
* Satellite Engine
* Flight Engine
* Solar System Engine
* Deep Sky Engine
* News / Knowledge Engine

An engine is not:

* a page
* a UI widget
* a raw API wrapper
* a catch-all service
* a generic bag of logic

---

## 3. WHAT AN ENGINE MUST DO

Every engine must:

1. ingest or receive domain data
2. normalize domain data into system contracts
3. expose filter-based scene outputs
4. expose object summaries
5. expose object detail records
6. operate independently of other engines for core functionality

---

## 4. WHAT AN ENGINE MUST NOT DO

An engine must NOT:

* own another engine’s data
* normalize another engine’s objects
* perform unrelated domain logic
* expose raw provider payloads to the frontend
* make UI decisions
* bypass system contracts
* silently change object structure

---

## 5. ENGINE RESPONSIBILITY MODEL

Each engine owns four things:

### 5.1 Domain Data Ownership

The engine owns the data for its domain.

Example:

* Earth Engine owns earthquakes, weather, aurora, etc.
* Satellite Engine owns tracked orbital objects
* Solar Engine owns sunspot / flare / CME domain logic

### 5.2 Filter Ownership

The engine defines what filters are valid for its domain.

Example:

* Earth Engine → weather, earthquakes, aurora, radiation
* Solar Engine → sunspots, flares, CMEs
* Satellite Engine → visible passes, Starlink, science satellites

### 5.3 Scene Output Ownership

The engine defines how filtered domain data becomes scene data.

### 5.4 Object Detail Ownership

The engine is the authority for object detail records in its domain.

---

## 6. ENGINE ↔ FILTER MODEL

### Rule

```text id="2m7xq4"
An engine may support many filters, but only one filter is active at a time.
```

A filter is:

* not an engine
* not a visual layer
* not a UI-only concept

A filter is the active **subset and interpretation mode** of an engine.

### Example

```text id="4v9pk1"
Earth Engine
  ├── Weather Filter
  ├── Earthquake Filter
  ├── Aurora Filter
  └── Meteor Event Filter
```

When a filter is selected:

* only relevant data should be processed
* only relevant objects should be returned
* only relevant scene information should be assembled

---

## 7. ENGINE ↔ SCOPE MODEL

Scopes and engines are related, but not identical.

### Scope

Defines what part of reality the user is currently exploring.

### Engine

Defines which domain authority is active.

### Rule

```text id="7c3nt8"
Scope selects context.
Engine selects domain logic.
```

### Examples

* Scope: Earth → Engine: Earth Engine
* Scope: Sun → Engine: Solar Engine
* Scope: Satellites → Engine: Satellite Engine
* Scope: Above Me → Main Engine orchestrates multiple engines

---

## 8. THE MAIN ENGINE / ORCHESTRATION LAYER

The Main Engine is not a normal engine.

It does not own a scientific domain.

It owns:

* scope resolution
* active engine selection
* cross-engine coordination
* merged scene assembly for special cases like “Above Me”

### Special Role

```text id="6j2kr9"
The Main Engine coordinates engines.
It does not replace them.
```

### It may:

* ask engines for filtered scene slices
* merge outputs into a unified scene
* rank merged objects for presentation

### It must not:

* redefine engine-owned object schemas
* duplicate engine normalization logic
* bypass engine authority

---

## 9. ENGINE INPUTS

Every engine may consume:

* external provider data
* cached normalized domain data
* scoped query parameters
* time context
* location context (if relevant)

### Rule

```text id="3z8vm2"
External provider input must never be considered frontend-safe until normalized.
```

---

## 10. ENGINE OUTPUTS

Every engine must support three output classes.

### 10.1 Scene Output

Used to render the active scene.

Must be:

* scoped
* filtered
* limited
* render-ready

### 10.2 Object Summary Output

Used in:

* lists
* side panels
* scene labels
* search/discovery previews

### 10.3 Object Detail Output

Used in full object detail pages.

Must include:

* canonical identity
* structured data
* media
* related objects
* linked news / research where available

---

## 11. ENGINE CONTRACT RULE

### Rule

```text id="9r4kp7"
Every engine must emit only canonical system contracts.
```

This means:

* no raw provider fields
* no provider-specific shape leakage
* no inconsistent object naming
* no engine-local schema improvisation

All engine outputs must conform to `DATA_CONTRACTS.md`.

---

## 12. ENGINE ISOLATION RULE

### Rule

```text id="5p2xm8"
An engine must be usable and testable in isolation.
```

This means:

* engine logic must be separately testable
* engine routes must not depend on unrelated engines
* engine failures must not collapse the whole system

### Exception

The Main Engine may assemble multiple engine outputs in merged scenes.

---

## 13. ENGINE FAILURE RULES

If an engine fails:

* failure must be contained
* error must be visible in logs
* scene must degrade gracefully where possible
* unrelated engines must remain functional

### Rule

```text id="1k8tv4"
One engine failure must not become full-system failure unless the system shell itself is broken.
```

---

## 14. ENGINE CACHING RULES

Each engine may cache:

* provider responses
* normalized domain outputs
* filtered scene outputs
* object detail lookups

### Rule

```text id="4q7mz1"
Caching belongs to engine-serving behavior, but cache strategy must remain system-consistent.
```

This means:

* engines may cache internally
* cache key rules must still align with system-level conventions
* no engine may invent incompatible cache semantics

---

## 15. ENGINE INGESTION RULES

An engine may ingest from one or more providers.

But the system should prefer:

* authoritative sources
* minimal source count
* normalized consistency over provider volume

### Rule

```text id="7p3nv5"
More providers is not automatically better.
Authority and consistency matter more than count.
```

---

## 16. ENGINE OBJECT OWNERSHIP RULE

Every object in Astronomy Hub must belong to exactly one engine.

### Rule

```text id="6m2px9"
One object = one owning engine
```

Examples:

* earthquake → Earth Engine
* sunspot region → Solar Engine
* ISS → Satellite Engine
* Mars → Solar System Engine
* M13 → Deep Sky Engine

The object may be linked to other engines, but it still has one owner.

---

## 17. ENGINE CROSS-LINKING RULE

Engines may link to one another through:

* related objects
* related events
* causal relationships
* observation relationships
* mission relationships

But linking does not change ownership.

### Example

```text id="8p4zk2"
Solar flare
  owner: Solar Engine
  linked to:
    Earth aurora event (Earth Engine)
    related news item (News Engine)
```

---

## 18. REQUIRED ENGINES (AUTHORITATIVE)

### 18.1 Earth Engine

Owns:

* weather
* earthquakes
* aurora / geomagnetic conditions
* meteor/fireball events
* radiation / related Earth effects
* light pollution (if modeled here)

### 18.2 Solar Engine

Owns:

* sunspots
* solar flares
* CMEs
* magnetic solar activity
* solar surface events / imagery interpretation layer

### 18.3 Satellite Engine

Owns:

* tracked satellites
* orbital metadata
* visible passes
* LEO / GEO / cislunar / deep-space tracked assets
* satellite ownership / mission metadata

### 18.4 Flight Engine

Owns:

* aircraft positions
* route / aircraft summary data
* above-horizon aircraft relevance

### 18.5 Solar System Engine

Owns:

* planets
* moons
* comets
* asteroids
* NEOs
* spacecraft operating in solar-system context
* orbital context for solar system bodies

### 18.6 Deep Sky Engine

Owns:

* galaxies
* nebulae
* clusters
* cataloged deep-sky targets
* visibility-oriented deep-sky summaries

### 18.7 News / Knowledge Engine

Owns:

* news objects
* research/article references
* media linkage where not engine-native
* cross-domain discovery support

---

## 19. ENGINE DIRECTORY / CODE ORGANIZATION RULE

Each engine should eventually have its own backend area.

Illustrative structure:

```text id="4m9pk3"
backend/app/engines/
  earth/
  solar/
  satellite/
  flight/
  solar_system/
  deep_sky/
  news/
```

Each engine may contain:

* adapters
* normalizers
* query services
* scene builders
* detail builders
* tests

### Rule

```text id="2v8rm6"
Code organization should reflect engine boundaries.
```

---

## 20. ENGINE TESTING RULE

Every engine must eventually be tested for:

* valid filter handling
* valid scene output
* valid object summary output
* valid detail output
* contract compliance
* graceful failure behavior

### Rule

```text id="9x3tk7"
An engine is not complete until its outputs are contract-valid and testable.
```

---

## 21. ENGINE UI RELATIONSHIP RULE

The frontend may choose how to present engine outputs, but it must not redefine the engine’s data meaning.

### Backend owns:

* domain truth
* object identity
* output structure

### Frontend owns:

* rendering
* interaction
* presentation
* focus / selection / navigation UI

### Rule

```text id="3p7vk1"
Backend owns truth.
Frontend owns experience.
```

---

## 22. PHASE APPLICATION OF ENGINE MODEL

### Phase 1

Only limited filter slices from multiple engines are used in “Above Me” mode.

### Phase 2

Engines become directly explorable.

### Phase 2

Backend must be restructured so engines become real runtime authorities.

### Phase 3+

Engines gain richer visual and exploratory expression.

---

## 23. FORBIDDEN PATTERNS

The system must NOT:

* create “misc” engines
* create “shared logic” that silently owns domain behavior
* let one engine emit another engine’s objects
* return raw provider payloads as engine outputs
* bypass filters
* load all engine filters by default
* mix UI logic into engine logic

---

## 24. VALIDATION CRITERIA

The engine system is correct only if:

* each engine has a clear domain
* each engine has valid filters
* each engine emits canonical contracts
* each object has one owning engine
* engines can be tested independently
* engine failures are isolated
* cross-linking does not blur ownership

---

## 25. FAILURE CONDITIONS

The engine system is considered broken if:

* an engine owns multiple unrelated domains
* filters are unclear or meaningless
* object ownership is ambiguous
* engines emit inconsistent schemas
* engine logic is scattered across unrelated files
* the Main Engine starts acting like a domain engine

---

## 26. FINAL STATEMENT

```text id="7m2qk8"
The engine model is the backbone of Astronomy Hub.

If engine ownership is unclear,
the backend will drift.
If the backend drifts,
the whole system will drift.
```

## 27. PRACTICAL SUMMARY

In Astronomy Hub:

* Engines own domains
* Filters define active slices
* Scenes define what is rendered
* Objects belong to one engine
* The Main Engine coordinates, but does not replace engine authority

That is the system.

---

## 28. ENGINE SOURCE GOVERNANCE (ADDITIVE)

This section extends source requirements without changing ownership laws above.

### 28.1 Source Classes

Each engine source must be classified as:

* `PRIMARY` — authoritative runtime source for active output
* `ENRICHMENT` — optional supplemental metadata/media
* `FALLBACK` — degraded-mode source used only when primary path fails

### 28.2 Source Provenance Rule

Every engine output record should remain source-traceable at least to:

* provider identifier
* retrieval timestamp
* normalized contract version

### 28.3 Engine-to-Source Baseline Matrix

| Engine | PRIMARY (runtime) | ENRICHMENT (optional) |
|---|---|---|
| Earth / Conditions | NOAA/NWS + model-backed atmosphere inputs | local light-pollution datasets |
| Solar | NOAA SWPC | NASA/ESA solar media and mission context |
| Satellite | SatNOGS + visibility/pass providers in use | mission/operator lookup catalogs |
| Flight | ADS-B Exchange/OpenSky-style flight-position feeds | aircraft/operator metadata registries |
| Solar System | JPL ephemeris sources | planetary media catalogs |
| Deep Sky | curated DSO catalogs + visibility context | astrophotography/reference datasets |
| News / Knowledge | backend-curated astronomy/news feed | engine-linked media/research crossrefs |

### 28.4 Engine Completeness Extension

An engine is not operationally complete unless:

* primary source path is explicit
* degraded behavior is explicit
* provenance is exposed in normalized outputs (directly or trace metadata)
