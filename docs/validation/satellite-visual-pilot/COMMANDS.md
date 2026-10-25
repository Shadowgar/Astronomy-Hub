# Commands and observed results

Working directory: `/home/rocco/Astronomy-Hub/.worktrees/sky-satellite-visual-pilot-1`.
Node: `/home/rocco/.nvm/versions/node/v22.22.0/bin/node`.
Python: `/home/rocco/Astronomy-Hub/.venv/bin/python`.

## Source acquisition and independent admission

GitHub connector `fetch_file(repository_full_name="caelo-works/tle-mirror", ref="38a142645e7814b538daaf5868b814550e1f0dda", path="tle/visual.tle", encoding="base64")`; pinned SHA256SUMS, README/workflow/tree/commit/run/job reads. Original bytes decoded once into ignored staging; no moving-main request, CelesTrak dataset retry, workflow-code adoption or production promotion. Standard-library independent checks recomputed SHA256/Gitblob, every TLE checksum/identity/epoch and existing importer count;155fresh/valid/unique. Official CelesTrak ISS text cross-check matches that record only. Source rights and run evidence: [assessment](SOURCE_RIGHTS.md).

```sh
/home/rocco/Astronomy-Hub/.venv/bin/python -m scripts.skydata.build_visual_satellite_pilot --input output/satellite-visual-pilot/visual.tle --source-manifest output/satellite-visual-pilot/SHA256SUMS --native-baseline /home/rocco/Astronomy-Hub/frontend/public/oras-sky-engine/skydata/tle_satellite.jsonl.gz --output output/satellite-visual-pilot/release --release-version visual-pilot-20261025-38a1426 --acquired-at 2026-10-25T06:33:11.804049Z
/home/rocco/Astronomy-Hub/.venv/bin/python -m scripts.skydata.build_visual_satellite_pilot --output output/satellite-visual-pilot/release --validate-only
/home/rocco/Astronomy-Hub/.venv/bin/python scripts/validation/start_satellite_visual_pilot_preview.py
```

Both build/validation exit0; native feed155records, SHA2569f063125517b9a6cc990159009ec7e46b764dc6dd14afc7a4b44a651e5920185. Initial system `python3` launcher lacked existingSQLAlchemy; using the installed project venv qualified it without dependency installation. Only task network and two read-only preview containers were created. Pilot backend was restarted to load actual source corrections; original containers were not restarted or changed.

## Tests, RED/GREEN and Docker authority

```sh
PATH=/home/rocco/.nvm/versions/node/v22.22.0/bin:$PATH npm --prefix frontend test
PATH=/home/rocco/.nvm/versions/node/v22.22.0/bin:$PATH npm --prefix frontend run type-check
/home/rocco/.nvm/versions/node/v22.22.0/bin/node --test tests/runtime/satellite-presentation.test.mjs tests/runtime/satellite-tracking.test.mjs
docker run --rm --network none --read-only --tmpfs /tmp -e PYTHONDONTWRITEBYTECODE=1 -v "$PWD:/work:ro" -w /work --entrypoint python sha256:00e343c5943ae02f94c5312d17fec4ab6c5aaa2376d27ce9ff2486793dc15c6a -m pytest backend/tests/test_satellite_visual_pilot.py backend/tests/test_satellite_norad_search.py backend/tests/test_satellite_feed_api.py backend/tests/test_satellite_propagation_service.py backend/tests/test_satellite_tle_catalog.py backend/tests/test_satellite_tle_release_pipeline.py backend/tests/test_satellite_tle_deployment.py backend/tests/test_gaia_sky_catalog.py -q -p no:cacheprovider
```

Observed:388frontend tests/58files pass; TypeScript exit0;19native tests pass;108Docker tests pass,4 inherited anyio/httpx deprecation warnings. No warning suppression or warning-clean claim. The earlier broad localAPI test command was interrupted after37dots and is not counted as passing. Focused source publisher/identity/photometry/permissions, exactNORAD lookup and UI coverage/rejected-provenance tests retain actual RED/GREEN in evidence. [Source worker commands](evidence/release-agent/REPORT.md).

## Reproducible host builds and browser proof

```sh
PATH=/home/rocco/.nvm/versions/node/v22.22.0/bin:$PATH npm --prefix frontend run build -- --outDir ../output/satellite-visual-pilot/hub --emptyOutDir
PATH=/home/rocco/.nvm/versions/node/v22.22.0/bin:$PATH npm --prefix frontend run build -- --outDir ../output/satellite-visual-pilot/hub-repeat --emptyOutDir
docker run --rm --network none --user 1001:1001 -v /home/rocco/Astronomy-Hub:/home/rocco/Astronomy-Hub:ro -v "$PWD/output/satellite-visual-pilot/vite-temp:/home/rocco/Astronomy-Hub/frontend/node_modules/.vite-temp" -v "$PWD/output/satellite-visual-pilot/hub-container:$PWD/output/satellite-visual-pilot/hub-container" -w "$PWD" node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 npm --prefix frontend run build -- --outDir ../output/satellite-visual-pilot/hub-container --emptyOutDir
SV_OUT=output/satellite-visual-pilot/browser-qualified /home/rocco/.nvm/versions/node/v22.22.0/bin/node scripts/validation/verify_satellite_visual_pilot.mjs
/home/rocco/.nvm/versions/node/v22.22.0/bin/node scripts/validation/verify_satellite_visual_pilot_navigation.mjs
/home/rocco/Astronomy-Hub/.venv/bin/python output/satellite-visual-pilot/independent-motion/compare_motion.py --proof output/satellite-visual-pilot/browser-qualified/proof.json
python3 scripts/validation/verify_satellite_visual_pilot_delivery.py --candidate
```

142Hub payload files match host/repeat/pinned-Docker builds.111nativeSky artifact files remain at PR101 byte identities. No native-engine build. Browser3viewports×5groups pass; final navigation16checkpoints pass. Actual native-canvas video decodes1440×900,7.878607seconds. Candidate verifier: all10checksPASS, overallPARTIAL only because source is not yet committed; final invocation without `--candidate` must bind committed source. Existing Vite chunk-size warnings remain.

One combined shell ended143 after nativePASS and9/16navigation steps; causeunknown. The unmodified standalone navigation command then completed16/16. Receipts preserve both. No application deadline was increased. Exact source/hash evidence is reused only at unchanged identities; June historical proof is not used to qualify this fresh pilot.

## Windows, identity and stop gate

```sh
powershell.exe -NoProfile -NonInteractive -Command 'try { $r=Invoke-WebRequest -UseBasicParsing -Uri "http://172.26.23.204:4227/sky-engine" -TimeoutSec 15; Write-Output ("WINDOWS_HTTP_STATUS="+$r.StatusCode); Write-Output ("WINDOWS_BYTES="+$r.RawContentLength) } catch { Write-Output $_.Exception.Message; exit 1 }'
python3 scripts/validation/verify_satellite_visual_pilot_delivery.py
git status --short
git diff --check
git log --oneline -5
```

WindowsHTTP200/410bytes. Final committed/local/remote HEAD and independent exact-HEAD review are recorded in the draft PR conversation. Owner functional and physical-device acceptance remain open. No merge, production promotion or deployment.

Evidence copies retain original screenshot/video/JSON bytes. Text log copies may remove CRLF/trailing whitespace for repository hygiene; [copy map](evidence/artifact-copy-map.json) records original and versioned hashes, and raw output remains in ignored local output.

Independent helper scripts and original GP input are retained under evidence. Their relative paths describe the original ignored output execution locations above; restore those locations before rerunning the unmodified scripts. No script output is relabeled as a new run.

The exact padded original visual.tle and published SHA256SUMS are also retained in evidence/visual-source.zip. Extraction preserves their original bytes and hashes; the archive avoids treating fixed-width source-name padding as source-code whitespace. The protected original dataset was not changed.
