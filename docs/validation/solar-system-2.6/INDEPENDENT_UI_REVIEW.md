# Independent Beyond Workspace and observation review

Reviewer: the Solar 2.6 performance/scene agent. This review is independent of
the Workspace and observation implementation authors. It does **not** independently
approve this reviewer's MissionScene fix or BeyondScene implementation; those
require a different reviewer. Root/frontend context and the approved Solar 2.6
plan apply. The scoped review covers product lifecycle and observational pointer
interpretation, not new source acquisition or whole-PR approval.

Status: the first two reproduced P2 findings are corrected and verified by the same
independent harness against the rebuilt actual Windows Edge / RTX3060 preview.
The integrating agent ran the unchanged checks; this reviewer inspected the
corrected source, returned receipt and actual captures. A subsequent journey
revealed a timestamp-admission finding, also corrected and verified below.
The additional final presentation corrections below also pass source and actual
release-run browser review. No open P0/P1/P2 finding remains in this bounded
review scope; owner visual acceptance remains separate.

## P2 — IMAP pointer selects a different UTC bin from the plotted position

- File: `frontend/src/features/beyond/ObservationViews.tsx:125`,
  `MagneticObservation.selectPointer`.
- Cause: the original pointer calculation normalized clientX against the whole
  SVG bounding rectangle. Its760×375viewBox is rendered with preserved aspect
  ratio inside a1255.2×310CSS rectangle on the actual desktop preview. The
  resulting horizontal letterboxing invalidates that normalization.
- Impact: pointing at a plotted measurement inspects a different time and value.
  On actual Windows Edge / RTX3060, the plot's first UTC bin at SVG x55 mapped to
  index354,05:54UTC and17.83nT, instead of00:00UTC.
- Evidence: `scripts/validation/review_solar26_workspace.mjs` transforms SVG x55
  to its actual client position through the browser's screen matrix, moves the
  real pointer there, and reads the product's observation-minute control. The
  original receipt reports **FAIL**, index354. Raw evidence:
  `output/playwright/solar-system-2.6/workspace-review-before/workspace-review.json`
  and `imap-pointer-start.png`.
- Correction: transform the pointer from client coordinates through
  `svg.getScreenCTM().inverse()` before converting plot x to time. The author
  implemented this correction. The rebuilt actual-browser receipt now selects
  index0,00:00UTC at the same plot coordinate: **PASS**.

## P2 — Pending graphics initialization revives controls after context loss

- File: `frontend/src/features/beyond/BeyondWorkspace.tsx:43`, continuation after
  `await scene.initialize(...)`.
- Cause: the continuation originally checked only the React lifetime's abort
  signal. Context loss disposes the scene and clears engine identity without
  necessarily aborting that outer lifetime. The aborted shader preparation can
  resolve, after which the stale continuation called `setReady(true)`.
- Impact: the disposed scene has no canvas, but its zoom and scale controls
  become enabled. The visible error does not accurately reflect control state.
- Evidence: the same actual-browser harness holds only the KHR parallel shader
  completion query at false, then invokes real `WEBGL_lose_context` during
  pending initialization. After cleanup the original receipt records zero
  canvases, `presetDisabled:false`, `zoomDisabled:false`: **FAIL**. This is
  lifecycle fault injection, not an unmodified performance measurement.
  Screenshot: `pending-prepare-context-loss.png` in the same evidence directory.
- Correction: after the awaited initialization, require the original scene to
  remain the active engine, not disposed, and actually ready, in addition to the
  outer signal check. The rebuilt receipt now records zero canvases,
  `presetDisabled:true`, `zoomDisabled:true`: **PASS**.

## Correction verification

[Preserved before/after receipts and source SHA256](evidence/workspace-independent-review.json)
bind the two exact reviewed source files and the rebuilt served entry script.
The before receipt is explicitly **FAIL**, after **PASS**, with no uncaught page
errors and the actual NVIDIA renderer string. The scoped review does not replace
the root's full navigation journey and device/owner acceptance evidence.

The final reviewer-run harness adds actual recovery after the pending-compile
context loss: restores the browser's original completion query, clicks Retry,
and verifies one new ready renderer/canvas, enabled controls, no alert and zero
retired owned resources / animation loops. All3checks pass. The retained final
receipt identifies old/new instances and exact served script bytes.
[Recovered actual browser](review-gallery/final-pending-prepare-recovered.png).

| Finding | Before | After |
| --- | --- | --- |
| IMAP pointer at the00:00plot edge |[wrong05:54selection](review-gallery/before-imap-pointer-start.png) |[correct00:00selection](review-gallery/after-imap-pointer-start.png) |
| Context loss while preparation is pending |[enabled retired controls](review-gallery/before-pending-prepare-context-loss.png) |[disabled retired controls](review-gallery/after-pending-prepare-context-loss.png) |

Exact command pattern, run from the recovery worktree with `before` / `after`
output directories as appropriate:

```sh
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/review_solar26_workspace.mjs")" "$(wslpath -w "$PWD/output/playwright/solar-system-2.6/workspace-review-after")" http://localhost:4231
```

## P2 — crossing-to-mission link contains an unsupported UTC spelling

- Files: `frontend/src/features/beyond/BeyondWorkspace.tsx:55` (mission link),
  `frontend/src/features/missions/missionContracts.ts:54` (URL construction),
  `frontend/src/features/runtime/productState.ts:7` (strict product UTC parser).
- Cause: admitted crossing geometry uses the backend's six-digit zero-padded UTC
  spelling, e.g. `2012-08-25T12:00:00.000000Z`. `Date.parse` accepts it in the Beyond
  view, but the existing product URL parser accepts only one to three fractional
  digits. The raw source string was forwarded unchanged to the mission route.
- Impact: selecting a real Voyager crossing mission opens an empty mission
  workspace with “Choose a valid mission and UTC epoch.” No qualified source
  snapshot or spacecraft renders.
- Evidence: actual journey B in
  `output/playwright/solar-system-2.6/journeys/journeys.json` preserves the error
  body and supplied context epochs. Both Voyager source timestamps end
  `.000000Z`; the mission UI reports UTC admission failure, not renderer failure.
  Journey C still passed and is not invalidated by this distinct entry-path bug.
- Correction: canonicalize equivalent zero-padded UTC losslessly before
  product URL/state construction. Do not round nonzero microseconds or weaken
  the existing source/time contract. `beyondContracts.ts:17` now removes only the
  six-digit source spelling's three trailing zero digits and passes the result
  through the existing strict parser; nonzero sub-millisecond precision is
  rejected. The admitted context is copied rather than altering the source pack.
- Verification: actual corrected journeys A and B pass their Voyager mission
  entries and return-state checks. The independent receipt preserves those
  passing rows from the `journeys-final` aggregate failure (its separate D
  observer-string roundoff assertion is not presented as passed). This evidence
  is scoped to the timestamp correction; final whole-journey status remains the
  integrating agent's separate result.

## Final presentation corrections independently verified

The integrating agent identified two additional presentation defects in the
otherwise qualified journey gallery. This reviewer did not author either fix.

- **P2: crossing explanation covered by fixed tabs.** At
  `BeyondWorkspace.tsx:64`, the full Voyager interpretation occupied the fixed
  introductory area and extended beneath the tabs. The preserved
  `qualified-journeys/A-voyager1-crossing.png` visibly truncates the final line.
  The correction uses a short summary there and preserves the complete API
  interpretation in the context panel's native `details` / “What was measured”
  control at line67. Source vectors, scientific text and navigation are intact.
- **P2: selected-tab hover loses text contrast.** The generic hover selector in
  `beyond.css:1` overrides the selected button's light background while its dark
  text remains. The same original screenshot shows the dark selected Voyager1
  button. The explicit selected-and-hovered rule at `beyond.css:7` preserves a
  light background with the existing dark foreground.

The release journey harness now verifies the actual introductory rectangle ends
above the tabs, selected-tab hover has normal-text contrast at least4.5:1, and
keyboard activation reveals the complete API interpretation within the context
panel before closing it again. The actual release run passes all four journeys
A/B/C/D. Both Voyager views report introductory bottom206.2px against tabs
top220px, leaving13.8px clear. Actual selected-hover foreground `rgb(3,19,28)`
and background `rgb(197,234,242)` yield14.75:1 contrast. Both full API
interpretations are keyboard accessible and fully contained in the scroll panel.

This reviewer inspected the original rejection capture and actual corrected
closed/open captures. No further presentation change is requested within this
scope. [Before](review-gallery/presentation-before-A-voyager1-crossing.png),
[corrected Voyager1](review-gallery/presentation-after-A-voyager1-crossing.png),
[full explanation](review-gallery/presentation-after-A-voyager1-measured-explanation.png),
[corrected Voyager2](review-gallery/presentation-after-B-voyager2-crossing.png),
[full explanation](review-gallery/presentation-after-B-voyager2-measured-explanation.png).

The `presentationCorrection` field in the
[independent review receipt](evidence/workspace-independent-review.json) binds
the final release journey bytes, screenshots and reviewed source hashes. Final
Workspace SHA256 is
`7c5881347bb09778d5c95bcb9e056acd61deb089c074b10195e308c482f6a3ab`;
CSS SHA256 is
`0b86d8e8f009742abc4a54041eb802510cf0c6e5590fe08f39b30e3c82247e54`.
Both match the source hashes captured by the final actual journey run. Earlier
qualified and failing receipts remain preserved under their original paths.

## Other reviewed behavior and limits

IBEX paths retain native cells, the longitude seam and unmeasured-cell masking;
IMAP segmentation retains missing samples and omitted UTC intervals as gaps. The
within-minute band is labeled as variability, not instrument uncertainty. Source
and event quality disclosures distinguish measured dates from predicted geometry.
These code observations supplement the source specialist's separate review.

Actual initial desktop screenshots exposed crowded central labels in the outer
and Oort views. The scene author corrected label admission; root independently
reviews that correction and the conceptual shell presentation. This document
does not claim independent approval of those authored scene changes.

No merge, deployment, new branch/PR or protected-resource change was performed.
Physical iPhone, owner visual acceptance and corresponding-source publication
remain outside this browser review. Final SHA/check results belong to the
integrating agent's PR107 handoff.
