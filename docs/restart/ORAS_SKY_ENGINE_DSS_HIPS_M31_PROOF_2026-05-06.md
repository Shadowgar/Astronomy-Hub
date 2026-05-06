# ORAS Sky-Engine DSS HiPS M31 Proof - 2026-05-06

## Scope

This document records the first bounded ORAS-owned DSS/HiPS survey proof for visible background imagery in the existing Sky Engine runtime.

This proof is limited to:

- a lawful bounded mirror from the official CDS DSS colored HiPS root
- a same-origin runtime tree at `/oras-sky-engine/skydata/surveys/dss/v1`
- visible M31 background imagery proof in the standalone ORAS runtime

This proof does not claim full DSS mirror coverage or general survey parity.

## Authority And Source

Authoritative runtime contract:

- `vendor/stellarium-web-engine/src/hips.c`
- `vendor/stellarium-web-engine/src/hips.h`

Authoritative external source mirrored for this proof:

- source root: `https://alasky.cds.unistra.fr/DSS/DSSColor`
- `creator_did = ivo://CDS/P/DSS2/color`
- `obs_title = DSS colored`
- `hips_order = 9`
- `hips_tile_width = 512`
- `hips_tile_format = jpeg`
- `hips_frame = equatorial`
- `hips_license = ODbL-1.0`
- `obs_copyright = Digitized Sky Survey - STScI/NASA, Colored & Healpixed by CDS`

## Files Changed For This Proof

Code and tests:

- `scripts/skydata/mirror_dss_hips_proof.py`
- `tests/test_dss_hips_proof.py`

Generated proof artifacts:

- `data/raw/surveys/dss-proof/`
- `data/processed/surveys/dss-proof/manifest.json`
- `data/processed/surveys/dss-proof/runtime-ready/surveys/dss/v1/`
- `vendor/stellarium-web-engine/apps/test-skydata/surveys/dss/v1/`
- `frontend/public/oras-sky-engine/skydata/surveys/dss/v1/`

## Proof Boundaries

Mirror settings used for the committed proof:

- target: `m31`
- center: `RA 10.6847083`, `Dec 41.26875`
- radius: `2.5 deg`
- mirrored orders: `0..7`
- tile count: `179`
- staged byte count: `14996170`

The mirror script emits:

- raw source capture under `data/raw/surveys/dss-proof/`
- processed runtime-ready output under `data/processed/surveys/dss-proof/runtime-ready/surveys/dss/v1/`
- `manifest.json` with source URLs, target metadata, runtime path plan, sizes, and checksums

The runtime-ready `properties` file intentionally strips external URLs so the live runtime dependency scanner stays clean.

## Runtime Proof

Observed standalone runtime proof on `http://127.0.0.1:4173/oras-sky-engine/` after rebuild:

- runtime fetched same-origin `GET /oras-sky-engine/skydata/surveys/dss/v1/properties`
- runtime fetched same-origin DSS tiles under `/oras-sky-engine/skydata/surveys/dss/v1/Norder*/Dir*/Npix*.jpg`
- requested bounded-proof tiles included:
  - `Norder3/Dir0/Npix40.jpg`
  - `Norder3/Dir0/Npix41.jpg`
  - `Norder3/Dir0/Npix42.jpg`
  - `Norder3/Dir0/Npix43.jpg`
- browser resource inspection returned no non-origin runtime resource URLs for the session
- visible M31 galaxy background imagery rendered behind the selected-object overlay in the standalone ORAS runtime

Note:

- `/api/sky/search` returned `502` during this browser proof because the ORAS backend was not started in this slice
- local fallback search still surfaced `M31 (Andromeda Nebula)` and the runtime selected it successfully for visual verification

## Build Persistence Proof

The public runtime tree alone is not durable because `scripts/sync-stellarium-runtime.sh` removes `frontend/public/oras-sky-engine` before recopying dist.

To preserve the proof through normal builds, the runtime-ready tree was staged into:

- `vendor/stellarium-web-engine/apps/test-skydata/surveys/dss/v1/`
- `frontend/public/oras-sky-engine/skydata/surveys/dss/v1/`

Then `npm run build:stellarium` rebuilt the vendored runtime and re-synced the public runtime while keeping the DSS proof present.

## Validation Evidence

### 1. Focused unit validation

Command:

```bash
/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest tests/test_dss_hips_proof.py -q
```

Result:

- `6 passed in 0.41s`

### 2. Dry-run plan proof

Command:

```bash
/home/rocco/Astronomy-Hub/.venv/bin/python scripts/skydata/mirror_dss_hips_proof.py --target m31 --dry-run
```

Result:

- `downloaded = false`
- `tile_count = 179`
- `manifest_path = /home/rocco/Astronomy-Hub/data/processed/surveys/dss-proof/manifest.json`

### 3. Real bounded mirror proof

Command:

```bash
/home/rocco/Astronomy-Hub/.venv/bin/python scripts/skydata/mirror_dss_hips_proof.py --target m31 --confirm-download
```

Result:

- `downloaded = true`
- `tile_count = 179`
- `byte_count = 14996170`

### 4. Rebuild proof

Command:

```bash
npm run build:stellarium
```

Result:

- vendored Sky Engine production build completed
- `scripts/sync-stellarium-runtime.sh` reported `Synced ORAS Sky-Engine runtime to /home/rocco/Astronomy-Hub/frontend/public/oras-sky-engine`

### 5. Runtime dependency scan proof

Command:

```bash
npm run scan:runtime-external-deps:fail
```

Result:

- top-level status: `pass`
- `runtime_forbidden = 0`

## Current Outcome

- the ORAS standalone runtime can now load real local DSS background imagery from `/oras-sky-engine/skydata/surveys/dss/v1`
- the bounded proof is same-origin only at runtime
- the proof does not modify or regenerate any live promoted star assets
- remaining work for a future slice is broader survey coverage, not first-proof viability