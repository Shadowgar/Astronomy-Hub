# Solar 2.4 — bounded source populations

This change adds a source-backed discovery catalog and an explicitly approximate symbolic position layer. It does not replace the existing 2,048-object fallback, the selected-object Horizons trajectories, or native Sky data. Owner visual acceptance and Windows GPU qualification are separate from the source checks below.

## Source and coverage

Official references inspected: [SBDB Query API](https://ssd-api.jpl.nasa.gov/doc/sbdb_query.html), [SBDB object API](https://ssd-api.jpl.nasa.gov/doc/sbdb.html), [SBDB filters and orbit classes](https://ssd-api.jpl.nasa.gov/doc/sbdb_filter.html), and [Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html). Source elements are heliocentric J2000 ecliptic, with TDB epochs. The documented IAU76/80 obliquity, 84381.448 arcseconds, converts them to ICRF for the Solar scene.

The acquisition ran 2026-11-03T14:08:49Z–14:13:18Z. Selection is reproducible in `scripts/skydata/acquire_solar24_populations.py`; complete URLs, observed acquisition timestamps, byte counts and hashes are in [population-acquisition.json](population-acquisition.json). This is a biased, bounded catalog subset, not a complete physical population or a measurement of spatial density.

| Query | Available in queried source | Acquired | Selection |
| --- | ---: | ---: | --- |
| Numbered IMB/MBA/OMB asteroids | 870,924 | 16,384 | Increasing source H, bounded at 16,384 |
| Source TNO orbit class | 8,328 | 8,192 | Increasing source H, bounded at 8,192 |
| Numbered comets, excluding fragments | 506 | 506 | Source designation order |
| PAR/HYP comets, excluding fragments | 2,261 | 256 | Source designation order; historical subset |

There are **25,338 unique string SPK identities**. The belt includes 14,702 MBA, 1,635 OMB and 47 IMB records. All 8,192 TNO entries retain the source's coarse TNO classification. No resonant, classical or scattered subclass is inferred. Source diameter, H, uncertainty parameter, arc length, observation count and element uncertainties are nullable; missing values remain unknown. Identity joins include Ceres `20000001`, Vesta `20000004`, Eris `20136199`, Halley `1000036`, and 67P `1000012`. Eris's SBDB diameter is null. The bounded comet subset does not include 2I/Borisov; a separately qualified destination is independent of this subset.

The symbolic model admits only finite non-comet ellipses with 0≤e<0.98, 0<a≤300 AU, positive perihelion and mean motion, and valid inclination. Safeguarded Kepler iteration and analytic velocity are evaluated only inside each body's source epoch ±180 days. This is an application policy, **not a JPL validity guarantee**. Perturbations are omitted. No comet, parabolic/hyperbolic orbit or unsupported TNO enters this solver. These records remain searchable with an unavailable position reason; precise comet trajectories belong to the separately qualified destination source.

There are 24,500 model-eligible objects (16,384 belt +8,116 TNO), plus 838 catalog-only objects (762 comets +76 TNO). Eligibility does not mean every source epoch overlaps the current application epoch. All belt elements have epoch JD2461200.5 and policy interval JD2461020.5–2461380.5 TDB. TNO entries retain  their own epochs, including historical solutions. At JD2461350.5, 22,784 objects are within policy coverage. Positions are never clamped or frozen to disguise expired coverage.

## Independent numerical source comparison

The importer selected the minimum, maximum and median a/e/i within each admitted population, plus Ceres, Vesta, Eris, Makemake and Haumea where eligible: 23 distinct targets. For each it acquired geometric Sun-centered ICRF Horizons position/velocity states at the source epoch and ±90/180 days: **115 comparisons**. The parser rejects wrong target, center, reference frame, units, time labels, epoch lists and nonfinite states.

Maximum sampled positional difference is **57,889.103865 km**, for `2026 EO125` at JD2461020.5. Maximum sampled velocity difference is **0.005123446145 km/s**. These figures measure only the retained comparisons; they do not bound errors for all objects or all times, and the symbolic layer must not be presented as a precise destination ephemeris. The 5,000,000 km importer sanity ceiling is an admission guard for those comparisons, not an accuracy promise.

`backend/tests/fixtures/solar_populations_reference.json` retains the selected normalized source bodies, 115 independent Horizons states with measured differences, 115 Python analytic position/velocity results, and source response hashes. It is a small regression fixture, not a production catalog. The frontend implementation reproduces every Python result within 1e-10 AU position and 1e-16 AU/s velocity in its focused test.

## Storage and runtime contract

Raw acquisition directory: `data/source-cache/solar24-populations-20261103`.

Read-only runtime release: `data/runtime-packs/solar-populations/release-20261103`, mounted via `ORAS_SOLAR_POPULATIONS_DIR` (default container path `/runtime/solar-populations`). No source bulk is added to an application image.

- Normalized release: 20,932,906 bytes; SHA256 `15ae0e1177aec67b4917f1e2f42cfe4d8660fbde801a9fd4558b61b654f4dbb0`.
- Pinned release manifest SHA256: `fa410b5f343b9cf774993eac23851ca2b17b1f98726019b72a7bbd5933196fe1`.
- Acquisition receipt SHA256: `ebc259567f0bd9eab5731b06227345421b10b511a33beea8ed0193e7edf27d4b`.
- Retained provider responses: 7,693,260 bytes, below the approved 32 MiB aggregate ceiling. The receipt includes two small failed diagnostic responses (missing COMMAND and no designation match); these are preserved evidence and are not numerical reference inputs. `qualification.reference_files` lists the 23 valid vector responses. Two earlier discarded identical missing-COMMAND responses add 388 bytes to the transfer accounting; no bulk response was discarded.

`GET /api/v1/solar-populations` serves the pinned pack after hash/schema/domain validation. Missing, altered or unqualified source returns a fixed 503 message; runtime does not fetch JPL or fabricate fallback records. Validation is cached per immutable mounted release. Cold local backend validation measured about 2.1 seconds; this is supporting local evidence, not runtime latency qualification.

The dedicated worker fetches the fixed same-origin endpoint, bounds the response to 24 MiB, parses/validates the complete catalog off the main thread and retains its metadata there. It returns a small summary, searches capped at 40 rows, one selected record, or transferable typed position/velocity buffers. Source indexes are stable indexes into the immutable pack; search, GPU vertex indexes and detail retrieval preserve that mapping. Positions are heliocentric ICRF AU split into Float32 high/low components, velocities are AU/s, and no physical radius is invented. Returned buffers identify their exact TDB epoch and common policy coverage. The caller owns one outstanding evaluation, stale-epoch presentation/hiding, and worker termination; the worker does not silently extrapolate.

Newer loads abort older fetches and suppress both stale successes and stale errors. A failed reload clears the active catalog. API error text and private paths are not forwarded into worker errors. Search results contain ordinary metadata strings and use no HTML generation.

## Reproduction and focused checks

From the recovery worktree, reproduce the immutable release from the retained responses (no network needed when all receipts match):

```sh
/home/rocco/Astronomy-Hub/.venv/bin/python scripts/skydata/acquire_solar24_populations.py --source-dir data/source-cache/solar24-populations-20261103 --output data/runtime-packs/solar-populations/release-20261103
/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_solar_populations.py -q
npm --prefix frontend test -- --run tests/solarPopulations.test.ts
```

Backend focused results: **26 passed**. Frontend focused results: **8 passed**. Tests cover source identities, unknown dimensions, unsupported conics, finite elements, source-frame and epoch rejection, all numerical fixture comparisons, hash/schema admission, missing source HTTP behavior, receipt tampering, exact search/source-index correspondence, the 40-result limit, transferable buffers, and superseded/failed load handling.

Local Node supporting measurements for the full release are retained in `output/playwright/solar-system-2.4/catalog/worker-node-benchmark.json`: JSON parse 133 ms; source validation 39 ms; 22,784-symbol evaluation 24–41 ms across the sampled epochs, transferring 911,360 bytes. These are CPU measurements outside a browser; they establish neither GPU cost nor mobile/device acceptance. Runtime mounting, actual worker/browser rendering and Windows NVIDIA journeys belong to the overall Solar 2.4 qualification report.
