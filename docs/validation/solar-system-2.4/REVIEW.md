# Solar 2.4 findings and independent-review boundary

The source/backend, asset and population authors cross-reviewed one another.
Their retained evidence is in [SCIENCE.md](SCIENCE.md), [ASSETS.md](ASSETS.md) and
[INDEPENDENT-ASSET-POPULATION-REVIEW.md](INDEPENDENT-ASSET-POPULATION-REVIEW.md).
Those reviews found no remaining confirmed P1/P2 in their stated scopes after
correction. They do not approve the whole consolidated PR or the reviewer's own work.

## Corrected findings

| Rank | Exact location | Cause and potential impact | Reproduction and correction | Separate review |
|---|---|---|---|---|
| P2 | `scripts/skydata/acquire_solar24_destinations.py:90` | Name-only Horizons acceptance could admit a wrong designation or solution in a future acquisition. | Wrong-number/solution tests fail; require the canonical designation and exact JPL solution against SBDB. Re-admitted all seven actual sources. | Asset reviewer verified the backend correction. |
| P2 | `scripts/planetdata/build_solar24_assets.py:33` | Treating Charon's center longitude as Pluto's would rotate geography by 180°. | Read original labels: Pluto 180°, Charon 0°; retain each source grid. Independent test uses pinned XML. | Science reviewer verified exact grids and all seven asset tests. |
| P2 | `frontend/vite.config.mjs:185` (public asset allowlist) | New GLB URLs initially fell through the private SPA to 568-byte HTML, producing source-asset fallback. | Actual first Windows smoke failed; admit `solar-assets/v2.4`, rebuild and verify GLB bytes/content plus all body-ready captures. | Final root integration re-review unavailable. |
| P2 | `frontend/src/features/solar/solarDestinations.ts:89` | A fixed simulated-time prefetch margin became only tens of milliseconds at 86,400× playback. | Fast forward/reverse regression; use a quarter-window lead capped at 30 wall seconds. Three viewport journeys cross multiple checked windows without renderer replacement. | Final root integration re-review unavailable. |
| P2 | `frontend/src/features/solar/SolarScene.ts:141` | Replacing trajectory attributes during refresh could leave obsolete uploaded buffers without retirement. | Reuse existing capacity; dispose geometry before growth. Source-window journeys and bounded GPU ownership checks exercise refresh. | Final root integration re-review unavailable. |
| P2 | `frontend/src/features/solar/SolarWorkspace.tsx:161` | Eros status depended only on the legacy 2026 approximate catalog even when precise 2028 source vectors were admitted. | Use the admitted precise position as availability; real 2028 browser check rejects the old unavailable label. | Final root integration re-review unavailable. |

Source endpoint float-JD/UTC rounding, source-document byte accounting and long
comet-name wrapping were also corrected with focused regressions. No current
pinned science source had been misidentified. Initial failed artifacts remain in
ignored output directories and are not reported as passing evidence.

## Nominal map pose and actual visual proof

`frontend/src/features/systems/systemPresentation.ts:37` now applies the matching
PCK body quaternion to the known Cartesian Pluto/Charon map grid, retaining
`qualified: false` and an explicit historical-longitude-registration disclosure.
The previous generic visualization rotation was unsuitable for a Cartesian source
sphere and emphasized the unobserved region. Actual before/after images were
inspected; map pixels and source gaps are unchanged. Matching-frame tests and
mismatched-frame rejection pass. This qualifies nominal model use only; it does not
resolve the 1.45° historical map-edition question or claim measured epoch geography.

## Remaining review qualification

The additional independent reviewers returned a **service usage limit** before they
could review the last root integration corrections, including the nominal map pose,
prefetch/buffer changes and status disclosure. No approval was inferred from their
earlier scoped reviews or from passing tests. The exact final committed diff and
[artifact binding](evidence/source-binding.json) are available for a fresh reviewer.

**Outstanding:** independent final application-integration review, owner visual
acceptance, physical iPhone, and inherited corresponding-source/release gates.
There is no self-issued independent approval of PR107. No review thread or security
alert was dismissed/suppressed to obtain a passing status.
