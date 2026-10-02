# LIVE SESSION BRIEF

## Authority and current execution

Load with `CORE_CONTEXT.md`, then the task pack in `CONTEXT_MANIFEST.yaml`.
Validation authority and proven runtime behavior govern completion claims.

Active task: docs-only **Unified Universe Architecture** checkpoint on
`unified-universe-architecture-1`, from current main
`7c54596f59b2d43afda561cbad1b0d587d7407f6` after PR #52 merged.
Single agent only. Preserve unrelated `.vscode/settings.json`. Open the PR
**Define unified Astronomy Hub universe architecture**, perform one normal
single-agent review cycle, and do not merge. No feature implementation.

Detailed approved direction:
[UNIFIED_UNIVERSE_ARCHITECTURE](../architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md)
and its eight ADRs. No Stellarium Runtime or High-Definition Data override is
active for this checkpoint.

## Current implementation foundation

- Home `/`: ORAS decision homepage, Tonight summary, Observe Now/current weather,
  and interactive Sky entry.
- Observe `/observe`: observer/time sky inventory, source-backed details and links.
- Tonight `/tonight`: ORAS full-night planning through unchanged `tonight.v1`.
- Sky host `/sky-engine`: shared ORAS navigation around contained SWE.
- Standalone renderer `/oras-sky-engine/`: current ORAS Stellarium Web runtime.
- Satellite source paths: normalized TLE identity/release lifecycle,
  freshness/provenance and local propagation; legacy passes are not production-grade.

PRs #48–#52 remain valid foundations. The shell is implemented and merged;
recorded qualification is PARTIAL for the blanket console-clean gate because
standalone/embedded Sky retain dense-star tile 404s. Previous 155 frontend and
16 Docker browser checks are historical evidence in `PROJECT_STATE.md`; they
are not rerun by this documentation task. Existing contracts and routes remain.

## Approved future architecture

The product is one continuously navigable astronomy, Earth, and planetary
workspace. The renderer is the design center: full viewport, contextual floating
controls, progressive disclosure, hide/edge-return/pin/immersive chrome. Approved
visual concepts/mockups must precede future UX coding. PR #52 is the shared-shell
foundation, not that final visual product.

The Hub owns product shell/navigation and future small universal state: mode,
time, observer, selected entity/body, camera intent, applicable layers and history.
Renderers own internal scene, camera execution, selection realization and math.
SWE remains the upgradeable Sky renderer. God's Eye is the planned complete
applicable Earth runtime, including non-astronomy features subject to provider
terms; astronomy additions are external additive layers. Body-aware Cesium is
the planned planetary surface direction. Neither integration has started.

Controlled handoffs support explicit body exploration and later scale-driven
navigation, preserving identity/time/context without promising perfect camera
transforms. Observe and Tonight remain independent direct/mobile/shareable and
fallback routes; future workspace drawers add their capabilities. Home/Sky may
converge conceptually later; no route is removed here.

SWE and God's Eye upstream source is immutable by default. Use pinned/qualified
revisions, adapters and external extensions; unavoidable patches need explicit
architectural exception under the architecture document. No feature stripping,
from-scratch replacement Earth renderer, or SWE edits for UI convenience.

## Open choices

Upstream consumption mechanism (submodule/subtree/vendor/separate runtime/package
exports), isolation versus direct imports, exact state/extension API, renderer
handoff animation, solar-system-scale renderer and provider qualification remain
undecided. Approval of a direction is not implementation or qualification.

## Revised sequence and stopping boundary

A architecture docs → B God's Eye + SWE compatibility/upgradeability study →
C unified Sky/Earth skeleton → D ISS handoff → E Mars proof → F astronomy extensions.

The next task after this PR is **God's Eye + SWE compatibility/upgradeability
study**. Do not start it here. `oras_horizon.v1` remains approved and important
in Phase F, spanning Observe/Tonight/Sky/Earth site/panorama; it is no longer next
and requires measured/calibrated data. No fabricated horizon.

This task edits only documentation/control files. Validate scope, whitespace,
local links/context discoverability and Category A review blockers. Do not run
expensive app suites or claim new Docker/browser evidence. No runtime, API,
package, vendor, data, assets, submodule, Earth/Mars, horizon, satellite/flight,
WordPress, equipment, AI, telescope control or DESI implementation occurs here.
