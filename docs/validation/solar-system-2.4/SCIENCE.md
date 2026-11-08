# Solar 2.4 destination science qualification

Worktree: `recovery/reconcile-20261026`, starting HEAD `fc1a7142b35ca791ffeddef810c93a244ad32769`, existing draft PR #107. This document qualifies the destination data and backend calculations; browser appearance, GPU performance and owner acceptance are separate evidence.

Context: root/backend `AGENTS.md`, `CORE_CONTEXT.md`, `LIVE_SESSION_BRIEF.md`, the `solar_reconstruction` context pack, and explicitly requested Solar 2.3 science/source evidence. The owner's Solar 2.4 attachment authorizes the new destinations on this existing branch. No broad documentation scan, source publication, merge, deployment or protected-data mutation was performed by this workstream.

## Contract and physical identity

`GET /api/v1/solar-system/destinations?epoch=...` is an optional source contract, `oras.solar-destinations.v1`. The original Sun/eight-planet snapshot and motion endpoints retain their nine-body identities. A missing or corrupted destination pack returns a fixed 503 without changing those existing endpoints. Dates outside the new source interval return bodies explicitly unavailable with no state or playback track; no extrapolation occurs.

| Destination | Stable source identity | Position source | Reference radius |
|---|---|---|---|
| Pluto | JPL SPK 999 | Original PLU060 physical-center chain | 1188.3 km, NAIF PCK11 |
| Ceres | JPL SBDB 20000001 | Horizons solution 48 | 469.7 km, SBDB diameter/2 |
| Vesta | JPL SBDB 20000004 | Horizons solution 36 | 261.385 km, SBDB diameter/2 |
| Eros | JPL SBDB 20000433 | Horizons solution 659 | 8.42 km, SBDB diameter/2 |
| Eris | JPL SBDB 20136199 | Horizons solution 103 | 1163 ±6 km, Sicardy et al. occultation |
| 1P/Halley | JPL SBDB 1000036 | Horizons solution 75 | 5.5 km, SBDB diameter/2 |
| 67P/Churyumov–Gerasimenko | JPL SBDB 1000012 | Horizons solution K284/1 | 1.7 km, SBDB diameter/2 |
| 2I/Borisov | JPL SBDB 1003639 | Horizons solution 54, hyperbolic | Unknown; null, no invented radius |

Radius metadata is an effective/reference size, not the maximum extent of an irregular measured shape. Native-km meshes retain their measured bounds through the separately qualified asset pipeline. Eris's radius comes from the [original occultation publication summary](https://www.iac.es/es/ciencia-y-tecnologia/publicaciones/pluto-radius-and-high-albedo-dwarf-planet-eris-occultation), not an inferred SBDB field.

Pluto's heliocentric state is `(0→9) + (9→999) − (0→10)`. The barycenter `(0→9) − (0→10)` is separately exposed for identity proof and is never substituted for the visible body. PlutoSystem uses `(9→moon) − (9→999)` and the same kernel's complete Sun-to-Pluto chain. The existing six systems retain their source domains and dispatch.

PlutoSystem includes Charon 901 and four smaller moons with original PLU060 positions. Their reference sphere radii come from the April 2024 PLU060 physical-property headers, retained with hashes and URLs: Nix 902: 18.0 ±1.0 km; Hydra 903: 18.5 ±1.0; Kerberos 904: 6.0 ±1.0; Styx 905: 5.2 ±1.0. These four are explicitly `reference-sphere` representations with no qualified resolved shape or surface rotation. Charon uses 606 km from PCK11. Source series include parent 999 relative to Sun 10 and all five moon identities relative to 999.

## Source coverage, interpolation and uncertainty

All new sources cover JD TDB **2460676.5–2462502.5**, 2025-01-01 through 2030-01-01 TDB. With the installed leap-second table, the inward millisecond UTC bounds are **2024-12-31T23:58:50.817Z–2029-12-31T23:58:50.816Z**. Future UTC depends on that leap-second assumption. Returned windows span at most ±2 days and clip known leap transitions. The frontend consumes the existing product clock.

Pluto uses original type-2 Chebyshev coefficients copied from the [NAIF PLU060 kernel](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/satellites/plu060.bsp) through bounded HTTP ranges; no orbit refit, resampling of coefficients or full 129 MB download occurred. Parent, moons, Sun and barycenter all use the same source chain. Six-hundred-second tracks are independently checked at quarter, half and three-quarter points against direct SPK evaluation, rejecting sampled error ≥0.1 km.

The seven selected minor bodies retain original [Horizons geometric ICRF states](https://ssd-api.jpl.nasa.gov/doc/horizons.html), Sun center 10, TDB, KM-S, no aberration/light-time correction. Every daily Hermite interval is checked against separate source states at six-hour spacing. The runtime interpolates these numerical states and derivatives; it never sends Halley, 67P or hyperbolic Borisov through an elliptical orbit solver. Returning the original daily polynomial breakpoints avoids interpolation across a piecewise-polynomial boundary.

| Body | Maximum sampled error over all 1826 daily intervals, km |
|---|---:|
| Ceres | 0.000397266 |
| Vesta | 0.000947101 |
| Eros | 0.030460711 |
| Eris | 0.000017203 |
| Halley | 0.000004805 |
| 67P | 0.038258754 |
| Borisov | 0.000005402 |

These are **sampled interpolation residuals**, not physical orbit uncertainty or a continuous bound. Comet numerical solutions retain source-fit, observation-arc and non-gravitational uncertainty. No tail behavior or contemporary surface spin is inferred from a trajectory. Browser millisecond time quantization is separate from the above native-TDB comparisons.

Fresh Horizons requests at three arbitrary TDB epochs, distinct from every retained six-hour check node, independently validate 14 states: the eight destinations, Pluto barycenter and five moons. Maximum residual is **0.000737092 km** (Eros); maximum velocity residual is **1.20087e-7 km/s** (Eros). Pluto physical-center residual is 0.000072383 km; all parent-relative moon residuals are <0.000003086 km. These compare independent evaluations of JPL's solutions, not independent astronomical observations. Raw responses remain in the local science evidence directory and normalized expected states/URL/hash receipts are committed in `backend/tests/fixtures/solar_destinations_vectors.json`.

### Two corrected admission/time defects

1. Independent review found a future-acquisition identity gap: a name token did not bind the Horizons target designation and numerical solution to the SBDB response. `bind_solution` now requires the exact asteroid number, periodic-comet prefix or Borisov designation plus the exact `{source: JPL#...}` solution. Wrong-number and wrong-solution tests fail closed; all seven actual retained sources were re-admitted. Current pinned sources were never misidentified. Horizons record numbers are intentionally distinct from stable SBDB SPKIDs.
2. A new boundary regression exposed float-JD→UTC rounding of several microseconds, which browser Date truncation could turn into an excluded final millisecond. Returned source tracks now preserve their exact requested UTC boundary labels. Inclusive coverage-edge regressions assert the published endpoints exactly, with no relaxation of coverage or extrapolation.

## Orientation and imagery registration

Body-fixed axes are X at longitude zero, Y at 90° east and Z north. All rotations map into ICRF and use source TDB models. Twenty-five independent CSPICE `pxform` matrices (five epochs across the interval, five bodies) agree within **2e-10 per matrix component**. The committed oracle is `backend/tests/fixtures/solar_destinations_frames.json`; CSPICE/spiceypy is an isolated verification tool, not a backend dependency.

| Body | Frame / model | Source digest |
|---|---|---|
| Pluto, Charon, Ceres | IAU_PLUTO / IAU_CHARON / IAU_CERES, PCK11 | `3dff7b1dbeceaa01f25467767d3fa25816051c85d162d1edf04acb310ee28bb1` |
| Vesta | IAU_VESTA, `dawn-vesta-grv221108-v1` | `bb17489f6d933124b502a3a9a5e3491a0d94ab34bb06a7addfa760bd8c681278` |
| Eros | PDS_GASKELL_EROS, `pds-gaskell-eros-alex` | `0b410adcbd14bc6f678781524050b979714c7f64acd8693786f35acaa1363673` |

The [Dawn GRV221108 model](https://naif.jpl.nasa.gov/pub/naif/DAWN/kernels/pck/dawn_vesta_grv221108_v1.tpc) explicitly matches the selected Vesta DSK and Claudia double-prime meridian. Its asteroid periodic terms belong to the asteroid's PCK namespace; the shared evaluator now handles that namespace while retaining planetary-system satellite terms. The existing satellite-frame regressions pass unchanged. The [Eros companion model](https://sbnarchive.psi.edu/pds4/non_mission/gaskell.ast-eros.shape-model/document/eros_alex.tpc.txt) is retained exactly; extrapolated reference rotation is not a contemporary meridian observation. PCK body IDs 2000001/2000004/2000433 are legacy rotation-constant namespaces, distinct from migrated SBDB catalog IDs.

Pluto/Charon source map grids are retained, but the PDS edition does not resolve the historical approximately 1.45° frame-registration question documented by the asset workstream. No arbitrary correction was applied. Ceres VTAD imagery also lacks independently documented meridian registration. 67P's CHEOPS and Halley's historical shape frames remain static source presentations without an epoch-qualified orientation. Borisov and Eris have no qualified surface orientation in this release.

## Pack, budgets and reproducibility

Read-only pack: `data/runtime-packs/solar-destinations/release-2025-2030-v1`.
Container: mount to `/runtime/solar-destinations:ro`, set `ORAS_SOLAR_DESTINATIONS_DIR=/runtime/solar-destinations`.

Manifest SHA256: `69c3a97875a081d38112f491f14a253af369262c31ad10521480406704d3baf9`.
Original-coefficient Pluto excerpt SHA256: `0f5f425b946fd2217e4fd37e147474ed3359cb517d92542eb9d449b486bcffec`, 1,572,968 bytes.
Tracked source metadata: `destination-release.json`; source data itself remains in the mounted pack, outside Docker image content.

Recorded acquisition: 12,490,021 bytes. Independent Horizons references: 101,091 bytes. Retained initial response probes and PLU header-range probe: 187,863 bytes. **Total counted source transfer 12,778,975 bytes**, below the science allocation's 67,108,864-byte hard ceiling. PCK11 and the Eros companion were reused byte-identically from existing qualified local sources. No prior runtime pack was overwritten. The importer refuses non-empty release output, enforces the 64 MiB ceiling and serializes JPL API calls with the shared lock.

Reproduction entry point (new empty path only; a newly observed source/timestamp must be separately qualified before its digest replaces the runtime pin):

```sh
/home/rocco/Astronomy-Hub/.venv/bin/python scripts/skydata/acquire_solar24_destinations.py --output /new/empty/source-release --max-bytes 67108864
```

Initial acquisition stopped on Borisov's canonical SBDB designation (`2019 Q4`, despite the query alias `2I`). The raw response was preserved; the importer was corrected to the source identity, then that incomplete new pack was finished from retained bytes and bounded requests. No qualified active release was replaced. The final importer reproduces this source layout without that manual continuation.

## Focused verification

The tests were written before the new service and before the independent-review corrections. Initial missing-feature/identity/boundary failures were observed, followed by passing corrected regressions.

```sh
ORAS_PLANETARY_EPHEMERIS_DIR=/home/rocco/Astronomy-Hub/.worktrees/integration-main-20261005/data/runtime-packs/planetary-ephemeris/release \
ORAS_LUNAR_ORIENTATION_DIR=/home/rocco/Astronomy-Hub/.worktrees/r4-a-planet-view-1/data/runtime-packs/lunar-orientation/release \
/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest -q \
 backend/tests/test_solar_destinations.py backend/tests/test_solar24_acquisition.py \
 backend/tests/test_planetary_systems.py backend/tests/test_system_body_orientation.py \
 backend/tests/test_satellite_spk_systems.py
```

107 tests passed before the added importer identity regression; that added importer suite then passed 4 tests and re-admitted every retained actual source. An earlier unconfigured local run had 95 pass/11 fail because legacy DE442s/lunar mounts were absent at default relative paths; using the existing read-only source directories resolved every failure.

Actual API-serialized fixtures are `output/playwright/solar-system-2.4/science/destinations-example.json` and `pluto-system-example.json`. The endpoint failure test checks that a missing new pack returns 503 while the existing nine-body Solar endpoint remains 200. Runtime Docker results are recorded below when the final authorized candidate check completes.

No Windows GPU/browser or physical-device claim is made by this backend workstream. The parent workstream owns those validations. No commit, push, merge or deployment was performed by this agent.

Final authorized Docker check (existing disposable candidate, all source/worktree mounts read-only; pytest scratch in `/tmp`, bytecode and pytest cache disabled):

```sh
docker exec -e PYTHONDONTWRITEBYTECODE=1 -w /work pr107-solar24-backend \
 python -m pytest -p no:cacheprovider --basetemp=/tmp/solar24-science-pytest -q \
 backend/tests/test_solar_destinations.py backend/tests/test_solar24_acquisition.py \
 backend/tests/test_planetary_systems.py backend/tests/test_system_body_orientation.py \
 backend/tests/test_satellite_spk_systems.py
```

**108 passed in 7.06 s**, with **34 third-party DeprecationWarnings** from existing Skyfield `planetarylib.py:113` (`matrix.shape = 3, 3`) under NumPy 2.5, emitted by the retained Moon/frame suites. The new destination/acquisition tests emit no such warnings. These dependency warnings remain recorded; no unrelated dependency/runtime rewrite or warning suppression was introduced. Full log: `output/playwright/solar-system-2.4/science/backend-docker-focused.log`.

Separate review: the asset implementation agent independently reviewed this destination backend, validated the physical-center/time/source flows, identified the importer designation/solution gap, then re-ran its corrected regression and all retained-source identity bindings. It reported no remaining confirmed P1/P2 defect in the reviewed backend scope (14 focused tests passed with the explicit existing DE442s source path). This is a separate scoped review, not a whole-PR approval. The science agent's separate asset/population review is recorded in `INDEPENDENT-ASSET-POPULATION-REVIEW.md`.
