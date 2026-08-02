# ORAS Local Planetary Ephemeris Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Serve source-backed Sun, Moon, and major-planet positions locally from a mounted JPL DE442s kernel, with controlled Horizons fallback.

**Architecture:** A deterministic acquisition/validation pipeline installs an ignored DE442s runtime pack. A Skyfield service validates and loads that pack, computes topocentric positions, and feeds the existing solar-system APIs through a local-first provider adapter without changing object identities or links.

**Tech Stack:** Python, Skyfield, FastAPI, pytest, Docker Compose, JPL/NAIF SPK/BSP, SHA-256 manifests.

---

### Task 1: Runtime Pack Contract And Acquisition

**Files:**
- Create: `scripts/skydata/build_oras_planetary_ephemeris.py`
- Create: `scripts/skydata/validate_oras_planetary_ephemeris.py`
- Modify: `package.json`
- Modify: `.gitignore`
- Modify: `.dockerignore`

1. Write failing tests for manifest schema, checksum rejection, and ignored data.
2. Run the tests and confirm failures are caused by missing scripts.
3. Implement atomic DE442s download, fixed source URL/checksum validation, and manifest-last publication.
4. Implement offline release validation through size, checksum, filename, coverage, and Skyfield-open checks.
5. Run the focused tests and build/validate the local ignored release.

### Task 2: Skyfield Local Propagation Service

**Files:**
- Create: `backend/app/services/planetary_ephemeris_service.py`
- Create: `backend/tests/test_planetary_ephemeris_service.py`

1. Write failing tests for pack status, deterministic local propagation, string body identities, valid coordinate ranges, source metadata, and out-of-range rejection.
2. Run tests to confirm the local service is absent.
3. Implement cached manifest/kernel loading with no automatic network download.
4. Implement observer-specific RA/Dec, alt/az, distance, UTC basis, and disclosed barycenter references.
5. Run focused service tests against both missing-pack and mounted-pack modes.

### Task 3: Local-First Provider With Horizons Fallback

**Files:**
- Modify: `backend/app/services/live_providers.py`
- Modify: `backend/app/services/solar_system_catalog_service.py`
- Modify: `backend/app/services/above_me_service.py`
- Modify: `backend/tests/test_above_me_api.py`
- Create: `backend/tests/test_planetary_ephemeris_provider.py`

1. Write failing tests proving local results are preferred and Horizons is used only when local data is unavailable.
2. Prove `/api/sky/object` and `/api/above-me` work with network Horizons disabled.
3. Implement the minimal local-first adapter while preserving monkeypatch and cache behavior.
4. Add source/provenance fields and accurate Above Me source-status metadata.
5. Run focused API/provider tests and existing solar-system tests.

### Task 4: Docker Runtime Mount And Status

**Files:**
- Modify: `docker-compose.yml`
- Modify: `docker-compose.prod.yml`
- Modify: `backend/app/routes/sky.py` or the existing sky router owning status endpoints
- Modify: `backend/app/main.py` only if router registration is required
- Create or modify: backend API tests for ephemeris status

1. Write a failing API test for mounted/degraded ephemeris status.
2. Add `ORAS_PLANETARY_EPHEMERIS_DIR=/runtime/oras-planetary-ephemeris` and a read-only backend mount in development and production Compose.
3. Add a bounded status endpoint or existing sky-status section reporting release, coverage, source, and errors without exposing the kernel.
4. Rebuild the backend and prove the kernel is mounted but absent from the image filesystem when the mount is removed.

### Task 5: End-To-End Validation And Delivery

**Files:**
- Modify tests or documentation only when validation proves a gap.

1. Run `git diff --check`.
2. Run `.venv/bin/python -m pytest backend/tests -q`.
3. Run `cd frontend && npm run test`.
4. Run the ephemeris build and validation commands.
5. Run `COMPOSE_BAKE=false docker compose up -d --build backend frontend postgres redis stellarium-reference`.
6. Verify local-source `/api/sky/object` responses for Moon, Venus, Mars, Jupiter, and Saturn.
7. Verify `/api/above-me` returns local-source solar-system candidates with Horizons disabled.
8. Run `npm run validate:oras-deep-links` and confirm `14,281` satellites still parse.
9. Commit only source, tests, scripts, manifests/templates, Compose, and docs; do not stage `de442s.bsp` or generated runtime data.
