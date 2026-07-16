# ORAS Satellite Freshness Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build, validate, atomically install, mount, and report a fresh source-backed CelesTrak TLE release for ORAS Sky Engine.

**Architecture:** An administrative Python builder fetches or reads one CelesTrak `GROUP=active&FORMAT=TLE` payload, normalizes validated 3LE records into deterministic double-gzip ORAS JSONL, and writes a checksum manifest. A shell installer validates and atomically swaps release directories; Docker mounts the selected release read-only, and a FastAPI status endpoint reports deployment and epoch freshness without loading bulk payloads into browser startup.

**Tech Stack:** Python 3.12 standard library, FastAPI/Pydantic response envelope, Bash, Docker Compose, pytest, existing Stellarium Web Engine JSONL/TLE loader.

---

### Task 1: Deterministic CelesTrak Release Builder

**Files:**
- Create: `scripts/skydata/build_oras_satellite_tle_release.py`
- Create: `backend/tests/test_satellite_tle_release_pipeline.py`

**Step 1: Write failing parser/build tests**

Cover valid ISS/HST 3LE records, string NORAD identity, COSPAR aliases,
malformed/checksum rejection, duplicate replacement, deterministic NORAD sort,
Starlink grouping from source names, and absence of fabricated magnitude/status.

**Step 2: Run tests and verify RED**

```bash
.venv/bin/python -m pytest backend/tests/test_satellite_tle_release_pipeline.py -q
```

Expected: import failure because the builder does not exist.

**Step 3: Implement the minimal builder**

Provide functions to:

- parse and checksum TLE lines
- normalize source-backed ORAS records
- write inner gzip and outer gzip with `mtime=0`
- write `manifest.json` after the feed
- accept `--input`, `--output`, `--release-version`, `--acquired-at`,
  `--minimum-count`, and repeated `--required-norad`
- fetch the official CelesTrak URL only when `--input` is omitted
- use one request with an explicit user agent and bounded timeout

**Step 4: Run tests and verify GREEN**

Run the Task 1 test command and require all tests to pass.

**Step 5: Commit**

```bash
git add scripts/skydata/build_oras_satellite_tle_release.py backend/tests/test_satellite_tle_release_pipeline.py
git commit -m "Add deterministic CelesTrak satellite release builder"
```

### Task 2: Release Validation And Atomic Install

**Files:**
- Modify: `scripts/skydata/build_oras_satellite_tle_release.py`
- Create: `scripts/skydata/install_oras_satellite_tle_release.sh`
- Create: `backend/tests/test_satellite_tle_deployment.py`

**Step 1: Write failing validation/install tests**

Require detection of checksum mismatch, malformed nested gzip, manifest/feed
count mismatch, missing required NORAD IDs, symlinked source content, symlink
target rejection, manifest-last staging, previous-release backup, and installed
release revalidation.

**Step 2: Run tests and verify RED**

```bash
.venv/bin/python -m pytest backend/tests/test_satellite_tle_deployment.py -q
```

**Step 3: Implement validation and install**

Add `--validate-only` to the builder and create a Bash installer patterned after
the catalog-pack installer. Validate before staging, copy the feed first and
manifest last, reject symlinks, atomically rename `current`, retain
`current.previous-<timestamp>`, and validate the installed target.

**Step 4: Run deployment tests and verify GREEN**

Run both satellite release test files.

**Step 5: Commit**

```bash
git add scripts/skydata/build_oras_satellite_tle_release.py scripts/skydata/install_oras_satellite_tle_release.sh backend/tests/test_satellite_tle_deployment.py
git commit -m "Add satellite release validation and atomic install"
```

### Task 3: Satellite Feed Status API

**Files:**
- Create: `backend/app/services/satellite_feed_status_service.py`
- Create: `backend/app/routes/satellite_feed.py`
- Modify: `backend/app/routes/__init__.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_satellite_feed_api.py`

**Step 1: Write failing API tests**

Require `/api/sky/satellite-feed` to report mounted status, source URL, release,
record count, checksum, epoch bounds, ISS/HST presence, nearest/newest freshness,
TLE format limitation, and explicit degraded responses for missing/corrupt
manifest or feed. The endpoint must not emit the bulk records.

**Step 2: Run tests and verify RED**

```bash
.venv/bin/python -m pytest backend/tests/test_satellite_feed_api.py -q
```

**Step 3: Implement status service and route**

Read `ORAS_SATELLITE_TLE_MANIFEST_PATH`, defaulting beside
`SATELLITE_TLE_FEED_PATH`. Validate safe manifest fields and use the existing
satellite freshness calculations for an optional ISO-8601 `time` query.

**Step 4: Run tests and verify GREEN**

Run the status API, existing TLE catalog, propagation, and above-me tests.

**Step 5: Commit**

```bash
git add backend/app/services/satellite_feed_status_service.py backend/app/routes/satellite_feed.py backend/app/routes/__init__.py backend/app/main.py backend/tests/test_satellite_feed_api.py
git commit -m "Expose ORAS satellite feed deployment status"
```

### Task 4: Runtime Mounts, Commands, And Data Exclusions

**Files:**
- Modify: `docker-compose.yml`
- Modify: `docker-compose.prod.yml`
- Modify: `package.json`
- Modify: `.gitignore`
- Modify: `.dockerignore`
- Modify: `frontend/.dockerignore`
- Modify: `scripts/prepare-stellarium-reference.sh`
- Modify: `backend/tests/test_satellite_tle_deployment.py`
- Modify: `frontend/tests/orasRuntimeDataSources.test.js`

**Step 1: Write failing static/deployment tests**

Require root commands `satellites:build`, `satellites:validate`, and
`satellites:install`; read-only backend/frontend mounts controlled by
`ORAS_SATELLITE_TLE_HOST_DIR`; Docker exclusion of generated satellite data;
and removal of the Stellarium CDN refresh URL from the legacy preparation
script.

**Step 2: Run tests and verify RED**

```bash
.venv/bin/python -m pytest backend/tests/test_satellite_tle_deployment.py -q
cd frontend && npm run test -- tests/orasRuntimeDataSources.test.js
```

**Step 3: Implement configuration**

Add package commands, ignored runtime paths, generated-data Docker exclusions,
read-only mounts, backend manifest/feed environment paths, and a legacy script
message directing operators to the new pipeline instead of Stellarium CDN.

**Step 4: Run tests and verify GREEN**

Run the Task 4 tests and `git check-ignore` against a generated fixture release.

**Step 5: Commit**

```bash
git add docker-compose.yml docker-compose.prod.yml package.json .gitignore .dockerignore frontend/.dockerignore scripts/prepare-stellarium-reference.sh backend/tests/test_satellite_tle_deployment.py frontend/tests/orasRuntimeDataSources.test.js
git commit -m "Mount satellite TLE releases outside Docker images"
```

### Task 5: Deployment Runbook And Real Release

**Files:**
- Create: `docs/runtime/ORAS_SATELLITE_TLE_DEPLOYMENT.md`
- Modify: `docs/contracts/above_me_api_contract.md`

**Step 1: Document exact operations**

Document source/access policy, six-hour scheduler example, build/validate/install,
container recreation, status endpoint, rollback, missing/degraded behavior, and
the six-digit/OMM limitation.

**Step 2: Build one real release**

```bash
npm run satellites:build
npm run satellites:validate
```

Require a positive active count, fresh epochs, ISS, HST, valid checksums, and two
gzip layers. Generated output must remain ignored.

**Step 3: Install the release**

```bash
npm run satellites:install
```

Validate `current` and confirm a previous release can be retained on a repeated
fixture install.

**Step 4: Commit documentation only**

```bash
git add docs/runtime/ORAS_SATELLITE_TLE_DEPLOYMENT.md docs/contracts/above_me_api_contract.md
git commit -m "Document ORAS satellite TLE deployment"
```

### Task 6: Full Runtime Verification And PR

**Files:**
- No new production files expected.

**Step 1: Static and test validation**

```bash
git diff --check
.venv/bin/python -m pytest backend/tests -q
cd frontend && npm run test
```

**Step 2: Pipeline validation**

```bash
npm run satellites:validate
git check-ignore data/runtime-packs/satellite-tle/current/tle_satellite.jsonl.gz
```

**Step 3: Docker validation**

```bash
ORAS_SATELLITE_TLE_HOST_DIR="$PWD/data/runtime-packs/satellite-tle/current" \
COMPOSE_BAKE=false docker compose up -d --build backend frontend postgres redis stellarium-reference
docker compose ps
curl -fsS http://127.0.0.1:8000/api/sky/satellite-feed
```

Require mounted/fresh status and a positive count.

**Step 4: Browser/runtime validation**

```bash
npm run validate:oras-deep-links
```

Require positive satellite parse count, ISS exact-link success, no gzip failure,
and current `/api/above-me` propagated candidates when geometry permits.

**Step 5: Final review and PR**

Commit any validation-only corrections, push
`sky-engine-satellite-freshness-pipeline-1`, and open a PR titled:

```text
Add ORAS satellite freshness pipeline
```
