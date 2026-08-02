# Above-Me Category-Balanced Curation Implementation Plan

> Execution note: implement this plan test-first and validate Docker as the
> authoritative runtime.

**Goal:** Ensure bounded `/api/above-me` responses contain a useful mix of
visible Solar System, DSO, bright-star, and satellite candidates when those
categories are available.

**Architecture:** Keep all candidate builders and astronomy calculations
unchanged. Add a small category classifier and a reservation phase to the final
curation selector, then fill remaining slots with the existing ranking while
preserving Tier 2 caps and DSO alias deduplication.

**Stack:** Python 3.12, FastAPI, pytest, Docker Compose.

---

## Task 1: Lock the expected curation behavior with failing tests

**Files:**

- Modify: `backend/tests/test_above_me_api.py`

1. Add a fixture helper that creates minimal visible candidates with stable
   catalog/source/model identity.
2. Add a selector test where high-priority Tier 2 stars would otherwise crowd
   out Solar System, DSO, Bright Star, and satellite representatives.
3. Add a small-limit test proving category representatives are chosen by the
   existing sort key and the result stays bounded.
4. Add a fill test proving the Tier 2 cap and DSO deduplication still apply.
5. Run the new tests and confirm they fail for missing category reservation.

## Task 2: Implement deterministic category reservation

**Files:**

- Modify: `backend/app/services/above_me_service.py`

1. Add constants for the Bright Star catalog and reservable category order.
2. Add a small classifier for Solar System, DSO, Bright Star, and satellite
   candidates.
3. Identify the best globally ranked representative for each available
   category.
4. Reserve all representatives that fit, or the best-ranked subset for small
   limits.
5. Fill remaining slots through one constraint-aware selection path that keeps
   Tier 2 caps and DSO deduplication.
6. Return the selected candidates in the existing global order.

## Task 3: Run focused and regression tests

**Files:** none expected.

1. Run the new selector tests.
2. Run `backend/tests/test_above_me_api.py`.
3. Run the related Gaia, OpenNGC, solar-system, satellite, and planetary
   ephemeris tests.
4. Run the full backend suite.
5. Run frontend runtime routing and data-source tests even though frontend code
   is unchanged.

## Task 4: Validate the authoritative runtime

**Files:** none expected.

1. Rebuild only the backend from the feature worktree; do not recreate the
   working frontend or alter its canonical skydata mount.
2. Confirm backend, frontend, Postgres, Redis, and Stellarium reference health.
3. Query `/api/above-me` at deterministic observer/time combinations and prove
   bounded category diversity when categories are available.
4. Confirm catalog packs remain mounted with 158,217 objects.
5. Run the exact deep-link browser harness and confirm satellites still parse
   14,281 records.

## Task 5: Review and publish

**Files:** only the two plan documents, selector service, and tests.

1. Run `git diff --check` and inspect the complete diff.
2. Commit with a bounded message.
3. Push the branch and open a pull request describing the curation guarantee and
   unchanged astronomy calculations.
4. Address only actionable review or CI defects.
