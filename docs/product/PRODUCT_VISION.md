# Astronomy Hub Product Vision

This is product guidance, not execution authority. The detailed approved
architecture is [Unified Universe Architecture](../architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md).
Core context, live session brief and project state govern active work; validation
specification governs completion proof.

## Product principle

Astronomy Hub is a unified, continuously navigable astronomy, Earth, and planetary
exploration workspace. Users experience one product across specialized renderers.
Astronomy intelligence and observing decisions remain essential capabilities.

The renderer is the design center. The flagship should be sky-centered, with a
full-viewport renderer, contextual floating controls and progressive disclosure.
Chrome should auto-hide during exploration, return from relevant edges, allow
explicit pinning and immersive mode, and show only relevant controls. Supporting
facts and planning belong in context, rather than an expanding chain of dashboards.
Future UX must start with approved visual concepts/mockups before implementation.

## Current foundation

PR #52's Home, Observe, Tonight and Sky host share an ORAS public shell. SWE at
`/oras-sky-engine/` remains the contained sky renderer. Existing observing/science
contracts and satellite backend identity/freshness/local propagation are retained.
The shell is a foundation, not the final workspace. The current ORAS plus
Stellarium headers are an integration state, not the desired final interface.
No new visual implementation or qualification is claimed here.

## Approved future experience

The Hub owns visible application chrome and universal product context. SWE owns
sky rendering. Complete applicable God's Eye View owns Earth exploration, with
its non-astronomy capabilities preserved subject to provider/data/asset terms.
Hub astronomy Earth layers extend it additively. Body-aware Cesium is the approved
planetary-surface direction using qualified body data; Mars is the first proof.

Explicit exploration can take a selected Mars from Sky to a Mars globe and back
to Mars centered from ORAS. Longer-term scale navigation can move from local sky
to Earth, Earth–Moon, solar-system and planetary surface contexts. Controlled
renderer handoffs are allowed. Visual/contextual continuity is the goal; perfect
camera transforms and a single all-scale renderer are not promised.

Home and Sky may converge conceptually around that workspace. Home remains a
route today. Observe and Tonight remain focused direct, mobile/shareable and
independent fallback pages, while their capabilities also become contextual
workspace modes/drawers. Existing pages are not deleted or rewritten here.

## Architectural constraints and open choices

Small Hub-owned universal state covers mode, time, observer, selected entity/body,
camera intent, applicable layers and history. Renderer internals remain isolated.
Upstream SWE and God's Eye remain pinned, upgradeable and immutable by default;
Hub functionality belongs in adapters/extensions. Provider/data/asset licenses
remain independent of source-code licensing. Scientific values and identities
must be source-backed, with missing data explicit.

God's Eye/Earth, planetary surfaces, universal state, external layer registry and
handoffs are planned, not implemented. Consumption mechanism, bridge/extension
API, final handoff animation, solar-system-scale renderer and provider qualification
outcomes remain open. No generic dashboard or runtime design is invented by this
checkpoint.

## Roadmap relationship

The detailed architecture defines A architecture docs → B compatibility study →
C unified skeleton → D ISS slice → E Mars proof → F astronomy extensions.
The next task after this PR is **God's Eye + SWE compatibility/upgradeability
study**, not horizon implementation. `oras_horizon.v1` remains approved and important
for later Observe, Tonight, Sky, Earth/ORAS site context and panorama alignment,
with measured/calibrated inputs. Scope activation belongs to execution authority.
