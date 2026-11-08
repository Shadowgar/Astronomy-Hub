# Solar 2.3 validation receipt

Qualification applies to this bounded reconstruction, not approval of every historical change in draft PR107. All commands below ran from the recovery worktree. Local unit checks are supporting evidence; actual Docker/API and Windows graphics checks are recorded separately.

## Reproducible commands and observed results

```bash
npm run typecheck --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
docker build --target build -f frontend/Dockerfile.production -t astronomy-hub-solar23-build-proof .
docker run --rm --network none --entrypoint tar astronomy-hub-solar23-build-proof -C /app/dist -cf - . > output/playwright/solar-system-2.3/docker-dist-final.tar
```

Typecheck exit0; frontend **647 tests / 85 files passed**, 3.79s. Production build exit0, with the existing >500kB graphics-chunk warning retained. Docker build exit0. All **312 files** exported from the isolated Docker build match the local preview artifact byte-for-byte. This transient artifact-export container used no network, volumes or application runtime. The final source/bundle hashes are in `evidence/source-binding.json`.

Docker science exact commands, versions and warning analysis are in [SCIENCE.md](SCIENCE.md): **115 passed / 34 upstream warnings**. Strict `-W error` was **12 failed / 103 passed**; no warning suppression or warning-clean claim. The Skyfield shape-assignment deprecation becomes an exception under that policy; the installed Starlette exception path can additionally report an unclosed stream. A standalone reproduction establishes the external path. No ordinary-run stream warning was observed.

Source asset checks reuse valid author and independent receipts in [ASSETS.md](ASSETS.md) and [ASSET_INDEPENDENT_REVIEW.md](ASSET_INDEPENDENT_REVIEW.md): 6 new asset tests, 4 prior texture tests, 4 prior acquisition tests; deterministic offline reconstruction; exact30-file inventory and every source/derivative hash. Independent science includes57 raw Horizons vector comparisons,63 CSPICE matrices and207,936 interpolation samples; see its report for model/accuracy limits.

The opt-in Compose override was parsed with:

```bash
docker compose -f docker-compose.yml -f docker-compose.solar23.yml -f output/playwright/solar-system-2.3/compose-validation.yml config --quiet
```

Exit0. The final validation-only file resets the absent local frontend `env_file`; it is not production configuration and no Compose services were started by this command. The read-only candidate source mount is actually exercised by `pr107-solar23-backend`. Source packs remain outside the Docker image.

## Actual Windows graphics commands

`WIN_NODE='/mnt/c/Program Files/nodejs/node.exe'`; each script path/output argument is converted with `wslpath -w`. All use headed Microsoft Edge and explicitly require Windows; capture/benchmark receipts verify ANGLE/NVIDIA RTX3060. No SwiftShader substitution.

```bash
"$WIN_NODE" "$(wslpath -w "$PWD/scripts/validation/capture_solar23_baseline.mjs")" http://localhost:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.3/before")"
"$WIN_NODE" "$(wslpath -w "$PWD/scripts/validation/capture_solar23_candidate.mjs")" http://localhost:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.3/after-r2")"
"$WIN_NODE" "$(wslpath -w "$PWD/scripts/validation/capture_solar23_candidate.mjs")" http://localhost:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.3/after-mobile-saturn")" saturn-mobile
"$WIN_NODE" "$(wslpath -w "$PWD/scripts/validation/verify_solar23_lifecycle.mjs")" "$(wslpath -w "$PWD/output/playwright/solar-system-2.3/lifecycle-r2")"
"$WIN_NODE" "$(wslpath -w "$PWD/scripts/validation/verify_solar22_streaming.mjs")" http://localhost:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.3/solar-streaming")"
```

Baseline42 captures; final51 plus4 extra mobile Saturn/Titan captures, all settled with no asset/shader/browser errors. The current full candidate runner also includes the four extra views. Baseline original owner screenshots were unavailable: these are captures of the running rejected implementation at matched UTC and dimensions, not the owner's original image files. Each implementation chooses its own camera framing. Captured UTC is2026-10-27T04:00:00Z; dimensions1440×900,390×844,844×390.

Lifecycle **4 checks PASS**, errors[]: deferred shader preparation cancellation; Solar context loss during held preparation cannot revive the disposed scene; synchronous compile failure cleans up and retry creates one renderer; ready native Moon→ready Apollo17→ready Moon→system preserves UTC/camera and retires native frames.

Shared Solar streaming **6 cases PASS**, no page errors: overview/detail promotion; original-UV barrier; stale-selection cancellation;503-detail fallback; Earth quality/decode retirement; Eros/context retry. This reuses the affected Solar2.2 runner against the actual Solar2.3 bundle.

## Evidence discipline

Earlier failed source-window renewal, first candidate Saturn fallback, strict warning run, shader/camera fixes and incomplete GPU runs remain under ignored `output/playwright/solar-system-2.3/`. They are not counted as passes. Two Windows command processes exited143 without a JavaScript failure receipt; cause unestablished. Completed individual case receipts are retained, and remaining layouts are run separately. No inference of success from a partially written overall receipt.

A prior benchmark asserted that WebGL-uploaded geometry counts cannot increase while orbiting. That incorrectly rejects first visibility/upload of already-owned offscreen bodies. Final checks require stable owned scene/resource/reservation counts, bound uploaded geometry by those owners plus compositor quads, and independently prove retirement after scene teardown.

Owner visual acceptance, physical iPhone and inherited whole-PR source-offer/build-release qualifications remain open. No merge, production deploy, source archive publication or protected-data change.

## Final navigation and visual package

```bash
"$WIN_NODE" "$(wslpath -w "$PWD/scripts/validation/verify_solar23_journeys.mjs")" http://localhost:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.3/journeys-final")"
"$WIN_NODE" "$(wslpath -w "$PWD/scripts/validation/verify_solar23_journeys.mjs")" http://localhost:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.3/journeys-portrait-final")" 390
"$WIN_NODE" "$(wslpath -w "$PWD/scripts/validation/verify_solar23_journeys.mjs")" http://localhost:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.3/journeys-landscape-final")" 844
python3 scripts/validation/build_solar23_gallery.py --before output/playwright/solar-system-2.3/before --after output/playwright/solar-system-2.3/after-r2 --journeys output/playwright/solar-system-2.3/journeys-qualified --output docs/validation/solar-system-2.3/gallery
```

**27 checks PASS**,9 per completed desktop/portrait/landscape case, errors[]. The first combined process completed desktop then exited143 duringportrait; its overall RUNNING receipt is retained as incomplete. Portrait and landscape commands each exited0 with overall PASS. `evidence/journeys.json.gz` explicitly aggregates only these three completed cases. The three videos are original bytes from those completed cases; the unfinished portrait video is excluded.

Checks: Solar→Jupiter disposal; parent and four Galilean physical approaches; Free→Focus UI synchronization; forward source-window renewal beyond three days without renderer replacement; reverse/follow; advanced-epoch Solar return preserving camera offset; Saturn rings/Titan/Enceladus; actual context loss/retry; ready native Moon round trip retaining camera/time/quality/navigation; keyboard overview/orbit/zoom. Some grouped checks exercise multiple related actions;9 is the harness group count, not a count of all assertions.

The [static owner gallery](gallery/index.html) contains matched before/after overviews for all six systems at all three sizes, matched major-moon closeups where the baseline exists, all55 final images and three actual journey recordings. It uses safe static HTML, no script or DOM-derived URL interpretation. Original PNG/video bytes are copied unchanged. Private served URL: `http://localhost:4231/owner-review/solar23-gallery/index.html`.

Final private HTTP identity check: all312 production output files and all95 gallery files fetched successfully with exact SHA-256 equality. Static gallery browser checks pass at1440×900,390×844 and844×390: no horizontal overflow or page errors,91 images,3 videos,0scripts. Preserved145 prior container IDs and90 volume names; only newpersistent task resource is the isolated read-only backend. Existing local main (`bb28aec7`) was not moved; PRbase/origin/main remains `9a03d8260a529f5858c5c3298cbb9d32b721daeb`. No native Sky/Earth/Moon source or protected owner settings were edited.

Final staging caught one extra blank line at EOF in the new celestial asset adapter (untracked files were absent from earlier unstaged whitespace checks). It was removed; no functional code changed. The production Docker build was repeated for exact final input/artifact identity; existing visual/runtime proof remains applicable to identical emitted bytes.
