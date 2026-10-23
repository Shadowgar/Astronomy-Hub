# Cinematic Solar sizing and responsiveness — draft PR88

The owner rejected the physical-default155e7df9 presentation and reported lag, then explicitly chose **cinematic system view with disclosed size enlargement**. This correction restores readable Sun/planet globes, optical effects and a focused Inner default. It retains true source positions/time and makes True physical scale an explicit option. Earlier physical-default qualification remains historical; it was not visual acceptance.

Branch `cinematic-hub-integration-1`, baseline155e7df9309dc1e7f3ffe5cf5e1fcfe99dec79e9, existing [draft PR88](https://github.com/Shadowgar/Astronomy-Hub/pull/88). **OWNER VISUAL ACCEPTANCE PENDING. No merge/deployment.** [Working preview](http://172.26.23.204:4218/solar-system), [actual desktop/mobile screenshots beside exact approved originals](gallery/index.html), [preview gallery](http://172.26.23.204:4218/evidence/solar-cinematic-balance/gallery/index.html).

## What changed

System views enlarge globe meshes independently at their immutable astronomical anchors. API mean-radius geometry is preserved. A bounded screen allocation prevents false disk overlaps, clips enlargement against viewport/HUD clearance, and attenuates distant bodies so outer planets do not dominate Inner view. System fitting uses the whole available rectangle with camera padding; it no longer discards that rectangle's width to fit everything into a small circle.

The permanent legend says **Sizes enlarged independently**. Science, scale & sources offers **Body size display → True physical scale**, which restores scale1 for every body, cloud, atmosphere and ring without changing the source, UTC, camera or selection. Selected-body approaches/close-ups use physical radii for all bodies. Relative display sizes in cinematic system views are illustrative too; Reference radius retains the actual scientific value. Sizes can become small where genuine projected centers crowd together; source positions are never moved to force a composition.

All / Inner / Outer remain camera presets. Every supported body stays in the scene, with continuous zoom and separate Recenter/orbit controls. The belt remains off. Optical effects/background are on, clearly illustrative, at Efficient quality by default (1× pixel ratio, fewer decorative points, no broad haze); Balanced/Detailed remain available. Original historical NASA Earth/clouds and original NASA Mars UV mapping are preserved. Static orientation, rings, materials and brightness remain illustrative, not a precision spin/photometry/live-weather model. Original source/barycenter/path disclosures remain.

## Responsiveness evidence and its limits

The draw loop previously unhid/read each label and read HUD/selection bounds while writing positions, forcing repeated style/layout work. It now caches dimensions on observed host/HUD resize, uses cached obstacle bounds, calculates selection intersections numerically and moves labels with compositor transforms. It creates no new per-frame GPU resources and remains idle after interactions.

[Actual measurements](evidence/performance.json):36 real orbit steps per case on SwiftShader. Each final case produced36layouts/36style recalculations (one per step), with synchronous click median about1.0–1.1ms. The separately retained initial selected-Earth measurement had171layouts/170recalculations and2.3ms synchronous median for36steps. Defaults/visual workload differ, so these are not a matched GPU/FPS benchmark. The cache removes demonstrated repeated layout work; **the cause of the owner's reported lag remains unconfirmed**.

Final cinematic Inner click-plus-double-RAF wall median46.5ms,p9561.5ms; physical All60.9ms,p9583.3ms; selected Earth62.4ms,p95115.5ms. These intervals include browser/software-rendering work and two animation frames; they are not continuous-render FPS or GPU timings. Performance remains variable. Physical-device/GPU qualification and owner retest remain open; no claim that the owner's lag is resolved.

An auxiliary retained-build route-interception comparison failed API fetching and reached its unchanged15s readiness timeout. Its [failure](evidence/performance-retained-build-failure.json) remains FAILED, and no before/after frame-rate conclusion is drawn. The actual served candidate measured successfully. A separate harness failure used exact equality for a camera target that differed by~4e-15AU; [original failure](evidence/performance-target-roundoff-failure.json) is retained and the measurement now uses the established1e-12AU tolerance. No application change or timeout increase was used to hide either failure.

## Final source qualification

| Check | Result |
|---|---|
| Cinematic default + physical mode desktop/mobile journeys | **184/184 groups**,1440×900,390×900,540×390,320×568 at historical2026-02-28T00:00Z and millisecond2026-10-23T01:05:00.123Z |
| Cinematic All/Inner/Outer, disk/HUD/viewport clearance, no false overlaps; true-scale toggle preserves camera/source/UTC | **32/32 additional groups**, same8cases |
| Original science/source geometry | Actual loaded radii match API mean radii; exact source vectors/UTC and physical camera destinations asserted; display factors all1 in physical mode/close-ups |
| Normal approaches | Earth/Mars2/2; Mercury→Sun/Jupiter2/2 plus user interruption |
| Resize and lifecycle | Custom pose/up/quaternion retained;7/7imagery fault/recovery, time/display preferences, WebGL loss/Retry, reduced motion, idle RAF and late GLB teardown/Sky return |
| Current time entry |8/8desktop/mobile entries, including uncontrolled actual current UTC |
| Frontend/TypeScript |336tests/51files; TypeScript exit0 |
| Docker science API |23passed,2existing deprecation warnings |
| Build/serve |Three identical136-file Hub trees, including pinned offline Docker; every served byte at Linux4217/private4218 matches |

[Commands and raw logs](COMMANDS.md), [delivery/source identities](evidence/delivery.json), [all changed files](FILES_CHANGED.txt), [loaded Default Mode context](context.json), [preservation](evidence/preservation.json), [image provenance](gallery/manifest.json). Browser jobs were serial and bounds/timeouts unchanged. Default short-screen disk sizes are measured, not claimed aesthetically accepted.

The first readability harness invented an8px-radius minimum for three simultaneous globes. It failed when genuine Earth/Venus projected centers were too close at540×390. That was an unsuitable aesthetic threshold: the corrected check requires multiple resolved disks (≥3px radius) and a resolved Sun (≥8px), while separate assertions forbid false overlap or moved source anchors. [Original failure](evidence/readability-harness-original-failure.json) is retained; its failed status is not relabeled. Short landscapes still show smaller disks and should be inspected in the gallery. A genuine enlarged-Saturn/header collision was separately [reproduced](evidence/cinematic-hud-red.json) and corrected by applying cached HUD clearance to enlargement; the final32groups pass.

## Preservation and review

Backend/API contracts, native runtimes, packages, public native artifacts, source pins, original references/assets, accepted Sky/Earth controller, owner settings, ephemeris kernel, rollback,117original container states/mounts and90volumes are preserved. Native Earth stays43e822e52ffe01bc7591579e329ce0fb5aed5a521ffb9cd47808173f8beb03d3; Sky staysb1dbd0f039ccf4ed4c0a669baf5bd7288b1ea07c9db98e199c04949431a644fb. Earlier qualified build trees and evidence remain intact; no historical result is relabeled as fresh.

Independent scoped review found a stale Help default disclosure; corrected to effects/background ON and belt OFF. Final immutable-head review, local/remote/served identities and delivery SHA are recorded in PR88 after commit. Keep the #88→#87…#74→#73 chain and independent #71 unchanged. No provider/dependency, deployment, merge, unrelated workload changes, N1 timeout investigation or R4. Recommended next task: owner visual/performance review of this working correction.
