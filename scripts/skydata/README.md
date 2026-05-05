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

## Promotion Boundary

The downloader writes into `data/` by default, using manifest-controlled paths such as `raw/`, `mirrors/`, `processed/`, and `manifests/`.

Promotion into the live same-origin runtime tree is intentionally separate from downloading.