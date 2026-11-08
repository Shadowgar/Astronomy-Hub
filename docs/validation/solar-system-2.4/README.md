# Solar System 2.4 — outer Solar explorer candidate

Working implementation on `recovery/reconcile-20261026`, existing draft PR #107,
starting from verified `fc1a7142b35ca791ffeddef810c93a244ad32769`. Owner visual
acceptance is pending. This delivery is not independent approval of the consolidated
PR or release qualification. Final pushed SHA and hosted checks are recorded in PR107.

## Delivered behavior

- **Pluto and Charon:** real New Horizons PDS mosaics, shared celestial renderer,
  original coverage gaps and unequal image resolution. Pluto is physical center
  **999**, distinct from barycenter **9**. The original PLU060 chain supplies
  Pluto/Charon and all five local moons. Nix, Hydra, Kerberos and Styx are positioned
  reference spheres, without invented surface imagery or chaotic rotation.
  Solar → Pluto → Charon → Solar preserves UTC and the saved camera.
- **Ceres and asteroids:** mapped, oblate NASA Ceres visualization; measured
  native-kilometer Dawn Vesta and PDS Eros shapes, source-matched rotation models,
  and 16,384 identifiable belt records. Search/filter/selection preserves source
  string IDs and can join catalog Ceres/Vesta to precise destinations.
- **Kuiper/TNO:** 8,192 source-classified TNO records, with per-record validity,
  plus a precise Eris destination. Eris is an unresolved reference globe, not
  fabricated geography. No unqualified resonant/classical subclasses are assigned.
- **Comets:** measured/reconstructed 67P and Halley nuclei and bounded JPL Horizons
  tracks. Hyperbolic Borisov is a trajectory-only position symbol with unknown
  physical size. Numerical source vectors handle these orbits; the approximate
  ellipse solver excludes all comets. No permanent bright tail or measured activity
  is claimed. The 762 catalog comet records remain searchable but catalog-only.

The normalized catalog has **25,338 identities**, of which 24,500 meet the model's
ellipse-domain policy; that is not simultaneous epoch coverage. Approximate points
are evaluated off the main thread, with one worker and at most one population draw
call. Quality changes point density. Selection bypasses thinning. Stale evaluation
is hidden after 500 ms of wall time while the clock advances; there is no velocity
extrapolation. Selected precise destinations use the existing shared clock and
checked adjacent source windows.

The existing Solar/System renderer, HDR, camera-relative coordinates, streaming
budgets, controls and scene ownership are reused. Native Stellarium Sky, Cesium
Earth and native Moon/Apollo17 ownership and source data are retained. No new
rendering dependency, spacecraft animation or Oort Cloud renderer was introduced.
Only common class names reserve future spacecraft/theoretical-population types;
mission trajectories and theoretical-cloud qualification remain future work.

## Sources and limits

[SCIENCE.md](SCIENCE.md) records the physical center chains, exact identities,
UTC/TDB bounds, original SPK excerpts and Horizons vectors. New precise sources
cover 2025–2030 TDB, exposed as inward UTC bounds with the installed leap-second
assumption. Source windows are normally ±2 days. Maximum retained selected-body
sampled interpolation residual is below 0.039 km; this is numerical interpolation
agreement, not orbit uncertainty or an all-time bound. No extrapolation occurs.

[POPULATIONS.md](POPULATIONS.md) records acquisition, subset bias, per-object
±180-day approximate policies and 115 independent source comparisons. The maximum
sampled difference is 57,889 km; it is not a bound for the whole catalog. Most belt
records expire in December 2026. Historical/out-of-domain objects stay searchable
with unavailable positions. The population is not a complete physical census or
an unbiased spatial-density measurement.

[ASSETS.md](ASSETS.md) records seven visual assets and 17,707,873 derivative bytes,
original geometry/UVs, sizes, hashes and rights. Pluto/Charon retain their distinct
source central meridians (180°/0°). Their nominal PCK pole/spin is displayed, but
historical map longitude realization is **unqualified**; no guessed 1.45° correction
is applied. Ceres is a visualization, not measured terrain. Vesta/Eros use exact
published legacy frame models, not a promise of modern orientation accuracy.
67P/Halley rotational phase is unqualified; Halley's reconstruction has 0.5–1 km
source uncertainty. No source holes were inpainted or detail invented.

Pluto/Charon can look soft or uneven where the original mosaic is sparse. Neutral
small-body shading is deliberate where registered color imagery is absent. Dense
population symbols overlap at wide views, especially portrait. These remain visual
limitations for owner inspection; no reference-image parity or owner approval is
claimed.

## Private preview and evidence

- [Actual owner gallery and four recordings](http://localhost:4231/owner-review/solar24-gallery/index.html)
- [Pluto](http://localhost:4231/solar-system?solarBody=pluto&date=2026-10-27T04:00:00Z)
- [Pluto system](http://localhost:4231/planetary-system/pluto?date=2026-10-27T04:00:00Z)
- [Ceres](http://localhost:4231/solar-system?solarBody=ceres&date=2026-10-27T04:00:00Z)
- [67P](http://localhost:4231/solar-system?solarBody=67p&date=2026-10-27T04:00:00Z)
- [Preserved Solar 2.3](http://solar23.localhost:4231/solar-system?date=2026-10-27T04:00:00Z)

The loopback preview serves an unmodified export of the final Docker build stage.
All **327 files** match actual HTTP bytes. The gallery contains 54 final-build
screenshots, 15 matched prior-implementation views and four actual journey recordings;
all 74 gallery files also match HTTP bytes. New scientific packs are read-only
mounts in a separate task backend; they are not baked into images. The opt-in
`docker-compose.solar24.yml` adds those mounts alongside `docker-compose.solar23.yml`.
All 146 pre-existing container IDs and 90 named volumes remain; one new task backend
was added, no volumes. Previous application artifacts and source packs remain.
The pre-existing preview/backend were found stopped with exit 255 and no OOM;
restarting their existing containers restored them, but the historical cause is
unproven. No production service or database was deployed or modified.

[VALIDATION.md](VALIDATION.md) lists exact commands, counts, failed attempts and
scope. [PERFORMANCE.md](PERFORMANCE.md) separates actual Windows NVIDIA measurements
from physical-device qualification. [REVIEW.md](REVIEW.md) records corrected findings
and the remaining independent-review limit. [PLAN.md](PLAN.md) records the loaded
context, scope and budgets. [CHANGED_FILES.txt](CHANGED_FILES.txt) lists exact files.

## Remaining gates

**Release remains blocked by external/device/source qualifications.** Scoped source,
asset and population reviews are independent; final application integration fixes
could not receive another independent review because the reviewer service returned
a usage limit. They have focused automated/browser proof, not self-issued
independent approval. Owner visual acceptance and physical iPhone testing remain
pending (the owner confirmed no private iPhone access path).

The old `f7cb702c` source archive does not match this application. A corresponding
source reconstruction/archive matching the final application, authorized immutable
public source/descriptor delivery, anonymous HTTPS pairing and inherited combined
work/license qualifications remain outstanding. No new source archive was published.
Inherited advisory debt is not cleared by this bounded task. Hosted CI/CodeQL is
reported against the exact pushed SHA; neutral/skipped checks are not approvals.

Next task: review this candidate visually and obtain the remaining independent
integration review, then handle the existing release qualifications. Stop Solar 2.4
product work here; do not merge, deploy or expand to Solar 2.5/2.6.
