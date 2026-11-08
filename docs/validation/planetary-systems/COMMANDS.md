# PS1 commands and evidence

Worktree: `/home/rocco/Astronomy-Hub/.worktrees/ps1-earth-moon-system-1`.
Node22.22.0 host, pinned Node24.14.0 offline container, existing Python environment.
All preview actions concern only `oras-ps1-backend` and `oras-ps1-preview`.

```sh
docker exec -w /work oras-ps1-backend python -m pytest backend/tests/test_planetary_systems.py backend/tests/test_planet_view.py backend/tests/test_solar_exploration.py -q -o cache_dir=/tmp/ps1-pytest-cache
npm --prefix frontend test
npm --prefix frontend run typecheck
npm --prefix frontend test -- tests/systemPlayback.test.ts
npm --prefix frontend test -- tests/planetContracts.test.ts
npm --prefix frontend run build -- --outDir ../output/planetary-systems/hub --emptyOutDir
npm --prefix frontend run build -- --outDir ../output/planetary-systems/hub-repeat --emptyOutDir
```

Docker combined science:47passed,7 inherited warnings. Frontend365passed/57files
at the final recorded source; typecheck passed. Playback6test and lunar
contract7test red/green logs retain the specific seconds/ms and fractional-UTC fixes.
Final post-review command identities/results belong in the final receipt.

```sh
PS_VIEWPORT=1440x900 PS_OUT=output/planetary-systems/browser-desktop-history-trace2 node scripts/validation/verify_planetary_systems.mjs
PS_VIEWPORT=390x900 PS_OUT=output/planetary-systems/browser-portrait-qualified node scripts/validation/verify_planetary_systems.mjs
PS_VIEWPORT=667x390 PS_OUT=output/planetary-systems/browser-landscape-qualified node scripts/validation/verify_planetary_systems.mjs
PS_REVIEW_OUT=output/planetary-systems/review-delivery node scripts/validation/verify_ps1_review_fixes.mjs
node scripts/validation/verify_ps1_resilience.mjs
node scripts/validation/measure_planetary_systems.mjs
```

Observed: desktop8groups, portrait7groups, short-landscape7groups passed in named
runs. Review regressions7/7; resilience9/9. Earlier desktop runs lost saved Solar
return history during reload; the pending bookmark writer was subsequently guarded
against document navigation. Original failure receipts remain distinct. Source hashes in each proof distinguish earlier/current results.

Performance: software SwiftShader, three loaded textures, zero extra idle renders
in each500ms paused sample. During ~1second playback:44.1Hz desktop,58.6Hz portrait,
45.3Hz short landscape; CPU submission median0.4–0.5ms. These short observations
are not physical GPU timing, sustained load qualification or owner-device acceptance.

## Reproducibility

Keep the absolute source path identical inside the container. Relocating it to
`/work` changed Rolldown dependency traversal and CSS preload order in the entry
chunk. Two host and two same-path container trials matched; an altered-path trial
reproduced the difference. No CSS ordering workaround or dependency change was made.

```sh
docker run --rm --network none --user 1001:1001 \
  --mount type=bind,src=/home/rocco/Astronomy-Hub,dst=/home/rocco/Astronomy-Hub,readonly \
  --mount type=bind,src=/home/rocco/Astronomy-Hub/.worktrees/ps1-earth-moon-system-1/output/planetary-systems/hub-container,dst=/output \
  --tmpfs /home/rocco/Astronomy-Hub/frontend/node_modules/.vite-temp:uid=1001,gid=1001 \
  --workdir /home/rocco/Astronomy-Hub/.worktrees/ps1-earth-moon-system-1/frontend \
  node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 \
  npm run build -- --outDir /output --emptyOutDir
python3 scripts/validation/verify_ps1_delivery.py --candidate
# After commit, verify exact committed source:
python3 scripts/validation/verify_ps1_delivery.py
```

Candidate identity verification passed:142 Hub files across three builds/served
bytes,4 unchanged native Planet View files,514 unchanged Earth files,111 pinned
Sky files. Original lunar TIFF/PNG, renderer source pins, original scene/material
sources and readonly mounts are verified by the receipt. No database-byte snapshot
or volume mutation is claimed. Existing bundle-size warnings remain visible.

```powershell
(Invoke-WebRequest -UseBasicParsing -TimeoutSec 15 "http://172.26.23.204:4223/solar-system").StatusCode
```

Windows host result200. The owner's primary checkout retains only its preexisting
`.vscode/settings.json` modification. PR92 remains the preserved dependency base.

## Reload race negative control

```sh
PS_URL=http://127.0.0.1:4223 PS_HISTORY_CASE=3 PS_HISTORY_DISABLE_GUARD=1 PS_HISTORY_ARM_CAMERA=1 PS_HISTORY_OUT=output/planetary-systems/reload-history-negative-armed node scripts/validation/inspect_ps1_reload_history.mjs
PS_URL=http://127.0.0.1:4223 PS_HISTORY_CASE=3 PS_HISTORY_ARM_CAMERA=1 PS_HISTORY_OUT=output/planetary-systems/reload-history-guarded-armed node scripts/validation/inspect_ps1_reload_history.mjs
```

Exact environment variable names are defined in the versioned script. The negative
control deliberately disables the top-document unload guard and delays unchanged
HTML350ms: bookmark replaceState at+243ms loses parent history. With the guard
enabled, no write occurs during reload; parent history and ready renderer survive.
Both use the same source, bytes and loopback origin. Earlier intercepted LAN HTML
caused Chromium PNA asset blocking; those blank-app results are fixture limitations.

Raw official HTML and captured terminal receipts retain their original bytes. Exact-file `.gitattributes` entries exclude only their captured whitespace from Git whitespace checks; application source remains checked.

Review correction: `node scripts/validation/verify_ps1_epoch_history.mjs` (zero camera discrepancy), `npm --prefix frontend test -- --run` (365 passed), `PS_OUT=output/planetary-systems/history-journeys node scripts/validation/verify_planetary_systems.mjs` (8+7+7 groups passed). Repeated and pinned-container build commands above were rerun; `python3 scripts/validation/verify_ps1_delivery.py --candidate` passed.
