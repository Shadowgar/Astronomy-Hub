# Bounded satellite navigation and recovery evidence

The actual Chromium run passed **22/22 navigation checkpoints** on the Docker task preview at `http://127.0.0.1:4226`. This is not a warning-clean, physical-device, fresh-orbit or owner-acceptance result. No product code, container configuration, protected data or unrelated stack was changed by this validation subtask.

Branch `sky-satellite-live-repair-1`; checked-out base `9ee6d85982edb3db276490706a82af83538e5e8d`; no commit/push/PR operation. Run UTC `2026-10-25T04:26:59.268Z` through `2026-10-25T04:28:30.857Z`. Desktop viewport1440×900, headless Chromium/SwiftShader, reduced motion.

## Context and scope

Loaded current top180 lines of `docs/context/CORE_CONTEXT.md` and `docs/context/LIVE_SESSION_BRIEF.md`; the existing `docs/validation/sky-satellite-live/loaded-documents.json` inventory; full `docs/validation/SYSTEM_VALIDATION_SPEC.md` and `docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md`; and the explicitly supplied owner attachment `/home/rocco/.codex/attachments/0b000802-b699-4e00-9379-0ac835f0a65f/Pasted text.txt` first200 lines. This continues the already-established frontend_change/backend_change/validation/review/debug packs. No additional repository document pack or broad docs scan. The older2026-10-21 scope preambles are historical relative to the explicit2026-10-24 satellite directive in CORE/LIVE and the attachment. Playwright and verification-before-completion skills were read.

## Exact execution

From the isolated worktree, using `/bin/bash`, login disabled, approved process escalation because the normal launcher was unavailable:

```sh
/home/rocco/.nvm/versions/node/v22.22.0/bin/node --check output/sky-satellite-live/time-audit/navigation-recovery.mjs
/home/rocco/.nvm/versions/node/v22.22.0/bin/node output/sky-satellite-live/time-audit/navigation-recovery.mjs > output/sky-satellite-live/time-audit/navigation-finish/run.log 2>&1
```

Both exited0. The complete actual log is `run.log`; measured state, command/reply envelopes, request failures and source hashes are in `navigation-recovery-proof.json`. `summary.json` records the reviewed counts and limitations. The exact executed harness is preserved as `successful-harness.mjs`; its imports remain relative to the original `time-audit/navigation-recovery.mjs` execution location.

Read-only runtime preflight:

```sh
docker ps --filter name=oras-satellite-live --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'
curl --max-time 5 -sS http://127.0.0.1:4226/oras-sky-engine/oras-runtime-build.json
```

Both task containers were Up. No container was started/stopped by this subtask. Served Sky marker was `c8edee7e59ec889c07abb8f5fd870dc3d4b8d724aca151ec464f372531793dbf`. Served Hub asset `/assets/index-BGMWxqs2.js` SHA256 `04fb9c5c7a8aa4ee3c12780d68f55ccf5e1d5d15453ea45868de47abab3aad9f` exactly matched the local built asset bytes. All9 recorded application source hashes remained unchanged during the run and matched again during report generation. Sky identity here is the served build marker plus source hash chain; it is not a new full-byte artifact audit.

## Results

Real mouse-wheel input needed33 packets from120° to4.793883850419292°; automatic native hints were then true with native satellite rendering still enabled. Six outward packets reached8.609126638959708°, and six inward packets returned4.793883850419292°. The existing5°/7° policy was not modified. This run exercises close enablement and explicit disable across zoom, not an independent hysteresis-boundary qualification. No point pixels, object eligibility or current orbital accuracy are inferred from this policy/navigation run; those belong to the separate native-motion evidence.

Setting native `hints_visible=false`, immediately calling `presentation(false)`, then `presentation(true)` observed false/false/false. Hints remained false across real outward/inward zoom in that same runtime. The compact embedded tools have no satellite-hint checkbox, so this one preference operation used the existing native public property. On Sky remount at4.793883850419292°, hints were true again: persistent cross-remount hint preference is not implemented and is not claimed.

Every Sky checkpoint retained effective native UTC `2026-06-04T02:58:00.000Z` and `core.time_speed=0`. Sky↔Earth, Sky↔Solar, Earth–Moon system→Sky, native Moon→Sky, and actual browser Back/Forward/Reload all completed. Native Moon screenshot was visually inspected and shows the qualified Moon globe rather than an error/loading panel; this is representative browser evidence, not owner visual acceptance.

| Checkpoint | Mode | Heavy surfaces | Prior frames checked detached |
| --- | --- | --- | --- |
| initial-sky | sky | 1 | 0 |
| close-auto-hints | sky | 1 | 0 |
| native-hints-disabled | sky | 1 | 0 |
| hints-disabled-wide | sky | 1 | 0 |
| hints-disabled-close | sky | 1 | 0 |
| sky-earth | earth | 1 | 1 |
| earth-sky | sky | 1 | 1 |
| back-earth | earth | 1 | 1 |
| forward-sky | sky | 1 | 1 |
| reload-sky | sky | 1 | 1 |
| sky-solar | solar | 1 | 1 |
| solar-sky | sky | 1 | 0 |
| sky-solar-for-hierarchy | solar | 1 | 1 |
| solar-earth-system | system | 1 | 0 |
| earth-system-moon-selected | system | 1 | 0 |
| earth-moon-system-sky | sky | 1 | 0 |
| back-earth-moon-system | system | 1 | 1 |
| native-moon | planet | 1 | 0 |
| native-moon-sky | sky | 1 | 1 |
| back-native-moon | planet | 1 | 1 |
| forward-sky-from-moon | sky | 1 | 1 |
| final-reload-sky | sky | 1 | 1 |

All22 checkpoints contained exactly one heavy surface (native iframe or Solar/system canvas). All12 explicitly checked prior iframes were detached. Before final browser close the event log contains13 attachments/12 detachments, leaving the final Sky active. The bridge captured239 records, including8 destroy commands and4 successful destroy result envelopes. There are0 observed non-OK replies and0 uncaught pageerrors; **not every destroy acknowledgement was observed**, and DOM detachment does not prove physical GPU allocation disposal. Final browser close completed.

## Recorded limits and warnings

The run recorded59 HTTP404 responses:58 dense-star Norder3 `.eph` tile paths and1 DSS Norder5 `.webp` tile. All exact paths remain in proof JSON. There were17 `net::ERR_ABORTED` requests (15 local,2 CelesTrak), and4 SwiftShader ReadPixels/GPU-stall warnings. No warning-clean claim. No provider/source troubleshooting or retry loop was performed.

The native requestAnimationFrame sample covered30 intervals over1216.6ms: median33.4ms, p95/max50.1ms on ANGLE SwiftShader. This measures bounded software-rendering cadence only; no FPS budget or hardware performance gate is passed.

Earth round-trip observer values differed slightly: latitude41.3219030000159→41.3219015393746 and longitude-79.58539400000345→-79.58539410405257 in native Sky records. The change is sub-meter in magnitude; exact coordinate equality and its cause were not investigated by this bounded navigation subtask. Elevation remained432.816m.

Current native TLE freshness remains outside this historical navigation proof. Existing tracking A→B RED/GREEN evidence was retained unchanged. Owner functional/visual acceptance and physical-device qualification remain open.

## Prior failures retained

The earlier startup-timeout proof remains `../navigation-initial-runtime-unavailable-proof.json`; its cause is not established here. The previous30-notch failure report/log/screenshot remain unchanged at `../navigation-recovery-proof.json`, `../navigation-recovery-diagnostic.log`, and `../navigation-recovery-failure.png`; its saved DOM displays FOV7.1°. The exact prior harness was saved as `../navigation-recovery-30-notch-preserved.mjs` before editing. The narrow correction was action count30→100, not a readiness-deadline increase (still90000ms). Fresh success at33 packets establishes the old action cap was insufficient for this route.

Changed artifacts are only the output harness, its preserved copy, this new report/summary/hash manifest, actual browser log/proof, and22 screenshot files in this directory. Recommended next task: incorporate this bounded result and warning/persistence limits into the satellite handoff; preserve owner acceptance, current TLE freshness and physical-device gates.
