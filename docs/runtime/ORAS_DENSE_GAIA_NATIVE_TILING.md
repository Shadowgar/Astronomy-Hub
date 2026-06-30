# ORAS Dense Gaia Native Tiling

## Purpose

This pass adds the first rendered star-density upgrade for the active
`/oras-sky-engine/` Stellarium Web / Stellarium Web Engine runtime. It is a
runtime rendering path, not a search-only catalog-pack feature.

## Native SWE Star Data Path

The active runtime loads native stars through the Stellarium Web Engine `stars`
module:

- source: `vendor/stellarium-web-engine/src/modules/stars.c`
- generic HiPS loader: `vendor/stellarium-web-engine/src/hips.c`
- binary tile reader: `vendor/stellarium-web-engine/src/eph-file.c`
- frontend registration: `core.stars.addDataSource({ url, key })`

Native star surveys are HiPS-style directories with:

```text
properties
Norder<order>/Dir<dir>/Npix<pix>.eph
```

The properties file must include:

```text
type = stars
hips_tile_format = eph
hips_order = <max-order>
hips_order_min = <min-order>
min_vmag = <minimum magnitude gate>
max_vmag = <maximum magnitude gate>
```

The `.eph` tile is an EPHE v2 container. For stars, the runtime reads a `STAR`
chunk containing:

- tile header version `>= 3`
- HiPS NUNIQ tile position
- tabular rows with columns such as `gaia`, `hip`, `vmag`, `gmag`, `ra`, `de`,
  `plx`, `pra`, `pde`, `epoc`, `bv`, `ids`, and `spec`
- compressed table payload

Coordinates are stored in native units expected by SWE:

- RA/Dec: radians
- parallax: arcseconds
- proper motion: radians/year
- magnitude: SWE visual magnitude unit
- color: B-V style color index where available

## Extension Points

Supported:

- adding another native star survey with `core.stars.addDataSource({ url, key })`
- mounting generated tiles into `/oras-sky-engine/skydata/...`
- loading only the manifest in JavaScript while native `.eph` chunks are
  requested by SWE as visible tiles are traversed

Unsupported or limited:

- removing a registered star survey at runtime is not exposed by the current
  SWE JavaScript API
- per-survey visibility toggling is not exposed by the current SWE JavaScript
  API
- full Gaia DR3 all-sky ingestion is intentionally out of scope for this pass

Because per-survey removal is not exposed, the ORAS Dense Stars toggle persists
the enabled state and reloads/rechecks the runtime so the native survey is
either registered or skipped at startup.

## Selected Implementation

Path A, native SWE star tiles, is used.

The first bounded release is generated from the mounted ORAS catalog-pack
`stars-core` records. This is source-backed and avoids full Gaia DR3 bulk
downloads in normal development/test runs.

Current generated release:

| Field | Value |
|---|---:|
| rendering path | `native_swe_star_tiles` |
| magnitude limit | `13.0` |
| tile order | `3` |
| star count | `98,922` |
| tile count | `768` |
| generated size | about `5.1 MB` on disk |

Source catalogs in the generated release:

- Gaia DR3: 10,000
- Gliese CNS3: 2,247
- Hipparcos Tier 2 (local): 61,675
- Tycho-2: 25,000

## Generated Data Layout

Generated dense-star runtime data lives outside git:

```text
data/runtime-packs/dense-star-tiles/
  manifest.json
  properties
  build-report.json
  Norder3/Dir0/Npix*.eph
```

Committed files are limited to:

- build/validate/install scripts
- tests
- runtime JS/Vue source
- deployment/mount configuration
- this document

Generated native tile payloads are ignored by git and Docker build contexts.

## Build And Validate

Build:

```bash
npm run dense-stars:build
```

Validate:

```bash
npm run dense-stars:validate -- data/runtime-packs/dense-star-tiles
```

Install into a host runtime mount:

```bash
bash scripts/skydata/install_oras_dense_star_tiles.sh \
  data/runtime-packs/dense-star-tiles \
  /srv/oras/dense-star-tiles/current
```

Browser/runtime validation:

```bash
npm run validate:oras-dense-stars
```

## Mount And Deploy Paths

Development frontend mount:

```text
${ORAS_DENSE_STAR_TILES_HOST_DIR:-./data/runtime-packs/dense-star-tiles}
  -> /app/public/oras-sky-engine/skydata/dense-star-tiles:ro
```

Production frontend mount:

```text
${ORAS_DENSE_STAR_TILES_HOST_DIR:-./data/runtime-packs/dense-star-tiles}
  -> /usr/share/nginx/html/oras-sky-engine/skydata/dense-star-tiles:ro
```

Runtime survey URL:

```text
/oras-sky-engine/skydata/dense-star-tiles
```

## Runtime UI

The navigation drawer now includes:

- `ORAS Dense Stars`
- `ORAS Dense Stars Enabled`

The status dialog reports:

- loaded/degraded/off state
- native SWE star tile rendering path
- release version
- source catalogs
- star count
- tile count
- magnitude limit
- tile order

Missing generated tiles are explicit degraded mode. Standard Stellarium star
surveys remain available.

## Visible Acceptance Criteria

This pass is complete only if runtime validation proves:

- `/oras-sky-engine/` loads
- dense-star manifest is mounted and status appears
- native dense survey registers when enabled
- native star count for the runtime view is measurable
- toggling ORAS Dense Stars changes startup registration state
- generated dense-star data is not committed or baked into Docker images
- catalog-pack behavior from PR #33/#34 still works
- deep links still work
- satellites still parse consistently

## Remaining Dense Gaia Gaps

This is a bounded native-tile release, not full Gaia DR3 all-sky parity.

Next work should add:

- larger Gaia DR3/EDR3 acquisition pipeline
- magnitude-limited all-sky tile builds
- zoom-aware pack variants
- per-survey enable/disable support inside SWE if upstream API changes are
  accepted
- performance profiling with larger tile counts
