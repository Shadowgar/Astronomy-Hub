# Above-Me Category-Balanced Curation Design

## Status

Approved for implementation on 2026-08-02.

## Problem

`/api/above-me` currently builds source-backed candidates for Solar System
bodies, bright stars, Hipparcos Tier 2 stars, DSOs, and propagated satellites.
The final selector globally ranks those candidates. A sufficiently strong group
from one source can consume the response limit even when other useful object
classes are visible.

At the ORAS reference location and time, this allowed visible Solar System
bodies to be omitted from a bounded result despite valid local ephemeris data.
That is unsuitable for the future "What's above you right now?" product, which
needs a curated cross-section rather than a single-catalog leaderboard.

## Scope

This pass changes only final `/api/above-me` curation. It does not change:

- coordinate, altitude, azimuth, or visibility calculations
- source catalog ingestion
- candidate priority calculations
- exact Sky Engine link contracts
- Sky Engine rendering or survey imagery
- WordPress or Hub UI

## Selected Approach

Use deterministic minimum category reservation followed by the existing global
ranking.

The primary categories are:

| Category | Candidate rule |
|---|---|
| Solar System | `model` is `planet`, `moon`, or `sun` |
| DSO | `model` is `dso` |
| Bright Star | `catalog` is `Bright Star Catalog (local)` and `model` is `star` |
| Satellite | `model` is `tle_satellite` |

Only already-visible, source-backed candidates enter the selector. The selector
does not manufacture a missing category or relax visibility requirements.

## Selection Algorithm

1. Sort visible candidates with the existing priority, magnitude, and name key.
2. Find the first, therefore best-ranked, candidate for each primary category.
3. If all representatives fit within `limit`, reserve all of them.
4. If `limit` is smaller than the number of available categories, reserve the
   highest-ranked representatives that fit. This preserves deterministic global
   ranking when guaranteeing every category is mathematically impossible.
5. Fill remaining slots from the globally sorted candidates.
6. Continue enforcing the existing Hipparcos Tier 2 cap.
7. Continue deduplicating Messier/NGC/IC representations of the same DSO.
8. Return the selected set in the existing global sort order.

## Data Integrity

- Category balance never changes `is_visible`.
- No coordinate, magnitude, priority, or identity field is synthesized.
- `catalog + source_id + model` remains authoritative.
- A category is absent when no real visible candidate exists.
- The endpoint never exceeds its parsed and clamped `limit`.

## Validation

Tests must prove:

- all four available primary categories survive a limit of four
- small limits remain deterministic and bounded
- remaining slots still use global ranking
- the Hipparcos Tier 2 cap remains enforced
- cross-catalog DSO aliases remain deduplicated
- existing star, DSO, Solar System, satellite, Gaia identity, and exact-link
  behavior remains green
- Docker-served `/api/above-me` includes the available category mix at a fixed
  observer and time
- `/oras-sky-engine/` and exact-link browser validation remain unaffected

## Risks

The response may include a lower-priority representative to preserve category
diversity. That is intentional curation behavior. The existing ranking still
chooses the representative within each category and fills every unreserved
slot.
