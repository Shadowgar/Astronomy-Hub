# ORAS Sky-Engine Full Public Data Parity Mirror - 2026-05-06

## Public Resource Classes Observed

- search/name resolution (NoctuaSky in public runtime)
- object summaries (Wikipedia in public runtime)
- UI SVG/icon assets
- star packs: minimal/base/extended
- DSO packs: base/extended
- Milky Way survey
- Guereins landscape hierarchy
- Moon survey
- DSS survey (`surveys/dss/v1`)

## ORAS Mirror Mapping

- parity manifest: `data/manifests/public_stellarium_runtime_parity_manifest.json`
- mirror tool: `scripts/skydata/mirror_public_runtime_data.py`
- runtime mount roots:
  - `vendor/stellarium-web-engine/apps/test-skydata`
  - `frontend/public/oras-sky-engine/skydata`

## Implemented This Slice

- Added classed parity manifest with per-class paths/status/format/loader.
- Added resumable mirror CLI with:
  - class selection
  - dry-run
  - confirm-download guard
  - resume
  - checksum manifests
  - max-files/max-bytes guards
  - explicit runtime promotion
- Added local object summary/media corpus seed under:
  - `frontend/public/oras-sky-engine/skydata/object-media/summaries/*.json`
- Updated selected object summary path to local-only summary loading.
- Updated runtime data-source setup to mount pack roots:
  - `/oras-sky-engine/skydata/packs/minimal`
  - `/oras-sky-engine/skydata/packs/base`
  - `/oras-sky-engine/skydata/packs/extended`
  while preserving bundled fallback.

## Current DSS Coverage

- Existing committed runtime coverage remains at the prior promoted proof tile set (`237` tiles + properties).
- Full `Norder 0..7` exhaustive mirror now has a general tool path, but long-running full-pull execution remains operationally bounded in this session.

## Star/DSO Pack Status

- Minimal/base/extended star and DSO classes are defined in manifest and selectable in the mirror CLI.
- Exact public pack index/discovery for `swe-data-packs/*/.../(stars|dso)` remains unresolved for fully automated pull in this slice.

## Object Summary/Media Status

- Local summary corpus seeded for:
  - M31, M32, M110, C6, M42, M45, Capella, Gaia DR2 2252802052894084352
- Runtime summary loader now reads ORAS-local summaries only.

## Exact Blockers

1. Full DSS `0..7` exhaustive pull needs a longer uninterrupted run window for high-volume tile fetches.
2. Public `swe-data-packs` directory/discovery metadata for minimal/base/extended stars/DSO needs explicit upstream path validation before full automated mirror.

## Continue Commands

```bash
cd /home/rocco/Astronomy-Hub
.venv/bin/python scripts/skydata/mirror_public_runtime_data.py \
  --class dss_survey \
  --confirm-download \
  --resume \
  --checksum-manifest \
  --promote-runtime-pack \
  --order-min 0 \
  --order-max 7
```

```bash
cd /home/rocco/Astronomy-Hub
.venv/bin/python scripts/skydata/mirror_public_runtime_data.py \
  --class star_pack_minimal --class star_pack_base --class star_pack_extended \
  --confirm-download --resume --checksum-manifest
```

## Execution Update (2026-05-07)

### DSS Commands Executed

```bash
cd /home/rocco/Astronomy-Hub
.venv/bin/python scripts/skydata/mirror_public_runtime_data.py --class dss_survey --dry-run --order-min 0 --order-max 7
.venv/bin/python scripts/skydata/mirror_public_runtime_data.py --class dss_survey --confirm-download --resume --checksum-manifest --promote-runtime-pack --order-min 0 --order-max 7 --max-files 500
```

Additional resumed runs were attempted with larger caps. A sparse-range scan performance seam was hit in the current mirror loop; promotion was then completed from the expanded local raw mirror tree into runtime targets.

### DSS Orders Completed

- Coverage expanded within `order 0..7` scope, but full exhaustive completion of all `0..7` tiles remains incomplete in this run.
- Current local mirror file set materially exceeds prior one-object proof.

### DSS Before/After (runtime target)

- Before: `238` files, `18M`
- After: `904` files, `39M`

Paths:
- `frontend/public/oras-sky-engine/skydata/surveys/dss/v1`
- `vendor/stellarium-web-engine/apps/test-skydata/surveys/dss/v1`

### Star Pack Discovery Result

Dry-run commands executed:

```bash
.venv/bin/python scripts/skydata/mirror_public_runtime_data.py --class star_pack_minimal --dry-run --max-files 20
.venv/bin/python scripts/skydata/mirror_public_runtime_data.py --class star_pack_base --dry-run --max-files 20
.venv/bin/python scripts/skydata/mirror_public_runtime_data.py --class star_pack_extended --dry-run --max-files 20
```

Result for each: `blocked`

Exact blocker: `source_type=eph-pack currently requires dedicated mirroring logic`

### DSO Pack Discovery Result

Dry-run commands executed:

```bash
.venv/bin/python scripts/skydata/mirror_public_runtime_data.py --class dso_pack_base --dry-run --max-files 20
.venv/bin/python scripts/skydata/mirror_public_runtime_data.py --class dso_pack_extended --dry-run --max-files 20
```

Result for each: `blocked`

Exact blocker: `source_type=eph-pack currently requires dedicated mirroring logic`

### Packs Downloaded/Promoted This Run

- DSS: yes (expanded local mirror promoted to both runtime roots)
- star_pack_minimal: no
- dso_pack_base: no

### Runtime Verification

- `npm run build:stellarium` passed.
- Required DSS properties files present in both runtime roots.
- Runtime external dependency scanner passed after removing forbidden placeholder URL from DSS properties.

### Scanner Result

- `runtime_forbidden = 0` (pass)

### Next Command

```bash
cd /home/rocco/Astronomy-Hub
.venv/bin/python scripts/skydata/mirror_public_runtime_data.py \
  --class dss_survey \
  --confirm-download \
  --resume \
  --checksum-manifest \
  --promote-runtime-pack \
  --order-min 0 \
  --order-max 7 \
  --max-files 500
```

## Execution Update (2026-05-07, Continuation)

### DSS continuation commands run

```bash
.venv/bin/python scripts/skydata/mirror_public_runtime_data.py \
  --class dss_survey \
  --confirm-download \
  --resume \
  --checksum-manifest \
  --promote-runtime-pack \
  --order-min 0 \
  --order-max 7 \
  --max-files 500
```

### DSS before/after for this continuation

- before: `1404` files, `62M`
- after: `1587` files, `69M`

### EPH-pack support status

- `scripts/skydata/mirror_public_runtime_data.py` now supports `source_type=eph-pack`:
  - properties-first fetch
  - tile mirroring for `Norder*/Dir*/Npix*.eph`
  - `--order-min`, `--order-max`, `--max-files`, `--max-bytes`, `--resume`
  - checksum manifest and per-tile log records with class/order/url/path/sha256/bytes/timestamp
  - explicit promotion only
  - legacy `/skydata/stars` promotion guard
  - path traversal rejection

### Exact public roots tested

Tested with `Origin: https://stellarium-web.org`:

- minimal stars properties:
  - `https://stellarium.sfo2.cdn.digitaloceanspaces.com/swe-data-packs/minimal/2020-09-01/minimal_2020-09-01_186e7ee2/stars/properties` -> `200`
- base stars properties:
  - `https://stellarium.sfo2.cdn.digitaloceanspaces.com/swe-data-packs/base/2020-09-01/base_2020-09-01_1aa210df/stars/properties` -> `200`
- extended stars properties:
  - `https://stellarium.sfo2.cdn.digitaloceanspaces.com/swe-data-packs/extended/2020-03-11/extended_2020-03-11_42143e86/stars/properties` -> `403`
- base dso properties:
  - `https://stellarium.sfo2.cdn.digitaloceanspaces.com/swe-data-packs/base/2020-09-01/base_2020-09-01_1aa210df/dso/properties` -> `200`
- extended dso properties:
  - `https://stellarium.sfo2.cdn.digitaloceanspaces.com/swe-data-packs/extended/2020-03-11/extended_2020-03-11_42143e86/dso/properties` -> `403`

Low-order tile checks:

- minimal stars tile `.../Norder0/Dir0/Npix0.eph` -> `200`
- base dso tile `.../Norder0/Dir0/Npix0.eph` -> `200`

### star_pack_minimal result

- mirrored/promoted: yes
- frontend path: `frontend/public/oras-sky-engine/skydata/packs/minimal/stars`
- file count: `41`
- size: `1.1M`

### dso_pack_base result

- mirrored/promoted: yes
- frontend path: `frontend/public/oras-sky-engine/skydata/packs/base/dso`
- file count: `33`
- size: `700K`

### Runtime resource verification

- Local mount seams are active in source:
  - `core.stars.addDataSource({ url: packRoot + '/stars' })`
  - `core.dsos.addDataSource({ url: packRoot + '/dso' })`
- Same-origin scanner passes (`runtime_forbidden=0`).

### Scanner result

- `npm run scan:runtime-external-deps:fail` -> pass

### Next command

```bash
cd /home/rocco/Astronomy-Hub
.venv/bin/python scripts/skydata/mirror_public_runtime_data.py \
  --class dss_survey \
  --confirm-download \
  --resume \
  --checksum-manifest \
  --promote-runtime-pack \
  --order-min 0 \
  --order-max 7 \
  --max-files 500
```

## Execution Update (2026-05-07, Full-Mode Conversion)

### Why batch mode was insufficient

- Existing `--max-files` batch loops required repeated manual runs and did not satisfy full-class mirroring goals.
- Full mirror needed deterministic scan of all expected DSS tile paths for the selected order range, with resume-aware download accounting.

### New full mirror mode

- Added CLI: `--full` (alias `--download-all`)
- Added retry/timeout controls: `--retry-count` and `--request-timeout`
- Added failed file manifest:
  - `data/runtime-packs/surveys/dss/v1/failed-files.json`
- Added status fields in class report:
  - `expected_files`, `existing_files`, `missing_files_before`, `downloaded_files`, `failed_files`, `missing_files_after`, `runtime_file_count`, `runtime_size`, `complete`
- `--max-files` now applies to newly downloaded files only.

### Exact full mirror command executed

```bash
cd /home/rocco/Astronomy-Hub
.venv/bin/python scripts/skydata/mirror_public_runtime_data.py \
  --class dss_survey \
  --confirm-download \
  --resume \
  --checksum-manifest \
  --promote-runtime-pack \
  --order-min 0 \
  --order-max 7 \
  --full
```

## Execution Update (2026-05-07, Mirror Manager Page)

- Mirror manager route added: `http://localhost:4173/sky-engine/mirror-progress`
- Backend API endpoints added:
  - `GET /api/sky/mirror/status`
  - `GET /api/sky/mirror/status/{class_name}`
  - `POST /api/sky/mirror/start`
  - `POST /api/sky/mirror/start-all`
  - `POST /api/sky/mirror/pause`
  - `POST /api/sky/mirror/resume`
  - `POST /api/sky/mirror/cancel`
  - `POST /api/sky/mirror/cancel-all`
  - `GET /api/sky/mirror/classes`
  - `GET /api/sky/mirror/logs/{class_name}`
  - `GET /api/sky/mirror/failures/{class_name}`
  - `POST /api/sky/mirror/promote/{class_name}`
  - `POST /api/sky/mirror/verify/{class_name}`
  - `POST /api/sky/mirror/scan`
  - `GET /api/sky/mirror/stream` (SSE realtime)
- Manager wraps existing CLI mirror tool and reads:
  - `data/manifests/public_stellarium_runtime_parity_manifest.json`
  - `data/runtime-packs/**/mirror-status.json`
  - `data/runtime-packs/**/download-log.jsonl`
  - `failed-files.json`
  - `checksums.json`
- Live page controls:
  - Start All Required
  - Resume All
  - Cancel All
  - Refresh
  - Verify Runtime Packs
- Safety note shown on page and status API:
  - Admin mirror jobs may fetch external sources.
  - User runtime remains ORAS-hosted only.
- Autostart support:
  - `/sky-engine/mirror-progress?autostart=1`
  - starts/resumes required classes in order: `dss_survey`, `star_pack_minimal`, `star_pack_base`, `dso_pack_base`
- Monitoring from shell:
  - or watch realtime browser updates via SSE stream endpoint.

```bash
watch -n 10 '.venv/bin/python scripts/skydata/mirror_public_runtime_data.py --class dss_survey --status'
```

or

```bash
watch -n 10 'cat data/runtime-packs/surveys/dss/v1/mirror-status.json'
```

### Current full-run state from this execution window

- expected file count (orders 0..7 with properties): `262141`
- baseline runtime count before run: `1587`
- baseline runtime size before run: `69M`
- run progressed through orders 4 and 5 with ongoing new downloads, but was manually stopped before completion to avoid leaving an indefinite live session in this turn
- runtime promoted count after stop: unchanged at `1587`
- runtime size after stop: unchanged at `69M`
- completion status: `incomplete` (run interrupted)
- failed file count recorded in this interrupted run: no finalized failed manifest from this pass

### Runtime verification and scanner

- scanner baseline remains pass (`runtime_forbidden = 0`)
- full end-to-end runtime visual verification must be repeated after a completed `--full` run finishes and promotes

### Next command

```bash
cd /home/rocco/Astronomy-Hub
.venv/bin/python scripts/skydata/mirror_public_runtime_data.py \
  --class dss_survey \
  --confirm-download \
  --resume \
  --checksum-manifest \
  --promote-runtime-pack \
  --order-min 0 \
  --order-max 7 \
  --full
```
