# ORAS Canonical Star Chain Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the overlapping ORAS dense-star overlay with a source-backed, cross-identified native star chain that preserves Stellarium magnitude behavior, photometry, and exact-link native selection.

**Architecture:** The catalog source adapters retain explicit Gaia, Hipparcos, and Tycho identifiers and photometric systems. The dense-star builder reconciles records through authoritative cross-identifiers, emits one native EPHE row per canonical identity, and reports skipped or transformed data. The frontend chooses either the untouched stock bright-star packs or one canonical ORAS profile, then registers the bundled Gaia continuation under SWE's native `gaia` key.

**Tech Stack:** Python 3.12, pytest, Vue 2, JavaScript, Vitest, Stellarium Web Engine EPHE/HiPS star surveys, Docker Compose, Playwright.

---

### Task 1: Preserve source photometry and cross-identifiers

**Files:**
- Modify: `backend/tests/test_catalog_release_sources.py`
- Modify: `scripts/skydata/catalog_sources/stars.py`
- Modify: `scripts/skydata/catalog_pack.py`

**Step 1: Write failing importer tests**

Add tests proving:

- Gaia DR3 retains `gaia_g_mag`, `gaia_bp_rp`, `hip_id`, `tycho2_id`, and coordinate epoch
- Tycho-2 retains `tycho_bt_mag`, `tycho_vt_mag`, and `hip_id`
- Hipparcos retains explicit `johnson_v_mag`, `johnson_bv`, and `hip_id`
- large Gaia IDs remain strings

**Step 2: Run tests and verify RED**

Run:

```bash
.venv/bin/python -m pytest backend/tests/test_catalog_release_sources.py -q
```

Expected: new field assertions fail because the source adapters currently emit only generic magnitude and color fields.

**Step 3: Implement explicit source fields**

Retain backward-compatible generic fields while adding explicit source-backed
photometric and crossmatch fields. Add those optional fields to catalog-pack
detail serialization.

**Step 4: Run tests and verify GREEN**

Run the same pytest command. Expected: all tests pass.

**Step 5: Commit**

```bash
git add backend/tests/test_catalog_release_sources.py scripts/skydata/catalog_sources/stars.py scripts/skydata/catalog_pack.py
git commit -m "Preserve star crossmatches and photometric systems"
```

### Task 2: Build canonical star identities and photometry

**Files:**
- Modify: `backend/tests/test_oras_dense_star_tiles.py`
- Modify: `scripts/skydata/build_oras_dense_star_tiles.py`

**Step 1: Write failing canonicalization tests**

Create fixture records for:

- one Gaia/HIP/Tycho physical star joined by source IDs
- Mizar A and Mizar B as distinct authoritative identities
- an unmatched Gliese record
- Gaia-only and Tycho-only stars with valid and invalid colors

Assert:

- one output row is produced for the Gaia/HIP/Tycho identity group
- Mizar A and B remain separate
- no position-only deduplication occurs
- unmatched Gliese is skipped from rendering with an explicit reason
- aliases and Gaia/HIP/Tycho IDs survive
- Gaia BP-RP is not copied directly into `bv`
- Gaia and Tycho transformations produce finite V/B-V only inside documented ranges

**Step 2: Run tests and verify RED**

```bash
.venv/bin/python -m pytest backend/tests/test_oras_dense_star_tiles.py -q
```

Expected: duplicate rows remain and photometric assertions fail.

**Step 3: Implement canonicalization**

Add:

- authoritative identifier extraction
- union-find grouping by Gaia/HIP/Tycho IDs
- deterministic astrometry and metadata priority
- Johnson, Tycho, and Gaia photometry resolution
- source-backed alias aggregation
- explicit skipped/transformation counters

Do not use positional merging.

**Step 4: Run tests and verify GREEN**

Run the same pytest command. Expected: all dense-star builder tests pass.

**Step 5: Commit**

```bash
git add backend/tests/test_oras_dense_star_tiles.py scripts/skydata/build_oras_dense_star_tiles.py
git commit -m "Reconcile canonical native star records"
```

### Task 3: Validate canonical release invariants

**Files:**
- Modify: `backend/tests/test_oras_dense_star_tiles.py`
- Modify: `scripts/skydata/validate_oras_dense_star_tiles.py`

**Step 1: Write failing validation tests**

Assert that validation rejects manifests missing:

- `catalog_mode: canonical_replacement`
- identity reconciliation counts
- photometry provenance counts
- explicit native continuation metadata

Assert generated profiles expose these fields.

**Step 2: Run tests and verify RED**

```bash
.venv/bin/python -m pytest backend/tests/test_oras_dense_star_tiles.py -q
```

Expected: current schema has none of the canonical-chain invariants.

**Step 3: Implement validator changes**

Extend schema validation without reading generated bulk into application
startup. Keep checksums, tile counts, string identity, and ignored-data
requirements intact.

**Step 4: Run tests and verify GREEN**

Run the same pytest command. Expected: all tests pass.

**Step 5: Commit**

```bash
git add backend/tests/test_oras_dense_star_tiles.py scripts/skydata/validate_oras_dense_star_tiles.py
git commit -m "Validate canonical dense star releases"
```

### Task 4: Replace stock bright packs when an ORAS profile is active

**Files:**
- Modify: `frontend/tests/orasRuntimeDataSources.test.js`
- Modify: `vendor/stellarium-web-engine/apps/web-frontend/src/App.vue`
- Modify: `vendor/stellarium-web-engine/apps/web-frontend/src/assets/oras_dense_stars.js`

**Step 1: Write failing runtime registration tests**

Assert source code and manager behavior enforce:

- `off` registers minimal/base/extended plus bundled Gaia
- active canonical profile registers that profile instead of minimal/base/extended
- bundled Gaia remains registered with key `gaia`
- canonical profile registration completes before Gaia registration
- no active path loads both stock bright packs and canonical profile

**Step 2: Run tests and verify RED**

```bash
cd frontend
npm run test -- tests/orasRuntimeDataSources.test.js
```

Expected: App currently registers stock packs before the asynchronous ORAS profile.

**Step 3: Implement ordered registration**

Make data-source initialization await dense-star manifest resolution before
choosing the bright chain. Preserve explicit degraded fallback to the stock
chain when the canonical release is missing or invalid.

**Step 4: Run tests and verify GREEN**

Run the same Vitest command. Expected: all tests pass.

**Step 5: Commit**

```bash
git add frontend/tests/orasRuntimeDataSources.test.js vendor/stellarium-web-engine/apps/web-frontend/src/App.vue vendor/stellarium-web-engine/apps/web-frontend/src/assets/oras_dense_stars.js
git commit -m "Use canonical ORAS star chain without overlap"
```

### Task 5: Prefer native stars for exact links

**Files:**
- Modify: `frontend/tests/orasRuntimeSearchRouting.test.js`
- Modify: `vendor/stellarium-web-engine/apps/web-frontend/src/App.vue`
- Modify: `vendor/stellarium-web-engine/apps/web-frontend/src/assets/sw_helpers.js`

**Step 1: Write failing exact-link tests**

Assert:

- native designations are ordered HIP, Gaia, Tycho, then names
- native resolution retries before fallback materialization
- a native match is selected and camera-locked without creating a fallback
- unresolved API-only stars still receive one controlled fallback after timeout

**Step 2: Run tests and verify RED**

```bash
cd frontend
npm run test -- tests/orasRuntimeSearchRouting.test.js
```

Expected: exact routes currently create fallback stars immediately when the
first native lookup misses.

**Step 3: Implement bounded native retry**

Add a reusable async native-star resolver with bounded attempts and delay.
Retry only star routes. Preserve existing immediate behavior for non-star
objects. Keep route errors controlled.

**Step 4: Run tests and verify GREEN**

Run the same Vitest command. Expected: all tests pass.

**Step 5: Commit**

```bash
git add frontend/tests/orasRuntimeSearchRouting.test.js vendor/stellarium-web-engine/apps/web-frontend/src/App.vue vendor/stellarium-web-engine/apps/web-frontend/src/assets/sw_helpers.js
git commit -m "Bind exact star links to native SWE objects"
```

### Task 6: Rebuild runtime from source

**Files:**
- Modify generated runtime output under: `frontend/public/oras-sky-engine/`

**Step 1: Build source-backed catalog release**

```bash
npm run catalog:build
```

Expected: mounted/ignored catalog release regenerates with explicit photometry
and crossmatch fields.

**Step 2: Build and validate canonical star tiles**

```bash
npm run dense-stars:build
npm run dense-stars:validate -- data/runtime-packs/dense-star-tiles
```

Expected: all profiles validate and report canonical identity and photometry
statistics.

**Step 3: Rebuild Stellarium runtime**

```bash
npm run build:stellarium
```

Expected: source changes produce a new hashed app bundle and
`oras-runtime-build.json`; no generated bundle is hand-edited.

**Step 4: Commit runtime build**

Stage only the generated shell/runtime files selected by the established build
workflow. Do not stage catalog packs or dense-star tiles.

### Task 7: Full validation and browser acceptance

**Files:**
- Modify if required: `scripts/skydata/validate_oras_dense_stars.js`
- Generated ignored artifacts: `output/playwright/dense-stars/`

**Step 1: Run static and automated tests**

```bash
git diff --check
.venv/bin/python -m pytest backend/tests -q
cd frontend && npm run test && cd ..
npm run validate:oras-deep-links
```

**Step 2: Start authoritative Docker runtime**

```bash
COMPOSE_BAKE=false docker compose up -d --build frontend backend postgres redis stellarium-reference
docker compose ps
```

Expected: required services are healthy.

**Step 3: Run dense-star browser validation**

```bash
npm run validate:oras-dense-stars
```

Extend the harness if necessary to capture Mizar/Alcor and Caph at deep zoom
and compare `off` against `visual-default`.

**Step 4: Verify acceptance**

Confirm:

- no extra Mizar, Alcor, or Caph copies
- no wide-FOV bright-star flooding
- bright blob metrics stay within limits
- source-backed color variation is visible
- exact HIP/Gaia/Tycho links select native stars when available
- fallback still works when no native star exists
- catalog packs remain mounted and bounded
- satellites still parse a positive current release count
- planets, DSOs, and deep links remain operational

**Step 5: Final commit**

```bash
git status --short
git diff --check
git add <only files belonging to this pass>
git commit -m "Correct ORAS native star catalog rendering"
```
