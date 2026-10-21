# Astronomy Hub Product Vision

## Owner-approved cinematic presentation — 2026-10-21

The owner explicitly selected one **premium, immersive, scene-first cinematic Astronomy Hub design family** spanning Solar System, Earth and Sky. The exact original concept PNGs are hash-identified in the [Cinematic Design Reference](../design/ASTRONOMY_HUB_CINEMATIC_REFERENCE_2026-10-21.md). This supersedes visually incompatible generic dashboard treatments while retaining prior R1-A/ORA-6 Adaptive Explorer UX sketches as the structural/interaction foundation.

**Order:** implement bounded Solar visual-fidelity correction against the primary cinematic reference while preserving the R3-A scientific engine; subsequently harmonize Earth, Sky and eventual Planet View. R3-A's code/science is technically qualified within existing evidence, but its current visual implementation was **OWNER REJECTED**. The accepted original N1 Sky/Earth behavior remains intact. Rendered concept art is illustrative and must never be mistaken for live source-backed scene objects, licensed Earth imagery or valid orbital geometry. Further R3-B body expansion and R4 remain gated; no paid provider, merge or deployment authorization follows from style approval.

## Current scope reconciliation — 2026-10-21

Current execution: [PROJECT_STATE](../execution/PROJECT_STATE.md); canonical R0–R5 and deferred X packages: [MASTER_PLAN](../execution/MASTER_PLAN.md).

R3-A alone is owner-authorized after roadmap reconciliation. R1/N1 is OWNER ACCEPTED; R2 PR78/79/80 are delivered drafts with retained provider/device limits. No merge or production deployment. Earlier dated activation/next-step directions are historical where superseded by the current execution record. R4 evaluates Earth, Mars and Moon; Mars is a candidate, not a selected first body.

## Approved Adaptive Explorer intent — 2026-10-13

**Astronomy Hub — Adaptive Explorer** is the owner-approved product direction.
This existing file is canonical product intent under DOCUMENT_INDEX, not an
additional execution hierarchy or implementation authorization. R0–R5 checkpoint
proposals live only in [the existing master plan](../execution/MASTER_PLAN.md#adaptive-explorer-proposed-checkpoints-r0-r5);
LIVE/PROJECT_STATE alone establish the active bounded package.

The rendered universe is the primary experience. One professionally styled
interface uses one component/design system with restrained iOS-like translucent
glass. Sky, Solar System, Earth and other planetary surfaces are contextual
configurations, not four unrelated applications or four permanent control bars.

| Configuration | Relevant experience and controls | Context boundary |
| --- | --- | --- |
| Sky | Minimal observing controls, native Stellarium object search/selection, observer/time and useful sky-view toggles | Earth map/provider/place tools and planetary travel controls stay out of observing chrome |
| Solar System | Journey, orbit/time context, celestial-body discovery and selection | Earth addresses and terrestrial layers stay out; distinguish astronomical time from live feeds |
| Earth | Address/place/coordinate search, maps, automatic imagery, Earth-specific data tools and source status | Sky observing toggles and other-body science controls stay out |
| Other planetary surfaces | Immersive body-specific scientific exploration, body context, entry/exit and available layers | Use qualified body/radii/frame/datum/data; never relabel Earth imagery or invent a solid gas-giant surface |

One small universal **Explore** mechanism may offer an accessible alternative to
gestures. It must remain discoverable to keyboard/touch/assistive technology while
avoiding permanent cross-mode clutter. Exact placement and trigger design are open.

The intended journey supports scrolling/zooming outward from Sky toward Earth
and Solar System context, selecting a body, approaching it and entering its
qualified detailed view, then returning. Visual continuity may be accomplished
with controlled renderer handoffs rather than a single physically continuous
camera. The current bridge does not prove these journeys exist. SWE remains
contained; the Hub retains its Earth Viewer and qualified pinned God's Eye reuse.

### Minimum user-visible acceptance requirements

All requirements need real-browser proof and the scoped owner gate. Technical
modules, backend responses, fixtures and historical REAL rows cannot alone close
these requirements. [FEATURE_TRACKER](../features/FEATURE_TRACKER.md) owns current
status; these are requirements, not implementation claims.

| ID | Minimum accepted behavior | Required observable proof |
| --- | --- | --- |
| AE-01 Sky observing | Native Stellarium sky/search/selection, observer/time, relevant view controls and meaningful source-backed object details work in minimal Sky chrome | Known qualified objects resolve with catalog/source_id/model and real coordinates; visible selection AND camera behavior; no Earth-only controls |
| AE-02 Sky ↔ Earth | Outward journey and accessible Explore alternative reach Earth and return without losing applicable observer, time, selection and history | Both directions via gesture and keyboard/touch alternative; cancel/back/repeat; real adapter acknowledgements, zero stale selection or orphan renderer; live-feed time remains explicitly separate |
| AE-03 Solar navigation | Discover/select bodies, see correct orbit/time context, approach a selected body and return to overview | At least two source-backed bodies, actual selected-body/camera agreement and history; qualified ephemeris/frames, no decorative orbit presented as science |
| AE-04 Detailed planetary entry/exit | Enter one explicitly qualified non-Earth body and exit to the correct body/context | Real body/radii/datum/source attribution and supported detail; unavailable detail is explicit and leaves navigation usable; no Earth texture substitution |
| AE-05 Earth search | Address, place and coordinate input navigate Earth to the selected result with unambiguous location context | One address, one named place and valid latitude/longitude; ambiguous results, invalid/out-of-range coordinates, no results and provider failure; actual camera destination plus keyboard selection; existing astronomy search alone does not qualify |
| AE-06 Genuine imagery detail | Where eligible source coverage supplies high resolution, recognizable scene detail actually appears; elsewhere show honest coarse/partial/unavailable status | Matched close views and source/date/resolution/coverage evidence; recognizable landmarks, not a GSD label alone; owner assesses visible quality |
| AE-07 Automatic imagery | Select the best qualified eligible source for the current view without requiring manual provider choice | Coverage edges, rapid camera changes, remote failure/recovery and actual displayed source/credits; one safety base, at most one managed remote, preserved event overlay order |
| AE-08 Persistent eligible cache | Reuse eligible original response bytes across reload/browser restart where supported, with truthful status and confirmed owned-cache clear | Cold/reload/restart network evidence; permission/headers, quota/eviction/corruption/denial; only owned imagery removed; explain browser HTTP cache clearing limitation |
| AE-09 Contextual tools/details | Only applicable mode tools appear; selected object/body has meaningful contextual information and a usable next/return action | Mode matrix with forbidden controls absent, clear selection/dismiss distinctions, accurate source/time/coverage and preserved canonical identity |
| AE-10 Input/accessibility | Desktop/mobile, pointer/touch, keyboard and assistive navigation can complete core journeys with readable credits and controls | Declared browser/viewport/device matrix; visible focus, focus restoration, semantic names/status, no keyboard trap, touch targets, responsive short screens, reduced-motion alternative; software emulation does not qualify physical devices |
| AE-11 Shared visual system | Coherent tokens, shared contextual components, professional typography, restrained glass and progressive disclosure keep the scene primary | Compare actual UI against owner-approved reference revision at matched sizes/states; readability over bright/dark imagery, no duplicate cross-mode chrome; tests cannot override rejected visual quality |

### Approval boundary and open design decisions

The owner approved direction and style, **not final pixel-level screens**. Exact
screen layouts, tokens/type scale/glass opacity, mode affordances, Explore placement,
gesture thresholds, transition choreography, reduced-motion equivalents, responsive
compositions and first detailed body/reference scenes await owner review. Existing
ORA-6 HTML/Figma work is historical reusable material; its waiver is not approval
for a new coder-generated reference. Record the accepted reference URL/file,
revision, covered states and owner decision before future UI implementation.

Solar-scale renderer, coordinate/ephemeris interfaces, handoff continuity/tolerances,
qualified body/source scope and measurable performance budgets also remain open.
No package can pass with unspecified criteria it depends on; agree those criteria
before implementing that package. No invented universal high-resolution coverage,
planetary availability or hardware speed claim. Mandatory new provider spend is $0.
PR #71 stays unmerged with imagery/search/visual acceptance unfinished; historical
scientific, licensing, renderer, data-preservation and source-reuse constraints remain.

## Historical pre-R0 product vision — superseded intent and implementation assumptions

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

## Historical — Current foundation

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
handoffs are planned, not implemented. The [Phase B study](../studies/GODS_EYE_SWE_COMPATIBILITY_STUDY.md)
selects external pinned sources, independent full-app builds, same-origin frames,
a versioned capability bridge and active-only renderer lifetime. Exact APIs,
final animation, solar-system-scale renderer and provider qualification remain open.

## Roadmap relationship

The detailed architecture defines A architecture docs → B compatibility study →
C unified skeleton → D ISS slice → E Mars proof → F astronomy extensions.
Phase B is the active study; its next recommended task is the bounded Phase C
skeleton, not horizon implementation. `oras_horizon.v1` remains approved and important
for later Observe, Tonight, Sky, Earth/ORAS site context and panorama alignment,
with measured/calibrated inputs. Scope activation belongs to execution authority.
