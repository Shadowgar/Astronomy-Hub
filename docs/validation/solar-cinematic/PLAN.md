# Approved cinematic Solar implementation plan

Goal: translate the exact owner-approved primary Solar reference into the existing
interactive Sun/Earth/Mars scene, with source geometry and native returns preserved.
Architecture: isolated Three.js scene consumes the unchanged FastAPI/Skyfield
contract. Presentation uses exaggerated body glyph radii, lawful texture imagery,
Sun-directed shading, illustrative corona/starfield and small contextual React HUD.
No texture orientation, star catalog, extra body or surface navigation is implied.
Stack: existing React/TypeScript/Three/Vite/Vitest/Playwright; no dependencies added.

1. DONE: verify archive/PNG bytes, import original four references, reconcile PR82
   and run manifest/architecture/reconciliation/links. Base `7aaeeef4`.
2. Capture prechange desktop/mobile overview/Earth/Mars/close/details/time from
   unchanged PR81 Docker preview. Snapshot owner settings/source/data/container/volume
   identities. Reuse existing installed packages without installation.
3. Qualify small NASA Earth/Mars maps (source, rights, byte hashes, dimensions).
   Preserve original source bytes; no generated planetary texture or concept backdrop.
4. Write focused failing tests for presentation framing and immutable source
   geometry, finite bounded star generation, orbit toggle, compact disclosure,
   direct ray selection, reduced-motion/texture error/disposal. Run RED first.
5. Implement in `frontend/src/features/solar/{SolarScene.ts,SolarWorkspace.tsx,solar.css}`
   with small contained presentation/material helpers. Full-viewport scene; minimal
   header/body rail/time capsule and selected-object card. Separate help/sources.
   Preserve route/history/entry ACK, UTC, identity and renderer disposal semantics.
6. Run focused unit/type tests; build two clean independent artifacts; start only
   task-owned Docker preview (read-only original data/native artifacts). Run actual
   desktop/mobile journeys, compare source vectors/native returns, capture matched
   screenshots and measured GPU/software-renderer limitations. No N1 retry loop.
7. Run affected frontend/runtime/ephemeris and independent pinned Docker build;
   compare exact bytes, imported image hashes, data/settings/volumes/source pins.
   Record unsuccessful cases and differences from concept truthfully.
8. Update evidence and execution records; commit/push a new draft stacked on PR82.
   Independent exact-head review, reproduce/fix only genuine scoped findings,
   requalify corrections. Stop for owner visual acceptance; no merge/deployment.

Validation commands use the existing R3 scripts as source, adapting only changed
visible selectors; old evidence stays unchanged. Runtime proof uses existing
Docker images and mounted kernel, not a full repository stalled backend sweep.
