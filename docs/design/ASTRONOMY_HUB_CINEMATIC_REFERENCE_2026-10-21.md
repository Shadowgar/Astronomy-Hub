# Astronomy Hub — owner-approved cinematic visual direction

**Decision date:** 2026-10-21. **Status:** OWNER APPROVED visual direction for Sky, Earth and Solar System, subject to implementation fidelity and scientific/technical qualification. **Authority:** Owner's explicit in-conversation approval ("I love your design" and "lets go with this design. make it so in the documentation and lets proceed"). This decision supersedes visually incompatible *presentation* choices in existing implementations; it does not erase R1/N1 accepted behavior or scientific evidence.

This is a supporting visual-decision record under the existing [Unified Workspace Design Contract](UNIFIED_WORKSPACE_DESIGN_SPEC.md), [Product Vision](../product/PRODUCT_VISION.md) and [Master Plan](../execution/MASTER_PLAN.md). It creates no independent authority hierarchy. Existing owner-approved Adaptive Explorer/R1-A references and ORA-6 concepts remain important design sources; do **not** replace them with arbitrary new sketches.

## Approved reference images and provenance

The owner reviewed four original generated cinematic concept illustrations: a main premium Solar System concept; a companion Solar System concept grounded in Adaptive Explorer restraint; and matching Earth and Sky concepts. They were generated in the owner's ChatGPT design session on 2026-10-21 and supplied in the owner-reviewed answer. **These exact four original PNG byte sequences** are the comparison assets. Their initial source is the downloadable owner-visible `astronomy_hub_approved_visuals.zip` asset pack, with a SHA-256 manifest. Import the original PNGs into a versioned, source-controlled reference directory as a separate asset step **before** production visual implementation. Do not reconstruct them from prompts or substitute a different generated image.

| Logical reference filename | SHA-256 | Design role |
| --- | --- | --- |
| `solar-primary-cinematic.png` | `045227411f54f4e27823b465d233f35b8e0a05797aa271eeee6db97ad824c1ab` | **Primary flagship Solar System visual reference**; spectacular scene depth, minimal HUD and contextual Mars detail |
| `solar-adaptive-explorer.png` | `c9a5bfdf05b64d4895e77ddc1dfaa431212f973796474548979fd3105695d4e7` | Secondary Solar layout reference: disciplined UI/selection/time controls and aligned Adaptive Explorer components |
| `earth-cinematic.png` | `83601f768035502c1b7fbc9265866135ba40c838b0c6b598127d506112f812b1` | Earth cinematic globe, always-accessible location search, selected place, contextual detail |
| `sky-cinematic.png` | `e932e4a7cf59cf92d810e4dffbcbb5873d0fee8b51997d3f3ae162c84c7a7c91` | Sky cinematic observing scene, low-clutter constellation/target context, observing controls |

**Asset status at documentation checkpoint:** hash-identified and delivered separately as an owner-visible ZIP, **not yet committed in this GitHub branch**. A future implementation PR must add the exact images to the repository, validate the four hashes, and link them from its screenshot gallery. Never claim they are repo-hosted until they are actually committed and served.

### Existing repository design sources to preserve and compare

- [R1-A design gallery](adaptive-explorer-r1a/index.html) — original owner-influenced context-specific Sky, Solar, Earth and Moon desktop/mobile layouts.
- [R1-A interactive Solar reference](adaptive-explorer-r1a/explorer.html?mode=solar) and its [readme/evidence](adaptive-explorer-r1a/README.md).
- [R1-A shared components](adaptive-explorer-r1a/system.html).
- [Historical ORA-6 editable multi-screen design](UNIFIED_WORKSPACE_VISUAL_REFERENCE.html), with [contract](UNIFIED_WORKSPACE_DESIGN_SPEC.md).
- [R3-A proof/evidence](../validation/r3-a-solar-system/README.md) — scientifically grounded Sun/Earth/Mars initial vertical slice, **not** approved visual fidelity.

## Scope of design acceptance

**Approved design direction:** One polished Astronomy Hub visual language, full-bleed scientifically driven scenes, believable spatial depth, restrained translucent dark-glass contextual chrome, concise professional typography, subtle purposeful blue/celestial accents, directly selectable objects, obvious but compact navigation and time controls, mobile-specific layout and progressive disclosure. Primary content must be the universe, not huge fixed panels, large instruction footers or generic dashboard cards. Maintain consistent identity across Solar System, Earth, Sky and future Planet View.

**NOT yet approved or scientifically established:** literal orbital geometry or simultaneous locations depicted in the Solar illustration; starfield density, positions, nebula and Jupiter/Moon configuration in the Sky illustration; exact Earth imagery, city lights, clouds, marker placement, weather, population or local time in the Earth illustration; distances/dates/physical properties in generated cards; art assets' licenses for live imagery; exact pixel sizes or final implementation; physical-device performance. Verify and display actual source-backed object information or label illustrative/non-live content; never silently fabricate data. Some illustrated planets/camera scales are intentionally exaggerated.

### Solar System target (first implementation priority)

- The high-fidelity Solar concept is the **visual direction**, not an astrophysical screenshot. The existing JPL/Skyfield ICRF vectors, controlled epoch, identity and return paths remain authoritative for geometry/time.
- A luminous visually compelling Sun, recognizable 3D Earth/Mars and appropriate space background, camera depth and controlled orbit lines; scientific distance separate from exaggerated presentation. Additional planets shown in concept remain future R3-B data/renderer qualification, not a promise of R3-A content.
- Selected bodies have compact contextual detail and spatial camera approach; no oversized always-open right sidebar or bottom instruction bar.
- Mode-appropriate, low-profile identity/navigation, body selection and simulation-time HUD. Natural gesture input, keyboard/touch and reduced-motion alternatives.
- Maintain R4 compatibility; **do not** simulate an implemented Mars surface before R4 qualification.

### Earth target (subsequent visual adaptation)

- Globe remains the primary spatial experience; direct accessible search is never buried behind Explore.
- Selected location marker/context, minimal map controls, honest data/source attribution and best legally available imagery.
- Do not mistake generated photorealistic clouds/night lights for existing provider availability or authorize Google APIs, spending or imagery redistribution.
- Preserve R2-A/B/UX search, Cesium camera/imagery/cache and existing source/provider restrictions.

### Sky target (subsequent visual adaptation)

- Native sky objects and real catalogs, low-chrome starfield and contextual selection. Correct observer/time/FOV, retained accepted Pennsylvania illustrative woodland panorama, and existing native selection/focus/satellites.
- Sky **Atmosphere OFF by default** as previously directed; preserve user toggle to turn it on, and do not turn off a verified intentional user preference without a separately approved settings policy.
- The concept's Hawaii-looking horizon/coordinates or bright Jupiter/nebula arrangement are **not** permission to overwrite the accepted Pennsylvania landscape or substitute invented sky geometry.
- Astronomy Hub is the product; preserve legally required upstream attribution and source access in About & Licenses, without original standalone application navigation.

## Mandatory visual-fidelity workflow

1. **Recover exact assets** via the owner ZIP; check all SHA-256 values; import to Git, with readable manifest, no third-party/game copied assets.
2. **Audit pre-existing sketches:** document accepted interaction/structure from R1-A/ORA-6, present concept imagery, and current real UI. Explain conflicts and explicitly prioritize the newest approved cinematic direction for presentation, preserving real scientific/UX behavior.
3. **Produce matched desktop/mobile scene captures** at declared viewports and states: Solar overview and selected/approach; Earth default/search/selected; Sky default/selected; representative loading/degraded and keyboard/reduced-motion states.
4. **Side-by-side scorecard** for scene occupancy, visual depth, lighting, surface/stellar depiction, typography, material consistency, panel footprint, search discovery, input accessibility, object selection and temporal controls. Record exact acceptable deviations driven by scientific geometry, provider/asset rights, performance or responsiveness.
5. **Implement in bounded sequence, starting with Solar R3-A presentation**, not by rewriting engines or ephemeris. Verify realistic asset provenance, WebGL performance and accessible fallback, and preserve owner-accepted Sky/Earth mechanics.
6. **Human visual acceptance** of actual running browser screenshots is required to close each visual package. Passing unit tests cannot replace the owner's visual decision.

## Current execution and safety boundary

- R1/N1 remains OWNER ACCEPTED. R2-A PR78, R2-B PR79, Earth UX PR80 and R3-A PR81 remain drafts/open; no automatic merge or production deployment.
- R3-A's scientific vertical slice is retained while its **current appearance is OWNER REJECTED**; existing technical qualification stands within its measured scope (historical broad-backend sweep remains incomplete).
- Initial next execution is one bounded Solar cinematic visual implementation on a separate draft branch stacked on PR81 (or the documentation branch if it is incorporated without changing source contracts). A separate review/approval is needed before broad R3-B expansion or R4.
- Do not add Google, paid providers, new astronomy data, satellites/flight tracking, speculative game assets or unqualified scientific effects. Protect native source pins, settings, data, containers, volumes and rollback artifacts.
