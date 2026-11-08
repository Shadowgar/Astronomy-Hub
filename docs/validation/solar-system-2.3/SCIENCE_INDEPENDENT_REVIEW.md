# Solar System 2.3 independent science review

Result: **PASS for the reviewed local science implementation after two corrected P2 findings.** No open finding remains in this review. This is not Docker, browser, GPU, observational-accuracy or owner visual acceptance.

Reviewed on 2026-11-02 by the asset worker, who did not author the reviewed science implementation. The science worker made the corrections; the reviewer made no implementation edits. Branch `recovery/reconcile-20261026`, base HEAD `767ec130faa60606e689a889f7ed4c3c58ee74fc`, existing draft PR107. No commit or push by this reviewer.

Context: already loaded parent CORE_CONTEXT, LIVE_SESSION_BRIEF and `solar_reconstruction` pack; the explicitly assigned `solar-system-2.3/PLAN.md` and named source/test files only. No extra documentation pack or broad docs scan. The earlier asset work is not independently approved by this review.

## Scope and evidence checkpoint

Inspected `satellite_spk_systems.py`, `system_body_orientation.py`, the planetary-system service/schema/route, both acquisition/frame builders, normalized shape-frame data, all three new reference fixtures, backend science/acquisition tests, and frontend `systemContracts.ts`, `systemTypes.ts`, `systemOrientation.ts` and focused tests. Also inspected the original CSPICE reference generators without executing their fixture-writing code.

The immutable v3 release manifest is pinned at SHA-256 `e268784c53783932386399c84f7e1a065b2f3c15141e7f77712527d372998085`. Reviewed implementation SHA-256 values:

| File | SHA-256 |
|---|---|
| `backend/app/services/satellite_spk_systems.py` | `3dad9b2c58ab55eb32a84a2a4c68058c8252f85971dd275f2699060b13fb70fb` |
| `backend/app/services/system_body_orientation.py` | `c442a92066c5fe2574c6dc83104357ed0e505166f1e48863523324fc607c8040` |
| `backend/app/services/planetary_systems.py` | `ae5c8ffc9605467b07f909c0c9349ed34b1fcfc7ce0ab581adff6064aaa8714d` |
| `backend/app/schemas/planetary_systems.py` | `406280221c765c88fcc883993ac103c5314ad2b2be3e09de58e68c93305b98d4` |
| `scripts/skydata/acquire_system_spk.py` | `1b63e9208aa9f9be8a3bc7bfcea54928d5b6f74c5410be259ee65129edc01b7a` |
| `scripts/skydata/build_system_shape_frames.py` | `e094fef303fe1f9f173b935bdae64f2ab5f21a4f4b9aec67635efe94c432ddbd` |
| `frontend/src/features/systems/systemContracts.ts` | `b460a6a0ee48d47086addd1df14ad2c800bcf82b23e4297e9b48790c9f9068b8` |
| `frontend/src/features/systems/systemOrientation.ts` | `75eaec80d555635a4161aa2bb1d4862d09be9fad025484124499a1ced2914e0a` |

## Findings and independent correction checks

### SCI-1 — P2, corrected: position-track UTC/TDB disagreement was admitted

Location: `frontend/src/features/systems/systemContracts.ts:39`, position sample admission; downstream tangent duration at line 49.

Original behavior: unlike orientation samples, position samples were checked only for monotonicity, finiteness and source bounds. Starting with the actual Jupiter snapshot at `2026-11-02T12:30:00Z`, increasing Io sample 10's `jd_tdb` by `60/86400` while retaining its UTC timestamp passed validation. Hermite interpolation then moved the preceding segment's midpoint by **3.180452832615573 km**. This exceeded the advertised SPK interpolation threshold without changing any position/velocity payload or qualification declaration. A missing sample also allowed a segment wider than the declared sampling step.

Requested correction: compare each sample's UTC/TDB displacement with the snapshot reference, compare each adjacent UTC/TDB duration, enforce the declared maximum interval, and add failure regressions.

The science worker added those checks and regressions. Independent rerun: unmodified actual snapshot admitted; the +60-second TDB mutation and a removed sample producing a 1200-second gap were both rejected. **Closed.**

### SCI-2 — P2, corrected: the frontend ignored the claimed interpolation-error ceiling

Location: `frontend/src/features/systems/systemContracts.ts:20`, sampling admission.

Original behavior: setting the actual SPK snapshot's `sampling.max_position_error_km` to **1000** still passed validation, although the SPK producer rejects values at or above 0.1 km and the ordinary backend schema caps other sources at 1 km.

Requested correction: enforce the source-specific SPK ceiling `<0.1 km`, the existing general ceiling `<=1 km`, and regress boundary/error mutations.

The science worker added these checks. Independent rerun rejects the 1000-km mutation; the focused test suite also covers the SPK threshold. **Closed.**

Reproduction artifact: `output/playwright/solar-system-2.3/science-independent-review/contract-probes.ts`, using the unmodified actual `jupiter-snapshot.json` in the same directory. These are local review artifacts, not runtime files.

## Scientific checks

- **Physical centers and Sun chains:** satellite states subtract the physical parent's barycentric offset from the moon's offset. Sun direction is Sun-from-SSB minus planet-barycenter-from-SSB minus physical-parent-from-barycenter. The URA182 moon/parent segment uses explicit URA184 barycenter and DE441 Sun support; these dependencies are returned. Parent Horizons fixture vectors are the opposite sign of the renderer's parent-to-Sun lighting vector, and the comparison applies that sign explicitly. No barycenter is substituted for a physical parent.
- **Source identity and coverage:** runtime hashes the exact release manifest and all excerpts/PCK before opening; verifies expected center/target pairs, frame 1, type 2 and exact TDB bounds. A changed file invalidates the cached identity. SPK evaluation rejects nonfinite and out-of-domain epochs. Present-but-corrupt v3 data fails closed instead of silently selecting the older Horizons pack.
- **UTC/TDB and no extrapolation:** UTC is converted through the installed Skyfield timescale. Inclusive published UTC bounds are `2024-12-31T23:58:50.817Z` through `2029-12-31T23:58:50.816Z`, safely rounded inward from TDB `2460676.5` through `2462502.5`. Endpoint tests cover all five systems and reject one millisecond outside the advertised interval. Playback interpolates only inside the returned window; source vectors use km and km/s, while jplephem's daily derivatives are divided by 86400. Known leap transitions are clipped; future UTC depends on the installed leap table, as disclosed.
- **Independent Horizons provenance:** verified the hashes, lengths, target/center headers and all 57 parsed position/velocity states against the 19 original JSON responses under `/tmp/solar23-science/horizons/`. Recomputed physical-center residuals: maximum position difference **9.547214793945162e-7 km** (Neptune parent); maximum velocity difference **6.217248937900877e-15 km/s** (Io). These are agreement with the cited Horizons source, not independent observations.
- **Interpolation beyond the existing three probes:** independently evaluated 19 fractions per segment, at increments of 0.05, on every 600-second segment of all 19 Sun/moon tracks in the five four-day windows centered at `2026-11-02T12:30:00Z` (207,936 direct comparisons). Maximum difference **0.009644308743676706 km**, Phobos. This denser finite check does not establish a continuous bound or ephemeris accuracy.
- **Rotation correctness:** independently regenerated 63 fixture matrices using fresh CSPICE_N0067 calls in `/tmp/solar23-science/spice-venv`, loading the pinned modern PCK, legacy Phobos PCK, or source-label Deimos coefficients as appropriate. Maximum difference from the checked reference fixtures was **0**. Backend tests independently compare their evaluator to these matrices within `2e-10` per component and check proper orthogonal rotations.
- **Shape-frame registration:** Phobos uses `pds-gaskell-phobos-pck00006` / `IAU_PHOBOS`; Deimos uses `pds-thomas-deimos-label-v1` / `PDS_THOMAS_DEIMOS`, with exact source hashes. Modern PCK11 is not silently applied to these older meshes. Deimos TDB days follow the stated IAU/SPICE convention; the original label does not explicitly name the time scale. The frontend rejects mismatched legacy model IDs/source hashes.
- **Earth and Moon:** existing Earth ITRS is inverted into body-to-ICRF, with installed UT1/Delta-T and zero polar motion explicitly disclosed. Native Moon ME orientation retains its existing binary PCK/frame authority and priority; unavailable native orientation is omitted rather than replaced by generic IAU Moon. The position/orientation dynamical-fit distinction is disclosed.
- **Acquisition:** the standalone importer requires HTTP206 and exact Content-Range/length, reserves bounded reads before networking, rejects validator changes, and copies original type-2 records into a new/empty directory. It does not run on an API request or fit Kepler orbits. Original source files are not claimed fully hashed; exact excerpts and acquired ranges are hashed.

## Commands and results

From the recovery worktree:

```text
ORAS_PLANETARY_EPHEMERIS_DIR=/home/rocco/Astronomy-Hub/.worktrees/integration-main-20261005/data/runtime-packs/planetary-ephemeris/release ORAS_LUNAR_ORIENTATION_DIR=/home/rocco/Astronomy-Hub/.worktrees/r4-a-planet-view-1/data/runtime-packs/lunar-orientation/release /home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_satellite_spk_systems.py backend/tests/test_system_body_orientation.py backend/tests/test_system_spk_acquisition.py backend/tests/test_planetary_systems.py backend/tests/test_horizons_systems.py -q
115 passed in 12.24s

npm --prefix frontend test -- tests/systemOrientation.test.ts tests/planetarySystems.test.ts
Before correction: 24 passed. After correction: 27 passed, 2 test files.

frontend/node_modules/.bin/tsx output/playwright/solar-system-2.3/science-independent-review/contract-probes.ts
Before correction: +60s TDB and 1000-km error admitted.
After correction: time mismatch, error ceiling and 1200s sample gap all rejected.

npm --prefix frontend run typecheck
exit 0
```

Additional inline read-only Python probes used `/home/rocco/Astronomy-Hub/.venv/bin/python` for raw Horizons hash/CSV verification and dense Hermite comparisons, and `/tmp/solar23-science/spice-venv/bin/python` for fresh CSPICE transforms. No new upstream data was fetched. One initial provenance probe contained an unnecessary import of a nonexistent module and exited before verification; removing that import allowed the independent CSV/hash verification above to pass. No fixture or implementation was rewritten.

## Remaining qualification boundaries

Local source/model checks pass after the corrections. Docker/API integration with the mounted final release, actual renderer handedness/lighting, full product/browser tests, GPU behavior, and owner visual acceptance remain the parent task's responsibility. This review does not qualify NASA texture geography, physical accuracy of older shape rotations, measured Earth EOP, future leap seconds, or a continuous interpolation bound. Retain the raw-response and reference-generator evidence in the final evidence handoff. Recommended next task: parent runtime and browser integration checks against these exact corrected contracts and model IDs.
