# Bounded visual pilot source release

Default Mode; branch `sky-satellite-visual-pilot-1`; uncommitted changes. No push/PR.

Context inspected: CORE_CONTEXT, LIVE_SESSION_BRIEF, CONTEXT_MANIFEST backend_change/validation entries, existing sky-satellite-live loaded-documents inventory and README, SYSTEM_VALIDATION_SPEC and UNIFIED_UNIVERSE_ARCHITECTURE applicable excerpts, backend AGENTS, owner attachment directive. Parent owns the complete task pack and plan. No broad docs scan. TDD and verification-before-completion skills applied. No prior memory used.

## Exact owned source changes

- `scripts/skydata/build_visual_satellite_pilot.py` (new)
- `backend/tests/test_satellite_visual_pilot.py` (new)
- `backend/app/services/satellite_feed_status_service.py`

The existing full-catalog builder and minimum1000 are untouched. Pilot admission requires exact ORAS_SATELLITE_RELEASE_PROFILE=visual_satellite_pilot.v1, canonical feed/manifest filenames in one directory, complete pinned source artifacts and native baseline. An existing low-count fixture override alone does not authorize the profile. Snapshot keys include profile configuration and all retained artifact identities.

The validator checks retained visual.tle against pinned Git revision/SHA256, checks the entire published SHA256SUMS against its pinned digest, reparses every original checksum pair, checks155unique identities/required ISS,HST,Tiangong/epochs at acquisition, regenerates complete native records and baseline standard-magnitude joins, and verifies actual feed records and all manifest claims. Replacing feed bytes and updating the feed hash alone cannot authorize modified source values, identities, magnitudes or provenance.

Photometry correction: actual first generated pilot omitted protected NORAD19120mag2.7, causing native default7.0. `RED-existing-pilot-photometry.txt` proves this against that actual old f2fae775 artifact. The final release preserves133existing native standard magnitudes by canonical NORAD + original TLE international designator;22have no retained magnitude and keep the native default behavior. No live brightness claim. Baseline is retained only in ignored release output, verified against431592eb..., and never used for orbital epochs. Original fresh source TLE values are unchanged.

## Commands and results

`/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest -q backend/tests/test_satellite_visual_pilot.py`

- Initial RED:24failed, missing pilot module,1.22s (`RED.txt`).
- Malformed-manifest RED:4failed28passed,1.71s (`RED-malformed-manifest.txt`).
- Photometry API RED:35failed, new baseline API absent,1.37s (`RED-photometry.txt`). This proves only the absent API. The separate actual-artifact RED proves the underlying data loss.
- Final GREEN:35passed,15.09s, no warnings (`GREEN.txt`, `GREEN-photometry.txt`).

`/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest -q backend/tests/test_satellite_visual_pilot.py backend/tests/test_satellite_tle_release_pipeline.py backend/tests/test_satellite_feed_api.py backend/tests/test_satellite_tle_deployment.py`

- INCOMPLETE: local run stalled after37dots without a summary, interrupted with Ctrl-C/exit130. `INTERRUPTED-broader-local.txt` retains the partial output. No success claim for this run. No broad rerun or investigation; parent performs authoritative Docker qualification.

`/home/rocco/Astronomy-Hub/.venv/bin/python -m scripts.skydata.build_visual_satellite_pilot --input output/satellite-visual-pilot/visual.tle --source-manifest output/satellite-visual-pilot/SHA256SUMS --native-baseline frontend/public/oras-sky-engine/skydata/tle_satellite.jsonl.gz --output output/satellite-visual-pilot/release --release-version visual-pilot-20261025-38a1426 --acquired-at 2026-10-25T06:33:11.804049Z`

PASS exit0: `VISUAL_SATELLITE_PILOT_OK profile=visual_satellite_pilot.v1 release=visual-pilot-20261025-38a1426 records=155 sha256=aab1a4c21ab7abe310125ce70fe081854bd8f2e50257073f8881149fc1d5a224`.

`/home/rocco/Astronomy-Hub/.venv/bin/python -m scripts.skydata.build_visual_satellite_pilot --output output/satellite-visual-pilot/release --validate-only`

PASS exit0, identical release/count/hash output.

Direct service/offline preservation script (`status-and-preservation.json`): default profile rejected; explicit pilot ready155fresh at2026-10-25T08:00Z; same retained elements degrade155stale at2026-11-10T08:00Z. Original native file SHA256 remains431592eb5ec6db56d79c26792853f3fafe36ddf76c98834d9ddb36ddc0846436. Actual rebuilt artifact standard magnitudes19120=2.7,12904=4.2,ISS=-1.3,00694=2.7; unknown69591mag omitted (`GREEN-existing-pilot-photometry.txt`).

`git diff --check`: PASS exit0/no output.
`git branch --show-current`: `sky-satellite-visual-pilot-1`.
`git status --short`: owned files above plus parent-owned context/UI/report changes; no unrelated edits by this agent.

## Remaining gates

Source/UI/runtime admission is limited to the155-object pilot. Whole-file first-party authentication is explicitly false; ISS-only official cross-check is not generalized. Six-digit TLE identities unsupported. Baseline magnitudes are existing standard magnitudes, not observed current brightness. Runtime/browser/motion/independent trajectory/viewport/Windows/owner acceptance and final exact-head review are handled by parent and are not claimed here. No Docker commands, source downloads, container changes, promotion, commit or deployment by this agent.

Recommended next task: mount the entire corrected release read-only into the isolated backend preview, mount its exact feed into contained native Sky, enable the explicit profile, then qualify runtime motion and owner functional review.

## Docker-discovered public artifact permissions correction

Parent Docker proof found backend/nginx service users could not read pilot files because the reused atomic writer produced0600 files. Added focused regression `test_public_release_artifacts_are_readable_by_backend_and_nginx_workers`, then changed only the new pilot publisher to chmod each of its five public release artifacts0644. The existing full-catalog builder remains unchanged.

Exact focused command:

`/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest -q backend/tests/test_satellite_visual_pilot.py -k public_release_artifacts`

RED:1failed,35deselected,1.21s (`RED-permissions.txt`), actual mode0600. GREEN:1passed,35deselected,1.07s (`GREEN-permissions.txt`), all five files0644 and source/baseline/feed digests preserved. No broad suite rerun.

Reran the build command above unchanged: exit0,155records, SAMEfeedSHA256aab1a4c21ab7abe310125ce70fe081854bd8f2e50257073f8881149fc1d5a224 (`build-permissions.txt`). `stat -c '%a %n' output/satellite-visual-pilot/release/*` showed0644 for SHA256SUMS,baseline-native-feed.jsonl.gz,manifest.json,tle_satellite.jsonl.gz,visual.tle. `git diff --check`:exit0/no output. Parent owns Docker/backend/native read revalidation after this rebuild; no runtime success claim here.

## Native-discovered zero-padded NORAD alias correction

Parent native qualification found14objects whose raw TLE NORAD fields are zero-padded could not resolve canonical aliases (e.g NORAD694 versus NORAD00694). The pilot source-normalization step now canonicalizes only model_data.source_id and NORAD metadata aliases. All original TLE fields, NAME/COSPAR aliases and numerical NORAD interpretations remain unchanged. Generic/full-catalog importer untouched. Manifest discloses this metadata normalization.

Focused command: `/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest -q backend/tests/test_satellite_visual_pilot.py -k pilot_canonical_norad_alias`.

RED:1failed36deselected,1.19s, actual00694 versus required694 (`RED-canonical-identity.txt`). GREEN:1passed36deselected,1.05s (`GREEN-canonical-identity.txt`), including canonical lookup alias, retained NAME/COSPAR aliases and exact original zero-padded TLE lines.

Reran unchanged build command: exit0,155records, updated feed SHA256**9f063125517b9a6cc990159009ec7e46b764dc6dd14afc7a4b44a651e5920185** (`build-canonical-identity.txt`). This supersedes the aab1a4 feed hash above. Independent actual-artifact validation confirmed155canonical IDs+aliases,155exact original TLE pairs, all artifact modes0644 and original protected native SHA unchanged (`canonical-identity-audit.json`). `git diff --check`:exit0/no output. Parent owns the fresh native/browser and Docker requalification.
