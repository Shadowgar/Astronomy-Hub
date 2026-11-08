# Solar current-time contract correction — PR88 follow-up

Owner reported `Invalid Solar source/frame contract` after the preview became reachable from Windows. Baseline: `eca9fdf6d890be5ac074df5e681164b29ac0a7b8`, branch `cinematic-hub-integration-1`. Owner visual acceptance remains pending. No merge, deployment, provider or R4 change.

## Proven cause and fix

Fresh `/solar-system` entry uses JavaScript current UTC, normally with milliseconds. The real Docker API returns `.123Z` as Python `.123000Z`. The frontend source validator required at most three fractional digits and rejected the otherwise valid nine-body/ICRF/JPL response. Earlier browser journeys used whole-second URLs and did not cover this entry. HTTP200 alone did not prove scene rendering.

The narrow correction removes exactly three trailing zero digits from a six-digit snapshot fraction before validating and returning the timestamp. `.123000Z` becomes `.123Z` with the identical instant. The raw response, source metadata and body/vector arrays remain unchanged. Meaningful submillisecond precision and malformed dates remain rejected. Shared time parsing, backend ephemeris evaluation, source vectors, renderers/materials/camera, original assets, settings, scientific data, native artifacts and external pins are unchanged.

A focused unit red reproduced the same source/frame error (1failed/12passed). Green passes18tests across the contract and product-state files; full frontend323/49files and TypeScript pass. Browser red used a controlled client clock and the actual unmocked Docker API:200/nine bodies, followed by the visible contract error. Final browser green passes8cases: desktop1440×900 and mobile390×900, each with no-date controlled current time, explicit milliseconds, historical whole seconds and uncontrolled real current time. Each asserts ready rendering, original source instant/nine bodies, both NASA textures/cloud readiness, real Earth camera source target, selection and reload epoch retention. These Chromium/SwiftShader cases are representative; they do not grant owner-device or visual acceptance.

## Runtime and access

[Owner preview](http://172.26.23.204:4218/solar-system). Windows localhost-to-WSL forwarding remains unavailable; the current private WSL address is session-specific. The first Python relay was absent at the next turn. It is replaced by task-owned `oras-cinematic-windows-preview-relay`, using the already available nginx image and binding only172.26.23.204:4218, forwarding to the unchanged Docker preview127.0.0.1:4217. Its exact configuration is archived. No unrelated service was restarted. Windows page/asset/API HTTP checks pass; actual rendering is verified separately by browser assertions.

Three new Hub builds (two host, one pinned offline Docker) match136files, artifact `3e6a9acc664b460cf73458792bd21f178a7068ab227d897f6b72a07b29113034`. All136served files match on both routes. Earth `43e822e52ffe01bc7591579e329ce0fb5aed5a521ffb9cd47808173f8beb03d3` and Sky `b1dbd0f039ccf4ed4c0a669baf5bd7288b1ea07c9db98e199c04949431a644fb` are unchanged. Prior Hub builds remain in `hub-second`/`hub-docker`; prior committed evidence is retained without rewriting. Preservation again confirms117original container states/mounts,90volumes, owner settings/kernel/pins/original assets/rollback.

## Commands and receipts

Commands below ran from the existing integration worktree. Raw terminal logs are stored losslessly as JSON strings with original byte hashes.

```bash
npm --prefix frontend test -- tests/solarContracts.test.ts
npm --prefix frontend test -- tests/solarContracts.test.ts tests/runtimeProductState.test.ts
npm --prefix frontend test
npm --prefix frontend run typecheck
SOLAR_OUT=output/cinematic-acceptance/current-time-contract/browser-red node scripts/validation/verify_solar_epoch_precision.mjs
SOLAR_OUT=output/cinematic-acceptance/current-time-contract/browser-final timeout 180s node scripts/validation/verify_solar_epoch_precision.mjs
npm --prefix frontend run build -- --emptyOutDir --outDir ../output/cinematic-acceptance/current-time-contract/hub
npm --prefix frontend run build -- --emptyOutDir --outDir ../output/cinematic-acceptance/current-time-contract/hub-second
docker run --rm --network none --user 1001:1001 -v /home/rocco/Astronomy-Hub/.worktrees/cinematic-hub-integration-1:/work:ro -v /home/rocco/Astronomy-Hub/frontend/node_modules:/work/frontend/node_modules:ro -v /home/rocco/Astronomy-Hub/.worktrees/cinematic-hub-integration-1/output/cinematic-acceptance/current-time-contract:/proof -w /work/frontend node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 node --input-type=module -e 'globalThis.__dirname="/work/frontend";const{build}=await import("/work/frontend/node_modules/vite/dist/node/index.js");await build({root:"/work/frontend",configFile:"/work/frontend/vite.config.mjs",configLoader:"native",build:{outDir:"/proof/hub-docker",emptyOutDir:true}})'
python3 output/cinematic-acceptance/current-time-contract/verify-delivery.py
python3 output/cinematic-acceptance/verify-preservation.py
git diff --check
```

[Browser red](evidence/browser-red.json) · [final8-case green](evidence/browser-final.json) · [unit red](evidence/unit-red.log.json) · [unit green](evidence/unit-green.log.json) · [full323tests](evidence/frontend-tests.log.json) · [delivery](evidence/delivery.json) · [preservation](evidence/preservation.json) · [exact source/context and bundle hashes](manifest.json).

[Desktop actual current-time Earth selection](screenshots/1440-live-current-earth.png) · [mobile actual current-time Earth selection](screenshots/390-live-current-earth.png) · [original actual error](screenshots/1440-default-current-red.png).

The initial browser-reproduction attempt failed at connection setup because the old relay was absent; it produced no scene proof. A pending-response rejection in that attempt was a harness failure, corrected by observing the promise rejection during teardown. The independently rerun red above establishes the application defect; the initial connection failure is not used as that red.

## Remaining boundaries

Previous345Solar,28navigation,7lifecycle,239native and23Docker science results belong to the prior source and remain historical; none is relabeled as a fresh full pass on this correction. Only the narrow time boundary changed; unchanged native/scientific/presentation source is verified separately. The original partial Earth/Sky probes, unknown startup timeout and software-only hardware limits remain documented in the [prior report](../cinematic-acceptance/README.md).

Live-current screenshots also show that exaggerated unselected body glyphs can overlap a selected globe at some real ephemeris geometries (Venus/Earth in this run). This loading repair does not change accepted source geometry or expand into camera/material redesign. That visual discrepancy remains for owner review, alongside the previously documented concept gaps. Final independent exact-head review and local/remote/served identity are recorded in the draft PR delivery receipt. No owner visual acceptance or GitHub approval is inferred.
