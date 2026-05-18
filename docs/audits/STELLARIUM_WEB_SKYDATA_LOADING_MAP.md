# Stellarium Web Skydata Loading Map

Date: 2026-05-15  
Status: `PARTIAL` measured audit, not complete global coverage  
Fresh runtime evidence bundle: `study/web/stellarium_web_skydata_audit_2026-05-15/`
HiDEF follow-up evidence: `study/web/stellarium_web_hidef_followup_2026-05-18/`

## Scope And Evidence Rules

This audit separates:

- `observed live`: present in the fresh browser manifest.
- `source-defined but not observed`: present in checked-out source, absent from the fresh runtime manifest.
- `runtime-observed but origin unresolved`: browser-observed, but provenance cannot be proven from browser traffic alone.
- `not yet observed`: required by the audit brief but absent from both the fresh manifest and the checked-out default registration path.

The fresh public-site capture used only browser-served requests from `https://stellarium-web.org/`. It did not bypass `403`, brute-force hidden URLs, forge authorization, or depend on cloning Stellarium's CDN.

## Runtime Manifest Summary

Fresh run `skydata-audit-20260515T180112Z`:

| Metric | Value |
| --- | ---: |
| Captured requests | 1314 |
| Successful responses | 1311 |
| `403` responses | 3 |
| Dominant data host | `stellarium.sfo2.cdn.digitaloceanspaces.com` |
| Service workers | 0 |
| IndexedDB databases | 0 |
| CacheStorage buckets | 0 |

Scenario coverage from `coverage_ledger.json`:

| Scenario | Evidence state | Notes |
| --- | --- | --- |
| boot | observed live | CDN registrations, first tiles, catalogs, and imagery loaded |
| pan/zoom | observed live | more star and landscape tiles loaded |
| faint stars | observed live | extended stars, Gaia `.eph`, DSS tiles, deeper DSO tiles loaded |
| star search | observed live | more Gaia tiles loaded |
| DSO search | observed live | deeper extended star tiles loaded |
| DSS toggle | attempted, not separately observed | DSS was already observed during faint-star loading |
| HiDEF | observed live in focused follow-up | concrete M31 deep-zoom flow loaded DSS `Norder8` and `Norder9`; no separate HiDEF family was observed |
| Milky Way toggle | attempted, not separately observed | Milky Way was observed at boot |
| planet, Moon, Sun views | observed live | focused routes loaded SSO survey imagery |
| time/date | observed live | explicit date/location URL triggered fresh runtime traffic |
| object search | observed live | focused `/skysource/...` routes hit `api.noctuasky.com` |
| skyculture, landscape, observer location | attempted, not separately observed | boot traffic proves default assets; no scenario-scoped request |

Raw evidence:

- `manifest.jsonl`
- `asset_taxonomy.json`
- `browser_storage_metadata.json`
- `coverage_ledger.json`
- `manifest_summary.md`

## Observed Domain Inventory

| Domain | Requests | Audit relevance |
| --- | ---: | --- |
| `stellarium.sfo2.cdn.digitaloceanspaces.com` | 956 | primary skydata CDN |
| `d3ufh70wg9uzo4.cloudfront.net` | 236 | app-shell static assets |
| `api.noctuasky.com` | 8 | object lookup/index API |
| `freegeoip.stellarium.org` | 8 | observer geolocation helper |
| `nominatim.openstreetmap.org` | 13 | reverse geocoding |
| `en.wikipedia.org` | 4 | object-description enrichment |
| analytics / ads / font hosts | 89 total | non-skydata runtime traffic |

## Loader Topology

### 1. Shared HiPS Runtime

`study/stellarium-web-engine/src/hips.c` defines the common HiPS path machinery:

- `properties` is fetched first.
- Tile URLs are built as `Norder{order}/Dir{floor(pix / 10000) * 10000}/Npix{pix}.{ext}`.
- Online surveys append `?v=<release_date>`.
- Level-zero `Allsky.{ext}` is loaded when available.
- Tile cache size is fixed at `256 MiB`.
- Missing-child knowledge propagates through parent flags so known absent descendants are not retried.

Key implementation points:

- `hips_get_tile_` owns cache lookup, parent fallback, and missing-child propagation.
- `hips_get_tile` is the public tile accessor used by modules.

`properties` parsing drives:

- `hips_order`
- `hips_order_min`
- `hips_tile_width`
- `hips_tile_format`
- `hips_release_date`

Image surveys use `webp`, `jpg`, or `png`. `.eph` surveys disable `Allsky`.

### 2. Star And Gaia Tile Loading

`study/stellarium-web-engine/src/modules/stars.c`:

- accepts both `STAR` and `GAIA` chunks
- registers multiple surveys and sorts them by `max_vmag`
- treats key `gaia` specially
- raises Gaia's `min_vmag` above earlier non-Gaia survey ceilings to avoid overlap
- traverses tiles breadth-first and only descends when a loaded parent tile is complete enough for the current magnitude limit

Observed live families:

- minimal stars pack
- base stars pack
- extended stars pack, which is the observed extra-stars tier
- Gaia survey pack

The fresh run proves Gaia loads from Stellarium-hosted `.eph` tiles under `/surveys/gaia/v1/`, not from a remote query API during rendering.

### 3. DSO Tile Loading

`study/stellarium-web-engine/src/modules/dso.c`:

- consumes `DSO ` chunks from `.eph`
- parses type, magnitudes, coordinates, dimensions, morphology, and IDs
- traverses HiPS breadth-first
- uses brightness gates before rendering and descent

The concrete readers are `eph_read_tile_header`, `eph_read_table_header`,
`eph_read_compressed_block`, and `eph_read_table_row` from `eph-file.c`.

Observed live families:

- base DSO pack
- extended DSO pack

### 4. Image Survey Loading

Observed live:

- DSS colored survey: `/surveys/dss/v1/...webp`
- Milky Way: `/surveys/milkyway/v1/...webp`
- default landscape: `/landscapes/v1/guereins/...webp`
- Moon imagery: `/surveys/sso/moon/v1/...webp`
- Moon normal map: `/surveys/sso/moon-normal/v1/...webp`
- Sun imagery: `/surveys/sso/sun/v1/...webp`
- planet imagery observed during Jupiter route: `/surveys/sso/jupiter/`, `/surveys/sso/io/`, `/surveys/sso/callisto/`

The checked-out frontend registration path defines Moon and Sun sources in `App.vue`; the focused follow-up run verified both live.
`moon-normal` is `runtime-observed but origin unresolved`: `planets.c` supports a
`moon-normal` data-source key, but the checked-out default `App.vue` registration
path does not register it.

Focused M31 deep-zoom verification on 2026-05-18 resolved the remaining HiDEF
gap: both public Stellarium Web and local `/oras-sky-engine/` requested DSS
orders `3` through `9` when centered on M31 at `fov=0.02`. The evidence supports
`HiDEF` as a user-visible deep DSS resolution state, not a separately registered
survey family.

### 5. Non-HiPS Runtime Assets

Observed live:

- skyculture index and description under `/skycultures/v3/western/`
- minor planets at `/mpc/v1/mpcorb.dat`
- comets at `/mpc/v1/CometEls.txt`
- satellites at `/skysources/v1/tle_satellite.jsonl.gz`

Source-defined but not live-observed:

- custom skyculture URL override through `?sc=...`
- frontend autocomplete endpoint `/api/v1/skysources/?q=...`

Runtime-observed but origin unresolved:

- `moon-normal`, because live traffic proves it while the checked-out default
  registration path does not show where the public build adds it

### 6. Search And Object Index Services

The checked-out Web frontend calls:

- `/api/v1/skysources/?q={term}&limit={n}`
- `/api/v1/skysources/name/{name}`

via `VUE_APP_NOCTUASKY_API_SERVER` in `apps/web-frontend/src/assets/sw_helpers.js`.

The focused follow-up run observed `api.noctuasky.com/api/v1/skysources/name/...` during Moon, Sun, Jupiter, and object-search routes. The autocomplete query path remains source-defined; the named-object lookup path is `observed live`.

## URL Family Map

| Family | URL pattern | Evidence state |
| --- | --- | --- |
| Minimal stars | `/swe-data-packs/minimal/{date}/{build}/stars/{properties,Norder*/Dir*/Npix*.eph}` | observed live |
| Base stars | `/swe-data-packs/base/{date}/{build}/stars/{properties,Norder*/Dir*/Npix*.eph}` | observed live |
| Extended stars | `/swe-data-packs/extended/{date}/{build}/stars/{properties,Norder*/Dir*/Npix*.eph}` | observed live |
| Gaia stars | `/surveys/gaia/v1/{properties,Norder*/Dir*/Npix*.eph}` | observed live |
| Base DSO | `/swe-data-packs/base/{date}/{build}/dso/{properties,Norder*/Dir*/Npix*.eph}` | observed live |
| Extended DSO | `/swe-data-packs/extended/{date}/{build}/dso/{properties,Norder*/Dir*/Npix*.eph}` | observed live |
| DSS colored survey | `/surveys/dss/v1/{properties,Norder*/Dir*/Npix*.webp}` | observed live |
| Milky Way | `/surveys/milkyway/v1/{properties,Norder0/Allsky.webp,Norder*/Dir*/Npix*.webp}` | observed live |
| Landscape | `/landscapes/v1/{name}/{properties,description.*,Norder*/...}` | observed live |
| Skyculture | `/skycultures/v3/{culture}/{index.json,description.md,...}` | observed live |
| Minor planets | `/mpc/v1/mpcorb.dat` | observed live |
| Comets | `/mpc/v1/CometEls.txt` | observed live |
| Satellites | `/skysources/v1/tle_satellite.jsonl.gz` | observed live |
| Moon imagery | `/surveys/sso/moon/...` | observed live |
| Moon normal map | `/surveys/sso/moon-normal/...` | observed live |
| Sun imagery | `/surveys/sso/sun/...` | observed live |
| Planet imagery | `/surveys/sso/{jupiter,io,callisto}/...` | observed live |
| HiDEF | DSS deep-order traversal (`Norder8` and `Norder9`) | observed live in focused follow-up |
| Search APIs | `${VUE_APP_NOCTUASKY_API_SERVER}/api/v1/skysources/...` | named-object lookup observed live; autocomplete source-defined |

## `.eph` Schema

Container layout from `eph-file.c`:

1. `EPHE` magic
2. file version `2`
3. repeated chunks: `type[4]`, chunk length, chunk payload, CRC
4. optional leading `JSON` chunk supplying metadata such as `children_mask`

Tile payload layout:

1. tile header: table version plus NUNIQ tile position
2. table header: flags, row size, column count, row count, column descriptors
3. compressed zlib block
4. optional byte unshuffle when table flag `1` is set

`STAR` and `GAIA` columns consumed by `stars.c`:

`type`, `gaia`, `hip`, `vmag`, `gmag`, `ra`, `de`, `plx`, `pra`, `pde`, `epoc`, `bv`, `ids`, `spec`

`DSO ` columns consumed by `dso.c`:

`type`, `vmag`, `bmag`, `ra`, `de`, `smax`, `smin`, `angl`, `morp`, `ids`

## Public Source And Hosting Distinction

| Family | Browser-observed host | Provenance state |
| --- | --- | --- |
| star `.eph` packs | Stellarium CDN | Stellarium-hosted optimized pack |
| Gaia `.eph` survey | Stellarium CDN | Stellarium-hosted optimized pack derived from Gaia |
| DSO `.eph` packs | Stellarium CDN | Stellarium-hosted optimized pack |
| DSS colored survey | Stellarium CDN | Stellarium-hosted mirror/derivative; credits in frontend identify STScI/CDS lineage |
| Milky Way imagery | Stellarium CDN | Stellarium-hosted Stellarium-derived survey |
| landscape and skyculture assets | Stellarium CDN | Stellarium-specific assets |
| minor planets/comets | Stellarium CDN | Stellarium-hosted copies of public MPC inputs |
| satellites | Stellarium CDN | Stellarium-hosted bundle |
| search APIs | `api.noctuasky.com` | observed external API surface |

## Generator Investigation

Findings:

- No `.eph` writer is present in the checked-out `study/stellarium-web-engine` tree.
- A fresh public-source inspection of `Stellarium/stellarium-data` found `hipster`, which generates **image** HiPS surveys and `properties` files, but the inspected `hipster` code is not a `.eph` writer.
- A targeted public-source inspection of official `Stellarium/stellarium` desktop source at commit `c55ce973483b6777324da6b4e3f3ac0cac5a78d7` found ephemeris-related code, but no matching Web `.eph` writer evidence in the inspected `src/`, `util/`, or `plugins/` paths.
- Therefore compatible local `.eph` generation remains unresolved from the evidence gathered here. The parser contract is documented, but a lawful writer path still needs separate provenance or implementation work before Astronomy Hub can emit compatible star/DSO packs with confidence.

Candidate local-pack inputs remain plausible only after a writer is proven:

- Gaia DR2
- Hipparcos
- Bright Star Catalogue
- Stellarium DSO catalogs
- HyperLeda
- SIMBAD/OpenNGC

## Coverage Gaps And Parity Risks

- HiDEF remains `not yet observed`; do not claim parity coverage.
- Moon, Moon-normal, Sun, Jupiter, Io, and Callisto survey families are now observed live through focused routes.
- Named-object lookup is observed live through `api.noctuasky.com`; autocomplete remains source-defined but not separately exercised.
- `403` responses remain part of observed public behavior; this audit did not bypass or enumerate protected paths.
- The runtime matrix is measured but not exhaustive. Completion remains `PARTIAL` until every required family is either observed live or explicitly dispositioned with stronger evidence.
