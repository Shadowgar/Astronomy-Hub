# Solar System 2.0 — motion and small-body science

2026-10-28, recovery/reconcile-20261026. Source modules are implemented and tested;
renderer integration, browser qualification and owner acceptance are separate.
The machine-readable results are in [science-receipt.json](science-receipt.json).

## Loaded authority and preserved boundaries

Loaded AGENTS.md, CORE_CONTEXT.md, LIVE_SESSION_BRIEF.md, CONTEXT_MANIFEST.yaml,
ADR0010 and UNIFIED_UNIVERSE_ARCHITECTURE.md, plus the owner's explicit Solar
System 2.0 directive. The directive supersedes earlier visual-review stop gates.
No full docs scan, native engine changes, protected-source edits, container/volume
cleanup, archive publication, commit, push or release was performed by this work.

Existing Solar snapshot identities remain Sun10, Mercury199, Venus299, Earth399,
Mars4, Jupiter5, Saturn6, Uranus7, Neptune8. Outer-planet targets are explicitly
system barycenters. Existing planetary-system physical-center domains remain
separate: Saturn699 with source-backed Enceladus602/Titan606 must not be attached
as though Saturn6 were the physical planet center. Existing Horizons system
coverage is finite October2026, independently of the broader DE442s coverage.

## Continuous Solar motion

`GET /api/v1/solar-system/motion?epoch=<UTC>` evaluates the unchanged mounted DE442s
kernel. Nine tracks use heliocentric ICRF position AU and velocity AU/s, explicit
TDB sample times, and a maximum ±8-day window sampled hourly. Known leap transitions
and source endpoints clip windows; there is no extrapolation or synthetic fallback.
Every interval is checked at 1/4, 1/2 and 3/4 against independent direct kernel
evaluations. An observed error ≥1km rejects the window. This is a sampled
interpolation check, not a physical-accuracy or continuous error guarantee.

At 2026-10-28T12:00:00Z the observed maximum is **0.000158344km**, 385 samples
per track, 741,404 compact JSON bytes. The real backend response passes the actual
TypeScript validator. Client `evaluateSolarMotion` updates position state without
network access or renderer construction. `solarMotionNeedsRefresh` supports one
direction-aware bounded prefetch; integration must retain source SHA/release
identity and stop at uncovered time. Source failure must never advance stale vectors.

## Acquired small bodies

The JPL SBDB query selects the first2,048 numbered MBA-class bodies sorted by
decreasing catalog diameter. Eros is separately acquired for the named destination;
it is an Amor near-Earth asteroid, not a member of the rendered main-belt subset.
There are2,049 unique string SPK identities. This incomplete diameter-biased subset
is not a measured density field. Every orbit, name and diameter comes from the
original API responses; none is hand-registered or procedurally invented.

All acquired osculating elements share JD2461200.5TDB (2026-Jun09). The pure solver
uses the supplied mean motion, elliptical Kepler equation, and JPL's adopted
IAU1976 obliquity84381.448arcsec to transform ECLIPJ2000 elements to ICRF positions.
Policy limits use to ±180days; points must disappear outside that range. The model
omits perturbations and must be disclosed as approximate. All points are enlarged
symbols, not physical asteroid sizes or observed brightness.

Independent Horizons geometric Sun-centered ICRF vectors compare Ceres, Vesta,
Pallas and Eros at the element epoch, ±180days and 2026-Oct28:16 comparisons.
Maximum difference is **19,674.473km**, and Eros at Oct28 differs by6,378.121km.
At the element epoch all four differ by less than5km. These limited comparisons
do not establish accuracy for the full population or every time. No spacecraft
navigation, collision, close-approach or observing-accuracy claim is supported.

The823,748-byte normalized packet is served locally from the existing FastAPI
application with a content ETag. No browser contacts JPL and no runtime acquisition
occurs. Original response bytes and acquisition receipts are preserved in the
tracked [source-data/small-bodies-20261028](source-data/small-bodies-20261028/)
folder, under one megabyte total. `receipted/acquisition.json` records actual
response-completion UTC, source URL, SHA256 and byte count for all six responses;
normalization requires that explicit receipt and verifies every response against it.
The normalized acquisition time is the recorded batch completion, independent of
filesystem timestamps. The receipt SHA and individual response times are embedded
in the packet. Copies, extraction and Git checkout cannot invent a newer acquisition.

Independent source review identified P2: the initial importer inferred acquisition
UTC from file modification times. A regression reproduced changed normalized bytes
after timestamps alone changed. The correction requires an explicit receipt and
passes changed-mtime byte-identical reproduction plus absent/mismatched receipt
and unreceipted-file rejection checks. One fresh, sequential six-response acquisition
completed at **2026-10-28T04:43:43.865131Z** and produced identical orbital values and
all16 comparison results. `initial-unreceipted/` preserves the first-run response
bytes and labels its old mtime-derived timestamp claim unverified; these legacy
bytes are not admitted as a new receipted acquisition. There is no timestamp inference
or fallback in the new importer.
The existing corresponding-source release archive is unchanged and does not cover
this new application revision.

Eros's NASA GLB provenance belongs to the separate asset receipt. Its shape units,
spin and body-fixed orientation are not qualified; an independently sourced
reference diameter does not turn arbitrary model dimensions into a measured shape.

## Reuse and source policies

Reviewed Spacekit pin `573a7776433381d1302a699af97b6e4c77214109`: KeplerParticles,
Ephem, Orbit, ShapeObject, SpaceObject and MIT license. The useful pattern is one
population geometry with stable typed attributes. The original bounded solver and
reused position buffer do not import Spacekit's clock, scale system or ephemeris
ownership. Spacekit is a reference, not an installed dependency or copied shader.

Primary sources: [SBDB query](https://ssd-api.jpl.nasa.gov/doc/sbdb_query.html),
[SBDB element/time semantics](https://ssd-api.jpl.nasa.gov/doc/sbdb.html),
[population classes](https://ssd-api.jpl.nasa.gov/doc/sbdb_filter.html),
[JPL adopted obliquity](https://ssd.jpl.nasa.gov/astro_par.html),
[JPL API fair-use policy](https://ssd-api.jpl.nasa.gov/),
[Spacekit pinned code](https://github.com/typpo/spacekit/tree/573a7776433381d1302a699af97b6e4c77214109).
Acquisition is bounded, sequential, caches original bytes, checks API versions,
fails rather than retrying indefinitely, and identifies the application/contact.
NASA/JPL numerical orbit attribution is retained. External imagery/model terms
are handled separately; code licensing is not asserted to license assets.

## Verification commands and observed results

Initial endpoint tests failed6/6 with404 before motion implementation; small-body
tests failed2/2 before implementation. Client missing-module failures preceded
implementation. Two later malformed-contract regressions failed2/10 and passed
after explicit unknown-target/missing-element checks. A further failing regression
proved fractional animation milliseconds could disagree with emitted ISO time;
evaluation now uses the exact representable millisecond for both. Initial host tests used a
missing default interpreter and then an unconfigured kernel path; those attempts
are not scientific qualification. New tests use explicit ASGI transport to remove
httpx's deprecated TestClient warning.

```sh
python3 scripts/skydata/import_solar_small_bodies.py \
  --source-dir docs/validation/solar-system-2/source-data/small-bodies-20261028/receipted \
  --receipt docs/validation/solar-system-2/source-data/small-bodies-20261028/receipted/acquisition.json \
  --output /tmp/solar2-reproduced.json
cmp backend/app/data/solar_small_bodies.json /tmp/solar2-reproduced.json
# 2049 bodies; max comparison19674.472707760913km;823748bytes; byte-identical

docker run --rm --network none --read-only --tmpfs /tmp \
  -e PYTHONDONTWRITEBYTECODE=1 -e ORAS_PLANETARY_EPHEMERIS_DIR=/runtime/ephemeris \
  -v /home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026:/app:ro \
  -v /home/rocco/Astronomy-Hub/data/runtime-packs/planetary-ephemeris/release:/runtime/ephemeris:ro \
  --workdir /app 00e343c5943a python -m pytest \
  backend/tests/test_solar_motion.py backend/tests/test_solar_small_bodies.py \
  -q -W error -p no:cacheprovider
# 12 passed in2.15s; zero warnings, including6 small-body source tests.

cd frontend
npm test -- tests/solarMotion.test.ts tests/solarSmallBodies.test.ts
# 11 passed across2files
npm run typecheck
# exit0 at the science-module checkpoint
```

Supporting Node/WSL CPU microbenchmark over200 combined motion/population updates:
median1.001ms, p951.398ms. This is not browser frame time or GPU/device qualification.
No broader suite, visual, physical-device or production-readiness claim is made
by these isolated science-module checks. Integration tests and nonauthor review
must qualify the complete scene, clock, failure states and navigation.

Receipt correction: initial source tests3pass/1fail with an actual changed-mtime
byte mismatch; after correction all6 small-body tests pass with warnings treated
as errors. The durable original response archives total less than one megabyte;
no protected runtime pack or published corresponding-source archive was changed.

Nonauthor correction verification by `solar_source_review`: Docker12 tests pass
warning-clean; frontend motion/small-body11 tests pass. A separate temporary copy
with every response and receipt mtime set to1800000000 reproduces the shipped packet
SHA256 `8c2b0b424d37f9935034d38b66274e6aa5809b118393746db87dd8f95d9eaa41`
byte-for-byte and retains the recorded completionUTC. Altered SBDB and Horizons
receipt hashes are rejected. Importer source SHA256 at review:
`fef8cb14249ba561d56aa96fe6ea3a9d83769af085dd9554c9d573043f1a067e`.
The P2 is resolved for this source revision; renderer/visual/release acceptance
remains outside this science correction.
