# Adaptive Explorer — R1-A/01 visual reference

**PENDING OWNER VISUAL ACCEPTANCE.** This is the owner-requested editable visual
proposal, not the application or permission to implement it. Direction is approved;
individual layouts, component geometry and visual references are not yet accepted.

## Sky controls and review corrections — BLOCKED_ENVIRONMENT

[PR #73](https://github.com/Shadowgar/Astronomy-Hub/pull/73), branch
`r1-a-adaptive-explorer-design-1`. Owner likes the current visual direction;
this update preserves the layout, shared glass, navigation and other-mode designs.
Changes follow reviewed head `53e3e7c0453c1dbd7f5852d44a020559a5370cb4`.

| Existing Sky group | Controls | Reference behavior |
| --- | --- | --- |
| Constellations | Constellations; Constellation Art | Local toggles; lines and names together |
| Observing tools | Atmosphere; Landscape; Azimuthal Grid; Equatorial Grid; Deep Sky Objects | Local toggles; equatorial grid of date |
| Advanced observing within Observing tools | Equatorial J2000 Grid | Separate local toggle |
| Display | Night Mode; Fullscreen | Night Mode toggle; Fullscreen action preview |

All nine originals plus advanced J2000 are represented; no permanent toolbar,
new shell or scientific behavior. Fullscreen acknowledges the action without
requesting browser fullscreen. No renderer is connected. Native Stellarium controls
were inspected in the existing owner's vendored `src/components/bottom-bar.vue`
and `src/store/index.js`. The canonical workspace design contract explicitly
requires preserving native functionality in separately authorized R1-B.

Prior Back selection restoration, Explore cancellation focus and unavailable-dialog
immediate-launcher fixes remain. Separate `panelTrigger` and `modalTrigger` now
preserve Weather's outer launcher after its nested unavailable dialog closes.
The browser assertion also dismisses Weather and checks exact rail-button focus.
New Sky assertions check all controls, toggle/action semantics and isolation.

**No browser run was attempted in this update:** the existing sandbox/approval
block remains. Prior launch error: `browserType.launch: Target page, context or
browser has been closed`; `sandbox_host_linux.cc:41`,
`shutdown: Operation not permitted (1)`. The previous approval rejection and
launch logs remain under ignored `output/playwright/r1a/`. No retries or bypasses.
Actual browser qualification and owner acceptance remain outstanding.

The preserved 19-group ledger and all 20 PNGs are attributed explicitly to
`60e92336f7d715fc83d174f07ac350573d0e1953` in the ledger and gallery. All seven
recorded source hashes and 20 PNG bytes were checked against that Git revision.
Only attribution metadata was added; no capture timestamp, test result, source
hash or screenshot was regenerated. They do not prove subsequent changes.

Four Node-only contract checks cover the nine controls plus J2000, mode isolation,
20 identical non-Sky shell/panel strings, five unchanged shared files, and synthetic
focus lifetime (old failure and corrected target). These are not browser proof.
Syntax, documentation/manifest/reference and whitespace checks are required as well.
The revised browser suite expects 22 groups in a permitted Chromium environment;
it buffers screenshots until all checks pass and checks matching served sources.
Update gallery/README provenance after a successful new capture; never present the
historical record as current qualification. Keep browser-dependent threads open.
Do not merge or start R1-B.

## Open the actual designs

[Visual gallery](index.html) · [Shared components and tokens](system.html) ·
[Interactive Earth layout](explorer.html?mode=earth) · [Mobile review](review.html?mode=earth).

The gallery displays four desktop and four mobile browser captures and opens
interactive layouts. Neutral canvases separate UI from scenes. Two bounded
bright/dark demonstrations show readability without astronomy imagery.
The review ribbon and all pages identify the pending owner gate.

From the isolated R1-A worktree, run:

```bash
python3 -m http.server 4200 --bind 127.0.0.1 --directory docs/design/adaptive-explorer-r1a
```

Open **http://127.0.0.1:4200/** (also http://localhost:4200/ on the owner's local
forwarding setup). The delivery session leaves this static preview running;
start the command only if it is stopped. The proof runner rejects a stale or
different preview before capturing any evidence. Ctrl+C stops a foreground instance.
No Docker, bundler, npm install, application server, account or external request.
The gallery can also be opened directly from disk in a browser.

## Scope, authority and revision

R0 PR #72 merged with the exact approved-head guard at
`17f94289a8568f33c7287983ef46a5c5cc5427d4`; reviewed head
`d047d16ec7dfd27145716dd5130b46bfaaa6b7e0`. Main's tree equaled the approved head.
Green GitHub checks and zero unresolved threads were verified. CodeRabbit skipped
substantive review and Copilot reported quota exhaustion; neither was counted as
substantive review. The R0 requirements/hierarchy/milestone boundaries were inspected
and document validators rerun before merge.

R1-A branch: `r1-a-adaptive-explorer-design-1`, based on that verified merge.
Canonical intent/design/architecture/acceptance/master-plan authority remains in
[PRODUCT_VISION](../../product/PRODUCT_VISION.md),
[workspace design](../UNIFIED_WORKSPACE_DESIGN_SPEC.md),
[architecture](../../architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md),
[acceptance](../../features/FEATURE_ACCEPTANCE.md) and
[MASTER_PLAN](../../execution/MASTER_PLAN.md). This README is SUPPORT evidence.

Revision **R1-A/01** names this design proposal series. Exact current source is
the PR commit; the [historical source hashes](evidence/browser-proof.json) qualify
only the explicitly named prior commit, never later edits.
Any accepted revision must name files/states and the owner's explicit decision in
the canonical workspace design contract. No R1-A merge is authorized by this task.
No R1-B or later implementation until that acceptance AND separate authorization.

## One coherent system

Immersive Explorer provides the structure, Minimal Explorer the restraint,
Focused Explorer the organization and Journey View the navigation philosophy.
One `render()` and shared search/panel/dialog/selection components produce all modes.
Historical ORA-6 files remain unchanged; their standalone HTML approach is reused,
not their layout lock, bundled scene assets or old visual waiver.

| Configuration | Default controls | Expanded examples | Excluded tools |
| --- | --- | --- | --- |
| Sky | Celestial search, observing location/time, constellation/observing/display tools | Constellation toggles, Vega selection | Terrestrial search, weather, aircraft, body travel panels |
| Solar System | Body search/selection, orbit context, simulation time | Selected Mars with Focus/Approach; Moon approach | Earth layers, Stellarium observing toolbar |
| Earth | Address/place/coordinate search, contextual layers, weather, aircraft, satellites, navigation/location, automatic imagery/source access | Search results, layers, selected place and mobile sheet | Sky observing and planetary science tools |
| Moon | Landmark search, lunar landmarks, scientific layers, terrain/navigation, body info and credits | Unqualified geology/elevation clearly unavailable | Earth weather, aircraft and terrestrial search |

Earth layer switches are local design-state representations, not source integrations.
No coordinates, visibility, forecasts, orbital values or moving aircraft are invented.
Familiar object/place names are finite design fixtures. Source cards truthfully say
no imagery is displayed on the neutral canvas. Mars surface approach demonstrates
unavailability; Moon/Earth approach only switches reference layouts.

Shared CSS tokens: native system sans-serif; dark neutral canvas `#35383c`;
primary text `#f4f5f7`; secondary `#bac1cb`; restrained mint action/focus `#b9dcd4`;
88% `#16191e` glass, 22px blur, 1px border; 18px panels/24px sheets; 4–32px spacing;
44px primary touch targets; 2px focus ring. Opaque zero-blur and no-motion
alternatives are explicit. No external fonts, icons, libraries or image assets.
Original inline SVG icons share a 24px grid and 1.55px stroke.

## Inspect interactions

- Search button or `/` opens the same search pattern with contextual vocabulary.
  Tab/Shift+Tab stay in the dialog; Enter activates a focused result; Escape closes
  and restores the trigger. Earth examples: Pittsburgh, 1 Allegheny Ave, 40.44,
  -80.00; Springfield presents ambiguity. `91, 0` is invalid, an unknown name has
  no result, and `offline` displays unavailability. No real geocoding occurs.
- Tool buttons open one panel. Switches demonstrate UI state only. Dismissal returns
  focus. On mobile the panel becomes a bottom sheet; lower controls are hidden
  while that sheet is open so they cannot overlap or receive invisible focus.
- Solar body selection opens a context card. Focus is an acknowledged sample action;
  Approach to Earth/Moon shows a cancellable handoff before opening that layout.
- Explore is a temporary accessible destination chooser. Browser Back restores the
  preceding layout. `−` on desktop demonstrates outward navigation; scrolling/
  pinching remains intended future scene navigation and is **not implemented here**.
- Loading/unavailable examples have a usable cancel/keep-exploring path. Motion
  reduction uses direct layout changes; there is no fake camera flight. Display
  preferences demonstrate reduced transparency and motion; OS reduced-motion is
  respected. Query alternatives: `motion=reduced&transparency=reduced`.

## Browser evidence

[Historical browser results, dimensions and source hashes](evidence/browser-proof.json)
for `60e92336f7d715fc83d174f07ac350573d0e1953` only.
20 PNGs are original local Chromium captures. Desktop 1440×900; mobile 390×844;
additional layout checks at 320×740 and 390×667. The component sheet is 1440px wide
with a full-page capture. Browser version and timestamp are in the ledger.

| Mode | Desktop | Mobile |
| --- | --- | --- |
| Sky | [Default](evidence/sky-desktop.png) | [Default](evidence/sky-mobile.png) |
| Solar System | [Default](evidence/solar-desktop.png) | [Default](evidence/solar-mobile.png) |
| Earth | [Default](evidence/earth-desktop.png) | [Default](evidence/earth-mobile.png) |
| Moon | [Default](evidence/moon-desktop.png) | [Default](evidence/moon-mobile.png) |

Additional proof: [Sky controls](evidence/sky-tools.png),
[selected planet](evidence/solar-selected.png), [Earth search](evidence/earth-search.png),
[Earth layers](evidence/earth-layers.png), [mobile selection](evidence/earth-selected-mobile.png),
[lunar science](evidence/moon-layers.png), [Explore](evidence/explore.png),
[loading](evidence/loading.png), [unavailable](evidence/unavailable.png),
[bright contrast](evidence/contrast-bright.png),
[dark/reduced alternatives](evidence/contrast-reduced.png),
[shared system](evidence/shared-system.png).

The initial focused run passed 15 groups and exposed native dialog Tab focus
leaving the dialog before wrapping. Reproduction logged INPUT → buttons → BODY.
Explicit forward/reverse wrapping corrected it; the historical `60e92336` source passed 19 groups,
including both Tab directions and Escape focus restoration. CodeQL then identified
query-to-HTML mode flow; inherited object keys reproduced a preview failure. Fixed
literal mode selection now rejects invalid/prototype names and markup on initial
load and history restoration, without passing query text into generated HTML. No script errors or
external/provider requests. The named mode-tool arrays match exactly, and default
controls pass center-point occlusion checks. Search failure/validation, nested
panel dismissal, handoff cancel/return, unavailable approach, responsive sheet bounds,
reduced preferences and gallery assets are checked.

Run Node-only contract checks without Chromium (export the fixed reviewed baseline
first; no dependency installation):

```bash
python3 - <<'PYBASE'
import json, subprocess
from pathlib import Path
base = '53e3e7c0453c1dbd7f5852d44a020559a5370cb4'
root = 'docs/design/adaptive-explorer-r1a/'
names = ['reference.js', 'reference.css', 'gallery.css', 'explorer.html', 'review.html', 'system.html']
output = Path('/tmp/r1a-static-baseline.json')
output.write_text(json.dumps({n: subprocess.check_output(['git', 'show', base + ':' + root + n], text=True) for n in names}))
PYBASE
node docs/design/adaptive-explorer-r1a/verify-static.mjs /tmp/r1a-static-baseline.json
```

Reproduce using **already installed** Playwright; no dependency installation:

```bash
PLAYWRIGHT_MODULE=/home/rocco/Astronomy-Hub/node_modules/playwright/index.mjs node docs/design/adaptive-explorer-r1a/verify.mjs
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/validate_reconciliation_docs.py
git diff --check
```

Override `PLAYWRIGHT_MODULE` for another existing installation and
`DESIGN_PREVIEW_URL` for a different local port. The browser runner regenerates PNGs
and the ledger; review changed bytes before committing a new reference revision.
A served-source preflight compares all seven visual source files with an immutable
local byte snapshot. Every HTML/CSS/JS response actually loaded by the browser is
also checked (browser HTTP cache disabled), and local files are rechecked before
the success ledger is written. The ledger records both served and local hashes.
A temporary stale-checkout fixture passed the old runner's 17 groups; the corrected
runner rejects its altered reference.js before screenshot/ledger writes. The
negative fixture uses only a temporary loopback server, not application runtime.

This is design-only browser proof, **not** real renderer, physical device, screen-reader
or whole-application qualification. No renderer build or Docker campaign was run.
Visual inspection is supporting evidence; only the owner can accept the design.

## Changed-file inventory and preservation

Reference sources: `index.html`, `explorer.html`, `review.html`, `system.html`,
`reference.css`, `gallery.css`, `reference.js`; this README; `verify.mjs` and `verify-static.mjs`;
`evidence/browser-proof.json` and the 20 linked PNGs, all inside this directory.

Necessary supporting authority updates:
`AGENTS.md`; `docs/context/{CORE_CONTEXT,LIVE_SESSION_BRIEF}.md` and
`CONTEXT_MANIFEST.yaml`; `docs/{DOCUMENT_INDEX,DOC_INVENTORY,README,MASTER_PLAN}.md`;
`docs/execution/{PROJECT_STATE,MASTER_PLAN,C5_7_EARTH_CORE_RECOVERY_SPEC,C6_GLOBAL_MAPPING_SPEC,EARTH_CAPABILITY_PLAN}.md`;
`docs/features/FEATURE_TRACKER.md`; `docs/validation/SYSTEM_VALIDATION_SPEC.md`;
`docs/design/UNIFIED_WORKSPACE_DESIGN_SPEC.md`.
These record the new explicit R1-A authorization, route the reference and retain
R0 history. The current product requirements and architecture are unchanged.

Loaded Default Mode context: `review` (42 documents at merged R0) and `docs_change`
(55), including CORE/LIVE first and the five owner-named primary authorities.
Only task-relevant existing design reference source was additionally inspected.
No full documentation scan. This README is now routed in the five applicable packs;
no context-reduction proposal was silently activated.

Application frontend/backend, SWE/Cesium/source pins, data, dependencies, artifacts,
rollback identities, owner `.vscode/settings.json`, Docker and production remain
unchanged. PR #71 stays open/unmerged, PR #67 closed/unmerged. Mandatory spending $0.

## Owner decisions still open

Approve or revise the four layouts and component proportions; search prominence;
glass opacity/blur, text size, icon discoverability; mobile sheet density; Explore
placement; navigation/handoff choreography and reduced-motion equivalents.
Data/source/body/renderer and physical-performance qualification remain separate
future package gates. All screens remain **PENDING OWNER VISUAL ACCEPTANCE**.

**STOP for owner review and iterations. Do not implement the app from this proposal.**
