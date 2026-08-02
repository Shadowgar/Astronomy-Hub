# Above-Me Production Readiness Implementation Plan

> Execution note: implement test-first and validate Docker as the authoritative
> runtime.

**Goal:** Freeze the Above Me v1 response contract, expose category coverage,
and eliminate repeated full candidate assembly with a safe short-lived Redis
cache.

**Architecture:** Keep the existing candidate builders and selector unchanged.
Wrap the successful payload assembly with a versioned exact-request cache and
derive observability metadata from visible and selected candidates.

**Stack:** Python 3.12, FastAPI, Redis, pytest, Docker Compose.

---

## Task 1: Add failing cache and metadata tests

**Files:**

- Modify: `backend/tests/test_above_me_api.py`

1. Disable real Redis access in the existing autouse fixture.
2. Add a deterministic in-memory fake for cache hit/miss tests.
3. Prove identical explicit requests build candidates once.
4. Prove explicit times are exact cache-key inputs.
5. Prove corrupt cached data falls back to recomputation.
6. Prove Redis failure returns correct data with degraded metadata.
7. Prove contract version and curation coverage metadata.
8. Run the new tests and confirm the missing behavior fails.

## Task 2: Implement versioned response caching

**Files:**

- Modify: `backend/app/services/above_me_service.py`

1. Add cache constants and Redis cache imports.
2. Parse request values before cache access.
3. Build a canonical hashed key with exact observer values and explicit time.
4. Use a 30-second bucket only when time is omitted.
5. Validate cached JSON before returning it.
6. Cache only successful cache-neutral payloads.
7. Add hit, miss, or degraded metadata without mutating stored data.

## Task 3: Add curation coverage metadata and freeze v1

**Files:**

- Modify: `backend/app/services/above_me_service.py`
- Modify: `docs/contracts/above_me_api_contract.md`

1. Add `meta.contract_version=above-me.v1`.
2. Derive available categories from visible candidates.
3. Count selected primary categories.
4. Report missing categories and whether reservation was satisfied.
5. Document cache behavior, category semantics, and compatibility rules.

## Task 4: Validate local and Docker behavior

1. Run focused Above Me tests.
2. Run related catalog, ephemeris, and satellite tests.
3. Run the full backend suite.
4. Run frontend tests as a contract regression.
5. Rebuild only the backend using canonical mounted runtime data.
6. Measure a cold and warm deterministic request.
7. Confirm warm response cache status and materially reduced latency.
8. Confirm category-balanced `limit=4`, catalog pack count, Sky Engine HTTP 200,
   exact links, and 14,281 parsed satellites.

## Task 5: Review and publish

1. Run `git diff --check` and inspect the complete diff.
2. Commit only the service, tests, contract, and plan documents.
3. Push and open a bounded pull request.
4. Address only actionable review or CI findings.
