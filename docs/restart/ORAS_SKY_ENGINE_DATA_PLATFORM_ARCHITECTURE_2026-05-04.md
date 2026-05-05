# ORAS Sky-Engine Data Platform Architecture — 2026-05-04

## Scope

This document defines the authoritative ORAS-owned data platform architecture for the current ORAS Sky-Engine runtime.

It preserves the existing renderer decision:

- the vendored ORAS Sky-Engine runtime remains the renderer
- the Hub host remains a thin runtime boundary
- same-origin static skydata under `/oras-sky-engine/skydata` remains valid

It does not authorize:

- a new renderer
- Babylon reintroduction into the React host boundary
- frontend-owned Gaia-scale catalog loading
- rendering logic in Postgres
- final dependence on `stellarium-web.org`
- full Gaia import in this task

This architecture follows the current system laws:

- `Scope → Engine → Filter → Scene → Object → Detail`
- `Ingestion → Normalization → Storage → Cache → API → Client Rendering`

## Current Repo / Runtime State

### 1. Current backend framework and app entrypoint

- framework: FastAPI
- canonical runtime app: `backend.app.main:app`
- source entrypoint: `/home/rocco/Astronomy-Hub/backend/app/main.py`
- root dev command from `/home/rocco/Astronomy-Hub/package.json`: `python3 -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000`

Current backend route set is under `/api/v1` and includes:

- `/health`
- `/conditions`
- `/scene`
- `/scene/above-me`
- `/scene/sky/star-tiles/manifest`
- `/object/{object_id}`
- `/location/search`
- `/targets`
- `/passes`
- `/alerts`
- `/news`
- `/assets/{asset_key}`

There is no current ORAS sky catalog search API such as `/api/sky/search` or `/api/sky/catalog/status`.

### 2. Current database / Postgres setup

- authoritative runtime container: PostGIS on PostgreSQL 16 via `postgis/postgis:16-3.4`
- compose service: `postgres`
- compose database: `astronomy_hub`
- compose credentials: `postgres/postgres`
- compose port mapping: `15433:5432`
- backend runtime env in compose points to `postgresql+psycopg2://postgres:postgres@postgres:5432/astronomy_hub`

Current cache layer:

- Redis 7 via compose service `redis`

### 3. Current migration tooling

- migration tool: Alembic
- config: `/home/rocco/Astronomy-Hub/alembic.ini`
- env: `/home/rocco/Astronomy-Hub/alembic/env.py`
- model metadata source: `/home/rocco/Astronomy-Hub/backend/app/db/models.py`

Current migration history is minimal:

- `0001_initial_noop`
- `0002_spatial_model_foundation`
- `0003_asset_metadata_foundation`

Current DB model footprint is foundational only:

- `spatial_features`
- `asset_metadata`

There is no current Gaia, sky object, satellite element, survey catalog, import job, or data health schema.

### 4. Current static skydata layout currently served

Same-origin static runtime path:

- runtime shell: `/oras-sky-engine/`
- embedded route: `/sky-engine`
- skydata root: `/oras-sky-engine/skydata`

Current synced bundle under `/home/rocco/Astronomy-Hub/frontend/public/oras-sky-engine/skydata` contains:

- `stars/`
- `dso/`
- `surveys/`
- `landscapes/`
- `skycultures/`
- `mpcorb.dat`
- `CometEls.txt`
- `tle_satellite.jsonl.gz`

Current served survey subtrees:

- `surveys/milkyway/`
- `surveys/sso/`

Current SSO survey directories:

- `sun/`
- `moon/`
- `mercury/`
- `venus/`
- `mars/`
- `jupiter/`
- `saturn/`
- `uranus/`
- `neptune/`

### 5. Current bundled star / DSO / satellite files

Current bundle status:

- stars: `stars/properties`, `stars/Norder0/`, `stars/Norder1/`
- DSO: `dso/properties`, `dso/Norder0/`
- satellites: `tle_satellite.jsonl.gz`
- small-body bundles: `mpcorb.dat`, `CometEls.txt`

Current runtime also still serves:

- landscapes
- skycultures
- Milky Way imagery
- SSO survey imagery

### 6. Current runtime object-search behavior

Current search behavior is still vendored-runtime-owned, not backend-owned.

Current search UI path:

- vendored component: `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/web-frontend/src/components/skysource-search.vue`

Current lookup logic:

- local runtime lookup helper: `/home/rocco/Astronomy-Hub/vendor/stellarium-web-engine/apps/web-frontend/src/assets/sw_helpers.js`
- runtime engine direct lookup uses `$stel.getObj(...)`
- object selection route inside the vendored runtime uses `/skysource/:name`

Current fallback rules:

- on `127.0.0.1` or `localhost`, search prefers local runtime fallback only
- local fallback covers solar system names plus direct `$stel.getObj(...)` attempts for names such as `NAME ...`, `M ...`, `NGC ...`, `IC ...`
- if not in local fallback mode, vendored code can call `VUE_APP_NOCTUASKY_API_SERVER + /api/v1/skysources/...`

Current ORAS backend does not provide those `skysources` endpoints.

Implication:

- current search is acceptable for bundled local object proofing
- ORAS still needs its own search API and runtime bridge plan for production-owned catalog search

### 7. Current same-origin route layout

Current browser route layout:

- `/` → Hub app
- `/progress` → progress page
- `/sky-engine` → React wrapper that mounts `RuntimeHost`
- `/oras-sky-engine/` → same-origin vendored ORAS runtime shell served from Vite static public assets

Current route files:

- router: `/home/rocco/Astronomy-Hub/frontend/src/routes/AppRouter.tsx`
- page wrapper: `/home/rocco/Astronomy-Hub/frontend/src/features/sky-engine/SkyEnginePage.tsx`
- runtime host: `/home/rocco/Astronomy-Hub/frontend/src/features/sky-engine/RuntimeHost.tsx`
- runtime discovery: `/home/rocco/Astronomy-Hub/frontend/src/features/sky-engine/stellarium/stellariumRuntimeDiscovery.ts`
- runtime probe: `/home/rocco/Astronomy-Hub/frontend/src/features/sky-engine/stellarium/stellariumRuntimeBridge.ts`

Current Vite behavior:

- proxies `/api` to FastAPI
- serves `/oras-sky-engine/` same-origin static assets
- still contains a legacy proxy rule for `/oras-sky-engine/remote-data`, but the current runtime no longer depends on it for bundled stars / DSO / comets / asteroids / satellites

## Architecture Decision

ORAS Sky-Engine will follow Stellarium’s proven pattern:

- runtime renderer
- static skydata / survey service
- object search API
- catalog backend
- update and import jobs

ORAS will improve that pattern by making the data platform ORAS-owned:

- self-hosted catalogs
- richer Gaia-backed search metadata
- stronger survey inventory and cache control
- better satellite refresh and normalization
- future flight layer
- ORAS-specific observing intelligence on top of the renderer

The vendored runtime remains the renderer. ORAS owns the data platform around it.

## Target Architecture

### A. Runtime Layer

- vendored ORAS Sky-Engine remains the renderer
- frontend consumes same-origin static skydata and backend APIs
- frontend does not own giant catalogs
- frontend does not load Gaia-scale tables into memory
- frontend remains a thin route / mount / bridge surface around the vendored runtime

Runtime responsibilities:

- render stars, DSO, surveys, satellites, and small bodies from prepared packs and caches
- call ORAS backend APIs for search, object detail, status, and catalog readiness
- preserve current same-origin `/oras-sky-engine/skydata` serving behavior until replacements are proven

### B. Static Skydata / Survey Layer

Purpose:

- serve large, versioned, mostly static data efficiently

Responsibilities:

- star tiles and generated runtime packs
- Milky Way and other survey imagery tiles
- landscapes
- skycultures and supporting runtime assets
- cached satellite runtime bundles
- future HiPS survey cache

Storage shape:

- local filesystem in dev
- object storage or CDN-backed object storage in deployed environments
- versioned directories for reproducible pack rollouts

Serve shape:

- same-origin static paths for runtime compatibility
- backend-managed metadata describing active pack versions and readiness

### C. Backend API Layer

Proposed ORAS-owned sky data endpoints:

- `GET /api/sky/catalog/status`
- `GET /api/sky/search?q=`
- `GET /api/sky/object/gaia-dr2/{source_id}`
- `GET /api/sky/cone?ra=&dec=&radius=`
- `GET /api/sky/surveys`
- `GET /api/sky/satellites`
- `GET /api/sky/flights/current`
- `GET /api/sky/data-health`

Design rules:

- return normalized ORAS contracts, not raw provider payloads
- backend owns meaning and readiness state
- responses stay small and query-shaped
- runtime fetches detail on demand

### D. Database Layer

Postgres owns searchable metadata and operational state.

Proposed tables:

- `catalog_sources`
- `gaia_dr2_sources`
- `sky_objects`
- `object_aliases`
- `survey_catalog`
- `satellite_catalog`
- `tle_snapshots` or `gp_snapshots`
- `flight_tracks` later
- `import_jobs`
- `data_health_checks`

Table intent:

- `catalog_sources`: describes upstream datasets, versions, licences, import scope, freshness
- `gaia_dr2_sources`: stores indexed Gaia DR2 source metadata required for search and detail
- `sky_objects`: ORAS-normalized object registry across catalogs
- `object_aliases`: alternate names, external identifiers, normalized search keys
- `survey_catalog`: available surveys, quality, coverage, cache state, tile roots
- `satellite_catalog`: normalized satellite identity metadata
- `tle_snapshots` or `gp_snapshots`: current orbital element snapshots with source timestamping
- `flight_tracks`: deferred, separate aircraft layer tables
- `import_jobs`: import / mirror / build job state and proofs
- `data_health_checks`: freshness checks, error states, readiness gates

Database rules:

- Postgres stores searchable metadata and operational state
- PostGIS is used where spatial search is needed
- Postgres is not the place for every image tile or every large binary star tile blob

### E. File / Object Storage Layer

Large blobs and tiles belong in filesystem or object storage, not in default Postgres rows.

Examples:

- Gaia / star tiles
- HiPS / survey tiles
- image tiles
- TLE / GP source files
- generated runtime packs

Storage rule:

- keep metadata and pointers in Postgres
- keep large binary tile / pack payloads in object storage or filesystem caches
- store raw tiles in Postgres only when there is a narrow, proven reason

### F. Import / Update Jobs

Planned job families:

- Gaia sample / proof import
- Gaia full import plan later
- survey mirror and cache jobs
- CelesTrak GP / SupGP ingest
- TLE update cadence
- OpenSky / ADS-B ingest later
- data health checks

Job responsibilities:

- fetch authoritative data
- validate source version and timestamp
- normalize into ORAS tables
- build static packs or cache indexes when needed
- emit readiness status for runtime and APIs

### G. Improvement Goals Over Public Stellarium Web

ORAS improvements are on the data and intelligence side, not the renderer side.

Target improvements:

- ORAS local observing modes
- stronger object search and ID resolution
- local horizon and obstruction metadata later
- public-night target planning
- satellite pass predictions
- aircraft overlay later
- offline and cache control
- controlled data versioning

These improvements wrap the Stellarium-derived runtime instead of replacing it.

## First Proof Slice

### Slice Name

`Local Gaia/Object Search Proof`

### Goal

Prove the minimum ORAS-owned catalog path without changing the current renderer.

### Required proof

- backend endpoint recognizes Gaia DR2 source IDs
- local data model can store Gaia DR2 source metadata
- status endpoint reports catalog readiness
- no dependency on public `stellarium-web.org`
- current runtime remains unchanged

### Primary test object

- `Gaia DR2 2252802052894084352`

### Current verified state

- this repository does not currently contain a verified local Gaia DR2 export row for source id `2252802052894084352`
- no local Gaia schema or importer exists yet
- the vendored runtime contains Gaia-aware naming logic, but not ORAS-owned indexed Gaia metadata

### Proof behavior for this slice

Until a verified local source export is available, the first proof slice should:

- add importer structure for Gaia DR2 source rows
- add a `gaia_dr2_sources` schema and readiness tracking
- implement `GET /api/sky/catalog/status`
- implement `GET /api/sky/object/gaia-dr2/{source_id}`
- return explicit `not indexed yet` for source ids not yet ingested

### Required source file / export

Do not fake coordinates.

The proof requires a verified Gaia DR2 source export containing at minimum:

- `source_id`
- `ra`
- `dec`
- optional quality and display metadata such as magnitude, parallax, and proper motion

Acceptable proof inputs:

- a small verified CSV / parquet / TSV export for the specific source id
- an archived ADQL export saved into ORAS-controlled import storage

### Acceptance criteria

- `GET /api/sky/catalog/status` reports Gaia catalog state as one of:
  - `missing`
  - `partial`
  - `ready`
- `GET /api/sky/object/gaia-dr2/2252802052894084352` validates the source id format
- if row absent, response is explicit and contract-valid: `not indexed yet`
- if row present later, response returns normalized ORAS Gaia detail without fabricated values
- current `/sky-engine` runtime behavior is unchanged

## Second Proof Slice

### Slice Name

`Satellite Data Upgrade`

### Goal

Upgrade satellites into an ORAS-owned ingest and cache path while preserving the current bundled runtime feed until replacement is proven.

### Target

- ingest CelesTrak GP / SupGP or TLE feeds into backend storage and cache
- serve normalized satellite catalog and current element snapshots
- preserve current bundled satellite runtime data until replacement is proven
- define update cadence and source format

### Planned shape

- `satellite_catalog` table for identity and display metadata
- `gp_snapshots` or `tle_snapshots` for current elements with source timestamps
- generated runtime bundle output for the vendored runtime when replacement path is ready

### Update cadence

- baseline cadence: multiple refreshes per day for active LEO data
- record source timestamp, ingest timestamp, and expiration state

### Acceptance criteria

- ORAS can ingest and store normalized GP / TLE snapshots
- `GET /api/sky/satellites` returns normalized current catalog summary
- data health reports snapshot freshness and source identity
- current bundled `tle_satellite.jsonl.gz` remains in place until ORAS replacement feed is validated

## Third Proof Slice

### Slice Name

`Survey Data Upgrade`

### Goal

Create ORAS-owned survey inventory and cache strategy before changing the current Milky Way runtime data.

### Target

- inventory current local survey data
- add survey catalog endpoint
- define HiPS / tile cache strategy
- identify first higher-quality survey to mirror or cache
- preserve current Milky Way data until replacement is proven

### Current baseline

- current bundled survey data includes `milkyway` and SSO survey imagery only
- DSS remote imagery is intentionally not required for current runtime success

### Proposed first higher-quality survey candidate

- first mirror / cache proof should target one survey with clear licensing and tiled access suitable for HiPS-style caching
- selection criteria should prioritize licensing clarity, visible quality gain, and runtime compatibility over total breadth

### Acceptance criteria

- `GET /api/sky/surveys` returns current survey inventory, source, cache state, and readiness
- ORAS defines active tile root and cache version metadata per survey
- current same-origin Milky Way data remains authoritative until replacement is proven

## Fourth Proof Slice

### Slice Name

`Flight Data Layer`

### Goal

Future-only feasibility work for aircraft data as a separate data layer.

### Target

- evaluate OpenSky / ADS-B data sources
- define backend cache behavior, rate limits, and licensing constraints
- keep flight data separate from satellites
- no implementation in this task

### Rules

- flight data is a separate layer and separate ingest chain
- do not mix aircraft identity or tracking state into the satellite catalog tables
- do not alter the current runtime for this slice

## Ordered Implementation Backlog

### 1. Backend catalog status endpoint

Acceptance criteria:

- `GET /api/sky/catalog/status` exists
- reports readiness for stars, Gaia metadata, surveys, satellites, and generated runtime packs
- returns deterministic ORAS contract output

### 2. Gaia DR2 schema / importer proof

Acceptance criteria:

- adds `gaia_dr2_sources`, `catalog_sources`, `import_jobs`, and `data_health_checks` migrations
- importer can load a verified small Gaia proof file
- no fabricated coordinates or magnitudes

### 3. Gaia DR2 source-id search endpoint

Acceptance criteria:

- `GET /api/sky/object/gaia-dr2/{source_id}` validates source id and returns `ready` or `not indexed yet`
- source id `2252802052894084352` is the proof target

### 4. ORAS runtime search bridge plan

Acceptance criteria:

- document how vendored runtime search moves from NoctuaSky-style remote fallback to ORAS backend search
- maintain local runtime fallback until ORAS backend search is proven
- do not break current `/sky-engine` search behavior during the transition

### 5. Satellite ingest / cache proof

Acceptance criteria:

- ORAS ingests CelesTrak GP or TLE data into normalized storage
- `GET /api/sky/satellites` exposes normalized snapshot summary
- freshness is visible in `data-health`

### 6. Survey catalog / status proof

Acceptance criteria:

- `GET /api/sky/surveys` exposes current survey inventory and cache state
- current bundled Milky Way survey remains stable

### 7. Better survey tile mirror proof

Acceptance criteria:

- first improved survey is mirrored or cached locally
- cache root, source licence, and version metadata are recorded
- existing same-origin survey path remains stable while proof is evaluated

### 8. Flight data feasibility proof

Acceptance criteria:

- source, licensing, rate limit, cache design, and separation rules are documented
- no renderer or runtime mutation is required

## Risks

- Gaia-scale ingestion can exceed naive frontend and backend assumptions; search metadata and tile generation must stay bounded
- search contract drift is possible because current vendored search still assumes NoctuaSky endpoints outside localhost fallback
- survey licensing and mirror rights must be validated before any large cache rollout
- satellite freshness requirements can exceed simple daily batch jobs
- flight data licensing and rate limits may force provider abstraction and strong cache policy from the start

## Architecture Summary

### What follows Stellarium

- vendored runtime remains the renderer
- static data packs remain the runtime-facing delivery mechanism
- object search and runtime packs remain separate concerns from rendering
- large catalog data is prepared offline and served in runtime-appropriate forms

### What ORAS improves

- ORAS owns catalog search and readiness state
- ORAS owns survey inventory and cache policy
- ORAS owns satellite ingest freshness and normalization
- ORAS can add observing-intelligence overlays without replacing the renderer

## Immediate Next Execution Direction

The next bounded implementation slice should be:

`Backend catalog status endpoint + Gaia DR2 source-id proof structure`

That slice is the smallest credible ORAS-owned data-platform proof because it:

- adds no renderer risk
- preserves current same-origin skydata
- establishes catalog readiness state
- creates the first ORAS-owned search path around a known Gaia object id