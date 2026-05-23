# ORAS Sky-Engine Capella Gaia Acquisition Proof - 2026-05-05

## Scope

This document records a bounded Gaia DR2 acquisition proof around Capella.

This slice does not change the renderer, does not modify live runtime skydata, and does not generate a Stellarium-compatible star tile pack yet.

## Capella Region Definition

Center object:

- Capella

Center source used for this proof:

- local bright star catalog entry in `backend/app/services/sky_star_catalog.py`
- `right_ascension = 5.2782 h`
- `declination = 45.998 deg`

Center used for Gaia query:

- RA = `79.173 deg`
- Dec = `45.998 deg`

Why this center was used:

- it is already present in the ORAS-owned bright star catalog
- it points directly at the visually important field called out in the density-gap audit
- it avoids inventing a new center or depending on public Stellarium Web

Bounded proof query settings:

- radius = `0.5 deg`
- magnitude limit = `phot_g_mean_mag <= 14`
- row cap = `TOP 5000`

Why these bounds were chosen:

- `0.5 deg` keeps the proof tightly centered around the Capella field
- `phot_g_mean_mag <= 14` reaches materially deeper than the current local pack ceiling of `max_vmag = 7.0`
- the measured result stayed small enough for a safe first import

## Official Gaia Archive Export

Source:

- official Gaia Archive TAP sync endpoint
- URL: `https://gea.esac.esa.int/tap-server/tap/sync`

Saved files:

- raw export: `data/raw/gaia/dr2/proof/capella_region_gaia_dr2.csv`
- query metadata: `data/raw/gaia/dr2/proof/capella_region_gaia_dr2_query.md`

Observed export row count:

- `553` data rows

ADQL used:

```sql
select top 5000
  source_id,
  ra,
  dec,
  phot_g_mean_mag,
  bp_rp,
  parallax,
  pmra,
  pmdec
from gaiadr2.gaia_source
where 1=contains(
  point('ICRS', ra, dec),
  circle('ICRS', 79.173, 45.998, 0.5)
)
and phot_g_mean_mag <= 14
order by phot_g_mean_mag asc
```

Provenance note:

- official Gaia Archive TAP sync export for bounded Capella-region DR2 proof sample

## PostGIS Import Result

Runtime database used:

- `postgresql+psycopg://postgres:postgres@127.0.0.1:15433/astronomy_hub`

Importer used:

- `scripts/skydata/import_gaia_dr2_sample.py`

Source key used:

- `gaia-dr2-capella-region-proof`

Observed importer result:

- `rows_seen = 553`
- `rows_imported = 553`
- `display_name = Gaia DR2 Capella region proof`

Observed database state:

- `catalog_sources` row exists for `gaia-dr2-capella-region-proof`
- `import_jobs` row recorded `status = success`, `rows_seen = 553`, `rows_imported = 553`
- total `gaia_dr2_sources` row count after import = `554`

Why total row count is 554:

- the previous single-row Gaia backend proof for source id `2252802052894084352` remains present
- the Capella-region import added `553` more rows

## Backend API Verification

Observed `GET /api/sky/catalog/status` result:

- `gaia_dr2.status = partial`
- `gaia_dr2.row_count = 554`
- `gaia_dr2.source_summary.source_key = gaia-dr2-capella-region-proof`

Sample imported source ids verified through exact lookup:

- `211830059081750912`
- `211805079552264832`
- `211785975537756800`

Observed `GET /api/sky/object/gaia-dr2/{source_id}` behavior:

- all three sample ids returned `indexed = true`
- all three returned real Gaia DR2 coordinates and magnitude/provenance fields
- provenance pointed to `gaia-dr2-capella-region-proof`

Observed `GET /api/sky/search?q=Gaia DR2 211830059081750912` behavior:

- `recognized_query = true`
- `meta.match_type = gaia_dr2_source_id`
- returned the indexed Gaia DR2 result for that imported Capella-region source id

Cone endpoint status:

- not added in this slice
- exact lookup plus catalog status were sufficient to prove multi-row backend readiness without expanding the public API surface

## What This Proves

This proof demonstrates that ORAS can:

- define a bounded dense-star acquisition region around Capella
- fetch real Gaia DR2 rows from the official Gaia Archive
- store that bounded sample locally under ORAS control
- import the sample into PostGIS-backed ORAS catalog tables
- resolve multiple real Gaia DR2 stars from that region through the local backend API

## What Is Still Needed For Runtime Star Tiles

This slice does not yet produce a Stellarium-compatible runtime star tile pack.

The next task must determine:

- the exact Stellarium-compatible star tile format and packing rules used by the current runtime star dataset
- how Gaia rows must be normalized into the runtime pack schema
- how magnitude, color, and indexing metadata map into that pack format
- how to generate proof tiles outside the live `frontend/public/oras-sky-engine/skydata` tree
- how to compare proof-tile density against the current shallow local pack in the Capella field before any promotion

## Exact Next Task

- Reverse-engineer the existing ORAS/Stellarium star tile pack format from the current local `stars` bundle and vendored reference data, then build a non-live Capella-region proof tile generator that converts imported Gaia rows into Stellarium-compatible test tiles outside the active runtime tree.
