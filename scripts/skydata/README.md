# ORAS Skydata Downloader Foundation

These scripts provide a bounded foundation for ORAS-owned skydata mirroring.

Rules enforced by the tooling:

- downloads must come from an explicit JSON manifest
- large plans require explicit confirmation
- per-source size limits are enforced
- successful downloads emit a report with source URL, local path, size, SHA-256, and source license note
- writes into `frontend/public/oras-sky-engine/skydata` are blocked by default

## Files

- `mirror_manifest.py`: validate and normalize a manifest
- `download_with_manifest.py`: run a dry-run or download plan from a manifest
- `verify_mirror.py`: verify enabled manifest files on disk
- `audit_public_stellarium_endpoints.py`: group observed public resource URLs by class for audit work
- `mirror_dss_hips_proof.py`: mirror a bounded DSS HiPS proof into `data/raw/` and `data/processed/` without writing directly into the live runtime tree

## Basic Usage

Normalize the template manifest:

```bash
python3 scripts/skydata/mirror_manifest.py data/manifests/oras_skydata_sources.template.json
```

Run a dry-run against a manifest:

```bash
python3 scripts/skydata/download_with_manifest.py data/manifests/oras_skydata_sources.template.json --dry-run
```

Run a real download plan after enabling sources and confirming a large plan when required:

```bash
python3 scripts/skydata/download_with_manifest.py path/to/manifest.json --confirm-large-download
```

Verify enabled files in a manifest:

```bash
python3 scripts/skydata/verify_mirror.py path/to/manifest.json
```

Dry-run the bounded M31 DSS proof:

```bash
python3 scripts/skydata/mirror_dss_hips_proof.py --target m31 --dry-run
```

Run the real bounded M31 DSS proof mirror:

```bash
python3 scripts/skydata/mirror_dss_hips_proof.py --target m31 --confirm-download
```

## Promotion Boundary

The downloader writes into `data/` by default, using manifest-controlled paths such as `raw/`, `mirrors/`, `processed/`, and `manifests/`.

Promotion into the live same-origin runtime tree is intentionally separate from downloading.

For the DSS proof specifically, promotion must stage the generated runtime-ready tree into the vendored test-skydata source of truth before running `npm run build:stellarium`, because `scripts/sync-stellarium-runtime.sh` removes `frontend/public/oras-sky-engine` before copying the rebuilt dist output.

## ORAS Major Catalog Release

The catalog release is generated from public upstream sources into ignored,
mounted storage. It is not copied into either Docker image.

Acquire or refresh source files:

```bash
.venv/bin/python -m scripts.skydata.acquire_oras_catalog_sources
```

Build and validate the four runtime packs:

```bash
.venv/bin/python -m scripts.skydata.build_oras_catalog_release \
  --source-backed \
  --release-version 2026.06.1 \
  --output data/runtime-packs/catalog-packs
```

The default release uses complete small/medium catalogs and bounded bright
slices for catalogs that cannot safely be loaded as complete browser indexes:

| Pack | Generated objects | Sources |
|---|---:|---|
| `stars-core` | 99,635 | Hipparcos Tier 2, Gaia DR3 bright 10,000, Tycho-2 bright 25,000, Gliese CNS3 |
| `dso-expanded` | 20,539 | OpenNGC, Dias open clusters, Barnard, LBN, LDN, Sharpless, Arp, Markarian, 3C |
| `double-stars` | 25,000 | WDS records with primary magnitude at most 10 |
| `unusual-objects` | 13,043 | coordinate-valid ATNF pulsars, Milliquas bright 10,000, BlackCAT |

Gaia, Tycho-2, WDS, and Milliquas have production acquisition/normalization
paths but are intentionally bounded for this browser-index release. Full dense
renderer ingestion requires HATS/native SWE tiling rather than a giant JSON
browser index.

Docker Compose mounts the same generated directory read-only at:

- backend: `/runtime/oras-catalog-packs`
- frontend: `/app/public/oras-sky-engine/skydata/catalog-packs`

Override the host directory with `ORAS_CATALOG_PACKS_HOST_DIR`. If the mount is
missing, standard Stellarium catalogs remain available and the status dialog
reports that ORAS packs are not mounted.

After the stack is running, validate API and normal-user browser behavior:

```bash
npm run validate:oras-catalog-release
```

Artifacts are written to `output/playwright/catalog-release/`.
