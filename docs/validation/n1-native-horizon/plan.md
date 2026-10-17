# N1 native horizon implementation plan

Goal: configure the existing zero horizon's native fill/border for embedded Sky.
Owner spec: October 15 native-horizon directive; Default Mode, single agent.

Architecture: pinned SWE plus one downstream C patch; native properties preserve
original defaults, same circle geometry, ownership and occlusion. Adapter changes
only embedded presentation colors and restores native zero defaults on release.
Existing toolchain/dependencies; no upstream revision or scientific/data changes.
Accepted scrolling at 301f9eb3 remains unchanged. No merge/deploy/R2/N2/R3; $0.

- [x] Capture original served native pixels and fail the new configuration regression.
- [x] Add patch exposing `horizon_color` / `horizon_border_color` on landscape,
      initialized to original native values, with shape-only change callbacks.
- [x] Configure fill [0.035,0.04,0.05,1], border [0.10,0.12,0.14,1] only in
      embedded neutral presentation; restore captured zero colors on release.
- [x] Apply patch to an isolated copy of the existing qualified pinned source;
      rebuild native JS/WASM in pinned offline Docker; rebuild Vue shell using
      existing dependencies. Promote only with explicit patch/hash attestation.
- [x] Verify rendered fill/border pixels, real Landscape/Atmosphere/Night toggles,
      day/night, ORAS/another observer, desktop/mobile and native standalone.
- [x] Rerun frontend/typecheck, runtime/Earth, native/browser, approved navigation,
      artifact/admission, exact served identity and document checks.
- [x] Record source/artifact/build/rollback identities, scoped authorization,
      technical qualification versus pending owner visual acceptance; review,
      commit/push to existing PR75; stop for owner review.

Review focus: no scope leakage to standalone zero; embedded→standalone releases
colors; toggles do not destroy styles/occlusion; native callbacks never touch HiPS
panoramas or allocate new shapes; generator accepts only attested native changes.
