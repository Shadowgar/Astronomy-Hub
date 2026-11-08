# PS2 backend scientific qualification

Applied to `ps2-major-moon-systems-1`, based on PS1 `a7de8908` / draft PR93.
This subtask changes only backend science/contracts/tests, the offline importer,
small science fixtures/evidence and the owner-authorized finite source pack. No
commit, push, merge or deployment was performed by this subtask. Renderer,
Docker configuration and governance integration belong to the coordinating task.

Default backend context was loaded for PS1; CORE/LIVE were refreshed in PS2.
The same manifest document list is retained in loaded-documents.txt. The explicit
PS2 instruction and source report supersede historical single-R4/no-moons scope.
No broad document scan or unrelated document loading was used.

## Implemented source boundary

Earth retains the existing DE442s center399/Moon301 path. Five other systems use
an independent, internally coherent official Horizons finite-vector pack:

| Parent center | Qualified moons | Source cadence seconds |
| --- | --- | --- |
| Mars499 | Phobos401, Deimos402 | 600,1800 |
| Jupiter599 | Io501, Europa502, Ganymede503, Callisto504 | 1800,3600,3600,3600 |
| Saturn699 | Enceladus602, Titan606 | 1800,3600 |
| Uranus799 | Ariel701, Umbriel702, Titania703, Oberon704, Miranda705 | 3600,3600,3600,3600,1800 |
| Neptune899 | Triton801 | 3600 |

All five physical-parent heliocentric series use3600-second samples. Direct
parent-relative moon series avoid subtraction of large heliocentric vectors.
Parent-to-Sun is the negative physical-parent heliocentric vector; Moon-to-Sun
subtracts the moon-relative vector at the same evaluation epoch. No local DE442s
barycenter offset is applied. The existing DE442s Solar domain remains unchanged.
The API explicitly discloses this source transition; a visually continuous camera
journey must not be described as a reconciled shared dynamical solution.

Coverage is TDB JD2461314.5 through2461345.5 inclusive (2026-10-01 through
2026-11-01 TDB). With the installed Skyfield builtin time table the exact source endpoints become:

- UTC start: `2026-09-30T23:58:50.817628Z`
- UTC end: `2026-10-31T23:58:50.817465Z`

Published usable coverage rounds these endpoints inward to whole milliseconds:
`2026-09-30T23:58:50.818Z` through `2026-10-31T23:58:50.817Z`. The API enforces
those same bounds, so JavaScript Date/URL round trips remain valid; one millisecond
(or one microsecond) outside the published window is rejected. Original TDB sample
epochs, vectors and their precise UTC labels remain unchanged and bracket the usable
window by less than1ms. The normalized pack and both release hashes are unchanged.
This corrects the independent review's start-boundary rejection after JavaScript
truncated `.817628Z` to `.817Z`; red/green records are preserved.

Do not relabel the TDB boundaries as UTC. No extrapolation, period wrapping,
live fetch or fabricated positions. TDB conversion uses the installed builtin
Skyfield table; unknown future leap seconds are not predicted. This source window
contains no known leap transition. A31-day path is not necessarily a whole orbit.

## API integration and provenance

Existing `oras.planetary-system.v1` snapshots are retained. The source object now
preserves optional TDB coverage, raw target/center headers, per-series response
SHA256/URL, and a domain-transition disclosure. Parent and moon IDs remain strings;
physical parent centers are mandatory. `state` and sampled tracks contain km and
km/s; ICRF, geometric, no light-time or aberration. Epoch input remains UTC.

Track sample limits increase from771 to5000 to accommodate Phobos4465 samples;
per-track step_seconds is available. Sampling supports600–3600seconds and one to
three check points per original interval. PS2 reports one midpoint per segment,
plus its separately described two quarter checks per series; it does not claim
PS1's three-per-segment direct-kernel qualification.

Catalog production retains its source-derived base metadata, then admits only
those14 moons when the pinned pack validates. Other known moons remain unavailable.
All new detailed surfaces are unavailable; mean-radius spheres do not qualify
surface imagery, orientation, triaxial shape, terrain or local topography. Dedicated
JPL physical-parameter table radii prevail over discrepant informational Horizons
header radii; physical-radii.json preserves source/reference/sigma information.

The route rejects out-of-range/naive epochs with422, unknown systems with404 and
missing/changed sources with503. The422 text no longer incorrectly advertises the
Earth-only1900–2051 range for PS2. No new API route, dependency or network fallback.

## Offline release, portability and rights

Runtime release under `data/runtime-packs/planetary-systems/release`:

- pack.json:2376055bytes.
- manifest.json:321bytes.
- Manifest SHA256:
  `770352992eeda04a7005172b2d57d6a3809deaf612f0e16971f74751df2eca61`.

The owner authorizes versioning this small finite package. It remains runtime
mounted read-only and excluded from Docker build context/images; versioning does
not turn it into baked application data. The coordinating task owns force-adding
the currently ignored release and the Docker exclusion/mount changes.
Configure `ORAS_PLANETARY_SYSTEMS_DIR` for the read-only mount. Default host path
is data/runtime-packs/planetary-systems/release. No runtime source acquisition.

The ignored original archive is at
`data/runtime-packs/planetary-systems/source/horizons-oct2026`.
This includes independent midpoint/quarter responses and acquisition receipts.
The original19 production responses total4196726bytes; original production plus
midpoint responses total8389728bytes. Small source manifests/hashes and one Mars
response fixture are versioned for normal offline tests. Full raw archive is not
part of Git or the runtime image.

The importer pins the original source manifest, radius table and quarter-summary
hashes, validates exact response hashes/API version1.2, targets/centers, ICRF,
KM-S, TDB, geometric corrections, ordering/grid/count and finite values. Runtime
validates the pinned release manifest and pack digests before admission, as well
as identities, counts, shape, cadence and coverage. File change cache identities
include mtime, ctime and size; changed sources revalidate and fail closed.

The importer only reads a preserved local archive and writes an empty staging
directory. Publish by explicit atomic rename after validation, never by modifying
an active release. Mutable retrieval-time Horizons headers mean later online
queries are not guaranteed byte-identical. Versioned normalized bytes and pinned
manifest make offline checkout reproducible; preserve original raw bytes for
scientific provenance, not merely their request URLs.

Attribution: Giorgini JD and JPL Solar System Dynamics Group, NASA/JPL Horizons
On-Line Ephemeris System, retrieved2026-10-24; JPL satellite physical-parameter
reference including Archinal etal.2018. These are public numeric ephemerides/model
outputs, not observations or imagery. No imagery permissions are asserted.
Official sources: [Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html),
[API contract](https://ssd-api.jpl.nasa.gov/doc/horizons.html),
[JPL physical parameters](https://ssd.jpl.nasa.gov/sats/phys_par/).
Acquisition was performed separately with sequential cached requests; this
implementation performed no network requests.

## Scientific results and limitations

The explicit full-source suite reconstructs the byte-identical normalized release
from the preserved archive, compares every20832 midpoint and38 quarter references,
and checks browser UTC-millisecond fraction/TDB-duration interpolation against all
midpoint references. All observed position differences are<0.1km. Maximum browser
emulation difference:0.058158383111km (Ariel).

These independent requests use the same Horizons dynamical source; they establish
sampled interpolation agreement, not independent-model validation, a rigorous
continuous-time error bound or absolute physical position accuracy. The original
hourly Io trial failed the100m gate; the retained admitted pack uses30-minute Io
samples. Original trial/source research remains preserved in the ignored archive.
PS2 does not reuse the DE442s/Horizons comparison offsets as geometry corrections.

Normal self-contained tests verify two quarter-reference epochs for all19 source
series, physical-center admission, time conversion, motion, finite bounds,
no extrapolation, catalog unavailable states, provenance serialization, a real
PS1 snapshot schema, file mutation and all five integrated API routes.

## Exact verification commands

From the PS2 worktree:

```sh
/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_horizons_systems.py -q -W error
/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/qualification/horizons_full_source.py -q -W error
ORAS_PLANETARY_EPHEMERIS_DIR=/home/rocco/Astronomy-Hub/.worktrees/integration-main-20261005/data/runtime-packs/planetary-ephemeris/release ORAS_LUNAR_ORIENTATION_DIR=/home/rocco/Astronomy-Hub/.worktrees/r4-a-planet-view-1/data/runtime-packs/lunar-orientation/release /home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_horizons_systems.py backend/tests/test_planetary_systems.py backend/tests/test_planet_view.py backend/tests/test_solar_exploration.py -q
git diff --check
```

Results before the boundary review: new suite17passed, zero warnings; explicit full-source2passed, zero
warnings; combined64passed with one pre-existing HTTPX TestClient deprecation
warning from the unchanged Solar test. The combined run is not warning-clean.
Integration red: missing horizons_systems before applying implementation, one
collection error. Tests ran outside sandbox restrictions for FastAPI worker
completion. No required failure is counted as a pass or silently skipped.

The full-source file intentionally lacks a test_ prefix and is invoked explicitly;
absence of its required archive fails the explicit run rather than silently
skipping. Override source location with ORAS_HORIZONS_QUALIFICATION_SOURCE_DIR.
Normal tests require only versioned fixtures/release and honor the runtime
ORAS_PLANETARY_SYSTEMS_DIR mount. They have no /tmp imports or path dependency.

Docker/runtime/browser/WebGL/owner acceptance and exact-head independent review
remain coordinating-package gates. These host results alone do not establish
runtime or visual completion. Recommended next task: source-matched Docker tests,
actual five-system journeys and failure/time-boundary/source-disclosure checks.

## Reviewed boundary correction

`python -m pytest backend/tests/test_horizons_systems.py -k browser_safe -q -W error`
reproduced the published-precision mismatch (one failing assertion). After the
bounded correction, the complete PS2 strict suite is18passed with zero warnings.
The actual command uses the same absolute virtualenv interpreter listed above.
`browser-boundary-red.txt` and `browser-boundary-green.txt` preserve the run outputs.
Authoritative task-backend restart and browser requalification remain required;
these host checks do not refresh earlier Docker/browser evidence automatically.
