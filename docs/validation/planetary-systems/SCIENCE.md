# PS1 Earth–Moon science and metadata

Scope: `ps1-earth-moon-system-1`, based on PR92 `c510759b`. The new owner
hierarchical-system directive supersedes the previous single-R4/no-moons limit.
Default Mode backend manifest documents and explicitly requested PLAN/R4 science
were loaded; the exact list is in `evidence/science/loaded-documents.txt`.
No extra repository documents were loaded. Existing Solar and Planet View source
logic, kernel files, source pins and dependency versions are unchanged.

## Contract

`GET /api/v1/planetary-systems` returns `oras.planetary-systems.v1`: six satellite-bearing
parent records, explicit physical-center NAIF IDs, sourced mean radii/material
keys, and source-derived satellite metadata with qualification/unavailable state.
The metadata catalog contains 41 rows ingested from the official JPL table,
filtered by the six requested parents. Existence, radius, trajectory qualification
and surface qualification remain separate. Catalog `qualified` means this
implementation is qualified; the live snapshot can still return 503 when local
sources are missing. Other parent geometry is unavailable; their DE442s system
barycenters are never treated as planet centers. Mercury/Venus have no satellites and are omitted from this system catalog.

`GET /api/v1/planetary-systems/earth?epoch=2026-10-23T12:00:00Z` returns
`oras.planetary-system.v1`:

- `system_id`, UTC `epoch`, `time.input_scale=UTC`, `evaluation_scale=TDB`,
  `jd_tdb`; `frame=ICRF`, `units=km`, geometric with no light-time/aberration.
- `parent`: `id`, `name`, `naif_id=399`, `radius_km=6371`, `radius_source`,
  `material`; the scene origin is Earth center, fixed at zero.
- `satellites`: identity/name, exact `naif_id`, sourced `radius_km`,
  `radius_source`, `status`, `reason`, `surface.available/destination`.
  Moon301 has radius1737.4km and existing `/planet-view/moon` destination.
- `state.moon` and `state.sun`: `position_km`, `velocity_km_s` relative to399.
  Moon is `(kernel[301] - kernel[399])`; Sun is `(kernel[10] - kernel[399])`.
- `tracks[{id,samples}]` and `sun_track{id,samples}`: each sample carries
  `epoch`, `jd_tdb`, `position_km`, `velocity_km_s`. Default windows span
  ±16days, sampled hourly, 769samples/track, including the exact request epoch.
- `coverage`: intersection of local kernel and bounded1900–2051 qualification;
  `sampled_coverage`: actual returned window. Ends and known leap-second
  transitions clip the window. Never close the sampled path into an invented
  ellipse, wrap time, or extrapolate beyond the last sample.
- `source`: original DE442s ID, release, URL and SHA256; `sampling` includes
  method, step, measured maximum off-grid error and scope of qualification.

Cubic Hermite interpolation uses UTC timestamp fraction and TDB endpoint duration
in seconds, multiplied by source velocities in km/s. Every response compares both
tracks at quarter, half and three-quarter times in every segment to fresh kernel
evaluations; >1km measured difference fails closed. This sampled envelope is not
an analytic bound at every real-valued instant or a physical measurement accuracy
claim. Known leap transitions cannot lie inside a returned segment. The builtin
Skyfield leap table determines future UTC conversion; unknown future leaps are
not predicted. Parent-to-Sun samples keep lighting coupled to simulation time;
Moon-to-Sun direction is parent-to-Sun minus parent-to-Moon at the same time.
The reference spheres do not assert terrain or scientific body-fixed orientation.

Malformed, timezone-free and out-of-range epochs return422. Unknown systems
return404. Unqualified systems or missing local ephemeris return503. API
responses use typed Pydantic boundaries. No network fallback or new dependencies.

## Independent comparison

Official Horizons request and unmodified response are saved under
`evidence/science/horizons-*`. Query: target301, center500@399, vectors,
ICRF/FRAME, KM-S, NONE corrections, UT discrete epochs. Horizons explicitly
reports DE441; the existing local source is DE442s. Thus these comparisons measure
agreement between dynamical fits, not true physical accuracy.

| UTC epoch | Position norm difference | Velocity norm difference | Maximum checked Hermite position difference |
| --- | ---: | ---: | ---: |
| 2000-01-01 00:00:00 | 0.000817457km | 2.11520e-9km/s | 0.0000729329km |
| 2026-10-23 12:00:00 | 0.002674672km | 7.11927e-9km/s | 0.0000748867km |

Test envelopes: position<0.05km, velocity<1e-6km/s. The barycenter-negative test
explicitly proves target3 differs by>4000km. Boundary and leap tests include1900,
2051, both sides of2016/2017 and a fractional epoch immediately before the leap.
`qualification.json` retains measured values, tested window bounds and host
service timings (~24ms warm, excluding HTTP serialization/browser/render work).

## Source inventory and next systems

Existing mounted DE442s:32701440bytes, SHA256
`54d97562a5b094d298b1b8eafa5a2e17e3e010ce85e1a366d07f003ad159323c`.
No kernel was downloaded or changed. Existing lunar orientation/imagery remain
owned by R4 and are not needed merely to evaluate system center positions.

Satellite identities/radii come from
[official JPL satellite physical parameters](https://ssd.jpl.nasa.gov/sats/phys_par/).
The raw table snapshot and its SHA256 in `backend/app/data/planetary_satellites.json`
allow reproduction with the new normalizer. Parent radii reuse the already sourced
Solar mean radii. No manually authored satellite orbital catalog is introduced.

The [official NAIF satellite SPK index](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/satellites/)
was inspected and saved. It lists MAR099S64MB versus MAR0991.1GB, JUP34857MB,
JUP34993MB and JUP3651.1GB, among other sources. Filename/size alone does not
establish desired body-center coverage, epochs or accuracy. No satellite kernel
was downloaded. PS2 must inspect candidate segment identities/coverage and qualify
selected subsets independently before admitting any outer-system geometry.

## Commands and outcomes

From the isolated worktree:

```sh
python3 scripts/skydata/build_planetary_satellite_metadata.py output/planetary-systems/science/satellite-physical-parameters.html backend/app/data/planetary_satellites.json
ORAS_PLANETARY_EPHEMERIS_DIR=/home/rocco/Astronomy-Hub/.worktrees/integration-main-20261005/data/runtime-packs/planetary-ephemeris/release /home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_planetary_systems.py -q -W error
ORAS_PLANETARY_EPHEMERIS_DIR=/home/rocco/Astronomy-Hub/.worktrees/integration-main-20261005/data/runtime-packs/planetary-ephemeris/release ORAS_LUNAR_ORIENTATION_DIR=/home/rocco/Astronomy-Hub/.worktrees/r4-a-planet-view-1/data/runtime-packs/lunar-orientation/release /home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_planetary_systems.py backend/tests/test_planet_view.py backend/tests/test_solar_exploration.py -q
git diff --check
```

Red: missing `planetary_systems` service, one collection error before implementation.
Final new suite:14passed, zero warnings with `-W error`.
Combined source regression:47passed, one existing HTTPX TestClient deprecation
warning from the unchanged Solar test. This combined run is not warning-free.
The first sandboxed route run stalled after the seven science tests; it was
interrupted and rerun successfully outside the sandbox. The first network
acquisition failed sandbox DNS; approved small official-source acquisition then
succeeded outside the sandbox. Raw records are preserved; no failure is counted
as a pass.

These are host supporting checks. Docker route/science verification, browser,
WebGL, accessibility and exact-head review belong to the integrated package and
are not claimed by this subtask. No commit, push, PR, merge or deployment was
performed by the science agent. Next task: integrate and qualify the real
Earth–Moon browser journey with this contract, then PS2 source admission.
