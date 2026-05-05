# ORAS Sky-Engine Capella Star Tile Proof - 2026-05-05

## Scope

This document records the first non-live Capella-region star-tile proof export from ORAS-owned Gaia rows.

This slice does not modify the live runtime star bundle under `frontend/public/oras-sky-engine/skydata/stars`.

## Files Added For This Slice

Scripts:

- `scripts/skydata/inspect_star_tiles.py`
- `scripts/skydata/build_capella_star_tile_proof.py`

Focused tests:

- `tests/test_capella_star_tile_proof.py`

Restart docs:

- `docs/restart/ORAS_SKY_ENGINE_STAR_TILE_FORMAT_AUDIT_2026-05-05.md`
- `docs/restart/ORAS_SKY_ENGINE_CAPELLA_STAR_TILE_PROOF_2026-05-05.md`
- `docs/restart/ORAS_SKY_ENGINE_AUTHORITATIVE_EPH_WRITER_DISCOVERY_2026-05-05.md`

Generated staged artifacts:

- `data/processed/gaia_tiles/capella-proof/capella_gaia_stars.normalized.jsonl`
- `data/processed/gaia_tiles/capella-proof/manifest.json`

## Live Bundle Inspection Proof

Exact command used:

```bash
cd /home/rocco/Astronomy-Hub && .venv/bin/python scripts/skydata/inspect_star_tiles.py --sample-limit 1
```

Observed result summary:

- `norder_count = 2`
- `total_tile_count = 44`
- order 0 tiles = `12`
- order 1 tiles = `32`
- `hips_tile_format = eph`
- sampled tiles started with `EPHE`
- sampled STAR chunk row counts were `1024` for `Norder0/Dir0/Npix0.eph` and `87` for `Norder1/Dir0/Npix0.eph`

Audit conclusion:

- the local live stars bundle format is sufficiently understood for read-only inspection
- it is not yet safe to write compatible `.eph` proof tiles locally

## Staged Export Proof

Runtime database used:

- `postgresql+psycopg://postgres:postgres@127.0.0.1:15433/astronomy_hub`

Exact command used:

```bash
cd /home/rocco/Astronomy-Hub && .venv/bin/python scripts/skydata/build_capella_star_tile_proof.py --database-url 'postgresql+psycopg://postgres:postgres@127.0.0.1:15433/astronomy_hub'
```

Observed export result:

- `source_key = gaia-dr2-capella-region-proof`
- `row_count = 553`
- `runtime_compatible_eph_emitted = false`
- manifest written to `data/processed/gaia_tiles/capella-proof/manifest.json`
- normalized rows written to `data/processed/gaia_tiles/capella-proof/capella_gaia_stars.normalized.jsonl`

Observed first staged rows:

- first exported source id = `211830059081750912`
- second exported source id = `211805079552264832`
- rows contain `source_id`, `ra_deg`, `dec_deg`, `phot_g_mean_mag`, `bp_rp`, `parallax_mas`, `pmra_mas_per_year`, `pmdec_mas_per_year`, `source_key`

## Runtime Protection Proof

The build script refuses live runtime output roots.

Protected behavior:

- output roots under `frontend/public/oras-sky-engine/skydata` raise `RuntimeProtectionError`
- default output root is staged under `data/processed/gaia_tiles/capella-proof`

This preserves the live runtime tree while still producing proof artifacts.

## Validation

Focused test command:

```bash
cd /home/rocco/Astronomy-Hub && .venv/bin/python -m pytest tests/test_capella_star_tile_proof.py -q
```

Observed test output:

- `3 passed in 0.42s`

What those tests prove:

- the inspection script reads the live bundle properties and counts Norder levels
- the builder refuses live runtime skydata output roots
- the builder writes normalized JSONL plus manifest for a temporary DB fixture

## Status

Status for the Capella star-tile proof slice:

- `PARTIAL`

Reason:

- staged proof artifacts were generated successfully from real imported Gaia rows
- runtime-compatible `.eph` output remains blocked because the authoritative writer discovery pass ended on strategy `C`
- no checked-in local or vendored upstream star-tile `.eph` writer was found

## What This Proves

This slice proves that ORAS can:

- inspect the current local star tile pack without modifying it
- document the live `EPHE` container and STAR table layout
- export real Capella-region Gaia rows from the ORAS-owned database into staged artifacts
- preserve live runtime skydata while doing so

## Exact Blocker

The manifest records the blocker exactly as:

> Runtime-compatible EPH output is blocked: the vendored runtime exposes an EPH reader and STAR chunk layout, but this repo does not contain a star-tile EPH writer to emit safe live-compatible bytes.

## Exact Next Step

- obtain the authoritative upstream star-pack writer or generator
- or derive a minimal writer only after authoritative upstream write semantics are fully established
- validate byte-for-byte compatibility against sampled live STAR tiles
- only then attempt a staged Capella `.eph` proof pack outside the live runtime tree