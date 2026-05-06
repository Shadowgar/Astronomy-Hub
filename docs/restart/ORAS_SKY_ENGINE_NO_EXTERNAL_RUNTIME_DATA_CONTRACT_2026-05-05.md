# ORAS Sky-Engine No External Runtime Data Contract - 2026-05-05

## Scope

This document defines the authoritative ORAS contract for Sky Engine data ownership.

Production rule:

- ORAS Sky-Engine must operate for normal users without runtime dependence on `stellarium-web.org`, `data.stellarium.org`, NoctuaSky, Gaia Archive live APIs, CDS live APIs, CelesTrak live APIs, MPC live APIs, OpenSky live APIs, or other third-party sky data services.

Public Stellarium Web remains:

- a parity reference for expected data classes and behavior
- not a production dependency
- not a license to perform an uncontrolled site rip

All production runtime data must be:

- ORAS-hosted
- ORAS-versioned
- sourced from official, lawful, or otherwise permitted upstream sources
- promoted into runtime only after proof-backed validation

## Contract Definition

### Runtime data that must be local or ORAS-hosted

The following data classes must be available from ORAS-controlled storage for normal user operation:

| Data class | Required ORAS-hosted runtime delivery |
| --- | --- |
| Stars and star rendering packs | `/oras-sky-engine/skydata/stars/...` promoted runtime assets only |
| DSO runtime packs | `/oras-sky-engine/skydata/dso/...` |
| Survey imagery and HiPS tiles | `/oras-sky-engine/skydata/surveys/...` or ORAS-controlled object storage/CDN roots surfaced through ORAS APIs |
| Landscapes | `/oras-sky-engine/skydata/landscapes/...` |
| Skycultures | `/oras-sky-engine/skydata/skycultures/...` |
| Minor planets and comet runtime bundles | `/oras-sky-engine/skydata/mpcorb.dat` and `/oras-sky-engine/skydata/CometEls.txt` or approved promoted equivalents |
| Satellite runtime bundle | `/oras-sky-engine/skydata/tle_satellite.jsonl.gz` or approved promoted equivalent |
| Search and object detail | `/api/sky/search`, `/api/sky/object/...`, `/api/sky/catalog/status`, `/api/sky/data-health` |
| Survey and satellite inventories | `/api/sky/surveys`, `/api/sky/satellites` |

### External sources allowed only for admin or import jobs

These are allowed only in controlled ingestion, mirror, or update jobs:

| Source family | Allowed job use | Production runtime use |
| --- | --- | --- |
| Official Gaia Archive | bulk import, bounded proof import, metadata refresh | forbidden |
| CDS HiPS and catalog services | approved survey mirror jobs and metadata reconciliation | forbidden |
| CelesTrak GP / SupGP / TLE | ingest jobs and bundle generation | forbidden |
| MPC minor-planet and comet files | ingest jobs and bundle generation | forbidden |
| Future OpenSky / ADS-B providers | cached ingest jobs after licensing review | forbidden |

### Runtime URLs forbidden in production

Explicit forbidden host classes:

- `stellarium-web.org`
- `data.stellarium.org`
- `noctuasky`
- Gaia Archive live calls
- CDS live calls
- CelesTrak live calls
- MPC live calls
- OpenSky live calls

Current runtime guard findings from `scripts/skydata/scan_runtime_external_dependencies.py` also show additional external runtime surfaces that must be removed or replaced before production self-hosted completion:

- public geolocation services such as `https://freegeoip.stellarium.org/json/`
- public geocoder and map tile services such as `https://nominatim.openstreetmap.org/` and `https://{s}.tile.osm.org/{z}/{x}/{y}.png`
- external fonts and other browser-loaded runtime assets such as Google Fonts
- external share or fallback links embedded in vendored runtime code such as `https://stellarium.org` and `https://stellarium-web.org/`

### ORAS runtime replacements

The production replacement surface is:

| External class being replaced | ORAS replacement |
| --- | --- |
| Public runtime static skydata | `/oras-sky-engine/skydata/...` |
| Third-party search | `/api/sky/search` |
| Third-party object detail | `/api/sky/object/...` |
| External readiness signals | `/api/sky/catalog/status` |
| External survey inventory assumptions | `/api/sky/surveys` |
| External satellite freshness assumptions | `/api/sky/satellites` |
| External health and freshness checks | `/api/sky/data-health` |

## Full Data Class Inventory

### A. Stars and Gaia

| Capability | Source of truth | Local storage location | Postgres tables | Static or object storage | Update cadence | Expected size class | Production readiness | Current ORAS status | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Star rendering tiles | ORAS-generated packs from official Gaia and approved bright-star inputs | `data/processed/star-packs/` | `catalog_sources`, `import_jobs`, `data_health_checks` | `data/runtime-packs/stars/` then promoted to `/oras-sky-engine/skydata/stars/` | staged promotion after validated builds | large to very large | blocked | shallow local pack only | authoritative `.eph` writer unresolved; strategy `C` remains active |
| Gaia source metadata | official Gaia Archive exports | `data/raw/gaia/` and `data/processed/gaia/` | `catalog_sources`, `gaia_dr2_sources`, future `gaia_release_catalogs` | none at runtime; backend-served | bounded imports now, larger slices later | large | partial | proof row and Capella region proof imported | full metadata scale plan still needed |
| Exact source ID lookup | ORAS Postgres over Gaia metadata | `data/processed/gaia/` | `gaia_dr2_sources`, `object_aliases`, `sky_objects` | backend API only | per import | medium | partial | local proof works for `2252802052894084352` | broader coverage incomplete |
| Search aliases | ORAS normalized aliases and identifiers from Gaia plus supporting catalogs | `data/processed/search/` | `sky_objects`, `object_aliases` | backend API only | per import and rebuild | medium | partial | current vendored runtime still falls back externally in places | ORAS search bridge incomplete |
| Magnitude and color fields | Gaia and bright-star source photometry | `data/processed/gaia/` | `gaia_dr2_sources`, `sky_objects` | star-pack build inputs | per import | medium | partial | normalized JSONL proof exists | runtime pack generation blocked |
| Proper motion and parallax | Gaia metadata | `data/processed/gaia/` | `gaia_dr2_sources` | star-pack build inputs and detail API | per import | medium | partial | captured in Capella proof export | writer and larger import strategy unresolved |

### B. Deep Sky Objects

| Capability | Source of truth | Local storage location | Postgres tables | Static or object storage | Update cadence | Expected size class | Production readiness | Current ORAS status | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Runtime DSO tiles | ORAS-generated packs from approved DSO catalogs | `data/processed/dso-packs/` | `catalog_sources`, `survey_catalog`, `import_jobs` | `data/runtime-packs/dso/` then promoted to `/oras-sky-engine/skydata/dso/` | curated releases | medium | partial | shallow local DSO bundle exists | authoritative ORAS regeneration path not yet defined |
| Searchable DSO metadata | approved DSO catalogs and ORAS-normalized aliases | `data/raw/dso/`, `data/processed/dso/` | `sky_objects`, `object_aliases`, `catalog_sources` | backend API only | periodic catalog refresh | medium | partial | bundled runtime data exists; backend ownership incomplete | backend DSO search inventory not yet implemented |
| Object aliases | normalized Messier/NGC/IC and external aliases | `data/processed/dso/` | `object_aliases`, `sky_objects` | backend API only | per catalog rebuild | small to medium | partial | runtime local lookup exists | ORAS backend alias authority incomplete |

### C. Surveys and HiPS

| Capability | Source of truth | Local storage location | Postgres tables | Static or object storage | Update cadence | Expected size class | Production readiness | Current ORAS status | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Milky Way survey | approved survey assets already bundled or mirrored from permitted survey source | `data/mirrors/surveys/milkyway/` | `survey_catalog`, `data_health_checks` | `/oras-sky-engine/skydata/surveys/milkyway/` | infrequent | medium | partial | same-origin local bundle exists | provenance and promotion manifests need formalization |
| DSS or color survey candidate | official or permitted survey source mirrored by ORAS | `data/raw/hips/`, `data/mirrors/hips/` | `survey_catalog`, `catalog_sources`, `import_jobs` | ORAS object storage or promoted runtime survey roots | bounded mirror first, then scheduled refresh | large to very large | blocked | public reference only | first approved survey and license review still pending |
| Other optical or IR surveys | approved survey-by-survey mirrors | `data/raw/hips/`, `data/mirrors/hips/` | `survey_catalog`, `catalog_sources`, `import_jobs` | ORAS object storage or CDN | survey-specific cadence | large to very large | blocked | not started | survey selection, terms review, storage budget |
| Tile cache | ORAS-managed mirrored tiles and metadata | `data/mirrors/hips/`, `data/manifests/` | `survey_catalog`, `data_health_checks` | ORAS object storage or CDN | mirror job dependent | large to very large | blocked | not started | mirror orchestration and cache policy |
| Survey metadata | ORAS normalized survey inventory | `data/processed/surveys/` | `survey_catalog`, `catalog_sources`, `data_health_checks` | backend API only | per mirror or update job | small | blocked | endpoint planned only | `/api/sky/surveys` not implemented |

### D. Solar System and small Solar System objects

| Capability | Source of truth | Local storage location | Postgres tables | Static or object storage | Update cadence | Expected size class | Production readiness | Current ORAS status | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Planet imagery | approved planet and moon survey assets | `data/mirrors/sso/` | `survey_catalog`, `data_health_checks` | `/oras-sky-engine/skydata/surveys/sso/` | infrequent | medium | partial | local SSO survey assets exist | provenance and update manifests not yet formalized |
| Moon and planet surface surveys | approved survey mirrors | `data/mirrors/sso/` | `survey_catalog`, `catalog_sources` | ORAS static or object storage | infrequent | medium | partial | local runtime uses existing bundles | ownership audit incomplete |
| Minor planets MPCORB | MPC official files | `data/raw/sso/minor-planets/` | `catalog_sources`, future `minor_planet_snapshots`, `data_health_checks` | generated promoted runtime bundle | scheduled refresh | small to medium | partial | bundled `mpcorb.dat` exists | ORAS-owned ingest freshness and manifesting missing |
| Comets CometEls | MPC official files | `data/raw/sso/comets/` | `catalog_sources`, future `comet_snapshots`, `data_health_checks` | generated promoted runtime bundle | scheduled refresh | small | partial | bundled `CometEls.txt` exists | ORAS-owned ingest freshness and manifesting missing |

### E. Landscapes and skycultures

| Capability | Source of truth | Local storage location | Postgres tables | Static or object storage | Update cadence | Expected size class | Production readiness | Current ORAS status | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current bundled landscapes | approved bundled assets under ORAS control | `data/runtime-packs/landscapes/` | `catalog_sources`, `data_health_checks` | `/oras-sky-engine/skydata/landscapes/` | rare | small to medium | partial | same-origin assets exist | embedded upstream service URLs still need cleanup |
| Current bundled skycultures | approved bundled assets under ORAS control | `data/runtime-packs/skycultures/` | `catalog_sources`, `data_health_checks` | `/oras-sky-engine/skydata/skycultures/` | rare | medium | partial | same-origin assets exist | citation and metadata cleanup still needed |
| ORAS local horizon or obstruction data later | ORAS-generated local datasets | `data/processed/local-horizon/` | future `local_horizon_profiles` | backend API or promoted runtime pack | user or admin generated | small | not started | deferred | feature not in active slice |

### F. Satellites

| Capability | Source of truth | Local storage location | Postgres tables | Static or object storage | Update cadence | Expected size class | Production readiness | Current ORAS status | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CelesTrak GP and SupGP ingest | official CelesTrak feeds | `data/raw/satellites/` | `satellite_catalog`, future `gp_snapshots`, `catalog_sources`, `import_jobs`, `data_health_checks` | generated promoted runtime bundle | multiple times daily or approved cadence | small to medium | blocked | public-style local snapshot exists but ownership is opaque | ORAS ingest and bundle generator not implemented |
| Normalized satellite catalog | ORAS normalized identifiers and freshness data | `data/processed/satellites/` | `satellite_catalog`, `object_aliases`, `data_health_checks` | backend API and bundle build inputs | per ingest | medium | blocked | not started | schema and ingest missing |
| Generated runtime bundle | ORAS-generated `tle_satellite.jsonl.gz` replacement | `data/runtime-packs/satellites/` | `catalog_sources`, `data_health_checks` | promoted `/oras-sky-engine/skydata/tle_satellite.jsonl.gz` | per ingest | small | blocked | current bundle exists but is not ORAS-refreshable | generator and freshness API missing |
| Pass prediction metadata later | ORAS computed pass data | `data/processed/passes/` | future pass tables | backend API only | scheduled or on demand | medium | not started | deferred | separate feature slice |

### G. Future flight data

| Capability | Source of truth | Local storage location | Postgres tables | Static or object storage | Update cadence | Expected size class | Production readiness | Current ORAS status | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ADS-B or OpenSky-style ingest | approved provider after licensing review | `data/raw/flights/` | future `flight_tracks`, `flight_snapshots`, `catalog_sources`, `data_health_checks` | backend cache only | frequent | medium to large | not started | deferred | provider, licensing, and caching plan unresolved |
| Separate flight cache | ORAS server-side cache only | `data/processed/flights/` | future `flight_tracks`, `data_health_checks` | backend API only | frequent | medium | not started | deferred | no active ingest provider |

## Final Self-Hosted Storage Architecture

### Filesystem layout

```text
data/
  raw/
  mirrors/
  processed/
  manifests/
  runtime-packs/

frontend/public/oras-sky-engine/skydata/
  current promoted runtime assets only
```

### Storage rules

- `data/raw/` holds untouched source snapshots from official or otherwise permitted upstreams.
- `data/mirrors/` holds ORAS-owned mirrored survey or large-object artifacts outside git.
- `data/processed/` holds normalized intermediate outputs, search indexes, pack build inputs, and proof artifacts.
- `data/manifests/` holds manifest definitions, mirror reports, checksums, licence notes, freshness metadata, and promotion records.
- `data/runtime-packs/` holds approved generated packs that are candidates for runtime promotion.
- `frontend/public/oras-sky-engine/skydata/` holds only promoted runtime assets that passed proof and promotion review.

### Backend and object storage rules

- Large mirrors and processed tiles stay outside git.
- Object storage or filesystem caches hold large survey tiles, star packs, and other runtime blobs.
- Promotion copies only approved generated packs into served runtime storage.
- Every promoted pack must record source, version, checksum, licence note, generated-at time, and promotion decision.

### Postgres ownership

Postgres owns:

- catalog metadata
- searchable objects and aliases
- source IDs
- import jobs
- data health
- survey catalog
- satellite catalog
- freshness state

Postgres does not own:

- giant tile trees
- large binary star-pack blobs
- unbounded survey imagery caches

## Mirror Implementation Roadmap

1. External dependency scanner
   - scan runtime bundle and source surfaces for external URLs
   - classify `runtime_forbidden`, `admin_import_allowed`, `attribution_allowed`, and `unknown`
   - fail production validation when `--fail-on-runtime-forbidden` is enabled and forbidden findings remain

2. Catalog status and data health hardening
   - implement `/api/sky/catalog/status`, `/api/sky/surveys`, `/api/sky/satellites`, and `/api/sky/data-health`
   - expose readiness as `REAL`, `PARTIAL`, `BLOCKED`, or degraded

3. Gaia import expansion
   - preserve current proof row path
   - preserve Capella region proof path
   - add bounded magnitude-limited expansion
   - define full Gaia metadata strategy without forcing giant runtime loads

4. Star rendering pack strategy
   - keep `.eph` writer blocker closed under strategy `C` until an authoritative write path exists
   - either obtain the authoritative writer or approve a new runtime ingestion contract
   - generate local star packs outside the live runtime tree
   - compare Capella density and field parity
   - promote non-default packs first, then default only after validation

5. Survey mirror strategy
   - identify the first approved HiPS survey to mirror
   - mirror a bounded subset first
   - serve it from ORAS-controlled storage
   - expand to a full ORAS-owned survey cache only after size, licence, and performance proof

6. Satellite ingest
   - implement CelesTrak GP and SupGP ingest
   - normalize backend tables and freshness metadata
   - generate ORAS-owned runtime satellite bundle
   - expose freshness and state through backend APIs

7. Small-body update jobs
   - implement ORAS-owned MPCORB and CometEls update jobs
   - record manifests, freshness, and promotion decisions

8. Flight layer feasibility
   - evaluate provider licensing and caching constraints
   - keep flights isolated from satellite ownership
   - serve cached ORAS backend data only when provider rules permit it

## Production Guard Status

Current guard implementation:

- script: `scripts/skydata/scan_runtime_external_dependencies.py`
- tests: `tests/test_runtime_external_dependency_scanner.py`

Current default scan status on 2026-05-06:

- `finding_count = 152`
- `runtime_forbidden_count = 53`
- `admin_import_allowed = 4`
- `attribution_allowed = 63`
- `unknown = 32`
- report mode status = `pass`
- fail mode would currently block production because forbidden findings remain

Current runtime-forbidden classes observed by the new guard include:

- `https://api.noctuasky.com/...`
- `https://stellarium-web.org/`
- `https://stellarium.org`
- `https://data.stellarium.org/...` references embedded in runtime assets
- `https://freegeoip.stellarium.org/json/`
- `https://nominatim.openstreetmap.org/...`
- `https://{s}.tile.osm.org/{z}/{x}/{y}.png`
- `https://stellarium.sfo2.cdn.digitaloceanspaces.com/...`

Current admin or import allowed source families remain:

- official Gaia Archive imports
- CDS HiPS mirror jobs
- CelesTrak GP and SupGP ingest jobs
- MPC comet and minor-planet update jobs
- future OpenSky or ADS-B ingest jobs after provider review

## Exact Next Implementation Task

Implement the second production guard slice:

- add a maintained allowlist for known attribution-only runtime references
- wire `scripts/skydata/scan_runtime_external_dependencies.py --fail-on-runtime-forbidden` into the production validation path
- start removing the current forbidden runtime references beginning with NoctuaSky search, external geolocation, external geocoding, and external map tiles

## Current Status

Status of the no-external-runtime-data program today:

- `PARTIAL`

Reason:

- the contract, inventory, storage architecture, roadmap, and first production guard now exist
- runtime external dependencies are identified and test-covered
- production self-hosted completion cannot be claimed until the forbidden runtime findings are replaced by ORAS-hosted data and APIs