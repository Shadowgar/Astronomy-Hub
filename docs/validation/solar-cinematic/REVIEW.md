# Independent exact-head review and responsive correction

**Latest PR83 refinement:** [fresh reference/actual comparisons, remaining-gap matrix and qualification](refinement/correction/README.md). Reviewed23806bca is the historical baseline below; it was technically qualified but never visually accepted. The current pass remains pending owner review.

Base: `7aaeeef4e4e9b6ad406752814270ea0970666104`. Independent Codex review is distinct
from GitHub approval, physical GPU qualification and owner visual acceptance.

1. Exact head `1aecca42723ab19d34c6b96133e8df55cc7770ff`: one P2, actual667×375 camera
   centers hit time controls; with Mars selected the detail card covered body/effects.
   Original PNG/asset/UV identities and255 browser-source hashes independently matched.
2. Exact head `f1ec7d68f470a7a9bb29b227dac45e6679d3ac7e`: first CSS correction resolved
   667×375 and568×320; independent follow-up reproduced the same P2 at390×540 because
   its min-width560 condition missed short portrait. Review explicitly remained open.
3. Expanded focused RED also demonstrated that the ordinary390×900 expanded card
   covered the cinematic-effects control. Final CSS bounds that card and provides
   separate compact layouts for widths<=559 and560–767 through800px height. Below559,
   body/effects share the top row and time/camera stack at the bottom; the selected
   card is scrollable and constrained between them. Wider compact viewports retain
   separated left time/right camera and right context regions. JS/science/native source
   is unchanged by these corrections.

Final actual touch GREEN: four groups at each of667×375,568×320,844×375,390×900,
390×540,390×480,540×390,390×667,560×640,320×568 — **40groups**. Assertions cover actual
hit targets, native camera changes without UTC change, expanded/collapsed card access,
overview and time dialog. [RED expanded](evidence/responsive-red.json),
[RED short](evidence/short-red.json), [GREEN](evidence/responsive-green.json).

Fresh final cinematic9/9 per desktop/mobile and native navigation14/14 per desktop/mobile
pass after freezing the correction, with exact source hashes. Three clean builds match
135files, artifact `9f53469f9bc36db1cda6ec8eeb8050565fef73aa924cf92263f93e5392c8d031`.
Prior science/frontend/runtime/lifecycle/identity/race evidence is reused because those
implementations did not change; it is never relabeled as newly run. [Commands](COMMANDS.md).

Final committed SHA, served receipt and independent exact-head follow-up result are
recorded in [draft PR83](https://github.com/Shadowgar/Astronomy-Hub/pull/83). Owner visual
review remains the stop gate. No merge, deployment, R3-B, R4 or Earth/Sky redesign.
