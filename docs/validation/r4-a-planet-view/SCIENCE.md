# R4-A Moon science qualification

This is a bounded Moon globe contract, not full R4 acceptance. Owner direction is
the R4 resume instruction supplied on 2026-10-23; Default context was loaded by
the coordinating agent and registered in `loaded-documents.txt`. Backend-specific
rules were also read. The historical backend `/api/v1` rule is honored.

## Candidate decision

| Gate | Moon | Mars |
| --- | --- | --- |
| Actual pinned DE442s identity | Moon center **301** present | **4 is Mars barycenter**, not center 499 |
| Installed orientation implementation | Skyfield binary PCK frame supported and tested | Skyfield does not support text-series planetary rotation |
| Shape | Pinned NAIF `BODY301_RADII`: 1737.4 km each | An oblate shape would require separate qualification |
| Imagery | NASA/PDS WAC global mosaic, separately qualified in imagery evidence | Not qualified for this slice |
| Terrain | Unavailable; never infer elevation from albedo | Not qualified |
| Selection | First non-Earth destination | Remains unavailable |

This selection follows actual source capability. It does not add a tenth primary
body to Solar or reinterpret the existing Mars barycenter as a physical surface.

## Direct API contract

`GET /api/v1/planet-view/moon?time=2026-10-23T12:00:00Z`

- `schema`: `oras.planet-view.v1`.
- `body`: `catalog=Solar System (JPL)`, `source_id=moon`, `model=moon`,
  `naif_id=301`, `position_reference=Moon center (301)`.
- `epoch`: normalized UTC ISO string. Input must include a timezone.
- `time`: input scale UTC; evaluation scale TDB; `jd_tdb` is the evaluated epoch.
- `frame`: inertial ICRF; body fixed `MOON_ME_DE440_ME421`; NAIF frame 31009.
  `icrf_to_body_fixed` is a 3×3 row-major matrix multiplying column vectors.
  Transpose maps fixed vectors back to ICRF. This contract does not reuse an
  Earth-fixed coordinate frame.
- `shape`: reference sphere with `radii_m=[1737400,1737400,1737400]`.
- `coordinates`: planetocentric latitude north; east-positive longitude
  normalized to [-180,180); height in meters above the reference sphere.
  Height is **not terrain elevation** and no Earth datum applies.
- `illumination.direction_body_fixed`: unit vector from Moon center toward Sun,
  computed geometrically from DE442s targets 301 and 10 at the same TDB epoch,
  transformed by the qualified matrix. No light-time/aberration correction.
- `capabilities`: orientation and reference globe available; terrain false.
  Imagery readiness belongs to the native source manifest; this API does not
  assert that image bytes loaded in a browser.
- `sources`: URLs and SHA256 digests for the three lunar kernels and DE442s.
- `coverage`: bounded to 1900-01-01 through 2051-01-01 UTC, inclusive. This is
  narrower than actual kernel coverage, chosen for the initial qualified slice.
- `uncertainty`: distinguishes frame agreement from imagery/physical accuracy.

422 rejects malformed, timezone-free, and out-of-range epochs. Unsupported
bodies return 404. Missing, changed, invalid or unreadable lunar sources return
503; the service never substitutes a sphere with fabricated orientation or
downloads a fallback. Existing Solar data contracts are unchanged.

## Source and rights ledger

| Source | Source URL | SHA256 | Use |
| --- | --- | --- | --- |
| Lunar FK 2025-04-16 | [moon_de440_250416.tf](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_de440_250416.tf) | `a47c71e9c9f33796bdafb2c9d69a7ee447b6016ecad80f71cd6f3e479f9cf768` | ME frame and independent SPICE numeric example |
| DE440 lunar orientation | [moon_pa_de440_200625.bpc](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/moon_pa_de440_200625.bpc) | `60cd55aa401ea2ea97360636f567554bfe4e37bb829f901b4460a455dfaf783f` | Binary principal-axis rotation |
| Generic constants | [pck00011.tpc](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc) | `3dff7b1dbeceaa01f25467767d3fa25816051c85d162d1edf04acb310ee28bb1` | 1737.4 km lunar reference radius |
| Existing DE442s release | [de442s.bsp](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de442s.bsp) | `54d97562a5b094d298b1b8eafa5a2e17e3e010ce85e1a366d07f003ad159323c` | Geometric Moon/Sun positions; existing release untouched |

[NAIF rules](https://naif.jpl.nasa.gov/naif/rules.html) permit downloading and
using the kernels, and redistribution of unchanged NAIF-distributed kernels.
These three files remain unmodified. NASA/JPL NAIF attribution is retained;
these products are provided without warranty. No paid provider or credential.

Lunar data inventory is three files (~13 MB) in
`data/runtime-packs/lunar-orientation/release`, excluded from images and mounted
read-only. Acquisition command:

```sh
python3 scripts/skydata/build_lunar_orientation.py --output data/runtime-packs/lunar-orientation/release
```

Downloads are explicitly run offline-preparation actions, digest-checked before
atomic publication. The API loads local files only. Configure
`ORAS_LUNAR_ORIENTATION_DIR` and existing `ORAS_PLANETARY_EPHEMERIS_DIR`.

## Orientation qualification and implementation caveat

[Skyfield's official planetary reference documentation](https://rhodesmill.org/skyfield/planetary.html)
defines its binary frame support and matrix direction. Installed Skyfield 1.54
loads the actual NAIF files, preserving native rotation calculations.

An important runtime limitation was reproduced: `PlanetaryConstants` indexes
the last binary segment per body; the DE440 PCK has two segments, with the last
starting in 2426. A default frame therefore fails for 2026. The service selects
the covering segment from the loaded PCK and passes it to existing
`build_frame(31009, _segment=...)`. This narrow use of an upstream private
argument is covered by early/current/late epoch tests; no Skyfield source is
modified and no extra dependency is introduced. Future Skyfield updates must
rerun these tests.

The NAIF FK independently publishes SPICE's Earth-relative-to-Moon geometric
vector at TDB JD 2459852.5, in the same ME frame. Reference kilometers:
`[374008.654, -23435.970, 10141.334]`. Our DE442s positions plus DE440 orientation
produce `[374008.65438278, -23435.97040919, 10141.33390133]`, differing by less
than 0.6 m. Test tolerance is 2 m to allow the rounded reference and different
ephemeris fits; it is not a physical accuracy guarantee.

The FK documents alignment to DE421 ME within approximately 1.02 m over
1900–2051. This is relevant to the imagery coordinate registration, not pixel
resolution or topography. The PA and ME frames differ substantially and cannot
be interchanged. This API explicitly uses the ME realization.

The [LROC RDR SIS](https://pds.lroc.im-ldi.com/data/LRO-L-LROC-5-RDR-V1.0/LROLRC_2001/DOCUMENT/RDRSIS.PDF)
specifies planetocentric latitude, east-positive longitude, the Mean Earth/polar
axis reference system, and all three reference radii as 1737.4 km. This supports
the chosen image-to-globe coordinate mapping; it does not follow merely from the
GeoTIFF's `Moon2000` spheroid label. Image bytes, no-data mask, provenance and
regional resolution limits are recorded separately in
`runtimes/planet-runtime/moon-source-manifest.json`.

The independent official Skyfield example gives a 2019-12-20 11:05 UTC subsolar
point rounded to latitude 0.3°, longitude −104.9°. Geometric DE442s/DE440 results
pass a 0.1° envelope against that separate DE421 apparent-position example.
The tolerance accounts for rounding and corrections, not instrument accuracy.

## Historical science-subtask verification

Exact commands run from the isolated worktree (host supporting evidence):

```sh
ORAS_PLANETARY_EPHEMERIS_DIR=/home/rocco/Astronomy-Hub/data/runtime-packs/planetary-ephemeris/release /home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_planet_view.py -q
ORAS_PLANETARY_EPHEMERIS_DIR=/home/rocco/Astronomy-Hub/data/runtime-packs/planetary-ephemeris/release /home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_planet_view.py -q -W error
ORAS_PLANETARY_EPHEMERIS_DIR=/home/rocco/Astronomy-Hub/data/runtime-packs/planetary-ephemeris/release /home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_planet_view.py backend/tests/test_solar_exploration.py -q
```

Red: missing `planet_view` import, one collection error before implementation.
Green focused: **10 passed, zero warnings** with `-W error`. Combined Solar
regression: **33 passed, one pre-existing HTTPX TestClient deprecation warning**
in `test_solar_exploration.py`. Authoritative Docker verification is recorded in
the coordinating handoff. Host TestClient initially hung under the sandbox; an
escalated test run completed. Explicit HTTPX ASGITransport also avoids the
older TestClient deprecation warning.

No browser validation is claimed by this science subtask. No commit, push,
merge or deployment was performed. Remaining gates: native/browser journeys,
Docker execution, exact-head independent review.

Final Docker verification executes both lunar and preserved Solar tests:33passed, with7 visible dependency deprecation warnings (five Skyfield/NumPy2.5 shape warnings, plus existing Starlette/HTTPX warnings). A strict warnings-as-errors container run therefore does not pass. Host lunar strict verification is10passed with zero warnings and is supporting evidence only. No dependency/source pin is changed or warning silently suppressed. The mapped binary is finalized on cache eviction/process exit. See the integrated README for final delivery status.
