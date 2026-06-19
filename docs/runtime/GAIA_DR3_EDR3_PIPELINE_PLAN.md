# Gaia DR3 / EDR3 Pilot Pipeline Plan

## Purpose

The ORAS Sky Engine needs a scalable Gaia DR3 / EDR3 path that improves star
depth and metadata without committing a giant browser JSON file or baking full
catalog data into Docker images.

This pass defines the safe first slice only. It does not download or commit the
full Gaia catalog.

## Source

Primary source: Gaia Archive TAP / ADQL.

Planned table: `gaiadr3.gaia_source`.

The Gaia DR3 source table provides Gaia-observed sources with positions,
photometry, astrometry, and release-local `source_id` values. Gaia documentation
states that `source_id` is a 64-bit identifier unique within a release, so ORAS
must preserve it as a string in APIs and JavaScript.

## First Pilot

Use bounded fields only:

- M31 field
- M42 field
- dense Milky Way field
- sparse northern field

The manifest is tracked at:

```text
backend/app/data/sky/gaia_dr3_pilot_manifest.json
```

It defines:

- allowed columns
- magnitude limits
- field centers
- storage strategy
- Docker strategy
- identity contract

## Allowed Columns

Initial pilot columns:

- `source_id`
- `designation`
- `ra`
- `dec`
- `phot_g_mean_mag`
- `bp_rp`
- `parallax`
- `pmra`
- `pmdec`
- `radial_velocity`
- `ruwe`
- `ref_epoch`

No derived distance should be shown unless derived rules and confidence are
explicitly implemented. Parallax can be exposed as source data.

## Storage Strategy

Do not commit raw Gaia exports.

Use mounted or cached backend data:

```text
data/gaia/dr3/pilot/
```

Future production storage should be one of:

- Postgres/PostGIS indexed table
- HEALPix-tiled JSONL/Parquet-style mounted data
- compressed tile index loaded through backend lookup

Frontend policy:

- no full Gaia DR3 JSON dump
- no JavaScript numeric `source_id`
- no bulk data in Docker image

## Runtime Strategy

The runtime exact-link contract remains:

```text
catalog + source_id + model
```

For Gaia DR3:

- `catalog`: `Gaia DR3`
- `model`: `star`
- `source_id`: string
- `ra` / `dec`: fallback coordinates from Gaia source row

## Next Implementation Step

Build an importer that accepts a Gaia Archive TAP export matching the manifest
and loads a bounded pilot field into the backend catalog index. The importer
must validate:

- source columns
- row count limit
- magnitude limit
- source ID string preservation
- RA/Dec range
- no missing coordinates
