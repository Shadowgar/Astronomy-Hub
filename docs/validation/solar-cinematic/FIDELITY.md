# Reference versus actual — cinematic Solar

**Latest PR83 refinement:** [fresh reference/actual comparisons, remaining-gap matrix and qualification](refinement/correction/README.md). Reviewed23806bca is the historical baseline below; it was technically qualified but never visually accepted. The current pass remains pending owner review.

Primary authority: [exact primary PNG](../../design/cinematic-references-2026-10-21/solar-primary-cinematic.png).
Secondary layout input: [exact Adaptive Explorer PNG](../../design/cinematic-references-2026-10-21/solar-adaptive-explorer.png).
Both are conceptual images, not astronomical source data. Every “before” screenshot
below is a fresh capture of unchanged PR81 at port4210; every “after” is actual WebGL
at port4211, epoch2026-02-28, with actual source vectors. Camera poses changed by design;
these are matched feature states, not identical camera/pixel comparisons. No screenshot
was edited or composited; hashes and browser assertions are in the evidence package.

| Criterion | Approved reference | Before PR81 | Working candidate and remaining difference |
| --- | --- | --- | --- |
| Scene quality | Luminous Sun, detailed globes | Flat color glyphs | Granulation/corona shader, original NASA Earth/Mars imagery; Sun effects illustrative, no measured solar activity |
| Composition | Scene dominates; tiny HUD/card | Tall sidebar, instructional footer | Full viewport,56px body rail, compact contextual card/time capsule; physical center positions constrain arrangement |
| Depth | Oblique paths, varied scale | Distant overhead presentation | Low oblique fit, globe shading/rims, spatial stars, close approaches; enlarged glyphs explicitly disclosed |
| Panels | Compact glass body context | Permanent information area | No empty panel; collapsible detail card, modal time/source/help; portrait card moves below globe |
| Typography/colors | Light headings, warm light, restrained blue | Dense engineering text | Light hierarchy, pale text, charcoal glass, amber Sun; system font rather than unlicensed concept typeface |
| Interaction | Concept depicts controls only | Real science/navigation | Native camera/direct selection, orbit/effect toggles, source time/returns/history retained and browser asserted |
| Mobile | No exact mobile concept supplied | Desktop controls compressed | Vertical body fit, compact touch controls, compact bottom card/time, reduced-motion focus immediate |
| Science | Extra illustrative bodies/positions/asteroids | Qualified three-body slice | Exactly Sun10/Earth399/Mars4; source trajectories retained, no invented moons/asteroids/rotations/surfaces |

## Matched browser states

All rows compare to the same exact primary image above. Before details/time were
permanently exposed; the previous source screenshot includes those controls. A separate
collapsed-before state did not exist and is not invented.

| State | Desktop before | Desktop after | Mobile before | Mobile after |
| --- | --- | --- | --- | --- |
| Overview | [Before](screenshots/before-1440-overview.png) | [After](screenshots/delivered-after-1440-overview.png) | [Before](screenshots/before-390-overview.png) | [After](screenshots/delivered-after-390-overview.png) |
| Selected Mars / collapsed | [Before](screenshots/before-1440-mars.png) | [After](screenshots/delivered-after-1440-mars.png) | [Before](screenshots/before-390-mars.png) | [After](screenshots/delivered-after-390-mars.png) |
| Mars expanded | [Before](screenshots/before-1440-mars.png) | [After](screenshots/delivered-after-1440-mars-details.png) | [Before](screenshots/before-390-mars.png) | [After](screenshots/delivered-after-390-mars-details.png) |
| Selected Earth / collapsed | [Before](screenshots/before-1440-earth.png) | [After](screenshots/delivered-after-1440-earth.png) | [Before](screenshots/before-390-earth.png) | [After](screenshots/delivered-after-390-earth.png) |
| Earth expanded | [Before](screenshots/before-1440-earth.png) | [After](screenshots/delivered-after-1440-earth-details.png) | [Before](screenshots/before-390-earth.png) | [After](screenshots/delivered-after-390-earth-details.png) |
| Close Mars | [Before](screenshots/before-1440-close.png) | [After](screenshots/delivered-after-1440-mars-close.png) | [Before](screenshots/before-390-close.png) | [After](screenshots/delivered-after-390-mars-close.png) |
| Close Earth | [Before](screenshots/before-1440-earth.png) | [After](screenshots/delivered-after-1440-earth-close.png) | [Before](screenshots/before-390-earth.png) | [After](screenshots/delivered-after-390-earth-close.png) |
| Time controls | [Before](screenshots/before-1440-sources.png) | [After](screenshots/delivered-after-1440-time.png) | [Before](screenshots/before-390-sources.png) | [After](screenshots/delivered-after-390-time.png) |
| Sources / scale disclosure | [Before](screenshots/before-1440-sources.png) | [After](screenshots/delivered-after-1440-sources.png) | [Before](screenshots/before-390-sources.png) | [After](screenshots/delivered-after-390-sources.png) |

Mobile after screenshots use `prefers-reduced-motion: reduce`; browser diagnostics
assert synchronous focus, while desktop exercises0.9s motion. The NASA Mars mesh
preserves its atlas UVs; Earth uses the original2048×1024 Blue Marble PNG. Fixed
orientations and historical imagery are not current surface weather or time-varying
longitude. Background stars carry no catalog identities, distance or magnitudes.

The concept includes more planets, asteroid debris, night-side lights and dramatic
cloud/flare detail. Those remain omitted because this package has neither qualified
body data nor appropriate visual assets/models for them. Subdued paths remain actual
open source trajectories; no decorative replacement curves. There is no pixel-perfect
or owner-acceptance claim. See [performance and qualification limits](README.md).

## Responsive review correction

The final responsive layouts keep time, camera, body selection and visual toggles
separate in compact landscape, short portrait and expanded details. The contextual
card scrolls when height is constrained. All40 actual touch groups pass; camera actions
leave UTC unchanged. These views have less exposed scene area than the desktop concept.

[667×375 selected](screenshots/responsive-667x375-selected.png),
[568×320 selected](screenshots/responsive-568x320-selected.png),
[390×540 selected](screenshots/responsive-390x540-selected.png),
[390×480 overview](screenshots/responsive-390x480-overview.png),
[540×390 selected](screenshots/responsive-540x390-selected.png),
[390×667 selected](screenshots/responsive-390x667-selected.png),
[320×568 selected](screenshots/responsive-320x568-selected.png).

The before/after matrix now links fresh screenshots from the frozen delivered build;
older candidate images and their proof remain preserved separately. Screenshot names
include width and height in the multi-height responsive suite to avoid collisions.
[Final cinematic proof](evidence/delivered-cinematic.json),
[final responsive proof](evidence/responsive-green.json).
