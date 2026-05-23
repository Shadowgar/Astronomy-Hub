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

## Execution Update (2026-05-07, Survey/Star Density + Mirror Truth)

### Official vs local visual comparison (current pass)

- Target fields requested: Epsilon Persei, Capella, M31 at `fov=0.8`.
- Official-vs-local browser network capture is currently blocked in this workspace because Playwright is not installed in the active Node runtime (`Cannot find module 'playwright'`), so full side-by-side request tables are pending browser-tool enablement.
- Local runtime behavior remains consistent with lower perceived density because local base star pack remains sparse and DSS remains partial.

### Exact reason local looked lower quality

- DSS exists locally but coverage is incomplete; high-order tile completeness in visible fields is not proven and likely falls back to lower-order parent tiles.
- Star packs are not parity-complete:
  - `star_pack_base` mirror from 0..3 currently shows `61` runtime files (properties + resumed) and `960` failed tile fetches in this run.
  - `star_pack_minimal` remains at `41` files (`1.1M`) after attempted expansion run.
- Extended packs are still blocked by source permissions (HTTP 403), so GAIA/TYC/SAO/HIP-like dense expansion from those roots is not reachable from current URLs.

### Local star pack request/mount evidence

- Vendor runtime mount code confirms local pack roots are mounted:
  - `vendor/stellarium-web-engine/apps/web-frontend/src/App.vue` uses `listOrasPackRoots()` and mounts `.../stars` + `.../dso`.
  - `vendor/stellarium-web-engine/apps/web-frontend/src/assets/oras_data_config.js` returns `/oras-sky-engine/skydata/packs/{minimal,base,extended}`.
- Local files present after promotion:
  - `frontend/public/oras-sky-engine/skydata/packs/base/stars`: `61` files, `2.0M`
  - `vendor/stellarium-web-engine/apps/test-skydata/packs/base/stars`: `61` files, `2.0M`
  - `frontend/public/oras-sky-engine/skydata/packs/minimal/stars`: `41` files, `1.1M`

### Local DSS tile order evidence

- Manifest and runtime paths confirm DSS source root and order-based tiling:
  - root: `https://alasky.cds.unistra.fr/DSS/DSSColor`
  - local target: `/oras-sky-engine/skydata/surveys/dss/v1`
- Mirror tooling now records and exposes order progress and expected/missing counts in status payloads (`order_min`, `order_max`, `expected_files`, `missing_files_before/after`, `percent_complete`).

### Base star pack mirror result (this run)

Command executed:

```bash
.venv/bin/python scripts/skydata/mirror_public_runtime_data.py \
  --class star_pack_base \
  --confirm-download \
  --resume \
  --checksum-manifest \
  --promote-runtime-pack \
  --order-min 0 \
  --order-max 3 \
  --workers 8 \
  --max-files 5000 \
  --progress \
  --jsonl-progress
```

Result summary:
- status: `incomplete_with_failures`
- expected files: `1021`
- runtime-ready count: `61`
- failed files: `960`
- promotion: now succeeds even on partial results with runtime files (bugfix applied)

### Minimal star pack mirror result (this run)

Command executed with `order-max 4` and `max-files 5000`; run did not complete in this execution window and was stopped.

Current observed runtime state remains:
- `frontend/public/oras-sky-engine/skydata/packs/minimal/stars`: `41` files, `1.1M`
- `vendor/.../test-skydata/packs/minimal/stars`: `41` files, `1.1M`

### Extended blocker status

- `star_pack_extended`: blocked (`properties fetch failed: 403`)
- `dso_pack_extended`: blocked (`properties fetch failed: 403`)
- blocker status is surfaced as `blocked` (not `failed`) with explicit URL/status formatting in Mirror Manager probe messages.

### Mirror Manager truth fixes landed

- Status aggregation now reads real runtime path existence/file count/size and avoids `complete` when runtime size/file count is zero (unless metadata-only class).
- Added row fields for truthful UI:
  - `runtime_file_count`, `runtime_size`, `runtime_path_exists`
  - `expected_files_known`
  - `downloaded_this_run`
  - `failure_breakdown`
- Blocked probe reason now includes exact properties URL and HTTP status.

### Next action

1. Enable Playwright/browser capture in this workspace and run side-by-side official/local resource capture for Epsilon Persei, Capella, and M31 (`fov=0.8`) to finalize the URL/order/format/status table.
2. Continue DSS field-priority cache around the tested targets, then broader order expansion.
3. Continue base/minimal pack mirroring with alternate reachable roots where available; for extended packs, obtain alternate source root or shift to ORAS-owned ingestion.

## Execution Update (2026-05-07, EPH Failure Classification + Runtime Density Verification)

### Base star failure classification

Observed from `data/runtime-packs/packs/base/stars/failed-files.json` after rerun (`order 0..3`):

- HTTP 404: `0`
- HTTP 403: `960`
- timeout: `0`
- connection reset: `0`
- invalid URL: `0`
- wrong extension: `0`
- other: `0`

Conclusion: the current base-star failure mode is access blocking (`403`) at higher orders, not sparse 404 or malformed URL generation.

First 20 failed URLs (all `http_403`) begin at:

- `.../stars/Norder2/Dir0/Npix0.eph`
- `.../stars/Norder2/Dir0/Npix1.eph`
- `.../stars/Norder2/Dir0/Npix2.eph`
- `.../stars/Norder2/Dir0/Npix3.eph`
- `.../stars/Norder2/Dir0/Npix4.eph`
- `.../stars/Norder2/Dir0/Npix5.eph`
- `.../stars/Norder2/Dir0/Npix6.eph`
- `.../stars/Norder2/Dir0/Npix7.eph`
- `.../stars/Norder2/Dir0/Npix8.eph`
- `.../stars/Norder2/Dir0/Npix9.eph`
- `.../stars/Norder2/Dir0/Npix10.eph`
- `.../stars/Norder2/Dir0/Npix11.eph`
- `.../stars/Norder2/Dir0/Npix12.eph`
- `.../stars/Norder2/Dir0/Npix13.eph`
- `.../stars/Norder2/Dir0/Npix14.eph`
- `.../stars/Norder2/Dir0/Npix15.eph`
- `.../stars/Norder2/Dir0/Npix16.eph`
- `.../stars/Norder2/Dir0/Npix17.eph`
- `.../stars/Norder2/Dir0/Npix18.eph`
- `.../stars/Norder2/Dir0/Npix19.eph`

### EPH planner + classification fix

Changes landed in `scripts/skydata/mirror_public_runtime_data.py`:

- Added EPH-specific status classification:
  - `complete`
  - `partial_sparse` (404 sparse candidates)
  - `incomplete_with_failures` (hard failures like 403/timeouts)
- Added sparse vs hard separation in failed manifest:
  - `failed_files`
  - `sparse_missing_files`
- Added EPH status file output (`mirror-status.json`) with:
  - `planned_required`, `planned_candidate`, `observed_known`
  - `sparse_missing_files`
  - runtime count/size and progress fields
- Kept `properties` mandatory and separated from tile loops.

### Resource-list mirroring mode

Added CLI option:

- `--resource-list PATH`

Behavior:

- Reads TXT/JSON/JSONL URL lists.
- Filters to selected class root.
- Mirrors exact listed EPH tiles + properties.
- Preserves relative paths and supports normal promotion.

Added helper script:

- `scripts/skydata/extract_runtime_resource_urls.py`

It extracts `swe-data-packs/*/(stars|dso)` URLs from pasted/resource logs into one-URL-per-line output.

### Source root verification

Direct probe results (2026-05-07):

- minimal stars root:
  - `properties`: 200
  - `Norder0`: 200
  - `Norder1`: 200
  - `Norder2`: 403
- base stars root:
  - `properties`: 200
  - `Norder0`: 200
  - `Norder1`: 200
  - `Norder2`: 403
- base dso root:
  - `properties`: 200
  - `Norder0`: 200
  - `Norder1`: 403
- extended stars root:
  - `properties`: 403
- extended dso root:
  - `properties`: 403

Interpretation: current mirror failures at deeper orders are source-access blocked, not local path/promotion corruption.

### Star pack counts after rerun

`star_pack_base`:

- runtime path: `frontend/public/oras-sky-engine/skydata/packs/base/stars`
- files: `61`
- size: `2.0M`

`star_pack_minimal`:

- runtime path: `frontend/public/oras-sky-engine/skydata/packs/minimal/stars`
- files: `41`
- size: `1.1M`

### Runtime local request evidence

Using `scripts/skydata/capture_runtime_resources.js` at target `Epsilon Persei` and `Capella`, `fov=0.8`:

- Observed local requests (200):
  - `/oras-sky-engine/skydata/packs/minimal/stars/properties`
  - `/oras-sky-engine/skydata/packs/base/stars/properties`
  - `/oras-sky-engine/skydata/packs/base/stars/Norder...eph`
- Forbidden runtime sources observed in local capture:
  - `stellarium.sfo2.cdn.digitaloceanspaces.com`: no
  - `data.stellarium.org`: no
  - `stellarium-web.org`: no
  - `api.noctuasky.com`: no

Note: minimal `Norder` tile requests were not observed in these captures, while base `Norder` tile requests were observed.

### Visual comparison result

- Local runtime now clearly requests local base star tiles (200), but visible density still trails official in tested fields.
- Remaining gap is consistent with source blocking beyond reachable orders (`Norder2+` returning 403 for current pack roots) and extended-pack 403 blockers.

### Remaining blocker

- `star_pack_extended` and `dso_pack_extended` remain blocked (`403`) at properties root.
- Deeper base/minimal coverage is also blocked at current public roots for tested higher orders.
- Next path for parity-density requires alternate reachable roots/version hashes or ORAS-owned ingestion for equivalent catalogs.
