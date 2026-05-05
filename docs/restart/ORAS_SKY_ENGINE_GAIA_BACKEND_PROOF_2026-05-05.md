# ORAS Sky-Engine Gaia Backend Proof - 2026-05-05

## Scope

This document records the first ORAS-owned backend catalog proof for Gaia DR2 source lookup.

This slice does not change the vendored ORAS Sky-Engine renderer.

## Schema Added

Alembic migration:

- file: `0004_gaia_catalog_proof_foundation.py`
- applied revision id: `0004_gaia_catalog_proof`

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

## PostGIS Runtime Proof

Runtime database used:

- `postgresql+psycopg://postgres:postgres@127.0.0.1:15433/astronomy_hub`
- Docker Compose service: `postgres`
- image: `postgis/postgis:16-3.4`

Runtime verification:

- `docker compose exec -T postgres pg_isready -U postgres -d astronomy_hub` returned accepting connections
- `SELECT name, default_version, installed_version FROM pg_available_extensions WHERE name = 'postgis';` returned installed version `3.4.3`
- `/home/rocco/Astronomy-Hub/.venv/bin/python -m alembic upgrade head` succeeded against the PostGIS runtime after shortening the 0004 revision identifier to fit the existing Alembic version table width

## Verified Source Provenance

Verified source:

- Official Gaia Archive TAP sync endpoint
- host: `https://gea.esac.esa.int/tap-server/tap/sync`
- query:

```sql
select source_id,ra,dec,phot_g_mean_mag,bp_rp,parallax,pmra,pmdec
from gaiadr2.gaia_source
where source_id=2252802052894084352
```

Saved raw proof file:

- `data/raw/gaia/dr2/proof/gaia_dr2_2252802052894084352.csv`

Verified returned row:

- `source_id = 2252802052894084352`
- `ra = 287.3080617529185`
- `dec = 63.94083283337751`
- `phot_g_mean_mag = 19.540705`
- `bp_rp = 1.6441231`
- `parallax = 0.5248625280404411`
- `pmra = -4.9402008612149055`
- `pmdec = 0.254308135067056`

## Import Result

Exact import command used:

```bash
cd /home/rocco/Astronomy-Hub
DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:15433/astronomy_hub /home/rocco/Astronomy-Hub/.venv/bin/python scripts/skydata/import_gaia_dr2_sample.py data/raw/gaia/dr2/proof/gaia_dr2_2252802052894084352.csv --source-key gaia-dr2-proof-2252802052894084352 --display-name "Gaia DR2 proof row 2252802052894084352" --source-url "https://gea.esac.esa.int/tap-server/tap/sync?REQUEST=doQuery&LANG=ADQL&FORMAT=csv&QUERY=select%20source_id%2Cra%2Cdec%2Cphot_g_mean_mag%2Cbp_rp%2Cparallax%2Cpmra%2Cpmdec%20from%20gaiadr2.gaia_source%20where%20source_id%3D2252802052894084352" --license-note "Official Gaia Archive TAP sync export for Gaia DR2 source_id 2252802052894084352"
```

Observed importer result:

- `rows_seen = 1`
- `rows_imported = 1`
- `source_key = gaia-dr2-proof-2252802052894084352`

Observed database rows:

- `catalog_sources`: one `gaia_dr2` proof source row created
- `import_jobs`: one successful import job recorded with `rows_seen = 1` and `rows_imported = 1`
- `gaia_dr2_sources`: one row present for `2252802052894084352`

## Proof Object Status

Primary proof object:

- `Gaia DR2 2252802052894084352`

Current repository status:

- resolves locally from ORAS backend data as indexed after the verified PostGIS import

Exact reason:

- the official Gaia Archive proof row was fetched, saved locally, and imported into the real PostGIS-backed runtime database
- the backend lookup and search endpoints now resolve this source id from local ORAS-owned tables

## How To Import A Verified Sample File

Example:

```bash
cd /home/rocco/Astronomy-Hub
DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:15433/astronomy_hub /home/rocco/Astronomy-Hub/.venv/bin/python scripts/skydata/import_gaia_dr2_sample.py /absolute/path/to/verified_gaia_sample.csv --source-key gaia-dr2-proof-sample --display-name "Gaia DR2 proof sample" --source-url "file:///absolute/path/to/verified_gaia_sample.csv" --license-note "reviewed local proof export"
```

Dry-run validation example:

```bash
cd /home/rocco/Astronomy-Hub
DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:15433/astronomy_hub /home/rocco/Astronomy-Hub/.venv/bin/python scripts/skydata/import_gaia_dr2_sample.py /absolute/path/to/verified_gaia_sample.csv --dry-run
```

## API Verification Results

Backend process used:

```bash
cd /home/rocco/Astronomy-Hub
DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:15433/astronomy_hub /home/rocco/Astronomy-Hub/.venv/bin/python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

Observed runtime results:

- `GET /api/sky/catalog/status`
	- `gaia_dr2.status = partial`
	- `gaia_dr2.row_count = 1`
	- `gaia_dr2.source_summary.source_key = gaia-dr2-proof-2252802052894084352`
- `GET /api/sky/object/gaia-dr2/2252802052894084352`
	- `indexed = true`
	- `catalog = Gaia DR2`
	- `source_id = 2252802052894084352`
	- `ra = 287.3080617529185`
	- `dec = 63.94083283337751`
	- `provenance.source_key = gaia-dr2-proof-2252802052894084352`
- `GET /api/sky/search?q=Gaia DR2 2252802052894084352`
	- `recognized_query = true`
	- `meta.match_type = gaia_dr2_source_id`
	- first result is indexed and matches the same Gaia DR2 row

## Next Step Toward The Capella Dense-Star Proof

After a verified Gaia proof sample is available and the backend lookup path is proven, the next bounded step is:

- prepare a reviewed Gaia export for a small Capella-region proof
- ingest that bounded sample into ORAS-owned catalog tables
- generate a temporary deeper star runtime pack outside the live runtime tree
- compare the Capella field against the current same-origin local baseline before any promotion