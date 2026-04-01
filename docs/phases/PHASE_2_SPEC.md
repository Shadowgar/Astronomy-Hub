````markdown
# 🌌 PHASE 2 — ENGINE SYSTEM (AUTHORITATIVE — MASTER PLAN ALIGNED)

---

# 0. PURPOSE

This document defines:

```text
The construction of the full multi-engine system
with user-controlled Scope → Engine → Filter → Scene.
````

Phase 2 transforms the system from:

```text
Single merged scene (Phase 1)
```

into:

```text
Multi-scope, multi-engine, filter-driven system
```

---

# 1. SYSTEM LAW (NON-NEGOTIABLE)

```text
Scope → Engine → Filter → Scene → Object → Detail
```

---

## HARD RULE

```text
Every scene MUST be produced through this pipeline.
No shortcuts allowed.
```
--- ENGINE SPECIFICATION AUTHORITY (NEW) ---

Each engine listed in Phase 2 MUST be governed by its corresponding specification document.

Required engine specs:

- docs/phases/engines/CONDITIONS_SPEC.md
- docs/phases/engines/SATELLITE_ENGINE_SPEC.md
- docs/phases/engines/SOLAR_SYSTEM_ENGINE_SPEC.md
- docs/phases/engines/DEEP_SKY_ENGINE_SPEC.md
- docs/phases/engines/SUN_ENGINE_SPEC.md
- docs/phases/engines/FLIGHT_ENGINE_SPEC.md
- docs/phases/engines/TRANSIENT_EVENTS_ENGINE_SPEC.md

RULE:

Engine behavior, data sources, computation logic, ranking, and output contracts
are defined ONLY in their respective spec files.

Phase 2 implementation MUST follow these specs exactly.

FAILURE:

- engine behavior diverges from spec
- undocumented logic exists outside spec
- spec and runtime differ
---

# 2. PHASE 2 OBJECTIVE

The system MUST allow the user to:

* select scope
* select engine
* apply filters
* generate a new scene deterministically

---

## RESULT

```text
The user controls WHAT they are viewing,
but the system still controls WHAT matters.
```

---

# 3. SCOPE SYSTEM (INTRODUCED)

---

## REQUIRED SCOPES

* Above Me
* Earth
* Sun
* Satellites
* Flights
* Solar System
* Deep Sky

---

## RULES

* Scope selection changes the entire system context
* Scope determines:

  * available engines
  * available filters
  * scene type

---

## FAILURE

* scope does not change system behavior → INVALID

---

# 4. ENGINE SYSTEM (CORE OF PHASE 2)

---

## RULE

```text
Only ONE engine active at a time
(EXCEPT Above Me merge mode)
```

---

## REQUIRED ENGINES

* Conditions Engine
* Satellite Engine
* Solar System Engine
* Deep Sky Engine
* Sun Engine
* Flight Engine
* Transient Events Engine

---

## ENGINE RESPONSIBILITIES

Each engine MUST:

* define its dataset
* define its scene type
* define its valid filters
* return structured data only

---

## FAILURE

* engines overlap responsibility
* engines produce UI
* engines bypass filters

---

# 5. FILTER SYSTEM (INTRODUCED TO USER)

---

## RULE

```text
One active filter per engine
```

---

## FILTER RESPONSIBILITIES

Filters MUST:

* modify scene output
* be visible in UI
* clearly affect results

---

## EXAMPLES

* visibility filters
* time filters
* event filters
* object type filters

---

## FAILURE

* filter has no visible effect
* filter logic occurs in UI
* multiple conflicting filters active

---

# 6. SCENE SYSTEM (EXPANDED)

---

## RULE

```text
Each scope + engine + filter combination produces a unique scene.
```

---

## SCENE MUST

* be deterministic
* be reproducible
* be filter-bound
* be engine-specific (except Above Me)

---

## ABOVE ME EXCEPTION

* merges multiple engines
* still uses filters
* still produces ONE scene

---

## FAILURE

* scene inconsistent for same inputs
* scene assembled in UI
* scene ignores filters

---

# 7. UI SYSTEM (PHASE 2 INTEGRATION)

---

## RULE

```text
Phase 2 activates full command bar controls.
```

---

## COMMAND BAR MUST NOW INCLUDE

* Scope selector
* Engine selector
* Filter selector
* Location
* Mode

---

## UI MUST FOLLOW

* UI Information Architecture
* UI Design Principles

---

## RULE

```text
UI controls system context, not data interpretation.
```

---

# 8. INTERACTION MODEL

---

## REQUIRED FLOW

```text
Scope → Engine → Filter → Scene → Object → Detail → Return
```

---

## RULES

* changing scope resets engine/filter
* changing engine resets filter
* changing filter regenerates scene

---

## FAILURE

* stale data
* partial updates
* inconsistent transitions

---

# 9. DATA LAW (ENFORCED)

---

* backend constructs scene
* frontend displays scene
* frontend does NOT compute meaning

---

## FAILURE

* frontend builds scene
* frontend filters data

---

# 10. STATE MANAGEMENT

---

## REQUIRED

System MUST track:

* active scope
* active engine
* active filter
* current scene
* selected object

---

## RULE

```text
State must be deterministic and restorable.
```

---

# 11. LIVE DATA & LOCATION-TIME AUTHORITY

---

## RULE

```text
Above Me scene truth MUST come from live provider-backed, normalized backend data
for the active location and current time context.
```

---

## REQUIRED

* scene/object outputs are assembled from provider-ingested backend data, not static `MOCK_*` datasets
* active location (`lat`, `lon`, `elevation_ft`) is a real scene input for Above Me
* time context affects visibility/relevance decisions where applicable
* degraded mode is explicit when provider-backed inputs are unavailable

---

## PROVIDER BASELINE (PHASE 2)

* Open-Meteo — observing conditions input
* Satellite provider chain (authoritative order):

  * Space-Track — primary satellite orbital catalog when credentials are configured
  * CelesTrak — public satellite TLE/orbital baseline
  * SatNOGS — public alive-satellite catalog fallback
  * N2YO — location-aware satellite-above fallback when API key is configured
  * TLE API (`tle.ivanstanojevic.me`) — public catalog fallback
  * g7vrd pass API — location-aware pass-candidate fallback
  * WhereTheISS — last-resort ISS-only fallback

* OpenSky Network — flight tracking input
* JPL/NASA ephemeris data — Sun/planet/moon positional input
* NOAA SWPC — space-weather/alert input
* NASA Images API — media enrichment only (not scene truth authority)

Satellite objects must expose `provider_source` matching the active source path
(for example: `space_track`, `celestrak`, `satnogs`, `n2yo`, `tle_api`, `g7vrd`, `wheretheiss`).

---

## FAILURE

* static mock datasets remain authoritative scene truth in runtime
* Above Me output is effectively location/time-insensitive
* provider failure silently returns static success payloads

---

# 12. PERFORMANCE MODEL

---

## REQUIRED

* only active scene computed
* no preloading all scopes
* no full dataset rendering

---

## FAILURE

* system computes unused scenes
* system slows with scope changes

---

# 13. TESTING

---

## REQUIRED

* scope switching works
* engine switching works
* filter switching works
* scene updates correctly
* no stale state
* object detail works across all contexts

---

# 14. ANTI-SCOPE

Phase 2 MUST NOT include:

* immersive 3D systems
* prediction systems
* personalization
* knowledge graph systems

---

# 15. COMPLETION RULE

Phase 2 is COMPLETE ONLY IF:

```text
- scope system works
- engine system works
- filter system works
- scenes are deterministic
- UI controls context correctly
- pipeline is enforced
- no Phase 3 leakage
```

---

# FINAL STATEMENT

```text
Phase 2 transforms Astronomy Hub into a true system:
user-controlled context with system-controlled meaning.
```

---

# 16. PHASE 2 CORRECTIVE EXTENSION (MANDATORY — APPENDED)

This section is appended to close execution-critical gaps discovered after Phase 1 and early Phase 2 work.

These additions are authoritative.

If any earlier wording conflicts with this section, this section governs.

---

# 17. DATA INGESTION SYSTEM (REQUIRED BEFORE ENGINE SCENE GENERATION)

## RULE

```text
No engine scene generation work is valid until the live data ingestion path exists.
```

---

## REQUIRED INGESTION PIPELINE

```text
Provider → Adapter → Normalizer → Validator → Cache → Engine Input → Scene
```

---

## REQUIRED COMPONENTS

### 17.1 Provider Clients

Phase 2 MUST implement provider-backed runtime clients for the domains it surfaces.

### 17.2 Adapter Layer

Raw provider payloads MUST be converted into stable internal intermediate structures before scene use.

### 17.3 Normalizer Layer

Provider-specific structures MUST be normalized into canonical Astronomy Hub contracts.

### 17.4 Validator Layer

Malformed, incomplete, stale, or invalid provider payloads MUST be rejected or marked degraded before they reach engines.

### 17.5 Cache Layer

Cache MUST exist between provider ingestion and engine consumption.

Cache behavior MUST be provider-aware and time-sensitive.

### 17.6 Engine Input Binding

Engines MUST consume normalized provider-backed inputs only.

---

# 18. PROVIDER RESPONSIBILITY MAP (AUTHORITATIVE)

The following provider-to-domain mapping is mandatory for Phase 2 baseline implementation.

--- ENGINE → PROVIDER BINDING (NEW) ---

Conditions Engine:
- Open-Meteo (primary)
- NOAA (context)
- Moon data (Solar System Engine dependency)

Satellite Engine:
- Space-Track (primary if available)
- CelesTrak (baseline)
- SatNOGS / N2YO / fallbacks

Solar System Engine:
- JPL / NASA Ephemeris (authoritative)

Deep Sky Engine:
- Local catalog (Messier Phase 2)
- Computation-based (no provider authority)

Sun Engine:
- NASA DONKI (events)
- NOAA SWPC (alerts)
- Helioviewer (imagery)

Flight Engine:
- OpenSky Network (primary)

Transient Events Engine:
- static datasets (Phase 2)
- NeoWs (Phase 3+)

## 18.1 Open-Meteo

Used for:

* observing conditions
* cloud cover
* visibility-related conditions where available
* general weather context used by Above Me / Earth decision surfaces

## 18.2 Satellite Provider Chain (Authoritative Order)

Used for:

* satellite TLE / orbital source data
* visible pass candidate generation input
* satellite identity baseline and fallback continuity

Execution order:

1. Space-Track (if credentials available)
2. CelesTrak
3. SatNOGS
4. N2YO (if API key available and location provided)
5. TLE API (`tle.ivanstanojevic.me`)
6. g7vrd pass API (location-aware pass candidates)
7. WhereTheISS (ISS-only last resort)

Credential gates:

* Space-Track requires `SPACE_TRACK_IDENTITY` (or `SPACE_TRACK_USERNAME`) and `SPACE_TRACK_PASSWORD`
* N2YO requires `N2YO_API_KEY`

## 18.3 OpenSky Network

Used for:

* live aircraft tracking
* flight differentiation in Above Me and Flights scope

## 18.4 JPL / NASA Ephemeris Data

Used for:

* Sun position
* Moon position
* planetary position
* time-based solar-system positional truth

## 18.5 NOAA SWPC

Used for:

* space weather context
* solar / geomagnetic alert input
* aurora / disturbance-related decision context where applicable

## 18.6 NASA Images API

Used for:

* media enrichment only
* object imagery support only

NASA Images API MUST NOT be treated as scene-truth authority.

---

# 19. ENGINE DATA LAW (CORRECTIVE REWRITE)

The earlier phrase “Each engine defines its dataset” must be interpreted narrowly and corrected as follows:

```text
Engines define their domain authority, valid filters, and transformation logic.

Engines do NOT invent runtime truth.
Engines do NOT fabricate datasets.
Engines do NOT use mock data as production authority.
```

---

## REQUIRED RULE

```text
Engines transform normalized provider-backed data into scene-ready meaning.
```

---

## REQUIRED ENGINE OUTPUT LAW

```text
Engines MUST return scene-ready structured outputs,
not raw object lists and not raw provider payloads.
```

Engine outputs MUST be:

* filtered
* grouped where applicable
* reasoned
* compatible with scene merge/orchestration
* detail-compatible without duplicating full detail payload

---

## FAIL CONDITIONS

* engine-local static runtime dataset treated as authority
* synthetic object generation presented as live truth
* raw provider payload reaches scene directly
* scene truth cannot be traced to provider-backed ingestion

---

# 20. ABOVE ME ORCHESTRATION LAW (NEW)

Above Me is the core Phase 1 and Phase 2 product surface.

It MUST be treated specially.

## RULE

```text
Above Me is not a normal single-domain engine.
Above Me is a scene orchestrator that merges multiple engine-authoritative inputs.
```

---

## ABOVE ME RESPONSIBILITIES

Above Me MUST:

* consume outputs from the relevant engines / normalized inputs
* apply global visibility constraints
* apply time relevance constraints
* apply observing relevance constraints
* rank cross-domain objects into one decision scene
* preserve the Phase 1 decision-support surface instead of degrading into a merged raw feed

---

## ABOVE ME MUST NOT

* become a hidden god-engine with its own disconnected truth system
* bypass engine/domain authority
* fabricate objects outside provider-backed / normalized inputs
* behave like a silent extra engine with unowned rules

---

# 21. ENGINE BOUNDARY LAW (NEW)

```text
Each engine has exclusive domain authority.
```

---

## REQUIRED

* Earth engine owns Earth-domain conditions/context
* Satellite engine owns satellite-domain truth
* Flight engine owns aircraft-domain truth
* Solar / Solar System engine owns Sun, Moon, and planet positional truth within its defined authority
* Deep Sky engine owns deep-sky object domain authority
* Event / Alert engine owns event/alert aggregation within its defined authority

---

## CROSS-ENGINE RULE

```text
Engines may not directly call one another to create truth.
Cross-engine interaction must occur through normalized contracts and scene orchestration.
```

---

## ENGINE REGISTRY RULE

```text
The engine registry MUST be centralized and explicit.
No ad hoc runtime engine creation is allowed.
```

---

# 22. SCENE AUTHORITY LAW (PHASE 1 GAP FIX)

Phase 1 established scene authority conceptually. Phase 2 MUST hard-lock it structurally.

## RULE

```text
All surfaced objects MUST originate from Scene.
No system component may bypass Scene construction.
```

---

## REQUIRED

* no direct engine → UI object exposure
* no object surface outside scene
* no detail route reachable for unsurfaced synthetic placeholder entities
* all scene-visible meaning must be backend-authored before frontend rendering

---

# 23. RAW DATA BOUNDARY LAW (PHASE 1 GAP FIX)

## RULE

```text
Raw provider data MUST NOT exist outside:
- provider client layer
- adapter layer
- normalizer / validator layer
```

---

## REQUIRED

* no raw provider payloads in engine outputs
* no raw provider payloads in scene contracts
* no frontend fallback parsing of upstream formats

---

# 24. FILTER POSITION LAW (EXPANDED)

The original filter model is insufficiently precise unless filter responsibility is separated.

## FILTER LAYERS

### 24.1 Engine-Level Filters

Used for:

* domain-specific narrowing
* valid domain subsets
* source-specific relevance selection

### 24.2 Scene-Level Filters

Used for:

* cross-domain relevance
* visibility
* time relevance
* decision compression / surfaced object limiting

---

## RULE

```text
Engine-level filters and scene-level filters must not duplicate or conflict.
```

---

# 25. LOCATION / TIME INPUT LAW (EXPANDED)

## REQUIRED INPUTS

At minimum, Phase 2 runtime authority MUST include:

* latitude
* longitude
* elevation_ft
* current time context
* timezone-aware display context where needed

---

## RULE

```text
Location and time are not decorative inputs.
They are scene-determining inputs.
```

---

## REQUIRED EFFECT

Materially different valid location/time input MUST be able to produce materially different scene output where the domain should differ.

---

## TIME GRANULARITY RULE

Each engine MUST declare its effective time resolution, such as:

* real-time
* minute-level
* hourly
* daily

This MUST be consistent with provider freshness and scene expectations.

---

# 26. SCENE DETERMINISM CONTRACT (EXPANDED)

The phrase “same inputs → identical scene” is incomplete unless inputs are fully defined.

## REQUIRED DETERMINISM INPUT SET

A Phase 2 scene is determined by:

* location
* time context
* provider snapshot / cached provider state
* scope
* engine
* filter
* validated system rules / ranking logic version
* engine contract version where applicable

---

## RULE

```text
If all scene inputs are the same, the scene must be identical.
If a scene differs, at least one input difference must be explainable.
```

---

## STATE EXTENSION RULE

Phase 2 state MUST also be able to preserve or reference:

* provider snapshot identity or freshness state
* ranking logic version
* degraded/live state

This is required for deterministic replay and debugging.

---

# 27. NORMALIZED DATA CONTRACTS (NEW)

Phase 2 MUST define canonical normalized contracts for the runtime domains it uses.

## REQUIRED CONTRACT DOMAINS

* observing / conditions contract
* satellite contract
* flight contract
* solar / solar-system positional contract
* deep-sky object contract
* scene object contract
* scene contract

---

## REQUIRED SCENE CONTRACT

Every scene MUST include:

* title
* summary
* grouped objects
* reasoning
* time context
* conditions context where applicable
* scene freshness/degraded state where applicable

---

## MINIMUM OBJECT CONTRACT EXTENSION

Every surfaced runtime object MUST include, directly or derivably:

* stable id
* canonical name
* object type
* engine owner
* position context
* time relevance
* reason for inclusion
* detail route
* source provider attribution
* freshness / fetched context

---

# 28. OBJECT IDENTITY LAW (EXPANDED)

Stable IDs were already required.

This section extends that requirement.

## RULE

```text
All runtime objects must have globally unique, deterministic, cross-session-stable identity.
```

---

## REQUIRED ID BASIS

IDs SHOULD be based on:

* engine namespace
* provider identity when available
* normalized canonical identity

---

## CROSS-SCOPE CONSISTENCY RULE

```text
The same real-world entity must preserve identity across scopes unless a documented identity transformation rule exists.
```

---

## FAIL CONDITIONS

* same entity gets different IDs between runs without cause
* detail routing breaks because IDs are unstable
* scope changes create identity drift
* future graph linkage would be impossible because identity is underspecified

---

# 29. OBJECT REALITY LAW (PHASE 1 GAP FIX)

## RULE

```text
A surfaced object represents a real-world entity or a canonically modeled astronomical/domain entity,
not a UI convenience construct.
```

---

## REQUIRED

Objects MUST:

* map to real domain truth
* not exist solely as presentation groupings
* not be synthetic placeholders masquerading as domain truth

---

# 30. VISIBILITY / RELEVANCE LAW (NEW)

Phase 2 currently requires filters and scene meaning.

This section defines core visibility expectations for Above Me and similar scene logic.

## REQUIRED FACTORS

Where applicable, visibility / inclusion MUST be computed using:

* altitude above horizon
* time context
* observing conditions context
* object-type relevance rules
* magnitude / brightness thresholds or equivalent domain thresholds where applicable

---

## RULE

```text
Objects that fail core visibility / relevance thresholds must not appear merely because they exist in a dataset.
```

---

# 31. SCENE LIMITING LAW (PHASE 1 GAP FIX)

Phase 1 required limited surfaced object count. Phase 2 must preserve that law.

## RULE

```text
Scenes MUST limit surfaced objects based on relevance, visibility, and priority.
Full datasets must never be exposed as the scene.
```

---

## REQUIRED

* decision compression
* surfaced subset selection
* prioritized grouping
* no undifferentiated object dumping

---

# 32. RANKING / PRIORITIZATION LAW (NEW)

Phase 1 and Phase 2 require decision-oriented scenes.

That is not possible without deterministic ranking.

## RULE

```text
Scene ranking must follow explicit, deterministic scoring logic.
```

---

## REQUIRED

Engines / scene logic MUST support:

* base relevance
* time relevance modifiers
* conditions modifiers
* visibility modifiers
* event urgency modifiers where applicable

Above Me MUST merge these into one deterministic ranked scene.

---

## DECISION-SUPPORT CARRYOVER LAW

Every engine-visible scene MUST remain decision-support oriented by producing:

* top items
* prioritized groups
* reasoning
* what matters now / soon framing where applicable

Phase 2 MUST NOT regress into a data browser.

---

# 33. PROVIDER CONFLICT / FRESHNESS RULES (NEW)

## REQUIRED

When provider-backed inputs conflict, the system MUST have explicit resolution rules.

---

## RULE

```text
Provider conflict resolution must be deterministic, documented, and traceable.
```

---

## MINIMUM EXPECTATION

* prefer freshest valid authoritative source for the domain
* reject malformed or stale inputs that would silently distort truth
* log and mark degraded state when conflict resolution materially affects output

---

# 34. CACHE LAW (EXPANDED)

Phase 2 already assumes performance control.

This section makes caching explicit.

## REQUIRED

Cache MUST be:

* provider-specific
* TTL-based
* refresh-capable
* safe against stale success masquerading as live truth

---

## RULE

```text
Cache exists to preserve performance, not to replace reality.
```

---

# 35. PRECOMPUTE / SCENE COMPUTE SEPARATION LAW (NEW)

## REQUIRED

The system MUST distinguish between:

### Precompute / background work

* provider ingestion
* normalization
* validation
* caching
* summary preparation where appropriate

### Scene-time computation

* filter application
* visibility calculation
* relevance scoring
* scene grouping
* surfaced object selection

---

## RULE

```text
The system precomputes provider truth preparation,
but computes scene meaning at scene time.
```

---

# 36. DEGRADED MODE LAW (EXPANDED)

Phase 2 already says degraded mode must be explicit.

This section defines the minimum standard.

## REQUIRED

The system MUST explicitly distinguish between:

* live success
* cached-but-valid success
* degraded partial data
* provider failure

---

## FAILURE SEVERITY RULE

Failures MUST be classified as:

* HARD failure: scene cannot be validly computed
* SOFT failure: partial truth available; degraded scene still valid if explicitly marked

---

## REQUIRED OUTPUT / STATE FIELDS

At minimum, scene/system state MUST be able to express:

* `is_live`
* `is_degraded`
* `missing_sources`
* `fallback_reason`
* freshness / fetched context
* failure severity where applicable

---

## FAIL CONDITION

```text
Provider failure must never silently appear as normal success.
```

---

# 37. TRACEABILITY / OBSERVABILITY LAW (NEW)

## TRACEABILITY RULE

```text
Every Phase 2 scene must be traceable back to its provider-backed input path.
```

---

## OBSERVABILITY RULE

The backend MUST log enough information to diagnose:

* provider request success/failure
* cache hits/misses
* degraded mode activation
* input freshness issues
* scene generation path by scope / engine / filter

---

# 38. REALITY VALIDATION LAW (NEW)

## RULE

```text
The system MUST include backend-side reality checks that catch physically implausible or contract-invalid outputs before they are treated as valid truth.
```

---

## EXAMPLES

Where applicable, validation SHOULD catch:

* impossible positional outputs
* invalid time alignment
* broken identity mappings
* stale orbital/ephemeris usage beyond acceptable freshness bounds

---

# 39. FRONTEND TRUST BOUNDARY (EXPANDED)

Phase 2 already says frontend does not compute meaning.

This section extends that prohibition.

## FRONTEND MUST NOT

* reorder objects in ways that alter meaning
* apply hidden filtering
* create fallback reasoning
* reshape degraded/live meaning into something else
* infer provider truth locally
* merge cross-engine truth
* reinterpret categories or grouping

---

## RULE

```text
Frontend renders authoritative meaning.
It does not repair, reinterpret, or replace backend truth.
```

---

# 40. PIPELINE BREAK DETECTION LAW (NEW)

## RULE

```text
If any step in Scope → Engine → Filter → Scene is bypassed,
the system is INVALID.
```

---

## REQUIRED

* every surfaced scene must be explainable through the pipeline
* every surfaced object must be explainable through the scene
* every detail route must connect back to object identity and scene authority

---

# 41. PHASE 1 RETROACTIVE CORRECTION NOTES

Because Phase 1 can validly exist before full live-data wiring, Phase 2 must close the following inherited gaps from Phase 1:

## PHASE 1 GAPS CLOSED BY PHASE 2

* explicit live ingestion path
* runtime mock retirement
* location/time material scene authority
* provider traceability
* deterministic provider-backed Above Me truth
* hard scene authority enforcement
* raw data boundary enforcement
* scene limiting preservation
* decision-support preservation under multi-engine expansion

---

# 42. TESTING LAW (EXPANDED)

In addition to the original Phase 2 testing requirements, Phase 2 MUST verify:

* provider ingestion works
* normalization contracts are valid
* invalid provider data is rejected or degraded
* location materially affects output
* time materially affects output
* same fully defined inputs produce same scene
* different provider snapshot or freshness state is explainable
* degraded mode triggers correctly
* no runtime mock data remains
* frontend does not reinterpret backend meaning

---

# 43. COMPLETION RULE (EXTENDED)

In addition to all earlier completion requirements, Phase 2 is COMPLETE ONLY IF:

```text
- ingestion pipeline exists and is runtime-authoritative
- provider responsibilities are implemented and traceable
- Above Me is provider-backed, location-aware, and time-aware
- engines transform truth instead of inventing it
- runtime mocks are retired
- determinism is provable against fully defined inputs
- degraded mode is explicit
- frontend does not reinterpret backend truth
- all surfaced objects still originate from scene
- all engines implemented according to their specification documents
- all engine outputs conform to defined output contracts
- no engine operates without a spec-backed implementation
- scenes remain decision-support surfaces rather than dataset browsers
```

---

# 44. FINAL CORRECTIVE RULE

```text
A Phase 2 system that is architecturally clean but not reality-backed is still INVALID.
```

```
