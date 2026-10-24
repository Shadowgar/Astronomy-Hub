# Hierarchical planetary systems

Owner-authorized continuation of PR92 `c510759ba78c011679c2479a2fa9f48bf260afce`.
Current PS1 branch: `ps1-earth-moon-system-1`. Final source qualification is recorded below;
no owner acceptance, merge or deployment is claimed. The separate future lunar
terrain/detail work remains on the canonical roadmap.

Default Mode documents and bounded historical sections are enumerated in
[loaded-documents.txt](loaded-documents.txt), using the docs/frontend/backend/
planning/validation/review manifest packs. [PLAN](PLAN.md) is execution detail under
MASTER_PLAN, not a second roadmap. [SCIENCE](SCIENCE.md) contains source contracts,
independent comparisons, interpolation scope and data limitations.

## Implemented PS1 candidate

Solar's parent selector replaces the detached Moon control. Earth enters a separate,
parent-centered system scene; the source Moon trajectory and actual UTC progression
use DE442s with Earth399, Moon301 and ICRF km vectors. Cinematic globe enlargement is
continuously disclosed and a physical mean-radius option is available. Scene materials
and texture orientation remain illustrative; globe radii do not assert terrain.

Moon selection offers the unchanged R4-A lunar globe, returning to the parent system
and original Solar camera with the advanced epoch. The architecture supports six
satellite-bearing parents, source-derived moon metadata and explicit unavailable
states. Only Earth–Moon positional geometry is admitted in PS1. Catalog names alone
are not evidence of working orbital geometry.

| Parent | PS1 positional availability | Detailed destination |
| --- | --- | --- |
| Earth399 | Moon301, local DE442s bounded coverage | Existing R4 Moon globe |
| Mars499 | Unavailable; PS2 qualification pending | None |
| Jupiter599 | Unavailable; PS2 qualification pending | None |
| Saturn699 | Unavailable; PS2 qualification pending | None |
| Uranus799 | Unavailable; PS2 qualification pending | None |
| Neptune899 | Unavailable; PS2 qualification pending | None |

Metadata is ingested from the official JPL physical-parameter table, with 41 rows
across these parents. Unknown reference radii and unqualified orbital positions
remain unavailable. No fabricated paths or surface imagery fill those gaps.

## Qualification ledger

- Authoritative isolated Docker: combined planetary-systems, R4 Planet View and
  Solar science tests: **47 passed**, seven inherited warnings. This is not a
  warning-clean gate. The focused new science suite separately passed 14 tests
  with warnings treated as errors on the host.
- Final frontend: **365 tests passed in57 files**; TypeScript passed.
- Real Chromium inspection rendered Earth–Moon at1440×900,390×900 and667×390,
  with actual textures and no page errors. Those initial screenshots precede
  the short-landscape label correction and are not final qualification images.
- Playback qualification found a real unit error: simulated seconds were added
  to a millisecond clock, slowing motion by1000. Six focused clock tests now pass
  after correction. Actual browser requalification passed at all three viewport sizes.
- Independent precommit review found keyboard flyout access, WebGL Retry,
  legacy bookmark return and global Earth/Sky destination defects. Focused
  red/green browser evidence records all seven affected cases passing.
- The first physical-size assertion observed the previous rendered frame after
  changing the preference. The harness now waits for actual radii; no application
  correction was made to hide that test timing error.

Current task evidence is under `output/planetary-systems/`; final source identities,
commands, selected screenshots and receipts will be retained in this directory.
Historical results remain labeled by their source; none imply owner visual acceptance.

## Preview and limits

Task-only preview: `http://172.26.23.204:4223/solar-system?date=2026-10-23T01:05:00Z`.
Direct Earth system: `http://172.26.23.204:4223/planetary-system/earth?date=2026-10-23T01:05:00Z`.
Windows reachability returned HTTP200. Preview uses only new
`oras-ps1-preview` and `oras-ps1-backend` containers with readonly source/data mounts;
original R4, Earth, Sky artifacts and services are preserved.

Browser evidence uses Chromium with software rendering and emulated viewports/touch.
It is not a physical mobile or owner-GPU benchmark. GPU time is not measured by CPU
submission timings. Default Vite chunk-size warnings remain visible. Future/unknown
leap seconds are not predicted. Interpolation checks are measured off-grid samples,
not a rigorous continuous error bound or independent physical accuracy guarantee.

PS2 source research has identified a small finite official Horizons pack for qualified
major-moon subsets. It is not integrated in this package. PS3 will qualify cross-system
integration; those packages must not be marked complete based on the reusable shell.

## Final source journey evidence

Desktop8/8, portrait7/7 and short-landscape7/7 groups pass on the same recorded
source: actual source positions/motion, native Moon handoff, exact parent and Solar
camera restoration, pause, scale, keyboard/touch, reload and Back/Forward.
The independent review's7 regression checks and9 resilience checks are retained
with their own source identities. Earlier failures remain available, including
seconds/ms conversion, API fractional padding, touch flyout interception, pending
bookmark writes during departure, and document-reload state loss.

The final lifecycle guard cancels bookmark writes when document navigation begins.
A controlled delayed-document probe distinguishes that race from the separate
Chromium Private Network Access restriction on intercepted LAN document responses.
Neither intercepted outage nor delayed-document fixtures are live provider outages.

| Viewport | Overview | Selected Moon | Existing native Moon |
| --- | --- | --- | --- |
| Desktop1440×900 | [Earth–Moon](screenshots/1440x900-earth-moon-overview.png) | [Selected](screenshots/1440x900-selected-moon.png) | [Globe](screenshots/1440x900-native-moon.png) |
| Portrait390×900 | [Earth–Moon](screenshots/390x900-earth-moon-overview.png) | [Selected](screenshots/390x900-selected-moon.png) | [Globe](screenshots/390x900-native-moon.png) |
| Landscape667×390 | [Earth–Moon](screenshots/667x390-earth-moon-overview.png) | [Selected](screenshots/667x390-selected-moon.png) | [Globe](screenshots/667x390-native-moon.png) |

[Exact commands and limitations](COMMANDS.md). The artifact verifier confirms142
identical Hub files in three builds and served bytes,4 preserved native Moon files,
514 Earth files and111 pinned Sky files. Native data/source/settings/volumes are
unchanged. The primary checkout's existing `.vscode/settings.json` edit is untouched.

Owner functional/visual acceptance and physical hardware qualification remain open.
PS1 does not admit Mars/outer-system geometry, new detailed moon surfaces or terrain.
