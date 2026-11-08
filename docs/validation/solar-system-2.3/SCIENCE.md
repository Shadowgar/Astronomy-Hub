# Solar System 2.3 — bounded ephemerides and body frames

Status: implementation and focused local qualification complete; Docker/browser integration, independent review, owner visual acceptance and release qualification are separate gates. No merge, deployment or source publication was performed by the science workstream.

## Authority and inspected context

The owner’s Solar System 2.3 directive authorizes this expansion and supersedes earlier package-specific graphics stops. Root loaded CORE_CONTEXT, LIVE_SESSION_BRIEF, the solar reconstruction manifest pack, root/frontend/backend AGENTS, SYSTEM_VALIDATION_SPEC, UNIFIED_UNIVERSE_ARCHITECTURE, ADR0010, Solar 2.0–2.2 evidence and the planetary-systems/PS3 READMEs. This workstream consumed that scoped context and the owner attachment, then inspected the named services, schemas, tests, local manifest and source builders. No broad docs scan occurred. Historical frontend/backend FE8.5 restrictions defer to the current owner directive. Sky/Stellarium rendering is untouched.

Starting branch/HEAD: `recovery/reconcile-20261026` / `767ec130faa60606e689a889f7ed4c3c58ee74fc`. No science commit or push was made. PR #107 remains under root control, draft and unmerged.

## Starting inventory and chosen source

Earth–Moon already uses DE442s, Earth physical center 399 and Moon 301, with bounded checked Hermite tracks. The outer pack uses geometric ICRF/TDB Horizons vectors, physical parent centers, and finite October 2026 coverage. Its manifest remains unchanged: `770352992eeda04a7005172b2d57d6a3809deaf612f0e16971f74751df2eca61`.

| System | Parent center | Intermediate barycenter | Existing admitted satellites | New source |
|---|---:|---:|---|---|
| Earth | 399 | 3, internal DE442s chain | Moon 301 | Existing DE442s retained |
| Mars | 499 | 4 | Phobos 401, Deimos 402 | MAR099s |
| Jupiter | 599 | 5 | Io 501, Europa 502, Ganymede 503, Callisto 504 | JUP365 |
| Saturn | 699 | 6 | Enceladus 602, Titan 606 | SAT441 |
| Uranus | 799 | 7 | Ariel 701, Umbriel 702, Titania 703, Oberon 704, Miranda 705 | URA182 offsets; URA184 barycenter; DE441 Sun |
| Neptune | 899 | 8 | Triton 801 | NEP098 part 1 |

The [JPL satellite ephemeris table](https://ssd.jpl.nasa.gov/sats/ephem/files.html) and [NAIF satellite archive](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/satellites/) identify the selected models. Full source files range from tens of MB to GB. Instead of downloading them, the importer copies original type-2 Chebyshev coefficient records with strict HTTP 206 ranges, preserving comments and explicit excerpt metadata. It does not fit or propagate osculating elements.

`RangeSource` rejects HTTP 200 before reading the body, incorrect Content-Range, changed remote version validators, oversized reads, and budget overruns before network access. Every accepted range records source length, byte offsets, SHA-256, ETag and Last-Modified. The full upstream file was **not** downloaded or SHA-256 hashed; only accepted ranges and final excerpts are hashed. No full-source digest is fabricated.

Final immutable release: `data/runtime-packs/planetary-systems-spk/release-2025-2030-v3`. Environment override: `ORAS_PLANETARY_SYSTEMS_SPK_DIR`. The default is checkout-relative. The old release/mounts are unchanged. Two earlier unqualified research releases remain separate and are not selected by the service.

Final manifest SHA-256: `e268784c53783932386399c84f7e1a065b2f3c15141e7f77712527d372998085`.

The three acquisition runs downloaded 18,071,542 bytes in total; unchanged excerpts were hash-verified and reused in the later runs. Additional direct research ranges, both text PCK files, and 122,071 bytes of fresh Horizons references keep total source acquisition below a conservative 23 MiB ceiling, within the approved 64 MiB budget. No multi-GB file or protected mount was downloaded or modified. Small normalized frame metadata is 3,170 bytes; bulk SPKs remain outside Docker images and source control.

## Position/time contract and correction found during qualification

For a moon M and physical parent P with the same source barycenter B, the service evaluates `(M−B)−(P−B)`. Sun lighting uses `Sun−B−(P−B)`. Planet barycenters are never presented as physical centers.

The initial Uranus trial incorrectly paired the updated URA182 parent offsets with an older DE441 Uranus barycenter: independent Horizons comparisons exposed a 1,050–1,570 km discrepancy in parent-to-Sun position. Replacing the barycenter with URA184 reduced this to about 0.16 km; that remaining offset was isolated to the bundled Sun reference. The final explicit chain uses URA182 parent/moon offsets, URA184 barycenter 7, and DE441 Sun 10, matching the independent Horizons source domain. All three kernel hashes are exposed in `source.kernels`. No DE442s offset is mixed into outer systems.

Source coverage is JD TDB 2460676.5–2462502.5 (2025-01-01 through 2030-01-01 TDB). Published UTC bounds round inward to milliseconds:

- Start: `2024-12-31T23:58:50.817Z`.
- End: `2029-12-31T23:58:50.816Z`.

UTC conversion uses the installed Skyfield leap-second table, including its future UTC assumptions. Known leap transitions are clipped. The service rejects naive epochs and timestamps outside published bounds. No extrapolation occurs.

Outer-system snapshots provide a clipped ±2-day window at 600-second position cadence. Every returned interval is evaluated independently at quarter, half and three-quarter points against direct SPK, and rejected if sampled position error reaches 0.1 km. This is a sampled interpolation envelope, not continuous-error proof or physical ephemeris uncertainty. Playback must request another qualified window before advancing beyond the current one; global source coverage and sampled coverage are distinct.

## Orientation and source registration

The API returns normalized xyzw quaternions mapping canonical body-fixed axes **X=longitude 0, Y=90° east, Z=north** into ICRF. The client uses shortest-path SLERP at the same UTC as positions. It has no independent science clock, pole equations or spin-rate approximations.

NAIF [pck00011](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc) supplies parent and most moon pole/prime-meridian models, including periodic terms and Mars quadratic phases. Source SHA-256: `3dff7b1dbeceaa01f25467767d3fa25816051c85d162d1edf04acb310ee28bb1`. Default PCK orientation cadence is 600 seconds, tightened to 300/150/75 when needed to keep every sampled quarter/midpoint error below 1 arcsecond. Phobos requires 150-second sampling in the measured current-time window.

Saturn’s source pole can orient the ring reference equator by rotating body-fixed +Z. This does not qualify ring warp, departures from the reference plane, or any parent texture’s prime-meridian registration. NASA model imagery retains an illustrative orientation wherever its original UV-to-body registration is not proven. Source-defined body frames alone do not prove texture registration.

Earth reuses the existing Solar Skyfield ITRS transform, inverted into ITRS→ICRF. It retains installed historical/predicted UT1/Delta T and zero polar motion; no measured EOP or sub-metre accuracy is claimed. Moon reuses the existing native `MOON_ME_DE440_ME421` binary-PCK/frame implementation, with batch evaluation of the same covering segments. Missing native Moon sources omit its frame rather than substituting generic IAU_MOON. The native Moon route is unchanged. Earth/Moon frames use checked adaptive hourly sampling, reducing the 32-day response to 769 frame samples each.

PDS meshes require their actual legacy coordinate models:

| Body | Frame/model ID | Qualification |
|---|---|---|
| Phobos | `IAU_PHOBOS` / `pds-gaskell-phobos-pck00006` | The [PDS Gaskell bundle description](https://sbnarchive.psi.edu/pds4/non_mission/gaskell.phobos.shape-model/document/bundle_description.txt) explicitly names pck00006. Its original axes are evaluated using that kernel, not guessed into pck00011. PCK SHA-256 `8aacb5dff544bed1f7cf0659296a1ca75896128a0a729447be0a4deb4de4ecb4`. |
| Deimos | `PDS_THOMAS_DEIMOS` / `pds-thomas-deimos-label-v1` | The [PDS label](https://sbnarchive.psi.edu/pds4/non_mission/ast-sat.thomas.shape-models_V1_0/data/m2deimos.xml) supplies pole RA 316.65°, Dec 53.53° J2000 and W=79.41+285.1618970d. Label SHA-256 `74b4c557e6827940430b2d670ec972d9a5d5dc63ef0a95b2b6ebd141ab78f634`. Planetocentric east-positive longitude follows the PDS dictionary convention. TDB days follow IAU/SPICE convention; the label itself does not explicitly name the time scale. |

The legacy models preserve source registration. They are not modern observational orientation accuracy claims. `system_shape_frames.json` contains only normalized source coefficients/provenance and is digest-pinned. The frontend requires exact frame/model/source hashes for these two geometry models.

## Independent numerical evidence

Fresh Horizons API geometric ICRF/TDB vectors were acquired for 19 target/center pairs at three epochs spanning 2025, late 2026 and 2029. The fixture preserves requests, source headers, raw response hashes and byte counts. All **57** comparisons pass:

- Maximum position difference: `9.547214793945162e-7 km`.
- Maximum velocity difference: `6.217248937900877e-15 km/s`.

A separate temporary SpiceyPy 8.0.0 / CSPICE_N0067 environment generated 57 pck00011 matrices and six legacy mesh-frame matrices using `pxform`. Backend matrices agree within `2e-10` per component; rotations also satisfy orthonormality and determinant checks. These are independent evaluator comparisons of source models, not independent astronomical observations. Reference fixtures and their CSPICE commands are versioned under `tests/fixtures/planetary-systems/solar23/`.

## Commands and results

Acquisition (each output directory was new; no active release was overwritten):

```bash
/home/rocco/Astronomy-Hub/.venv/bin/python scripts/skydata/acquire_system_spk.py --output data/runtime-packs/planetary-systems-spk/release-2025-2030 --max-bytes 62914560
/home/rocco/Astronomy-Hub/.venv/bin/python scripts/skydata/acquire_system_spk.py --output data/runtime-packs/planetary-systems-spk/release-2025-2030-v2 --reuse data/runtime-packs/planetary-systems-spk/release-2025-2030 --max-bytes 41943040
/home/rocco/Astronomy-Hub/.venv/bin/python scripts/skydata/acquire_system_spk.py --output data/runtime-packs/planetary-systems-spk/release-2025-2030-v3 --reuse data/runtime-packs/planetary-systems-spk/release-2025-2030-v2 --max-bytes 41943040
```

The builder source was corrected between research releases as described above. Re-running its final source creates the final source selection; acquisition timestamps and therefore manifest hashes must be reviewed and repinned for a newly acquired release.

Final affected science regression bundle:

```bash
ORAS_PLANETARY_EPHEMERIS_DIR=/home/rocco/Astronomy-Hub/.worktrees/integration-main-20261005/data/runtime-packs/planetary-ephemeris/release ORAS_LUNAR_ORIENTATION_DIR=/home/rocco/Astronomy-Hub/.worktrees/r4-a-planet-view-1/data/runtime-packs/lunar-orientation/release /home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_satellite_spk_systems.py backend/tests/test_system_body_orientation.py backend/tests/test_system_spk_acquisition.py backend/tests/test_planetary_systems.py backend/tests/test_horizons_systems.py -q
```

Result: **115 passed in 14.40 s**. The new acquisition, orientation, integration and client rejection tests were first observed failing before implementation. Tests include source tampering after cache admission, endpoint inclusion/1-ms exclusion, barycenter rejection, future/current source coverage, missing source fallback, physical-center chains, source-model matrix comparisons and every returned interpolation interval.

```bash
npm --prefix frontend test -- tests/systemOrientation.test.ts tests/planetarySystems.test.ts
npm --prefix frontend run typecheck
git diff --check
```

Results: **27 passed**, typecheck exit **0**, diff check exit **0**. An independent review exposed missing position UTC/TDB-duration, cadence and error-ceiling checks; all three mutation cases were reproduced as failures, fixed and added to the client suite. Six actual API snapshot JSON payloads were additionally passed through the frontend validator and evaluated at start/current/end with `tsx`: **six systems passed**. These are supporting local checks, not Docker or headed-browser acceptance.

### Docker science qualification and warning limit

The existing isolated task container was tested without recreation or dependency changes:

```bash
docker exec -w /work -e PYTHONPATH=/work pr107-solar23-backend python3 -m pytest backend/tests/test_satellite_spk_systems.py backend/tests/test_system_body_orientation.py backend/tests/test_system_spk_acquisition.py backend/tests/test_planetary_systems.py backend/tests/test_horizons_systems.py -q -p no:cacheprovider
```

Result: **115 passed, 34 warnings in 15.17 s**, exit **0**. All 34 warnings are `DeprecationWarning` from installed `skyfield/planetarylib.py:113`, whose `matrix.shape = 3, 3` assignment is deprecated by NumPy 2.5. This is a passing Docker science bundle with an explicit upstream warning limitation; the plan's warning-clean target is **not achieved**. Versions queried from the same container: NumPy **2.5.3**, Skyfield **1.55**, Starlette **0.27.0**, FastAPI **0.99.1**, HTTPX **0.27.2**, AnyIO **4.15.1**, pytest **9.1.1**.

The integration owner's preceding run of this bundle with `-W error` failed: **12 failed, 103 passed in 11.49 s** (`output/playwright/solar-system-2.3/docker-science.log`). Eleven failures originate at that Skyfield deprecation; the twelfth is a delayed `PytestUnraisableExceptionWarning` for an unclosed AnyIO `MemoryObjectReceiveStream`. A bounded isolated reproduction was run:

```bash
docker exec -w /work -e PYTHONPATH=/work pr107-solar23-backend python3 -m pytest backend/tests/test_planetary_systems.py::test_route_valid_snapshot_unknown_and_missing_source -q -p no:cacheprovider -W error --tb=short
```

Result: **1 failed in 1.09 s**, exit **1**, followed by the same unclosed-stream warning at interpreter cleanup. The traceback shows the Skyfield deprecation promoted to an exception before the Earth endpoint sends its response. Installed Starlette `BaseHTTPMiddleware.call_next` raises that downstream exception before entering the receive stream's response-body context; its response-complete cleanup never runs. A separate diagnostic using only Starlette, HTTPX and a passthrough `BaseHTTPMiddleware` confirmed this path: a normal endpoint returned `200` with zero captured warnings; an endpoint raising `RuntimeError` produced `ExceptionGroup` and one `Unclosed <MemoryObjectReceiveStream ...>` warning after `gc.collect()`. It did not import Astronomy Hub or its tests. The diagnostic script and output are retained under the local evidence directory:

```bash
docker exec -i -w /work pr107-solar23-backend python3 - < output/playwright/solar-system-2.3/science/middleware-warning-repro.py > output/playwright/solar-system-2.3/science/middleware-warning-repro.log
```

The standard bundle reports no stream warning. The evidence identifies an upstream middleware exception-path cleanup limitation exposed by warning escalation, rather than a new test-client lifecycle defect. No test, dependency, middleware, scientific calculation, or warning filter was changed for this investigation. Warnings remain, and no `-W error` pass is claimed. Dependency compatibility and exception-path cleanup require a separately scoped qualification if warning-clean execution is required.

## Local generation measurements

Measured at `2026-11-02T12:00:00Z`; single local observations, not server latency guarantees. Full data is in `output/playwright/solar-system-2.3/science/api-timing.json`.

| System | Generation seconds | Validation/JSON seconds | JSON bytes |
|---|---:|---:|---:|
| Jupiter | 0.187 | 0.127 | 1,098,252 |
| Saturn | 0.093 | 0.067 | 666,944 |
| Mars | 0.248 | 0.099 | 937,728 |
| Uranus | 0.199 | 0.156 | 1,317,998 |
| Neptune | 0.060 | 0.053 | 442,287 |
| Earth–Moon | 0.522 | 0.063 | 579,082 |

Earth–Moon originally took 4.59 s / 1.84 MB with repeated scalar native-frame checks. Reusing vectorized native-frame evaluation and checked hourly frame samples preserved the same scientific model while removing that overhead. Outer ±7-day windows would exceed the chosen 2 MiB payload target; ±2-day windows are retained.

## Files and remaining limits

Changed existing files: `backend/app/services/planetary_systems.py`, `backend/app/schemas/planetary_systems.py`, the two retained PS1/PS2 test modules (explicit legacy-domain fixtures), `frontend/src/features/systems/systemTypes.ts`, and `systemContracts.ts`.

New files: `satellite_spk_systems.py`, `system_body_orientation.py`, `backend/app/data/system_shape_frames.json`, the two `scripts/skydata/` acquisition/normalization builders, three new backend test modules, `frontend/src/features/systems/systemOrientation.ts`, its focused test, and three numerical reference fixtures. No changes were made to `horizons_systems.py`, the old source pack, native Moon route, Docker configuration, or protected source mounts by this workstream.

Remaining limits: 14 outer moons remain the admitted positional set; other catalog bodies stay unavailable. No future leap seconds are predicted. Text-PCK and legacy shape frames carry their source model limitations. Earth has no measured polar motion/EOP. Independent numerical agreement does not imply independent measurement accuracy. Texture UV/frame registration is a separate asset qualification. The focused Docker science bundle passes with the upstream warning limitation above. Broader Docker/browser integration, graphics navigation, source-window continuation, performance under the owner GPU, and owner acceptance require the root integration workstream. No global completion or release claim follows from this science report.

## Final excerpt inventory

| Kernel excerpt | Bytes | SHA-256 |
|---|---:|---|
| `jupiter-2025-2030.bsp` | 2,387,024 | `ecabc00042bebc6921cc30346dd96e23357870c42d230051b075de72b4236a02` |
| `mars-2025-2030.bsp` | 6,029,064 | `c17f85ea4f26a8633f4b207317a47f3e832b68a1c29a02e34e9a5cd6cf3e6a26` |
| `neptune-2025-2030.bsp` | 1,805,832 | `924e3d8490a14d8e3973674f65d1198ea03c406bd005969664dcb2596f091038` |
| `reference_sun-2025-2030.bsp` | 96,744 | `b2a24375d68af87c2715c7c65f388530c3073576a9f23fcb26208ae60bf484fd` |
| `saturn-2025-2030.bsp` | 1,514,656 | `e33a24aae1d749becbe202a642ae8e95870ba934c0bb30afb05e25cf5c96e38b` |
| `uranus-2025-2030.bsp` | 2,078,184 | `6851e279c1d7716c592569f58ca9da919378734872219a2202092fe47f99c109` |
| `uranus_solar-2025-2030.bsp` | 78,944 | `0d76f4b76c16f12d29ac860c1ce1dce0b0b2b4c26d7bad30dee58abee0229237` |
