# ORAS Major Catalog Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a visible, mounted ORAS catalog-pack release spanning stars, DSOs, double stars, and unusual objects in `/oras-sky-engine/`.

**Architecture:** Versioned JSONL catalog packs are generated outside git and mounted read-only into frontend and backend containers. The browser loads them directly for status/search/detail/overlay behavior while the backend indexes the same records for exact links; native SWE HATS/Eph packs remain the dense renderer path.

**Tech Stack:** Python 3.12, FastAPI, Vue 2/Vuetify, Stellarium Web Engine, JSONL, Docker Compose, pytest, Vitest, Playwright.

---

### Task 1: Catalog Pack Contract And Builder

**Files:**
- Create: `scripts/skydata/catalog_pack.py`
- Create: `scripts/skydata/build_oras_catalog_release.py`
- Create: `backend/tests/test_catalog_pack_builder.py`
- Modify: `.gitignore`

**Steps:**
1. Write failing tests for manifest validation, string IDs, bounded chunks,
   checksums, source attribution, duplicate identities, and omitted unknowns.
2. Run `python -m pytest backend/tests/test_catalog_pack_builder.py -q` and
   verify failure because the builder is absent.
3. Implement canonical record normalization, chunk writing, manifest writing,
   and validation.
4. Add ignored generated-pack paths without hiding source/tests/manifests.
5. Run tests and commit `Add ORAS catalog pack contract and builder`.

### Task 2: Backend Pack Index And Exact Links

**Files:**
- Create: `backend/app/services/catalog_pack_service.py`
- Create: `backend/tests/test_catalog_pack_service.py`
- Modify: `backend/app/services/sky_catalog_service.py`
- Modify: `backend/app/routes/sky.py`
- Modify: `docker-compose.yml`

**Steps:**
1. Write failing tests for mounted manifest status, search, exact lookup,
   deduplication, malformed pack isolation, and missing-pack fallback.
2. Verify RED with targeted pytest.
3. Implement lazy manifest/chunk indexing and `/api/sky/catalog-packs`.
4. Merge pack search into `/api/sky/search` and pack identities into
   `/api/sky/object` without changing existing catalog precedence.
5. Mount the generated directory read-only into frontend and backend.
6. Run backend catalog/search/above-me tests and commit
   `Add mounted catalog pack API support`.

### Task 3: Runtime Loader And Status UI

**Files:**
- Create: `vendor/stellarium-web-engine/apps/web-frontend/src/assets/oras_catalog_packs.js`
- Create: `vendor/stellarium-web-engine/apps/web-frontend/src/components/oras-catalog-status-dialog.vue`
- Modify: `vendor/stellarium-web-engine/apps/web-frontend/src/App.vue`
- Modify: `vendor/stellarium-web-engine/apps/web-frontend/src/assets/oras_data_config.js`
- Modify: `frontend/tests/orasRuntimeDataSources.test.js`
- Create: `frontend/tests/orasCatalogPacks.test.js`

**Steps:**
1. Write failing Vitest assertions for graceful missing manifests, checksum/count
   validation, pack status, deduped search, and visible status component wiring.
2. Verify RED.
3. Implement direct same-origin manifest/chunk loading and reactive status.
4. Add the drawer action and visible pack status dialog.
5. Verify tests and commit `Load ORAS catalog packs in Sky Engine`.

### Task 4: Enriched Runtime Search And Detail

**Files:**
- Modify: `vendor/stellarium-web-engine/apps/web-frontend/src/components/skysource-search.vue`
- Modify: `vendor/stellarium-web-engine/apps/web-frontend/src/components/selected-object-info.vue`
- Modify: `vendor/stellarium-web-engine/apps/web-frontend/src/assets/oras_data_config.js`
- Modify: `vendor/stellarium-web-engine/apps/web-frontend/src/assets/sw_helpers.js`
- Modify: `frontend/tests/orasRuntimeSearchRouting.test.js`
- Modify: `frontend/tests/orasCatalogPacks.test.js`

**Steps:**
1. Write failing tests for catalog badges, ORAS Enhanced metadata, property
   honesty, pack search merging, and exact identity preservation.
2. Verify RED.
3. Preserve enrichment fields through `toOrasSkySource()` and selection.
4. Add visible search badges and detail metadata/source blocks.
5. Add bounded coordinate overlay materialization for unsupported models.
6. Verify tests and commit `Show enriched ORAS catalog objects in Sky Engine`.

### Task 5: Build Source-Backed Release Packs

**Files:**
- Create: `scripts/skydata/catalog_sources/*.py`
- Create: `backend/tests/test_catalog_release_sources.py`
- Modify: `scripts/skydata/build_oras_catalog_release.py`
- Modify: `backend/app/data/sky/catalog_registry.json`

**Steps:**
1. Write failing adapter tests with authoritative source fixtures for stars,
   DSOs, doubles, and unusual objects.
2. Verify RED.
3. Implement adapters for existing Hipparcos/OpenNGC plus acquired Gaia DR3,
   Tycho-2, Gliese, WDS/Struve, nebula/cluster/galaxy aliases, ATNF,
   quasar, and black-hole source files where terms and schemas are confirmed.
4. Generate mounted release packs and validate counts/checksums.
5. Verify required search examples and commit
   `Build source-backed ORAS catalog release packs`.

### Task 6: Rebuild Runtime And Acceptance Harness

**Files:**
- Modify: `scripts/skydata/validate_oras_deep_links.js`
- Create: `scripts/skydata/validate_oras_catalog_release.js`
- Modify: `package.json`
- Modify: `scripts/skydata/README.md`

**Steps:**
1. Write failing harness assertions for pack status, representative searches,
   enriched details, existing satellites, planets, and exact links.
2. Verify RED.
3. Add deterministic browser validation and screenshot capture under
   `output/playwright/catalog-release/`.
4. Run `npm run build:stellarium` and verify the runtime build marker/hash.
5. Run frontend/backend tests and commit
   `Validate ORAS major catalog runtime release`.

### Task 7: Docker And Full Release Validation

**Files:**
- Modify only files directly required by observed validation failures.

**Steps:**
1. Run `git diff --check`.
2. Run `python -m pytest backend/tests -q`.
3. Run `cd frontend && npm run test`.
4. Run `npm run validate:oras-deep-links` and the catalog release harness.
5. Run `COMPOSE_BAKE=false docker compose up -d --build frontend backend` and
   `docker compose ps`.
6. Verify all required browser searches/details and capture artifacts.
7. Review spec compliance and code quality; fix only proven defects.

### Task 8: Release Commit And Pull Request

**Files:**
- Update generated-pack instructions and final source/count tables only.

**Steps:**
1. Record committed versus mounted packs, counts, sizes, source versions,
   runtime bundle name/hash, renderer-density result, and real remaining gaps.
2. Verify no raw catalog bulk, skydata bulk, cache, environment, or full vendor
   tree is staged.
3. Push `sky-engine-major-catalog-update-1`.
4. Open PR `Add ORAS major catalog update` with acceptance evidence and
   screenshots.
