# Independent Windows browser qualification

The asset/source reviewer authored these browser regressions and did not author
the mission workspace, renderer, clock or application corrections. Tests use the
actual loopback owner preview, Docker-backed API, pinned `solar-missions-v3`
release and headed Windows Edge on **NVIDIA GeForce RTX 3060 Laptop GPU, D3D11**.
There are no substituted mission responses or scene implementations in this
qualification. The deliberately held GLB request is identified as fault injection.

**Current state:** all four complete flagship journeys, four lifecycle regressions
and four final quality/recovery checks pass in the bounded receipts below. The
final Voyager 1 rerun verifies its narrow stop-notice correction, including rapid
forward/reverse playback.
No owner acceptance or whole-PR approval is implied.

## Reproducible commands

Run from the recovery worktree, with exclusive use of the hardware GPU:

```sh
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/verify_solar25_lifecycle_edges.mjs")" http://localhost:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.5/lifecycle-edges-fixed")"
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/verify_solar25_journeys.mjs")" http://localhost:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.5/journeys-qualified")" all data/runtime-packs/solar-missions/release-v3
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/verify_solar25_journeys.mjs")" http://localhost:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.5/journeys-voyager1-fixed")" voyager1 data/runtime-packs/solar-missions/release-v3
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/verify_solar25_quality_recovery.mjs")" http://localhost:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.5/quality-recovery-qualified")"
```

`verify_solar25_journeys.mjs` binds the actual served JavaScript by SHA-256 before
and after the run, checks that the API release matches the hashed local source
manifest, and records every mission-file and source-segment hash. Worktree source
hashes are supplementary: the author can prepare a later correction while the
served preview remains frozen. Such changes are explicitly recorded in the
receipt; they do not silently replace the tested runtime artifact.

## Corrected lifecycle defects

The independent red receipt
`output/playwright/solar-system-2.5/lifecycle-edges-before3/lifecycle-edges.json`
and its screenshots preserve two actual failures:

- Losing the WebGL context while the real model request was pending left zero
  canvases and a disposed scene, but its late readiness promise re-enabled Play
  and Inspect. The author now gates readiness on the active scene and aborts
  restoration requests when graphics fail.
- Full Voyager 1 trajectory → Solar → browser Back retained the trajectory
  camera but replaced **11 segments / 2,841 points** with **1 segment / 128 local
  points**. The author now persists the full/range intent and reloads admitted
  source paths before restoring the camera and declaring readiness.

Canonicalizing the initial default epoch also prevents the first Trajectory
action from being aborted by its own URL persistence. The corrected receipt
`lifecycle-edges-fixed/lifecycle-edges.json` records **four passing checks**:
pending-model context loss, first direct Trajectory, full-path Back and selected
range Back. The selected-range test compares both the exact requested interval
and all returned source points. Five fixed screenshots accompany the receipt.
The separate implementation review is in `REVIEW_APPLICATION.md`.

## Completed journeys and visual evidence

`journeys-qualified/journeys.json` records complete **PASS** results for Voyager 2,
Cassini and New Horizons, plus trajectory-only Dawn, NEAR and Rosetta. The JSON's
top-level result remains **FAIL** because the same run exposed Voyager 1's
stop-notice defect; individual passing rows are not presented as an all-pass run.
The separate `journeys-voyager1-fixed/journeys.json` is **PASS** after correction.
Together the four passing rows provide **42 camera-view captures**, **42 retired
renderer checks**, four videos and zero uncaught browser errors. All source-pack,
mission-file and segment hashes match between the two runs. The only changed
implementation file is the workspace's narrow notice handling; renderer,
contracts, models and scientific source data are unchanged.

The tested main JavaScript artifacts are:

```text
Three completed journeys: index-JEjxJjQx.js
  6afae4a89fd5f7c39257deebaffe9f1def45c8d3407dcc159446d9ee794fc782
Corrected Voyager 1: index-DX_ZwtFF.js
  03eba1e4831b021019df6486a0028c6b3644f89e19030d2e0728e1e47ec2cb78
```

The compact artifact index is `evidence/browser-journeys.json`. Videos:

| Mission | Video under `output/playwright/solar-system-2.5/` |
|---|---|
| Voyager 1 | `journeys-voyager1-fixed/video/ffcd90a2ec43007f74ad1594e55b2dd3.webm` |
| Voyager 2 | `journeys-qualified/video/9b2b93a00fe822beaa0cc76cf097447f.webm` |
| Cassini | `journeys-qualified/video/be9bdd05c065922c926013e7122cb34a.webm` |
| New Horizons | `journeys-qualified/video/c7ef00836830d12e93df630e6889f8e1.webm` |

Each completed flagship journey verifies:

- Solar entry, qualified events and historical targets; Voyager 2 includes all
  four giant planets, Cassini includes Titan/E-21/end-of-mission, and New Horizons
  includes Jupiter, Pluto, Charon and Arrokoth.
- Complete source-model inspection, real source playback, stable follow offset,
  and actual screenshots at **1440×900**, **390×844** and **844×390**.
- Full and user-selected trajectory intervals, with source points confined to
  the requested range.
- Unsupported 1800 UTC removes the historical scene; a supported event recovers.
- Two repeated mission-switch cycles retire previous scenes, leave one canvas,
  cancel their animation loops and clear their owned resources.
- Solar return preserves the actual saved departure camera, observer
  `35.2472, -116.7933, 1000 m` and the displayed historical UTC.

The saved departure camera is authoritative. Opening Solar's discovery menu can
reframe an overview, so comparing against a camera captured before that menu
opens is an invalid test assumption. Earlier partial receipts preserve this
harness correction rather than attributing it to the application. Another
corrected harness assertion now ignores intentionally hidden compact zoom
buttons and accepts the source legend's capitalization.

The three passing flagship rows have **zero uncaught browser errors**. Their
only HTTP errors are the deliberately requested unsupported-date **422**
responses; aborted requests correspond to renderer/navigation cancellation.
Each flagship has a recorded browser video. This video-enabled run is not a
performance benchmark.

Visual inspection confirmed preserved spacecraft appendages, visible target
geometry and readable controls. Specific evidence includes:

- `journeys-qualified/newhorizons-jupiter-source-uncertainty.png`: source-provided
  200 km / 3.3 mm/s and 10,000 km / 6.7 mm/s estimates are distinguished from
  interpolation residuals and per-epoch covariance.
- `journeys-qualified/newhorizons-newhorizons-arrokoth.png`: the target is visibly
  labeled a reference sphere from a size bound; its bilobed shape and imagery
  are not claimed qualified.
- `journeys-qualified/*-inspection-{desktop,portrait,landscape}.png`: original
  NASA geometry is retained, including long appendages. Cassini's attached
  Huygens configuration is explicitly illustrative. Voyager 1's final images
  are in `journeys-voyager1-fixed/`.

## Stop feedback, source coverage and limits

At 16 days per second, Voyager 1 safely stopped at its admitted Jupiter encounter
endpoint, **1979-03-18 23:59:09 UTC**. However, URL persistence immediately cleared
the intended boundary explanation. The author has prepared a narrow notice
preservation correction. The final real-GPU Voyager 1 rerun **passed**: fast
playback stopped at the checked sample-window endpoint
**1979-03-06T12:05:26Z**, retained the visible boundary explanation, and reverse
playback reached **1979-03-04T23:24:32.240Z** inside the qualified segment. The
different stop point reflects which checked samples arrived before the high-rate
clock reached its boundary; neither run extrapolated. No renderer/source change
was required. `REVIEW_APPLICATION.md` records separate review of this correction.

The sharp black boundary visible on Pluto is inherited source-map no-data, not
spacecraft shadowing: that capture reports `selfShadow: false`, the shared planet
mesh does not receive the spacecraft shadows, and the existing
`frontend/public/solar-assets/v2.4/pluto-2048.jpg` visibly contains the matching
angular southern coverage edge. Its runtime identity is the same PDS source and
`cartographic-sphere-km` geometry. The text-only disclosure is now independently
verified beside the selected body, with a final screenshot at
`quality-recovery-qualified/pluto-source-coverage-disclosure.png`. This review
does not claim new Pluto imagery or fill its unobserved region. The warning is
placed in the visible target context; duplication inside the source dialog is
not required. An earlier smoke assertion incorrectly required that duplication;
the corrected test and preserved earlier receipt make this harness correction
explicit.

## Final quality and recovery smoke

`quality-recovery-qualified/quality-recovery.json` is **PASS**, with four checks,
zero page errors and zero console errors on the final served
`index-CwsSK4Ok.js` artifact, SHA-256
`3c06c0b56ad1f40f5366a888f8f24b26199521edd2d98ff194995a61e9aabe3f`.
This short check uses the same real Windows Edge/NVIDIA GPU with a **1280×800
CSS viewport and emulated DPR 2** so the three actual GPU drawing-buffer sizes
can be distinguished. It is not a physical high-DPI device qualification.

| Setting | Actual GPU drawing buffer | HDR bloom |
|---|---:|---|
| Efficient | 1280×800 | Off |
| Balanced | 1920×1200 | On |
| Detailed | 2560×1600 | On |

All setting changes retain one renderer and one tone-mapping stage. Returning
from Detailed to Balanced leaves the same **11 geometries / 21 textures** as the
first Balanced state. Actual context loss disposes the scene and disables its
controls; the visible **Retry mission** action then creates one new renderer,
reloads the physical model and preserves Voyager 1's
**1979-03-05T12:05:26.000Z** epoch and Balanced quality. A subsequent full page
reload also restores that mission UTC and renders successfully. Pluto's visible
source-coverage disclosure is the fourth passing check.

Seven PNGs accompany this receipt: three quality views, lost/recovered context,
the Pluto disclosure and its source dialog. The GPU and all owned browser
processes were released after the run. No application or renderer edits were
made by this reviewer.

Portrait and landscape screenshots are Windows browser viewport qualification,
not physical iPhone testing. No iPhone access path was authorized. Historical
attitude, epoch-dependent hardware configuration, Arrokoth surface/shape and owner
visual acceptance remain explicitly unqualified. These journeys do not certify
unrelated native Sky/Earth paths or the entire consolidated PR. No merge,
deployment, source publication, production data change or branch operation was
performed by this reviewer.
