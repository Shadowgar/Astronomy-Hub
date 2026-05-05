# ORAS Sky-Engine Gaia Backend Proof - 2026-05-05

## Scope

This document records the first ORAS-owned backend catalog proof for Gaia DR2 source lookup.

This slice does not change the vendored ORAS Sky-Engine renderer.

## Schema Added

Alembic migration:

- `0004_gaia_catalog_proof_foundation`

Tables added:

- `catalog_sources`
- `gaia_dr2_sources`
- `import_jobs`
- `data_health_checks`

Indexes added:

- unique index on `catalog_sources.source_key`
- composite index on `gaia_dr2_sources (ra, dec)`
- index on `gaia_dr2_sources.catalog_source_id`
- index on `import_jobs.source_key`
- index on `data_health_checks.check_key`

## Endpoints Added

- `GET /api/sky/catalog/status`
- `GET /api/sky/object/gaia-dr2/{source_id}`
- `GET /api/sky/search?q=`

Current endpoint behavior:

- catalog status reports `missing` when no Gaia rows are present
- exact Gaia DR2 lookup returns a normalized indexed payload when found
- exact Gaia DR2 lookup returns `indexed: false` with `status: not_indexed` when absent
- search recognizes `Gaia DR2 <source_id>` and related exact-ID formats and routes them to the Gaia lookup path

## Importer Contract

Importer script:

- `scripts/skydata/import_gaia_dr2_sample.py`

Expected columns:

- required: `source_id`, `ra`, `dec`
- optional: `phot_g_mean_mag`, `bp_rp`, `parallax`, `pmra`, `pmdec`

Behavior:

- accepts CSV or TSV input
- validates `source_id` as integer
- refuses rows missing `ra` or `dec`
- supports `--dry-run`
- records `catalog_sources` and `import_jobs` on real imports
- does not fabricate values

## Proof Object Status

Primary proof object:

- `Gaia DR2 2252802052894084352`

Current repository status:

- not indexed by default in committed repo data

Exact reason:

- no verified local Gaia DR2 sample file for source id `2252802052894084352` is committed in this slice
- tests use temporary fixture data only
- runtime responses therefore remain truthful and return `not_indexed` unless a verified sample is imported locally

## How To Import A Verified Sample File

Example:

```bash
cd /home/rocco/Astronomy-Hub
/home/rocco/Astronomy-Hub/.venv/bin/python scripts/skydata/import_gaia_dr2_sample.py /absolute/path/to/verified_gaia_sample.csv --source-key gaia-dr2-proof-sample --display-name "Gaia DR2 proof sample" --source-url "file:///absolute/path/to/verified_gaia_sample.csv" --license-note "reviewed local proof export"
```

Dry-run validation example:

```bash
cd /home/rocco/Astronomy-Hub
/home/rocco/Astronomy-Hub/.venv/bin/python scripts/skydata/import_gaia_dr2_sample.py /absolute/path/to/verified_gaia_sample.csv --dry-run
```

## Next Step Toward The Capella Dense-Star Proof

After a verified Gaia proof sample is available and the backend lookup path is proven, the next bounded step is:

- prepare a reviewed Gaia export for a small Capella-region proof
- ingest that bounded sample into ORAS-owned catalog tables
- generate a temporary deeper star runtime pack outside the live runtime tree
- compare the Capella field against the current same-origin local baseline before any promotion