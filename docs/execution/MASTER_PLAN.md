# MASTER PLAN — PRODUCT REFERENCE

## 1. Purpose

This document defines the full long-term product scope of Astronomy Hub.

It answers:

- what the system must eventually include
- what domains exist
- what capabilities are expected
- how the major product surfaces relate to each other

This document does not:

- define current work
- define current branch
- define execution order
- authorize implementation
- override validation requirements
- override current runtime reality

Execution is controlled by:

- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/PROJECT_STATE.md`
- `docs/MASTER_PLAN.md` only when explicitly used as execution control by current docs
- task-specific execution documents

Validation is controlled by:

- `docs/validation/SYSTEM_VALIDATION_SPEC.md`

Operating rules and override modes are controlled by:

- `AGENTS.md`

---

## 2. Product Model

Astronomy Hub is a real-time, multi-engine astronomy intelligence system.

Primary user question:

- What is above me right now, and what should I observe?

Core interaction model:

- Hub → Engine → Scene → Object → Detail → Exploration

Core architecture model:

- Scope → Engine → Filter → Scene → Object → Detail → Assets

Core data model:

- Ingestion → Normalization → Storage → Cache → API → Client Rendering

Final product principle:

- Engines define reality.
- The Hub defines importance.
- The viewport renders the active truth.
- The API must not fake truth.

---

## 3. Current Runtime Anchor

The active ORAS sky runtime is:

- `/oras-sky-engine/`

This is the ORAS-hosted Stellarium Web / Stellarium Web Engine runtime.

It is a contained runtime inside Astronomy Hub.

It is not the old `/sky-engine` BabylonJS target.

It must not be replaced, converted, or merged into a Hub-owned renderer unless a future approved architecture decision explicitly changes direction.

Current product work may include:

- improving `/oras-sky-engine/`
- improving source-backed data
- improving `/api/above-me`
- improving exact links into `/oras-sky-engine/`
- improving survey imagery
- preparing future API-first WordPress/ORAS surfaces

This document remains product reference only. It does not start any of those tasks by itself.

---

## 4. Primary User Goal

The primary goal is to help a user make an observing decision.

The system should answer:

- What is visible now?
- What is worth observing?
- Where is it?
- How good is it tonight?
- What engine or view should I open?
- What details matter?
- What events or alerts should I know about?

The output should be:

- curated
- ranked
- location-aware
- time-aware
- source-backed
- decision-ready

The output should not be:

- a raw data dump
- a fake sky simulation
- an unbounded catalog list
- a disconnected UI panel
- a screenshot without runtime truth

---

## 5. Product Domains

These define full product scope.

They do not define build order.

---

## 6. Command Center / Hub

The Command Center is the main decision surface.

It should eventually include:

- Above Me decision surface
- curated object cards
- observing recommendations
- conditions summaries
- alerts and events
- selected location/time controls
- active engine routing
- controlled viewport or engine link behavior
- saved preferences where appropriate

The Hub must remain a decision layer.

The Hub must not:

- render full engine scenes directly
- own engine render loops
- duplicate engine calculations
- fake object visibility
- hardcode production object lists
- overwhelm the user with raw catalogs

Expected future flow:

- Hub requests ranked objects from `/api/above-me`
- Hub displays curated results
- user selects an object
- object opens in the correct engine/detail surface
- `/oras-sky-engine/` opens centered when the object belongs in the sky runtime

---

## 7. ORAS Sky Engine

The ORAS Sky Engine is the sky-facing runtime surface.

Current active surface:

- `/oras-sky-engine/`

Current runtime lineage:

- Stellarium Web / Stellarium Web Engine

Long-term Sky Engine capabilities include:

- stars
- constellations
- visible planets
- Moon and Sun
- deep sky objects
- satellites
- survey imagery
- object search
- object selection
- object detail panels
- direct exact links
- camera centering and focus
- observer/time/location control
- high-definition sky imagery where available
- safe fallback imagery where needed

The Sky Engine must remain:

- runtime-owned
- source-backed
- behaviorally stable
- isolated from Hub rendering ownership

The Sky Engine must not:

- be converted into a generic Hub renderer
- be rewritten as a React-owned scene without explicit approval
- be replaced by BabylonJS without an explicit approved architecture change
- receive fake coordinates or fake object identities
- depend on hand-registered production catalogs

---

## 8. Scene Rendering

Scene rendering belongs to the active primary engine.

Rendering requirements:

- viewport reflects active engine
- only one primary scene is active at a time
- active engine controls rendering behavior
- active engine controls camera/selection behavior
- Hub hosts or links to engines through thin interfaces
- Hub does not become a universal rendering core

For the ORAS Sky Engine, rendering is owned by the contained Stellarium runtime.

Future non-Sky engines may use other rendering technology only when explicitly authorized by the current architecture and execution documents.

---

## 9. Above Me Orchestration

Above Me orchestration is the main intelligence layer.

It should eventually aggregate and rank:

- stars
- planets
- Moon/Sun
- DSOs
- satellites
- visible comets/asteroids
- notable events
- conditions-aware recommendations

The orchestration layer should consider:

- observer location
- time
- altitude/azimuth
- visibility
- magnitude/brightness
- object type
- observing difficulty
- event relevance
- conditions
- user preferences
- public-night usefulness

The orchestration layer must be:

- bounded
- curated
- source-backed
- API-driven

It must not:

- return a raw object flood
- fake visibility
- fake coordinates
- pretend unsupported objects are available
- duplicate engine internals in UI code

Primary API direction:

- `/api/above-me`

---

## 10. Conditions Intelligence

Conditions Intelligence should eventually include:

- cloud cover
- seeing
- transparency
- humidity
- wind
- temperature
- moon illumination impact
- smoke/haze where available
- visibility scoring
- observing-quality explanation

It should answer:

- Is tonight good?
- What objects are practical?
- What should wait?
- What conditions are limiting observation?

Conditions data must be source-backed and time/location-aware.

---

## 11. Satellite Intelligence

Satellite Intelligence should eventually include:

- satellite identity
- visible satellites
- visible passes
- ISS/HST priority
- Starlink grouping/capping
- pass prediction windows
- TLE freshness
- orbital behavior
- exact links into Sky Engine where applicable

Rules:

- TLE identity must be source-backed.
- Propagation must use validated propagation.
- No fake RA/Dec.
- No fake alt/az.
- No fake visibility.
- Starlink must not dominate curated output.

---

## 12. Flight Awareness

Flight Awareness should eventually include:

- aircraft identification
- overhead awareness
- location-aware flight context
- sky/earth relationship where appropriate
- optional alerts or filtering

Architectural relationship:

- Earth
  - Satellite
  - Flight
  - Conditions

Flight must not be flattened into an unrelated top-level system.

---

## 13. Solar System Context

Solar System Context should eventually include:

- planets
- Moon
- Sun
- orbital relationships
- conjunctions
- oppositions
- elongation
- moon phase
- rise/set and visibility
- spatial understanding
- links into Sky Engine or future Solar System Engine where appropriate

Solar-system positions must be source-backed.

No stubbed ephemeris.

No fake coordinates.

---

## 14. Deep Sky Targeting

Deep Sky Targeting should eventually include:

- galaxies
- nebulae
- open clusters
- globular clusters
- planetary nebulae
- supernova remnants
- object aliases
- observing difficulty
- magnitude
- angular size
- constellation
- descriptions
- DSO media/thumbnails
- catalog cross-links

Current/future catalog direction includes:

- OpenNGC
- Messier compatibility
- Caldwell aliases
- optional HyperLeda/SIMBAD/NED enrichment where permitted
- DSO image/media manifest

Deep Sky Targeting must be catalog-backed, not hand-registered.

---

## 15. Star Data and Stellar Context

Star capabilities should eventually include:

- bright stars
- named stars
- Hipparcos support
- Gaia-derived support
- magnitude-limited display
- zoom-aware loading
- exact links
- stable source IDs
- star detail panels
- color/magnitude/classification where available

Future direction:

- Gaia DR3 or EDR3 tiled/indexed star pipeline
- no giant browser JSON dump
- no JavaScript corruption of large source IDs
- no hand-registered production star list

---

## 16. Survey Imagery and Visual Quality

Survey imagery should eventually support:

- safe full-sky fallback
- higher-definition imagery where available
- survey provider selection where approved
- smart provider defaults
- coverage-aware fallback
- visual validation across representative targets

Current/future imagery direction:

- DSS as safe full-sky fallback
- Pan-STARRS-style high-definition providers where validated
- other upstream HiPS/survey sources when appropriate
- DESI parked unless explicitly approved

Rules:

- do not scrape Stellarium-Web
- do not copy Stellarium CDN data
- do not pretend partial coverage is full coverage
- do not make a provider default without fallback validation
- do not bake huge survey datasets into Docker without explicit approval

---

## 17. Solar Activity

Solar Activity should eventually include:

- sunspots
- solar flares
- solar events
- aurora-relevant activity where appropriate
- safe solar observation context
- source-backed event/condition data

This must be handled carefully and must not encourage unsafe solar viewing.

---

## 18. Events and Alerts

Events and Alerts should eventually include:

- meteor events
- eclipses
- conjunctions
- occultations
- bright comet events
- notable satellite passes
- transient phenomena
- aurora-relevant alerts where appropriate
- public-night relevant event summaries

Alerts must be:

- source-backed
- time/location-aware where applicable
- explainable
- bounded

---

## 19. Object Detail System

Object Detail should eventually include:

- object-specific data
- identity and aliases
- catalog source
- coordinates
- visibility
- magnitude/size
- type/class
- descriptions
- observing notes
- related objects
- cross-engine navigation
- external source links where appropriate
- images/media where licensed or permitted

Object detail must preserve authoritative identity:

- catalog
- source_id
- model

Aliases are secondary.

Display names are cosmetic.

---

## 20. News and Knowledge

News and Knowledge should eventually include:

- scientific updates
- mission data
- observational context
- educational explanations
- event background
- object-related knowledge

This layer must not override source-backed astronomical truth.

News and knowledge should enrich decisions, not fabricate object data.

---

## 21. Asset and Data Reliability

The system must support reliable data operations.

Expected capabilities:

- ingestion integrity
- normalization
- source traceability
- deterministic outputs
- cache strategy
- data freshness checks
- validation reports
- skipped/unsupported record reporting
- safe degraded states

Large astronomy data should be:

- mounted
- cached
- tiled
- indexed
- externally served
- streamed on demand where appropriate

Large astronomy data should not be baked into Docker unless explicitly approved.

---

## 22. Performance and Stability

The system must remain responsive.

Performance goals:

- bounded API responses
- bounded catalog scans
- cached or indexed large data
- no raw object floods
- no blocking massive frontend data loads
- no unnecessary Docker image bloat
- stable runtime asset deployment
- safe shell/index refresh behavior
- no stale asset white-screen failures

Runtime stability is part of product quality.

A feature that works only once, only locally, or only with stale cache is not complete.

---

## 23. WordPress / ORAS Public Integration

The future WordPress/ORAS public feature should be API-first.

Expected flow:

- WordPress shortcode or page calls `/api/above-me`
- page renders curated object cards
- each object links to `/oras-sky-engine/`
- Sky Engine opens centered on the object
- output is useful for public visitors and observatory guests

WordPress must not:

- hardcode astronomy objects
- duplicate visibility calculations
- scrape Sky Engine
- depend on Sky Engine internals
- fake object availability

This feature is not active until explicitly approved.

---

## 24. Completion Rule

A feature is complete only if:

- it works in runtime
- behavior is correct
- results are meaningful
- output supports user decisions
- architecture boundaries are preserved
- data is source-backed
- validation is proven

If validation is missing, status is not REAL.

Allowed status values:

- REAL
- PARTIAL
- FAKE
- BLOCKED

---

## 25. Non-Goals

This document does not:

- define current work
- define current priority
- authorize scope expansion
- override execution constraints
- override `LIVE_SESSION_BRIEF.md`
- override `SYSTEM_VALIDATION_SPEC.md`
- override `AGENTS.md`
- activate WordPress implementation
- activate Hub homepage implementation
- activate any engine rewrite

---

## 26. Final Principle

The Master Plan defines what the product may eventually include.

Execution documents decide what is built.

Validation decides what is true.

Runtime evidence proves completion.
