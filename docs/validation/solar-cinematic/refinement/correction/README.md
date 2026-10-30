# Corrected refinement — final owner-review candidate

**FOCUSED FUNCTIONAL QUALIFICATION PASSED. VISUAL ACCEPTANCE PENDING. PR83 REMAINS DRAFT.**

The independent review of `a92c741f5a4abbc853387683455aa04c2780ec0e` found one P2: the collapsed card covered the selected globe at540×390. [Exact initial review](INITIAL_REVIEW.md). The corrected candidate remains on `r3-a-cinematic-solar-1`, continuing reviewed baseline23806bca and the unchanged PR83→82→81→80→79→78→74→73 chain. No merge, deployment or R3-B/R4.

[Working preview](http://127.0.0.1:4211/solar-system?date=2026-02-28T00:00:00Z) · [Updated comparison](http://127.0.0.1:4211/evidence/solar-refinement/comparison.html) · [Versioned comparison](comparison.html) · [Exact cumulative files](../FILES_CHANGED.txt) · [Commands](COMMANDS.md).

## Reproduced finding and bounded correction

1. Original a92 Earth focus returned SECTION at the selected globe center. [RED](evidence/focus-red.json).
2. Optical framing and fit distance now put the unchanged selected source anchor and visible glyph in the strip above the short-landscape card. A subsequent Sun case reproduced a nearby Earth label covering that globe; nonselected screen labels overlapping the selection marker are now hidden. The persistent body controls retain every body's selection access. [Label RED](evidence/label-overlap-red.json).
3. A desktop-to-compact resize reproduced the stale fit distance. Resize now reapplies selected camera framing when entering, resizing or leaving this compact region. [Resize RED](evidence/resize-red.json).
4. [GREEN](evidence/compact-focus.json):43 browser cases at540×390,480×375,559×560,390×480,390×900,1440×900,667×375. Sun/Earth/Mars focus and approach keep source target/time exact and selected centers on the canvas; compact markers clear header/card. Includes desktop-to-compact resize. No touch target or card CSS changed for this correction.

| Compact Earth | Actual screenshot |
| --- | --- |
| Reviewed a92, selected center behind card | [Before](screenshots/before-540x390-earth.png) |
| Corrected focus | [After](screenshots/540x390-Earth-focus.png) |
| Corrected approach | [After](screenshots/540x390-Earth-approach.png) |

## Current source qualification

All rows below are fresh on the corrected source unless explicitly identified as reused. Tests do not establish owner visual acceptance.

| Check | Result | Proof |
| --- | --- | --- |
| New compact focus/approach/resize regression |43/43|[Browser](evidence/compact-focus.json)|
| Desktop/mobile refined Sun/Earth/Mars, originals loaded, quality, time, WebGL loss/retry, cloud failure, idle|6/6 each|[Refinement](evidence/refinement.json)|
| Desktop/mobile cinematic camera, direct selection, keyboard and panels|9/9 each|[Cinematic](evidence/cinematic.json)|
| Compact touch targets, expanded/collapsed controls, ten sizes|40/40|[Compact](evidence/compact.json)|
| Desktop/mobile real native Earth/Sky returns, Cesium search destinations, observer/UTC/history, one renderer|14/14 each|[Navigation](evidence/navigation.json)|
| Reduced motion, orientation, missing assets, WebGL recovery and delayed-load disposal|7/7|[Lifecycle](evidence/lifecycle.json)|
| Native identity, history race, entry race|3+1+1|[Identity](evidence/identity.json), [history](evidence/history-race.json), [entry](evidence/entry-race.json)|
| Frontend|311/311 across46files|[Log](evidence/frontend-tests-corrected.log)|
| TypeScript|PASS|[Log](evidence/typecheck-corrected.log)|
| Two host builds plus pinned offline Docker build|136files identical|[Receipt](evidence/candidate-delivery.json)|
| Exact served bytes|136Hub +514Earth files match|[Receipt](evidence/candidate-delivery.json)|
| Docker science|Reused15passed/2existing skips; backend unchanged since a92 run|[Earlier source-matched log](../evidence/docker-science.log)|

The initial refinement's310tests, screenshots and performance remain historical at a92, retained in the [initial report](../README.md). Failed red cases are retained. The43 focused cases and all browser rows above were rerun after the correction, with existing bounds; no timeout increase, unrelated workload interruption or old N1 retry. Historical N1 desktop5/22 and mobile7/22 at240s, and prior incomplete broad R3 backend runs remain unchanged and are not claimed as new passes.

## Current matched screenshots and remaining visual gaps

Exact original primary/Adaptive PNGs remain unchanged. These actual WebGL captures use the same UTC2026-02-28T00:00:00Z, viewport and selected-body state as the before images; framing intentionally differs. [Desktop overview](screenshots/after-1440-overview.png), [Earth](screenshots/after-1440-earth-close.png), [Sun](screenshots/after-1440-sun-close.png), [Mars](screenshots/after-1440-mars-close.png); [mobile overview](screenshots/after-390-overview.png), [Earth](screenshots/after-390-earth.png), [Sun](screenshots/after-390-sun.png), [Mars](screenshots/after-390-mars.png).

The [specific remaining-gap matrix](../README.md#referenceactual-comparison-and-remaining-gaps) still applies: procedural Sun/corona, subdued decorative space haze, historical static clouds, no live weather/accurate body rotation/terrain/night lights, no extra bodies or reordered ephemeris. Mars retains its original NASA atlas and UV geometry. All Solar background points are illustrative; native Sky catalog stars are untouched. The short-landscape scene necessarily presents a smaller globe to preserve useful controls and a clear center. Hardware GPU and physical touch-device performance, exact concept fidelity and owner visual acceptance remain open.

## Corrected-source performance and loading

Actual Chromium renderer: ANGLE/Vulkan SwiftShader. GPU timer extension unsupported; GPUms is explicitly unavailable. CPU submission medians0.3–0.5ms are not GPU timings. AtDPR2,48 identical15° orbit steps per quality, source vectors/epoch/target/end-camera unchanged and exactly one render per step:

| Viewport | Quality | Median frame interval ms | p95 ms |
| --- | --- | --- | --- |
| 1440×900 | balanced | 151.4 | 183.8 |
| 1440×900 | efficient | 69.4 | 110.8 |
| 1440×900 | detailed | 253.6 | 285.8 |
| 1440×900 | balanced | 155.4 | 189.6 |
| 390×900 | balanced | 58.6 | 78.4 |
| 390×900 | efficient | 27.2 | 32.1 |
| 390×900 | detailed | 84.7 | 107.3 |
| 390×900 | balanced | 61.9 | 81.8 |

These frame intervals include software rendering and browser scheduling, with no60fps or hardware-performance claim. Efficient/Balanced/Detailed remain explicit display-only budgets. Three local NASA textures loaded with exact bytes. Desktop transfer durations: Earth4.9ms/clouds4.1ms/Mars753.2ms; mobile4.3/3.4/504.0ms. Downloads are not GPU upload/decode timing. The earlier a92 timings remain separately recorded, not relabeled.

## Identity, protection and review handoff

Corrected artifact: `b7c87d77143c3cdd8a6cab9ad6bd401651c9612f53827e5a71a6b0652c1ac7b2`. [Candidate receipt](evidence/candidate-delivery.json) checks source hashes and served bytes before commit; the final exact committed SHA receipt and independent follow-up review are attached to PR83 and the task evidence endpoint after commit. No claim that this precommit receipt itself names the new commit.

Original23806artifact9f53469f9bc36db1cda6ec8eeb8050565fef73aa924cf92263f93e5392c8d031 and reviewed-a92artifact7776afd6ebed951aa96eda357636fabe85c8825ffa895169eeb18fd88c3938da remain preserved in separate output directories. Protected backend/ephemeris/contracts, native Sky/Earth artifacts, source pins, original approved PNGs, NASA Earth/Mars, tracked rollback, owner settings,116 original containers and90volumes are unchanged. Root owner checkout retains only its original `.vscode/settings.json` edit. Data are not baked into a new image or reset.

The initial independent P2 is corrected and browser-qualified. Independent review of the final committed HEAD remains a separate delivery step, reported in PR83; it does not grant GitHub approval or visual acceptance. Recommended next task: owner compare the revised desktop/mobile preview with the approved reference and test quality on a physical device. Stop for owner review; no merge/deploy/R3-B/R4.
