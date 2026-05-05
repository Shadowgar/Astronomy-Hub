# ORAS Sky-Engine Public Data Endpoint Audit - 2026-05-05

## Scope

This audit records the public request classes observed from `https://stellarium-web.org/` during controlled browser inspection.

This document is evidence only.

It does not authorize production dependence on `stellarium-web.org`.

It does not authorize blind mirroring from public Stellarium infrastructure.

Its purpose is to answer three bounded questions:

- what data classes the public site actually loads
- which of those classes are missing or shallower in current ORAS local skydata
- which classes need ORAS-owned replacements or controlled mirrors

## Method

Observed sources:

- integrated browser page load of `https://stellarium-web.org/`
- browser resource inventory from `performance.getEntriesByType('resource')`
- public search interactions for `CAPELLA`, `GAIADR22252802052894084352`, `SIRIUS`, `M31`, `ISS`, and `NORAD25544`
- explicit Capella suggestion selection
- targeted header checks for representative public endpoints

Local comparison surface:

- `frontend/public/oras-sky-engine/skydata/stars/properties`
- `frontend/public/oras-sky-engine/skydata/dso/properties`
- `frontend/public/oras-sky-engine/skydata/surveys/milkyway/properties`
- current local star tree contents under `frontend/public/oras-sky-engine/skydata/stars`

## Current Local ORAS Baseline

Observed local runtime limits:

- local stars are served from `frontend/public/oras-sky-engine/skydata/stars`
- local stars expose only `Norder0` and `Norder1`
- local stars declare `max_vmag = 7.0`
- local star file count is `45` total files: `44` `.eph` tiles plus the root `properties` file
- local DSO data is limited to `Norder0`
- local bundled surveys currently include `milkyway` and `sso`

Implication:

- the current ORAS runtime is functional but intentionally shallow compared with the public site
- the visible density gap around bright fields such as Capella is expected from the current local star ceiling alone

## Endpoint Class Inventory

| Class | Hostname | Path pattern | Example | Query shape | Response type | Observed size | Cache / CORS | Static or API | Current local equivalent | Gap | Mirrorability | Legal note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Runtime shell assets | `d3ufh70wg9uzo4.cloudfront.net` | app JS, CSS, WASM | `/js/stellarium-web-engine.9b8f0e47.wasm` | none | JS, CSS, WASM | not captured in this pass | browser-loaded asset class; no ORAS use planned | static | vendored runtime under `vendor/stellarium-web-engine` and same-origin `/oras-sky-engine/` build output | ORAS already owns runtime build path locally | do not mirror; keep vendored build path | not a required production upstream |
| Star pack metadata | `stellarium.sfo2.cdn.digitaloceanspaces.com` | `/swe-data-packs/{pack}/{version}/{build}/stars/properties` | `/swe-data-packs/minimal/2020-09-01/minimal_2020-09-01_186e7ee2/stars/properties` | none | text properties | `369` bytes | `cache-control: max-age=31449600`; `access-control-allow-origin: https://stellarium-web.org` | static | `frontend/public/oras-sky-engine/skydata/stars/properties` | public site boots multiple star-pack classes; local pack is shallower | temporary audit mirror only; production source must be ORAS-built from official data | needs review; do not adopt public Stellarium pack as production source |
| Star pack tiles | `stellarium.sfo2.cdn.digitaloceanspaces.com` | `/swe-data-packs/{pack}/{version}/{build}/stars/Norder*/Dir*/Npix*.eph` | observed at boot across `minimal`, `base`, `extended` packs | none | `.eph` binary tiles | varies | long-lived CDN cache inferred from same pack family | static | local `skydata/stars/Norder0` and `Norder1` | public site serves deeper and broader star data | build ORAS-owned runtime tiles from official catalog inputs; do not scrape all public tiles | needs review |
| DSO metadata | `stellarium.sfo2.cdn.digitaloceanspaces.com` | `/swe-data-packs/{pack}/{version}/{build}/dso/properties` | `/swe-data-packs/base/2020-09-01/base_2020-09-01_1aa210df/dso/properties` | none | text properties | observed at boot; exact size not captured | cache long-lived on CDN family | static | `frontend/public/oras-sky-engine/skydata/dso/properties` | local DSO bundle is present but public boot path indicates a different pack lineage | bounded replacement possible from ORAS-curated DSO source set | needs review |
| DSO tiles | `stellarium.sfo2.cdn.digitaloceanspaces.com` | `/swe-data-packs/{pack}/{version}/{build}/dso/Norder*/Dir*/Npix*.eph` | DSO tile class observed during boot and zoom | none | `.eph` binary tiles | varies | one zoom sample returned `cache-control: max-age=31449600`; CORS restricted to `https://stellarium-web.org` | static | local `skydata/dso/Norder0` | local depth is smaller | ORAS should regenerate from owned DSO catalog flow, not public tile scraping | needs review |
| Gaia survey metadata | `stellarium.sfo2.cdn.digitaloceanspaces.com` | `/surveys/gaia/v1/properties` | `/surveys/gaia/v1/properties` | none | text properties | `818` bytes | `cache-control: max-age=31536000`; CORS allowed for `https://stellarium-web.org` | static | no local Gaia survey equivalent in current same-origin bundle | missing locally | replace with official Gaia / CDS-backed ORAS pipeline | public endpoint is evidence only |
| Milky Way survey metadata | `stellarium.sfo2.cdn.digitaloceanspaces.com` | `/surveys/milkyway/v1/properties` | `/surveys/milkyway/v1/properties` | none | text properties | observed at boot; local equivalent exists | long-lived cache family | static | `frontend/public/oras-sky-engine/skydata/surveys/milkyway/properties` | local bundle exists and is already same-origin | current local bundle is acceptable; improvement is optional | public survey may remain comparison target only |
| Milky Way survey tiles | `stellarium.sfo2.cdn.digitaloceanspaces.com` | `/surveys/milkyway/v1/Norder*/Dir*/Npix*.webp` | `/surveys/milkyway/v1/Norder0/Dir0/Npix8.webp?v=58526` | none | `webp` image tiles | `1788` bytes for one sample | `cache-control: max-age=31536000`; CORS restricted to `https://stellarium-web.org` | static | local same-origin `skydata/surveys/milkyway` | local bundle present | keep ORAS local bundle authoritative unless a higher-quality official survey is intentionally adopted | public endpoint is not production dependency |
| SSO / planetary survey imagery | not conclusively observed in this public network pass | likely survey-style tile family or object-driven imagery path | no stable public example captured in this audit | unknown | unknown from this pass | not captured | unknown in this pass | unknown | local same-origin `skydata/surveys/sso/*` already exists | public parity path remains unclear; local runtime is already functional | unknown until a reviewed source is selected | needs review |
| Skyculture index | `stellarium.sfo2.cdn.digitaloceanspaces.com` | `/skycultures/v3/{culture}/index.json` | `/skycultures/v3/western/index.json` | none | JSON | observed at boot; exact size not captured | long-lived static CDN class | static | local `skydata/skycultures` | no immediate gap identified | existing local path is already compatible | needs review |
| Landscape assets | `stellarium.sfo2.cdn.digitaloceanspaces.com` | `/landscapes/v1/{landscape}/...` | `/landscapes/v1/guereins` family | none | JSON and image tiles | observed at boot and zoom | long-lived static CDN class | static | local `skydata/landscapes` | no blocking gap for current task | existing local path remains valid | needs review |
| Data-credit / metadata surface | application-bundled UI surface | no standalone network endpoint confirmed in this pass | not captured as an independent URL | unknown | unknown from this pass | not captured | unknown in this pass | likely bundled UI metadata rather than a separate API | ORAS runtime already ships its own data-credit UI inside the vendored app | no blocking runtime gap identified | no mirror action required unless a separate endpoint is later found | needs review |
| Minor-planet elements | `stellarium.sfo2.cdn.digitaloceanspaces.com` | `/mpc/v1/mpcorb.dat` | `/mpc/v1/mpcorb.dat` | none | plain text orbital elements | `109893` bytes | `cache-control: max-age=3600` | static data file | `frontend/public/oras-sky-engine/skydata/mpcorb.dat` | local bundle exists but freshness is opaque | replace with direct MPC feed ownership | public copy should not be long-term source |
| Comet elements | `stellarium.sfo2.cdn.digitaloceanspaces.com` | `/mpc/v1/CometEls.txt` | `/mpc/v1/CometEls.txt` | none | plain text orbital elements | observed at boot; exact size not captured | same static family as MPC objects | static data file | `frontend/public/oras-sky-engine/skydata/CometEls.txt` | local bundle exists but freshness is opaque | replace with direct MPC feed ownership | public copy should not be long-term source |
| Satellite snapshot bundle | `stellarium.sfo2.cdn.digitaloceanspaces.com` | `/skysources/v1/tle_satellite.jsonl.gz` | `/skysources/v1/tle_satellite.jsonl.gz` | none | gzipped JSONL | `1406935` bytes | `cache-control: max-age=43200,stale-if-error=2419200` | static data file | `frontend/public/oras-sky-engine/skydata/tle_satellite.jsonl.gz` | local bundle exists but current refresh policy is unclear | replace with ORAS-owned CelesTrak ingest and generated runtime bundle | public copy should not be long-term source |
| Search autocomplete | `api.noctuasky.com` | `/api/v1/skysources/?q={term}&limit=10` | `/api/v1/skysources/?q=CAPELLA&limit=10` | `q`, `limit` | JSON | `1320` bytes for Capella, `3236` for Sirius, `2884` for M31, `5683` for ISS, `645` for NORAD25544, `3` for the Gaia DR2 test query | `access-control-allow-origin: https://stellarium-web.org` | API | no ORAS backend equivalent yet | missing locally | must be replaced by ORAS backend search APIs | third-party API; do not depend on it in production |
| Search detail by name | `api.noctuasky.com` | `/api/v1/skysources/name/{name}` | `/api/v1/skysources/name/NAME%20Capella` | path parameter | JSON | observed after Capella selection; exact byte size not captured | browser response allows `https://stellarium-web.org` origin | API | no ORAS backend equivalent yet | missing locally | must be replaced by ORAS object detail endpoint | third-party API; do not depend on it in production |

## Search Interaction Findings

Observed public search behavior:

- Capella search hit `api.noctuasky.com/api/v1/skysources/?q=CAPELLA&limit=10`
- selecting the Capella suggestion then hit `api.noctuasky.com/api/v1/skysources/name/NAME%20Capella`
- Sirius, M31, ISS, and NORAD 25544 all returned public search results from the same API family
- the exact Gaia DR2 query string `GAIADR22252802052894084352` returned a valid HTTP 200 with a minimal payload, which confirms the endpoint is queryable but not that the public service provides a usable Gaia source-detail path for ORAS needs

Implication:

- public Stellarium search is split from public static skydata
- ORAS needs its own backend-owned search and detail contracts even if it keeps the vendored runtime renderer unchanged

## Capella Density Finding

The observed density difference is already explained without scraping additional public tiles.

Evidence:

- local ORAS stars declare `max_vmag = 7.0`
- local ORAS stars only expose `Norder0` and `Norder1`
- public Stellarium booted `minimal`, `base`, and `extended` star pack metadata classes
- public Stellarium also booted the Gaia survey metadata class

Conclusion:

- the public site has access to deeper star content than the current local ORAS pack
- ORAS does not need to pull everything from public Stellarium to close that gap
- ORAS needs a controlled replacement pipeline for deeper star data, beginning with a bounded proof region and not a full Gaia frontend load
- the current local file count makes the scale of the gap explicit: `44` star tiles locally versus multiple layered public pack classes and Gaia-related survey metadata

## Required Replacement Direction

Production rules derived from this audit:

- do not depend on `stellarium-web.org` or its current CDN hosts in production
- do not treat public Stellarium static files as authoritative ORAS upstreams
- do treat the public request classes as evidence of what the runtime expects
- replace each public class with one of:
  - ORAS-owned locally generated runtime packs
  - ORAS-owned mirrors from official/open upstream providers
  - ORAS backend APIs serving normalized metadata and readiness state

## Audit Summary

What the public site clearly uses:

- static runtime assets
- multiple star-pack classes
- DSO packs
- Gaia survey metadata
- Milky Way imagery
- skyculture and landscape assets
- MPC-derived asteroid and comet files
- gzipped satellite snapshot bundle
- a separate NoctuaSky search API

What current local ORAS already has:

- same-origin runtime shell
- bundled local stars, DSO, Milky Way, skycultures, landscapes, MPCORB, CometEls, and satellites

What current local ORAS is missing or shallower on:

- deeper star density
- local Gaia survey / Gaia-backed star enrichment
- backend-owned search contracts
- explicit freshness and health ownership for satellites, comets, and minor planets

This is the evidence base for the self-hosted mirror plan and downloader foundation.